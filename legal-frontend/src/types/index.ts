// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface UserOut {
  id: number
  full_name: string
  email: string
  phone?: string | null
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
  user: UserOut
}

export interface UserSignUp {
  full_name: string
  email: string
  password: string
}

export interface UserSignIn {
  email: string
  password: string
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface UserSettingsOut {
  id: number
  full_name: string
  email: string
  phone?: string | null
  email_notifications: boolean
  task_reminders: boolean
  case_updates: boolean
  document_alerts: boolean
}

export interface UserProfileUpdate {
  full_name?: string
  email?: string
  phone?: string
}

export interface PasswordUpdate {
  current_password: string
  new_password: string
}

export interface NotificationSettings {
  email_notifications?: boolean
  task_reminders?: boolean
  case_updates?: boolean
  document_alerts?: boolean
}

// ─── Cases ────────────────────────────────────────────────────────────────────
export type CaseStatus = 'active' | 'pending' | 'closed'
export type CasePriority = 'high' | 'medium' | 'low'

export interface CaseOut {
  id: number
  case_number: string
  title: string
  client: string
  status: CaseStatus
  priority: CasePriority
  deadline?: string | null
  description?: string | null
  owner_id: number
  created_at: string
  document_count: number
  task_count: number
  pending_task_count: number
}

export interface CaseCreate {
  title: string
  client: string
  status?: CaseStatus
  priority?: CasePriority
  deadline?: string | null
  description?: string | null
}

export interface CaseUpdate {
  title?: string
  client?: string
  status?: CaseStatus
  priority?: CasePriority
  deadline?: string | null
  description?: string | null
}

// ─── Documents ────────────────────────────────────────────────────────────────
export interface DocumentOut {
  id: number
  filename: string
  original_name: string
  file_type?: string | null
  doc_type?: string | null
  category?: string | null
  case_id?: number | null
  created_at: string
}

// ─── AI Copilot ───────────────────────────────────────────────────────────────
export interface AnalysisResult {
  intention?: string | null
  purpose?: string | null
  recommended_actions?: string | null
  deadline?: string | null
  threats?: string | null
  simple_language?: string | null
  full_analysis?: string | null
}

export interface ChatResponse {
  message_id: number
  conversation_id: number
  response: string
  analysis?: AnalysisResult | null
}

export interface MessageOut {
  id: number
  role: string
  content: string
  analysis_data?: AnalysisResult | null
  created_at: string
}

export interface ConversationOut {
  id: number
  title: string
  created_at: string
  messages?: MessageOut[]
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface KpiData {
  active_cases: number
  pending_tasks: number
  documents_processed_this_month: number
  ai_insights_generated: number
  active_cases_trend: string
  pending_tasks_trend: string
  documents_trend: string
  ai_insights_trend: string
}

export interface ActivityOut {
  id: number
  activity_type: string
  title: string
  description?: string | null
  created_at: string
}

export interface InsightOut {
  id: number
  insight_type: string
  title: string
  description: string
  is_read: boolean
  created_at: string
}

export interface DashboardData {
  kpi: KpiData
  recent_activities: ActivityOut[]
  ai_insights: InsightOut[]
}
