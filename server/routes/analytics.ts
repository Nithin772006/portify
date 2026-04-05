import { Router, Request, Response } from 'express';
import AnalyticsEvent from '../models/AnalyticsEvent';
import Redis from 'ioredis';

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
    console.log('Redis not available, using MongoDB fallback');
    redis = null;
  });
} catch {
  redis = null;
}

function classifySource(referrer: string): string {
  if (!referrer || referrer === '') return 'direct';
  if (referrer.includes('linkedin')) return 'linkedin';
  if (referrer.includes('github')) return 'github';
  if (referrer.includes('google') || referrer.includes('bing')) return 'search';
  if (referrer.includes('twitter') || referrer.includes('x.com')) return 'twitter';
  return 'other';
}

function parseDevice(userAgent: string): string {
  if (!userAgent) return 'unknown';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

// POST /api/analytics/pageview
router.post('/pageview', async (req: Request, res: Response) => {
  try {
    const { portfolioId, referrer, sessionId, userAgent, timestamp } = req.body;

    if (!portfolioId || !sessionId) {
      res.status(400).json({ error: 'portfolioId and sessionId are required' });
      return;
    }

    const source = classifySource(referrer || '');
    const device = parseDevice(userAgent || req.headers['user-agent'] || '');

    // Redis counters (with fallback)
    if (redis) {
      try {
        await redis.incr(`views:${portfolioId}:total`);
        await redis.incr(`views:${portfolioId}:${source}`);
        await redis.sadd(`sessions:${portfolioId}`, sessionId);
      } catch {
        // Redis failed, skip
      }
    }

    // Write to MongoDB
    await AnalyticsEvent.create({
      portfolioId,
      type: 'pageview',
      source,
      device,
      sessionId,
      timestamp: timestamp || new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Pageview tracking error:', err);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

// POST /api/analytics/section-view
router.post('/section-view', async (req: Request, res: Response) => {
  try {
    const { portfolioId, section, timeSpentMs, sessionId } = req.body;

    if (!portfolioId || !section || !sessionId) {
      res.status(400).json({ error: 'portfolioId, section, and sessionId are required' });
      return;
    }

    await AnalyticsEvent.create({
      portfolioId,
      type: 'section-view',
      section,
      timeSpentMs: timeSpentMs || 0,
      sessionId,
      source: 'internal',
      device: 'unknown',
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Section view tracking error:', err);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

// GET /api/analytics/:portfolioId
router.get('/:portfolioId', async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;

    // Total views
    let totalViews = 0;
    let uniqueVisitors = 0;

    if (redis) {
      try {
        totalViews = parseInt(await redis.get(`views:${portfolioId}:total`) || '0');
        uniqueVisitors = await redis.scard(`sessions:${portfolioId}`);
      } catch {
        // Fallback to MongoDB
      }
    }

    if (!totalViews) {
      totalViews = await AnalyticsEvent.countDocuments({ portfolioId, type: 'pageview' });
      const uniqueSessions = await AnalyticsEvent.distinct('sessionId', { portfolioId, type: 'pageview' });
      uniqueVisitors = uniqueSessions.length;
    }

    // Views by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyViews = await AnalyticsEvent.aggregate([
      {
        $match: {
          portfolioId,
          type: 'pageview',
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Views by source
    const sourceBreakdown = await AnalyticsEvent.aggregate([
      { $match: { portfolioId, type: 'pageview' } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    // Avg time per section
    const sectionStats = await AnalyticsEvent.aggregate([
      { $match: { portfolioId, type: 'section-view' } },
      {
        $group: {
          _id: '$section',
          avgTime: { $avg: '$timeSpentMs' },
          totalViews: { $sum: 1 },
        },
      },
    ]);

    // Device breakdown
    const deviceBreakdown = await AnalyticsEvent.aggregate([
      { $match: { portfolioId, type: 'pageview' } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]);

    res.json({
      totalViews,
      uniqueVisitors,
      dailyViews: dailyViews.map(d => ({ date: d._id, views: d.count })),
      sourceBreakdown: sourceBreakdown.map(s => ({ source: s._id, count: s.count })),
      sectionStats: sectionStats.map(s => ({ section: s._id, avgTimeMs: Math.round(s.avgTime), totalViews: s.totalViews })),
      deviceBreakdown: deviceBreakdown.map(d => ({ device: d._id, count: d.count })),
      avgTimeOnPage: sectionStats.reduce((sum, s) => sum + (s.avgTime || 0), 0) / 1000,
    });
  } catch (err) {
    console.error('Analytics fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
