'use client'
import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast { id: number; message: string; type: ToastType }

let listeners: Array<(t: Toast) => void> = []

export function useToast() {
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    listeners.forEach(fn => fn({ id, message, type }))
  }, [])
  return { toast }
}

export function subscribeToToasts(fn: (t: Toast) => void) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}
