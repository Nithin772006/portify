create table if not exists public.portfolio_ui_themes (
  id text primary key,
  name text not null,
  tagline text not null,
  description text not null,
  template_key text not null unique,
  accent_color text not null,
  secondary_color text not null,
  surface_tint text not null,
  preview_gradient text not null,
  motion_style text not null,
  feature_tags text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_portfolio_ui_themes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists portfolio_ui_themes_set_updated_at on public.portfolio_ui_themes;
create trigger portfolio_ui_themes_set_updated_at
before update on public.portfolio_ui_themes
for each row
execute function public.set_portfolio_ui_themes_updated_at();

alter table public.portfolio_ui_themes enable row level security;

drop policy if exists "Portfolio UI themes are publicly readable" on public.portfolio_ui_themes;
create policy "Portfolio UI themes are publicly readable"
on public.portfolio_ui_themes
for select
using (is_active = true);

insert into public.portfolio_ui_themes (
  id,
  name,
  tagline,
  description,
  template_key,
  accent_color,
  secondary_color,
  surface_tint,
  preview_gradient,
  motion_style,
  feature_tags,
  sort_order,
  is_active
)
values
  (
    'quantum-canvas',
    'Quantum Canvas',
    'Cinematic orbitals with flip-card storytelling',
    'The original Portify experience with immersive particles, orbiting hero geometry, and dramatic project cards.',
    'quantum-canvas',
    '#ffffff',
    '#818cf8',
    'rgba(255,255,255,0.12)',
    'radial-gradient(circle at 18% 18%, rgba(129,140,248,0.45), transparent 30%), radial-gradient(circle at 82% 12%, rgba(255,255,255,0.2), transparent 26%), linear-gradient(135deg, #020617 0%, #000000 100%)',
    'Particle canvas, orbiting geometry, GSAP scroll cues',
    array['3D Hero', 'Flip Projects', 'Cinematic'],
    1,
    true
  ),
  (
    'aurora-sphere',
    'Aurora Sphere',
    'Luminous glass layout with an aurora scene',
    'A soft neon portfolio with holographic glass panels, floating badges, and an interactive sphere-driven hero.',
    'aurora-sphere',
    '#22d3ee',
    '#8b5cf6',
    'rgba(34,211,238,0.18)',
    'radial-gradient(circle at 20% 18%, rgba(34,211,238,0.54), transparent 32%), radial-gradient(circle at 82% 10%, rgba(139,92,246,0.42), transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    'Aurora glow, floating glass, magnetic skill cloud',
    array['Glass', 'Aurora', 'Magnetic'],
    2,
    true
  ),
  (
    'prism-parallax',
    'Prism Parallax',
    'Layered editorial sections with crystalline depth',
    'An art-direction heavy portfolio theme with sharp gradients, stacked parallax panels, and prism-inspired motion.',
    'prism-parallax',
    '#fb7185',
    '#fbbf24',
    'rgba(251,113,133,0.16)',
    'radial-gradient(circle at 18% 24%, rgba(251,113,133,0.48), transparent 32%), radial-gradient(circle at 84% 12%, rgba(251,191,36,0.4), transparent 28%), linear-gradient(135deg, #111827 0%, #020617 100%)',
    'Parallax prisms, perspective cards, layered sections',
    array['Editorial', 'Prisms', 'Parallax'],
    3,
    true
  ),
  (
    'neon-command',
    'Neon Command',
    'Cyber interface with command-grid energy',
    'A terminal-inspired theme mixing neon grids, radar rings, and dense data cards for builders who want a technical edge.',
    'neon-command',
    '#22c55e',
    '#38bdf8',
    'rgba(34,197,94,0.18)',
    'radial-gradient(circle at 16% 18%, rgba(34,197,94,0.46), transparent 30%), radial-gradient(circle at 82% 12%, rgba(56,189,248,0.34), transparent 28%), linear-gradient(135deg, #020617 0%, #000000 100%)',
    'Neon scanlines, grid pulses, tech panels',
    array['Cyber', 'Grid', 'Radar'],
    4,
    true
  ),
  (
    'nova-grid',
    'Nova Grid',
    'Futuristic cards orbiting a stellar lattice',
    'A colorful cosmic theme with constellation lines, floating module stacks, and a stronger product-style section rhythm.',
    'nova-grid',
    '#f472b6',
    '#60a5fa',
    'rgba(244,114,182,0.16)',
    'radial-gradient(circle at 18% 18%, rgba(244,114,182,0.52), transparent 32%), radial-gradient(circle at 84% 10%, rgba(96,165,250,0.42), transparent 28%), linear-gradient(135deg, #0f172a 0%, #020617 100%)',
    'Constellation field, hover-lift modules, orbit cues',
    array['Cosmic', 'Modules', 'Orbit'],
    5,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  template_key = excluded.template_key,
  accent_color = excluded.accent_color,
  secondary_color = excluded.secondary_color,
  surface_tint = excluded.surface_tint,
  preview_gradient = excluded.preview_gradient,
  motion_style = excluded.motion_style,
  feature_tags = excluded.feature_tags,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());
