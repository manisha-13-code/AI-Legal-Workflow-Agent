'use client'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { dashboardApi } from '@/lib/api'
import type { DashboardData } from '@/types'
import { Briefcase, CheckSquare, FileText, Sparkles, TrendingUp, AlertTriangle, Lightbulb, FileCheck, FileUp, Clock, Plus, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

function greet(name: string) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${name.split(' ')[0]} 👋`
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60000)    return 'Just now'
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  if (diff < 172800000)return 'Yesterday'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const kpiConfig = [
  { key: 'active_cases',                   label: 'Active Cases',            trendKey: 'active_cases_trend',              icon: Briefcase,    bg: 'bg-blue-50',   ico: 'text-blue-600' },
  { key: 'pending_tasks',                  label: 'Pending Tasks',           trendKey: 'pending_tasks_trend',             icon: CheckSquare,  bg: 'bg-teal-50',   ico: 'text-teal-600' },
  { key: 'documents_processed_this_month', label: 'Documents This Month',    trendKey: 'documents_trend',                 icon: FileText,     bg: 'bg-amber-50',  ico: 'text-amber-600' },
  { key: 'ai_insights_generated',          label: 'AI Insights Generated',   trendKey: 'ai_insights_trend',               icon: Sparkles,     bg: 'bg-purple-50', ico: 'text-purple-600' },
] as const

const insightIcons = [TrendingUp, AlertTriangle, Lightbulb]
const insightColors = [
  { bg: 'bg-green-50',  ic: 'text-green-600' },
  { bg: 'bg-amber-50',  ic: 'text-amber-600' },
  { bg: 'bg-blue-50',   ic: 'text-blue-600' },
  { bg: 'bg-teal-50',   ic: 'text-teal-600' },
  { bg: 'bg-purple-50', ic: 'text-purple-600' },
]

const activityIcons: Record<string, { icon: React.FC<any>; bg: string; ic: string }> = {
  'Contract Review Completed': { icon: FileCheck, bg: 'bg-green-50',  ic: 'text-green-600' },
  'Document Uploaded':         { icon: FileUp,    bg: 'bg-blue-50',   ic: 'text-blue-600' },
  'Deadline Reminder':         { icon: Clock,     bg: 'bg-amber-50',  ic: 'text-amber-600' },
  'New Case Assigned':         { icon: Plus,      bg: 'bg-teal-50',   ic: 'text-teal-600' },
  'Affidavit Uploaded':        { icon: FileUp,    bg: 'bg-blue-50',   ic: 'text-blue-600' },
  'Case Created':              { icon: Briefcase, bg: 'bg-blue-50',   ic: 'text-blue-600' },
  'Case Updated':              { icon: Briefcase, bg: 'bg-purple-50', ic: 'text-purple-600' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    dashboardApi.get().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">{user ? greet(user.full_name) : '...'}</h1>
        <p className="text-sm text-gray-400 mt-1">Here's your legal workflow overview for today</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiConfig.map(({ key, label, trendKey, icon: Icon, bg, ico }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">{label}</p>
              <div className={`${bg} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${ico}`} />
              </div>
            </div>
            {loading
              ? <div className="skeleton h-8 w-16 mb-2" />
              : <div className="text-3xl font-extrabold text-gray-900 mb-1.5">
                  {data?.kpi[key as keyof typeof data.kpi] ?? 0}
                </div>}
            {loading
              ? <div className="skeleton h-4 w-28" />
              : <p className="text-xs font-semibold text-green-600">↑ {data?.kpi[trendKey as keyof typeof data.kpi]}</p>}
          </div>
        ))}
      </div>

      {/* Lower Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">AI Insights</h2>
            </div>
            <button onClick={() => router.push('/copilot')}
              className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors">
              Chat with AI
            </button>
          </div>
          <div className="p-4 space-y-1">
            {loading
              ? [1,2,3].map(i => <div key={i} className="skeleton h-14 mb-2"/>)
              : !data?.ai_insights.length
                ? <p className="text-sm text-gray-400 px-3 py-4">No insights yet. Create cases and use the AI Copilot!</p>
                : data.ai_insights.slice(0,4).map((ins, i) => {
                    const Icon = insightIcons[i % insightIcons.length]
                    const col  = insightColors[i % insightColors.length]
                    return (
                      <div key={ins.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className={`${col.bg} w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${col.ic}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{ins.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ins.description}</p>
                        </div>
                      </div>
                    )
                  })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
            <span className="text-xs font-semibold text-teal-600 cursor-pointer hover:text-teal-700">View all</span>
          </div>
          <div className="p-3 space-y-1">
            {loading
              ? [1,2,3,4].map(i=><div key={i} className="skeleton h-12 mb-2"/>)
              : !data?.recent_activities.length
                ? <p className="text-sm text-gray-400 px-3 py-4">No recent activity yet</p>
                : data.recent_activities.slice(0,6).map(act => {
                    const cfg = activityIcons[act.activity_type] || activityIcons['New Case Assigned']
                    const Icon = cfg.icon
                    return (
                      <div key={act.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className={`${cfg.bg} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.ic}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{act.title}</p>
                          <p className="text-[10px] text-gray-400">{timeAgo(act.created_at)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                      </div>
                    )
                  })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
