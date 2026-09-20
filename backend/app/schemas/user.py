from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_serializer
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("role")
    def serialize_role(self, role: UserRole | str) -> str:
        if isinstance(role, UserRole):
            return role.value
        return str(role).lower()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"