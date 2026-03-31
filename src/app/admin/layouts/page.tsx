'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Copy, Map } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Layout {
  id: string
  name: string
  description?: string | null
  width: number
  height: number
  _count?: { seats: number }
  venue: { name: string }
  createdAt: string
}

interface Venue {
  id: string
  name: string
}

export default function LayoutsPage() {
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', venueId: '' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function loadData() {
    const [layoutsRes, venuesRes] = await Promise.all([
      fetch('/api/layouts'),
      fetch('/api/venues'),
    ])
    if (layoutsRes.ok) setLayouts(await layoutsRes.json())
    if (venuesRes.ok) {
      const vs = await venuesRes.json()
      setVenues(vs)
      if (vs.length && !form.venueId) setForm((f) => ({ ...f, venueId: vs[0].id }))
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function createLayout(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.venueId) return
    setSaving(true)
    try {
      const res = await fetch('/api/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const layout = await res.json()
        setShowCreate(false)
        setForm({ name: '', description: '', venueId: venues[0]?.id ?? '' })
        window.location.href = `/admin/layouts/${layout.id}/editor`
      }
    } finally {
      setSaving(false)
    }
  }

  async function duplicateLayout(layout: Layout) {
    const res = await fetch('/api/layouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${layout.name} (Copy)`,
        venueId: venues.find((v) => v.name === layout.venue.name)?.id ?? venues[0]?.id,
      }),
    })
    if (res.ok) await loadData()
  }

  async function deleteLayout(id: string) {
    const res = await fetch(`/api/layouts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLayouts((prev) => prev.filter((l) => l.id !== id))
      setDeleteId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seating Layouts</h1>
          <p className="text-gray-500 mt-1">Design and manage venue seating arrangements.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
          New Layout
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-40" />
          ))}
        </div>
      ) : layouts.length === 0 ? (
        <div className="text-center py-20">
          <Map className="w-10 h-10 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No layouts yet. Create your first seating layout.</p>
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
            New Layout
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layouts.map((layout) => (
            <div key={layout.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <Map className="w-10 h-10 text-indigo-300" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900">{layout.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {layout._count?.seats ?? 0} seats · {layout.width}×{layout.height} · {layout.venue.name}
                </p>
                {layout.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{layout.description}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Link href={`/admin/layouts/${layout.id}/editor`} className="flex-1">
                    <Button variant="outline" size="sm" icon={<Edit2 className="w-3 h-3" />} className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Copy className="w-3 h-3" />}
                    onClick={() => duplicateLayout(layout)}
                    title="Duplicate"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-3 h-3 text-red-400" />}
                    onClick={() => setDeleteId(layout.id)}
                    title="Delete"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Seating Layout">
        <form onSubmit={createLayout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Layout Name *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Main Hall - Theatre"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value })}
              required
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
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
              placeholder="Optional description"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Create & Edit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Layout">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this layout? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && deleteLayout(deleteId)} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
