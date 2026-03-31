'use client'
import { useEffect, useState, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { casesApi } from '@/lib/api'
import type { CaseOut, CaseCreate, CaseUpdate, CaseStatus, CasePriority } from '@/types'
import { useToast } from '@/hooks/useToast'
import { Briefcase, Plus, Search, User, Calendar, FileText, X, MoreVertical } from 'lucide-react'

const STATUS_BADGE: Record<CaseStatus, string> = {
  active:  'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  closed:  'bg-gray-100 text-gray-600 border-gray-200',
}
const PRI_BADGE: Record<CasePriority, string> = {
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
}

function fmtDate(d?: string|null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
}

interface CaseModalProps {
  open: boolean
  editCase: CaseOut | null
  onClose: () => void
  onSaved: () => void
}

function CaseModal({ open, editCase, onClose, onSaved }: CaseModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ title:'', client:'', status:'active' as CaseStatus, priority:'medium' as CasePriority, deadline:'', description:'' })

  useEffect(() => {
    if (editCase) {
      setForm({
        title: editCase.title, client: editCase.client,
        status: editCase.status, priority: editCase.priority,
        deadline: editCase.deadline ? editCase.deadline.split('T')[0] : '',
        description: editCase.description || '',
      })
    } else {
      setForm({ title:'', client:'', status:'active', priority:'medium', deadline:'', description:'' })
    }
    setErr('')
  }, [editCase, open])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true)
    if (!form.title.trim() || !form.client.trim()) { setErr('Title and client are required'); setLoading(false); return }
    const body = { ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null, description: form.description || null }
    try {
      if (editCase) { await casesApi.update(editCase.id, body as CaseUpdate); toast('Case updated ✓') }
      else          { await casesApi.create(body as CaseCreate); toast('Case created ✓') }
      onSaved(); onClose()
    } catch (ex: any) { setErr(ex.response?.data?.detail || 'Failed to save case') }
    finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-7 w-full max-w-lg shadow-2xl" style={{animation:'modalIn .2s cubic-bezier(.34,1.56,.64,1)'}}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{editCase ? 'Edit Case' : 'New Case'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Case Title *</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Employment Contract Dispute"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Client Name *</label>
            <input value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} required placeholder="John Smith"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as CaseStatus}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500">
                <option value="active">Active</option><option value="pending">Pending</option><option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priority</label>
              <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value as CasePriority}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500">
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Deadline</label>
            <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Optional…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 resize-none"/>
          </div>
          {err && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-2.5 justify-end pt-2 border-t border-gray-100 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
              {editCase ? 'Save Changes' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes modalIn{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}

export default function CasesPage() {
  const [cases, setCases]     = useState<CaseOut[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusF, setStatusF] = useState('')
  const [prioF, setPrioF]     = useState('')
  const [modal, setModal]     = useState(false)
  const [editCase, setEditCase] = useState<CaseOut|null>(null)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (statusF) params.status = statusF
      if (prioF) params.priority = prioF
      const { data } = await casesApi.list(params)
      setCases(data)
    } catch { toast('Failed to load cases', 'error') }
    finally { setLoading(false) }
  }, [search, statusF, prioF])

  useEffect(() => { const t = setTimeout(load, search ? 380 : 0); return () => clearTimeout(t) }, [load])

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this case? This cannot be undone.')) return
    try { await casesApi.delete(id); toast('Case deleted'); load() }
    catch { toast('Failed to delete case', 'error') }
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Case Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage and track all your legal cases</p>
          </div>
        </div>
        <button onClick={() => { setEditCase(null); setModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4"/> New Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search cases…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/>
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 min-w-[130px]">
          <option value="">All Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="closed">Closed</option>
        </select>
        <select value={prioF} onChange={e=>setPrioF(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 min-w-[140px]">
          <option value="">All Priority</option><option value="high">High Priority</option><option value="medium">Medium Priority</option><option value="low">Low Priority</option>
        </select>
      </div>

      {/* Cases Grid */}
      {loading
        ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-52 rounded-xl"/>)}</div>
        : !cases.length
          ? <div className="text-center py-20 text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-25"/>
              <p className="font-semibold text-gray-500 text-base">No cases found</p>
              <p className="text-sm mt-1">Create your first case to get started</p>
            </div>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cases.map(c => (
                <div key={c.id} onClick={() => { setEditCase(c); setModal(true) }}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-teal-600 font-mono">Case #{c.case_number}</p>
                      <h3 className="text-sm font-bold text-gray-900 mt-1 leading-snug">{c.title}</h3>
                    </div>
                    <button onClick={e=>handleDelete(c.id, e)} className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors">
                      <MoreVertical className="w-4 h-4"/>
                    </button>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500"><User className="w-3.5 h-3.5"/>{c.client}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="w-3.5 h-3.5"/>Due: {fmtDate(c.deadline)}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500"><FileText className="w-3.5 h-3.5"/>{c.document_count} document{c.document_count!==1?'s':''}</div>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRI_BADGE[c.priority]}`}>{c.priority} priority</span>
                  </div>
                  {c.pending_task_count > 0 && (
                    <div className="border-t border-gray-100 pt-2.5 mt-2">
                      <p className="text-xs text-gray-400">{c.pending_task_count} pending task{c.pending_task_count!==1?'s':''}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>}

      <CaseModal open={modal} editCase={editCase} onClose={() => setModal(false)} onSaved={load} />
    </AppShell>
  )
}
