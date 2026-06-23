<div align="center">

# ⬡ SYNAPSE

### Real-Time Infrastructure Simulation Engine

*Design a system topology. Run the simulation. Watch your bottlenecks glow red.*

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=flat-square&logo=redis&logoColor=white)](https://upstash.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)

</div>

---

## What is Synapse?

Synapse is an event-driven infrastructure simulation engine. You drag nodes onto a canvas — servers, databases, load balancers, caches, clients — connect them to model a real system architecture, and run a live simulation that calculates traffic throughput across the graph in real time.

Overloaded nodes pulse red. Warning nodes glow amber. Healthy nodes stay green. The bottleneck is always obvious.

It's not just a visual toy. The backend is production-architected: Socket.IO with a Redis Pub/Sub adapter for multi-server broadcasting, a write-throttle pattern that absorbs high-frequency socket events before flushing to MongoDB, and a graph-traversal simulation engine that models real capacity constraints.

---

## Demo

> 6 clients hammering a single API Server. The server hits 120% capacity and the overload alert fires.

![Synapse bottleneck demo](./docs/demo.png)

**Green** → healthy (0–74%) · **Amber** → warning (75–99%) · **Red + pulse** → overloaded (100%+)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│         Next.js + React Flow + Zustand + Socket.IO      │
└──────────────────────────┬──────────────────────────────┘
                           │  WebSocket (Socket.IO)
┌──────────────────────────▼──────────────────────────────┐
│                     EXPRESS SERVER                       │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │  Socket.IO  │   │  Simulation  │   │  REST API   │  │
│  │  Handlers   │   │   Engine     │   │  /api/canvas│  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬──────┘  │
│         │                 │                  │          │
│  ┌──────▼─────────────────▼──────────────────▼──────┐   │
│  │              Redis Pub/Sub Adapter                │   │
│  │         (scales across multiple servers)          │   │
│  └──────────────────────┬────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
    ┌──────▼──────┐              ┌───────▼──────┐
    │    Redis    │              │   MongoDB    │
    │  (live state│              │  (durable    │
    │  + Pub/Sub) │              │   storage)   │
    └─────────────┘              └──────────────┘
```

### The dual-write pattern

Socket events fire up to 20 times per second. Writing to MongoDB on every event would destroy database performance. Synapse solves this with a **write-throttle**:

- All canvas mutations hit Redis instantly (microseconds)
- A background timer flushes Redis state to MongoDB every 5 seconds
- On load, the server checks Redis first (cache hit), then falls back to MongoDB (cache miss)

This is the same pattern used by collaborative tools like Figma.

### The simulation engine

Each node has a typed capacity (`server: 100`, `database: 80`, `loadbalancer: 200`). Each edge carries a base load of 20 units per tick. The engine traverses all edges, accumulates incoming load per node, calculates utilization, and emits per-node stats via `simulation:tick` every second.

```
utilization = total_incoming_load / node_capacity

< 75%  → normal  (green)
≥ 75%  → warning (amber glow)
≥ 100% → critical (red pulse)
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend framework | Express.js + Node.js | Familiar, fast, cluster-ready |
| Real-time | Socket.IO | WebSocket with polling fallback |
| Scaling | Redis Pub/Sub + `@socket.io/redis-adapter` | Broadcast across multiple server instances |
| Caching | Redis Hashes | Sub-millisecond canvas state reads |
| Persistence | MongoDB + Mongoose | Durable canvas storage |
| Write optimization | Custom write-throttle | 5s flush interval, Redis absorbs burst writes |
| Frontend | Next.js 16 + Tailwind CSS | SSR-ready React framework |
| Canvas | `@xyflow/react` (React Flow) | Draggable node graph with custom renderers |
| State | Zustand | Lightweight client state for canvas + sim data |

---

## Project Structure

```
synapse/
├── synapse-backend/
│   ├── server.js                 # HTTP + Socket.IO bootstrap, graceful shutdown
│   └── src/
│       ├── app.js                # Express app, CORS, routes
│       ├── config/
│       │   ├── mongo.js          # Mongoose connection
│       │   └── redis.js          # ioredis clients (pub + sub)
│       ├── models/
│       │   └── Canvas.js         # Mongoose schema for canvas state
│       ├── routes/
│       │   └── canvas.js         # GET/POST/DELETE /api/canvas/:id
│       ├── socket/
│       │   ├── index.js          # Socket.IO init, room management
│       │   └── canvasHandlers.js # All socket event handlers
│       ├── simulation/
│       │   ├── engine.js         # Graph traversal + load calculation
│       │   ├── ticker.js         # setInterval tick loop → emits simulation:tick
│       │   └── graphStore.js     # In-memory graph state per canvas
│       └── utils/
│           └── writeThrottle.js  # Redis → MongoDB flush every 5s
│
└── synapse-frontend/
    └── src/
        ├── app/
        │   ├── page.js           # Entry point (dynamic import, no SSR)
        │   ├── layout.js         # Root layout + fonts
        │   └── globals.css       # Design system + neon animations
        ├── components/
        │   ├── Canvas.js         # React Flow canvas
        │   ├── nodes/
        │   │   └── SynapseNode.js # Custom node: load bar, throughput, glow
        │   └── ui/
        │       ├── Toolbar.js    # Add nodes, run/stop sim, save
        │       └── StatusBar.js  # Connection dot, node count, sim status
        ├── hooks/
        │   ├── useSocket.js      # Socket lifecycle + sim events
        │   └── useSave.js        # Ctrl+S save handler
        ├── lib/
        │   ├── socket.js         # Socket.IO client singleton
        │   └── api.js            # fetch helpers for REST API
        └── store/
            └── canvasStore.js    # Zustand store (nodes, edges, sim state)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (Atlas free tier works)
- Redis (Upstash free tier works)

### Backend

```bash
cd synapse-backend
npm install
```

Create `.env`:

```env
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
SIMULATION_TICK_MS=1000
WRITE_FLUSH_INTERVAL_MS=5000
```

```bash
npm run dev
```

### Frontend

```bash
cd synapse-frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## How to Use

1. **Add nodes** from the toolbar — Server, Database, Cache, Load Balancer, Client
2. **Connect nodes** by hovering over a node edge until a handle dot appears, then dragging to another node
3. **Press RUN SIM** to start the simulation — the engine calculates load every second
4. Watch nodes change color as traffic accumulates — amber at 75%, red pulse at 100%+
5. **Ctrl+S** to save your canvas to MongoDB

---

## Key Engineering Decisions

**Why Redis for live state instead of just MongoDB?**
MongoDB is optimized for durable storage, not for absorbing 20+ writes per second per user. Redis handles the burst writes, and MongoDB gets a clean, throttled flush every 5 seconds. This is the same dual-write pattern used in production collaborative apps.

**Why Socket.IO over raw WebSockets?**
Socket.IO provides automatic fallback to HTTP long-polling (handles corporate firewalls), built-in room management (canvas rooms), and the Redis adapter makes it trivial to scale across multiple Node processes without any application-level changes.

**Why a graph traversal engine instead of random values?**
Random load values would be a toy. The engine models real causality — a bottlenecked server affects everything downstream. Adding a load balancer in front of two servers actually splits the load. The simulation is architecturally meaningful.

---

## Recruiter FAQ

**Q: How does this scale across multiple servers?**
The `@socket.io/redis-adapter` routes all socket events through Redis Pub/Sub. Any server instance can broadcast to any socket regardless of which server it's connected to. Horizontal scaling is configuration, not code.

**Q: What happens if the server crashes mid-session?**
Up to 5 seconds of canvas changes could be lost — the write-throttle interval. Redis persistence (AOF) would reduce this further. For zero data loss, you'd switch to synchronous writes and accept the latency tradeoff.

**Q: Why not use a database like PostgreSQL instead of MongoDB?**
Canvas state is a JSON blob — nodes and edges — that gets replaced wholesale on save. Document storage is a natural fit. If you needed to query individual nodes across canvases, a relational model would be better.

---

<div align="center">

Built as a portfolio project to demonstrate event-driven architecture, real-time systems, and performance optimization patterns.

</div>
