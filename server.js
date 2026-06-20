const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { TrackingEngine } = require("./server/trackingEngine");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

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

  httpServer.listen(port, () => {
    console.log(`> TravelSafe X ready on http://${hostname}:${port}`);
    console.log(`> Socket.io live tracking server active`);
  });
});
