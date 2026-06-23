import Redis from "ioredis";

let redisClient = null;

function createClient() {
  if (process.env.REDIS_URL) {
    // Upstash / cloud Redis — TLS connection via URL
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        console.warn(`[Redis] Retrying... attempt ${times} (delay: ${delay}ms)`);
        return delay;
      },
    });
  }

  // Local Redis — host/port config
  return new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      console.warn(`[Redis] Retrying... attempt ${times} (delay: ${delay}ms)`);
      return delay;
    },
  });
}

export async function createRedisClients() {
  const pubClient = createClient();
  const subClient = pubClient.duplicate();

  redisClient = pubClient;

  await Promise.all([
    waitForConnection(pubClient, "pubClient"),
    waitForConnection(subClient, "subClient"),
  ]);

  return { pubClient, subClient };
}

// Returns the shared Redis client for use in routes and utils
export function getRedisClient() {
  if (!redisClient) throw new Error("[Redis] Client not initialized yet.");
  return redisClient;
}

function waitForConnection(client, name) {
  return new Promise((resolve, reject) => {
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