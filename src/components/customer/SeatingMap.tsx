'use client'

import React, { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Section {
  id: string
  name: string
  color: string
}

interface SeatWithStatus {
  id: string
  label: string
  x: number
  y: number
  type: 'SEAT' | 'TABLE'
  capacity: number
  price: number
  sectionId?: string | null
  section?: Section | null
  bookingStatus: 'available' | 'booked' | 'blocked'
}

interface SeatingMapProps {
  seats: SeatWithStatus[]
  sections: Section[]
  width?: number
  height?: number
  selectedSeatIds: string[]
  onSeatSelect: (seatId: string) => void
}

export default function SeatingMap({
  seats,
  sections,
  width = 800,
  height = 600,
  selectedSeatIds,
  onSeatSelect,
}: SeatingMapProps) {
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null)
  const hoveredSeat = hoveredSeatId ? seats.find((s) => s.id === hoveredSeatId) : null

  const getSeatColor = (seat: SeatWithStatus) => {
    if (selectedSeatIds.includes(seat.id)) return '#3b82f6'
    if (seat.bookingStatus === 'booked') return '#ef4444'
    if (seat.bookingStatus === 'blocked') return '#9ca3af'
    return seat.section?.color ?? '#22c55e'
  }

  const getSeatStroke = (seat: SeatWithStatus) => {
    if (selectedSeatIds.includes(seat.id)) return '#2563eb'
    if (seat.bookingStatus === 'booked') return '#dc2626'
    if (seat.bookingStatus === 'blocked') return '#6b7280'
    return 'rgba(0,0,0,0.15)'
  }

  const canSelect = (seat: SeatWithStatus) =>
    seat.bookingStatus === 'available'

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="inline-block w-4 h-4 rounded-full bg-green-500" />
          Available
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="inline-block w-4 h-4 rounded-full bg-blue-500" />
          Selected
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="inline-block w-4 h-4 rounded-full bg-red-500" />
          Booked
        </div>
        {sections.length > 1 && sections.map((section) => (
          <div key={section.id} className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="inline-block w-4 h-4 rounded-full" style={{ background: section.color }} />
            {section.name}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm">
        <div style={{ position: 'relative', width, height, minWidth: width }}>
          {/* Grid dots */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={width}
            height={height}
          >
            {Array.from({ length: Math.floor(width / 40) * Math.floor(height / 40) }).map(
              (_, i) => {
                const col = i % Math.floor(width / 40)
                const row = Math.floor(i / Math.floor(width / 40))
                return (
                  <circle
                    key={i}
                    cx={(col + 1) * 40}
                    cy={(row + 1) * 40}
                    r={1}
                    fill="#e5e7eb"
                  />
                )
              }
            )}
          </svg>

          {/* Stage */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: 16,
              background: '#1e1e2e',
              color: 'white',
              padding: '6px 32px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            Stage / Screen
          </div>

          {/* Seats */}
          {seats.map((seat) => {
            const isTable = seat.type === 'TABLE'
            const isSelected = selectedSeatIds.includes(seat.id)
            const isAvailable = canSelect(seat)
            const isHovered = hoveredSeatId === seat.id

            const w = isTable ? 48 : 36
            const h = isTable ? 40 : 36
            const left = seat.x - w / 2
            const top = seat.y - h / 2

            return (
              <div
                key={seat.id}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: w,
                  height: h,
                  background: getSeatColor(seat),
                  border: `2px solid ${getSeatStroke(seat)}`,
                  borderRadius: isTable ? 6 : '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  transform: isHovered && isAvailable ? 'scale(1.15)' : isSelected ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(59,130,246,0.4)'
                    : isHovered && isAvailable
                    ? '0 2px 8px rgba(0,0,0,0.2)'
                    : '0 1px 2px rgba(0,0,0,0.1)',
                  zIndex: isSelected || isHovered ? 20 : 10,
                  opacity: seat.bookingStatus === 'blocked' ? 0.5 : 1,
                  userSelect: 'none',
                }}
                onClick={() => isAvailable && onSeatSelect(seat.id)}
                onMouseEnter={() => setHoveredSeatId(seat.id)}
                onMouseLeave={() => setHoveredSeatId(null)}
                title={
                  seat.bookingStatus === 'booked'
                    ? `${seat.label} — Booked`
                    : `${seat.label} — ${formatCurrency(seat.price)}`
                }
              >
                <span style={{ color: 'white', fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
                  {seat.label}
                </span>
                {isTable && (
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8, lineHeight: 1, marginTop: 1 }}>
                    x{seat.capacity}
                  </span>
                )}
              </div>
            )
          })}

          {/* Hover tooltip */}
          {hoveredSeat && (
            <div
              style={{
                position: 'absolute',
                left: hoveredSeat.x + 24,
                top: Math.max(0, hoveredSeat.y - 40),
                background: 'rgba(17, 24, 39, 0.95)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                zIndex: 100,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div className="font-bold">{hoveredSeat.label}</div>
              {hoveredSeat.section && (
                <div style={{ color: '#9ca3af' }}>{hoveredSeat.section.name}</div>
              )}
              <div>
                {hoveredSeat.bookingStatus === 'available'
                  ? formatCurrency(hoveredSeat.price)
                  : hoveredSeat.bookingStatus === 'booked'
                  ? 'Booked'
                  : 'Blocked'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
