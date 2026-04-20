import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const navItems = [
  { label: 'Overview', tab: 'overview' },
  { label: 'My Portfolio', tab: 'portfolio' },
  { label: 'Ui Theme', tab: 'theme' },
  { label: 'Analytics', tab: 'analytics' },
  { label: 'AI Score', tab: 'score' },
  { label: 'Improve', tab: 'improve' },
  { label: 'Settings', tab: 'settings' },
]

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6a8.7 8.7 0 1 0 10.9 10.9Z" />
    </svg>
  )
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="dashboard-sidebar">
      <div onClick={() => navigate('/')} className="sidebar-brand" role="button" tabIndex={0} onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate('/')
        }
      }}>
        <span className="sidebar-brand-dot pulse-dot" aria-hidden="true" />
        <span className="sidebar-brand-text">Portify</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.tab}
            type="button"
            className={`sidebar-nav-item${activeTab === item.tab ? ' is-active' : ''}`}
            data-tab={item.tab}
            onClick={() => onTabChange(item.tab)}
          >
            {item.label}
          </button>
        ))}

        <button type="button" onClick={() => navigate('/dashboard/simulate')} className="sidebar-simulate-button">
          <span className="dark-theme-only">Simulate</span>
          <span className="light-theme-only">Simulate</span>
        </button>
      </nav>

      <button type="button" onClick={toggleTheme} className="sidebar-theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
        <span className="sidebar-theme-icon">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </span>
        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>

      <button
        type="button"
        className="sidebar-signout-button dark-theme-only"
        onClick={async () => {
          await logout()
          navigate('/login')
        }}
      >
        Sign Out
      </button>
    </aside>
  )
}
