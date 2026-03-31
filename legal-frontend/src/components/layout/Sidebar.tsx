'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, Bot, Briefcase, Settings, LogOut } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/copilot',   label: 'AI Case Copilot', icon: Bot },
  { href: '/cases',     label: 'Case Management', icon: Briefcase },
  { href: '/settings',  label: 'Settings',        icon: Settings },
]

export function Sidebar() {
  const path = usePathname()
  const { user, logout } = useAuth()
  const initials = (user?.full_name || 'U').charAt(0).toUpperCase()

  return (
    <aside className="w-60 min-h-screen bg-gray-900 flex flex-col fixed top-0 left-0 z-50">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-lg flex-shrink-0">⚖️</div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">AI Legal Workflow</div>
          <div className="text-[10px] text-white/35 mt-0.5">Legal Intelligence Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                ${active ? 'bg-teal-600/20 text-teal-400' : 'text-white/50 hover:bg-white/7 hover:text-white/85'}`}>
              {active && <span className="absolute left-0 top-[20%] h-[60%] w-[3px] bg-teal-500 rounded-r-full"/>}
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 cursor-default">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.full_name}</div>
            <div className="text-[10px] text-white/35">Legal Professional</div>
          </div>
          <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors p-1 rounded" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
