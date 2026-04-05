import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { scorePortfolio } from '../utils/scorer';
import { getTemplateForProfession, compileTemplate, writePortfolioHTML } from '../utils/templateEngine';
import Portfolio from '../models/Portfolio';

const router = Router();

// POST /api/portfolio/generate
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const formData = req.body;
    const userId = req.userId;
    const profession = formData.profession || 'software-engineer';
    const profKey = profession.toLowerCase().replace(/\s+/g, '-');

    // Step 1: Score
    const { total, breakdown, suggestions } = scorePortfolio(formData, profKey);

    // Step 2: Enhance bio with AI if available
    let enhancedBio = formData.bio || '';
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-key' && formData.bio) {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await Promise.race([
          openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Rewrite this professional bio for a ${profession}. Make it impact-driven, ATS-friendly, and under 80 words. Use active voice and include metrics where possible.`,
              },
              { role: 'user', content: formData.bio },
            ],
            max_tokens: 200,
            temperature: 0.7,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
        ]) as any;

        enhancedBio = completion.choices[0]?.message?.content || formData.bio;
      }
    } catch {
      // Keep original bio
    }

    // Step 3: Select template
    const templateName = getTemplateForProfession(profKey);

    // Step 4: Compile template
    const portfolioId = nanoid(12);
    const templateData = {
      ...formData,
      bio: enhancedBio,
      portfolioId,
      skills: formData.skills || [],
      projects: formData.projects || [],
      experience: formData.experience || [],
      education: formData.education || {},
      currentYear: new Date().getFullYear(),
    };

    const html = compileTemplate(templateName, templateData);

    // Step 5: Write HTML file
    const htmlPath = writePortfolioHTML(portfolioId, html);

    // Step 6: Save to MongoDB
    // Check if user already has a portfolio
    let portfolio = await Portfolio.findOne({ userId });
    if (portfolio) {
      // Add as new version
      portfolio.versions.push({
        id: portfolio.portfolioId,
        htmlPath: portfolio.htmlPath,
        createdAt: new Date(),
      });
      portfolio.portfolioId = portfolioId;
      portfolio.profession = profKey;
      portfolio.formData = formData;
      portfolio.score = total;
      portfolio.breakdown = breakdown;
      portfolio.suggestions = suggestions;
      portfolio.htmlPath = htmlPath;
      await portfolio.save();
    } else {
      portfolio = await Portfolio.create({
        userId,
        portfolioId,
        profession: profKey,
        formData,
        score: total,
        breakdown,
        suggestions,
        htmlPath,
        versions: [],
      });
    }

    res.json({
      portfolioId,
      portfolioUrl: `/p/${portfolioId}`,
      score: total,
      breakdown,
      suggestions,
      enhancedBio,
    });
  } catch (err: any) {
    console.error('Generate portfolio error:', err);
    res.status(500).json({ error: 'Portfolio generation failed. Please try again.' });
  }
});

// GET /api/portfolio/user/me  — get current user's portfolio
router.get('/user/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ error: 'No portfolio found' });
      return;
    }
    res.json({
      portfolioId: portfolio.portfolioId,
      profession: portfolio.profession,
      score: portfolio.score,
      breakdown: portfolio.breakdown,
      suggestions: portfolio.suggestions,
      formData: portfolio.formData,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    });
  } catch (err) {
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
    res.json({
      portfolioId: portfolio.portfolioId,
      profession: portfolio.profession,
      score: portfolio.score,
      breakdown: portfolio.breakdown,
      suggestions: portfolio.suggestions,
      formData: portfolio.formData,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
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

    const formData = req.body.formData || portfolio.formData;
    const profKey = portfolio.profession;

    const { total, breakdown, suggestions } = scorePortfolio(formData, profKey);
    const templateName = getTemplateForProfession(profKey);
    const newId = nanoid(12);

    const templateData = {
      ...formData,
      portfolioId: newId,
      skills: formData.skills || [],
      projects: formData.projects || [],
      experience: formData.experience || [],
      education: formData.education || {},
      currentYear: new Date().getFullYear(),
    };

    const html = compileTemplate(templateName, templateData);
    const htmlPath = writePortfolioHTML(newId, html);

    // Save old version
    portfolio.versions.push({
      id: portfolio.portfolioId,
      htmlPath: portfolio.htmlPath,
      createdAt: new Date(),
    });

    portfolio.portfolioId = newId;
    portfolio.formData = formData;
    portfolio.score = total;
    portfolio.breakdown = breakdown;
    portfolio.suggestions = suggestions;
    portfolio.htmlPath = htmlPath;
    await portfolio.save();

    res.json({
      portfolioId: newId,
      portfolioUrl: `/p/${newId}`,
      score: total,
      breakdown,
      suggestions,
    });
  } catch (err) {
    console.error('Regenerate error:', err);
    res.status(500).json({ error: 'Regeneration failed' });
  }
});

export default router;
