import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Portfolio from '../models/Portfolio';
import { buildPortfolioDocument, renderPortfolioHtml } from '../utils/portfolio3d';
import { extractSkillsFromJD, compareSkills } from '../utils/nlp';

const router = Router();

type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };
type ChatAction = 'reply' | 'apply_css' | 'update_content';
type CssBlockId = 'theme' | 'typography' | 'radius' | 'spacing' | 'style';

const EDITABLE_FIELDS = ['name', 'title', 'bio', 'location', 'email', 'phone', 'linkedin', 'github'] as const;

type PortfolioUpdates = Partial<Record<(typeof EDITABLE_FIELDS)[number], string>>;
type AssistantPayload = {
  reply: string;
  action: ChatAction;
  customCss: string;
  updates: PortfolioUpdates;
  cssBlockId?: CssBlockId | null;
};

const STYLE_REQUEST_RE = /\b(theme|restyle|redesign|font|typography|background|color|layout|spacing|rounded|corner|shadow|border|button|card|section|light|dark|white|black|minimal|modern)\b/i;
const FORCE_LOCAL_STYLE_RE = /\b(theme|restyle|redesign|font|typography|spacing|padding|rounded|corner|radius|light|dark|white|black|minimal|modern)\b/i;

const PORTFOLIO_SYSTEM_PROMPT = [
  'You are Portify Copilot, an AI assistant for portfolio creation.',
  'You can answer general questions, explain portfolio choices, give writing advice, suggest improvements, and apply edits when the user explicitly asks to change the portfolio.',
  'Respond with strict JSON only.',
  'Use this schema:',
  '{"reply": string, "action": "reply" | "apply_css" | "update_content", "customCss": string, "updates": {"name"?: string, "title"?: string, "bio"?: string, "location"?: string, "email"?: string, "phone"?: string, "linkedin"?: string, "github"?: string}}.',
  'Use action="reply" for normal questions, explanations, suggestions, brainstorming, and analysis.',
  'Use action="apply_css" only when the user clearly wants visual or layout changes to the portfolio site. Return CSS only in customCss, with no markdown and no <style> tags.',
  'Use action="update_content" only when the user clearly wants a top-level portfolio field changed. Only update the allowed fields in the schema.',
  'Be concise, accurate, and practical. Do not fabricate portfolio facts that are not present in context.',
  'For CSS, target safe selectors such as body, .container, .header, .hero, .sidebar, .main, .section, .main-section, .project-card, .project-item, .project-entry, .skill-tag, .links a, .footer.',
].join(' ');

const SURFACE_RESET_SELECTORS = ['.container', '.main', '.content', '.header', '.hero', '.section', '.main-section', '.bio-section', '.contact', '.footer'].join(',');
const CARD_SELECTORS = ['.sidebar', '.project-card', '.project-item', '.project-entry', '.card', '.avatar', '.project-img'].join(',');
const HEADING_SELECTORS = ['.name', '.hero-name', '.sidebar-name', '.project-title', '.project-info h3', '.exp-role', '.timeline-role', '.edu-degree', 'h1', 'h2', 'h3', 'h4'].join(',');
const MUTED_SELECTORS = ['.title-text', '.hero-title', '.sidebar-title', '.location', '.hero-location', '.section-title', '.main-label', '.section-label', '.sidebar-section h3', '.timeline-date', '.exp-date', '.edu-year', '.footer'].join(',');
const BODY_TEXT_SELECTORS = ['p', 'span', 'li', '.bio', '.bio-text', '.bio-section', '.project-desc', '.project-info p', '.timeline-desc', '.timeline-company', '.exp-desc', '.exp-company', '.edu-school', '.contact-email', '.contact-list li', '.skills-list span'].join(',');
const LINK_SELECTORS = ['a', '.links a', '.hero-links a', '.project-links a', '.project-meta a', '.contact-list li a'].join(',');
const TAG_SELECTORS = ['.skill-tag', '.sidebar-skills span', '.badge', '.tag', '.project-tech span'].join(',');

function getRequestBaseUrl(req: Request): string {
  const host = req.get('host') || 'localhost:3001';
  return `${req.protocol}://${host}`;
}

function getPortfolioThemeId(portfolio: any) {
  return typeof portfolio?.themeId === 'string' && portfolio.themeId.trim()
    ? portfolio.themeId.trim()
    : typeof portfolio?.formData?.themeId === 'string' && portfolio.formData.themeId.trim()
      ? portfolio.formData.themeId.trim()
      : '';
}

async function updateStoredPortfolioDocument(portfolio: any, req: Request, forceFullRebuild: boolean) {
  if (forceFullRebuild || !portfolio.generatedContent) {
    const bundle = await buildPortfolioDocument(portfolio.formData || {}, {
      portfolioId: portfolio.portfolioId,
      profession: portfolio.profession,
      themeId: getPortfolioThemeId(portfolio),
      baseUrl: getRequestBaseUrl(req),
      cookieHeader: req.headers.cookie,
    });
    portfolio.generatedContent = bundle.generatedContent;
    portfolio.generatedHTML = bundle.generatedHTML;
    portfolio.htmlPath = '';
    return;
  }

  portfolio.generatedContent = {
    ...portfolio.generatedContent,
    customCss: typeof portfolio.formData?.customCss === 'string' ? portfolio.formData.customCss : '',
  };
  portfolio.generatedHTML = renderPortfolioHtml(portfolio.generatedContent);
  portfolio.htmlPath = '';
}

function sanitizeCss(rawCss: string): string {
  return rawCss.replace(/```css|```/gi, '').replace(/<\/?style[^>]*>/gi, '').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mergeCustomCss(currentCss: string, incomingCss: string, cssBlockId: CssBlockId | null = null): string {
  const nextCss = sanitizeCss(incomingCss);
  if (!nextCss) return currentCss;
  if (!cssBlockId) {
    return [currentCss, nextCss].filter(Boolean).join('\n\n').trim();
  }

  const startMarker = `/* portify:${cssBlockId}:start */`;
  const endMarker = `/* portify:${cssBlockId}:end */`;
  const blockPattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\s*`, 'g');
  const cleanedCss = currentCss.replace(blockPattern, '').trim();
  const block = `${startMarker}\n${nextCss}\n${endMarker}`;

  return [cleanedCss, block].filter(Boolean).join('\n\n').trim();
}

function sanitizeTextValue(value: unknown, maxLength = 1200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function buildThemeCss(mode: 'light' | 'dark'): string {
  const palette = mode === 'light'
    ? {
        pageBg: '#f6f8fc',
        panel: '#ffffff',
        panelAlt: '#eef2ff',
        shadow: '0 12px 30px rgba(15,23,42,0.06)',
        border: 'rgba(15,23,42,0.14)',
        heading: '#0f172a',
        muted: '#475569',
        text: '#0f172a',
        textSoft: '#334155',
        accent: '#1d4ed8',
        accentBorder: 'rgba(37,99,235,0.18)',
        tagBg: '#eff6ff',
        tagText: '#1e3a8a',
      }
    : {
        pageBg: '#05070f',
        panel: 'rgba(15,23,42,0.62)',
        panelAlt: 'rgba(15,23,42,0.82)',
        shadow: '0 18px 42px rgba(2,6,23,0.34)',
        border: 'rgba(148,163,184,0.24)',
        heading: '#f8fafc',
        muted: '#94a3b8',
        text: '#f8fafc',
        textSoft: '#cbd5e1',
        accent: '#93c5fd',
        accentBorder: 'rgba(147,197,253,0.26)',
        tagBg: 'rgba(30,41,59,0.92)',
        tagText: '#dbeafe',
      };

  return [
    `body,.page{background:${palette.pageBg}!important;color:${palette.text}!important;}`,
    `${SURFACE_RESET_SELECTORS}{background:transparent!important;color:inherit!important;box-shadow:none!important;}`,
    `${CARD_SELECTORS}{background:${palette.panel}!important;border-color:${palette.border}!important;box-shadow:${palette.shadow}!important;}`,
    `.project-img{background:${palette.panelAlt}!important;color:${palette.muted}!important;}`,
    `.divider,.header,.hero,.section,.main-section,.bio,.bio-section,.contact,.sidebar,.footer,.exp-item,.timeline-item{border-color:${palette.border}!important;}`,
    `${HEADING_SELECTORS}{color:${palette.heading}!important;}`,
    `${MUTED_SELECTORS}{color:${palette.muted}!important;}`,
    `${BODY_TEXT_SELECTORS}{color:${palette.textSoft}!important;}`,
    `${LINK_SELECTORS}{color:${palette.accent}!important;border-color:${palette.accentBorder}!important;}`,
    `${TAG_SELECTORS}{background:${palette.tagBg}!important;color:${palette.tagText}!important;border-color:${palette.accentBorder}!important;}`,
    `input,textarea,button,select{color:${palette.text}!important;}`,
    `.timeline-item::before{background:${palette.heading}!important;}`,
  ].join('');
}

function normalizeUpdates(rawUpdates: unknown): PortfolioUpdates {
  if (!rawUpdates || typeof rawUpdates !== 'object') {
    return {};
  }

  const updates: PortfolioUpdates = {};
  for (const field of EDITABLE_FIELDS) {
    const value = sanitizeTextValue((rawUpdates as Record<string, unknown>)[field]);
    if (value) {
      updates[field] = value;
    }
  }

  return updates;
}

function parseAssistantPayload(rawContent: string): AssistantPayload | null {
  const parseObject = (text: string): AssistantPayload => {
    const parsed = JSON.parse(text);
    const updates = normalizeUpdates(parsed?.updates);
    const customCss = typeof parsed?.customCss === 'string' ? sanitizeCss(parsed.customCss) : '';
    const explicitAction = parsed?.action;
    const action: ChatAction =
      explicitAction === 'apply_css' || explicitAction === 'update_content' || explicitAction === 'reply'
        ? explicitAction
        : parsed?.applyChanges && customCss
          ? 'apply_css'
          : Object.keys(updates).length > 0
            ? 'update_content'
            : customCss
              ? 'apply_css'
              : 'reply';

    return {
      reply: typeof parsed?.reply === 'string' ? parsed.reply.trim() : '',
      action,
      customCss,
      updates,
      cssBlockId: null,
    };
  };

  try {
    return parseObject(rawContent);
  } catch {
    const jsonStart = rawContent.indexOf('{');
    const jsonEnd = rawContent.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd <= jsonStart) return null;
    try {
      return parseObject(rawContent.slice(jsonStart, jsonEnd + 1));
    } catch {
      return null;
    }
  }
}

function resolveCssBlockId(prompt: string, payload: AssistantPayload): CssBlockId | null {
  if (payload.cssBlockId) return payload.cssBlockId;
  if (!payload.customCss) return null;

  const normalizedPrompt = prompt.toLowerCase();
  if (/\bwhite\b|\blight\b|\bdark\b/.test(normalizedPrompt)) return 'theme';
  if (/\bfont\b|\btypography\b|\bserif\b|\beditorial\b|\belegant\b|\bmono(?:space)?\b|\bdeveloper\b/.test(normalizedPrompt)) return 'typography';
  if (/\bround(?:ed)?\b|\bcorners?\b|\bradius\b/.test(normalizedPrompt)) return 'radius';
  if (/\bcompact\b|\bspacing\b|\bpadding\b/.test(normalizedPrompt)) return 'spacing';
  if (STYLE_REQUEST_RE.test(normalizedPrompt)) return 'style';
  return null;
}

function buildPortfolioContext(formData: Record<string, any>, profession: string, currentCss: string): string {
  const summary = {
    profession,
    name: formData?.name || '',
    title: formData?.title || '',
    bio: formData?.bio || '',
    location: formData?.location || '',
    skills: Array.isArray(formData?.skills) ? formData.skills.slice(0, 12) : [],
    projects: Array.isArray(formData?.projects)
      ? formData.projects.slice(0, 3).map((project: any) => ({
          title: project?.title || '',
          description: project?.description || '',
          techStack: Array.isArray(project?.techStack) ? project.techStack.slice(0, 6) : [],
        }))
      : [],
    experience: Array.isArray(formData?.experience)
      ? formData.experience.slice(0, 3).map((item: any) => ({
          role: item?.role || '',
          company: item?.company || '',
          description: item?.description || '',
        }))
      : [],
    education: formData?.education || {},
    currentCssTail: currentCss ? currentCss.slice(-1800) : '',
  };

  return JSON.stringify(summary);
}

function getFontFallback(prompt: string): AssistantPayload {
  const p = prompt.toLowerCase();
  if (/\bmono|monospace|developer\b/.test(p)) {
    return {
      reply: 'Applied a monospace-forward typography style.',
      action: 'apply_css',
      customCss: [
        "body{font-family:'Segoe UI',system-ui,sans-serif;}",
        ".name,.hero-name,.sidebar-name,.section-title,.main-label,.links a,.skill-tag,.sidebar-skills span{font-family:Consolas,'Courier New',monospace;letter-spacing:0.02em;}",
      ].join(''),
      updates: {},
      cssBlockId: 'typography',
    };
  }

  if (/\bserif|editorial|elegant\b/.test(p)) {
    return {
      reply: 'Applied a more editorial font style with serif headings.',
      action: 'apply_css',
      customCss: [
        "body{font-family:system-ui,'Segoe UI',sans-serif;}",
        ".name,.hero-name,.sidebar-name,.project-title,.project-info h3,.section-title,.main-label{font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.02em;}",
      ].join(''),
      updates: {},
      cssBlockId: 'typography',
    };
  }

  return {
    reply: 'Applied stronger typography with cleaner heading and body font contrast.',
    action: 'apply_css',
    customCss: [
      "body{font-family:'Segoe UI',system-ui,sans-serif;}",
      ".name,.hero-name,.sidebar-name,.project-title,.project-info h3,.section-title,.main-label{font-family:'Trebuchet MS','Segoe UI',sans-serif;letter-spacing:-0.02em;font-weight:800;}",
    ].join(''),
    updates: {},
    cssBlockId: 'typography',
  };
}

function getLocalAssistantFallback(prompt: string, formData: Record<string, any>): AssistantPayload | null {
  const p = prompt.toLowerCase();

  if (/\bwhat can you do\b|\bhow can you help\b|\bhelp me\b/.test(p)) {
    return {
      reply: 'I can answer questions about your portfolio, suggest improvements, rewrite top-level profile fields, and apply visual edits like theme, fonts, spacing, and card styling.',
      action: 'reply',
      customCss: '',
      updates: {},
      cssBlockId: null,
    };
  }

  if (/\bwhite\b|\blight\b/.test(p)) {
    return {
      reply: 'Applied a light theme with darker text and cleaner cards.',
      action: 'apply_css',
      customCss: buildThemeCss('light'),
      updates: {},
      cssBlockId: 'theme',
    };
  }

  if (/\bdark\b/.test(p)) {
    return {
      reply: 'Applied a darker theme with higher contrast.',
      action: 'apply_css',
      customCss: buildThemeCss('dark'),
      updates: {},
      cssBlockId: 'theme',
    };
  }

  if (/\bfont\b|\btypography\b/.test(p)) {
    return getFontFallback(prompt);
  }

  if (/\bround(?:ed)?\b|\bcorners?\b|\bradius\b/.test(p)) {
    return {
      reply: 'Applied rounder corners across cards, pills, and action elements.',
      action: 'apply_css',
      customCss: [
        '.project-card,.project-item,.project-entry,.glass,.sidebar{border-radius:20px!important;}',
        '.skill-tag,.sidebar-skills span,.links a,.project-links a,button,input{border-radius:9999px!important;}',
      ].join(''),
      updates: {},
      cssBlockId: 'radius',
    };
  }

  if (/\bcompact\b|\bspacing\b|\bpadding\b/.test(p)) {
    return {
      reply: 'Adjusted the layout spacing to feel cleaner and more compact.',
      action: 'apply_css',
      customCss: [
        '.container,.main{max-width:960px!important;}',
        '.section,.main-section{padding-top:36px!important;padding-bottom:36px!important;}',
        '.project-card,.project-item,.project-entry{padding:20px!important;}',
      ].join(''),
      updates: {},
      cssBlockId: 'spacing',
    };
  }

  if (/\b(theme|restyle|redesign|make it look better|modernize)\b/.test(p)) {
    return {
      reply: 'Applied a refreshed theme with cleaner contrast, softer cards, and better spacing.',
      action: 'apply_css',
      customCss: [
        'body,.page{background:radial-gradient(circle at 0% 0%, #111827 0%, #0b1220 45%, #05070f 100%)!important;color:#f8fafc!important;}',
        `${SURFACE_RESET_SELECTORS}{background:transparent!important;}`,
        '.container,.main{max-width:980px!important;}',
        '.section,.main-section,.header,.sidebar,.footer{border-color:rgba(148,163,184,0.24)!important;}',
        '.project-card,.project-item,.project-entry,.sidebar,.avatar,.project-img{background:rgba(15,23,42,0.58)!important;border:1px solid rgba(148,163,184,0.28)!important;backdrop-filter:blur(4px);border-radius:14px;}',
        '.skill-tag,.sidebar-skills span,.links a,.hero-links a,.project-links a,.project-meta a{border-color:rgba(148,163,184,0.35)!important;color:#cbd5e1!important;}',
        '.name,.hero-name,.sidebar-name,.project-title,.project-info h3{letter-spacing:-0.02em;}',
      ].join(''),
      updates: {},
      cssBlockId: 'style',
    };
  }

  if (/\bskills?\b/.test(p) && Array.isArray(formData?.skills) && formData.skills.length > 0) {
    return {
      reply: `Your current portfolio highlights ${formData.skills.slice(0, 6).join(', ')}. If you want, I can help position those skills better for recruiters or suggest which ones to feature more prominently.`,
      action: 'reply',
      customCss: '',
      updates: {},
      cssBlockId: null,
    };
  }

  if (/\bbio\b|\babout me\b|\bsummary\b/.test(p)) {
    return {
      reply: 'A strong bio should be short, specific, and impact-driven. Mention your role, your strongest skills, and one or two concrete outcomes. If you want, ask me to rewrite your bio and I can update it directly.',
      action: 'reply',
      customCss: '',
      updates: {},
      cssBlockId: null,
    };
  }

  if (/\bname\b/.test(p) && /\bchange\b|\bupdate\b|\bset\b/.test(p)) {
    return {
      reply: 'If you want me to update a top-level profile field, say it directly, for example: "change my title to Full Stack Developer" or "update my bio to sound more professional."',
      action: 'reply',
      customCss: '',
      updates: {},
      cssBlockId: null,
    };
  }

  return null;
}

// POST /api/ai/chat-design
router.post('/chat-design', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { portfolioId, prompt, history } = req.body || {};

    if (!portfolioId || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'portfolioId and prompt are required' });
      return;
    }

    const portfolio = await Portfolio.findOne({ portfolioId, userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const currentCss = typeof portfolio.formData?.customCss === 'string' ? portfolio.formData.customCss : '';
    const portfolioContext = buildPortfolioContext(portfolio.formData || {}, portfolio.profession, currentCss);
    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter((m: any) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .slice(-8)
          .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 1200) }))
      : [];
    const localFallback = getLocalAssistantFallback(prompt, portfolio.formData || {});

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-key') {
      if (localFallback) {
        const mergedCss = localFallback.customCss
          ? mergeCustomCss(currentCss, localFallback.customCss, resolveCssBlockId(prompt, localFallback))
          : currentCss;
        const nextFormData = Object.keys(localFallback.updates).length > 0
          ? { ...portfolio.formData, ...localFallback.updates, customCss: mergedCss }
          : localFallback.customCss
            ? { ...portfolio.formData, customCss: mergedCss }
            : portfolio.formData;

        if (nextFormData !== portfolio.formData) {
          portfolio.formData = nextFormData;
          await updateStoredPortfolioDocument(portfolio, req, Object.keys(localFallback.updates).length > 0);
          await portfolio.save();
        }

        res.status(200).json({
          reply: localFallback.reply,
          designApplied: localFallback.action !== 'reply',
          changesApplied: localFallback.action !== 'reply',
        });
        return;
      }

      res.status(503).json({
        reply: 'AI is not configured on the server yet. Add OPENAI_API_KEY in server/.env and restart the server.',
        designApplied: false,
        changesApplied: false,
      });
      return;
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let parsed: AssistantPayload | null = null;
    let openAIError: unknown = null;
    const models = ['gpt-4o-mini', 'gpt-4o'];

    for (const model of models) {
      try {
        const completion = await Promise.race([
          openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: PORTFOLIO_SYSTEM_PROMPT },
              { role: 'system', content: `Current portfolio context: ${portfolioContext}` },
              ...safeHistory,
              { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 700,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
        ]) as any;

        const rawContent = completion?.choices?.[0]?.message?.content || '{}';
        parsed = parseAssistantPayload(rawContent);
        if (parsed) {
          break;
        }
        openAIError = new Error('OpenAI returned non-JSON content');
      } catch (err) {
        openAIError = err;
      }
    }

    if (!parsed && localFallback) {
      parsed = localFallback;
    }

    if (!parsed) {
      const errorMessage = openAIError instanceof Error ? openAIError.message : 'OpenAI request failed';
      res.status(200).json({
        reply: `I could not reach the AI service right now (${errorMessage}). Try again in a minute. I can still handle common portfolio styling requests like dark theme, light theme, font changes, rounded corners, and spacing.`,
        designApplied: false,
        changesApplied: false,
      });
      return;
    }

    let finalPayload = parsed;
    if (localFallback) {
      const hasActionableChanges = Boolean(parsed.customCss) || Object.keys(parsed.updates).length > 0;
      const shouldForceLocalStyle = localFallback.action === 'apply_css' && FORCE_LOCAL_STYLE_RE.test(prompt);
      if (
        shouldForceLocalStyle ||
        ((STYLE_REQUEST_RE.test(prompt) && !parsed.customCss && localFallback.customCss) ||
          (!hasActionableChanges && localFallback.action !== 'reply'))
      ) {
        finalPayload = localFallback;
      }
    }

    const reply =
      finalPayload.reply || 'I can help with portfolio questions, content improvements, and site changes. Tell me what you want to do.';
    const nextCustomCss = finalPayload.customCss
      ? mergeCustomCss(currentCss, finalPayload.customCss, resolveCssBlockId(prompt, finalPayload))
      : currentCss;
    const hasContentUpdates = Object.keys(finalPayload.updates).length > 0;
    const hasCssUpdates = Boolean(finalPayload.customCss);
    const shouldApplyChanges = finalPayload.action !== 'reply' && (hasCssUpdates || hasContentUpdates);

    let changesApplied = false;
    if (shouldApplyChanges) {
      portfolio.formData = {
        ...portfolio.formData,
        ...finalPayload.updates,
        customCss: nextCustomCss,
      };

      try {
        await updateStoredPortfolioDocument(portfolio, req, hasContentUpdates);
        await portfolio.save();
        changesApplied = true;
      } catch (applyErr) {
        console.error('Chat assistant apply error:', applyErr);
        res.status(200).json({
          reply: 'I understood the request, but failed to apply the update to your portfolio file. Please try once more.',
          designApplied: false,
          changesApplied: false,
        });
        return;
      }
    }

    res.json({ reply, designApplied: changesApplied, changesApplied });
  } catch (err) {
    console.error('Chat assistant error:', err);
    res.status(500).json({
      error: 'Chat assistant failed',
      reply: 'I hit an internal error while processing that request. Please try again.',
      designApplied: false,
      changesApplied: false,
    });
  }
});

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

export default router;
