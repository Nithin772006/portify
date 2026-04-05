import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/ai/analyze-field
router.post('/analyze-field', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, fieldName, profession } = req.body;

    if (!text || !fieldName) {
      res.status(400).json({ error: 'Text and fieldName are required' });
      return;
    }

    const issues: Array<{ type: string; message: string }> = [];
    const words = text.split(/\s+/).filter((w: string) => w.length > 0);
    const wordCount = words.length;

    // Rule-based checks
    if (fieldName === 'bio' || fieldName === 'description') {
      if (wordCount < 20) {
        issues.push({ type: 'length', message: 'Too short. Aim for at least 40 words for maximum impact.' });
      }
      if (wordCount > 150) {
        issues.push({ type: 'length', message: 'Consider trimming. Recruiters spend 6 seconds scanning.' });
      }

      // Check for passive voice indicators
      const passivePatterns = /\b(was|were|been|being|is|are|am)\s+(being\s+)?\w+ed\b/gi;
      if (passivePatterns.test(text)) {
        issues.push({ type: 'passive-voice', message: 'Use active voice. Replace "was developed" with "developed".' });
      }

      // Check for metrics/numbers
      if (!/\d+/.test(text)) {
        issues.push({ type: 'metrics', message: 'Add quantifiable metrics. Numbers make your impact concrete.' });
      }

      // Check for action verbs
      const actionVerbs = /\b(built|led|improved|reduced|scaled|created|designed|managed|developed|launched|optimized|implemented|architected|delivered|automated|mentored)\b/i;
      if (!actionVerbs.test(text)) {
        issues.push({ type: 'action-words', message: 'Start sentences with action verbs like "Built", "Led", "Scaled".' });
      }

      // Check for vague language
      const vagueWords = /\b(various|many|several|some|stuff|things|good|nice|great|very)\b/gi;
      const vagueMatches = text.match(vagueWords);
      if (vagueMatches && vagueMatches.length > 0) {
        issues.push({ type: 'vague', message: `Replace vague words (${vagueMatches.slice(0, 3).join(', ')}) with specifics.` });
      }
    }

    // Generate rewrite suggestion
    let rewrite = '';
    if (wordCount > 20) {
      // Try OpenAI if available, otherwise provide a rule-based suggestion
      try {
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-key') {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const completion = await Promise.race([
            openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional ${profession || 'career'} portfolio writer. Rewrite the following ${fieldName} to be more impactful, ATS-friendly, and concise (under 80 words). Use active voice.`,
                },
                { role: 'user', content: text },
              ],
              max_tokens: 200,
              temperature: 0.7,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
          ]) as any;

          rewrite = completion.choices[0]?.message?.content || '';
        }
      } catch {
        // Fallback: no rewrite on error
      }
    }

    res.json({ issues, rewrite, wordCount });
  } catch (err) {
    console.error('Analyze field error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// POST /api/ai/match-jd
router.post('/match-jd', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { portfolioId, jdText } = req.body;

    if (!jdText) {
      res.status(400).json({ error: 'Job description text is required' });
      return;
    }

    const { extractSkillsFromJD, compareSkills } = await import('../utils/nlp');
    const Portfolio = (await import('../models/Portfolio')).default;

    const portfolio = await Portfolio.findOne({ portfolioId });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const jdSkills = extractSkillsFromJD(jdText);
    const userSkills = portfolio.formData.skills || [];
    const { matched, missing } = compareSkills(userSkills, jdSkills);

    const matchPercentage = jdSkills.length > 0
      ? Math.round((matched.length / jdSkills.length) * 100)
      : 0;

    // Try to get AI-rewritten project descriptions
    let rewrittenProjects: any[] = [];
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-key') {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const projects = portfolio.formData.projects?.slice(0, 2) || [];
        for (const project of projects) {
          const completion = await Promise.race([
            openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `Rewrite this project description to align with the following job description. Emphasize relevant skills and impact. Keep under 60 words. Job description: ${jdText.substring(0, 500)}`,
                },
                { role: 'user', content: project.description || '' },
              ],
              max_tokens: 150,
              temperature: 0.7,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
          ]) as any;

          rewrittenProjects.push({
            title: project.title,
            original: project.description,
            rewritten: completion.choices[0]?.message?.content || project.description,
          });
        }
      }
    } catch {
      // Fallback: return originals
    }

    res.json({
      matchPercentage,
      matchedSkills: matched,
      missingSkills: missing,
      rewrittenProjects,
      totalJdSkills: jdSkills.length,
    });
  } catch (err) {
    console.error('Match JD error:', err);
    res.status(500).json({ error: 'JD matching failed' });
  }
});

// POST /api/ai/chat-design
router.post('/chat-design', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { portfolioId, prompt, history } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const Portfolio = (await import('../models/Portfolio')).default;
    const portfolio = await Portfolio.findOne({ portfolioId });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-key') {
      res.status(500).json({ error: 'OpenAI API key not configured' });
      return;
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      {
        role: 'system',
        content: `You are an expert UI/UX designer and web developer AI agent for Portify. Your job is to help users customize their portfolio's design through custom CSS overrides. The user's portfolio ID is ${portfolioId}.
Current profession template: ${portfolio.formData?.profession || portfolio.profession}
You can use the apply_design function to inject CSS directly into the user's portfolio. Respond conversationally but when they ask for a design change (like "make it dark", "change font to Inter", "import a dribbble style", "make borders rounded"), call the apply_design function with the appropriate CSS overrides. Examples of CSS you could inject:
:root { --bg-color: #000; } 
body { background: #111 !important; color: #fff !important; font-family: 'Inter', sans-serif !important; }
.project-card { border-radius: 16px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important; }
You can also reference external fonts via @import inside the CSS.`
      },
      ...(history || []),
      { role: 'user', content: prompt }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "apply_design",
            description: "Applies custom CSS to the user's portfolio.",
            parameters: {
              type: "object",
              properties: {
                customCss: {
                  type: "string",
                  description: "The raw CSS string to be injected into the <style> of the portfolio."
                },
                explanation: {
                  type: "string",
                  description: "A brief conversational explanation of what was changed."
                }
              },
              required: ["customCss", "explanation"]
            }
          }
        }
      ],
      temperature: 0.7,
    });

    const responseMessage = response.choices[0].message;
    
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'apply_design') {
        const args = JSON.parse(toolCall.function.arguments);
        
        const currentCss = portfolio.formData.customCss || '';
        portfolio.formData.customCss = currentCss + '\n' + args.customCss;
        
        // Save old version
        portfolio.versions.push({
          id: portfolio.portfolioId,
          htmlPath: portfolio.htmlPath,
          createdAt: new Date(),
        });
        
        // Generate new ID
        const { nanoid } = await import('nanoid');
        const newId = nanoid(12);
        portfolio.portfolioId = newId;

        // Ensure mongoose saves the mixed type modification
        portfolio.markModified('formData');
        
        const { compileTemplate, writePortfolioHTML, getTemplateForProfession } = await import('../utils/templateEngine');
        const templateName = getTemplateForProfession(portfolio.profession);
        const html = compileTemplate(templateName, { ...portfolio.formData, portfolioId: newId, customCss: portfolio.formData.customCss });
        const htmlPath = writePortfolioHTML(newId, html);

        portfolio.htmlPath = htmlPath;
        await portfolio.save();

        res.json({
          reply: args.explanation + ' (Design updated!)',
          designApplied: true,
        });
        return;
      }
    }

    res.json({
      reply: responseMessage.content,
      designApplied: false
    });
  } catch (err) {
    console.error('Chat design error:', err);
    res.status(500).json({ error: 'Chat design failed' });
  }
});

export default router;
