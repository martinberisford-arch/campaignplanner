import { Redis } from '@upstash/redis';

const STATE_KEY = 'campaignos:state';
const VERSION_KEY = 'campaignos:version';

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redis = getRedis();

  if (!redis) {
    return res.status(200).json({
      ok: false,
      localOnly: true,
      message: 'Upstash Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables in Vercel.',
    });
  }

  try {
    // GET - Fetch current state
    if (req.method === 'GET') {
      const clientVersion = parseInt(req.query?.version as string) || 0;

      const serverVersion = (await redis.get<number>(VERSION_KEY)) || 0;

      // Client is up to date
      if (clientVersion >= serverVersion && clientVersion > 0) {
        return res.status(200).json({ changed: false, version: serverVersion });
      }

      // Fetch state
      const state = await redis.get(STATE_KEY);

      if (!state) {
        return res.status(200).json({ changed: false, version: 0, empty: true });
      }

      return res.status(200).json({
        changed: true,
        version: serverVersion,
        state,
      });
    }

    // POST - Save state
    if (req.method === 'POST') {
      const { state } = req.body;

      if (!state) {
        return res.status(400).json({ ok: false, error: 'No state provided' });
      }

      // Atomic: set state + increment version
      const pipeline = redis.pipeline();
      pipeline.set(STATE_KEY, state);
      pipeline.incr(VERSION_KEY);
      const results = await pipeline.exec();

      const newVersion = results[1] as number;

      return res.status(200).json({ ok: true, version: newVersion });
    }

    // DELETE - Reset state (admin only, useful for debugging)
    if (req.method === 'DELETE') {
      await redis.del(STATE_KEY);
      await redis.del(VERSION_KEY);
      return res.status(200).json({ ok: true, message: 'State reset' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Redis error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Server error',
      message: error?.message || 'Unknown error',
    });
  }
}
