'use client';
import { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useSave } from '@/hooks/useSave';

const NODE_TYPES = [
  { type: 'server',       label: 'Server',    icon: '⬡', color: '#00f5ff' },
  { type: 'database',     label: 'Database',  icon: '◉', color: '#00ff88' },
  { type: 'cache',        label: 'Cache',     icon: '◈', color: '#cc88ff' },
  { type: 'loadbalancer', label: 'LB',        icon: '⬡', color: '#ffaa00' },
  { type: 'client',       label: 'Client',    icon: '◎', color: '#4488ff' },
];

export default function Toolbar({ onStartSim, onStopSim }) {
  const addNode = useCanvasStore((s) => s.addNode);
  const simulationRunning = useCanvasStore((s) => s.simulationRunning);
  const saving = useCanvasStore((s) => s.saving);
  const lastSaved = useCanvasStore((s) => s.lastSaved);
  const resetSimulation = useCanvasStore((s) => s.resetSimulation);
  const { save } = useSave();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleReset = () => {
    onStopSim();
    resetSimulation();
  };

  return (
    <>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 14px',
        background: 'linear-gradient(180deg, var(--bg-base) 60%, transparent)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'nowrap',
        overflow: 'hidden',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{
            width: '26px', height: '26px',
            background: 'linear-gradient(135deg, #00f5ff22, #00f5ff44)',
            border: '1px solid #00f5ff55',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px',
          }}>⬡</div>
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>SYNAPSE</span>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }} className="node-buttons-desktop">
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em', flexShrink: 0 }}>ADD</span>
          {NODE_TYPES.map(({ type, label, icon, color }) => (
            <button key={type} onClick={() => addNode(type)}
              style={{
                background: 'var(--bg-elevated)', border: `1px solid var(--border)`,
                borderRadius: '6px', padding: '4px 8px', color,
                fontSize: '10px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                flexShrink: 0, whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}11`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            >
              <span style={{ fontSize: '12px' }}>{icon}</span>{label}
            </button>
          ))}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger-btn"
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '5px 8px', color: 'var(--text-secondary)',
            fontSize: '12px', cursor: 'pointer', display: 'none', flexShrink: 0,
          }}>☰ Add</button>

        <div style={{ flex: 1 }} className="spacer-desktop" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {!simulationRunning ? (
            <button onClick={onStartSim}
              style={{
                background: '#00ff8811', border: '1px solid #00ff8844',
                borderRadius: '6px', padding: '5px 12px', color: 'var(--neon-green)',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>▶ RUN</button>
          ) : (
            <button onClick={handleReset}
              style={{
                background: '#ff336611', border: '1px solid #ff336644',
                borderRadius: '6px', padding: '5px 12px', color: 'var(--neon-red)',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              }}>■ STOP</button>
          )}
          <button onClick={save} disabled={saving}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '5px 10px',
              color: saving ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: '11px', cursor: saving ? 'default' : 'pointer', whiteSpace: 'nowrap',
            }}>{saving ? '↻' : '↓ Save'}</button>
        </div>

        {lastSaved && (
          <span className="last-saved-desktop" style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
            saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: '50px', left: 0, right: 0, zIndex: 20,
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
          padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '8px',
        }}>
          {NODE_TYPES.map(({ type, label, icon, color }) => (
            <button key={type} onClick={() => { addNode(type); setMenuOpen(false); }}
              style={{
                background: 'var(--bg-elevated)', border: `1px solid ${color}44`,
                borderRadius: '8px', padding: '8px 14px', color,
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              <span style={{ fontSize: '15px' }}>{icon}</span>{label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .node-buttons-desktop { display: none !important; }
          .spacer-desktop { display: none !important; }
          .last-saved-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 641px) {
          .hamburger-btn { display: none !important; }
          .node-buttons-desktop { display: flex !important; }
        }
      `}</style>
    </>
  );
}