'use client'

import React from 'react'

type BadgeVariant = 'success' | 'error' | 'danger' | 'warning' | 'info' | 'neutral' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-700',
  default: 'bg-gray-100 text-gray-700',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function getBookingStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'CONFIRMED': return 'success'
    case 'CANCELLED': return 'error'
    case 'PENDING': return 'warning'
    default: return 'neutral'
  }
}

export function getPaymentStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'SUCCESSFUL': return 'success'
    case 'FAILED': return 'error'
    case 'REFUNDED': return 'info'
    case 'PENDING': return 'warning'
    default: return 'neutral'
  }
}

export function getSessionStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'CANCELLED': return 'error'
    case 'COMPLETED': return 'neutral'
    default: return 'neutral'
  }
}

export default Badge
