from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from src.schemas.auth import UserRegister, UserLogin, ForgotPassword, UpdateProfileRequest, RegisterResponse, LoginResponse
from src.models.users import Users
from src.utils.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/", response_model=RegisterResponse)
async def get_me(current_user: Users = Depends(get_current_user)):
    """Get current authenticated user"""
    return RegisterResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        firstname=current_user.first_name,
        lastname=current_user.last_name
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user"""

    # Check if email already exists
    existing_email = await Users.filter(email=user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash the password
    hashed_password = get_password_hash(user_data.password)

    # Create new user
    user = await Users.create(
        email=user_data.email,
        password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )

    return RegisterResponse(
        user_id=user.user_id,
        email=user.email,
        firstname=user.firstname,
        lastname=user.lastname
    )


@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin):
    """Login user and return JWT token"""

    # Find user by email
    user = await Users.filter(email=user_credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.user_id},
        expires_delta=access_token_expires
    )
    user_return = RegisterResponse(
        user_id=user.user_id,
        email=user.email,
        firstname=user.firstname,
        lastname=user.lastname
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user_return}


@router.post("/change_password", status_code=status.HTTP_200_OK)
async def forgot_password(forgot_data: ForgotPassword):
    """Forgot password endpoint (logic not implemented)"""

    # Check if email exists
    user = await Users.filter(email=forgot_data.email).first()

    if not user:
        # Return success anyway to avoid email enumeration
        return {"message": "If the email exists, a password reset link has been sent"}

    # TODO: Implement password reset logic
    # - Generate reset token
    # - Send email with reset link
    # - Store token with expiration

    return {"message": "If the email exists, a password reset link has been sent"}


@router.put("/update_profile", response_model=RegisterResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Users = Depends(get_current_user)
):
    """Update user profile information"""

    print("Updating profile for user:", current_user.email)
    print("New firstname:", body.firstname)
    print("New lastname:", body.lastname)

    if body.firstname is not None:
        current_user.firstname = body.firstname
    if body.lastname is not None:
        current_user.lastname = body.lastname

    await current_user.save()

    return RegisterResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        firstname=current_user.firstname,
        lastname=current_user.lastname,
    )
