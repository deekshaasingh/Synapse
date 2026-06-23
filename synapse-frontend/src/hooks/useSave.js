'use client';
import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { saveCanvas } from '@/lib/api';

export function useSave() {
  const canvasId = useCanvasStore((s) => s.canvasId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setSaving = useCanvasStore((s) => s.setSaving);
  const setLastSaved = useCanvasStore((s) => s.setLastSaved);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await saveCanvas(canvasId, nodes, edges);
      setLastSaved(new Date());
    } catch (e) {
      console.error('[useSave]', e.message);
    } finally {
      setSaving(false);
    }
  }, [canvasId, nodes, edges]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  return { save };
}
