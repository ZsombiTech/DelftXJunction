from src.models.earners import Earners
from fastapi import APIRouter, status, Depends, HTTPException
from src.models.users import Users
from src.models.users_earners import UsersEarners
from src.middleware.auth import get_current_user
import os
import httpx
from src.models.rides_trips import RidesTrips
from src.schemas.auth import DriverStatsResponse, DriverTripData
from src.models.incentives_weekly import IncentivesWeekly
from src.models.timeslots import Timeslots

from src.utils.logger import logger

router = APIRouter(prefix="/info", tags=["info"])


@router.get("/events", status_code=status.HTTP_200_OK)
async def get_events(latitude: float, longitude: float):

    EVENTS_API_URL = os.getenv(
        "EVENTS_API_URL", "https://serpapi.com/search.json")
    EVENTS_API_KEY = os.getenv("EVENTS_API_KEY")

    if not EVENTS_API_URL or not EVENTS_API_KEY:
        raise HTTPException(
            status_code=500, detail="Events API configuration missing")

    async with httpx.AsyncClient() as client:
        # --- Attempt 1: Highly Localized Search ---
        search_query_local = f"events near {latitude},{longitude}"
        params_local = {
            "engine": "google_events",
            "q": search_query_local,
            "api_key": EVENTS_API_KEY
        }

        print(f"Attempting local search with params: {params_local}")

        try:
            response = await client.get(EVENTS_API_URL, params=params_local, timeout=10.0)
            response.raise_for_status()
            events_data = response.json()

            # Check if there are actual 'events_results'
            if events_data.get("events_results"):
                print("Local events found.")
                return {"events": events_data}

            print("Local search returned no/few events. Proceeding to fallback.")

        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            print(
                f"Error on local search attempt: {e}. Proceeding to fallback.")
            # We don't raise an exception yet, we try the fallback.

        # --- Fallback: Broader Search (e.g., using a general term or popular city) ---
        # The key to a broader search is to drop the specific location from 'q'
        # or use a known major city name if you can derive one.
        # For a simple fallback, we'll try 'events' and let the API decide the scope.
        search_query_fallback = "popular events in the Netherlands"
        params_fallback = {
            "engine": "google_events",
            "q": search_query_fallback,
            "api_key": EVENTS_API_KEY
            # Optionally, you could add a 'location' parameter if you could
            # reverse geocode the lat/lon to a city/region, but for a
            # general fallback, 'popular events' is a simple start.
        }

        print(f"Attempting fallback search with params: {params_fallback}")

        try:
            response = await client.get(EVENTS_API_URL, params=params_fallback, timeout=10.0)
            response.raise_for_status()
            events_data_fallback = response.json()

            if events_data_fallback.get("events_results"):
                print("Fallback events found.")
                return {"events": events_data_fallback}

            # If the fallback still returns nothing, we raise an error.
            print("Fallback search also returned no events.")
            raise HTTPException(
                status_code=404, detail="No events found locally or broadly.")

        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503, detail=f"Error connecting to Events API on fallback: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code,
                                detail=f"Events API error on fallback: {e.response.text}")


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_user_info(
    current_user: Users = Depends(get_current_user)
):
    try:
        # Get the earner associated with this user
        user_earner = await UsersEarners.filter(user_id=current_user.user_id).first()

        if not user_earner:
            raise HTTPException(
                status_code=404, detail="Driver profile not found")

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
    """
    Get current user statistics and earner statistics if applicable
    """
    # Find the UsersEarners mapping for this user and extract earner_id
    user_earner = await UsersEarners.filter(user_id=current_user.user_id).first()
    earner_id = user_earner.earner_id if user_earner else None

    # If we have an earner_id, aggregate the bonus_eur directly in the DB
    if earner_id:
        total_earnings = await IncentivesWeekly.filter(earner_id=earner_id).sum("bonus_eur") or 0.0
    else:
        total_earnings = 0.0

    total_rides = await Timeslots.filter(user_id=current_user.user_id).count()
    logger.info(f"Total earnings query result: {total_earnings}")

    user_stats = {
        "id": current_user.user_id,
        "total_rides": total_rides,
        "total_earnings": total_earnings or 0.0,
    }

    return user_stats
