import Canvas from '../models/Canvas.js';
import { getRedisClient } from '../config/redis.js';

// Tracks which canvasIds have pending changes since the last flush
const dirtySet = new Set();

// How often we flush Redis state to MongoDB (in milliseconds)
const FLUSH_INTERVAL_MS = 5000;

let flushTimer = null;

/**
 * Mark a canvas as dirty — meaning its Redis state is ahead of MongoDB.
 * Call this whenever a socket event mutates the canvas (node move, add, etc.)
 */
export function markDirty(canvasId) {
  dirtySet.add(canvasId);
}

/**
 * Flush all dirty canvases from Redis into MongoDB.
 * Runs on an interval — not triggered per-event.
 */
async function flushDirtyCanvases() {
  if (dirtySet.size === 0) return;

  // Snapshot and clear the set immediately so new dirty marks
  // that arrive during the async flush aren't lost
  const toFlush = [...dirtySet];
  dirtySet.clear();

  const redis = getRedisClient();

  for (const canvasId of toFlush) {
    try {
      const cached = await redis.hget(`canvas:${canvasId}`, 'state');
      if (!cached) continue;

      const { nodes, edges } = JSON.parse(cached);

      await Canvas.findOneAndUpdate(
        { canvasId },
        { canvasId, nodes, edges, lastSaved: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`[writeThrottle] Flushed canvas "${canvasId}" to MongoDB.`);
    } catch (err) {
      // Don't crash the timer — just log and re-mark as dirty for next cycle
      console.error(`[writeThrottle] Failed to flush "${canvasId}":`, err.message);
      dirtySet.add(canvasId);
    }
  }
}

/**
 * Start the background flush timer.
 * Call this once during server startup, after DB and Redis are connected.
 */
export function startWriteThrottle() {
  if (flushTimer) return; // Guard against double-start
  flushTimer = setInterval(flushDirtyCanvases, FLUSH_INTERVAL_MS);
  console.log(`[writeThrottle] Started — flushing every ${FLUSH_INTERVAL_MS / 1000}s.`);
}

/**
 * Stop the timer and do one final flush.
 * Call this on graceful server shutdown (SIGTERM/SIGINT).
 */
export async function stopWriteThrottle() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  console.log('[writeThrottle] Stopping — running final flush...');
  await flushDirtyCanvases();
}