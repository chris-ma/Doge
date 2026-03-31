import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSessionSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'COMPLETED']).optional(),
  layoutId: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        venue: true,
        layout: {
          include: {
            seats: { include: { section: true } },
            sections: true,
          },
        },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            items: { include: { seat: true } },
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('GET /api/sessions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateSessionSchema.parse(body)

    const updated = await prisma.session.update({
      where: { id: params.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: { venue: true, layout: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('PUT /api/sessions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.session.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/sessions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 })
  }
}
