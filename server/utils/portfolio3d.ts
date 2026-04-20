import axios from 'axios';
import { compileTemplate } from './templateEngine';
import {
  getBuiltinPortfolioThemes,
  resolvePortfolioTheme,
  type PortfolioThemeDefinition,
  type PortfolioThemeTemplateKey,
} from '../services/portfolioThemes';

const BLANK_AVATAR_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==';

type EnhancementResult = {
  tagline: string;
  bio: string;
  projectDescriptions: string[];
  experienceBullets: string[][];
};

export type RenderSkill = {
  name: string;
  levelLabel: string;
  tooltip: string;
};

export type RenderProject = {
  title: string;
  description: string;
  projectUrl: string;
  previewImage: string;
  hasPreviewImage: boolean;
  hasProjectUrl: boolean;
  hasTechStack: boolean;
  techStack: string[];
  projectLabel: string;
};

export type RenderExperience = {
  role: string;
  company: string;
  dateRange: string;
  bullets: string[];
  summary: string;
  side: 'left' | 'right';
};

export type RenderEducation = {
  degree: string;
  institution: string;
  year: string;
  summary: string;
};

export type RenderLink = {
  label: string;
  href: string;
};

export type GeneratedPortfolioTheme = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  templateKey: PortfolioThemeTemplateKey;
  accentColor: string;
  secondaryColor: string;
  surfaceTint: string;
  previewGradient: string;
  motionStyle: string;
  featureTags: string[];
};

export type GeneratedPortfolioContent = {
  portfolioId: string;
  name: string;
  title: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  avatarImage: string;
  avatarAlt: string;
  heroLabel: string;
  scrollHint: string;
  metaTitle: string;
  metaDescription: string;
  year: number;
  theme: GeneratedPortfolioTheme;
  customCss: string;
  skills: RenderSkill[];
  projects: RenderProject[];
  experience: RenderExperience[];
  education: RenderEducation[];
  socialLinks: RenderLink[];
  hasLocation: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasSocialLinks: boolean;
  hasSkills: boolean;
  hasProjects: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
};

export type BuildPortfolioDocumentOptions = {
  portfolioId: string;
  profession: string;
  themeId?: string;
  baseUrl: string;
  cookieHeader?: string;
};

export type PortfolioDocumentBundle = {
  generatedContent: GeneratedPortfolioContent;
  generatedHTML: string;
  avatarBuffer: Buffer<ArrayBufferLike>;
};

function toNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    const trimmed = toNonEmptyString(value);
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

export function slugify(value: unknown): string {
  return toNonEmptyString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => toNonEmptyString(value))
    .filter((value) => {
      if (!value) {
        return false;
      }
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function sanitizeCss(rawCss: unknown): string {
  return typeof rawCss === 'string'
    ? rawCss.replace(/```css|```/gi, '').replace(/<\/?style[^>]*>/gi, '').trim()
    : '';
}

function normalizeHref(value: unknown): string {
  const trimmed = toNonEmptyString(value);
  if (!trimmed) {
    return '';
  }
  if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function normalizeAssetUrl(value: unknown, baseUrl: string): string {
  const trimmed = toNonEmptyString(value);
  if (!trimmed) {
    return '';
  }
  if (/^(data:|https?:\/\/|\/\/)/i.test(trimmed)) {
    return normalizeHref(trimmed);
  }
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return normalizeHref(trimmed);
  }
}

function humanizeProfession(value: unknown): string {
  const raw = toNonEmptyString(value);
  if (!raw) {
    return 'Portfolio';
  }
  return raw
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function splitIntoBullets(value: unknown): string[] {
  const text = toNonEmptyString(value);
  if (!text) {
    return [];
  }

  const lines = text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[-*\s]+/, '').trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines;
  }

  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function trimSentence(value: string, maxLength: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1).trimEnd()}...`;
}

function formatMonthYear(value: unknown): string {
  const raw = toNonEmptyString(value);
  if (!raw) {
    return '';
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateRange(startDate: unknown, endDate: unknown, isPresent: unknown): string {
  const start = formatMonthYear(startDate);
  const end = isPresent ? 'Present' : formatMonthYear(endDate);
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start || end || '';
}

function resolveAvatarSource(formData: Record<string, any>): string {
  return pickFirstString(
    formData.avatarUrl,
    formData.avatar,
    formData.profileImage,
    formData.profileImageUrl,
    formData.photoUrl,
    formData.photo,
    formData.imageUrl,
    formData.image,
    formData.pictureUrl,
    formData.picture,
    formData.headshotUrl,
    formData.headshot,
  );
}

function buildInitialAvatarDataUri(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'P';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#121212" />
          <stop offset="100%" stop-color="#030303" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="256" fill="url(#g)" />
      <circle cx="256" cy="256" r="214" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="164" font-family="Arial, Helvetica, sans-serif" font-weight="700" letter-spacing="8">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function dataUriToBuffer(dataUri: string): Buffer<ArrayBufferLike> | null {
  const match = /^data:.*?;base64,(.+)$/i.exec(dataUri);
  if (!match) {
    return null;
  }
  try {
    return Buffer.from(match[1], 'base64');
  } catch {
    return null;
  }
}

async function fetchBinaryAsset(url: string, cookieHeader?: string): Promise<Buffer<ArrayBufferLike>> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 10000,
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      'User-Agent': 'PortifyBot/1.0 (+https://portify.local)',
    },
  });
  return Buffer.from(response.data);
}

async function fetchImageAsDataUri(url: string, cookieHeader?: string): Promise<string> {
  if (!url) {
    return '';
  }
  if (/^data:/i.test(url)) {
    return url;
  }

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 10000,
    maxContentLength: 1024 * 1024,
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      'User-Agent': 'PortifyBot/1.0 (+https://portify.local)',
    },
  });

  const mimeType = typeof response.headers['content-type'] === 'string'
    ? response.headers['content-type']
    : 'image/jpeg';
  return `data:${mimeType};base64,${Buffer.from(response.data).toString('base64')}`;
}

function extractMetaContent(html: string, keys: string[]): string {
  for (const key of keys) {
    const propertyPattern = new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
    const propertyMatch = propertyPattern.exec(html);
    if (propertyMatch?.[1]) {
      return propertyMatch[1].trim();
    }

    const namePattern = new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
    const nameMatch = namePattern.exec(html);
    if (nameMatch?.[1]) {
      return nameMatch[1].trim();
    }
  }
  return '';
}

async function fetchOpenGraphImage(projectUrl: string): Promise<string> {
  if (!projectUrl) {
    return '';
  }

  try {
    const response = await axios.get(projectUrl, {
      timeout: 10000,
      maxContentLength: 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PortifyBot/1.0; +https://portify.local)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (typeof response.data !== 'string') {
      return '';
    }

    const imageUrl = extractMetaContent(response.data, [
      'og:image:secure_url',
      'og:image',
      'twitter:image',
      'twitter:image:src',
    ]);

    if (!imageUrl) {
      return '';
    }

    return normalizeAssetUrl(imageUrl, projectUrl);
  } catch {
    return '';
  }
}

function buildLocalEnhancement(formData: Record<string, any>, profession: string): EnhancementResult {
  const fallbackTitle = pickFirstString(formData.title, humanizeProfession(profession));
  const fallbackTagline = pickFirstString(
    formData.tagline,
    formData.title,
    `${fallbackTitle || humanizeProfession(profession)} crafting focused digital experiences`,
  );

  const rawBio = toNonEmptyString(formData.bio);
  const skills = uniqueStrings(Array.isArray(formData.skills) ? formData.skills : []).slice(0, 4);
  const location = toNonEmptyString(formData.location);
  const fallbackBio = rawBio || trimSentence(
    [
      fallbackTitle,
      location ? `based in ${location}` : '',
      skills.length ? `with strength across ${skills.join(', ')}` : '',
    ].filter(Boolean).join(' '),
    180,
  );

  const projects = Array.isArray(formData.projects) ? formData.projects : [];
  const projectDescriptions = projects.map((project: any) => trimSentence(
    toNonEmptyString(project?.description) || `A polished product focused on ${toNonEmptyString(project?.title) || 'solving meaningful problems'}.`,
    170,
  ));

  const experience = Array.isArray(formData.experience) ? formData.experience : [];
  const experienceBullets = experience.map((item: any) => {
    const bullets = splitIntoBullets(item?.description).slice(0, 4).map((bullet) => trimSentence(bullet, 120));
    return bullets.length
      ? bullets
      : [trimSentence(`Delivered work as ${toNonEmptyString(item?.role) || 'a contributor'} at ${toNonEmptyString(item?.company) || 'the organization'}.`, 120)];
  });

  return {
    tagline: trimSentence(fallbackTagline, 72),
    bio: rawBio || fallbackBio,
    projectDescriptions,
    experienceBullets,
  };
}

async function getEnhancedContent(formData: Record<string, any>, profession: string): Promise<EnhancementResult> {
  const fallback = buildLocalEnhancement(formData, profession);
  const rawBio = toNonEmptyString(formData.bio);
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-key') {
    return fallback;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const payload = {
      profession,
      name: pickFirstString(formData.name, 'Portfolio Owner'),
      title: pickFirstString(formData.title, humanizeProfession(profession)),
      bio: toNonEmptyString(formData.bio),
      skills: uniqueStrings(Array.isArray(formData.skills) ? formData.skills : []).slice(0, 10),
      projects: (Array.isArray(formData.projects) ? formData.projects : []).slice(0, 5).map((project: any) => ({
        title: toNonEmptyString(project?.title),
        description: toNonEmptyString(project?.description),
        techStack: uniqueStrings(Array.isArray(project?.techStack) ? project.techStack : []).slice(0, 8),
      })),
      experience: (Array.isArray(formData.experience) ? formData.experience : []).slice(0, 4).map((item: any) => ({
        role: toNonEmptyString(item?.role),
        company: toNonEmptyString(item?.company),
        description: toNonEmptyString(item?.description),
      })),
    };

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: [
              'You write premium but factual portfolio copy for a cinematic one-page portfolio.',
              'Do not invent facts beyond the provided input.',
              'Return strict JSON with this shape:',
              '{"tagline": string, "bio": string, "projects": [{"description": string}], "experience": [{"bullets": string[]}]}',
              'Rules:',
              '- tagline: 4 to 10 words, sharp and premium, no buzzword spam.',
              '- bio: under 90 words, impact-driven, professional.',
              '- each project.description: under 40 words.',
              '- each experience.bullets: 2 to 4 concise bullets, each under 14 words.',
            ].join(' '),
          },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 25000)),
    ]) as any;

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const projectDescriptions = Array.isArray(parsed?.projects)
      ? parsed.projects.map((project: any, index: number) => trimSentence(
          toNonEmptyString(project?.description) || fallback.projectDescriptions[index] || '',
          170,
        ))
      : fallback.projectDescriptions;

    const experienceBullets = Array.isArray(parsed?.experience)
      ? parsed.experience.map((item: any, index: number) => {
          const bullets = uniqueStrings(Array.isArray(item?.bullets) ? item.bullets : []).slice(0, 4);
          return bullets.length ? bullets : (fallback.experienceBullets[index] || []);
        })
      : fallback.experienceBullets;

    return {
      tagline: trimSentence(toNonEmptyString(parsed?.tagline) || fallback.tagline, 72),
      bio: rawBio || toNonEmptyString(parsed?.bio) || fallback.bio,
      projectDescriptions,
      experienceBullets,
    };
  } catch {
    return fallback;
  }
}

function buildSkillCards(skills: unknown[]): RenderSkill[] {
  const normalizedSkills = uniqueStrings(Array.isArray(skills) ? skills : []);
  return normalizedSkills.map((skill, index) => {
    const levelLabel = index < 3 ? 'Advanced' : index < 6 ? 'Applied' : 'Working';
    const tooltip = index < 3
      ? `${levelLabel} capability and active portfolio strength`
      : index < 6
        ? `${levelLabel} production experience`
        : `${levelLabel} practical familiarity`;

    return {
      name: skill,
      levelLabel,
      tooltip,
    };
  });
}

async function buildProjects(
  projects: unknown,
  baseUrl: string,
  descriptions: string[],
): Promise<RenderProject[]> {
  if (!Array.isArray(projects)) {
    return [];
  }

  const normalizedProjects = await Promise.all(projects.map(async (project, index) => {
    const record = project && typeof project === 'object' ? project as Record<string, unknown> : {};
    const title = pickFirstString(record.title, `Project ${index + 1}`);
    const projectUrl = normalizeHref(
      pickFirstString(record.liveUrl, record.projectUrl, record.githubUrl, record.url),
    );
    const directPreview = normalizeAssetUrl(
      pickFirstString(
        record.previewImage,
        record.image,
        record.imageUrl,
        record.thumbnail,
        record.thumbnailUrl,
        record.screenshot,
        record.screenshotUrl,
      ),
      baseUrl,
    );
    const previewImage = directPreview || await fetchOpenGraphImage(projectUrl);
    const techStack = uniqueStrings(Array.isArray(record.techStack) ? record.techStack : []);

    return {
      title,
      description: trimSentence(descriptions[index] || toNonEmptyString(record.description), 170),
      projectUrl,
      previewImage,
      hasPreviewImage: Boolean(previewImage),
      hasProjectUrl: Boolean(projectUrl),
      hasTechStack: techStack.length > 0,
      techStack,
      projectLabel: title.slice(0, 1).toUpperCase(),
    } satisfies RenderProject;
  }));

  return normalizedProjects.filter((project) => project.title || project.description);
}

function buildExperience(experience: unknown, aiBullets: string[][]): RenderExperience[] {
  if (!Array.isArray(experience)) {
    return [];
  }

  return experience
    .map((item, index) => {
      const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const role = toNonEmptyString(record.role);
      const company = toNonEmptyString(record.company);
      if (!role && !company) {
        return null;
      }

      const fallbackBullets = splitIntoBullets(record.description).slice(0, 4).map((bullet) => trimSentence(bullet, 120));
      const bullets = (aiBullets[index] || fallbackBullets).filter(Boolean).slice(0, 4);
      return {
        role: role || humanizeProfession('role'),
        company: company || 'Company',
        dateRange: formatDateRange(record.startDate, record.endDate, record.isPresent),
        bullets,
        summary: trimSentence(toNonEmptyString(record.description), 180),
        side: index % 2 === 0 ? 'left' : 'right',
      } satisfies RenderExperience;
    })
    .filter((entry): entry is RenderExperience => entry !== null);
}

function buildEducation(education: unknown): RenderEducation[] {
  if (Array.isArray(education)) {
    return education
      .map((item) => {
        const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        const degree = pickFirstString(record.degree, record.fieldOfStudy);
        const institution = toNonEmptyString(record.institution);
        const year = pickFirstString(record.graduationYear, record.year);
        if (!degree && !institution && !year) {
          return null;
        }
        return {
          degree: degree || 'Education',
          institution,
          year,
          summary: [degree, institution, year].filter(Boolean).join(' | '),
        } satisfies RenderEducation;
      })
      .filter((entry): entry is RenderEducation => entry !== null);
  }

  if (!education || typeof education !== 'object') {
    return [];
  }

  const record = education as Record<string, unknown>;
  const degree = pickFirstString(record.degree, record.fieldOfStudy);
  const institution = toNonEmptyString(record.institution);
  const year = pickFirstString(record.graduationYear, record.year);
  if (!degree && !institution && !year) {
    return [];
  }

  return [{
    degree: degree || 'Education',
    institution,
    year,
    summary: [degree, institution, year].filter(Boolean).join(' | '),
  }];
}

function buildSocialLinks(github: string, linkedin: string): RenderLink[] {
  return [
    github ? { label: 'GitHub', href: github } : null,
    linkedin ? { label: 'LinkedIn', href: linkedin } : null,
  ].filter((entry): entry is RenderLink => entry !== null);
}

function toGeneratedTheme(theme: PortfolioThemeDefinition): GeneratedPortfolioTheme {
  return {
    id: theme.id,
    name: theme.name,
    tagline: theme.tagline,
    description: theme.description,
    templateKey: theme.templateKey,
    accentColor: theme.accentColor,
    secondaryColor: theme.secondaryColor,
    surfaceTint: theme.surfaceTint,
    previewGradient: theme.previewGradient,
    motionStyle: theme.motionStyle,
    featureTags: theme.featureTags,
  };
}

function resolveGeneratedTheme(generatedContent: Partial<GeneratedPortfolioContent> | null | undefined) {
  const builtinThemes = getBuiltinPortfolioThemes();
  const requestedId = toNonEmptyString(generatedContent?.theme?.id);
  const requestedTemplateKey = toNonEmptyString(generatedContent?.theme?.templateKey);
  const fallbackTheme = builtinThemes.find((theme) => (
    (requestedId && theme.id === requestedId) || (requestedTemplateKey && theme.templateKey === requestedTemplateKey)
  )) || builtinThemes[0];

  if (!generatedContent?.theme) {
    return toGeneratedTheme(fallbackTheme);
  }

  return {
    ...toGeneratedTheme(fallbackTheme),
    ...generatedContent.theme,
    featureTags: Array.isArray(generatedContent.theme.featureTags)
      ? generatedContent.theme.featureTags.filter(Boolean)
      : fallbackTheme.featureTags,
  };
}

function getThemeTemplateName(theme: GeneratedPortfolioTheme) {
  return theme.templateKey === 'quantum-canvas'
    ? 'template_3d_portfolio.hbs'
    : 'template_3d_theme_variants.hbs';
}

async function buildAvatarImage(
  formData: Record<string, any>,
  name: string,
  baseUrl: string,
  cookieHeader?: string,
): Promise<string> {
  const avatarSource = normalizeAssetUrl(resolveAvatarSource(formData), baseUrl);
  if (!avatarSource) {
    return buildInitialAvatarDataUri(name);
  }

  try {
    return await fetchImageAsDataUri(avatarSource, cookieHeader);
  } catch {
    return buildInitialAvatarDataUri(name);
  }
}

async function buildAvatarBuffer(
  formData: Record<string, any>,
  baseUrl: string,
  cookieHeader?: string,
): Promise<Buffer<ArrayBufferLike>> {
  const avatarSource = normalizeAssetUrl(resolveAvatarSource(formData), baseUrl);
  if (!avatarSource) {
    return Buffer.from(BLANK_AVATAR_JPEG_BASE64, 'base64');
  }

  try {
    const inlineBuffer = dataUriToBuffer(avatarSource);
    if (inlineBuffer) {
      return inlineBuffer;
    }
    return await fetchBinaryAsset(avatarSource, cookieHeader);
  } catch {
    return Buffer.from(BLANK_AVATAR_JPEG_BASE64, 'base64');
  }
}

export async function buildGeneratedPortfolioContent(
  formData: Record<string, any>,
  options: BuildPortfolioDocumentOptions,
): Promise<GeneratedPortfolioContent> {
  const { portfolioId, profession, themeId, baseUrl, cookieHeader } = options;
  const enhancement = await getEnhancedContent(formData, profession);
  const theme = toGeneratedTheme(await resolvePortfolioTheme(themeId || formData.themeId));

  const name = pickFirstString(
    formData.name,
    formData.username,
    typeof formData.email === 'string' ? formData.email.split('@')[0] : '',
    'Portfolio Owner',
  );
  const title = pickFirstString(formData.title, humanizeProfession(profession));
  const avatarImage = await buildAvatarImage(formData, name, baseUrl, cookieHeader);
  const skills = buildSkillCards(formData.skills);
  const projects = await buildProjects(formData.projects, baseUrl, enhancement.projectDescriptions);
  const experience = buildExperience(formData.experience, enhancement.experienceBullets);
  const education = buildEducation(formData.education);
  const email = toNonEmptyString(formData.email);
  const phone = toNonEmptyString(formData.phone);
  const github = normalizeHref(formData.github);
  const linkedin = normalizeHref(formData.linkedin);
  const socialLinks = buildSocialLinks(github, linkedin);
  const rawBio = toNonEmptyString(formData.bio);
  const bio = rawBio || enhancement.bio || '';
  const metaDescription = trimSentence(
    pickFirstString(
      bio,
      `${name} | ${title || humanizeProfession(profession)}`,
    ),
    180,
  );

  return {
    portfolioId,
    name,
    title,
    tagline: trimSentence(enhancement.tagline || title || humanizeProfession(profession), 72),
    bio,
    location: toNonEmptyString(formData.location),
    email,
    phone,
    github,
    linkedin,
    avatarImage,
    avatarAlt: `${name} portrait`,
    heroLabel: 'PORTFOLIO',
    scrollHint: 'SCROLL &#8595;',
    metaTitle: `${name} | ${title || 'Portfolio'}`,
    metaDescription,
    year: new Date().getFullYear(),
    theme,
    customCss: sanitizeCss(formData.customCss),
    skills,
    projects,
    experience,
    education,
    socialLinks,
    hasLocation: Boolean(toNonEmptyString(formData.location)),
    hasEmail: Boolean(email),
    hasPhone: Boolean(phone),
    hasSocialLinks: socialLinks.length > 0,
    hasSkills: skills.length > 0,
    hasProjects: projects.length > 0,
    hasExperience: experience.length > 0,
    hasEducation: education.length > 0,
  };
}

export function renderPortfolioHtml(generatedContent: GeneratedPortfolioContent): string {
  const theme = resolveGeneratedTheme(generatedContent);
  return compileTemplate(getThemeTemplateName(theme), {
    ...generatedContent,
    theme,
  });
}

export async function buildPortfolioDocument(
  formData: Record<string, any>,
  options: BuildPortfolioDocumentOptions,
): Promise<PortfolioDocumentBundle> {
  const generatedContent = await buildGeneratedPortfolioContent(formData, options);
  return {
    generatedContent,
    generatedHTML: renderPortfolioHtml(generatedContent),
    avatarBuffer: await buildAvatarBuffer(formData, options.baseUrl, options.cookieHeader),
  };
}
