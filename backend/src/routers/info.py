from fastapi import APIRouter, status, Depends
from src.models.users import Users
from src.models.users_earners import UsersEarners
from src.middleware.auth import get_current_user
from src.models.earners import Earners

router = APIRouter(prefix="/info", tags=["info"])


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_user_info(
    current_user: Users = Depends(get_current_user)
):
    """
    Get current user statistics and earner statistics if applicable
    """
    user_stats = {
        "id": current_user.user_id,
        "email": current_user.email
    }
    
    # Check if user is also an earner
    earner = await UsersEarners.get_or_none(user_id=current_user.user_id)
    
    if earner:
        
        earner_data = await Earners.get_or_none(earner_id=earner.earner_id)
        
        if earner_data:
            user_stats["earner"] = {
                "id": earner_data.earner_id,
                "rating": earner_data.rating,
                "earner_type": earner_data.earner_type,
                "vehicle_type": earner_data.vehicle_type,
            }
    
    return user_stats