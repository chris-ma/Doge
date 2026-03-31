'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Calendar, Clock, MapPin, Ticket, Download } from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'

interface BookingItem {
  id: string
  price: number
  seat: {
    label: string
    type: string
    section?: { name: string; color: string } | null
  }
}

interface BookingData {
  id: string
  customerName: string
  customerEmail: string
  totalAmount: number
  status: string
  paymentStatus: string
  items: BookingItem[]
  session: {
    name: string
    date: string
    startTime: string
    endTime?: string | null
    venue: {
      name: string
      address?: string | null
      primaryColor: string
    }
  }
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided')
      setLoading(false)
      return
    }

    fetch(`/api/bookings/${bookingId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Booking not found')
        return r.json()
      })
      .then(setBooking)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [bookingId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-600">{error ?? 'Booking not found'}</p>
        <Link href="/sessions" className="text-indigo-600 hover:underline">
          Browse events
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p className="text-gray-500 mt-2">
          A confirmation email has been sent to <strong>{booking.customerEmail}</strong>
        </p>
      </div>

      {/* Booking card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div
          className="h-2"
          style={{ background: booking.session.venue.primaryColor }}
        />
        <div className="p-6 space-y-5">
          {/* Reference */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
            <p className="font-mono text-xl font-bold text-gray-900">
              #{booking.id.slice(-8).toUpperCase()}
            </p>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Customer
            </p>
            <p className="font-semibold text-gray-900">{booking.customerName}</p>
            <p className="text-sm text-gray-500">{booking.customerEmail}</p>
          </div>

          {/* Event details */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Event
            </p>
            <p className="font-semibold text-gray-900 text-lg">{booking.session.name}</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {formatDate(booking.session.date)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {formatTime(booking.session.startTime)}
                {booking.session.endTime && ` – ${formatTime(booking.session.endTime)}`}
              </div>
              {booking.session.venue.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {booking.session.venue.address}
                </div>
              )}
            </div>
          </div>

          {/* Seats */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Your Seats
            </p>
            <div className="space-y-1.5">
              {booking.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {item.seat.section && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: item.seat.section.color }}
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {item.seat.label}
                    </span>
                    {item.seat.section && (
                      <span className="text-xs text-gray-400">
                        ({item.seat.section.name})
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 font-bold text-gray-900">
              <span>Total Paid</span>
              <span className="text-lg">{formatCurrency(booking.totalAmount)}</span>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.status}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              booking.paymentStatus === 'SUCCESSFUL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/sessions"
          className="flex-1 text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Browse More Events
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          <Download size={16} />
          Save / Print
        </button>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Ticket size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">VenueBook</span>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
    </div>
  )
}
