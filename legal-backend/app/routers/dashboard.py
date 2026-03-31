from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timezone
from app.database import get_db
from app import models, schemas
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=schemas.DashboardData)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)

    # ── KPI: Active cases ──────────────────────────────────────────────────
    active_cases = db.query(models.Case).filter(
        models.Case.owner_id == current_user.id,
        models.Case.status == models.CaseStatus.active
    ).count()

    # ── KPI: Pending tasks ─────────────────────────────────────────────────
    pending_tasks = (
        db.query(models.Task)
        .join(models.Case)
        .filter(
            models.Case.owner_id == current_user.id,
            models.Task.is_completed == False
        )
        .count()
    )

    # ── KPI: Documents processed this month ───────────────────────────────
    docs_this_month = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id,
        extract("month", models.Document.created_at) == now.month,
        extract("year", models.Document.created_at) == now.year,
    ).count()

    # ── KPI: AI insights generated ────────────────────────────────────────
    ai_insights_count = db.query(models.AIInsight).filter(
        models.AIInsight.user_id == current_user.id
    ).count()

    # ── Trend strings (simple logic) ──────────────────────────────────────
    active_cases_trend = f"+{max(0, active_cases)} total active"
    pending_tasks_trend = f"{pending_tasks} need attention"
    documents_trend = f"{docs_this_month} this month"
    ai_insights_trend = f"{ai_insights_count} total generated"

    kpi = schemas.KpiData(
        active_cases=active_cases,
        pending_tasks=pending_tasks,
        documents_processed_this_month=docs_this_month,
        ai_insights_generated=ai_insights_count,
        active_cases_trend=active_cases_trend,
        pending_tasks_trend=pending_tasks_trend,
        documents_trend=documents_trend,
        ai_insights_trend=ai_insights_trend,
    )

    # ── Recent activities ─────────────────────────────────────────────────
    activities = (
        db.query(models.Activity)
        .filter(models.Activity.user_id == current_user.id)
        .order_by(models.Activity.created_at.desc())
        .limit(10)
        .all()
    )

    # ── AI Insights ───────────────────────────────────────────────────────
    insights = (
        db.query(models.AIInsight)
        .filter(models.AIInsight.user_id == current_user.id)
        .order_by(models.AIInsight.created_at.desc())
        .limit(5)
        .all()
    )

    return schemas.DashboardData(
        kpi=kpi,
        recent_activities=[schemas.ActivityOut.model_validate(a) for a in activities],
        ai_insights=[schemas.InsightOut.model_validate(i) for i in insights],
    )
