import { startTicker, stopTicker } from '../simulation/ticker.js';
import { initGraph, setGraph, getGraph } from '../simulation/graphStore.js';

export function registerCanvasHandlers(io, socket) {

  function getCurrentCanvas() {
    return [...socket.rooms].find((room) => room !== socket.id) ?? null;
  }

  // --- Node Moved ---
  socket.on('node-moved', (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;
    if (!data?.nodeId || data?.x == null || data?.y == null) {
      socket.emit('error', { message: 'Invalid node-moved payload' });
      return;
    }
    socket.to(canvasId).emit('node-moved', {
      nodeId: data.nodeId,
      x: data.x,
      y: data.y,
      movedBy: socket.id,
    });
  });

  // --- Edge Updated ---
  socket.on('edge-updated', (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;
    if (!data?.edgeId || !data?.source || !data?.target) {
      socket.emit('error', { message: 'Invalid edge-updated payload' });
      return;
    }
    socket.to(canvasId).emit('edge-updated', {
      edgeId: data.edgeId,
      source: data.source,
      target: data.target,
      updatedBy: socket.id,
    });
  });

  // --- Cursor Move ---
  socket.on('cursor-move', (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;
    if (data?.x == null || data?.y == null) return;
    socket.to(canvasId).emit('cursor-move', {
      socketId: socket.id,
      x: data.x,
      y: data.y,
    });
  });

  // --- Node Added ---
  socket.on('node-added', (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;
    if (!data?.nodeId || !data?.type || data?.x == null || data?.y == null) {
      socket.emit('error', { message: 'Invalid node-added payload' });
      return;
    }
    io.to(canvasId).emit('node-added', {
      nodeId: data.nodeId,
      type: data.type,
      x: data.x,
      y: data.y,
      addedBy: socket.id,
    });
  });

  // --- Node Deleted ---
  socket.on('node-deleted', (data) => {
    const canvasId = getCurrentCanvas();
    if (!canvasId) return;
    if (!data?.nodeId) {
      socket.emit('error', { message: 'Invalid node-deleted payload' });
      return;
    }
    io.to(canvasId).emit('node-deleted', {
      nodeId: data.nodeId,
      deletedBy: socket.id,
    });
  });

  // --- Simulation Start ---
  // Frontend sends the current nodes + edges so the engine has the graph
  socket.on('simulation:start', ({ canvasId, nodes, edges }) => {
  if (!canvasId || !nodes || !edges) return;

  console.log(`[Socket] simulation:start for canvas: ${canvasId} | nodes: ${nodes.length}`);

  // Ensure socket is in the room so it receives tick events
  socket.join(canvasId);

  initGraph(canvasId);
  setGraph(canvasId, { nodes, edges });

  const graphStore = { getGraph: (id) => getGraph(id) };
  startTicker(io, canvasId, graphStore);

  io.to(canvasId).emit('simulation:started');
});

  // --- Simulation Stop ---
  socket.on('simulation:stop', ({ canvasId }) => {
    if (!canvasId) return;
    console.log(`[Socket] simulation:stop for canvas: ${canvasId}`);
    stopTicker(canvasId);
    io.to(canvasId).emit('simulation:stopped');
  });
}