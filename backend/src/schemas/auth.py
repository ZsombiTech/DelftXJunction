from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    firstname: str | None = None
    lastname: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str


class RegisterResponse(BaseModel):
    user_id: int
    email: EmailStr

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: RegisterResponse