import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'var(--overlay)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      height: 60,
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div
        onClick={() => navigate('/')}
        style={{
          fontFamily: 'monospace',
          fontWeight: 'bold',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span className="pulse-dot" style={{ color: 'var(--fg)' }}>●</span>
        Portify
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          className="glass-btn small"
          onClick={() => navigate('/login')}
        >
          Sign In
        </button>
        <button
          className="glass-btn"
          onClick={() => navigate('/register')}
        >
          Get Started
        </button>
      </div>
    </nav>
  )
}
