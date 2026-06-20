import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(uri);
    console.log("[MongoDB] Connected successfully");
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Lost connection");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Reconnected");
  });
}