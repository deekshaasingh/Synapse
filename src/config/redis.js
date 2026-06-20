import Redis from "ioredis";

export async function createRedisClients() {
  const config = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    retryStrategy(times) {
      // Reconnect after min(100ms * attempt, 3 seconds)
      const delay = Math.min(times * 100, 3000);
      console.warn(`[Redis] Retrying connection... attempt ${times} (delay: ${delay}ms)`);
      return delay;
    },
    maxRetriesPerRequest: null,
  };

  const pubClient = new Redis(config);
  const subClient = pubClient.duplicate();

  await Promise.all([
    waitForConnection(pubClient, "pubClient"),
    waitForConnection(subClient, "subClient"),
  ]);

  return { pubClient, subClient };
}

function waitForConnection(client, name) {
  return new Promise((resolve, reject) => {
    // Already connected
    if (client.status === "ready") return resolve();

    client.once("ready", () => {
      console.log(`[Redis] ${name} connected successfully`);
      resolve();
    });

    client.once("error", (err) => {
      console.error(`[Redis] ${name} connection failed:`, err.message);
      reject(err);
    });
  });
}