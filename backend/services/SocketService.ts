import { Server, Socket } from "socket.io";
import { JourneyService } from "./JourneyService";
import { GuardianService } from "./GuardianService";
import { EmergencyService } from "./EmergencyService";

export class SocketService {
  private static io: Server | null = null;

  static init(server: any): Server {
    this.io = new Server(server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
      transports: ["websocket", "polling"]
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`> Client connected on Socket: ${socket.id}`);

      socket.on("join:journey", (journeyId: string) => {
        socket.join(journeyId);
        console.log(`> Socket ${socket.id} joined journey: ${journeyId}`);
      });

      socket.on("location:update", async (data: {
        journeyId: string;
        lat: number;
        lng: number;
        routeProgress: number;
        responderId?: string;
      }) => {
        // Broadcast location coordinates to all connected subscribers in the room
        this.io?.to(data.journeyId).emit("location:updated", data);

        // Update location inside JourneyService cache
        if (!data.responderId) {
          await JourneyService.updateLocation(data.journeyId, data.lat, data.lng, data.routeProgress);
        } else {
          await GuardianService.updateGuardianLocation(data.responderId, data.lat, data.lng);
        }
      });

      socket.on("disconnect", () => {
        console.log(`> Client disconnected: ${socket.id}`);
      });
    });

    // Start background GPS tick interval every 5 seconds
    setInterval(() => {
      this.broadcastLiveCoordinates();
    }, 5000);

    return this.io;
  }

  private static broadcastLiveCoordinates() {
    if (!this.io) return;
    
    // Broadcast active journey updates
    JourneyService.activeJourneys.forEach((journey, journeyId) => {
      this.io?.to(journeyId).emit("journey:tick", {
        journeyId,
        currentLat: journey.currentLat,
        currentLng: journey.currentLng,
        routeProgress: journey.routeProgress,
        coPassengers: JourneyService.getCoPassengers(journey.currentLat, journey.currentLng, journeyId)
      });
    });
  }

  static broadcastEmergencyAlert(emergency: any) {
    this.io?.emit("emergency:alert", emergency);
  }

  static broadcastEmergencyResolution(emergencyId: string, message: string) {
    this.io?.emit("emergency:resolved", { emergencyId, message });
  }
}
