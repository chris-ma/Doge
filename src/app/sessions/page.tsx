import Link from 'next/link'
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react'

interface Session {
  id: string
  name: string
  description?: string | null
  date: string
  startTime: string
  endTime?: string | null
  status: string
  venue: {
    name: string
    address?: string | null
    primaryColor: string
  }
  layout: {
    name: string
    _count?: { seats: number }
  }
  _count?: { bookings: number }
}

async function getSessions(): Promise<Session[]> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/sessions?upcoming=true`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export default async function SessionsPage() {
  const sessions = await getSessions()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">VenueBook</span>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
          <p className="text-gray-500 mt-2">Browse and book your seats for upcoming shows</p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No upcoming events at this time.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                {/* Color bar */}
                <div
                  className="h-2"
                  style={{ background: session.venue.primaryColor }}
                />

                <div className="p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {session.name}
                    </h2>
                    {session.description && (
                      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{formatDate(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>
                        {formatTime(session.startTime)}
                        {session.endTime && ` – ${formatTime(session.endTime)}`}
                      </span>
                    </div>
                    {session.venue.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{session.venue.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {session.venue.name}
                    </div>
                    <Link
                      href={`/sessions/${session.id}`}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
