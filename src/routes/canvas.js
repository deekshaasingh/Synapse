import express from 'express';
import Canvas from '../models/Canvas.js';
import { getRedisClient } from '../config/redis.js';

const router = express.Router();

/**
 * GET /api/canvas/:canvasId
 * Load a canvas. Strategy: Redis-first (fast path), MongoDB fallback (durable path).
 * This is the "read-through cache" pattern.
 */
router.get('/:canvasId', async (req, res) => {
  const { canvasId } = req.params;

  try {
    // 1. Try Redis first — if the canvas is active, it'll be here
    const redis = getRedisClient();
    const cached = await redis.hget(`canvas:${canvasId}`, 'state');

    if (cached) {
      return res.status(200).json({
        source: 'cache',
        canvasId,
        state: JSON.parse(cached),
      });
    }

    // 2. Redis miss — fall back to MongoDB
    const canvas = await Canvas.findOne({ canvasId });

    if (!canvas) {
      return res.status(404).json({
        error: `Canvas with id "${canvasId}" not found.`,
      });
    }

    // 3. Warm the Redis cache so next read is fast
    await redis.hset(
      `canvas:${canvasId}`,
      'state',
      JSON.stringify({ nodes: canvas.nodes, edges: canvas.edges })
    );

    return res.status(200).json({
      source: 'database',
      canvasId,
      state: {
        nodes: canvas.nodes,
        edges: canvas.edges,
      },
    });
  } catch (err) {
    console.error('[routes/canvas] GET error:', err.message);
    return res.status(500).json({ error: 'Failed to load canvas.' });
  }
});

/**
 * POST /api/canvas/:canvasId
 * Persist the current canvas state to MongoDB.
 * Called explicitly by the client (e.g., Ctrl+S), NOT on every socket event.
 */
router.post('/:canvasId', async (req, res) => {
  const { canvasId } = req.params;
  const { nodes, edges } = req.body;

  if (!nodes || !edges) {
    return res.status(400).json({
      error: 'Request body must include "nodes" and "edges" arrays.',
    });
  }

  try {
    // upsert: create if not exists, update if exists
    const canvas = await Canvas.findOneAndUpdate(
      { canvasId },
      {
        canvasId,
        nodes,
        edges,
        lastSaved: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also update Redis so the cache stays consistent
    const redis = getRedisClient();
    await redis.hset(
      `canvas:${canvasId}`,
      'state',
      JSON.stringify({ nodes, edges })
    );

    return res.status(200).json({
      message: 'Canvas saved successfully.',
      canvasId: canvas.canvasId,
      lastSaved: canvas.lastSaved,
    });
  } catch (err) {
    console.error('[routes/canvas] POST error:', err.message);
    return res.status(500).json({ error: 'Failed to save canvas.' });
  }
});

/**
 * DELETE /api/canvas/:canvasId
 * Remove a canvas from both MongoDB and Redis.
 * Useful for testing and for a future "reset board" feature.
 */
router.delete('/:canvasId', async (req, res) => {
  const { canvasId } = req.params;

  try {
    await Canvas.deleteOne({ canvasId });

    const redis = getRedisClient();
    await redis.del(`canvas:${canvasId}`);

    return res.status(200).json({
      message: `Canvas "${canvasId}" deleted from database and cache.`,
    });
  } catch (err) {
    console.error('[routes/canvas] DELETE error:', err.message);
    return res.status(500).json({ error: 'Failed to delete canvas.' });
  }
});

export default router;