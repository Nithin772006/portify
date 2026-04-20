import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { PortfolioTheme } from '../types/portfolioTheme'

type PortfolioThemeCardProps = {
  theme: PortfolioTheme
  selected?: boolean
  current?: boolean
  loading?: boolean
  buttonLabel?: string
  onSelect?: (theme: PortfolioTheme) => void
  onAction?: (theme: PortfolioTheme) => void
}

export default function PortfolioThemeCard({
  theme,
  selected = false,
  current = false,
  loading = false,
  buttonLabel = 'Apply Theme',
  onSelect,
  onAction,
}: PortfolioThemeCardProps) {
  const style = {
    ['--theme-accent' as any]: theme.accentColor,
    ['--theme-secondary' as any]: theme.secondaryColor,
    ['--theme-surface' as any]: theme.surfaceTint,
    ['--theme-preview' as any]: theme.previewGradient,
  } as CSSProperties

  const isClickable = Boolean(onSelect || onAction)

  const handleSelect = () => {
    if (onSelect) {
      onSelect(theme)
      return
    }

    if (onAction) {
      onAction(theme)
    }
  }

  return (
    <motion.article
      className={`portfolio-theme-card glass${selected ? ' is-selected' : ''}${current ? ' is-current' : ''}${isClickable ? ' is-clickable' : ''}`}
      style={style}
      onClick={isClickable ? handleSelect : undefined}
      whileHover={isClickable ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <div className="portfolio-theme-card__preview">
        <div className="portfolio-theme-card__preview-orb portfolio-theme-card__preview-orb--primary" />
        <div className="portfolio-theme-card__preview-orb portfolio-theme-card__preview-orb--secondary" />
        <div className="portfolio-theme-card__preview-grid" />
        <div className="portfolio-theme-card__preview-copy">
          <span className="portfolio-theme-card__eyebrow">{theme.name}</span>
          <strong>{theme.tagline}</strong>
        </div>
      </div>

      <div className="portfolio-theme-card__content">
        <div className="portfolio-theme-card__header">
          <div>
            <h3 className="portfolio-theme-card__title">{theme.name}</h3>
            <p className="portfolio-theme-card__tagline">{theme.tagline}</p>
          </div>
          <span className={`portfolio-theme-card__status${current ? ' is-current' : selected ? ' is-selected' : ''}`}>
            {current ? 'Active' : selected ? 'Selected' : 'Ready'}
          </span>
        </div>

        <p className="portfolio-theme-card__description">{theme.description}</p>
        <p className="portfolio-theme-card__motion">{theme.motionStyle}</p>

        <div className="portfolio-theme-card__tags">
          {theme.featureTags.map((tag) => (
            <span key={tag} className="portfolio-theme-card__tag">{tag}</span>
          ))}
        </div>

        {onAction && (
          <button
            type="button"
            className="glass-btn small portfolio-theme-card__button"
            onClick={(event) => {
              event.stopPropagation()
              onAction(theme)
            }}
            disabled={current || loading}
          >
            {current ? 'Current Theme' : loading ? 'Applying...' : buttonLabel}
          </button>
        )}
      </div>
    </motion.article>
  )
}
