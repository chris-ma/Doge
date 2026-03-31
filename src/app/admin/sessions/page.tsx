'use client'

import { useEffect, useState } from 'react'
import { Plus, CalendarDays, Clock, Trash2, Edit2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'

interface Session {
  id: string
  name: string
  description?: string | null
  date: string
  startTime: string
  endTime?: string | null
  status: string
  venue: { id: string; name: string }
  layout: { id: string; name: string }
  _count?: { bookings: number }
}

interface Venue { id: string; name: string }
interface Layout { id: string; name: string; venueId: string }

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venueId: '',
    layoutId: '',
  })

  async function loadData() {
    const [sessRes, venuesRes, layoutsRes] = await Promise.all([
      fetch('/api/sessions'),
      fetch('/api/venues'),
      fetch('/api/layouts'),
    ])
    if (sessRes.ok) setSessions(await sessRes.json())
    if (venuesRes.ok) setVenues(await venuesRes.json())
    if (layoutsRes.ok) setLayouts(await layoutsRes.json())
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filteredLayouts = layouts.filter((l) => !form.venueId || l.venueId === form.venueId)

  function openCreate() {
    setEditSession(null)
    setForm({ name: '', description: '', date: '', startTime: '', endTime: '', venueId: venues[0]?.id ?? '', layoutId: '' })
    setShowModal(true)
  }

  function openEdit(s: Session) {
    setEditSession(s)
    setForm({
      name: s.name,
      description: s.description ?? '',
      date: s.date.slice(0, 10),
      startTime: s.startTime,
      endTime: s.endTime ?? '',
      venueId: s.venue.id,
      layoutId: s.layout.id,
    })
    setShowModal(true)
  }

  async function saveSession(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editSession ? `/api/sessions/${editSession.id}` : '/api/sessions'
      const method = editSession ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, endTime: form.endTime || undefined, description: form.description || undefined }),
      })
      if (res.ok) {
        setShowModal(false)
        await loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function cancelSession(id: string) {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    if (res.ok) {
      setDeleteId(null)
      await loadData()
    }
  }

  const statusVariant = (s: string) =>
    s === 'ACTIVE' ? 'success' : s === 'CANCELLED' ? 'danger' : 'default'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 mt-1">Manage events and time slots for booking.</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>New Session</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse h-20" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No sessions yet. Create one to start accepting bookings.</p>
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>New Session</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Session</th>
                <th className="px-6 py-3 text-left">Date & Time</th>
                <th className="px-6 py-3 text-left">Venue / Layout</th>
                <th className="px-6 py-3 text-left">Bookings</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    {s.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {s.startTime}{s.endTime ? ` – ${s.endTime}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700">{s.venue.name}</p>
                    <p className="text-xs text-gray-400">{s.layout.name}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {s._count?.bookings ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Cancel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editSession ? 'Edit Session' : 'New Session'}>
        <form onSubmit={saveSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Name *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Evening Show - March 2025"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value, layoutId: '' })}
              required
            >
              <option value="">Select venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seating Layout *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.layoutId}
              onChange={(e) => setForm({ ...form, layoutId: e.target.value })}
              required
            >
              <option value="">Select layout</option>
              {filteredLayouts.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editSession ? 'Save Changes' : 'Create Session'}</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Cancel Session">
        <p className="text-gray-600 mb-6">Are you sure you want to cancel this session? Existing bookings will need to be refunded manually.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Back</Button>
          <Button variant="danger" onClick={() => deleteId && cancelSession(deleteId)} className="flex-1">Cancel Session</Button>
        </div>
      </Modal>
    </div>
  )
}
