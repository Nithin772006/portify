import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_PROJECT_REF = 'buxhjplzouywgmoztzlm';
const DEFAULT_PORTFOLIO_THEME_ID = 'quantum-canvas';
const THEMES_TABLE = 'portfolio_ui_themes';
const CACHE_TTL_MS = 60_000;

export type PortfolioThemeTemplateKey =
  | 'quantum-canvas'
  | 'aurora-sphere'
  | 'prism-parallax'
  | 'neon-command'
  | 'nova-grid';

export type PortfolioThemeDefinition = {
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
  sortOrder: number;
  isActive: boolean;
};

type PortfolioThemeRow = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  template_key: string;
  accent_color: string;
  secondary_color: string;
  surface_tint: string;
  preview_gradient: string;
  motion_style: string;
  feature_tags: string[] | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const BUILTIN_PORTFOLIO_THEMES: PortfolioThemeDefinition[] = [
  {
    id: 'quantum-canvas',
    name: 'Quantum Canvas',
    tagline: 'Cinematic orbitals with flip-card storytelling',
    description: 'The original Portify experience with immersive particles, orbiting hero geometry, and dramatic project cards.',
    templateKey: 'quantum-canvas',
    accentColor: '#ffffff',
    secondaryColor: '#818cf8',
    surfaceTint: 'rgba(255,255,255,0.12)',
    previewGradient: 'radial-gradient(circle at 18% 18%, rgba(129,140,248,0.45), transparent 30%), radial-gradient(circle at 82% 12%, rgba(255,255,255,0.2), transparent 26%), linear-gradient(135deg, #020617 0%, #000000 100%)',
    motionStyle: 'Particle canvas, orbiting geometry, GSAP scroll cues',
    featureTags: ['3D Hero', 'Flip Projects', 'Cinematic'],
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'aurora-sphere',
    name: 'Aurora Sphere',
    tagline: 'Luminous glass layout with an aurora scene',
    description: 'A soft neon portfolio with holographic glass panels, floating badges, and an interactive sphere-driven hero.',
    templateKey: 'aurora-sphere',
    accentColor: '#22d3ee',
    secondaryColor: '#8b5cf6',
    surfaceTint: 'rgba(34,211,238,0.18)',
    previewGradient: 'radial-gradient(circle at 20% 18%, rgba(34,211,238,0.54), transparent 32%), radial-gradient(circle at 82% 10%, rgba(139,92,246,0.42), transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    motionStyle: 'Aurora glow, floating glass, magnetic skill cloud',
    featureTags: ['Glass', 'Aurora', 'Magnetic'],
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'prism-parallax',
    name: 'Prism Parallax',
    tagline: 'Layered editorial sections with crystalline depth',
    description: 'An art-direction heavy portfolio theme with sharp gradients, stacked parallax panels, and prism-inspired motion.',
    templateKey: 'prism-parallax',
    accentColor: '#fb7185',
    secondaryColor: '#fbbf24',
    surfaceTint: 'rgba(251,113,133,0.16)',
    previewGradient: 'radial-gradient(circle at 18% 24%, rgba(251,113,133,0.48), transparent 32%), radial-gradient(circle at 84% 12%, rgba(251,191,36,0.4), transparent 28%), linear-gradient(135deg, #111827 0%, #020617 100%)',
    motionStyle: 'Parallax prisms, perspective cards, layered sections',
    featureTags: ['Editorial', 'Prisms', 'Parallax'],
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'neon-command',
    name: 'Neon Command',
    tagline: 'Cyber interface with command-grid energy',
    description: 'A terminal-inspired theme mixing neon grids, radar rings, and dense data cards for builders who want a technical edge.',
    templateKey: 'neon-command',
    accentColor: '#22c55e',
    secondaryColor: '#38bdf8',
    surfaceTint: 'rgba(34,197,94,0.18)',
    previewGradient: 'radial-gradient(circle at 16% 18%, rgba(34,197,94,0.46), transparent 30%), radial-gradient(circle at 82% 12%, rgba(56,189,248,0.34), transparent 28%), linear-gradient(135deg, #020617 0%, #000000 100%)',
    motionStyle: 'Neon scanlines, grid pulses, tech panels',
    featureTags: ['Cyber', 'Grid', 'Radar'],
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'nova-grid',
    name: 'Nova Grid',
    tagline: 'Futuristic cards orbiting a stellar lattice',
    description: 'A colorful cosmic theme with constellation lines, floating module stacks, and a stronger product-style section rhythm.',
    templateKey: 'nova-grid',
    accentColor: '#f472b6',
    secondaryColor: '#60a5fa',
    surfaceTint: 'rgba(244,114,182,0.16)',
    previewGradient: 'radial-gradient(circle at 18% 18%, rgba(244,114,182,0.52), transparent 32%), radial-gradient(circle at 84% 10%, rgba(96,165,250,0.42), transparent 28%), linear-gradient(135deg, #0f172a 0%, #020617 100%)',
    motionStyle: 'Constellation field, hover-lift modules, orbit cues',
    featureTags: ['Cosmic', 'Modules', 'Orbit'],
    sortOrder: 5,
    isActive: true,
  },
];

let cachedClient: SupabaseClient | null = null;
let cachedClientSignature = '';
let cachedReadClient: SupabaseClient | null = null;
let cachedReadClientSignature = '';
let cachedThemes: PortfolioThemeDefinition[] | null = null;
let cacheTimestamp = 0;

function getSupabaseUrl() {
  const configuredUrl = process.env.SUPABASE_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || DEFAULT_SUPABASE_PROJECT_REF;
  return `https://${projectRef}.supabase.co`;
}

function getSupabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || '';
}

function getSupabaseReadKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim()
    || getSupabaseSecretKey();
}

function isSupportedTemplateKey(value: unknown): value is PortfolioThemeTemplateKey {
  return value === 'quantum-canvas'
    || value === 'aurora-sphere'
    || value === 'prism-parallax'
    || value === 'neon-command'
    || value === 'nova-grid';
}

function getSupabaseClient() {
  const secretKey = getSupabaseSecretKey();
  const supabaseUrl = getSupabaseUrl();

  if (!secretKey || !supabaseUrl) {
    return null;
  }

  const signature = `${supabaseUrl}:${secretKey}`;
  if (!cachedClient || cachedClientSignature !== signature) {
    cachedClient = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    cachedClientSignature = signature;
  }

  return cachedClient;
}

function getSupabaseReadClient() {
  const readKey = getSupabaseReadKey();
  const supabaseUrl = getSupabaseUrl();

  if (!readKey || !supabaseUrl) {
    return null;
  }

  const signature = `${supabaseUrl}:${readKey}`;
  if (!cachedReadClient || cachedReadClientSignature !== signature) {
    cachedReadClient = createClient(supabaseUrl, readKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    cachedReadClientSignature = signature;
  }

  return cachedReadClient;
}

function toThemeDefinition(row: PortfolioThemeRow): PortfolioThemeDefinition | null {
  if (!row?.id || !isSupportedTemplateKey(row.template_key)) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    templateKey: row.template_key,
    accentColor: row.accent_color,
    secondaryColor: row.secondary_color,
    surfaceTint: row.surface_tint,
    previewGradient: row.preview_gradient,
    motionStyle: row.motion_style,
    featureTags: Array.isArray(row.feature_tags) ? row.feature_tags.filter(Boolean) : [],
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 999,
    isActive: row.is_active !== false,
  };
}

function toThemeRow(theme: PortfolioThemeDefinition): PortfolioThemeRow {
  return {
    id: theme.id,
    name: theme.name,
    tagline: theme.tagline,
    description: theme.description,
    template_key: theme.templateKey,
    accent_color: theme.accentColor,
    secondary_color: theme.secondaryColor,
    surface_tint: theme.surfaceTint,
    preview_gradient: theme.previewGradient,
    motion_style: theme.motionStyle,
    feature_tags: theme.featureTags,
    sort_order: theme.sortOrder,
    is_active: theme.isActive,
  };
}

async function fetchThemesFromSupabase() {
  const supabase = getSupabaseReadClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(THEMES_TABLE)
    .select('id,name,tagline,description,template_key,accent_color,secondary_color,surface_tint,preview_gradient,motion_style,feature_tags,sort_order,is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('Supabase theme fetch failed:', error.message);
    return null;
  }

  const themes = (data || [])
    .map((row) => toThemeDefinition(row as PortfolioThemeRow))
    .filter((theme): theme is PortfolioThemeDefinition => theme !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return themes.length ? themes : null;
}

export async function syncBuiltinPortfolioThemesToSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from(THEMES_TABLE)
    .upsert(BUILTIN_PORTFOLIO_THEMES.map(toThemeRow), { onConflict: 'id' });

  if (error) {
    console.warn('Supabase theme sync skipped:', error.message);
    return false;
  }

  cachedThemes = null;
  cacheTimestamp = 0;
  return true;
}

export async function listPortfolioThemes(options?: { fresh?: boolean }) {
  const useCache = !options?.fresh && cachedThemes && (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
  if (useCache && cachedThemes) {
    return cachedThemes;
  }

  const remoteThemes = await fetchThemesFromSupabase();
  cachedThemes = remoteThemes || BUILTIN_PORTFOLIO_THEMES;
  cacheTimestamp = Date.now();
  return cachedThemes;
}

export async function resolvePortfolioTheme(themeId?: unknown) {
  const requestedId = typeof themeId === 'string' ? themeId.trim() : '';
  const themes = await listPortfolioThemes();
  const resolved = themes.find((theme) => theme.id === requestedId);
  return resolved || themes[0] || BUILTIN_PORTFOLIO_THEMES[0];
}

export function getDefaultPortfolioThemeId() {
  return DEFAULT_PORTFOLIO_THEME_ID;
}

export function getBuiltinPortfolioThemes() {
  return BUILTIN_PORTFOLIO_THEMES;
}
