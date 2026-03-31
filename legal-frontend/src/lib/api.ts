import axios from 'axios'
import type {
  Token, UserSignUp, UserSignIn, UserOut,
  UserSettingsOut, UserProfileUpdate, PasswordUpdate, NotificationSettings,
  CaseOut, CaseCreate, CaseUpdate,
  DocumentOut,
  ChatResponse, ConversationOut,
  DashboardData,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: UserSignUp) =>
    api.post<Token>('/api/auth/signup', data),

  signin: (data: UserSignIn) =>
    api.post<Token>('/api/auth/signin', data),

  me: () =>
    api.get<UserOut>('/api/auth/me'),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () =>
    api.get<DashboardData>('/api/dashboard'),
}

// ─── Cases ────────────────────────────────────────────────────────────────────
export const casesApi = {
  list: (params?: { search?: string; status?: string; priority?: string }) =>
    api.get<CaseOut[]>('/api/cases', { params }),

  get: (id: number) =>
    api.get<CaseOut>(`/api/cases/${id}`),

  create: (data: CaseCreate) =>
    api.post<CaseOut>('/api/cases', data),

  update: (id: number, data: CaseUpdate) =>
    api.put<CaseOut>(`/api/cases/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/cases/${id}`),
}

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsApi = {
  list: (params?: { case_id?: number }) =>
    api.get<DocumentOut[]>('/api/documents', { params }),

  upload: (file: File, caseId?: number, docType?: string, category?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (caseId)   form.append('case_id', String(caseId))
    if (docType)  form.append('doc_type', docType)
    if (category) form.append('category', category)
    return api.post<DocumentOut>('/api/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id: number) =>
    api.delete(`/api/documents/${id}`),
}

// ─── AI Copilot ───────────────────────────────────────────────────────────────
export const copilotApi = {
  chat: (message: string, documentIds: string[] = [], conversationId?: number) =>
    api.post<ChatResponse>('/api/copilot/chat', {
      message,
      document_ids: documentIds,
      conversation_id: conversationId ?? null,
    }),

  reviewDocument: (documentId: number) =>
    api.post<{ content: string; analysis: Record<string, string>; document_name: string }>(
      `/api/copilot/review-document/${documentId}`
    ),

  researchCaseLaw: (query: string) =>
    api.post<{ content: string; analysis: Record<string, string> }>(
      '/api/copilot/research-case-law',
      { query }
    ),

  checkDeadlines: () =>
    api.post<{ content: string; analysis: Record<string, string> }>(
      '/api/copilot/check-deadlines',
      {}
    ),

  conversations: () =>
    api.get<ConversationOut[]>('/api/copilot/conversations'),

  getConversation: (id: number) =>
    api.get<ConversationOut>(`/api/copilot/conversations/${id}`),

  deleteConversation: (id: number) =>
    api.delete(`/api/copilot/conversations/${id}`),
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  getProfile: () =>
    api.get<UserSettingsOut>('/api/settings/profile'),

  updateProfile: (data: UserProfileUpdate) =>
    api.put<UserSettingsOut>('/api/settings/profile', data),

  updatePassword: (data: PasswordUpdate) =>
    api.put<{ message: string }>('/api/settings/password', data),

  updateNotifications: (data: NotificationSettings) =>
    api.put<UserSettingsOut>('/api/settings/notifications', data),

  deleteAccount: () =>
    api.delete<{ message: string }>('/api/settings/account'),
}
