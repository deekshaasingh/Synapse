export function registerCanvasHandlers(io, socket) {

  // Helper to get which canvas room this socket is currently in
  // Filters out the socket's own private room (which has the same name as socket.id)
  function getCurrentCanvas() {
    return [...socket.rooms].find((room) => room !== socket.id) ?? null;
  }

  // --- Node Moved ---
  // Fires when a user drags a node on the canvas
  // We broadcast the new position to everyone else in the same canvas
  socket.on("node-moved", (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;

    // Basic validation — never trust client data
    if (!data?.nodeId || data?.x == null || data?.y == null) {
      socket.emit("error", { message: "Invalid node-moved payload" });
      return;
    }

    // Broadcast to everyone in the room EXCEPT the sender
    // The sender's frontend already updated its own UI optimistically
    socket.to(canvasId).emit("node-moved", {
      nodeId: data.nodeId,
      x: data.x,
      y: data.y,
      movedBy: socket.id,
    });
  });

  // --- Edge Updated ---
  // Fires when a user connects or disconnects two nodes with an edge
  socket.on("edge-updated", (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;

    if (!data?.edgeId || !data?.source || !data?.target) {
      socket.emit("error", { message: "Invalid edge-updated payload" });
      return;
    }

    socket.to(canvasId).emit("edge-updated", {
      edgeId: data.edgeId,
      source: data.source,
      target: data.target,
      updatedBy: socket.id,
    });
  });

  // --- Cursor Position ---
  // Fires rapidly as a user moves their mouse across the canvas
  // This powers the "live cursor" feature showing where other users are
  // We do NOT save this to Redis or MongoDB — it is purely ephemeral
  socket.on("cursor-move", (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;

    if (data?.x == null || data?.y == null) return;

    // No validation error emitted here intentionally
    // Cursor events fire 30-60 times per second — error feedback would flood the client
    socket.to(canvasId).emit("cursor-move", {
      socketId: socket.id,
      x: data.x,
      y: data.y,
    });
  });

  // --- Node Added ---
  // Fires when a user drops a new node onto the canvas
  socket.on("node-added", (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;

    if (!data?.nodeId || !data?.type || data?.x == null || data?.y == null) {
      socket.emit("error", { message: "Invalid node-added payload" });
      return;
    }

    // Use io.to() here — everyone including the sender needs to
    // acknowledge the node was officially added to the shared canvas state
    io.to(canvasId).emit("node-added", {
      nodeId: data.nodeId,
      type: data.type,
      x: data.x,
      y: data.y,
      addedBy: socket.id,
    });
  });

  // --- Node Deleted ---
  // Fires when a user deletes a node from the canvas
  socket.on("node-deleted", (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;

    if (!data?.nodeId) {
      socket.emit("error", { message: "Invalid node-deleted payload" });
      return;
    }

    io.to(canvasId).emit("node-deleted", {
      nodeId: data.nodeId,
      deletedBy: socket.id,
    });
  });
}