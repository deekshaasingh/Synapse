'use client';
import { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store/canvasStore';
import { useSocket } from '@/hooks/useSocket';
import { loadCanvas } from '@/lib/api';
import SynapseNode from '@/components/nodes/SynapseNode';
import Toolbar from '@/components/ui/Toolbar';
import StatusBar from '@/components/ui/StatusBar';

const nodeTypes = { synapseNode: SynapseNode };

export default function Canvas() {
  const nodes         = useCanvasStore((s) => s.nodes);
  const edges         = useCanvasStore((s) => s.edges);
  const canvasId      = useCanvasStore((s) => s.canvasId);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const setNodes      = useCanvasStore((s) => s.setNodes);
  const setEdges      = useCanvasStore((s) => s.setEdges);

  const { startSimulation, stopSimulation, emitNodeMove } = useSocket();

  useEffect(() => {
    loadCanvas(canvasId).then((state) => {
      if (state) {
        setNodes(state.nodes || []);
        setEdges(state.edges || []);
      }
    }).catch(console.error);
  }, [canvasId]);

  // Fix: use current edges from store directly
  const handleConnect = useCallback((params) => {
    setEdges(addEdge({ ...params, id: `e-${Date.now()}` }, edges));
  }, [edges, setEdges]);

  const handleNodeDragStop = useCallback((_, node) => {
    emitNodeMove(node.id, node.position);
  }, [emitNodeMove]);

  const handleStartSim = useCallback(() => {
    startSimulation(nodes, edges);
  }, [nodes, edges, startSimulation]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: 'var(--bg-base)' }}>
      <Toolbar onStartSim={handleStartSim} onStopSim={stopSimulation} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        style={{ background: 'var(--bg-base)' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2a2a3a"
        />
        <Controls position="bottom-right" style={{ bottom: 40 }} />
        <MiniMap
          position="bottom-left"
          style={{ bottom: 40, left: 20 }}
          nodeColor={(n) => {
            const colors = {
              server: '#00f5ff33', database: '#00ff8833',
              cache: '#cc88ff33', loadbalancer: '#ffaa0033', client: '#4488ff33',
            };
            return colors[n.data?.nodeType] || '#ffffff22';
          }}
          maskColor="#0a0a0f88"
        />
      </ReactFlow>

      <StatusBar />
    </div>
  );
}