export type PortfolioTheme = {
  id: string
  name: string
  tagline: string
  description: string
  templateKey: string
  accentColor: string
  secondaryColor: string
  surfaceTint: string
  previewGradient: string
  motionStyle: string
  featureTags: string[]
  sortOrder: number
  isActive: boolean
}

export type ThemeCatalogResponse = {
  themes: PortfolioTheme[]
  defaultThemeId: string
}
