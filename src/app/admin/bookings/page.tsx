'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Download, X, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import type { Booking } from '@/types'

interface Session { id: string; name: string }

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ sessionId: '', status: '', paymentStatus: '', search: '' })
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const loadBookings = useCallback(async () => {
    const params = new URLSearchParams()
    if (filters.sessionId) params.set('sessionId', filters.sessionId)
    if (filters.status) params.set('status', filters.status)
    if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus)

    const res = await fetch(`/api/bookings?${params}`)
    if (res.ok) setBookings(await res.json())
    setLoading(false)
  }, [filters.sessionId, filters.status, filters.paymentStatus])

  useEffect(() => {
    loadBookings()
    fetch('/api/sessions').then((r) => r.json()).then(setSessions)
  }, [loadBookings])

  const filteredBookings = bookings.filter((b) => {
    if (!filters.search) return true
    const q = filters.search.toLowerCase()
    return (
      b.customerName.toLowerCase().includes(q) ||
      b.customerEmail.toLowerCase().includes(q)
    )
  })

  async function cancelBooking(id: string) {
    setCancelling(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) {
        setSelectedBooking(null)
        await loadBookings()
      }
    } finally {
      setCancelling(null)
    }
  }

  function exportCSV() {
    const rows = [
      ['ID', 'Customer', 'Email', 'Phone', 'Session', 'Seats', 'Amount', 'Status', 'Payment', 'Created'],
      ...filteredBookings.map((b) => [
        b.id,
        b.customerName,
        b.customerEmail,
        b.customerPhone ?? '',
        b.session?.name ?? '',
        b.items?.map((i) => i.seat?.label).join(', ') ?? '',
        b.totalAmount.toFixed(2),
        b.status,
        b.paymentStatus,
        new Date(b.createdAt).toLocaleDateString(),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const paymentBadge = (s: string) =>
    s === 'SUCCESSFUL' ? 'success' : s === 'FAILED' ? 'danger' : s === 'REFUNDED' ? 'warning' : 'default'
  const statusBadge = (s: string) =>
    s === 'CONFIRMED' ? 'success' : s === 'CANCELLED' ? 'danger' : 'warning'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" onClick={exportCSV} icon={<Download className="w-4 h-4" />}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search customer..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.sessionId}
          onChange={(e) => setFilters({ ...filters, sessionId: e.target.value })}
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.paymentStatus}
          onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
        >
          <option value="">All Payments</option>
          <option value="SUCCESSFUL">Successful</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {(filters.search || filters.sessionId || filters.status || filters.paymentStatus) && (
          <button
            onClick={() => setFilters({ sessionId: '', status: '', paymentStatus: '', search: '' })}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 px-2"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-16" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No bookings found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Session</th>
                <th className="px-6 py-3 text-left">Seats</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Payment</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{b.customerName}</p>
                    <p className="text-xs text-gray-400">{b.customerEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{b.session?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {b.items?.map((i) => i.seat?.label).filter(Boolean).join(', ') || `${b.items?.length ?? 0} seats`}
                  </td>
                  <td className="px-6 py-4 font-medium">${b.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={paymentBadge(b.paymentStatus)}>{b.paymentStatus}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusBadge(b.status)}>{b.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details">
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono font-semibold">#{selectedBooking.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span>{selectedBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span>{selectedBooking.customerEmail}</span>
              </div>
              {selectedBooking.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span>{selectedBooking.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Session</span>
                <span>{selectedBooking.session?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold">${selectedBooking.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Seats</p>
              <div className="space-y-1">
                {selectedBooking.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                    <span>{item.seat?.label} ({item.seat?.type})</span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Badge variant={paymentBadge(selectedBooking.paymentStatus)}>{selectedBooking.paymentStatus}</Badge>
              <Badge variant={statusBadge(selectedBooking.status)}>{selectedBooking.status}</Badge>
            </div>

            {selectedBooking.status !== 'CANCELLED' && (
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedBooking(null)} className="flex-1">Close</Button>
                <Button
                  variant="danger"
                  onClick={() => cancelBooking(selectedBooking.id)}
                  loading={cancelling === selectedBooking.id}
                  className="flex-1"
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
