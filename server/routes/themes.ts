import { Router, Request, Response } from 'express';
import { getDefaultPortfolioThemeId, listPortfolioThemes } from '../services/portfolioThemes';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const themes = await listPortfolioThemes();
    res.json({
      themes,
      defaultThemeId: getDefaultPortfolioThemeId(),
    });
  } catch (error) {
    console.error('Failed to fetch portfolio themes:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio themes' });
  }
});

export default router;
