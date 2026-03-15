import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return setError('Fill in all fields')
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 380, background: 'var(--card)', borderRadius: 'var(--radius-lg)',
          padding: '44px 40px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
        }}
      >
        <div className="text-center" style={{ marginBottom: 36 }}>
          <div className="font-bold" style={{ fontSize: 24, letterSpacing: '-0.5px' }}>
            smash<span style={{ color: 'var(--muted)' }}>.crm</span>
          </div>
          <div style={{ color: 'var(--sub)', fontSize: 13, marginTop: 8 }}>Sign in to your workspace</div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--sub)', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--input-bg)',
                fontSize: 13, color: 'var(--text)',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--sub)', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--input-bg)',
                fontSize: 13, color: 'var(--text)',
              }}
            />
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: 12, padding: '4px 0' }}>{error}</div>}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '11px 16px', borderRadius: 'var(--radius)', border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
              marginTop: 4, opacity: loading ? 0.6 : 1, boxShadow: 'var(--shadow-sm)',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}
