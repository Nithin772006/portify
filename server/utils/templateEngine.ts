import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

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

export function compileTemplate(templateName: string, data: Record<string, any>): string {
  const templateDir = path.join(__dirname, '..', 'templates');
  const templatePath = path.join(templateDir, templateName);
  const source = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(source);
  return template(data);
}

export function writePortfolioHTML(portfolioId: string, html: string): string {
  const outputDir = path.join(__dirname, '..', 'portfolios');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, `${portfolioId}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');
  return filePath;
}

export { templateMap };
