import { runSimulationTick } from "./engine.js";

const activeTickers = new Map();

export function startTicker(io, canvasId, graphStore) {
  if (activeTickers.has(canvasId)) {
    console.log(`[Ticker] Already running for canvas: ${canvasId}`);
    return;
  }

  const tickInterval = parseInt(process.env.SIMULATION_TICK_MS) || 1000;
  console.log(`[Ticker] Starting for canvas: ${canvasId} every ${tickInterval}ms`);

  const interval = setInterval(() => {
    const graph = graphStore.getGraph(canvasId);
    if (!graph || graph.nodes.length === 0) return;

    const { nodeStats, alerts } = runSimulationTick(graph);

    const nodeUpdates = Object.values(nodeStats).map((s) => ({
      id:         s.nodeId,
      load:       Math.round(s.utilization * 100),
      throughput: s.load,
      status:     s.status === 'critical' ? 'overloaded' : s.status,
    }));

    io.to(canvasId).emit('simulation:tick', {
      canvasId,
      nodeUpdates,
      alerts,
      timestamp: Date.now(),
    });

    if (alerts.length > 0) {
      io.to(canvasId).emit('simulation:alert', { canvasId, alerts });
    }

  }, tickInterval);

  activeTickers.set(canvasId, interval);
}

export function stopTicker(canvasId) {
  const interval = activeTickers.get(canvasId);
  if (!interval) return;
  clearInterval(interval);
  activeTickers.delete(canvasId);
  console.log(`[Ticker] Stopped for canvas: ${canvasId}`);
}

export function getActiveTickerCount() {
  return activeTickers.size;
}