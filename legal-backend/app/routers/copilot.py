from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.utils.auth import get_current_user
from app.services.ai_service import (
    analyze_legal_content,
    research_case_law,
    check_deadlines_ai,
)
import json

router = APIRouter(prefix="/api/copilot", tags=["AI Copilot"])


@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_copilot(
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Main chat endpoint - handles text + optional document analysis."""

    # Get or create conversation
    if request.conversation_id:
        conversation = db.query(models.Conversation).filter(
            models.Conversation.id == request.conversation_id,
            models.Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation with title from first message
        title = request.message[:60] + "..." if len(request.message) > 60 else request.message
        conversation = models.Conversation(
            title=title or "New Conversation",
            user_id=current_user.id,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Load conversation history for context
    history = []
    existing_messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation.id)
        .order_by(models.Message.created_at.asc())
        .limit(10)
        .all()
    )
    for msg in existing_messages:
        history.append({"role": msg.role, "content": msg.content})

    # Collect document content if doc IDs provided
    document_content = None
    if request.document_ids:
        doc_texts = []
        for doc_id_str in request.document_ids:
            try:
                doc_id = int(doc_id_str)
                doc = db.query(models.Document).filter(
                    models.Document.id == doc_id,
                    models.Document.owner_id == current_user.id
                ).first()
                if doc and doc.content_text:
                    doc_texts.append(f"--- Document: {doc.original_name} ---\n{doc.content_text}")
            except (ValueError, TypeError):
                continue

        if doc_texts:
            document_content = "\n\n".join(doc_texts)

    # Call AI service
    analysis = analyze_legal_content(
        user_message=request.message,
        document_content=document_content,
        conversation_history=history,
    )

    # Build assistant response text
    response_text = analysis.get("full_analysis", "I couldn't process your request.")

    # Save user message
    user_msg = models.Message(
        role="user",
        content=request.message,
        conversation_id=conversation.id,
    )
    db.add(user_msg)

    # Save assistant message with analysis
    assistant_msg = models.Message(
        role="assistant",
        content=response_text,
        analysis_data=analysis,
        conversation_id=conversation.id,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    # Log AI insight
    insight = models.AIInsight(
        insight_type="ai_copilot",
        title="AI Analysis Completed",
        description=analysis.get("simple_language", response_text)[:300],
        user_id=current_user.id,
    )
    db.add(insight)
    db.commit()

    analysis_result = schemas.AnalysisResult(
        intention=analysis.get("intention"),
        purpose=analysis.get("purpose"),
        recommended_actions=analysis.get("recommended_actions"),
        deadline=analysis.get("deadline"),
        threats=analysis.get("threats"),
        simple_language=analysis.get("simple_language"),
        full_analysis=analysis.get("full_analysis"),
    )

    return schemas.ChatResponse(
        message_id=assistant_msg.id,
        conversation_id=conversation.id,
        response=response_text,
        analysis=analysis_result,
    )


@router.post("/review-document/{document_id}")
def review_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Quick action: Review a specific document."""
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    content_text = doc.content_text or f"Document '{doc.original_name}' uploaded."

    analysis = analyze_legal_content(
        user_message="Please provide a comprehensive legal review of this document.",
        document_content=content_text,
    )

    # Log activity
    activity = models.Activity(
        activity_type="contract_review",
        title="Contract Review Completed",
        description=f"AI reviewed '{doc.original_name}'",
        user_id=current_user.id,
    )
    db.add(activity)

    insight = models.AIInsight(
        insight_type="document_review",
        title="Document Review",
        description=analysis.get("simple_language", "Document reviewed.")[:300],
        user_id=current_user.id,
    )
    db.add(insight)
    db.commit()

    return {
        "content": analysis.get("full_analysis", "Review completed."),
        "analysis": analysis,
        "document_name": doc.original_name,
    }


@router.post("/research-case-law")
def research_case_law_endpoint(
    query: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Quick action: Research case law."""
    search_query = query.get("query", "")
    if not search_query:
        raise HTTPException(status_code=400, detail="Query is required")

    result = research_case_law(search_query)

    # Log insight
    insight = models.AIInsight(
        insight_type="legal_research",
        title="Legal Research Suggestion",
        description=f"Researched: {search_query[:100]}",
        user_id=current_user.id,
    )
    db.add(insight)
    db.commit()

    return {
        "content": result.get("full_analysis", "Research completed."),
        "analysis": result,
    }


@router.post("/check-deadlines")
def check_deadlines(
    body: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Quick action: Check deadlines for user's cases."""
    from datetime import datetime, timezone

    cases = db.query(models.Case).filter(
        models.Case.owner_id == current_user.id,
        models.Case.status != models.CaseStatus.closed,
    ).all()

    if not cases:
        return {
            "content": "No active cases found. Create cases to track deadlines.",
            "analysis": {
                "full_analysis": "No active cases with deadlines.",
                "simple_language": "You have no active cases at the moment.",
                "deadline": "None",
                "recommended_actions": "Create your first case to start tracking deadlines.",
            }
        }

    cases_summary = "\n".join([
        f"Case #{c.case_number}: {c.title} | Client: {c.client} | "
        f"Status: {c.status} | Priority: {c.priority} | "
        f"Deadline: {c.deadline.strftime('%Y-%m-%d') if c.deadline else 'Not set'}"
        for c in cases
    ])

    result = check_deadlines_ai(cases_summary)

    return {
        "content": result.get("full_analysis", "Deadline check completed."),
        "analysis": result,
    }


@router.get("/conversations", response_model=List[schemas.ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == current_user.id)
        .order_by(models.Conversation.created_at.desc())
        .limit(20)
        .all()
    )
    return conversations


@router.get("/conversations/{conversation_id}", response_model=schemas.ConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return schemas.ConversationOut(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        messages=[schemas.MessageOut.model_validate(m) for m in messages],
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()


# Allow body to be optional
from typing import Optional
