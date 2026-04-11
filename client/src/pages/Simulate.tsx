import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { API, buildPortfolioUrl } from '../hooks/useAuth'

const attentionZones = [
  { section: 'name-title', label: 'Name & Title', weight: 1.0, timeRange: [0, 1.5], color: 'rgba(255,255,255,0.4)' },
  { section: 'skills', label: 'Skills', weight: 0.85, timeRange: [1.5, 3.0], color: 'rgba(255,255,255,0.3)' },
  { section: 'latest-project', label: 'Latest Project', weight: 0.7, timeRange: [3.0, 4.5], color: 'rgba(255,255,255,0.2)' },
  { section: 'experience', label: 'Experience', weight: 0.5, timeRange: [4.5, 5.5], color: 'rgba(255,255,255,0.12)' },
  { section: 'education', label: 'Education', weight: 0.2, timeRange: [5.5, 6.0], color: 'rgba(255,255,255,0.05)' },
]

const themeText = {
  primary: 'var(--fg)',
  muted: 'var(--muted)',
  mutedStrong: 'var(--muted-strong)',
  border: 'var(--border)',
  overlay: 'var(--overlay-strong)',
  panel: 'var(--surface-soft)',
  success: 'var(--success)',
  danger: 'var(--danger)',
} as const

export default function Simulate() {
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [countdown, setCountdown] = useState(6)
  const [done, setDone] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const previewUrl = buildPortfolioUrl(portfolio?.portfolioId, portfolio?.updatedAt)

  useEffect(() => {
    API.get('/portfolio/user/me').then(r => setPortfolio(r.data)).catch(() => navigate('/dashboard'))
  }, [])

  const startSimulation = () => {
    setRunning(true)
    setDone(false)
    setCountdown(6)


    const startTime = Date.now()

    timerRef.current = setInterval(() => {
      const e = (Date.now() - startTime) / 1000

      setCountdown(Math.max(0, Math.ceil(6 - e)))
      drawHeatmap(e)

      if (e >= 6) {
        clearInterval(timerRef.current)
        setRunning(false)
        setDone(true)
      }
    }, 50)
  }

  const drawHeatmap = (time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const iframe = iframeRef.current
    if (!iframe) return

    canvas.width = iframe.offsetWidth
    canvas.height = iframe.offsetHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const sectionHeight = canvas.height / attentionZones.length

    attentionZones.forEach((zone, i) => {
      const [start, end] = zone.timeRange
      if (time >= start) {
        const progress = Math.min((time - start) / (end - start), 1)
        const alpha = zone.weight * progress * 0.4
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fillRect(0, i * sectionHeight, canvas.width, sectionHeight)
      }
    })
  }

  const strongZones = attentionZones.filter(z => z.weight > 0.6)
  const deadZones = attentionZones.filter(z => z.weight < 0.3)
  const engagementScore = Math.round(attentionZones.reduce((s, z) => s + z.weight, 0) / attentionZones.length * 100)

  return (
    <div className="simulate-layout simulate-layout--immersive">
      <div className="simulate-preview-panel">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Portfolio"
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        {running && (
          <div style={{
            position: 'absolute',
            top: 24,
            right: 24,
            background: themeText.overlay,
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '16px 24px',
            fontFamily: 'monospace',
            fontSize: 48,
            fontWeight: 900,
          }}>
            {countdown}
          </div>
        )}
      </div>

      <div className="simulate-side-panel">
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: themeText.muted, fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', marginBottom: 24 }}>
          Back to Dashboard
        </button>

        <h2 className="simulate-title">Recruiter Simulation</h2>
        <p className="simulate-description">
          See what a recruiter focuses on when they spend 6 seconds on your portfolio.
        </p>

        {!running && !done && (
          <button className="glass-btn large simulate-start-button" onClick={startSimulation}>
            Start 6-Second Simulation
          </button>
        )}

        {running && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontFamily: 'monospace', fontSize: 13, color: themeText.muted }}>Scanning portfolio...</p>
          </div>
        )}

        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 64, fontWeight: 900 }}>{engagementScore}</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', color: themeText.muted }}>Recruiter Engagement Score</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: themeText.success, marginBottom: 12 }}>Strong Zones</h3>
              {strongZones.map(z => (
                <div key={z.section} className="glass" style={{ padding: '12px 16px', marginBottom: 8, fontSize: 13 }}>
                  {z.label} - <span style={{ color: themeText.muted }}>{Math.round(z.weight * 100)}% attention</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: themeText.danger, marginBottom: 12 }}>Dead Zones</h3>
              {deadZones.map(z => (
                <div key={z.section} className="glass" style={{ padding: '12px 16px', marginBottom: 8, fontSize: 13 }}>
                  {z.label} - <span style={{ color: themeText.muted }}>Move up for visibility</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>What to fix</h3>
              <div className="glass" style={{ padding: '12px 16px', marginBottom: 8, fontSize: 13, color: themeText.mutedStrong }}>
                Move your strongest project to the top - recruiters rarely scroll past the fold.
              </div>
              <div className="glass" style={{ padding: '12px 16px', marginBottom: 8, fontSize: 13, color: themeText.mutedStrong }}>
                Add your key skills near your name/title for immediate visibility.
              </div>
              <div className="glass" style={{ padding: '12px 16px', marginBottom: 8, fontSize: 13, color: themeText.mutedStrong }}>
                Education gets minimal attention - keep it brief and at the bottom.
              </div>
            </div>

            <button className="glass-btn simulate-start-button" onClick={startSimulation}>
              Run Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
