from fastapi import APIRouter, status, Depends, HTTPException
from src.models.users import Users
from src.models.users_earners import UsersEarners
from src.middleware.auth import get_current_user
from src.models.earners import Earners
<<<<<<< Updated upstream
import os
import httpx
=======
from src.models.incentives_weekly import IncentivesWeekly
import numpy as np
>>>>>>> Stashed changes

from src.utils.logger import logger

router = APIRouter(prefix="/info", tags=["info"])

@router.get("/events", status_code=status.HTTP_200_OK)
async def get_events():

    EVENTS_API_URL = os.getenv("EVENTS_API_URL", "https://serpapi.com/search.json")
    EVENTS_API_KEY = os.getenv("EVENTS_API_KEY")

    if not EVENTS_API_URL or not EVENTS_API_KEY:
        raise HTTPException(status_code=500, detail="Events API configuration missing")

    # The KEY must be passed as a query parameter called 'api_key'.
    # You also need a search query, like 'events' or a specific city's events.
    params = {
        "engine": "google_events", # Use the specific events engine
        "q": "events near me",     # Example search query
        "api_key": EVENTS_API_KEY  # The correct way to pass the key
    }

    print(params) # This will show the params being sent

    async with httpx.AsyncClient() as client:
        try:
            # Pass the parameters to the request
            response = await client.get(EVENTS_API_URL, params=params, timeout=10.0)
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Error connecting to Events API: {e}")
        except httpx.HTTPStatusError as e:
            # This will now correctly show the specific error from SerpApi (e.g., if the key is still invalid)
            raise HTTPException(status_code=e.response.status_code, detail=f"Events API error: {e.response.text}")

    events_data = response.json()
    # Optionally process or filter events_data here
    return {"events": events_data}


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_user_info(
    current_user: Users = Depends(get_current_user)
):
    """
    Get current user statistics and earner statistics if applicable
    """
    user_stats = {
        "user_id": current_user.user_id,
        "email": current_user.email
    }

<<<<<<< Updated upstream
    # Check if user is also an earner
    earner = await UsersEarners.get_or_none(user_id=current_user.user_id)
    if earner:
        earner_data = await Earners.get_or_none(earner_id=earner.earner_id)
        earnings_daily = await earner_data.incentives_weekly.all() if earner_data else []
        if earner_data:
            user_stats["earner"] = {
                "earner_id": earner_data.earner_id,
                "rating": earner_data.rating,
                "earner_type": earner_data.earner_type,
                "vehicle_type": earner_data.vehicle_type,
                "totalEarnings": sum(earning.amount for earning in earnings_daily) if earnings_daily else 0.0
            }

    return user_stats
=======
    

    # Check if user is also an earner
    earner = await UsersEarners.get_or_none(user_id=current_user.user_id)
    if earner:
        incentives_array = await IncentivesWeekly.get_or_none(earner_id=earner.earner_id).all()
        logger.info(f"User stats for {current_user.email}: {user_stats}, {incentives_array}")

        # earnings_daily = earner_data.incentives_weekly
        # user_stats["earner"] = {
            #     "earner_id": earner_data.earner_id,
            #     "rating": earner_data.rating,
            #     "earner_type": earner_data.earner_type,
            #     "vehicle_type": earner_data.vehicle_type,
            #     "totalEarnings": sum(earning.amount for earning in earnings_daily) if earnings_daily else 0.0
            

    print(user_stats)
            
    
    return user_stats
>>>>>>> Stashed changes
