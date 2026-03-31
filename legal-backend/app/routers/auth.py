from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.utils.auth import (
    verify_password, get_password_hash,
    create_access_token, get_current_user
)
from datetime import timedelta
import os

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def signup(user_data: schemas.UserSignUp, db: Session = Depends(get_db)):
    # Check if email already registered
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    hashed_pw = get_password_hash(user_data.password)
    user = models.User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_pw,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create welcome activity
    activity = models.Activity(
        activity_type="case_assigned",
        title="Welcome to AI Legal Workflow!",
        description=f"Account created for {user.full_name}",
        user_id=user.id,
    )
    db.add(activity)

    # Seed some default AI insights for new users
    default_insights = [
        models.AIInsight(
            insight_type="case_prioritization",
            title="Case Prioritization",
            description="Set up your first case to get AI-powered prioritization insights.",
            user_id=user.id,
        ),
        models.AIInsight(
            insight_type="document_prep",
            title="Document Preparation",
            description="Upload documents to the AI Copilot for instant analysis and summaries.",
            user_id=user.id,
        ),
        models.AIInsight(
            insight_type="legal_research",
            title="Legal Research Suggestion",
            description="Use the AI Copilot to research case law and legal precedents instantly.",
            user_id=user.id,
        ),
    ]
    db.add_all(default_insights)
    db.commit()

    # Issue token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")))
    )

    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user)
    )


@router.post("/signin", response_model=schemas.Token)
def signin(credentials: schemas.UserSignIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")))
    )

    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user)
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
