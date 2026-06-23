'use client';
import { useCanvasStore } from '@/store/canvasStore';

export default function StatusBar() {
  const connected = useCanvasStore((s) => s.connected);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const simulationRunning = useCanvasStore((s) => s.simulationRunning);

  const overloaded = nodes.filter((n) => n.data?.status === 'overloaded').length;
  const warning    = nodes.filter((n) => n.data?.status === 'warning').length;

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '6px 20px',
      background: 'linear-gradient(0deg, var(--bg-base) 60%, transparent)',
      borderTop: '1px solid var(--border)',
      fontSize: '10px',
      fontFamily: 'JetBrains Mono, monospace',
      color: 'var(--text-muted)',
    }}>

      {/* Connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: connected ? 'var(--neon-green)' : 'var(--text-muted)',
          boxShadow: connected ? '0 0 6px var(--neon-green)' : 'none',
        }} />
        {connected ? 'CONNECTED' : 'OFFLINE'}
      </div>

      <span style={{ color: 'var(--border-bright)' }}>|</span>

      <span>{nodes.length} nodes · {edges.length} edges</span>

      {simulationRunning && (
        <>
          <span style={{ color: 'var(--border-bright)' }}>|</span>
          <span style={{ color: 'var(--neon-green)' }}>● SIM RUNNING</span>
        </>
      )}

      {overloaded > 0 && (
        <>
          <span style={{ color: 'var(--border-bright)' }}>|</span>
          <span style={{ color: 'var(--neon-red)' }}>⚠ {overloaded} OVERLOADED</span>
        </>
      )}

      {warning > 0 && (
        <>
          <span style={{ color: 'var(--border-bright)' }}>|</span>
          <span style={{ color: 'var(--neon-amber)' }}>⚠ {warning} WARNING</span>
        </>
      )}

      <div style={{ flex: 1 }} />
      <span>SYNAPSE v1.0 · drag to connect nodes · Ctrl+S to save</span>
    </div>
  );
}
