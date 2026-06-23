'use client';
import { Handle, Position } from '@xyflow/react';
import { useCanvasStore } from '@/store/canvasStore';

const NODE_ICONS = {
  server:       '⬡',
  database:     '◉',
  cache:        '◈',
  loadbalancer: '⬡',
  client:       '◎',
};

const NODE_COLORS = {
  server:       { bg: '#0d1f2d', accent: '#00f5ff', border: '#1a3a4a' },
  database:     { bg: '#0d1f0d', accent: '#00ff88', border: '#1a3a1a' },
  cache:        { bg: '#1f0d2d', accent: '#cc88ff', border: '#3a1a4a' },
  loadbalancer: { bg: '#1f1f0d', accent: '#ffaa00', border: '#3a3a1a' },
  client:       { bg: '#0d0d1f', accent: '#4488ff', border: '#1a1a3a' },
};

function statusClass(status) {
  if (status === 'overloaded') return 'node-overloaded';
  if (status === 'warning')    return 'node-warning';
  return '';
}

function loadColor(load) {
  if (load >= 80) return 'var(--neon-red)';
  if (load >= 50) return 'var(--neon-amber)';
  return 'var(--neon-green)';
}

export default function SynapseNode({ id, data, selected }) {
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const { label, nodeType = 'server', load = 0, status = 'idle', throughput = 0 } = data;
  const colors = NODE_COLORS[nodeType] || NODE_COLORS.server;
  const icon = NODE_ICONS[nodeType] || '◆';

  return (
    <div
      className={statusClass(status)}
      style={{
        background: colors.bg,
        border: `1px solid ${selected ? colors.accent : colors.border}`,
        borderRadius: '10px',
        minWidth: '160px',
        padding: '0',
        overflow: 'visible',
        boxShadow: selected
          ? `0 0 0 1px ${colors.accent}33, 0 4px 24px rgba(0,0,0,0.6)`
          : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        cursor: 'grab',
        position: 'relative',
      }}
    >
      {/* Header bar */}
      <div style={{
        background: `${colors.accent}18`,
        borderBottom: `1px solid ${colors.border}`,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: colors.accent, fontSize: '16px', lineHeight: 1 }}>{icon}</span>
        <span style={{
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          flex: 1,
        }}>{label}</span>
        {selected && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              padding: '0 2px',
            }}
            title="Delete node"
          >×</button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        {/* Load bar */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              LOAD
            </span>
            <span style={{
              fontSize: '10px',
              color: loadColor(load),
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 500,
            }}>
              {load}%
            </span>
          </div>
          <div style={{
            height: '3px',
            background: 'var(--border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${load}%`,
              background: loadColor(load),
              borderRadius: '2px',
              transition: 'width 0.4s ease, background 0.3s',
              boxShadow: `0 0 6px ${loadColor(load)}`,
            }} />
          </div>
        </div>

        {/* Throughput */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            THROUGHPUT
          </span>
          <span style={{
            fontSize: '10px',
            color: colors.accent,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {throughput} req/s
          </span>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left}  style={{ left: -5 }} />
      <Handle type="source" position={Position.Right} style={{ right: -5 }} />
      <Handle type="target" position={Position.Top}   style={{ top: -5 }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: -5 }} />
    </div>
  );
}
