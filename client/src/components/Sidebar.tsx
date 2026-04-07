import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const navItems = [
  { label: 'Overview', tab: 'overview' },
  { label: 'My Portfolio', tab: 'portfolio' },
  { label: 'Analytics', tab: 'analytics' },
  { label: 'AI Score', tab: 'score' },
  { label: 'Improve', tab: 'improve' },
  { label: 'Settings', tab: 'settings' },
]

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside style={{
      width: 320,
      minHeight: '100vh',
      background: 'var(--panel)',
      borderRight: '1px solid var(--border)',
      padding: '28px 20px',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      letterSpacing: '0.01em',
    }}>
      <div
        onClick={() => navigate('/')}
        style={{
          fontFamily: 'monospace',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          marginBottom: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span className="pulse-dot">●</span>
        Portify
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.tab}
            onClick={() => onTabChange(item.tab)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '14px 18px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === item.tab ? 'var(--card-hover)' : 'transparent',
              color: activeTab === item.tab ? 'var(--fg)' : 'var(--muted-strong)',
              fontFamily: 'monospace',
              fontSize: 16,
              letterSpacing: '0.01em',
              cursor: 'pointer',
              marginBottom: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.tab) {
                e.currentTarget.style.background = 'var(--card)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.tab) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {item.label}
          </button>
        ))}

        <button
          onClick={() => navigate('/dashboard/simulate')}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--muted-strong)',
            fontFamily: 'monospace',
            fontSize: 16,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            marginTop: 18,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--card)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          🎯 Simulate
        </button>
      </nav>

      <button
        onClick={toggleTheme}
        style={{
          padding: '12px 18px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--fg)',
          fontFamily: 'monospace',
          fontSize: 15,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          marginBottom: 12,
        }}
      >
        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
      </button>

      <button
        onClick={async () => {
          await logout()
          navigate('/login')
        }}
        style={{
          padding: '12px 18px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--muted)',
          fontFamily: 'monospace',
          fontSize: 15,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        Sign Out
      </button>
    </aside>
  )
}
