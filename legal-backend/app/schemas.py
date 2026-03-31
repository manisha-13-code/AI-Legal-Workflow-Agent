from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models import CaseStatus, CasePriority


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserSignUp(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class UserSignIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── User / Settings Schemas ─────────────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class NotificationSettings(BaseModel):
    email_notifications: Optional[bool] = None
    task_reminders: Optional[bool] = None
    case_updates: Optional[bool] = None
    document_alerts: Optional[bool] = None


class UserSettingsOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    email_notifications: bool
    task_reminders: bool
    case_updates: bool
    document_alerts: bool

    class Config:
        from_attributes = True


# ─── Case Schemas ─────────────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    title: str
    client: str
    status: CaseStatus = CaseStatus.active
    priority: CasePriority = CasePriority.medium
    deadline: Optional[datetime] = None
    description: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    client: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    deadline: Optional[datetime] = None
    description: Optional[str] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_completed: bool
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CaseOut(BaseModel):
    id: int
    case_number: str
    title: str
    client: str
    status: CaseStatus
    priority: CasePriority
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    owner_id: int
    created_at: datetime
    document_count: int = 0
    task_count: int = 0
    pending_task_count: int = 0

    class Config:
        from_attributes = True


# ─── Document Schemas ─────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    filename: str
    original_name: str
    file_type: Optional[str] = None
    doc_type: Optional[str] = None
    category: Optional[str] = None
    case_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── AI Copilot Schemas ───────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    document_ids: Optional[List[str]] = []
    conversation_id: Optional[int] = None


class AnalysisResult(BaseModel):
    intention: Optional[str] = None
    purpose: Optional[str] = None
    recommended_actions: Optional[str] = None
    deadline: Optional[str] = None
    threats: Optional[str] = None
    simple_language: Optional[str] = None
    full_analysis: Optional[str] = None


class ChatResponse(BaseModel):
    message_id: int
    conversation_id: int
    response: str
    analysis: Optional[AnalysisResult] = None


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    analysis_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: Optional[List[MessageOut]] = None

    class Config:
        from_attributes = True


# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class KpiData(BaseModel):
    active_cases: int
    pending_tasks: int
    documents_processed_this_month: int
    ai_insights_generated: int
    active_cases_trend: str
    pending_tasks_trend: str
    documents_trend: str
    ai_insights_trend: str


class ActivityOut(BaseModel):
    id: int
    activity_type: str
    title: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InsightOut(BaseModel):
    id: int
    insight_type: str
    title: str
    description: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardData(BaseModel):
    kpi: KpiData
    recent_activities: List[ActivityOut]
    ai_insights: List[InsightOut]
