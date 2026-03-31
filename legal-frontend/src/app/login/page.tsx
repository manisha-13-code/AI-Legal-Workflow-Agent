'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api'
import { useToast } from '@/hooks/useToast'

export default function LoginPage() {
  const [tab, setTab] = useState<'in'|'up'>('in')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // sign-in fields
  const [inEmail, setInEmail] = useState('')
  const [inPwd,   setInPwd]   = useState('')
  const [inErr,   setInErr]   = useState('')

  // sign-up fields
  const [upName,  setUpName]  = useState('')
  const [upEmail, setUpEmail] = useState('')
  const [upPwd,   setUpPwd]   = useState('')
  const [upErr,   setUpErr]   = useState('')

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault(); setInErr(''); setLoading(true)
    try {
      const { data } = await authApi.signin({ email: inEmail, password: inPwd })
      login(data.access_token, data.user)
      router.push('/dashboard')
    } catch (err: any) {
      setInErr(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setUpErr(''); setLoading(true)
    try {
      const { data } = await authApi.signup({ full_name: upName, email: upEmail, password: upPwd })
      login(data.access_token, data.user)
      toast(`Welcome, ${data.user.full_name}! 🎉`, 'success')
      router.push('/dashboard')
    } catch (err: any) {
      setUpErr(err.response?.data?.detail || 'Sign up failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-teal-200">⚖️</div>
          <h1 className="text-xl font-extrabold text-gray-900">AI Legal Workflow</h1>
          <p className="text-xs text-gray-400 mt-1">Your intelligent legal management platform</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['in','up'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t ? 'bg-white text-teal-600 shadow' : 'text-gray-500'}`}>
              {t==='in' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Sign In */}
        {tab === 'in' && (
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={inEmail} onChange={e=>setInEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border-1.5 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <input type="password" value={inPwd} onChange={e=>setInPwd(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
            </div>
            {inErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{inErr}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : null}
              Sign In
            </button>
          </form>
        )}

        {/* Sign Up */}
        {tab === 'up' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
              <input type="text" value={upName} onChange={e=>setUpName(e.target.value)} required
                placeholder="Enter your name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={upEmail} onChange={e=>setUpEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <input type="password" value={upPwd} onChange={e=>setUpPwd(e.target.value)} required
                placeholder="Min. 6 characters"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
            </div>
            {upErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{upErr}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : null}
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
