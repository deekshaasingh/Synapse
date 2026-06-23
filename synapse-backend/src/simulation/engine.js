// --- SIMULATION ENGINE ---
// Models virtual traffic throughput through a canvas graph
// Input  : { nodes: [...], edges: [...] }
// Output : { nodeStats: {...}, alerts: [...] }
//
// Each node has a "capacity" — the max traffic units it can handle
// Each edge carries "load" — traffic units flowing through it
// If a node's total incoming load exceeds its capacity, it is a bottleneck

// Default capacity per node type if not explicitly set
const DEFAULT_CAPACITY = {
  server:        100,
  database:      80,
  loadbalancer:  200,
  cache:         150,
  client:        50,
  default:       100,
};

// How much traffic each edge carries by default (units per tick)
const BASE_EDGE_LOAD = 20;

// Threshold percentage at which we warn (before full overload)
const WARN_THRESHOLD = 0.75;  // 75%
const CRIT_THRESHOLD = 1.0;   // 100%

/**
 * Runs one simulation tick against the provided graph
 * @param {Object} graph - { nodes: Array, edges: Array }
 * @returns {Object} - { nodeStats, alerts }
 */
export function runSimulationTick(graph) {
  const { nodes = [], edges = [] } = graph;

  // Map for quick node lookup by id
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Track total incoming load per node
  const incomingLoad = new Map(nodes.map((n) => [n.id, 0]));

  // Calculate incoming load for each node based on edges
  for (const edge of edges) {
    const { target, load } = edge;

    if (!nodeMap.has(target)) continue;

    const edgeLoad = typeof load === "number" ? load : BASE_EDGE_LOAD;
    incomingLoad.set(target, (incomingLoad.get(target) ?? 0) + edgeLoad);
  }

  // Build per-node stats and collect alerts
  const nodeStats = {};
  const alerts = [];

  for (const node of nodes) {
    const nodeType = node.data?.nodeType ?? node.type ?? 'default';
const capacity =
  node.capacity ??
  DEFAULT_CAPACITY[nodeType] ??
  DEFAULT_CAPACITY.default;

    const load = incomingLoad.get(node.id) ?? 0;
    const utilization = capacity > 0 ? load / capacity : 0;

    // Determine status
    let status = "normal";
    if (utilization >= CRIT_THRESHOLD) status = "critical";
    else if (utilization >= WARN_THRESHOLD) status = "warning";

    nodeStats[node.id] = {
  nodeId:      node.id,
  type:        node.data?.nodeType ?? node.type ?? "default",
      load,
      capacity,
      utilization: parseFloat(utilization.toFixed(3)),
      status,
    };

    // Generate alert if node is under stress
    if (status === "critical") {
      alerts.push({
        level:    "critical",
        nodeId:   node.id,
        message:  `Node "${node.id}" is overloaded — ${load}/${capacity} units (${Math.round(utilization * 100)}%)`,
      });
    } else if (status === "warning") {
      alerts.push({
        level:   "warning",
        nodeId:  node.id,
        message: `Node "${node.id}" is under high load — ${load}/${capacity} units (${Math.round(utilization * 100)}%)`,
      });
    }
  }

  return { nodeStats, alerts };
}