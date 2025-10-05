from fastapi import APIRouter, Depends, HTTPException
from src.middleware.auth import get_current_user
from src.models.users import Users
from src.models.rides_trips import RidesTrips
from src.models.earners import Earners
from src.models.users_earners import UsersEarners
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
from src.schemas.auth import DriverStatsResponse, DriverTripData

router = APIRouter(prefix="/copilot", tags=["copilot"])



@router.get("/driver-stats", response_model=DriverStatsResponse)
async def get_driver_stats(current_user: Users = Depends(get_current_user)):
    """
    Get driver statistics and trip history for the current user
    """
    try:
        # Get the earner associated with this user
        user_earner = await UsersEarners.filter(user_id=current_user.user_id).first()

        if not user_earner:
            raise HTTPException(status_code=404, detail="Driver profile not found")

        # Get earner details
        earner = await Earners.get(earner_id=user_earner.earner_id)

        # Get all trips for this driver
        trips = await RidesTrips.filter(driver_id=earner.earner_id).all()

        # Calculate statistics
        total_trips = len(trips)
        total_earnings = sum(trip.net_earnings or 0 for trip in trips)
        total_distance = sum(trip.distance_km or 0 for trip in trips)
        total_duration = sum(trip.duration_mins or 0 for trip in trips)

        # Format trips data
        trips_data = [
            DriverTripData(
                ride_id=trip.ride_id,
                start_time=trip.start_time,
                end_time=trip.end_time,
                pickup_lat=trip.pickup_lat,
                pickup_lon=trip.pickup_lon,
                drop_lat=trip.drop_lat,
                drop_lon=trip.drop_lon,
                distance_km=trip.distance_km,
                duration_mins=trip.duration_mins,
                surge_multiplier=trip.surge_multiplier,
                fare_amount=trip.fare_amount,
                net_earnings=trip.net_earnings,
                tips=trip.tips,
                payment_type=trip.payment_type,
                date=str(trip.date) if trip.date else None
            )
            for trip in trips
        ]

        return DriverStatsResponse(
            total_trips=total_trips,
            total_earnings=total_earnings,
            total_distance_km=total_distance,
            total_duration_mins=total_duration,
            average_rating=earner.rating,
            experience_months=earner.experience_months,
            trips=trips_data
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
