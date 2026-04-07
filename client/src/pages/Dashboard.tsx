import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import Sidebar from '../components/Sidebar'
import AIChatAgent from '../components/AIChatAgent'
import { useAuth, API, buildPortfolioUrl } from '../hooks/useAuth'
import { useFormStore } from '../store/formStore'

const themeText = {
  primary: 'var(--fg)',
  muted: 'var(--muted)',
  mutedStrong: 'var(--muted-strong)',
  border: 'var(--border)',
  track: 'var(--track)',
  success: 'var(--success)',
  successSoft: 'var(--success-soft)',
  successBorder: '1px solid var(--success-border)',
  warning: 'var(--warning)',
  warningSoft: 'var(--warning-soft)',
  warningBorder: '1px solid var(--warning-border)',
  danger: 'var(--danger)',
  dangerSoft: 'var(--danger-soft)',
  dangerBorder: '1px solid var(--danger-border)',
  chipBg: 'var(--chip-bg)',
  chipBorder: '1px solid var(--chip-border)',
  chipText: 'var(--chip-text)',
}

const pageTitleStyle: CSSProperties = {
  fontSize: 34,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  marginBottom: 36,
  color: themeText.primary,
}

const dashboardButtonStyle: CSSProperties = {
  fontSize: 16,
  padding: '14px 28px',
  borderRadius: 9999,
  fontFamily: 'monospace',
  fontWeight: 600,
}

const chartTickStyle = { fontSize: 13, fill: 'var(--muted)' } as const

const chartTooltipStyle: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 15,
  color: 'var(--fg)',
}

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'] as const

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const resetForm = useFormStore((state) => state.reset)
  const [activeTab, setActiveTab] = useState('overview')
  const [portfolio, setPortfolio] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const pRes = await API.get('/portfolio/user/me')
      setPortfolio(pRes.data)
      try {
        const aRes = await API.get(`/analytics/${pRes.data.portfolioId}`)
        setAnalytics(aRes.data)
      } catch { setAnalytics(null) }
    } catch {
      // No portfolio yet - redirect to onboarding
      navigate('/onboarding')
      return
    } finally {
      setLoading(false)
    }
  }

  const handlePortfolioDeleted = () => {
    resetForm()
    setPortfolio(null)
    setAnalytics(null)
    setActiveTab('overview')
    navigate('/onboarding', { replace: true })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main style={{ marginLeft: 320, flex: 1, padding: 48, lineHeight: 1.7 }}>
        {activeTab === 'overview' && <OverviewTab portfolio={portfolio} analytics={analytics} />}
        {activeTab === 'portfolio' && <PortfolioTab portfolio={portfolio} onRegenerate={loadData} onDeleteSuccess={handlePortfolioDeleted} />}
        {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} />}
        {activeTab === 'score' && <ScoreTab portfolio={portfolio} />}
        {activeTab === 'improve' && <ImproveTab portfolio={portfolio} />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </main>
      {portfolio && activeTab === 'portfolio' && <AIChatAgent portfolioId={portfolio.portfolioId} onDesignApplied={loadData} />}
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({ portfolio, analytics }: any) {
  const [copied, setCopied] = useState(false)
  const publicPortfolioUrl = buildPortfolioUrl(portfolio?.portfolioId)

  const stats = [
    { label: 'Portfolio Score', value: portfolio?.score || 0, suffix: '/100' },
    { label: 'Total Views', value: analytics?.totalViews || 0, suffix: '' },
    { label: 'Unique Visitors', value: analytics?.uniqueVisitors || 0, suffix: '' },
    { label: 'Avg. Time on Page', value: Math.round(analytics?.avgTimeOnPage || 0), suffix: 's' },
  ]

  const copyLink = () => {
    navigator.clipboard.writeText(publicPortfolioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h1 style={pageTitleStyle}>Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass"
            style={{ padding: 40, minHeight: 150 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div style={{ fontSize: 14, fontFamily: 'monospace', color: themeText.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              <AnimatedCounter value={stat.value} />
              <span style={{ fontSize: 20, color: themeText.muted, fontWeight: 400, verticalAlign: 'middle' }}>{stat.suffix}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Portfolio URL */}
      <div className="glass" style={{ padding: '28px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontFamily: 'monospace', color: themeText.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>YOUR PORTFOLIO URL</div>
          <div style={{ fontFamily: 'monospace', fontSize: 17, color: themeText.primary }}>
            {publicPortfolioUrl}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="glass-btn small" onClick={copyLink} style={dashboardButtonStyle}>
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>
          <a href={publicPortfolioUrl} target="_blank" rel="noreferrer" className="glass-btn small" style={{ ...dashboardButtonStyle, textDecoration: 'none' }}>
            View Live
          </a>
        </div>
      </div>

      {/* Suggestions */}
      {portfolio?.suggestions?.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Suggestions to improve</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {portfolio.suggestions.map((s: any, i: number) => {
              let badgeBg = themeText.chipBg
              let badgeColor = themeText.chipText
              let badgeBorder = themeText.chipBorder
              if (s.priority === 'critical') {
                badgeBg = themeText.dangerSoft
                badgeColor = themeText.danger
                badgeBorder = themeText.dangerBorder
              } else if (s.priority === 'high') {
                badgeBg = themeText.warningSoft
                badgeColor = themeText.warning
                badgeBorder = themeText.warningBorder
              }
              return (
                <div key={i} className="glass" style={{ padding: '24px 28px', minHeight: 72, display: 'flex', alignItems: 'center', gap: 18 }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: badgeBg,
                    color: badgeColor,
                    border: badgeBorder,
                    letterSpacing: '0.08em',
                  }}>
                    {s.priority.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 16, color: themeText.primary, flex: 1 }}>{s.text}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: themeText.success, marginLeft: 'auto', whiteSpace: 'nowrap' }}>+{s.pts} pts</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Portfolio Tab ─── */
function PortfolioTab({ portfolio, onRegenerate, onDeleteSuccess }: any) {
  const [regenerating, setRegenerating] = useState(false)
  const [exportingZip, setExportingZip] = useState(false)
  const [deletingPortfolio, setDeletingPortfolio] = useState(false)
  const previewUrl = buildPortfolioUrl(portfolio?.portfolioId, portfolio?.updatedAt)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await API.put(`/portfolio/${portfolio.portfolioId}/regenerate`, { formData: portfolio.formData })
      await onRegenerate()
    } catch {
      alert('Regeneration failed')
    } finally {
      setRegenerating(false)
    }
  }

  const handleExportZip = async () => {
    setExportingZip(true)
    try {
      const res = await API.post(`/portfolio/${portfolio.portfolioId}/export/zip`, null, {
        responseType: 'blob',
      })
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = getZipFilename(
        res.headers['content-disposition'],
        `${slugify(portfolio?.formData?.name || portfolio?.portfolioId || 'portfolio')}-portfolio.zip`,
      )
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      alert('ZIP export failed')
    } finally {
      setExportingZip(false)
    }
  }

  const handleDeletePortfolio = async () => {
    const confirmed = window.confirm('Delete this portfolio and its analytics? You will be redirected to create a new one.')
    if (!confirmed) {
      return
    }

    setDeletingPortfolio(true)
    try {
      await API.delete(`/portfolio/${portfolio.portfolioId}`)
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setDeletingPortfolio(false)
        alert('Delete failed')
        return
      }
    }

    setDeletingPortfolio(false)
    onDeleteSuccess()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
        <h1 style={{ ...pageTitleStyle, marginBottom: 0 }}>My Portfolio</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            className="glass-btn small"
            onClick={handleExportZip}
            disabled={exportingZip || deletingPortfolio}
            style={{
              ...dashboardButtonStyle,
              background: '#050505',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.82)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {exportingZip
              ? (
                <>
                  <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.22)', borderTopColor: '#ffffff' }} />
                  Exporting...
                </>
              )
              : 'Export ZIP'}
          </button>
          <button
            className="glass-btn small"
            onClick={handleDeletePortfolio}
            disabled={deletingPortfolio || exportingZip || regenerating}
            style={{
              ...dashboardButtonStyle,
              color: themeText.danger,
              background: themeText.dangerSoft,
              border: themeText.dangerBorder,
            }}
          >
            {deletingPortfolio ? <><div className="spinner" /> Deleting...</> : 'Delete Portfolio'}
          </button>
          <button className="glass-btn small" onClick={handleRegenerate} disabled={regenerating || deletingPortfolio} style={dashboardButtonStyle}>
            {regenerating ? <><div className="spinner" /> Regenerating...</> : 'Regenerate'}
          </button>
        </div>
      </div>
      <div style={{ border: `1px solid ${themeText.border}`, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
        <iframe
          key={previewUrl}
          src={previewUrl}
          style={{ width: '100%', height: 'min(760px, calc(100vh - 220px))', minHeight: 520, border: 'none', background: 'var(--bg-elevated)' }}
          title="Portfolio Preview"
          loading="lazy"
        />
      </div>
    </div>
  )
}

/* ─── Analytics Tab ─── */
function AnalyticsTab({ analytics }: any) {
  const dailyViews = analytics?.dailyViews || []
  const sources = analytics?.sourceBreakdown || []
  const sections = analytics?.sectionStats || []
  const devices = analytics?.deviceBreakdown || []

  return (
    <div>
      <h1 style={pageTitleStyle}>Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Views Chart */}
        <div className="glass" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 16, fontFamily: 'monospace', color: themeText.muted, marginBottom: 18 }}>Views last 30 days</h3>
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={dailyViews.length ? dailyViews : [{ date: 'Today', views: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tick={chartTickStyle} />
              <YAxis tick={chartTickStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="views" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources */}
        <div className="glass" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 16, fontFamily: 'monospace', color: themeText.muted, marginBottom: 18 }}>Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie
                data={sources.length ? sources : [{ source: 'No data', count: 1 }]}
                dataKey="count"
                nameKey="source"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
              >
                {(sources.length ? sources : [{ source: 'No data', count: 1 }]).map((_: any, i: number) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 12 }}>
            {sources.map((s: any, i: number) => (
              <span key={s.source} style={{ fontSize: 13, fontFamily: 'monospace', color: chartColors[i % chartColors.length], display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: chartColors[i % chartColors.length], display: 'inline-block' }} />
                {s.source}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Section Engagement */}
        <div className="glass" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 16, fontFamily: 'monospace', color: themeText.muted, marginBottom: 18 }}>Section Engagement</h3>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={sections.length ? sections : [{ section: 'No data', avgTimeMs: 0 }]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis type="number" tick={chartTickStyle} />
              <YAxis dataKey="section" type="category" tick={chartTickStyle} width={100} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="avgTimeMs" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="glass" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 16, fontFamily: 'monospace', color: themeText.muted, marginBottom: 18 }}>Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <StatRow label="Most used device" value={devices.length ? devices.reduce((a: any, b: any) => a.count > b.count ? a : b).device : 'N/A'} />
            <StatRow label="Total sessions" value={String(analytics?.uniqueVisitors || 0)} />
            <StatRow label="Avg time on page" value={`${Math.round(analytics?.avgTimeOnPage || 0)}s`} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── AI Score Tab ─── */
function ScoreTab({ portfolio }: any) {
  const score = portfolio?.score || 0
  const bd = portfolio?.breakdown || {}
  const circumference = 2 * Math.PI * 88
  const offset = circumference - (score / 100) * circumference

  const dimensions = [
    { label: 'Completeness', value: bd.completeness || 0, max: 20 },
    { label: 'Skill Relevance', value: bd.skillScore || 0, max: 20 },
    { label: 'Project Quality', value: bd.projectScore || 0, max: 20 },
    { label: 'ATS Keywords', value: bd.atsScore || 0, max: 20 },
    { label: 'Bio Strength', value: bd.bioScore || 0, max: 20 },
  ]

  return (
    <div>
      <h1 style={pageTitleStyle}>AI Score</h1>

      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
        {/* Big Score Circle */}
        <div style={{ textAlign: 'center' }}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="88" fill="none" stroke="var(--track)" strokeWidth="10" />
            <motion.circle
              cx="110" cy="110" r="88" fill="none" stroke="var(--chart-1)" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              transform="rotate(-90 110 110)"
            />
            <text x="110" y="105" textAnchor="middle" fill="var(--fg)" fontSize="48" fontWeight="900">{score}</text>
            <text x="110" y="132" textAnchor="middle" fill="var(--muted)" fontSize="16" fontFamily="monospace">out of 100</text>
          </svg>
        </div>

        {/* Dimension Bars */}
        <div style={{ flex: 1 }}>
          {dimensions.map((dim) => (
            <div key={dim.label} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{dim.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: themeText.muted }}>{dim.value}/{dim.max}</span>
              </div>
              <div style={{ height: 8, background: themeText.track, borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(dim.value / dim.max) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  style={{ height: '100%', background: 'var(--chart-1)', borderRadius: 4 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {portfolio?.suggestions?.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>How to improve</h3>
          {portfolio.suggestions.map((s: any, i: number) => (
            <div key={i} className="glass" style={{ padding: '18px 22px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{s.text}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 14, color: themeText.success }}>+{s.pts} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Improve Tab ─── */
function ImproveTab({ portfolio }: any) {
  const [jdText, setJdText] = useState('')
  const [jdResult, setJdResult] = useState<any>(null)
  const [jdLoading, setJdLoading] = useState(false)
  const [city, setCity] = useState('chennai')
  const [role, setRole] = useState(portfolio?.profession || 'software-engineer')
  const [trendingData, setTrendingData] = useState<any>(null)
  const [trendingLoading, setTrendingLoading] = useState(false)

  const analyzeJD = async () => {
    setJdLoading(true)
    try {
      const res = await API.post('/ai/match-jd', { portfolioId: portfolio?.portfolioId, jdText })
      setJdResult(res.data)
    } catch { alert('Analysis failed') }
    finally { setJdLoading(false) }
  }

  const getTrending = async () => {
    setTrendingLoading(true)
    try {
      const res = await API.get(`/skills/trending?city=${city}&role=${role}`)
      setTrendingData(res.data)
    } catch { alert('Failed to fetch') }
    finally { setTrendingLoading(false) }
  }

  return (
    <div>
      <h1 style={pageTitleStyle}>Improve</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* JD Matcher */}
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Job Description Matcher</h3>
          <textarea className="glass-input" value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste a job description..." rows={6} />
          <button className="glass-btn" style={{ ...dashboardButtonStyle, marginTop: 12 }} onClick={analyzeJD} disabled={jdLoading || !jdText.trim()}>
            {jdLoading ? <div className="spinner" /> : 'Analyze'}
          </button>

          {jdResult && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 54, fontWeight: 900, marginBottom: 14 }}>{jdResult.matchPercentage}% <span style={{ fontSize: 18, color: themeText.muted, fontWeight: 400 }}>match</span></div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontFamily: 'monospace', color: themeText.mutedStrong, marginBottom: 10 }}>MATCHED SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {jdResult.matchedSkills?.map((s: string) => (
                    <span key={s} style={{ padding: '6px 14px', borderRadius: 9999, fontSize: 13, fontFamily: 'monospace', background: themeText.successSoft, color: themeText.success, border: themeText.successBorder }}>{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontFamily: 'monospace', color: themeText.mutedStrong, marginBottom: 10 }}>MISSING SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {jdResult.missingSkills?.map((s: string) => (
                    <span key={s} style={{ padding: '6px 14px', borderRadius: 9999, fontSize: 13, fontFamily: 'monospace', border: themeText.chipBorder, color: themeText.chipText, background: themeText.chipBg }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Skill Insights */}
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Location Skill Insights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <select className="glass-input" value={city} onChange={e => setCity(e.target.value)}>
              <option value="chennai">Chennai</option>
              <option value="bangalore">Bangalore</option>
              <option value="new-york">New York</option>
              <option value="san-francisco">San Francisco</option>
              <option value="london">London</option>
            </select>
            <select className="glass-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="software-engineer">Software Engineer</option>
              <option value="ui-ux-designer">UI/UX Designer</option>
              <option value="data-scientist">Data Scientist</option>
              <option value="marketing-manager">Marketing Manager</option>
            </select>
          </div>
          <button className="glass-btn" onClick={getTrending} disabled={trendingLoading} style={dashboardButtonStyle}>
            {trendingLoading ? <div className="spinner" /> : 'Get Insights'}
          </button>

          {trendingData && (
            <div style={{ marginTop: 24 }}>
              {trendingData.trending?.map((item: any) => {
                const userHas = trendingData.userHas?.some((s: string) => s.toLowerCase() === item.skill.toLowerCase())
                return (
                  <div key={item.skill} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 16, color: userHas ? themeText.primary : themeText.muted }}>{item.skill}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: themeText.mutedStrong }}>{item.demandPercentage}%</span>
                    </div>
                    <div style={{ height: 6, background: themeText.track, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${item.demandPercentage}%`,
                        background: userHas ? 'var(--chart-1)' : 'transparent',
                        borderRadius: 3,
                        border: userHas ? 'none' : themeText.chipBorder,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Settings Tab ─── */
function SettingsTab({ user }: any) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')

  return (
    <div>
      <h1 style={pageTitleStyle}>Settings</h1>
      <div className="glass" style={{ padding: 32, maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontFamily: 'monospace', color: themeText.muted, display: 'block', marginBottom: 8 }}>Name</label>
            <input className="glass-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontFamily: 'monospace', color: themeText.muted, display: 'block', marginBottom: 8 }}>Email</label>
            <input className="glass-input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        <button
          className="glass-btn"
          style={{ ...dashboardButtonStyle, borderColor: 'var(--danger-border)', color: 'var(--danger)' }}
          onClick={async () => {
            if (confirm('Are you sure you want to sign out?')) {
              await logout()
              navigate('/login')
            }
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

/* ─── Helpers ─── */
function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const duration = 1000
    const startTime = Date.now()

    function tick() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.round(progress * value))
      if (progress < 1) {
        ref.current = requestAnimationFrame(tick)
      }
    }
    tick()
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value])

  return <>{display}</>
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--track)' }}>
      <span style={{ fontSize: 16, color: themeText.muted }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'portfolio'
}

function getZipFilename(contentDisposition: string | undefined, fallback: string) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i)
  return match?.[1] || fallback
}
