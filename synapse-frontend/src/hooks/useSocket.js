'use client';

import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useCanvasStore } from '@/store/canvasStore';

export function useSocket() {
  const canvasId = useCanvasStore((s) => s.canvasId);
  const setConnected = useCanvasStore((s) => s.setConnected);
  const updateNodeSimData = useCanvasStore((s) => s.updateNodeSimData);
  const setSimulationRunning = useCanvasStore((s) => s.setSimulationRunning);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = connectSocket(canvasId);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Simulation engine pushes node load updates every tick
    socket.on('simulation:tick', ({ nodeUpdates }) => {
      nodeUpdates?.forEach(({ id, load, status, throughput }) => {
        updateNodeSimData(id, { load, status, throughput });
      });
    });

    socket.on('simulation:started', () => setSimulationRunning(true));
    socket.on('simulation:stopped', () => setSimulationRunning(false));

    return () => {
      disconnectSocket();
      initialized.current = false;
    };
  }, [canvasId]);

  const startSimulation = (nodes, edges) => {
    setSimulationRunning(true);
    getSocket().emit('simulation:start', { canvasId, nodes, edges });
  };

  const stopSimulation = () => {
    setSimulationRunning(false);
    getSocket().emit('simulation:stop', { canvasId });
  };
  const emitNodeMove = (id, position) => {
    getSocket().emit('node:move', { canvasId, id, position });
  };

  return { startSimulation, stopSimulation, emitNodeMove };
}
