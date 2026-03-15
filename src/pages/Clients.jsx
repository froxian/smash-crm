import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ST = {
  lead: { label: 'Lead', color: 'var(--purple)' },
  convo: { label: 'Convo', color: 'var(--yellow)' },
  objections: { label: 'Objections', color: '#e67700' },
  active: { label: 'Active', color: 'var(--green)' },
  declined: { label: 'Declined', color: 'var(--red)' },
}

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [nc, setNc] = useState({ name: '', contact: '', status: 'lead' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('clients')
      .select('*, owner:users!owner_id(nickname), notes(id), tasks(id, done)')
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function addClient() {
    if (!nc.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('clients').insert([nc]).select().single()
    setSaving(false)
    if (!error && data) {
      setModal(false)
      setNc({ name: '', contact: '', status: 'lead' })
      navigate(`/client/${data.id}`)
    }
  }

  const list = clients.filter(c => {
    const mq = c.name.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase())
    return mq && (filter === 'all' || c.status === filter)
  })

  return (
    <>
      {/* Toolbar */}
      <div
        className="flex items-center gap-3"
        style={{ padding: '14px 22px', background: 'var(--card)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="relative flex-1" style={{ maxWidth: 360 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{
              width: '100%', padding: '9px 12px 9px 34px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', background: 'var(--input-bg)',
              fontSize: 13, color: 'var(--text)',
            }}
          />
        </div>

        <div className="flex gap-1">
          {['all', ...Object.keys(ST)].map(s => (
            <button
              key={s} onClick={() => setFilter(s)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${filter === s ? '#ccc' : 'var(--border)'}`,
                background: filter === s ? 'var(--bg)' : 'transparent',
                color: filter === s ? 'var(--text)' : 'var(--sub)',
                fontSize: 12, fontWeight: filter === s ? 600 : 400,
                transition: 'all 0.1s',
              }}
            >
              {s === 'all' ? 'All' : ST[s].label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5"
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add client
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto" style={{ background: 'var(--card)' }}>
        <div style={{ padding: '12px 22px 6px' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {loading ? '...' : `${list.length} client${list.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {!loading && list.map(c => {
          const notes = c.notes?.length || 0
          const tasks = c.tasks?.filter(t => !t.done)?.length || 0
          return (
            <div
              key={c.id} onClick={() => navigate(`/client/${c.id}`)}
              className="flex items-center gap-3 cursor-pointer transition-colors"
              style={{ padding: '13px 22px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate" style={{ fontSize: 13 }}>{c.name}</span>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ST[c.status]?.color, flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
                  {c.contact || 'No contact'}
                  {c.owner?.nickname && <span> · {c.owner.nickname}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0" style={{ fontSize: 11, color: 'var(--muted)' }}>
                {notes > 0 && <span style={{ background: 'var(--bg)', padding: '2px 7px', borderRadius: 5 }}>{notes} note{notes > 1 ? 's' : ''}</span>}
                {tasks > 0 && <span style={{ background: 'var(--bg)', padding: '2px 7px', borderRadius: 5 }}>{tasks} task{tasks > 1 ? 's' : ''}</span>}
              </div>
            </div>
          )
        })}

        {!loading && list.length === 0 && (
          <div className="text-center" style={{ padding: 60, color: 'var(--muted)', fontSize: 13 }}>
            {clients.length === 0 ? 'No clients yet. Add your first one!' : 'No results found'}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.15)' }} onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 400, background: 'var(--card)', borderRadius: 'var(--radius-lg)',
            padding: '32px 30px 28px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
          }}>
            <div className="font-bold" style={{ fontSize: 16, marginBottom: 22 }}>New client</div>
            <div className="flex flex-col gap-3">
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--sub)', display: 'block', marginBottom: 5 }}>Name</label>
                <input value={nc.name} onChange={e => setNc({ ...nc, name: e.target.value })} placeholder="Client name"
                  style={{ width: '100%', padding: '9px 13px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--input-bg)', fontSize: 13, color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--sub)', display: 'block', marginBottom: 5 }}>Contact</label>
                <input value={nc.contact} onChange={e => setNc({ ...nc, contact: e.target.value })} placeholder="@telegram or email"
                  style={{ width: '100%', padding: '9px 13px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--input-bg)', fontSize: 13, color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--sub)', display: 'block', marginBottom: 5 }}>Status</label>
                <select value={nc.status} onChange={e => setNc({ ...nc, status: e.target.value })}
                  style={{ width: '100%', padding: '9px 13px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--input-bg)', fontSize: 13, color: 'var(--text)' }}>
                  {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <button onClick={() => setModal(false)} className="flex-1"
                  style={{ padding: 10, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--sub)', fontSize: 13 }}>
                  Cancel
                </button>
                <button onClick={addClient} disabled={saving} className="flex-1"
                  style={{ padding: 10, borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, opacity: saving ? 0.6 : 1, boxShadow: 'var(--shadow-sm)' }}>
                  {saving ? 'Adding...' : 'Add client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
