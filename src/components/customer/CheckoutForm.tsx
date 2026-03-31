'use client'

import React, { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  seatId: string
  seatLabel: string
  price: number
  sectionName?: string
  sectionColor?: string
}

interface CheckoutFormProps {
  sessionId: string
  sessionName: string
  cartItems: CartItem[]
}

export default function CheckoutForm({ sessionId, sessionName, cartItems }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = cartItems.reduce((sum, item) => sum + item.price, 0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    setLoading(true)
    setError(null)

    try {
      // 1. Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone || undefined,
          seatIds: cartItems.map((item) => item.seatId),
        }),
      })

      if (!bookingRes.ok) {
        const err = await bookingRes.json()
        throw new Error(err.error || 'Failed to create booking')
      }

      const booking = await bookingRes.json()

      // 2. Create payment intent
      const intentRes = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      if (!intentRes.ok) {
        const err = await intentRes.json()
        throw new Error(err.error || 'Failed to create payment intent')
      }

      const { clientSecret } = await intentRes.json()

      // 3. Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.customerName,
            email: formData.customerEmail,
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        // Update booking as confirmed (webhook will also do this, but let's be optimistic)
        await fetch(`/api/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONFIRMED', paymentStatus: 'SUCCESSFUL' }),
        })

        router.push(`/confirmation?bookingId=${booking.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-2">{sessionName}</div>
          {cartItems.map((item) => (
            <div key={item.seatId} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                {item.sectionColor && (
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: item.sectionColor }}
                  />
                )}
                <span className="text-gray-700">
                  Seat {item.seatLabel}
                  {item.sectionName && (
                    <span className="text-gray-400 ml-1">({item.sectionName})</span>
                  )}
                </span>
              </div>
              <span className="font-medium text-gray-900">{formatCurrency(item.price)}</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Details</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="customerName"
              required
              value={formData.customerName}
              onChange={handleChange}
              placeholder="John Smith"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="customerEmail"
              required
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
        <div className="border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#111827',
                  '::placeholder': { color: '#9ca3af' },
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secured by Stripe. We never store your card details.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || cartItems.length === 0}
        loading={loading}
        size="lg"
        className="w-full"
      >
        Pay {formatCurrency(total)}
      </Button>
    </form>
  )
}
