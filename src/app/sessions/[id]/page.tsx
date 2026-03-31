'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowLeft, ShoppingCart, Ticket, X } from 'lucide-react'
import SeatingMap from '@/components/customer/SeatingMap'
import { formatCurrency } from '@/lib/utils'

interface Section {
  id: string
  name: string
  color: string
}

interface SeatWithStatus {
  id: string
  label: string
  x: number
  y: number
  type: 'SEAT' | 'TABLE'
  capacity: number
  price: number
  sectionId?: string | null
  section?: Section | null
  bookingStatus: 'available' | 'booked' | 'blocked'
}

interface SessionData {
  id: string
  name: string
  description?: string | null
  date: string
  startTime: string
  endTime?: string | null
  venue: {
    name: string
    address?: string | null
    primaryColor: string
  }
  layout: {
    name: string
    width: number
    height: number
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [seats, setSeats] = useState<SeatWithStatus[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [sessionRes, seatsRes] = await Promise.all([
          fetch(`/api/sessions/${id}`),
          fetch(`/api/sessions/${id}/seats`),
        ])

        if (sessionRes.ok) {
          const data = await sessionRes.json()
          setSession(data)
        }

        if (seatsRes.ok) {
          const data = await seatsRes.json()
          setSeats(data.seats)
          setSections(data.sections)
          setWidth(data.width)
          setHeight(data.height)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    )
  }

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id))
  const total = selectedSeats.reduce((sum, s) => sum + s.price, 0)

  const handleCheckout = () => {
    const params = new URLSearchParams({
      sessionId: id,
      seats: selectedSeatIds.join(','),
    })
    router.push(`/checkout?${params}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Session not found.</p>
        <Link href="/sessions" className="text-indigo-600 hover:underline">
          Browse events
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sessions"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Ticket size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">VenueBook</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event info + Seating map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div
                className="h-2"
                style={{ background: session.venue.primaryColor }}
              />
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{session.name}</h1>
                {session.description && (
                  <p className="text-gray-600 mb-4">{session.description}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-gray-400 text-xs">Date</div>
                      <div className="text-gray-700 font-medium">{formatDate(session.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-gray-400 text-xs">Time</div>
                      <div className="text-gray-700 font-medium">
                        {formatTime(session.startTime)}
                        {session.endTime && ` – ${formatTime(session.endTime)}`}
                      </div>
                    </div>
                  </div>
                  {session.venue.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-gray-400 text-xs">Venue</div>
                        <div className="text-gray-700 font-medium">{session.venue.address}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seating map */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Your Seats</h2>
              <p className="text-sm text-gray-500 mb-4">
                Click on an available seat to select it. Click again to deselect.
              </p>
              <SeatingMap
                seats={seats}
                sections={sections}
                width={width}
                height={height}
                selectedSeatIds={selectedSeatIds}
                onSeatSelect={handleSeatSelect}
              />
            </div>
          </div>

          {/* Right: Cart / Selection summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart size={18} className="text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900">Your Selection</h2>
              </div>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm">No seats selected yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Click seats on the map to select them.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {selectedSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          {seat.section && (
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: seat.section.color }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Seat {seat.label}
                            </div>
                            {seat.section && (
                              <div className="text-xs text-gray-400">{seat.section.name}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(seat.price)}
                          </span>
                          <button
                            onClick={() => handleSeatSelect(seat.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center py-3 border-t border-gray-200 mb-4">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(total)}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
