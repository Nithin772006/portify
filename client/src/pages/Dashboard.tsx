import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import Sidebar from '../components/Sidebar'
import { useAuth, API } from '../hooks/useAuth'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
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
      <main style={{ marginLeft: 240, flex: 1, padding: '32px 40px' }}>
        {activeTab === 'overview' && <OverviewTab portfolio={portfolio} analytics={analytics} />}
        {activeTab === 'portfolio' && <PortfolioTab portfolio={portfolio} onRegenerate={loadData} />}
        {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} />}
        {activeTab === 'score' && <ScoreTab portfolio={portfolio} />}
        {activeTab === 'improve' && <ImproveTab portfolio={portfolio} />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </main>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({ portfolio, analytics }: any) {
  const [copied, setCopied] = useState(false)

  const stats = [
    { label: 'Portfolio Score', value: portfolio?.score || 0, suffix: '/100' },
    { label: 'Total Views', value: analytics?.totalViews || 0, suffix: '' },
    { label: 'Unique Visitors', value: analytics?.uniqueVisitors || 0, suffix: '' },
    { label: 'Avg. Time on Page', value: Math.round(analytics?.avgTimeOnPage || 0), suffix: 's' },
  ]

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${portfolio?.portfolioId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass"
            style={{ padding: 24 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b', letterSpacing: '0.1em', marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900 }}>
              <AnimatedCounter value={stat.value} />
              <span style={{ fontSize: 14, color: '#71717a', fontWeight: 400 }}>{stat.suffix}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Portfolio URL */}
      <div className="glass" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b', marginBottom: 4 }}>YOUR PORTFOLIO URL</div>
          <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#a1a1aa' }}>
            {window.location.origin}/p/{portfolio?.portfolioId}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="glass-btn small" onClick={copyLink}>
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>
          <a href={`http://localhost:3001/p/${portfolio?.portfolioId}.html`} target="_blank" className="glass-btn small" style={{ textDecoration: 'none' }}>
            View Live
          </a>
        </div>
      </div>

      {/* Suggestions */}
      {portfolio?.suggestions?.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Suggestions to improve</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {portfolio.suggestions.map((s: any, i: number) => (
              <div key={i} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: s.priority === 'critical' ? 'rgba(239,68,68,0.15)' : s.priority === 'high' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                    color: s.priority === 'critical' ? '#fca5a5' : s.priority === 'high' ? '#fcd34d' : '#a1a1aa',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    {s.priority}
                  </span>
                  <span style={{ fontSize: 14 }}>{s.text}</span>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ade80' }}>+{s.pts} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Portfolio Tab ─── */
function PortfolioTab({ portfolio, onRegenerate }: any) {
  const [regenerating, setRegenerating] = useState(false)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await API.put(`/portfolio/${portfolio.portfolioId}/regenerate`, { formData: portfolio.formData })
      onRegenerate()
    } catch {
      alert('Regeneration failed')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>My Portfolio</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="glass-btn small" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <><div className="spinner" /> Regenerating...</> : 'Regenerate'}
          </button>
        </div>
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <iframe
          src={`http://localhost:3001/p/${portfolio?.portfolioId}.html`}
          style={{ width: '100%', height: 600, border: 'none', background: '#0a0a0a' }}
          title="Portfolio Preview"
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
  const COLORS = ['#fafafa', '#a1a1aa', '#52525b', '#27272a']
  const devices = analytics?.deviceBreakdown || []

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Views Chart */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontFamily: 'monospace', color: '#71717a', marginBottom: 16 }}>Views last 30 days</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyViews.length ? dailyViews : [{ date: 'Today', views: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#52525b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#52525b' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="views" stroke="#fafafa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontFamily: 'monospace', color: '#71717a', marginBottom: 16 }}>Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
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
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {sources.map((s: any, i: number) => (
              <span key={s.source} style={{ fontSize: 11, fontFamily: 'monospace', color: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                {s.source}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Section Engagement */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontFamily: 'monospace', color: '#71717a', marginBottom: 16 }}>Section Engagement</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sections.length ? sections : [{ section: 'No data', avgTimeMs: 0 }]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#52525b' }} />
              <YAxis dataKey="section" type="category" tick={{ fontSize: 11, fill: '#52525b' }} width={100} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="avgTimeMs" fill="#fafafa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontFamily: 'monospace', color: '#71717a', marginBottom: 16 }}>Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
  const circumference = 2 * Math.PI * 80
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
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>AI Score</h1>

      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
        {/* Big Score Circle */}
        <div style={{ textAlign: 'center' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <motion.circle
              cx="100" cy="100" r="80" fill="none" stroke="#fafafa" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              transform="rotate(-90 100 100)"
            />
            <text x="100" y="95" textAnchor="middle" fill="#fafafa" fontSize="42" fontWeight="900">{score}</text>
            <text x="100" y="118" textAnchor="middle" fill="#71717a" fontSize="13" fontFamily="monospace">out of 100</text>
          </svg>
        </div>

        {/* Dimension Bars */}
        <div style={{ flex: 1 }}>
          {dimensions.map((dim) => (
            <div key={dim.label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{dim.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717a' }}>{dim.value}/{dim.max}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(dim.value / dim.max) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  style={{ height: '100%', background: '#fafafa', borderRadius: 3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {portfolio?.suggestions?.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>How to improve</h3>
          {portfolio.suggestions.map((s: any, i: number) => (
            <div key={i} className="glass" style={{ padding: '14px 20px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>{s.text}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ade80' }}>+{s.pts} pts</span>
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
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Improve</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* JD Matcher */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Job Description Matcher</h3>
          <textarea className="glass-input" value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste a job description..." rows={6} />
          <button className="glass-btn" style={{ marginTop: 12 }} onClick={analyzeJD} disabled={jdLoading || !jdText.trim()}>
            {jdLoading ? <div className="spinner" /> : 'Analyze'}
          </button>

          {jdResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 12 }}>{jdResult.matchPercentage}% <span style={{ fontSize: 16, color: '#71717a', fontWeight: 400 }}>match</span></div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#52525b', marginBottom: 8 }}>MATCHED SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {jdResult.matchedSkills?.map((s: string) => (
                    <span key={s} style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontFamily: 'monospace', background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#52525b', marginBottom: 8 }}>MISSING SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {jdResult.missingSkills?.map((s: string) => (
                    <span key={s} style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.15)', color: '#a1a1aa' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Skill Insights */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Location Skill Insights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
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
          <button className="glass-btn" onClick={getTrending} disabled={trendingLoading}>
            {trendingLoading ? <div className="spinner" /> : 'Get Insights'}
          </button>

          {trendingData && (
            <div style={{ marginTop: 20 }}>
              {trendingData.trending?.map((item: any) => {
                const userHas = trendingData.userHas?.some((s: string) => s.toLowerCase() === item.skill.toLowerCase())
                return (
                  <div key={item.skill} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: userHas ? '#fafafa' : '#71717a' }}>{item.skill}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#52525b' }}>{item.demandPercentage}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${item.demandPercentage}%`,
                        background: userHas ? '#fafafa' : 'transparent',
                        borderRadius: 2,
                        border: userHas ? 'none' : '1px solid rgba(255,255,255,0.15)',
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
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Settings</h1>
      <div className="glass" style={{ padding: 24, maxWidth: 480 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Name</label>
            <input className="glass-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="glass-input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
        <button
          className="glass-btn"
          style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
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
  const ref = useRef<ReturnType<typeof requestAnimationFrame>>()

  useEffect(() => {
    let start = 0
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
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 13, color: '#71717a' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
