'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, DollarSign, CalendarDays, Map, ArrowRight, TrendingUp } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { Booking } from '@/types'

interface Stats {
  totalBookings: number
  totalRevenue: number
  upcomingSessions: number
  activeLayouts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [bookingsRes, sessionsRes, layoutsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/sessions?upcoming=true'),
          fetch('/api/layouts'),
        ])

        const bookings: Booking[] = bookingsRes.ok ? await bookingsRes.json() : []
        const sessions = sessionsRes.ok ? await sessionsRes.json() : []
        const layouts = layoutsRes.ok ? await layoutsRes.json() : []

        const confirmedBookings = bookings.filter((b) => b.paymentStatus === 'SUCCESSFUL')
        setStats({
          totalBookings: bookings.length,
          totalRevenue: confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0),
          upcomingSessions: sessions.length,
          activeLayouts: layouts.length,
        })
        setRecentBookings(bookings.slice(0, 8))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = stats
    ? [
        {
          label: 'Total Bookings',
          value: stats.totalBookings,
          icon: BookOpen,
          color: 'bg-blue-500',
          href: '/admin/bookings',
        },
        {
          label: 'Total Revenue',
          value: `$${stats.totalRevenue.toFixed(2)}`,
          icon: DollarSign,
          color: 'bg-green-500',
          href: '/admin/bookings',
        },
        {
          label: 'Upcoming Sessions',
          value: stats.upcomingSessions,
          icon: CalendarDays,
          color: 'bg-purple-500',
          href: '/admin/sessions',
        },
        {
          label: 'Active Layouts',
          value: stats.activeLayouts,
          icon: Map,
          color: 'bg-orange-500',
          href: '/admin/layouts',
        },
      ]
    : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here's what's happening.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href}>
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse mb-3" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>No bookings yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Session</th>
                <th className="px-6 py-3 text-left">Seats</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{booking.customerName}</p>
                    <p className="text-xs text-gray-400">{booking.customerEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {booking.session?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {booking.items?.length ?? 0} seat{(booking.items?.length ?? 0) !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ${booking.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        booking.paymentStatus === 'SUCCESSFUL'
                          ? 'success'
                          : booking.paymentStatus === 'FAILED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
