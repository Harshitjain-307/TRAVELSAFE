const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { TrackingEngine } = require("./server/trackingEngine");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const defaultPort = parseInt(process.env.PORT || "3000", 10);

function findAvailablePort(startPort, callback) {
  const net = require("net");
  const server = net.createServer();
  
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      findAvailablePort(startPort + 1, callback);
    } else {
      callback(err);
    }
  });

  server.once("listening", () => {
    server.close(() => {
      callback(null, startPort);
    });
  });

  server.listen(startPort);
}

findAvailablePort(defaultPort, (err, port) => {
  if (err) {
    console.error("> Failed to find an available port:", err);
    process.exit(1);
  }

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
      cors: { origin: "*", methods: ["GET", "POST"] },
      transports: ["websocket", "polling"],
    });

    const engine = new TrackingEngine(io);

    io.on("connection", (socket) => {
      socket.emit("incident:state", engine.getSnapshot());

      socket.on("join:incident", ({ incidentId, role }) => {
        if (incidentId) socket.join(incidentId);
        socket.data.role = role;
        socket.emit("incident:state", engine.getSnapshot());
      });

      socket.on("guardian:accept", async ({ guardianId, name }) => {
        const responder = await engine.acceptGuardian(guardianId || "g-rahul", name);
        socket.emit("guardian:accepted", { responder });
      });

      socket.on("police:dispatch", async ({ unitId }) => {
        const responder = await engine.dispatchPolice(unitId || "p-14");
        socket.emit("police:dispatched", { responder });
      });

      socket.on("demo:start", () => {
        engine.startDemo();
      });

      socket.on("demo:stop", () => {
        engine.reset();
      });

      socket.on("incident:reset", () => {
        engine.reset();
      });
    });

    httpServer.on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        console.error(`> Port ${port} is occupied. Retrying with port ${port + 1}...`);
        setTimeout(() => {
          httpServer.close();
          httpServer.listen(port + 1);
        }, 1000);
      } else {
        console.error("> Server error:", e);
      }
    });

    httpServer.listen(port, () => {
      console.log(`> TravelSafe X ready on http://${hostname}:${port}`);
      console.log(`> Socket.io live tracking server active`);
    });
  });
});
