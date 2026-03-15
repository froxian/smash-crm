import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { key: 'customers', label: 'Customers', path: '/', active: true },
  { key: 'tickets', label: 'Tickets', path: null },
  { key: 'pipeline', label: 'Pipeline', path: null },
  { key: 'payments', label: 'Payments', path: null },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <aside
        className="flex flex-col flex-shrink-0"
        style={{ width: 230, background: 'var(--card)', borderRight: '1px solid var(--border)', boxShadow: '1px 0 4px rgba(0,0,0,0.02)' }}
      >
        <div style={{ padding: '20px 22px 16px' }}>
          <div
            className="font-bold cursor-pointer"
            style={{ fontSize: 16, letterSpacing: '-0.4px', color: 'var(--text)' }}
            onClick={() => navigate('/')}
          >
            smash<span style={{ color: 'var(--muted)' }}>.crm</span>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5" style={{ padding: '0 10px' }}>
          {NAV.map(item => {
            const isActive = item.active && (location.pathname === '/' || location.pathname.startsWith('/customer'))
            return (
              <div
                key={item.key}
                onClick={() => item.path && navigate(item.path)}
                className="flex items-center justify-between transition-all"
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'var(--bg)' : 'transparent',
                  color: item.active ? 'var(--text)' : 'var(--muted)',
                  cursor: item.active ? 'pointer' : 'default',
                }}
              >
                {item.label}
                {!item.active && <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>soon</span>}
              </div>
            )
          })}
        </nav>

        <div className="mt-auto" style={{ padding: '16px 18px', borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center font-semibold"
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'var(--bg)', fontSize: 12, color: 'var(--sub)',
                }}
              >
                {profile?.nickname?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{profile?.nickname || 'User'}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{profile?.role}</div>
              </div>
            </div>
            <button
              onClick={signOut}
              style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6 }}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  )
}
