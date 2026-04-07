import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { ensureDatabaseConnection, getDatabaseStatus } from './database';
import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import skillsRoutes from './routes/skills';
import Portfolio from './models/Portfolio';
import { getPortfolioHTMLPath } from './utils/templateEngine';
import { buildPortfolioDocument } from './utils/portfolio3d';
import professionSchemas from './config/schemas/professions.json';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
];
const resolvedEnvPath = envCandidates.find((candidate) => fs.existsSync(candidate));
dotenv.config(resolvedEnvPath ? { path: resolvedEnvPath } : undefined);

const LEGACY_LIGHT_THEME_SIGNATURE = 'body,.container,.main,.content{background:#f6f8fc!important;color:#0f172a!important;}';
const LEGACY_DARK_THEME_SIGNATURE = 'body{background:#05070d!important;color:#f8fafc!important;}';
const SURFACE_RESET_SELECTORS = ['.container', '.main', '.content', '.header', '.hero', '.section', '.main-section', '.bio-section', '.contact', '.footer'].join(',');
const CARD_SELECTORS = ['.sidebar', '.project-card', '.project-item', '.project-entry', '.card', '.avatar', '.project-img'].join(',');
const HEADING_SELECTORS = ['.name', '.hero-name', '.sidebar-name', '.project-title', '.project-info h3', '.exp-role', '.timeline-role', '.edu-degree', 'h1', 'h2', 'h3', 'h4'].join(',');
const MUTED_SELECTORS = ['.title-text', '.hero-title', '.sidebar-title', '.location', '.hero-location', '.section-title', '.main-label', '.section-label', '.sidebar-section h3', '.timeline-date', '.exp-date', '.edu-year', '.footer'].join(',');
const BODY_TEXT_SELECTORS = ['p', 'span', 'li', '.bio', '.bio-text', '.bio-section', '.project-desc', '.project-info p', '.timeline-desc', '.timeline-company', '.exp-desc', '.exp-company', '.edu-school', '.contact-email', '.contact-list li', '.skills-list span'].join(',');
const LINK_SELECTORS = ['a', '.links a', '.hero-links a', '.project-links a', '.project-meta a', '.contact-list li a'].join(',');
const TAG_SELECTORS = ['.skill-tag', '.sidebar-skills span', '.badge', '.tag', '.project-tech span'].join(',');

function detectLegacyThemeMode(html: string): 'light' | 'dark' | null {
  const lightIndex = html.lastIndexOf(LEGACY_LIGHT_THEME_SIGNATURE);
  const darkIndex = html.lastIndexOf(LEGACY_DARK_THEME_SIGNATURE);
  if (lightIndex === -1 && darkIndex === -1) {
    return null;
  }
  return darkIndex > lightIndex ? 'dark' : 'light';
}

function buildCompatibilityThemeCss(mode: 'light' | 'dark'): string {
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
    `.timeline-item::before{background:${palette.heading}!important;}`,
  ].join('');
}

function normalizeServedPortfolioHtml(html: string): string {
  let normalizedHtml = html.replace(/href="mailto:mailto:/g, 'href="mailto:');
  normalizedHtml = normalizedHtml.replace(/target="_blank"(?! rel="noreferrer")/g, 'target="_blank" rel="noreferrer"');

  const legacyThemeMode = detectLegacyThemeMode(normalizedHtml);
  if (!legacyThemeMode || normalizedHtml.includes('/* portify-compat-theme */') || !normalizedHtml.includes('</style>')) {
    return normalizedHtml;
  }

  return normalizedHtml.replace(
    '</style>',
    `\n/* portify-compat-theme */\n${buildCompatibilityThemeCss(legacyThemeMode)}\n</style>`,
  );
}

function needsPortfolioHtmlRefresh(html: string): boolean {
  return !html.includes('project-card-3d-fix');
}

function getRequestBaseUrl(req: express.Request): string {
  const host = req.get('host') || 'localhost:3001';
  return `${req.protocol}://${host}`;
}

const app = express();

app.set('trust proxy', true);
app.use(cors({
  origin: (origin, callback) => {
    const configuredOrigin = process.env.CLIENT_URL?.trim();
    if (!origin || !configuredOrigin || origin === configuredOrigin) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/p/:portfolioId', async (req, res) => {
  let generatedHtml = '';

  try {
    const portfolio = await Portfolio.findOne({ portfolioId: req.params.portfolioId });
    generatedHtml = typeof portfolio?.generatedHTML === 'string' ? portfolio.generatedHTML.trim() : '';

    if (portfolio && (!generatedHtml || needsPortfolioHtmlRefresh(generatedHtml))) {
      const bundle = await buildPortfolioDocument(portfolio.formData || {}, {
        portfolioId: portfolio.portfolioId,
        profession: portfolio.profession,
        baseUrl: getRequestBaseUrl(req),
        cookieHeader: req.headers.cookie,
      });

      portfolio.generatedContent = bundle.generatedContent;
      portfolio.generatedHTML = bundle.generatedHTML;
      portfolio.htmlPath = '';
      await portfolio.save();
      generatedHtml = bundle.generatedHTML;
    }

    if (generatedHtml) {
      res.type('html').send(normalizeServedPortfolioHtml(generatedHtml));
      return;
    }
  } catch (err) {
    console.error('Failed to load generated portfolio HTML:', err);
    if (generatedHtml) {
      res.type('html').send(normalizeServedPortfolioHtml(generatedHtml));
      return;
    }
  }

  const htmlPath = getPortfolioHTMLPath(req.params.portfolioId);
  if (!fs.existsSync(htmlPath)) {
    res.status(404).send('Portfolio not found');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf-8');
  res.type('html').send(normalizeServedPortfolioHtml(html));
});

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/skills', skillsRoutes);

app.get('/api/schema/:profession', (req, res) => {
  const profession = req.params.profession.toLowerCase().replace(/\s+/g, '-');
  const schema = (professionSchemas as Record<string, unknown>)[profession];
  if (!schema) {
    res.status(404).json({ error: 'Profession schema not found' });
    return;
  }
  res.json(schema);
});

app.get('/api/health', (_req, res) => {
  const database = getDatabaseStatus();
  res.status(database.connected ? 200 : 503).json({
    status: database.connected ? 'ok' : 'degraded',
    database: database.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export async function initializeApp() {
  try {
    await ensureDatabaseConnection();
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    console.log('Server will continue without database connectivity. Database-backed features may fail.');
  }

  return app;
}

export default app;
