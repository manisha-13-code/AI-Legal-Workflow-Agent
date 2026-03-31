from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.utils.auth import get_current_user, verify_password, get_password_hash

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/profile", response_model=schemas.UserSettingsOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return current_user


@router.put("/profile", response_model=schemas.UserSettingsOut)
def update_profile(
    profile_data: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if profile_data.email and profile_data.email != current_user.email:
        existing = db.query(models.User).filter(
            models.User.email == profile_data.email,
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = profile_data.email

    if profile_data.full_name:
        current_user.full_name = profile_data.full_name
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def update_password(
    pw_data: schemas.PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(pw_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(pw_data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}


@router.put("/notifications", response_model=schemas.UserSettingsOut)
def update_notifications(
    notif_data: schemas.NotificationSettings,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    update_data = notif_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/account")
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete all user data and account."""
    # Cascade deletes handle related records
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}
