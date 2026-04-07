import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

function normalizeMailto(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('mailto:') ? trimmed : `mailto:${trimmed}`;
}

function normalizeHref(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => hasContent(item));
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some((item) => hasContent(item));
  return true;
}

function getInitial(value: unknown): string {
  if (typeof value !== 'string') return '?';
  const trimmed = value.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

// Register helpers
Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('join', (arr: string[], sep: string) => {
  if (Array.isArray(arr)) return arr.join(typeof sep === 'string' ? sep : ', ');
  return '';
});
Handlebars.registerHelper('year', (date: string) => {
  if (!date) return '';
  return new Date(date).getFullYear();
});
Handlebars.registerHelper('mailto', (value: unknown) => normalizeMailto(value));
Handlebars.registerHelper('safeHref', (value: unknown) => normalizeHref(value));
Handlebars.registerHelper('hasContent', (value: unknown) => hasContent(value));
Handlebars.registerHelper('initial', (value: unknown) => getInitial(value));

const templateMap: Record<string, string> = {
  'software-engineer': 'template_dev.hbs',
  'data-scientist': 'template_dev.hbs',
  'researcher': 'template_dev.hbs',
  'ui-ux-designer': 'template_creative.hbs',
  'photographer': 'template_creative.hbs',
  'architect': 'template_creative.hbs',
  'doctor': 'template_corporate.hbs',
  'lawyer': 'template_corporate.hbs',
  'marketing-manager': 'template_corporate.hbs',
  'chef': 'template_corporate.hbs',
  'freelancer': 'template_corporate.hbs',
  'mechanical-engineer': 'template_dev.hbs',
};

export function getTemplateForProfession(profession: string): string {
  const key = profession.toLowerCase().replace(/\s+/g, '-');
  return templateMap[key] || 'template_dev.hbs';
}

function resolveServerRoot(): string {
  const candidates = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '..', '..'),
  ];

  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'templates'))) || candidates[0];
}

export function getPortfoliosDir(): string {
  return path.join(resolveServerRoot(), 'portfolios');
}

export function getPortfolioHTMLPath(portfolioId: string): string {
  return path.join(getPortfoliosDir(), `${portfolioId}.html`);
}

export function compileTemplate(templateName: string, data: Record<string, any>): string {
  const templateDir = path.join(resolveServerRoot(), 'templates');
  const templatePath = path.join(templateDir, templateName);
  const source = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(source);
  return template(data);
}

export function writePortfolioHTML(portfolioId: string, html: string): string {
  const outputDir = getPortfoliosDir();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = getPortfolioHTMLPath(portfolioId);
  fs.writeFileSync(filePath, html, 'utf-8');
  return filePath;
}

export { templateMap };
