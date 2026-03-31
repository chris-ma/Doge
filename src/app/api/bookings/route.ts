import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createBookingSchema = z.object({
  sessionId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  seatIds: z.array(z.string()).min(1),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const sessionId = searchParams.get('sessionId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (sessionId) where.sessionId = sessionId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo)
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        session: { include: { venue: true } },
        items: { include: { seat: { include: { section: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createBookingSchema.parse(body)

    // Verify session exists and is active
    const eventSession = await prisma.session.findUnique({
      where: { id: data.sessionId },
      include: { layout: { include: { seats: true } } },
    })

    if (!eventSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (eventSession.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Session is not available' }, { status: 400 })
    }

    // Check seats are valid and available
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: data.seatIds },
        layoutId: eventSession.layoutId,
      },
    })

    if (seats.length !== data.seatIds.length) {
      return NextResponse.json({ error: 'Some seats are invalid' }, { status: 400 })
    }

    // Check seats are not already booked
    const existingBookingItems = await prisma.bookingItem.findMany({
      where: {
        seatId: { in: data.seatIds },
        booking: {
          sessionId: data.sessionId,
          status: { not: 'CANCELLED' },
        },
      },
    })

    if (existingBookingItems.length > 0) {
      return NextResponse.json({ error: 'Some seats are already booked' }, { status: 409 })
    }

    const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0)

    // Create booking with items
    const booking = await prisma.booking.create({
      data: {
        sessionId: data.sessionId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        totalAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: seats.map((seat) => ({
            seatId: seat.id,
            price: seat.price,
          })),
        },
      },
      include: {
        session: { include: { venue: true } },
        items: { include: { seat: { include: { section: true } } } },
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/bookings error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
