from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime


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
    firstname: str | None = None
    lastname: str | None = None
    isRestNow: bool = False
    isBreakMode: bool = False

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: RegisterResponse

class UpdateProfileRequest(BaseModel):
    firstname: str | None = None
    lastname: str | None = None

    
class DriverTripData(BaseModel):
    ride_id: str
    start_time: datetime | None
    end_time: datetime | None
    pickup_lat: float | None
    pickup_lon: float | None
    drop_lat: float | None
    drop_lon: float | None
    distance_km: float | None
    duration_mins: float | None
    surge_multiplier: float | None
    fare_amount: float | None
    net_earnings: float | None
    tips: float | None
    payment_type: str | None
    date: str | None


class DriverStatsResponse(BaseModel):
    total_trips: int
    total_earnings: float
    total_distance_km: float
    total_duration_mins: float
    average_rating: float | None
    experience_months: int | None
    trips: List[DriverTripData]