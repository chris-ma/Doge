import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createVenueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  emailTemplate: z.string().optional(),
})

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(venues)
  } catch (error) {
    console.error('GET /api/venues error:', error)
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createVenueSchema.parse(body)

    const venue = await prisma.venue.create({ data })
    return NextResponse.json(venue, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/venues error:', error)
    return NextResponse.json({ error: 'Failed to create venue' }, { status: 500 })
  }
}
