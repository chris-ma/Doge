import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const seatSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  type: z.enum(['SEAT', 'TABLE']).default('SEAT'),
  capacity: z.number().default(1),
  price: z.number(),
  priceTier: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
})

const sectionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  color: z.string().default('#6366f1'),
  pricingTier: z.string().optional().nullable(),
})

const updateLayoutSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  width: z.number().optional(),
  height: z.number().optional(),
  seats: z.array(seatSchema).optional(),
  sections: z.array(sectionSchema).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const layout = await prisma.seatingLayout.findUnique({
      where: { id: params.id },
      include: {
        seats: { include: { section: true } },
        sections: true,
        venue: true,
      },
    })

    if (!layout) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 })
    }

    return NextResponse.json(layout)
  } catch (error) {
    console.error('GET /api/layouts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch layout' }, { status: 500 })
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
    const data = updateLayoutSchema.parse(body)

    const { seats, sections, ...layoutData } = data

    // Update layout metadata
    await prisma.seatingLayout.update({
      where: { id: params.id },
      data: layoutData,
    })

    // If sections provided, recreate them
    if (sections !== undefined) {
      // Delete sections that are no longer present
      const sectionIds = sections.filter(s => s.id).map(s => s.id as string)
      await prisma.section.deleteMany({
        where: {
          layoutId: params.id,
          id: { notIn: sectionIds },
        },
      })

      // Upsert sections
      for (const section of sections) {
        if (section.id) {
          await prisma.section.upsert({
            where: { id: section.id },
            update: { name: section.name, color: section.color, pricingTier: section.pricingTier },
            create: {
              id: section.id,
              name: section.name,
              color: section.color,
              pricingTier: section.pricingTier,
              layoutId: params.id,
            },
          })
        } else {
          await prisma.section.create({
            data: {
              name: section.name,
              color: section.color,
              pricingTier: section.pricingTier,
              layoutId: params.id,
            },
          })
        }
      }
    }

    // If seats provided, recreate them
    if (seats !== undefined) {
      const seatIds = seats.filter(s => s.id).map(s => s.id as string)
      await prisma.seat.deleteMany({
        where: {
          layoutId: params.id,
          id: { notIn: seatIds },
        },
      })

      for (const seat of seats) {
        if (seat.id) {
          await prisma.seat.upsert({
            where: { id: seat.id },
            update: {
              label: seat.label,
              x: seat.x,
              y: seat.y,
              type: seat.type,
              capacity: seat.capacity,
              price: seat.price,
              priceTier: seat.priceTier,
              sectionId: seat.sectionId,
            },
            create: {
              id: seat.id,
              label: seat.label,
              x: seat.x,
              y: seat.y,
              type: seat.type,
              capacity: seat.capacity,
              price: seat.price,
              priceTier: seat.priceTier,
              sectionId: seat.sectionId,
              layoutId: params.id,
            },
          })
        } else {
          await prisma.seat.create({
            data: {
              label: seat.label,
              x: seat.x,
              y: seat.y,
              type: seat.type,
              capacity: seat.capacity,
              price: seat.price,
              priceTier: seat.priceTier,
              sectionId: seat.sectionId,
              layoutId: params.id,
            },
          })
        }
      }
    }

    const updated = await prisma.seatingLayout.findUnique({
      where: { id: params.id },
      include: {
        seats: { include: { section: true } },
        sections: true,
        venue: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('PUT /api/layouts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update layout' }, { status: 500 })
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

    await prisma.seatingLayout.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/layouts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete layout' }, { status: 500 })
  }
}
