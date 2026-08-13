'use client'

import { useCallback } from 'react'
import type React from 'react'
import { toast as sonnerToast } from 'sonner'

type AppToast = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
}

/**
 * Compatibility adapter for the application's existing toast calls.
 * It intentionally renders through Sonner, the shared website notification UI.
 */
function toast({ title, description, variant = 'default' }: AppToast) {
  const message = title ?? 'Thông báo'
  const options = { description }

  return variant === 'destructive'
    ? sonnerToast.error(message, options)
    : sonnerToast(message, options)
}

function useToast() {
  return {
    toast: useCallback(toast, []),
    dismiss: sonnerToast.dismiss,
  }
}

export { useToast, toast }
