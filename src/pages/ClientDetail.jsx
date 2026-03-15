import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const ST = {
  active: { label: 'Active', color: 'var(--green)' },
  paused: { label: 'Paused', color: 'var(--yellow)' },
  churned: { label: 'Churned', color: 'var(--red)' },
  lead: { label: 'Lead', color: 'var(--purple)' },
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [client, setClient] = useState(null)
  const [notes, setNotes] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [addMode, setAddMode] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [taskText, setTaskText] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const noteRef = useRef(null)
  const taskRef = useRef(null)

  useEffect(() => { fetchAll() }, [id])
  useEffect(() => {
    if (addMode === 'note' && noteRef.current) noteRef.current.focus()
    if (addMode === 'task' && taskRef.current) taskRef.current.focus()
  }, [addMode])

  async function fetchAll() {
    setLoading(true)
    const [cRes, nRes, tRes, uRes] = await Promise.all([
      supabase.from('clients').select('*, owner:users!owner_id(nickname)').eq('id', id).single(),
      supabase.from('notes').select('*, author:users!author_id(nickname)').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*, creator:users!created_by(nickname), assignee:users!assigned_to(nickname)').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('users').select('id, nickname'),
    ])
    setClient(cRes.data)
    setNotes(nRes.data || [])
    setTasks(tRes.data || [])
    setUsers(uRes.data || [])
    setLoading(false)
  }

  async function updateField(field, value) {
    await supabase.from('clients').update({ [field]: value }).eq('id', id)
    setClient(prev => ({ ...prev, [field]: value }))
  }

  async function addNote() {
    if (!noteText.trim()) return
    const { data } = await supabase.from('notes')
      .insert([{ client_id: id, text: noteText, author_id: user.id }])
      .select('*, author:users!author_id(nickname)').single()
    if (data) setNotes(prev => [data, ...prev])
    setNoteText('')
    setAddMode(null)
  }

  async function addTask() {
    if (!taskText.trim()) return
    const payload = {
      client_id: id,
      text: taskText,
      created_by: user.id,
      assigned_to: taskAssignee || null,
      due_date: taskDate || null,
    }
    const { data } = await supabase.from('tasks')
      .insert([payload])
      .select('*, creator:users!created_by(nickname), assignee:users!assigned_to(nickname)').single()
    if (data) setTasks(prev => [data, ...prev])
    setTaskText('')
    setTaskDate('')
    setTaskAssignee('')
    setAddMode(null)
  }

  async function toggleTask(taskId, done) {
    await supabase.from('tasks').update({ done: !done }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !done } : t))
  }

  function fmtDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) return <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
  if (!client) return <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted)', fontSize: 13 }}>Client not found</div>

  const items = [
    ...notes.map(n => ({ ...n, kind: 'note', ts: n.created_at })),
    ...tasks.map(t => ({ ...t, kind: 'task', ts: t.created_at })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts))

  const cardStyle = {
    background: 'var(--card)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
  }

  const fieldRow = { padding: '13px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <div style={{ padding: '14px 22px', background: 'var(--card)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5"
          style={{ background: 'none', border: 'none', color: 'var(--sub)', fontSize: 13 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      </div>

      <div style={{ maxWidth: 500, margin: '28px auto', padding: '0 16px' }}>
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div className="text-center" style={{ padding: '30px 24px 4px' }}>
            <div className="font-bold" style={{ fontSize: 20 }}>{client.name}</div>
            {client.description && <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 5 }}>{client.description}</div>}
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 20 }}>
              {client.contact || 'No contact added'}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div style={fieldRow}>
              <span style={{ fontSize: 13, color: 'var(--sub)' }}>Owner</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{client.owner?.nickname || '—'}</span>
            </div>
            <div style={fieldRow}>
              <span style={{ fontSize: 13, color: 'var(--sub)' }}>Contact</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{client.contact || '—'}</span>
            </div>
            <div style={{ ...fieldRow, borderBottom: 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--sub)' }}>Status</span>
              <div className="flex gap-1">
                {Object.entries(ST).map(([k, v]) => (
                  <button key={k} onClick={() => updateField('status', k)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: client.status === k ? `2px solid ${v.color}` : '1px solid var(--border)',
                      background: client.status === k ? v.color + '12' : 'transparent',
                      color: client.status === k ? v.color : 'var(--muted)',
                      transition: 'all 0.1s',
                    }}
                  >{v.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5" style={{ marginTop: 18 }}>
          <button onClick={() => setAddMode(addMode === 'note' ? null : 'note')}
            className="flex-1 flex flex-col items-center gap-2"
            style={{ ...cardStyle, padding: '16px 12px', fontSize: 12, color: addMode === 'note' ? 'var(--green)' : 'var(--sub)', borderColor: addMode === 'note' ? 'var(--green)' : 'var(--border)', transition: 'all 0.15s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>
            </svg>
            Add note
          </button>
          <button onClick={() => setAddMode(addMode === 'task' ? null : 'task')}
            className="flex-1 flex flex-col items-center gap-2"
            style={{ ...cardStyle, padding: '16px 12px', fontSize: 12, color: addMode === 'task' ? 'var(--green)' : 'var(--sub)', borderColor: addMode === 'task' ? 'var(--green)' : 'var(--border)', transition: 'all 0.15s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Add task
          </button>
        </div>

        {addMode === 'note' && (
          <div style={{ ...cardStyle, marginTop: 14, padding: '16px 18px' }}>
            <textarea ref={noteRef} value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Write a note..." rows={3}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote(); if (e.key === 'Escape') setAddMode(null) }}
              style={{ width: '100%', resize: 'vertical', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', background: 'var(--input-bg)', fontSize: 13, color: 'var(--text)', minHeight: 70 }} />
            <div className="flex justify-between items-center" style={{ marginTop: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>⌘+Enter to save</span>
              <div className="flex gap-2">
                <button onClick={() => setAddMode(null)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--sub)', fontSize: 12 }}>Cancel</button>
                <button onClick={addNote} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>Save note</button>
              </div>
            </div>
          </div>
        )}

        {addMode === 'task' && (
          <div style={{ ...cardStyle, marginTop: 14, padding: '16px 18px' }}>
            <input ref={taskRef} value={taskText} onChange={e => setTaskText(e.target.value)}
              placeholder="Task description..."
              onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAddMode(null) }}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', background: 'var(--input-bg)', fontSize: 13, color: 'var(--text)' }} />
            <div className="flex gap-2" style={{ marginTop: 10 }}>
              <div className="flex-1">
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Due date</label>
                <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input-bg)', fontSize: 12, color: 'var(--text)' }} />
              </div>
              <div className="flex-1">
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Assign to</label>
                <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input-bg)', fontSize: 12, color: 'var(--text)' }}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.nickname}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2" style={{ marginTop: 12 }}>
              <button onClick={() => setAddMode(null)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--sub)', fontSize: 12 }}>Cancel</button>
              <button onClick={addTask} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>Add task</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2" style={{ marginTop: 22, marginBottom: 40 }}>
          {items.length === 0 && !addMode && (
            <div className="text-center" style={{ ...cardStyle, padding: 32, color: 'var(--muted)', fontSize: 13 }}>No notes or tasks yet</div>
          )}

          {items.map(item => item.kind === 'task' ? (
            <div key={'t-' + item.id} style={{ ...cardStyle, overflow: 'hidden' }}>
              <div onClick={() => toggleTask(item.id, item.done)} className="flex items-start gap-3 cursor-pointer" style={{ padding: '14px 18px' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: item.done ? 'none' : '2px solid var(--muted)',
                  background: item.done ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}>
                  {item.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 500, color: item.done ? 'var(--muted)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1" style={{ marginTop: 5, fontSize: 11, color: 'var(--muted)' }}>
                    <span>by {item.creator?.nickname || 'unknown'}</span>
                    {item.assignee?.nickname && <span>→ {item.assignee.nickname}</span>}
                    {item.due_date && (
                      <span style={{ color: item.done ? 'var(--muted)' : new Date(item.due_date) < new Date() ? 'var(--red)' : 'var(--sub)' }}>
                        due {fmtDate(item.due_date)}
                      </span>
                    )}
                    <span>{fmtDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div key={'n-' + item.id} style={{ ...cardStyle, padding: '14px 18px' }}>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)' }}>{item.text}</div>
              <div className="flex justify-end gap-2" style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                <span>{item.author?.nickname || 'unknown'}</span>
                <span>·</span>
                <span>{fmtDate(item.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
