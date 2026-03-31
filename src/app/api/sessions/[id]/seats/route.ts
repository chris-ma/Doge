import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        layout: {
          include: {
            seats: { include: { section: true } },
            sections: true,
          },
        },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            items: { select: { seatId: true } },
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Collect all booked seat IDs for this session
    const bookedSeatIds = new Set<string>()
    for (const booking of session.bookings) {
      for (const item of booking.items) {
        bookedSeatIds.add(item.seatId)
      }
    }

    // Add booking status to each seat
    const seatsWithStatus = session.layout.seats.map((seat) => ({
      ...seat,
      bookingStatus: bookedSeatIds.has(seat.id) ? 'booked' : 'available',
    }))

    return NextResponse.json({
      seats: seatsWithStatus,
      sections: session.layout.sections,
      width: session.layout.width,
      height: session.layout.height,
    })
  } catch (error) {
    console.error('GET /api/sessions/[id]/seats error:', error)
    return NextResponse.json({ error: 'Failed to fetch seats' }, { status: 500 })
  }
}
