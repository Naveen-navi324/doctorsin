from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, time
import jwt
from passlib.context import CryptContext
import re
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Security settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="DocEase Healthcare Platform", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class ConsultationType(str, Enum):
    ONLINE = "online"
    CLINIC = "clinic"
    BOTH = "both"

class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    BREAK = "break"
    UNAVAILABLE = "unavailable"

class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"

# Base User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    phone: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    phone: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    created_at: datetime
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Doctor Profile Models
class ClinicInfo(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zipcode: str
    phone: Optional[str] = None
    facilities: List[str] = []

class DoctorProfileBase(BaseModel):
    bio: Optional[str] = None
    specializations: List[str] = []
    qualifications: List[str] = []
    experience_years: Optional[int] = None
    license_number: Optional[str] = None
    consultation_fee_online: Optional[float] = None
    consultation_fee_clinic: Optional[float] = None
    consultation_types: List[ConsultationType] = [ConsultationType.BOTH]
    profile_image: Optional[str] = None
    clinic_info: Optional[ClinicInfo] = None

class DoctorProfileCreate(DoctorProfileBase):
    pass

class DoctorProfile(DoctorProfileBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    rating: float = 0.0
    total_reviews: int = 0
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorProfileResponse(BaseModel):
    id: str
    user_id: str
    bio: Optional[str] = None
    specializations: List[str] = []
    qualifications: List[str] = []
    experience_years: Optional[int] = None
    license_number: Optional[str] = None
    consultation_fee_online: Optional[float] = None
    consultation_fee_clinic: Optional[float] = None
    consultation_types: List[ConsultationType] = []
    profile_image: Optional[str] = None
    clinic_info: Optional[ClinicInfo] = None
    rating: float = 0.0
    total_reviews: int = 0
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    # Include user info
    user_name: Optional[str] = None
    user_email: Optional[str] = None

# Availability Models
class TimeSlot(BaseModel):
    start_time: str  # Format: "HH:MM"
    end_time: str    # Format: "HH:MM"

class WeeklySchedule(BaseModel):
    day: DayOfWeek
    is_available: bool = True
    time_slots: List[TimeSlot] = []
    consultation_types: List[ConsultationType] = [ConsultationType.BOTH]

class AvailabilitySlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    date: datetime
    start_time: str  # Format: "HH:MM"
    end_time: str    # Format: "HH:MM"
    consultation_type: ConsultationType
    status: AvailabilityStatus = AvailabilityStatus.AVAILABLE
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AvailabilitySlotCreate(BaseModel):
    date: str  # Format: "YYYY-MM-DD"
    start_time: str  # Format: "HH:MM"
    end_time: str    # Format: "HH:MM"
    consultation_type: ConsultationType

class AvailabilitySlotResponse(BaseModel):
    id: str
    doctor_id: str
    date: datetime
    start_time: str
    end_time: str
    consultation_type: ConsultationType
    status: AvailabilityStatus
    created_at: datetime

# Appointment Models
class AppointmentBase(BaseModel):
    doctor_id: str
    availability_slot_id: str
    consultation_type: ConsultationType
    appointment_date: datetime
    start_time: str
    end_time: str
    reason: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    status: AppointmentStatus = AppointmentStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    availability_slot_id: str
    consultation_type: ConsultationType
    appointment_date: datetime
    start_time: str
    end_time: str
    status: AppointmentStatus
    reason: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    # Doctor info
    doctor_name: Optional[str] = None
    doctor_specializations: Optional[List[str]] = None
    doctor_clinic_name: Optional[str] = None
    doctor_clinic_address: Optional[str] = None
    consultation_fee: Optional[float] = None
    # Patient info
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

# Utility Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def validate_password(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Za-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    
    return User(**user)

def require_role(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters with letters and numbers"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict['password']
    
    user = User(**user_dict)
    user_doc = user.dict()
    user_doc['password'] = hashed_password
    
    # Insert user into database
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user.dict())
    
    return Token(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user = User(**user_doc)
    
    # Verify password
    if not verify_password(login_data.password, user_doc['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user.dict())
    
    return Token(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserBase,
    current_user: User = Depends(get_current_user)
):
    # Update user data
    update_dict = update_data.dict(exclude_unset=True)
    update_dict['updated_at'] = datetime.utcnow()
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_dict}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return UserResponse(**User(**updated_user).dict())

# Doctor Profile Routes
@api_router.post("/doctor/profile", response_model=DoctorProfileResponse)
async def create_doctor_profile(
    profile_data: DoctorProfileCreate,
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    # Check if doctor profile already exists
    existing_profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor profile already exists. Use PUT to update."
        )
    
    # Create doctor profile
    profile = DoctorProfile(**profile_data.dict(), user_id=current_user.id)
    profile_doc = profile.dict()
    
    # Insert into database
    await db.doctor_profiles.insert_one(profile_doc)
    
    # Return response with user info
    response = DoctorProfileResponse(**profile.dict())
    response.user_name = current_user.name
    response.user_email = current_user.email
    
    return response

@api_router.get("/doctor/profile", response_model=DoctorProfileResponse)
async def get_my_doctor_profile(
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found. Please create your profile first."
        )
    
    response = DoctorProfileResponse(**DoctorProfile(**profile).dict())
    response.user_name = current_user.name
    response.user_email = current_user.email
    
    return response

@api_router.put("/doctor/profile", response_model=DoctorProfileResponse)
async def update_doctor_profile(
    profile_data: DoctorProfileCreate,
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    # Check if profile exists
    existing_profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not existing_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found. Please create your profile first."
        )
    
    # Update profile
    update_dict = profile_data.dict(exclude_unset=True)
    update_dict['updated_at'] = datetime.utcnow()
    
    await db.doctor_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": update_dict}
    )
    
    # Get updated profile
    updated_profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    response = DoctorProfileResponse(**DoctorProfile(**updated_profile).dict())
    response.user_name = current_user.name
    response.user_email = current_user.email
    
    return response

@api_router.get("/doctor/profile/{doctor_id}", response_model=DoctorProfileResponse)
async def get_doctor_profile_by_id(doctor_id: str):
    profile = await db.doctor_profiles.find_one({"user_id": doctor_id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    # Get user info
    user = await db.users.find_one({"id": doctor_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor user not found"
        )
    
    response = DoctorProfileResponse(**DoctorProfile(**profile).dict())
    response.user_name = user.get('name')
    response.user_email = user.get('email')
    
    return response

@api_router.get("/doctors", response_model=List[DoctorProfileResponse])
async def get_all_doctors(
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    consultation_type: Optional[ConsultationType] = None,
    skip: int = 0,
    limit: int = 20
):
    # Build query
    query = {}
    if specialization:
        query["specializations"] = {"$in": [specialization]}
    if city:
        query["clinic_info.city"] = city
    if consultation_type:
        query["consultation_types"] = {"$in": [consultation_type]}
    
    # Get doctor profiles
    profiles = await db.doctor_profiles.find(query).skip(skip).limit(limit).to_list(limit)
    
    # Get user information for each doctor
    doctor_responses = []
    for profile in profiles:
        user = await db.users.find_one({"id": profile["user_id"]})
        if user:
            response = DoctorProfileResponse(**DoctorProfile(**profile).dict())
            response.user_name = user.get('name')
            response.user_email = user.get('email')
            doctor_responses.append(response)
    
    return doctor_responses

# Availability Routes
@api_router.post("/doctor/availability", response_model=AvailabilitySlotResponse)
async def create_availability_slot(
    slot_data: AvailabilitySlotCreate,
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    # Parse date
    try:
        slot_date = datetime.strptime(slot_data.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Validate time format
    try:
        start_time = datetime.strptime(slot_data.start_time, "%H:%M").time()
        end_time = datetime.strptime(slot_data.end_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM"
        )
    
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be before end time"
        )
    
    # Check for overlapping slots
    existing_slot = await db.availability_slots.find_one({
        "doctor_id": current_user.id,
        "date": slot_date,
        "$or": [
            {"start_time": {"$lt": slot_data.end_time}, "end_time": {"$gt": slot_data.start_time}}
        ]
    })
    
    if existing_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Overlapping time slot already exists"
        )
    
    # Create availability slot
    slot = AvailabilitySlot(
        doctor_id=current_user.id,
        date=slot_date,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        consultation_type=slot_data.consultation_type
    )
    
    await db.availability_slots.insert_one(slot.dict())
    
    return AvailabilitySlotResponse(**slot.dict())

@api_router.get("/doctor/availability", response_model=List[AvailabilitySlotResponse])
async def get_my_availability(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    query = {"doctor_id": current_user.id}
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                date_query["$gte"] = start_dt
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                date_query["$lte"] = end_dt
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use YYYY-MM-DD"
                )
        query["date"] = date_query
    
    slots = await db.availability_slots.find(query).sort("date", 1).to_list(100)
    return [AvailabilitySlotResponse(**AvailabilitySlot(**slot).dict()) for slot in slots]

@api_router.get("/doctor/{doctor_id}/availability", response_model=List[AvailabilitySlotResponse])
async def get_doctor_availability(
    doctor_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {"doctor_id": doctor_id, "status": AvailabilityStatus.AVAILABLE}
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                date_query["$gte"] = start_dt
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                date_query["$lte"] = end_dt
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use YYYY-MM-DD"
                )
        query["date"] = date_query
    
    slots = await db.availability_slots.find(query).sort("date", 1).to_list(100)
    return [AvailabilitySlotResponse(**AvailabilitySlot(**slot).dict()) for slot in slots]

@api_router.delete("/doctor/availability/{slot_id}")
async def delete_availability_slot(
    slot_id: str,
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    # Check if slot exists and belongs to current doctor
    slot = await db.availability_slots.find_one({"id": slot_id, "doctor_id": current_user.id})
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability slot not found"
        )
    
    # Delete slot
    await db.availability_slots.delete_one({"id": slot_id, "doctor_id": current_user.id})
    
    return {"message": "Availability slot deleted successfully"}

# Appointment Routes
@api_router.post("/appointments", response_model=AppointmentResponse)
async def book_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    # Check if availability slot exists and is available
    slot = await db.availability_slots.find_one({
        "id": appointment_data.availability_slot_id,
        "doctor_id": appointment_data.doctor_id,
        "status": AvailabilityStatus.AVAILABLE
    })
    
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability slot not found or already booked"
        )
    
    # Validate appointment date and time match the slot
    slot_obj = AvailabilitySlot(**slot)
    if (appointment_data.appointment_date.date() != slot_obj.date.date() or
        appointment_data.start_time != slot_obj.start_time or
        appointment_data.end_time != slot_obj.end_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment details don't match the availability slot"
        )
    
    # Check if patient already has an appointment at this time
    existing_appointment = await db.appointments.find_one({
        "patient_id": current_user.id,
        "appointment_date": appointment_data.appointment_date,
        "start_time": appointment_data.start_time,
        "status": {"$in": [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]}
    })
    
    if existing_appointment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an appointment scheduled at this time"
        )
    
    # Create appointment
    appointment = Appointment(**appointment_data.dict(), patient_id=current_user.id)
    appointment_doc = appointment.dict()
    
    # Insert appointment and update availability slot status
    await db.appointments.insert_one(appointment_doc)
    await db.availability_slots.update_one(
        {"id": appointment_data.availability_slot_id},
        {"$set": {"status": AvailabilityStatus.BOOKED}}
    )
    
    # Get doctor and patient info for response
    doctor = await db.users.find_one({"id": appointment_data.doctor_id})
    doctor_profile = await db.doctor_profiles.find_one({"user_id": appointment_data.doctor_id})
    
    response = AppointmentResponse(**appointment.dict())
    if doctor:
        response.doctor_name = doctor.get('name')
    if doctor_profile:
        response.doctor_specializations = doctor_profile.get('specializations', [])
        response.doctor_clinic_name = doctor_profile.get('clinic_info', {}).get('name')
        response.doctor_clinic_address = doctor_profile.get('clinic_info', {}).get('address')
        if appointment_data.consultation_type == ConsultationType.ONLINE:
            response.consultation_fee = doctor_profile.get('consultation_fee_online')
        elif appointment_data.consultation_type == ConsultationType.CLINIC:
            response.consultation_fee = doctor_profile.get('consultation_fee_clinic')
    
    response.patient_name = current_user.name
    response.patient_email = current_user.email
    response.patient_phone = current_user.phone
    
    return response

@api_router.get("/appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(
    status: Optional[AppointmentStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Build query based on user role
    query = {}
    if current_user.role == UserRole.PATIENT:
        query["patient_id"] = current_user.id
    elif current_user.role == UserRole.DOCTOR:
        query["doctor_id"] = current_user.id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients and doctors can access appointments"
        )
    
    # Add filters
    if status:
        query["status"] = status
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                date_query["$gte"] = start_dt
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                date_query["$lte"] = end_dt
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use YYYY-MM-DD"
                )
        query["appointment_date"] = date_query
    
    # Get appointments
    appointments = await db.appointments.find(query).sort("appointment_date", 1).to_list(100)
    
    # Enrich with doctor and patient information
    appointment_responses = []
    for appt in appointments:
        appointment = Appointment(**appt)
        response = AppointmentResponse(**appointment.dict())
        
        # Get doctor info
        doctor = await db.users.find_one({"id": appointment.doctor_id})
        doctor_profile = await db.doctor_profiles.find_one({"user_id": appointment.doctor_id})
        if doctor:
            response.doctor_name = doctor.get('name')
        if doctor_profile:
            response.doctor_specializations = doctor_profile.get('specializations', [])
            response.doctor_clinic_name = doctor_profile.get('clinic_info', {}).get('name')
            response.doctor_clinic_address = doctor_profile.get('clinic_info', {}).get('address')
            if appointment.consultation_type == ConsultationType.ONLINE:
                response.consultation_fee = doctor_profile.get('consultation_fee_online')
            elif appointment.consultation_type == ConsultationType.CLINIC:
                response.consultation_fee = doctor_profile.get('consultation_fee_clinic')
        
        # Get patient info
        patient = await db.users.find_one({"id": appointment.patient_id})
        if patient:
            response.patient_name = patient.get('name')
            response.patient_email = patient.get('email')
            response.patient_phone = patient.get('phone')
        
        appointment_responses.append(response)
    
    return appointment_responses

@api_router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_details(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    # Find appointment
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment_obj = Appointment(**appointment)
    
    # Check if user has access to this appointment
    if (current_user.role == UserRole.PATIENT and appointment_obj.patient_id != current_user.id) or \
       (current_user.role == UserRole.DOCTOR and appointment_obj.doctor_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this appointment"
        )
    
    # Build response with complete information
    response = AppointmentResponse(**appointment_obj.dict())
    
    # Get doctor info
    doctor = await db.users.find_one({"id": appointment_obj.doctor_id})
    doctor_profile = await db.doctor_profiles.find_one({"user_id": appointment_obj.doctor_id})
    if doctor:
        response.doctor_name = doctor.get('name')
    if doctor_profile:
        response.doctor_specializations = doctor_profile.get('specializations', [])
        response.doctor_clinic_name = doctor_profile.get('clinic_info', {}).get('name')
        response.doctor_clinic_address = doctor_profile.get('clinic_info', {}).get('address')
        if appointment_obj.consultation_type == ConsultationType.ONLINE:
            response.consultation_fee = doctor_profile.get('consultation_fee_online')
        elif appointment_obj.consultation_type == ConsultationType.CLINIC:
            response.consultation_fee = doctor_profile.get('consultation_fee_clinic')
    
    # Get patient info
    patient = await db.users.find_one({"id": appointment_obj.patient_id})
    if patient:
        response.patient_name = patient.get('name')
        response.patient_email = patient.get('email')
        response.patient_phone = patient.get('phone')
    
    return response

@api_router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: str,
    status_update: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    # Find appointment
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment_obj = Appointment(**appointment)
    
    # Check permissions for status updates
    if current_user.role == UserRole.PATIENT:
        # Patients can only cancel their own appointments
        if appointment_obj.patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this appointment"
            )
        if status_update.status not in [AppointmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients can only cancel appointments"
            )
    elif current_user.role == UserRole.DOCTOR:
        # Doctors can confirm, complete, or cancel their appointments
        if appointment_obj.doctor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this appointment"
            )
        if status_update.status not in [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid status update for doctor"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients and doctors can update appointments"
        )
    
    # Prepare update data
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.utcnow()
    }
    
    if status_update.notes:
        update_data["notes"] = status_update.notes
    
    # Set specific timestamps based on status
    if status_update.status == AppointmentStatus.CONFIRMED:
        update_data["confirmed_at"] = datetime.utcnow()
    elif status_update.status == AppointmentStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
    elif status_update.status == AppointmentStatus.CANCELLED:
        update_data["cancelled_at"] = datetime.utcnow()
        if status_update.cancellation_reason:
            update_data["cancellation_reason"] = status_update.cancellation_reason
        
        # Free up the availability slot if cancelled
        await db.availability_slots.update_one(
            {"id": appointment_obj.availability_slot_id},
            {"$set": {"status": AvailabilityStatus.AVAILABLE}}
        )
    
    # Update appointment
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": update_data}
    )
    
    # Return updated appointment
    return await get_appointment_details(appointment_id, current_user)

@api_router.delete("/appointments/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    # Find appointment
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment_obj = Appointment(**appointment)
    
    # Check if user can cancel this appointment
    if (current_user.role == UserRole.PATIENT and appointment_obj.patient_id != current_user.id) or \
       (current_user.role == UserRole.DOCTOR and appointment_obj.doctor_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this appointment"
        )
    
    # Check if appointment can be cancelled
    if appointment_obj.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed or already cancelled appointment"
        )
    
    # Update appointment status to cancelled
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {
            "status": AppointmentStatus.CANCELLED,
            "cancelled_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "cancellation_reason": f"Cancelled by {current_user.role}"
        }}
    )
    
    # Free up the availability slot
    await db.availability_slots.update_one(
        {"id": appointment_obj.availability_slot_id},
        {"$set": {"status": AvailabilityStatus.AVAILABLE}}
    )
    
    return {"message": "Appointment cancelled successfully"}

# Dashboard Routes
@api_router.get("/dashboard/patient")
async def get_patient_dashboard(
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    return {
        "message": f"Welcome to patient dashboard, {current_user.name}!",
        "user": UserResponse(**current_user.dict()),
        "appointments": [],  # Will be populated later
        "prescriptions": [],
        "lab_tests": []
    }

@api_router.get("/dashboard/doctor")
async def get_doctor_dashboard(
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    # Get doctor profile
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    has_profile = profile is not None
    
    # Get today's availability
    today = datetime.now().date()
    today_slots = await db.availability_slots.find({
        "doctor_id": current_user.id,
        "date": {"$gte": datetime.combine(today, datetime.min.time())}
    }).to_list(20)
    
    return {
        "message": f"Welcome to doctor dashboard, Dr. {current_user.name}!",
        "user": UserResponse(**current_user.dict()),
        "has_profile": has_profile,
        "profile": DoctorProfileResponse(**DoctorProfile(**profile).dict()) if profile else None,
        "today_availability_slots": len(today_slots),
        "appointments": [],  # Will be populated later
        "patients": [],
        "earnings": 0
    }

@api_router.get("/dashboard/admin")
async def get_admin_dashboard(
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user_count = await db.users.count_documents({})
    doctor_count = await db.users.count_documents({"role": "doctor"})
    patient_count = await db.users.count_documents({"role": "patient"})
    profile_count = await db.doctor_profiles.count_documents({})
    
    return {
        "message": f"Welcome to admin dashboard, {current_user.name}!",
        "user": UserResponse(**current_user.dict()),
        "stats": {
            "total_users": user_count,
            "doctors": doctor_count,
            "patients": patient_count,
            "doctor_profiles": profile_count
        }
    }

# Test Routes
@api_router.get("/")
async def root():
    return {"message": "DocEase Healthcare Platform API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# User Management Routes (Admin only)
@api_router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users = await db.users.find().to_list(1000)
    return [UserResponse(**User(**user).dict()) for user in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR]))
):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(**User(**user).dict())

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    """Create indexes on startup"""
    await db.users.create_index("email", unique=True)
    await db.doctor_profiles.create_index("user_id", unique=True)
    await db.doctor_profiles.create_index("specializations")
    await db.doctor_profiles.create_index("clinic_info.city")
    await db.availability_slots.create_index([("doctor_id", 1), ("date", 1)])
    await db.appointments.create_index([("patient_id", 1), ("appointment_date", 1)])
    await db.appointments.create_index([("doctor_id", 1), ("appointment_date", 1)])
    await db.appointments.create_index("availability_slot_id")
    await db.appointments.create_index("status")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()