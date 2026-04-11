import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="landing-nav-shell" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'var(--overlay)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      minHeight: 60,
      padding: '12px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div
        className="landing-nav-brand"
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
        <span
          className="pulse-dot"
          aria-hidden="true"
          style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}
        />
        Portify
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <a
          href="#about"
          className="landing-nav-link"
          style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-strong)', textDecoration: 'none' }}
        >
          About
        </a>
        <a
          href="#contact"
          className="landing-nav-link"
          style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-strong)', textDecoration: 'none' }}
        >
          Contact
        </a>
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
