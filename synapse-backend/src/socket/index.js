import { registerCanvasHandlers } from "./canvasHandlers.js";

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // --- Room Join ---
    // The frontend must emit "join-canvas" with a canvasId immediately
    // after connecting. Until then, the socket is in no room and receives
    // no canvas-specific events.
    socket.on("join-canvas", (canvasId) => {
      if (!canvasId || typeof canvasId !== "string") {
        socket.emit("error", { message: "Invalid canvasId" });
        return;
      }

      // Leave any previously joined canvas room before joining a new one
      // A user should only ever be in one canvas at a time
      const currentRooms = [...socket.rooms].filter((r) => r !== socket.id);
      currentRooms.forEach((room) => socket.leave(room));

      socket.join(canvasId);
      console.log(`[Socket] ${socket.id} joined canvas: ${canvasId}`);

      // Acknowledge back to the client that they are now in the room
      socket.emit("canvas-joined", { canvasId });

      // Count how many users are currently viewing this canvas
      const roomSize = io.sockets.adapter.rooms.get(canvasId)?.size ?? 0;

      // Notify everyone else in the room that a new user joined
      socket.to(canvasId).emit("user-joined", {
        socketId: socket.id,
        activeUsers: roomSize,
      });
    });

    // --- Register Feature-Specific Handlers ---
    // We pass both io and socket so handlers can broadcast to rooms
    // io = server-wide access, socket = this specific connection
    registerCanvasHandlers(io, socket);

    // --- Disconnection ---
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} | Reason: ${reason}`);

      // Notify all rooms this socket was part of
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;
          io.to(room).emit("user-left", {
            socketId: socket.id,
            activeUsers: roomSize,
          });
        }
      });
    });
  });
}