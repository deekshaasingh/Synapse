// --- GRAPH STORE ---
// In-memory store for live canvas graph state
// Keyed by canvasId — each canvas has its own independent graph
// This is the single source of truth for the simulation engine
// MongoDB is only a durability backup, not the live state

const store = new Map();

/**
 * Initializes a blank graph for a canvas if one doesn't exist yet
 * Called when a user first joins a canvas room
 * @param {string} canvasId
 */
export function initGraph(canvasId) {
  if (!store.has(canvasId)) {
    store.set(canvasId, { nodes: [], edges: [] });
    console.log(`[GraphStore] Initialized graph for canvas: ${canvasId}`);
  }
}

/**
 * Returns the current graph state for a canvas
 * @param {string} canvasId
 * @returns {Object} - { nodes, edges } or null if not found
 */
export function getGraph(canvasId) {
  return store.get(canvasId) ?? null;
}

/**
 * Replaces the entire graph state for a canvas
 * Used when loading a saved canvas from MongoDB on first join
 * @param {string} canvasId
 * @param {Object} graph - { nodes: Array, edges: Array }
 */
export function setGraph(canvasId, graph) {
  if (!graph?.nodes || !graph?.edges) {
    console.warn(`[GraphStore] Invalid graph shape for canvas: ${canvasId}`);
    return;
  }

  store.set(canvasId, {
    nodes: graph.nodes,
    edges: graph.edges,
  });

  console.log(
    `[GraphStore] Set graph for canvas: ${canvasId} | ` +
    `Nodes: ${graph.nodes.length} | Edges: ${graph.edges.length}`
  );
}

/**
 * Updates a single node's position in the graph
 * Called on every node-moved socket event
 * @param {string} canvasId
 * @param {string} nodeId
 * @param {number} x
 * @param {number} y
 */
export function updateNodePosition(canvasId, nodeId, x, y) {
  const graph = store.get(canvasId);
  if (!graph) return;

  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  node.x = x;
  node.y = y;
}

/**
 * Adds a new node to the graph
 * @param {string} canvasId
 * @param {Object} node - { id, type, x, y }
 */
export function addNode(canvasId, node) {
  const graph = store.get(canvasId);
  if (!graph) return;

  // Prevent duplicate nodes
  const exists = graph.nodes.some((n) => n.id === node.id);
  if (exists) {
    console.warn(`[GraphStore] Node ${node.id} already exists in canvas: ${canvasId}`);
    return;
  }

  graph.nodes.push(node);
}

/**
 * Removes a node and all its connected edges from the graph
 * @param {string} canvasId
 * @param {string} nodeId
 */
export function removeNode(canvasId, nodeId) {
  const graph = store.get(canvasId);
  if (!graph) return;

  graph.nodes = graph.nodes.filter((n) => n.id !== nodeId);

  // Also remove any edges connected to this node
  graph.edges = graph.edges.filter(
    (e) => e.source !== nodeId && e.target !== nodeId
  );
}

/**
 * Adds or updates an edge between two nodes
 * @param {string} canvasId
 * @param {Object} edge - { edgeId, source, target, load? }
 */
export function upsertEdge(canvasId, edge) {
  const graph = store.get(canvasId);
  if (!graph) return;

  const existingIndex = graph.edges.findIndex((e) => e.edgeId === edge.edgeId);

  if (existingIndex !== -1) {
    // Update existing edge
    graph.edges[existingIndex] = edge;
  } else {
    // Add new edge
    graph.edges.push(edge);
  }
}

/**
 * Removes an edge from the graph
 * @param {string} canvasId
 * @param {string} edgeId
 */
export function removeEdge(canvasId, edgeId) {
  const graph = store.get(canvasId);
  if (!graph) return;

  graph.edges = graph.edges.filter((e) => e.edgeId !== edgeId);
}

/**
 * Deletes the entire graph for a canvas from memory
 * Called when all users leave a canvas and the ticker is stopped
 * @param {string} canvasId
 */
export function destroyGraph(canvasId) {
  store.delete(canvasId);
  console.log(`[GraphStore] Destroyed graph for canvas: ${canvasId}`);
}

/**
 * Returns how many canvases are currently active in memory
 * Useful for monitoring
 */
export function getActiveCanvasCount() {
  return store.size;
}