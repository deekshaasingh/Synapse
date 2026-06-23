const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function loadCanvas(canvasId) {
  const res = await fetch(`${BASE}/api/canvas/${canvasId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load canvas');
  const data = await res.json();
  return data.state; // { nodes, edges }
}

export async function saveCanvas(canvasId, nodes, edges) {
  const res = await fetch(`${BASE}/api/canvas/${canvasId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes, edges }),
  });
  if (!res.ok) throw new Error('Failed to save canvas');
  return res.json();
}
