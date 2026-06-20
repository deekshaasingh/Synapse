import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import app from "./src/app.js";
import { connectMongo } from "./src/config/mongo.js";
import { createRedisClients } from "./src/config/redis.js";
import { initSocket } from "./src/socket/index.js";

const PORT = process.env.PORT || 4000;

async function bootstrap() {

  // Step 1 — Connect to MongoDB first
  // Server will not start if this fails
  await connectMongo();

  // Step 2 — Connect Redis pub/sub pair
  // Required before attaching the socket adapter
  const { pubClient, subClient } = await createRedisClients();

  // Step 3 — Create raw HTTP server from Express app
  // Socket.IO needs this to intercept WebSocket upgrade requests
  const httpServer = http.createServer(app);

  // Step 4 — Attach Socket.IO to the HTTP server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Try WebSocket first, fall back to HTTP long-polling
    transports: ["websocket", "polling"],
  });

  // Step 5 — Wire Redis adapter for multi-server broadcasting
  // All socket events now sync across every server instance via Redis
  io.adapter(createAdapter(pubClient, subClient));

  // Step 6 — Register all socket event handlers
  initSocket(io);

  // Step 7 — Start listening only after everything is ready
  httpServer.listen(PORT, () => {
    console.log(`[Synapse] Server is running on http://localhost:${PORT}`);
    console.log(`[Synapse] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Synapse] Health check: http://localhost:${PORT}/health`);
  });
}

// If anything in bootstrap() throws, log it and exit cleanly
// process.exit(1) signals to Docker/PM2 that this was a crash — not a clean shutdown
bootstrap().catch((err) => {
  console.error("[Synapse] Fatal startup error:", err.message);
  process.exit(1);
});