from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta, datetime
from src.schemas.auth import UserRegister, UserLogin, ForgotPassword, UpdateProfileRequest, RegisterResponse, LoginResponse
from src.models.users import Users
from src.utils.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from src.middleware.auth import get_current_user
from src.models.timeslots import Timeslots
from src.models.users_earners import UsersEarners

router = APIRouter(prefix="/auth", tags=["auth"])


async def should_user_rest(user_id: int) -> bool:
    three_hours_ago = datetime.now() - timedelta(hours=3)

    timeslot_count = await Timeslots.filter(
        user_id=user_id,
        start_time__gte=three_hours_ago
    ).count()

    return timeslot_count > 3


@router.get("/", response_model=RegisterResponse)
async def get_me(current_user: Users = Depends(get_current_user)):
    is_rest_now = await should_user_rest(current_user.user_id)

    return RegisterResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        firstname=current_user.firstname,
        lastname=current_user.lastname,
        isRestNow=is_rest_now,
        isBreakMode=current_user.isBreakMode
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    existing_email = await Users.filter(email=user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(user_data.password)

    user = await Users.create(
        email=user_data.email,
        password=hashed_password,
        firstname=user_data.firstname,
        lastname=user_data.lastname
    )

    some_earner_id = f"E1000{user.user_id}"
    await UsersEarners.create(user_id=user.user_id, earner_id=some_earner_id)

    return RegisterResponse(
        user_id=user.user_id,
        email=user.email,
        firstname=user.firstname,
        lastname=user.lastname,
        isRestNow=False,
        isBreakMode=False 
    )

@router.post("/toggle_break_mode", response_model=RegisterResponse)
async def toggle_break_mode(
    current_user: Users = Depends(get_current_user)
):
    current_user.isBreakMode = not current_user.isBreakMode
    await current_user.save()

    is_rest_now = await should_user_rest(current_user.user_id)

    return RegisterResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        firstname=current_user.firstname,
        lastname=current_user.lastname,
        isRestNow=is_rest_now,
        isBreakMode=current_user.isBreakMode
    )


@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin):
    user = await Users.filter(email=user_credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.user_id},
        expires_delta=access_token_expires
    )

    is_rest_now = await should_user_rest(user.user_id)

    user_return = RegisterResponse(
        user_id=user.user_id,
        email=user.email,
        firstname=user.firstname,
        lastname=user.lastname,
        isRestNow=is_rest_now,
        isBreakMode=user.isBreakMode
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user_return}


@router.post("/change_password", status_code=status.HTTP_200_OK)
async def forgot_password(forgot_data: ForgotPassword):

    user = await Users.filter(email=forgot_data.email).first()

    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}

    return {"message": "If the email exists, a password reset link has been sent"}


@router.put("/update_profile", response_model=RegisterResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Users = Depends(get_current_user)
):

    if body.firstname is not None:
        current_user.firstname = body.firstname
    if body.lastname is not None:
        current_user.lastname = body.lastname

    await current_user.save()

    is_rest_now = await should_user_rest(current_user.user_id)

    return RegisterResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        firstname=current_user.firstname,
        lastname=current_user.lastname,
        isRestNow=is_rest_now,
        isBreakMode=current_user.isBreakMode
    )

