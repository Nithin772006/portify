import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const mutedText = 'var(--muted)'
const dangerText = 'var(--danger)'
const dangerSoft = 'var(--danger-soft)'
const dangerBorder = '1px solid var(--danger-border)'
const linkColor = 'var(--link)'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative', isolation: 'isolate' }}>
      <div className="static-page-backdrop" />

      <div className="glass auth-card" style={{ maxWidth: 500, width: '100%', padding: 48 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 20, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="pulse-dot">●</span> Portify
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>Welcome back</h1>
          <p style={{ fontSize: 15, color: mutedText, marginTop: 6, lineHeight: 1.6 }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ background: dangerSoft, border: dangerBorder, borderRadius: 10, padding: '14px 18px', marginBottom: 18, fontSize: 14, color: dangerText }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontFamily: 'monospace', color: mutedText, display: 'block', marginBottom: 8 }}>Email</label>
            <input
              className="glass-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontFamily: 'monospace', color: mutedText, display: 'block', marginBottom: 8 }}>Password</label>
            <input
              className="glass-input"
              type="password"
              placeholder="********"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="glass-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
            {loading ? <div className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 15, color: mutedText }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: linkColor, borderBottom: '1px solid var(--border)' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
