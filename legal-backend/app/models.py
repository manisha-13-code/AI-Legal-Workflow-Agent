from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    ForeignKey, Enum, Float, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class CaseStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    closed = "closed"


class CasePriority(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class ActivityType(str, enum.Enum):
    contract_review = "Contract Review Completed"
    document_upload = "Document Uploaded"
    deadline_reminder = "Deadline Reminder"
    case_assigned = "New Case Assigned"
    affidavit_upload = "Affidavit Uploaded"
    case_created = "Case Created"
    case_updated = "Case Updated"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(500), nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Notification preferences
    email_notifications = Column(Boolean, default=True)
    task_reminders = Column(Boolean, default=True)
    case_updates = Column(Boolean, default=True)
    document_alerts = Column(Boolean, default=False)

    cases = relationship("Case", back_populates="owner")
    documents = relationship("Document", back_populates="owner")
    conversations = relationship("Conversation", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    ai_insights = relationship("AIInsight", back_populates="user")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True)
    title = Column(String(500), nullable=False)
    client = Column(String(200), nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.active)
    priority = Column(Enum(CasePriority), default=CasePriority.medium)
    deadline = Column(DateTime(timezone=True), nullable=True)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="cases")
    documents = relationship("Document", back_populates="case")
    tasks = relationship("Task", back_populates="case")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="tasks")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)
    original_name = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    content_text = Column(Text, nullable=True)  # extracted text
    doc_type = Column(String(200), nullable=True)
    category = Column(String(200), nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="documents")
    owner = relationship("User", back_populates="documents")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, default="New Conversation")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    analysis_data = Column(JSON, nullable=True)  # structured analysis
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String(200), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activities")


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    insight_type = Column(String(200), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ai_insights")
