from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.utils.auth import get_current_user
import random
import string

router = APIRouter(prefix="/api/cases", tags=["Cases"])


def generate_case_number(db: Session) -> str:
    """Generate a unique sequential case number."""
    last = (
        db.query(models.Case)
        .order_by(models.Case.id.desc())
        .first()
    )
    next_id = (last.id + 1) if last else 1
    return str(next_id + 200)  # Start from #201


@router.post("", response_model=schemas.CaseOut, status_code=status.HTTP_201_CREATED)
def create_case(
    case_data: schemas.CaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    case_number = generate_case_number(db)

    case = models.Case(
        case_number=case_number,
        title=case_data.title,
        client=case_data.client,
        status=case_data.status,
        priority=case_data.priority,
        deadline=case_data.deadline,
        description=case_data.description,
        owner_id=current_user.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Log activity
    activity = models.Activity(
        activity_type="case_created",
        title=f"New Case Assigned",
        description=f"Case #{case_number}: {case_data.title}",
        user_id=current_user.id,
        case_id=case.id,
    )
    db.add(activity)

    # Generate AI insight for high priority cases
    if case_data.priority == models.CasePriority.high:
        insight = models.AIInsight(
            insight_type="case_prioritization",
            title="Case Prioritization",
            description=f"Case #{case_number} ({case_data.title}) is high priority. Review and assign tasks immediately.",
            user_id=current_user.id,
            case_id=case.id,
        )
        db.add(insight)

    db.commit()

    return _build_case_out(case, db)


@router.get("", response_model=List[schemas.CaseOut])
def get_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Case).filter(models.Case.owner_id == current_user.id)

    if status:
        query = query.filter(models.Case.status == status)
    if priority:
        query = query.filter(models.Case.priority == priority)
    if search:
        query = query.filter(
            models.Case.title.ilike(f"%{search}%") |
            models.Case.client.ilike(f"%{search}%") |
            models.Case.case_number.ilike(f"%{search}%")
        )

    cases = query.order_by(models.Case.created_at.desc()).all()
    return [_build_case_out(c, db) for c in cases]


@router.get("/{case_id}", response_model=schemas.CaseOut)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    case = db.query(models.Case).filter(
        models.Case.id == case_id,
        models.Case.owner_id == current_user.id
    ).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return _build_case_out(case, db)


@router.put("/{case_id}", response_model=schemas.CaseOut)
def update_case(
    case_id: int,
    case_data: schemas.CaseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    case = db.query(models.Case).filter(
        models.Case.id == case_id,
        models.Case.owner_id == current_user.id
    ).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    update_data = case_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(case, key, value)

    db.commit()
    db.refresh(case)

    # Log activity
    activity = models.Activity(
        activity_type="case_updated",
        title=f"Case Updated",
        description=f"Case #{case.case_number} status/details updated",
        user_id=current_user.id,
        case_id=case.id,
    )
    db.add(activity)
    db.commit()

    return _build_case_out(case, db)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    case = db.query(models.Case).filter(
        models.Case.id == case_id,
        models.Case.owner_id == current_user.id
    ).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    db.delete(case)
    db.commit()


def _build_case_out(case: models.Case, db: Session) -> schemas.CaseOut:
    """Build CaseOut with computed counts."""
    doc_count = db.query(models.Document).filter(models.Document.case_id == case.id).count()
    task_count = db.query(models.Task).filter(models.Task.case_id == case.id).count()
    pending_count = db.query(models.Task).filter(
        models.Task.case_id == case.id,
        models.Task.is_completed == False
    ).count()

    return schemas.CaseOut(
        id=case.id,
        case_number=case.case_number,
        title=case.title,
        client=case.client,
        status=case.status,
        priority=case.priority,
        deadline=case.deadline,
        description=case.description,
        owner_id=case.owner_id,
        created_at=case.created_at,
        document_count=doc_count,
        task_count=task_count,
        pending_task_count=pending_count,
    )
