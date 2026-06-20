import mongoose from "mongoose";

// --- Node Sub-Schema ---
// Represents a single infrastructure node on the canvas
// e.g. a server, database, load balancer, cache
const NodeSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    type:     {
      type:    String,
      enum:    ["server", "database", "loadbalancer", "cache", "client"],
      default: "server",
    },
    x:        { type: Number, required: true },
    y:        { type: Number, required: true },
    capacity: { type: Number, default: 100 },
    label:    { type: String, default: "" },
  },
  { _id: false } // Don't create a separate _id for each node subdocument
);

// --- Edge Sub-Schema ---
// Represents a connection between two nodes
// load = traffic units flowing through this edge per tick
const EdgeSchema = new mongoose.Schema(
  {
    edgeId: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    load:   { type: Number, default: 20 },
  },
  { _id: false }
);

// --- Canvas Schema ---
const CanvasSchema = new mongoose.Schema(
  {
    // Unique identifier for the canvas room
    // This is the same canvasId used in Socket.IO rooms
    canvasId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    name: {
      type:    String,
      default: "Untitled Canvas",
      trim:    true,
    },

    nodes: {
      type:    [NodeSchema],
      default: [],
    },

    edges: {
      type:    [EdgeSchema],
      default: [],
    },

    // Tracks when the canvas was last modified
    // Updated every time we flush from memory to MongoDB
    lastFlushedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

export default mongoose.model("Canvas", CanvasSchema);