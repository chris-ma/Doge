import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/email'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: 'SUCCESSFUL',
              status: 'CONFIRMED',
            },
            include: {
              session: { include: { venue: true } },
              items: { include: { seat: true } },
            },
          })

          // Send confirmation email
          if (booking) {
            await sendBookingConfirmation(
              {
                id: booking.id,
                customerName: booking.customerName,
                customerEmail: booking.customerEmail,
                customerPhone: booking.customerPhone,
                totalAmount: booking.totalAmount,
                items: booking.items.map((item) => ({
                  seat: { label: item.seat.label, type: item.seat.type },
                  price: item.price,
                })),
              },
              {
                name: booking.session.name,
                date: booking.session.date,
                startTime: booking.session.startTime,
                endTime: booking.session.endTime,
              },
              {
                name: booking.session.venue.name,
                address: booking.session.venue.address,
                logoUrl: booking.session.venue.logoUrl,
                primaryColor: booking.session.venue.primaryColor,
              }
            )
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'FAILED' },
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        if (charge.payment_intent) {
          const booking = await prisma.booking.findFirst({
            where: { paymentIntentId: charge.payment_intent as string },
          })
          if (booking) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
