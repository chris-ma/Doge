import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createLayoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  venueId: z.string().min(1),
  width: z.number().optional().default(800),
  height: z.number().optional().default(600),
})

export async function GET() {
  try {
    const layouts = await prisma.seatingLayout.findMany({
      include: {
        venue: true,
        sections: true,
        _count: { select: { seats: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(layouts)
  } catch (error) {
    console.error('GET /api/layouts error:', error)
    return NextResponse.json({ error: 'Failed to fetch layouts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createLayoutSchema.parse(body)

    const layout = await prisma.seatingLayout.create({
      data,
      include: { venue: true, sections: true, seats: true },
    })
    return NextResponse.json(layout, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/layouts error:', error)
    return NextResponse.json({ error: 'Failed to create layout' }, { status: 500 })
  }
}
