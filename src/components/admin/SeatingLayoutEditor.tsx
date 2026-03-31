'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Section {
  id: string
  name: string
  color: string
  pricingTier?: string | null
}

interface SeatData {
  id: string
  label: string
  x: number
  y: number
  type: 'SEAT' | 'TABLE'
  capacity: number
  price: number
  priceTier?: string | null
  sectionId?: string | null
}

interface SeatingLayoutEditorProps {
  layoutId: string
  initialSeats: SeatData[]
  initialSections: Section[]
  width?: number
  height?: number
  onSave?: (seats: SeatData[], sections: Section[]) => Promise<void>
}

type ToolType = 'seat' | 'table4' | 'table6' | null

function generateId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Draggable seat on canvas
function CanvasSeat({
  seat,
  sections,
  isSelected,
  onClick,
}: {
  seat: SeatData
  sections: Section[]
  isSelected: boolean
  onClick: (id: string) => void
}) {
  const section = sections.find((s) => s.id === seat.sectionId)
  const color = section?.color ?? '#6366f1'
  const isTable = seat.type === 'TABLE'

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: seat.id,
    data: { type: 'canvas-seat', seat },
  })

  const style: React.CSSProperties = {
    position: 'absolute',
    left: seat.x - (isTable ? 24 : 18),
    top: seat.y - (isTable ? 20 : 18),
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isSelected ? 20 : 10,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        onClick(seat.id)
      }}
      className="cursor-pointer select-none"
    >
      {isTable ? (
        <div
          style={{
            width: 48,
            height: 40,
            background: isSelected ? '#3b82f6' : color,
            border: `2px solid ${isSelected ? '#2563eb' : 'rgba(0,0,0,0.2)'}`,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,0.4)' : '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ color: 'white', fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
            {seat.label}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8, lineHeight: 1, marginTop: 2 }}>
            x{seat.capacity}
          </span>
        </div>
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            background: isSelected ? '#3b82f6' : color,
            border: `2px solid ${isSelected ? '#2563eb' : 'rgba(0,0,0,0.2)'}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,0.4)' : '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>{seat.label}</span>
        </div>
      )}
    </div>
  )
}

// Toolbox item
function ToolboxItem({
  toolType,
  label,
  isActive,
  onClick,
}: {
  toolType: ToolType
  label: string
  isActive: boolean
  onClick: (t: ToolType) => void
}) {
  return (
    <button
      onClick={() => onClick(isActive ? null : toolType)}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
        isActive
          ? 'bg-indigo-600 text-white border-indigo-700'
          : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
      }`}
    >
      <span
        className={`inline-block rounded-${toolType === 'seat' ? 'full' : 'md'}`}
        style={{
          width: toolType === 'seat' ? 14 : 16,
          height: toolType === 'seat' ? 14 : 12,
          background: isActive ? 'rgba(255,255,255,0.8)' : '#6366f1',
          flexShrink: 0,
        }}
      />
      {label}
    </button>
  )
}

export default function SeatingLayoutEditor({
  layoutId,
  initialSeats,
  initialSections,
  width = 800,
  height = 600,
  onSave,
}: SeatingLayoutEditorProps) {
  const [seats, setSeats] = useState<SeatData[]>(initialSeats)
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<ToolType>(null)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showSections, setShowSections] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)

  const { setNodeRef: setDropRef } = useDroppable({ id: 'canvas' })

  const selectedSeat = seats.find((s) => s.id === selectedSeatId)

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!activeTool) {
        setSelectedSeatId(null)
        return
      }

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const rowLabel = String.fromCharCode(65 + Math.floor(seats.filter(s => s.type === 'SEAT').length / 5))
      const colNum = (seats.filter(s => s.type === 'SEAT').length % 5) + 1

      const newSeat: SeatData = {
        id: generateId(),
        label:
          activeTool === 'seat'
            ? `${rowLabel}${colNum}`
            : `T${seats.filter(s => s.type === 'TABLE').length + 1}`,
        x,
        y,
        type: activeTool === 'seat' ? 'SEAT' : 'TABLE',
        capacity: activeTool === 'table4' ? 4 : activeTool === 'table6' ? 6 : 1,
        price: 50,
        sectionId: sections[0]?.id ?? null,
      }

      setSeats((prev) => [...prev, newSeat])
      setSelectedSeatId(newSeat.id)
    },
    [activeTool, seats, sections]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, delta } = event

    setSeats((prev) =>
      prev.map((seat) => {
        if (seat.id === active.id) {
          const newX = Math.max(20, Math.min(width - 20, seat.x + delta.x))
          const newY = Math.max(20, Math.min(height - 20, seat.y + delta.y))
          return { ...seat, x: newX, y: newY }
        }
        return seat
      })
    )
  }

  const updateSelectedSeat = (updates: Partial<SeatData>) => {
    if (!selectedSeatId) return
    setSeats((prev) =>
      prev.map((s) => (s.id === selectedSeatId ? { ...s, ...updates } : s))
    )
  }

  const deleteSelectedSeat = () => {
    if (!selectedSeatId) return
    setSeats((prev) => prev.filter((s) => s.id !== selectedSeatId))
    setSelectedSeatId(null)
  }

  const addSection = () => {
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']
    const newSection: Section = {
      id: generateId(),
      name: `Section ${sections.length + 1}`,
      color: colors[sections.length % colors.length],
      pricingTier: null,
    }
    setSections((prev) => [...prev, newSection])
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const deleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id))
    setSeats((prev) => prev.map((s) => (s.sectionId === id ? { ...s, sectionId: null } : s)))
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(seats, sections)
    } finally {
      setSaving(false)
    }
  }

  // Grid dots background
  const gridDots: React.ReactNode[] = []
  for (let x = 40; x < width; x += 40) {
    for (let y = 40; y < height; y += 40) {
      gridDots.push(
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill="#cbd5e1" />
      )
    }
  }

  const activeSeat = activeId ? seats.find((s) => s.id === activeId) : null

  return (
    <div className="flex h-full gap-0 bg-gray-50">
      {/* Left Panel - Toolbox */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Toolbox</h3>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-xs text-gray-500 mb-1">Click to select tool, then click on canvas</p>
          <ToolboxItem
            toolType="seat"
            label="Seat"
            isActive={activeTool === 'seat'}
            onClick={setActiveTool}
          />
          <ToolboxItem
            toolType="table4"
            label="Table (4)"
            isActive={activeTool === 'table4'}
            onClick={setActiveTool}
          />
          <ToolboxItem
            toolType="table6"
            label="Table (6)"
            isActive={activeTool === 'table6'}
            onClick={setActiveTool}
          />
        </div>

        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowSections(!showSections)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider hover:bg-gray-50"
          >
            Sections
            {showSections ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showSections && (
            <div className="px-3 pb-3 space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="color"
                      value={section.color}
                      onChange={(e) => updateSection(section.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0"
                      title="Section color"
                    />
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSection(section.id, { name: e.target.value })}
                      className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="text-red-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addSection}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50"
              >
                <Plus size={12} />
                Add Section
              </button>
            </div>
          )}
        </div>

        <div className="mt-auto p-3 border-t border-gray-200">
          <Button onClick={handleSave} loading={saving} className="w-full">
            <Save size={14} />
            Save Layout
          </Button>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {seats.length} elements
            {activeTool && (
              <span className="ml-2 text-indigo-600 font-medium">
                — Click canvas to place{' '}
                {activeTool === 'seat' ? 'a seat' : activeTool === 'table4' ? 'a 4-top table' : 'a 6-top table'}
              </span>
            )}
          </span>
          {activeTool && (
            <button
              onClick={() => setActiveTool(null)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
              ref={(node) => {
                setDropRef(node)
                if (node) (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node
              }}
              onClick={handleCanvasClick}
              style={{
                width,
                height,
                position: 'relative',
                cursor: activeTool ? 'crosshair' : 'default',
                flexShrink: 0,
              }}
              className="bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden"
            >
              {/* Grid dots */}
              <svg
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                width={width}
                height={height}
              >
                {gridDots}
              </svg>

              {/* Stage indicator */}
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
                }}
              >
                Stage / Screen
              </div>

              {/* Seats */}
              {seats.map((seat) => (
                <CanvasSeat
                  key={seat.id}
                  seat={seat}
                  sections={sections}
                  isSelected={selectedSeatId === seat.id}
                  onClick={setSelectedSeatId}
                />
              ))}
            </div>

            <DragOverlay>
              {activeSeat && (
                <div
                  style={{
                    width: activeSeat.type === 'TABLE' ? 48 : 36,
                    height: activeSeat.type === 'TABLE' ? 40 : 36,
                    background: '#3b82f6',
                    borderRadius: activeSeat.type === 'TABLE' ? 6 : '50%',
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>
                    {activeSeat.label}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Properties
          </h3>
        </div>

        {selectedSeat ? (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input
                type="text"
                value={selectedSeat.label}
                onChange={(e) => updateSelectedSeat({ label: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={selectedSeat.type}
                onChange={(e) =>
                  updateSelectedSeat({ type: e.target.value as 'SEAT' | 'TABLE' })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SEAT">Seat</option>
                <option value="TABLE">Table</option>
              </select>
            </div>

            {selectedSeat.type === 'TABLE' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
                <input
                  type="number"
                  value={selectedSeat.capacity}
                  min={1}
                  max={20}
                  onChange={(e) => updateSelectedSeat({ capacity: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price ($)</label>
              <input
                type="number"
                value={selectedSeat.price}
                min={0}
                step={0.01}
                onChange={(e) => updateSelectedSeat({ price: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select
                value={selectedSeat.sectionId ?? ''}
                onChange={(e) => updateSelectedSeat({ sectionId: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400">X</label>
                  <input
                    type="number"
                    value={Math.round(selectedSeat.x)}
                    onChange={(e) => updateSelectedSeat({ x: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedSeat.y)}
                    onChange={(e) => updateSelectedSeat({ y: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={deleteSelectedSeat}
              className="w-full"
            >
              <Trash2 size={14} />
              Delete Element
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-400 mt-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <p>Select an element on the canvas to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  )
}
