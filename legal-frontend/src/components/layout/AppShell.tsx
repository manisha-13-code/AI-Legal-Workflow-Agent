'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen bg-gray-50">
        <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  )
}
