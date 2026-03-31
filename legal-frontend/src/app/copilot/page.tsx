'use client'
import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { copilotApi, documentsApi } from '@/lib/api'
import type { ConversationOut, AnalysisResult } from '@/types'
import { useToast } from '@/hooks/useToast'
import { Bot, MessageSquare, FileText, Search, Clock, Plus, X, Send } from 'lucide-react'

interface AttachedFile { file: File; id: number }
interface Message { id: number; role: 'user'|'assistant'; content: string; analysis?: AnalysisResult|null }

const ANALYSIS_BLOCKS = [
  { key: 'purpose',             label: '🎯 Purpose',             cls: 'bg-green-50 border-green-200 text-green-800' },
  { key: 'intention',           label: '⚖️ Intention',           cls: 'bg-blue-50 border-blue-200 text-blue-800' },
  { key: 'recommended_actions', label: '✅ Recommended Actions', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'deadline',            label: '📅 Deadline',            cls: 'bg-red-50 border-red-200 text-red-800' },
  { key: 'threats',             label: '⚠️ Threats / Risks',     cls: 'bg-red-50 border-red-200 text-red-800' },
  { key: 'simple_language',     label: '📋 Plain Summary',       cls: 'bg-purple-50 border-purple-200 text-purple-800' },
] as const

/** Safely convert ANY backend value (string, object, array, number) to a renderable string */
function toStr(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)))
      .join('\n')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v, null, 2) : v}`)
      .join('\n')
  }
  return String(value)
}

export default function CopilotPage() {
  const [msgs, setMsgs]         = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [attached, setAttached] = useState<AttachedFile[]>([])
  const [convId, setConvId]     = useState<number|null>(null)
  const [convs, setConvs]       = useState<ConversationOut[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => { loadConvs() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function loadConvs() {
    try { const { data } = await copilotApi.conversations(); setConvs(data) } catch {}
  }

  async function loadConversation(id: number) {
    try {
      const { data } = await copilotApi.getConversation(id)
      setConvId(id)
      setMsgs((data.messages||[]).map(m => ({
        id: m.id, role: m.role as 'user'|'assistant',
        content: toStr(m.content), analysis: m.analysis_data,
      })))
      loadConvs()
    } catch { toast('Could not load conversation', 'error') }
  }

  async function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const allowed = new Set(['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
    for (const f of Array.from(e.target.files||[])) {
      if (!allowed.has(f.type)) { toast(`${f.name}: unsupported type`, 'error'); continue }
      toast(`Uploading ${f.name}…`, 'info')
      try {
        const { data } = await documentsApi.upload(f)
        setAttached(p => [...p, { file: f, id: data.id }])
        toast(`${f.name} ready ✓`)
      } catch { toast(`Failed to upload ${f.name}`, 'error') }
    }
    e.target.value = ''
  }

  function addMsg(role: 'user'|'assistant', content: string, analysis?: AnalysisResult|null) {
    setMsgs(p => [...p, { id: Date.now()+Math.random(), role, content: toStr(content), analysis }])
  }

  async function sendMsg() {
    if (!input.trim() && !attached.length) return
    setSending(true)
    addMsg('user', input || '[Document analysis request]')
    const ids = attached.map(f => String(f.id))
    const msg = input
    setInput(''); setAttached([])
    try {
      const { data } = await copilotApi.chat(msg, ids, convId ?? undefined)
      setConvId(data.conversation_id)
      addMsg('assistant', data.response, data.analysis)
      loadConvs()
    } catch (ex: any) {
      addMsg('assistant', '⚠️ ' + (ex.response?.data?.detail || 'Failed to get response. Is the backend running?'))
    } finally { setSending(false) }
  }

  async function quickAction(type: 'review'|'research'|'deadlines') {
    if (type === 'review') {
      if (!attached.length) { toast('Attach a document first', 'error'); return }
      addMsg('user', '[Quick Action] Review Document')
      try {
        const { data } = await copilotApi.reviewDocument(attached[0].id)
        addMsg('assistant', toStr(data.content), data.analysis as any)
      } catch (ex: any) { toast(ex.response?.data?.detail || 'Review failed', 'error') }
    } else if (type === 'research') {
      const q = prompt('What would you like to research?\n(e.g. employment law, force majeure, IP clauses)')
      if (!q) return
      addMsg('user', `Research: ${q}`)
      try {
        const { data } = await copilotApi.researchCaseLaw(q)
        addMsg('assistant', toStr(data.content), data.analysis as any)
      } catch (ex: any) { toast(ex.response?.data?.detail || 'Research failed', 'error') }
    } else {
      addMsg('user', '[Quick Action] Check Deadlines')
      try {
        const { data } = await copilotApi.checkDeadlines()
        addMsg('assistant', toStr(data.content), data.analysis as any)
      } catch (ex: any) { toast(ex.response?.data?.detail || 'Failed', 'error') }
    }
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100">
          <Bot className="w-5 h-5 text-teal-600"/>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">AI Case Copilot</h1>
          <p className="text-sm text-gray-400 mt-0.5">Get AI-powered assistance for your legal cases and research</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{height:'calc(100vh - 200px)'}}>
        {/* Chat Panel */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-teal-600"/>
            <div>
              <div className="text-sm font-bold text-gray-900">Chat with AI Copilot</div>
              <div className="text-xs text-gray-400">Ask questions, get insights, or request document analysis</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!msgs.length && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-gray-400">
                <Bot className="w-12 h-12 opacity-25"/>
                <div>
                  <p className="font-semibold text-gray-500 text-sm">Welcome to AI Case Copilot</p>
                  <p className="text-xs mt-1">Upload documents for analysis <strong>OR</strong></p>
                  <p className="text-xs text-teal-600 font-semibold">Just type a prompt for legal guidance</p>
                </div>
              </div>
            )}
            {msgs.map(m => (
              <div key={m.id} className={`flex gap-2.5 items-start ${m.role==='user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0
                  ${m.role==='assistant' ? 'bg-teal-50 border border-teal-200' : 'bg-blue-50 border border-blue-200'}`}>
                  {m.role==='assistant' ? '🤖' : '👤'}
                </div>
                <div className={`max-w-[72%] text-sm rounded-2xl px-4 py-3
                  ${m.role==='assistant' ? 'bg-gray-50 border border-gray-200 text-gray-900 rounded-tl-sm' : 'bg-teal-600 text-white rounded-tr-sm'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  {m.analysis && (
                    <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                      {ANALYSIS_BLOCKS.map(b => {
                        // Cast via Record<string,unknown> to avoid TS 'never' inference
                        const raw: unknown = (m.analysis as Record<string, unknown>)[b.key]
                        if (raw === null || raw === undefined || raw === '') return null
                        const val = toStr(raw)
                        if (!val || val === 'None identified') return null
                        return (
                          <div key={b.key} className={`rounded-xl p-2.5 border text-xs ${b.cls}`}>
                            <p className="font-bold text-[10px] uppercase tracking-wide mb-1 opacity-70">{b.label}</p>
                            <p className="leading-relaxed whitespace-pre-line">{val}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
            {attached.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2 bg-teal-50 border border-teal-100 rounded-xl p-2.5">
                {attached.map((f,i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs">
                    <FileText className="w-3 h-3 text-teal-600 flex-shrink-0"/>
                    <span className="text-gray-700 max-w-[120px] truncate">{f.file.name}</span>
                    <button onClick={()=>setAttached(p=>p.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={pickFiles}/>
              <button onClick={()=>fileRef.current?.click()}
                className="w-9 h-9 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-light transition-colors">
                <Plus className="w-5 h-5"/>
              </button>
              <textarea value={input} onChange={e=>setInput(e.target.value)} rows={1} placeholder="Ask a legal question… (Ctrl+Enter to send)"
                onKeyDown={e=>{ if(e.ctrlKey&&e.key==='Enter') sendMsg() }}
                onInput={e=>{ const t=e.target as HTMLTextAreaElement; t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,110)+'px' }}
                className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 leading-relaxed min-h-[38px] max-h-[110px]"/>
              <button onClick={sendMsg} disabled={sending||(!input.trim()&&!attached.length)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl flex-shrink-0 disabled:opacity-40 transition-colors">
                {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send className="w-4 h-4"/>}
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* Tip */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs font-bold text-green-700 mb-2">💡 Two Ways to Use</p>
            <p className="text-xs text-green-700 leading-relaxed"><strong>1. Upload + Prompt:</strong> Analyze your documents</p>
            <p className="text-xs text-green-700 leading-relaxed mt-1"><strong>2. Prompt Only:</strong> Get legal guidance or drafts</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">⚡ Quick Actions</p>
            </div>
            <div className="p-3 space-y-2">
              {[
                { id:'review',    icon:FileText, label:'Review Document',  bg:'bg-blue-50',  ic:'text-blue-600' },
                { id:'research',  icon:Search,   label:'Research Case Law', bg:'bg-green-50', ic:'text-green-600' },
                { id:'deadlines', icon:Clock,    label:'Check Deadlines',   bg:'bg-amber-50', ic:'text-amber-600' },
              ].map(a => (
                <button key={a.id} onClick={()=>quickAction(a.id as any)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-all">
                  <div className={`${a.bg} w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <a.icon className={`w-3.5 h-3.5 ${a.ic}`}/>
                  </div>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">💬 Recent Conversations</p>
            </div>
            <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
              {!convs.length
                ? <p className="text-xs text-gray-400 px-2 py-2">No conversations yet</p>
                : convs.map(c => (
                    <button key={c.id} onClick={()=>loadConversation(c.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all border
                        ${convId===c.id ? 'bg-teal-50 border-teal-200' : 'border-transparent hover:bg-gray-50'}`}>
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600 flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{c.title}</p>
                        <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
