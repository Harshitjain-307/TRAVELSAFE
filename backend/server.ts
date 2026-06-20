import express from "express";
import { createServer } from "http";
import cors from "cors";
import mongoose from "mongoose";
import { SocketService } from "./services/SocketService";

import authRoutes from "./routes/auth.routes";
import journeyRoutes from "./routes/journey.routes";
import guardianRoutes from "./routes/guardian.routes";
import routeRoutes from "./routes/route.routes";
import searchRoutes from "./routes/search.routes";
import cabRoutes from "./routes/cab.routes";
import emergencyRoutes from "./routes/emergency.routes";
import osrmRoutes from "./routes/osrm.routes";

const app = express();
const defaultPort = parseInt(process.env.BACKEND_PORT || "3001", 10);
const MONGODB_URI = process.env.MONGODB_URI || "";

app.use(cors());
app.use(express.json());

// API route mappings
app.use("/api/auth", authRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/guardian", guardianRoutes);
app.use("/api/route", routeRoutes);
app.use("/api/routes", osrmRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/cab", cabRoutes);
app.use("/api/emergency", emergencyRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

const httpServer = createServer(app);

// Initialize Socket.io service
SocketService.init(httpServer);

// Connect to MongoDB if URI is configured, otherwise log local sandbox fallback
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log("> Mongoose connected to MongoDB database.");
    })
    .catch((err) => {
      console.warn("> MongoDB connection failed, running on mock schema mode:", err.message);
    });
} else {
  console.log("> No MONGODB_URI specified. Running in in-memory Mock Ledger sandbox mode.");
}

function startServer(port: number) {
  httpServer.once("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`> Port ${port} is occupied. Retrying with port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("> Server error:", err);
    }
  });

  httpServer.listen(port, () => {
    console.log(`> TravelSafe X Backend V2 active on http://localhost:${port}`);
  });
}

startServer(defaultPort);
