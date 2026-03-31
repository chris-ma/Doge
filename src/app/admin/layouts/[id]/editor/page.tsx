'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import SeatingLayoutEditor from '@/components/admin/SeatingLayoutEditor'

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

interface Section {
  id: string
  name: string
  color: string
  pricingTier?: string | null
}

interface LayoutData {
  id: string
  name: string
  description?: string | null
  width: number
  height: number
  seats: SeatData[]
  sections: Section[]
  venue: { name: string }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function LayoutEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [layout, setLayout] = useState<LayoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    fetch(`/api/layouts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setLayout(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [id])

  const handleSave = useCallback(
    async (seats: SeatData[], sections: Section[]) => {
      setSaveStatus('saving')
      try {
        const res = await fetch(`/api/layouts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seats, sections }),
        })
        if (!res.ok) throw new Error('Save failed')
        const updated = await res.json()
        setLayout(updated)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    },
    [id]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!layout) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">Layout not found.</p>
        <Link href="/admin/layouts" className="text-indigo-600 hover:underline">
          Back to Layouts
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/layouts"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{layout.name}</h1>
            <p className="text-xs text-gray-500">{layout.venue.name} · Layout Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm">
              <CheckCircle size={16} />
              Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-red-600 text-sm">
              <AlertCircle size={16} />
              Save failed
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <SeatingLayoutEditor
          layoutId={id}
          initialSeats={layout.seats}
          initialSections={layout.sections}
          width={layout.width}
          height={layout.height}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
