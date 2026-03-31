'use client'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { settingsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'
import type { UserSettingsOut, NotificationSettings } from '@/types'
import { User, Bell, Shield, AlertTriangle, Settings } from 'lucide-react'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={()=>onChange(!checked)} type="button"
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}/>
    </button>
  )
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserSettingsOut|null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Password form
  const [pwCur, setPwCur] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwCon, setPwCon] = useState('')

  useEffect(() => {
    settingsApi.getProfile().then(({ data }) => {
      setProfile(data)
      setName(data.full_name || ''); setEmail(data.email || ''); setPhone(data.phone || '')
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data } = await settingsApi.updateProfile({ full_name: name, email, phone: phone || undefined })
      setProfile(p => p ? {...p, ...data} : p)
      updateUser({ ...user!, full_name: data.full_name, email: data.email, phone: data.phone })
      toast('Profile updated ✓')
    } catch (ex: any) { toast(ex.response?.data?.detail || 'Update failed', 'error') }
  }

  async function handleNotif(key: keyof NotificationSettings, val: boolean) {
    if (!profile) return
    const updated = { ...profile, [key]: val }
    setProfile(updated)
    try {
      await settingsApi.updateNotifications({ [key]: val })
      toast('Notification preferences saved ✓')
    } catch { toast('Failed to save', 'error') }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!pwCur || !pwNew || !pwCon) { toast('All fields required', 'error'); return }
    if (pwNew !== pwCon)            { toast('Passwords do not match', 'error'); return }
    if (pwNew.length < 6)           { toast('Min 6 characters', 'error'); return }
    try {
      await settingsApi.updatePassword({ current_password: pwCur, new_password: pwNew })
      setPwCur(''); setPwNew(''); setPwCon('')
      toast('Password updated ✓')
    } catch (ex: any) { toast(ex.response?.data?.detail || 'Failed', 'error') }
  }

  async function deleteAccount() {
    if (!confirm('⚠️ Permanently delete your account and ALL data?\n\nThis CANNOT be undone.')) return
    try { await settingsApi.deleteAccount(); toast('Account deleted'); logout() }
    catch (ex: any) { toast(ex.response?.data?.detail || 'Failed', 'error') }
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
          <Settings className="w-5 h-5 text-gray-600"/>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-5">

        {/* Profile */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-teal-600"/></div>
            <div><p className="text-sm font-bold text-gray-900">Profile Settings</p><p className="text-xs text-gray-400">Update your personal information</p></div>
          </div>
          <form onSubmit={saveProfile} className="p-5 space-y-4">
            {loading ? [1,2,3].map(i=><div key={i} className="skeleton h-10"/>) : (
              <>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className={inputCls}/></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className={inputCls}/></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number</label>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls}/></div>
                <button type="submit" className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg transition-colors">Save Changes</button>
              </>
            )}
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Bell className="w-4 h-4 text-blue-600"/></div>
            <div><p className="text-sm font-bold text-gray-900">Notifications</p><p className="text-xs text-gray-400">Manage how you receive notifications</p></div>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { key: 'email_notifications', label: 'Email Notifications', sub: 'Receive notifications via email' },
              { key: 'task_reminders',      label: 'Task Reminders',      sub: 'Get reminders for upcoming tasks' },
              { key: 'case_updates',        label: 'Case Updates',        sub: 'Notifications for case status changes' },
              { key: 'document_alerts',     label: 'Document Alerts',     sub: 'Alerts when documents are uploaded' },
            ].map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4">
                <div><p className="text-sm font-semibold text-gray-800">{label}</p><p className="text-xs text-gray-400 mt-0.5">{sub}</p></div>
                {loading
                  ? <div className="skeleton w-10 h-5 rounded-full"/>
                  : <Toggle checked={!!(profile as any)?.[key]} onChange={v=>handleNotif(key as keyof NotificationSettings, v)}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-green-600"/></div>
            <div><p className="text-sm font-bold text-gray-900">Security</p><p className="text-xs text-gray-400">Manage your account security</p></div>
          </div>
          <form onSubmit={savePassword} className="p-5 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Password</label>
              <input type="password" value={pwCur} onChange={e=>setPwCur(e.target.value)} placeholder="Enter current password" className={inputCls}/></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Password</label>
              <input type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} placeholder="Enter new password" className={inputCls}/></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
              <input type="password" value={pwCon} onChange={e=>setPwCon(e.target.value)} placeholder="Confirm new password" className={inputCls}/></div>
            <button type="submit" className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg transition-colors">Update Password</button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-600"/></div>
            <div><p className="text-sm font-bold text-gray-900">Danger Zone</p><p className="text-xs text-gray-400">Irreversible account actions</p></div>
          </div>
          <div className="p-5">
            <button onClick={deleteAccount}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm rounded-lg border border-red-200 transition-colors">
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
