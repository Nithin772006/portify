import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Portfolio from '../models/Portfolio';
import Redis from 'ioredis';
import trendingSkills from '../config/skills/trending.json';

const router = Router();

let redis: Redis | null = null;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });
  redis.connect().catch(() => {
    redis = null;
  });
} catch {
  redis = null;
}

// GET /api/skills/trending?city=X&role=Y
router.get('/trending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const city = ((req.query.city as string) || 'default').toLowerCase().replace(/\s+/g, '-');
    const role = ((req.query.role as string) || 'default').toLowerCase().replace(/\s+/g, '-');

    // Check Redis cache
    const cacheKey = `skills:${role}:${city}`;
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          // Add user's skills comparison
          const portfolio = await Portfolio.findOne({ userId: req.userId });
          const userSkills = (portfolio?.formData?.skills || []).map((s: string) => s.toLowerCase());
          data.userHas = userSkills;
          res.json(data);
          return;
        }
      } catch {
        // Cache miss or error
      }
    }

    // Load from static JSON
    const skillsData = trendingSkills as Record<string, Record<string, Array<{ skill: string; demandPercentage: number }>>>;
    const roleData = skillsData[role] || skillsData['default'] || {};
    const cityData = roleData[city] || roleData['default'] || [];

    const result = {
      trending: cityData,
      emerging: cityData.slice(-3).map(s => ({ ...s, demandPercentage: s.demandPercentage - 15 })),
      userHas: [] as string[],
    };

    // Cache in Redis for 24h
    if (redis) {
      try {
        await redis.setex(cacheKey, 86400, JSON.stringify(result));
      } catch {
        // Redis unavailable, skip
      }
    }

    // Add user's skills
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    const userSkills = (portfolio?.formData?.skills || []).map((s: string) => s.toLowerCase());
    result.userHas = userSkills;

    res.json(result);
  } catch (err) {
    console.error('Trending skills error:', err);
    res.status(500).json({ error: 'Failed to fetch trending skills' });
  }
});

export default router;
