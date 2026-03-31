export type UserRole = 'ADMIN' | 'SUPER_ADMIN'
export type SeatType = 'SEAT' | 'TABLE'
export type SessionStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'PENDING'
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED'

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Venue {
  id: string
  name: string
  description?: string | null
  address?: string | null
  logoUrl?: string | null
  primaryColor: string
  emailTemplate?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Section {
  id: string
  name: string
  color: string
  layoutId: string
  pricingTier?: string | null
}

export interface Seat {
  id: string
  label: string
  x: number
  y: number
  type: SeatType
  capacity: number
  price: number
  priceTier?: string | null
  layoutId: string
  sectionId?: string | null
  section?: Section | null
}

export interface SeatingLayout {
  id: string
  name: string
  description?: string | null
  venueId: string
  seats: Seat[]
  sections: Section[]
  width: number
  height: number
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  name: string
  description?: string | null
  date: Date
  startTime: string
  endTime?: string | null
  venueId: string
  venue?: Venue
  layoutId: string
  layout?: SeatingLayout
  status: SessionStatus
  createdAt: Date
  updatedAt: Date
}

export interface BookingItem {
  id: string
  bookingId: string
  seatId: string
  seat?: Seat
  price: number
}

export interface Booking {
  id: string
  sessionId: string
  session?: Session
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  totalAmount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentIntentId?: string | null
  items: BookingItem[]
  createdAt: Date
  updatedAt: Date
}

export interface SeatWithStatus extends Seat {
  bookingStatus: 'available' | 'booked' | 'blocked'
}

export interface CartItem {
  seatId: string
  seatLabel: string
  price: number
  sectionName?: string
  sectionColor?: string
}

export interface CheckoutFormData {
  customerName: string
  customerEmail: string
  customerPhone?: string
}
