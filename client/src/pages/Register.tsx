import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DotWave from '../components/DotWave'

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await registerUser(name, email, password)
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <DotWave />

      <div className="glass" style={{ maxWidth: 420, width: '100%', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="pulse-dot">●</span> Portify
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Start building your portfolio in seconds</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Full Name</label>
            <input className="glass-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="glass-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="glass-input" type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Confirm Password</label>
            <input className="glass-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>

          <button className="glass-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? <div className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#71717a' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#fafafa', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
