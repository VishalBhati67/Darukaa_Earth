from fastapi import Depends, HTTPException, status
from app.api.auth import get_current_user
from app.models.user import User, UserRole


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that ensures the current user has ADMIN role.
    Returns 403 Forbidden if the user is not an admin.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    return current_user
