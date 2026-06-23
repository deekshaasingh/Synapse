'use client';
import { useCanvasStore } from '@/store/canvasStore';
import { useSave } from '@/hooks/useSave';

const NODE_TYPES = [
  { type: 'server',       label: 'Server',        icon: '⬡', color: '#00f5ff' },
  { type: 'database',     label: 'Database',      icon: '◉', color: '#00ff88' },
  { type: 'cache',        label: 'Cache',         icon: '◈', color: '#cc88ff' },
  { type: 'loadbalancer', label: 'Load Balancer', icon: '⬡', color: '#ffaa00' },
  { type: 'client',       label: 'Client',        icon: '◎', color: '#4488ff' },
];

export default function Toolbar({ onStartSim, onStopSim }) {
  const addNode = useCanvasStore((s) => s.addNode);
  const simulationRunning = useCanvasStore((s) => s.simulationRunning);
  const saving = useCanvasStore((s) => s.saving);
  const lastSaved = useCanvasStore((s) => s.lastSaved);
  const resetSimulation = useCanvasStore((s) => s.resetSimulation);
  const { save } = useSave();

  const handleReset = () => {
    onStopSim();
    resetSimulation();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      background: 'linear-gradient(180deg, var(--bg-base) 60%, transparent)',
      borderBottom: '1px solid var(--border)',
    }}>

      {/* Brand */}
      <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '28px', height: '28px',
          background: 'linear-gradient(135deg, #00f5ff22, #00f5ff44)',
          border: '1px solid #00f5ff55',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
        }}>⬡</div>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--text-primary)',
        }}>SYNAPSE</span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', background: 'var(--border)', marginRight: '8px' }} />

      {/* Add node buttons */}
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px', letterSpacing: '0.05em' }}>
        ADD
      </span>
      {NODE_TYPES.map(({ type, label, icon, color }) => (
        <button
          key={type}
          onClick={() => addNode(type)}
          title={`Add ${label}`}
          style={{
            background: 'var(--bg-elevated)',
            border: `1px solid var(--border)`,
            borderRadius: '6px',
            padding: '5px 10px',
            color: color,
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.background = `${color}11`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
        >
          <span style={{ fontSize: '13px' }}>{icon}</span>
          {label}
        </button>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sim controls */}
      {!simulationRunning ? (
        <button
          onClick={onStartSim}
          style={{
            background: '#00ff8811',
            border: '1px solid #00ff8844',
            borderRadius: '6px',
            padding: '6px 16px',
            color: 'var(--neon-green)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#00ff8822'; e.currentTarget.style.borderColor = '#00ff8888'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#00ff8811'; e.currentTarget.style.borderColor = '#00ff8844'; }}
        >
          ▶ RUN SIM
        </button>
      ) : (
        <button
          onClick={handleReset}
          style={{
            background: '#ff336611',
            border: '1px solid #ff336644',
            borderRadius: '6px',
            padding: '6px 16px',
            color: 'var(--neon-red)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          ■ STOP
        </button>
      )}

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '6px 14px',
          color: saving ? 'var(--text-muted)' : 'var(--text-secondary)',
          fontSize: '12px',
          cursor: saving ? 'default' : 'pointer',
          transition: 'all 0.15s',
        }}
        title="Save canvas (Ctrl+S)"
      >
        {saving ? '↻ Saving…' : '↓ Save'}
      </button>

      {/* Last saved */}
      {lastSaved && (
        <span style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          saved {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
