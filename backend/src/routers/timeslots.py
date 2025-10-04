from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from src.models.timeslots import Timeslots
from src.models.users import Users
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/timeslots", tags=["timeslots"])

@router.get("/schedule")
async def get_weekly_schedule():
    """
    Return all timeslots grouped by weekday, in the same structured format.
    """
    # Fetch all timeslots from the database
    timeslots = await Timeslots.all().order_by("start_time")

    if not timeslots:
        return []

    # Create day name mapping
    day_map = {
        0: "Monday",
        1: "Tuesday",
        2: "Wednesday",
        3: "Thursday",
        4: "Friday",
        5: "Saturday",
        6: "Sunday",
    }

    # Helper to format times
    def fmt_time(dt):
        return dt.strftime("%H:%M")

    schedule_by_day = {}

    for t in timeslots:
        # Convert UTC to local time if needed (optional)
        # tz = pytz.timezone("Europe/Amsterdam")
        # start = t.start_time.astimezone(tz)
        # end = t.end_time.astimezone(tz) if t.end_time else None
        start = t.start_time
        end = t.end_time

        day_name = day_map[start.weekday()]
        if day_name not in schedule_by_day:
            schedule_by_day[day_name] = []

        # Calculate duration in hours
        if end:
            duration = round((end - start).total_seconds() / 3600, 2)
        else:
            duration = None

        slot = {
            "time": f"{fmt_time(start)} - {fmt_time(end) if end else '—'}",
            "activity": "Driving Session",  # Placeholder (you can replace with t.activity if you add such a field)
            "instructor": "Customer",
            "duration": duration,
            "color": "bg-indigo-600/10 text-indigo-800" if t.is_active else "bg-gray-600/10 text-gray-800",
        }

        schedule_by_day[day_name].append(slot)

    # Convert to list format
    formatted_schedule = [
        {"day": day, "slots": slots}
        for day, slots in sorted(schedule_by_day.items(), key=lambda x: list(day_map.values()).index(x[0]))
    ]

    return formatted_schedule


@router.post("/start")
async def start_timeslot(current_user: Users = Depends(get_current_user)):
    """
    Create a new timeslot when user clicks the Earn button
    """
    # Check if user already has an active timeslot
    active_timeslot = await Timeslots.filter(
        user_id=current_user.user_id,
        is_active=True
    ).first()

    if active_timeslot:
        raise HTTPException(status_code=400, detail="User already has an active timeslot")

    # Create new timeslot
    timeslot = await Timeslots.create(
        user_id=current_user.user_id,
        is_active=True
    )

    return {
        "timeslot_id": timeslot.timeslot_id,
        "user_id": timeslot.user_id,
        "start_time": timeslot.start_time,
        "is_active": timeslot.is_active
    }


@router.post("/end/{timeslot_id}")
async def end_timeslot(timeslot_id: int, current_user: Users = Depends(get_current_user)):
    """
    Close a timeslot when handleClose() is called
    """
    # Find the timeslot
    timeslot = await Timeslots.filter(
        timeslot_id=timeslot_id,
        user_id=current_user.user_id,
        is_active=True
    ).first()

    if not timeslot:
        raise HTTPException(status_code=404, detail="Active timeslot not found")

    # Update the timeslot
    timeslot.end_time = datetime.utcnow()
    timeslot.is_active = False
    await timeslot.save()

    return {
        "timeslot_id": timeslot.timeslot_id,
        "user_id": timeslot.user_id,
        "start_time": timeslot.start_time,
        "end_time": timeslot.end_time,
        "is_active": timeslot.is_active
    }


@router.get("/active")
async def get_active_timeslot(current_user: Users = Depends(get_current_user)):
    """
    Get the current active timeslot for the user
    """
    timeslot = await Timeslots.filter(
        user_id=current_user.user_id,
        is_active=True
    ).first()

    if not timeslot:
        return {"active_timeslot": None}

    return {
        "timeslot_id": timeslot.timeslot_id,
        "user_id": timeslot.user_id,
        "start_time": timeslot.start_time,
        "is_active": timeslot.is_active
    }
