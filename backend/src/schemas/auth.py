from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str | None = None
    last_name: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    user_id: int
    email: str
    first_name: str | None
    last_name: str | None

    class Config:
        from_attributes = True
