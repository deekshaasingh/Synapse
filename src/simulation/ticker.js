import { runSimulationTick } from "./engine.js";

// Stores active ticker intervals keyed by canvasId
// Prevents duplicate tickers if a canvas is joined multiple times
const activeTickers = new Map();

/**
 * Starts a simulation ticker for a specific canvas room
 * @param {Object} io         - Socket.IO server instance
 * @param {string} canvasId   - The canvas room to broadcast results to
 * @param {Object} graphStore - Reference to the live graph state for this canvas
 */
export function startTicker(io, canvasId, graphStore) {

  // Do not start a second ticker if one is already running for this canvas
  if (activeTickers.has(canvasId)) {
    console.log(`[Ticker] Already running for canvas: ${canvasId}`);
    return;
  }

  const tickInterval = parseInt(process.env.SIMULATION_TICK_MS) || 1000;

  console.log(`[Ticker] Starting simulation for canvas: ${canvasId} every ${tickInterval}ms`);

  const interval = setInterval(() => {

    // Get the current graph state for this canvas
    const graph = graphStore.getGraph(canvasId);

    // If no graph exists yet, skip this tick silently
    if (!graph || graph.nodes.length === 0) return;

    // Run one simulation tick against the current graph
    const { nodeStats, alerts } = runSimulationTick(graph);

    // Broadcast full node stats to everyone in the canvas room
    // Frontend uses this to color nodes based on utilization
    io.to(canvasId).emit("simulation-tick", {
      canvasId,
      nodeStats,
      alerts,
      timestamp: Date.now(),
    });

    // If there are any alerts, emit them as a separate dedicated event
    // Frontend listens to this specifically to trigger blinking animations
    if (alerts.length > 0) {
      io.to(canvasId).emit("simulation-alert", {
        canvasId,
        alerts,
        timestamp: Date.now(),
      });
    }

  }, tickInterval);

  // Store the interval reference so we can stop it later
  activeTickers.set(canvasId, interval);
}

/**
 * Stops the simulation ticker for a specific canvas
 * Called when all users leave a canvas room
 * @param {string} canvasId
 */
export function stopTicker(canvasId) {
  const interval = activeTickers.get(canvasId);

  if (!interval) {
    console.log(`[Ticker] No active ticker found for canvas: ${canvasId}`);
    return;
  }

  clearInterval(interval);
  activeTickers.delete(canvasId);
  console.log(`[Ticker] Stopped simulation for canvas: ${canvasId}`);
}

/**
 * Returns how many canvases currently have active tickers
 * Useful for monitoring and debugging
 */
export function getActiveTickerCount() {
  return activeTickers.size;
}