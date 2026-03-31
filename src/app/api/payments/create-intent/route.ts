import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createIntentSchema = z.object({
  bookingId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookingId } = createIntentSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { session: { include: { venue: true } } },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking has been cancelled' }, { status: 400 })
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(booking.totalAmount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        sessionId: booking.sessionId,
        customerEmail: booking.customerEmail,
      },
      receipt_email: booking.customerEmail,
    })

    // Save payment intent ID to booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentIntentId: paymentIntent.id },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/payments/create-intent error:', error)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}
