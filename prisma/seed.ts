import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@venue.com' },
    update: {},
    create: {
      email: 'admin@venue.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })
  console.log('Created admin user:', adminUser.email)

  // Create venue
  const venue = await prisma.venue.upsert({
    where: { id: 'venue-main' },
    update: {},
    create: {
      id: 'venue-main',
      name: 'The Grand Venue',
      description: 'A premier small venue for live events, concerts, and private gatherings.',
      address: '123 Main Street, Downtown, NY 10001',
      primaryColor: '#6366f1',
    },
  })
  console.log('Created venue:', venue.name)

  // Create seating layout
  const layout = await prisma.seatingLayout.upsert({
    where: { id: 'layout-main' },
    update: {},
    create: {
      id: 'layout-main',
      name: 'Standard Hall Layout',
      description: 'Standard 20-seat layout with 4 rows of 5 seats',
      venueId: venue.id,
      width: 800,
      height: 600,
    },
  })
  console.log('Created layout:', layout.name)

  // Create sections
  const sectionA = await prisma.section.upsert({
    where: { id: 'section-premium' },
    update: {},
    create: {
      id: 'section-premium',
      name: 'Premium',
      color: '#f59e0b',
      layoutId: layout.id,
      pricingTier: 'premium',
    },
  })

  const sectionB = await prisma.section.upsert({
    where: { id: 'section-standard' },
    update: {},
    create: {
      id: 'section-standard',
      name: 'Standard',
      color: '#6366f1',
      layoutId: layout.id,
      pricingTier: 'standard',
    },
  })

  // Delete existing seats for this layout to avoid duplicates
  await prisma.seat.deleteMany({ where: { layoutId: layout.id } })

  // Create 20 seats (4 rows of 5)
  const rows = ['A', 'B', 'C', 'D']
  const cols = [1, 2, 3, 4, 5]
  const startX = 150
  const startY = 150
  const spacingX = 100
  const spacingY = 100

  const seats = []
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const isFirstTwoRows = r < 2
      seats.push({
        label: `${rows[r]}${cols[c]}`,
        x: startX + c * spacingX,
        y: startY + r * spacingY,
        type: 'SEAT',
        capacity: 1,
        price: isFirstTwoRows ? 75.0 : 50.0,
        priceTier: isFirstTwoRows ? 'premium' : 'standard',
        layoutId: layout.id,
        sectionId: isFirstTwoRows ? sectionA.id : sectionB.id,
      })
    }
  }

  await prisma.seat.createMany({ data: seats })
  console.log('Created 20 seats')

  // Create 3 upcoming sessions
  const session1 = await prisma.session.upsert({
    where: { id: 'session-1' },
    update: {},
    create: {
      id: 'session-1',
      name: 'Jazz Night Live',
      description: 'An intimate evening of smooth jazz with the City Jazz Quartet. Enjoy drinks and great music.',
      date: new Date('2026-04-15'),
      startTime: '19:00',
      endTime: '22:00',
      venueId: venue.id,
      layoutId: layout.id,
      status: 'ACTIVE',
    },
  })

  const session2 = await prisma.session.upsert({
    where: { id: 'session-2' },
    update: {},
    create: {
      id: 'session-2',
      name: 'Acoustic Sessions: Sarah Moore',
      description: 'Singer-songwriter Sarah Moore performs her debut album live in an intimate setting.',
      date: new Date('2026-04-22'),
      startTime: '20:00',
      endTime: '22:30',
      venueId: venue.id,
      layoutId: layout.id,
      status: 'ACTIVE',
    },
  })

  const session3 = await prisma.session.upsert({
    where: { id: 'session-3' },
    update: {},
    create: {
      id: 'session-3',
      name: 'Comedy Showcase Night',
      description: "Five up-and-coming comedians take the stage for a night of laughs you won't forget.",
      date: new Date('2026-05-01'),
      startTime: '21:00',
      endTime: '23:00',
      venueId: venue.id,
      layoutId: layout.id,
      status: 'ACTIVE',
    },
  })

  console.log('Created sessions:', session1.name, session2.name, session3.name)
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
