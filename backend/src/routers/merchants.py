from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from src.schemas.auth import UserRegister, UserLogin, ForgotPassword, Token, RegisterResponse, LoginResponse
from src.models.merchants import Merchants
from src.utils.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/merchants", tags=["merchants"])

@router.get("/getAllMerchants", status_code=status.HTTP_200_OK)
async def get_all_merchants():
    """
    Get all merchants
    """
    merchants = await Merchants.all()
    print(merchants)
    return {"merchants": merchants}

@router.get("/getMerchantsCoordinates", status_code=status.HTTP_200_OK)
async def get_merchants_coordinates():
    """
    Get all merchants
    """
    merchants = await Merchants.all()
    merchants = [{"longitude": m.lon, "latitude": m.lat} for m in merchants]
    print(merchants)
    return {"merchants": merchants}