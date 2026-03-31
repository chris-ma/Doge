import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSessionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  venueId: z.string().min(1),
  layoutId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const upcoming = searchParams.get('upcoming') === 'true'
    const venueId = searchParams.get('venueId')

    const where: Record<string, unknown> = {}

    if (upcoming) {
      where.date = { gte: new Date() }
      where.status = 'ACTIVE'
    }

    if (venueId) {
      where.venueId = venueId
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        venue: true,
        layout: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('GET /api/sessions error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createSessionSchema.parse(body)

    const newSession = await prisma.session.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: { venue: true, layout: true },
    })

    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/sessions error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
