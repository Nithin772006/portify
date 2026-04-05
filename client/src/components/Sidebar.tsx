import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

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

  return (
    <aside style={{
      width: 280,
      minHeight: '100vh',
      background: 'rgba(255,255,255,0.02)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      padding: '24px 16px',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div
        onClick={() => navigate('/')}
        style={{
          fontFamily: 'monospace',
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          marginBottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
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
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === item.tab ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === item.tab ? '#fafafa' : '#a1a1aa',
              fontFamily: 'monospace',
              fontSize: 15,
              letterSpacing: '0.01em',
              cursor: 'pointer',
              marginBottom: 4,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.tab) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
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
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            color: '#a1a1aa',
            fontFamily: 'monospace',
            fontSize: 15,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            marginTop: 16,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          🎯 Simulate
        </button>
      </nav>

      <button
        onClick={async () => {
          await logout()
          navigate('/login')
        }}
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'transparent',
          color: '#52525b',
          fontFamily: 'monospace',
          fontSize: 14,
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
