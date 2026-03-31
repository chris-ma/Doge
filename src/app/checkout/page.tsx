'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowLeft, Ticket } from 'lucide-react'
import CheckoutForm from '@/components/customer/CheckoutForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

interface SeatData {
  id: string
  label: string
  price: number
  section?: { name: string; color: string } | null
}

interface SessionData {
  id: string
  name: string
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const sessionId = searchParams.get('sessionId')
  const seatIdsParam = searchParams.get('seats')

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [seats, setSeats] = useState<SeatData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || !seatIdsParam) {
      router.push('/sessions')
      return
    }

    async function load() {
      try {
        const [sessionRes, seatsRes] = await Promise.all([
          fetch(`/api/sessions/${sessionId}`),
          fetch(`/api/sessions/${sessionId}/seats`),
        ])

        if (!sessionRes.ok || !seatsRes.ok) {
          setError('Failed to load session data')
          return
        }

        const sessionInfo = await sessionRes.json()
        const seatsData = await seatsRes.json()

        setSessionData({ id: sessionInfo.id, name: sessionInfo.name })

        const requestedIds = seatIdsParam!.split(',')
        const selectedSeats = seatsData.seats
          .filter((s: SeatData) => requestedIds.includes(s.id))
          .map((s: { id: string; label: string; price: number; section?: { name: string; color: string } | null }) => ({
            id: s.id,
            label: s.label,
            price: s.price,
            section: s.section ?? null,
          }))

        if (selectedSeats.length === 0) {
          setError('Selected seats are no longer available.')
          return
        }

        setSeats(selectedSeats)
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId, seatIdsParam, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-600">{error ?? 'Session not found'}</p>
        <Link href="/sessions" className="text-indigo-600 hover:underline">
          Back to events
        </Link>
      </div>
    )
  }

  const cartItems = seats.map((seat) => ({
    seatId: seat.id,
    seatLabel: seat.label,
    price: seat.price,
    sectionName: seat.section?.name,
    sectionColor: seat.section?.color,
  }))

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h1>
      <p className="text-gray-500 text-sm mb-8">Complete your booking for {sessionData.name}</p>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <Elements stripe={stripePromise}>
          <CheckoutForm
            sessionId={sessionData.id}
            sessionName={sessionData.name}
            cartItems={cartItems}
          />
        </Elements>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
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

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
