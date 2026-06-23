import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const CANVAS_ID = 'main-canvas';

export const useCanvasStore = create((set, get) => ({
  canvasId: CANVAS_ID,
  nodes: [],
  edges: [],
  simulationRunning: false,
  connected: false,
  saving: false,
  lastSaved: null,

  setConnected: (v) => set({ connected: v }),
  setSaving: (v) => set({ saving: v }),
  setLastSaved: (v) => set({ lastSaved: v }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) =>
    set((s) => ({
      edges: [
        ...s.edges,
        { ...connection, id: `e-${Date.now()}`, animated: false },
      ],
    })),

  addNode: (type) => {
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type: 'synapseNode',
      position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
      data: {
        label: defaultLabel(type),
        nodeType: type,
        load: 0,
        status: 'idle',
        throughput: 0,
      },
    };
    set((s) => ({ nodes: [...s.nodes, newNode] }));
    return id;
  },

  deleteNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  updateNodeSimData: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  setSimulationRunning: (v) => set({ simulationRunning: v }),

  resetSimulation: () =>
    set((s) => ({
      simulationRunning: false,
      nodes: s.nodes.map((n) => ({
        ...n,
        data: { ...n.data, load: 0, status: 'idle', throughput: 0 },
      })),
    })),
}));

function defaultLabel(type) {
  const labels = {
    server:    'API Server',
    database:  'Database',
    cache:     'Redis Cache',
    loadbalancer: 'Load Balancer',
    client:    'Client',
  };
  return labels[type] || type;
}
