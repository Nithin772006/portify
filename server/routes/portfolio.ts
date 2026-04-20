import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { scorePortfolio } from '../utils/scorer';
import { createPortfolioZipBundle } from '../utils/portfolioZipExport';
import { buildPortfolioDocument } from '../utils/portfolio3d';
import { getPortfolioHTMLPath } from '../utils/templateEngine';
import Portfolio from '../models/Portfolio';
import AnalyticsEvent from '../models/AnalyticsEvent';
import { resolvePortfolioTheme } from '../services/portfolioThemes';

const router = Router();
const archiver: any = require('archiver');

function getPublicPortfolioUrl(portfolioId: string): string {
  return `/p/${portfolioId}`;
}

function getRequestBaseUrl(req: Request): string {
  const host = req.get('host') || 'localhost:3001';
  return `${req.protocol}://${host}`;
}

function normalizeProfession(value: unknown): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().toLowerCase().replace(/\s+/g, '-')
    : 'software-engineer';
}

function deleteFileIfExists(filePath?: string | null) {
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }

  fs.unlinkSync(filePath);
}

function getPortfolioThemeId(portfolio: any) {
  return typeof portfolio?.themeId === 'string' && portfolio.themeId.trim()
    ? portfolio.themeId.trim()
    : typeof portfolio?.formData?.themeId === 'string' && portfolio.formData.themeId.trim()
      ? portfolio.formData.themeId.trim()
      : '';
}

function serializePortfolio(portfolio: any) {
  return {
    portfolioId: portfolio.portfolioId,
    profession: portfolio.profession,
    themeId: getPortfolioThemeId(portfolio),
    score: portfolio.score,
    breakdown: portfolio.breakdown,
    suggestions: portfolio.suggestions,
    formData: portfolio.formData,
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,
  };
}

async function ensureGeneratedPortfolio(portfolio: any, req: Request) {
  if (portfolio.generatedHTML && portfolio.generatedContent) {
    return portfolio;
  }

  const bundle = await buildPortfolioDocument(portfolio.formData || {}, {
    portfolioId: portfolio.portfolioId,
    profession: portfolio.profession,
    themeId: getPortfolioThemeId(portfolio),
    baseUrl: getRequestBaseUrl(req),
    cookieHeader: req.headers.cookie,
  });

  portfolio.generatedContent = bundle.generatedContent;
  portfolio.generatedHTML = bundle.generatedHTML;
  await portfolio.save();
  return portfolio;
}

// POST /api/portfolio/generate
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const incomingFormData = req.body || {};
    const userId = req.userId;
    const profession = normalizeProfession(incomingFormData.profession);
    let portfolio = await Portfolio.findOne({ userId });
    const portfolioId = portfolio?.portfolioId || nanoid(12);
    const resolvedTheme = await resolvePortfolioTheme(incomingFormData.themeId);
    const formData = {
      ...incomingFormData,
      themeId: resolvedTheme.id,
    };

    const { total, breakdown, suggestions } = scorePortfolio(formData, profession);
    const bundle = await buildPortfolioDocument(formData, {
      portfolioId,
      profession,
      themeId: resolvedTheme.id,
      baseUrl: getRequestBaseUrl(req),
      cookieHeader: req.headers.cookie,
    });

    if (portfolio) {
      portfolio.profession = profession;
      portfolio.themeId = resolvedTheme.id;
      portfolio.formData = formData;
      portfolio.generatedContent = bundle.generatedContent;
      portfolio.generatedHTML = bundle.generatedHTML;
      portfolio.score = total;
      portfolio.breakdown = breakdown;
      portfolio.suggestions = suggestions;
      portfolio.htmlPath = '';
      await portfolio.save();
    } else {
      portfolio = await Portfolio.create({
        userId,
        portfolioId,
        profession,
        themeId: resolvedTheme.id,
        formData,
        generatedContent: bundle.generatedContent,
        generatedHTML: bundle.generatedHTML,
        score: total,
        breakdown,
        suggestions,
        htmlPath: '',
        versions: [],
      });
    }

    res.json({
      portfolio: serializePortfolio(portfolio),
      generatedHTML: bundle.generatedHTML,
      portfolioId,
      portfolioUrl: getPublicPortfolioUrl(portfolioId),
      score: total,
      breakdown,
      suggestions,
    });
  } catch (err) {
    console.error('Generate portfolio error:', err);
    res.status(500).json({ error: 'Portfolio generation failed. Please try again.' });
  }
});

// GET /api/portfolio/user/me
router.get('/user/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ error: 'No portfolio found' });
      return;
    }
    res.json(serializePortfolio(portfolio));
  } catch {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// GET /api/portfolio/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ portfolioId: req.params.id });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }
    res.json(serializePortfolio(portfolio));
  } catch {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// POST /api/portfolio/:id/export/zip
router.post('/:id/export/zip', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let portfolio = await Portfolio.findOne({ portfolioId: req.params.id, userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    portfolio = await ensureGeneratedPortfolio(portfolio, req);
    const bundle = await createPortfolioZipBundle(portfolio as any);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${bundle.zipFileName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('warning', (warning: Error) => {
      console.warn('ZIP export warning:', warning.message);
    });
    archive.on('error', (error: Error) => {
      console.error('ZIP export error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to export portfolio ZIP' });
        return;
      }
      res.destroy(error);
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        archive.abort();
      }
    });

    archive.pipe(res);

    const root = `${bundle.rootFolder}/`;
    archive.append(bundle.indexHtml, { name: `${root}index.html` });
    archive.append(bundle.readme, { name: `${root}README.md` });
    archive.append(bundle.avatarBuffer, { name: `${root}assets/avatar.jpg` });

    void archive.finalize();
  } catch (err) {
    console.error('Export ZIP error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export portfolio ZIP' });
    }
  }
});

// PUT /api/portfolio/:id/regenerate
router.put('/:id/regenerate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ portfolioId: req.params.id, userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const incomingFormData = req.body.formData || portfolio.formData || {};
    const profession = normalizeProfession(portfolio.profession || incomingFormData.profession);
    const resolvedTheme = await resolvePortfolioTheme(incomingFormData.themeId || getPortfolioThemeId(portfolio));
    const formData = {
      ...incomingFormData,
      themeId: resolvedTheme.id,
    };
    const { total, breakdown, suggestions } = scorePortfolio(formData, profession);
    const bundle = await buildPortfolioDocument(formData, {
      portfolioId: portfolio.portfolioId,
      profession,
      themeId: resolvedTheme.id,
      baseUrl: getRequestBaseUrl(req),
      cookieHeader: req.headers.cookie,
    });

    portfolio.profession = profession;
    portfolio.themeId = resolvedTheme.id;
    portfolio.formData = formData;
    portfolio.generatedContent = bundle.generatedContent;
    portfolio.generatedHTML = bundle.generatedHTML;
    portfolio.score = total;
    portfolio.breakdown = breakdown;
    portfolio.suggestions = suggestions;
    portfolio.htmlPath = '';
    await portfolio.save();

    res.json({
      portfolio: serializePortfolio(portfolio),
      generatedHTML: bundle.generatedHTML,
      portfolioId: portfolio.portfolioId,
      portfolioUrl: getPublicPortfolioUrl(portfolio.portfolioId),
      score: total,
      breakdown,
      suggestions,
    });
  } catch (err) {
    console.error('Regenerate error:', err);
    res.status(500).json({ error: 'Regeneration failed' });
  }
});

// PUT /api/portfolio/:id/theme
router.put('/:id/theme', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ portfolioId: req.params.id, userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const requestedThemeId = typeof req.body?.themeId === 'string' ? req.body.themeId.trim() : '';
    if (!requestedThemeId) {
      res.status(400).json({ error: 'themeId is required' });
      return;
    }

    const resolvedTheme = await resolvePortfolioTheme(requestedThemeId);
    const formData: Record<string, any> = {
      ...(portfolio.formData || {}),
      themeId: resolvedTheme.id,
    };
    const profession = normalizeProfession(portfolio.profession || formData.profession);
    const { total, breakdown, suggestions } = scorePortfolio(formData, profession);
    const bundle = await buildPortfolioDocument(formData, {
      portfolioId: portfolio.portfolioId,
      profession,
      themeId: resolvedTheme.id,
      baseUrl: getRequestBaseUrl(req),
      cookieHeader: req.headers.cookie,
    });

    portfolio.profession = profession;
    portfolio.themeId = resolvedTheme.id;
    portfolio.formData = formData;
    portfolio.generatedContent = bundle.generatedContent;
    portfolio.generatedHTML = bundle.generatedHTML;
    portfolio.score = total;
    portfolio.breakdown = breakdown;
    portfolio.suggestions = suggestions;
    portfolio.htmlPath = '';
    await portfolio.save();

    res.json({
      portfolio: serializePortfolio(portfolio),
      generatedHTML: bundle.generatedHTML,
      portfolioId: portfolio.portfolioId,
      portfolioUrl: getPublicPortfolioUrl(portfolio.portfolioId),
      themeId: resolvedTheme.id,
      score: total,
      breakdown,
      suggestions,
    });
  } catch (err) {
    console.error('Update theme error:', err);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// DELETE /api/portfolio/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ portfolioId: req.params.id, userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const filePaths = new Set<string>();
    if (portfolio.htmlPath) {
      filePaths.add(portfolio.htmlPath);
    }
    filePaths.add(getPortfolioHTMLPath(portfolio.portfolioId));
    for (const version of portfolio.versions || []) {
      if (version.htmlPath) {
        filePaths.add(version.htmlPath);
      }
    }

    await Promise.all([
      AnalyticsEvent.deleteMany({ portfolioId: portfolio.portfolioId }),
      Portfolio.deleteOne({ _id: portfolio._id }),
    ]);

    for (const filePath of filePaths) {
      try {
        deleteFileIfExists(filePath);
      } catch (fileError) {
        console.warn(`Failed to remove generated portfolio file: ${filePath}`, fileError);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete portfolio error:', err);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

export default router;
