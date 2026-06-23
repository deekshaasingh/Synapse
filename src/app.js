import express from "express";
import cors from "cors";
import canvasRoutes from "./routes/canvas.js";

const app = express();

// --- CORS ---
// Only accepts requests from our frontend origin defined in .env
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

// --- Body Parsing ---
// Parses incoming JSON payloads — required for any POST request with a body
app.use(express.json());

// --- API Routes ---
app.use("/api/canvas", canvasRoutes);

// --- Health Check Route ---
// Load balancers and uptime monitors ping this to verify the server is alive
// This should always respond instantly with no DB or Redis involvement
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    project: "Synapse",
    timestamp: new Date().toISOString(),
  });
});

// --- 404 Handler ---
// Any request that doesn't match a route falls through to here
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global Error Handler ---
// Express identifies this as an error handler because it has 4 parameters
// Any next(err) call anywhere in the app lands here
app.use((err, req, res, next) => {
  console.error("[Express] Unhandled error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

export default app;