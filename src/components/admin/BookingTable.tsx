'use client'

import React, { useState } from 'react'
import { Eye, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge, getBookingStatusVariant, getPaymentStatusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'

interface BookingItem {
  id: string
  seatId: string
  price: number
  seat: {
    label: string
    type: string
    section?: { name: string; color: string } | null
  }
}

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  totalAmount: number
  status: string
  paymentStatus: string
  paymentIntentId?: string | null
  createdAt: Date | string
  items: BookingItem[]
  session: {
    id: string
    name: string
    date: Date | string
    startTime: string
    venue: { name: string }
  }
}

interface BookingTableProps {
  bookings: Booking[]
  onCancelBooking?: (id: string) => Promise<void>
  onRefresh?: () => void
}

type SortField = 'createdAt' | 'customerName' | 'totalAmount' | 'status'

export default function BookingTable({ bookings, onCancelBooking }: BookingTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...bookings].sort((a, b) => {
    let aVal: string | number | Date
    let bVal: string | number | Date
    switch (sortField) {
      case 'createdAt':
        aVal = new Date(a.createdAt)
        bVal = new Date(b.createdAt)
        break
      case 'customerName':
        aVal = a.customerName.toLowerCase()
        bVal = b.customerName.toLowerCase()
        break
      case 'totalAmount':
        aVal = a.totalAmount
        bVal = b.totalAmount
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleCancel = async (id: string) => {
    if (!onCancelBooking) return
    setCancellingId(id)
    try {
      await onCancelBooking(id)
      setSelectedBooking(null)
    } finally {
      setCancellingId(null)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={14} className="text-gray-300" />
    return sortDir === 'asc' ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-indigo-600" />
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                Booking ID
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('customerName')}
              >
                <div className="flex items-center gap-1">
                  Customer <SortIcon field="customerName" />
                </div>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                Session
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                Seats
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center gap-1">
                  Amount <SortIcon field="totalAmount" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status <SortIcon field="status" />
                </div>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                Payment
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Date <SortIcon field="createdAt" />
                </div>
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  No bookings found
                </td>
              </tr>
            )}
            {sorted.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-500">
                    #{booking.id.slice(-8).toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{booking.customerName}</div>
                  <div className="text-xs text-gray-500">{booking.customerEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{booking.session.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(booking.session.date)} · {formatTime(booking.session.startTime)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {booking.items.map((item) => (
                      <span
                        key={item.id}
                        className="inline-block bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-medium"
                      >
                        {item.seat.label}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {formatCurrency(booking.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getBookingStatusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getPaymentStatusVariant(booking.paymentStatus)}>
                    {booking.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {formatDate(booking.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    {booking.status !== 'CANCELLED' && onCancelBooking && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Cancel booking"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Booking Details"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
                <p className="font-mono font-bold text-gray-900">
                  #{selectedBooking.id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-medium text-gray-900">{selectedBooking.customerName}</p>
                <p className="text-sm text-gray-600">{selectedBooking.customerEmail}</p>
                {selectedBooking.customerPhone && (
                  <p className="text-sm text-gray-600">{selectedBooking.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <div className="flex flex-col gap-1">
                  <Badge variant={getBookingStatusVariant(selectedBooking.status)}>
                    Booking: {selectedBooking.status}
                  </Badge>
                  <Badge variant={getPaymentStatusVariant(selectedBooking.paymentStatus)}>
                    Payment: {selectedBooking.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Event</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{selectedBooking.session.name}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedBooking.session.date)} · {formatTime(selectedBooking.session.startTime)}
                </p>
                <p className="text-sm text-gray-500">{selectedBooking.session.venue.name}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Seats</p>
              <div className="space-y-1">
                {selectedBooking.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      {item.seat.section && (
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: item.seat.section.color }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {item.seat.label}
                      </span>
                      <span className="text-xs text-gray-500">({item.seat.type})</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedBooking.totalAmount)}</span>
                </div>
              </div>
            </div>

            {selectedBooking.status !== 'CANCELLED' && onCancelBooking && (
              <div className="pt-2 border-t border-gray-200">
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancellingId === selectedBooking.id}
                  onClick={() => handleCancel(selectedBooking.id)}
                  className="w-full"
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
