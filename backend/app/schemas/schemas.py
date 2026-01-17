from datetime import datetime, date
from typing import Literal, Optional, List
from pydantic import BaseModel, EmailStr


# Common
class Message(BaseModel):
    message: str


# Users
class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    role: Literal["parent", "child"]
    profile_image_url: Optional[str] = None
    icon_emoji: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None  # Optional for children, required for parents
    family_id: Optional[int] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_image_url: Optional[str] = None
    icon_emoji: Optional[str] = None


class UserOut(UserBase):
    id: int
    family_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Families
class FamilyCreate(BaseModel):
    name: str
    admin_password: str


class FamilyUpdate(BaseModel):
    name: Optional[str] = None
    admin_password: Optional[str] = None


class FamilyInvite(BaseModel):
    email: EmailStr


class FamilyOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    family_id: int
    admin_password: str


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["parent", "child"] = "parent"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class PlanPublic(BaseModel):
    name: Literal["free", "family_plus", "family_pro"]
    label: str
    description: str
    currency: str
    monthly_price_cents: int | None
    annual_price_cents: int | None
    price_monthly_id: Optional[str] = None
    price_annual_id: Optional[str] = None
    max_children: Optional[int] = None
    max_families: Optional[int] = None


class SubscriptionOut(BaseModel):
    plan: Literal["free", "family_plus", "family_pro"]
    status: str
    price_id: Optional[str] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    is_active: bool


class CheckoutSessionRequest(BaseModel):
    price_id: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


class PortalSessionRequest(BaseModel):
    return_url: Optional[str] = None


class PortalSessionResponse(BaseModel):
    url: str


class InvoiceOut(BaseModel):
    id: str
    status: str
    amount_due: int
    amount_paid: int
    currency: str
    hosted_invoice_url: Optional[str] = None
    invoice_pdf: Optional[str] = None
    created: datetime
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


# Events
class EventBase(BaseModel):
    family_id: int
    title: str
    description: Optional[str] = None
    emoji: Optional[str] = None
    start_time: datetime
    end_time: datetime
    source: Optional[Literal["ical", "google", "alexa", "manual"]] = None
    source_id: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    source: Optional[Literal["ical", "google", "alexa", "manual"]] = None
    source_id: Optional[str] = None


class EventOut(EventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Chores
class ChoreBase(BaseModel):
    family_id: int
    title: str
    description: Optional[str] = None
    emoji: Optional[str] = None
    point_value: int
    assigned_to: Optional[int] = None  # Legacy single assignee
    assigned_to_ids: Optional[str] = (
        None  # Comma-separated user IDs for multiple assignees
    )
    is_group_chore: bool = True  # True = one completion for all, False = each person completes individually
    completed: bool = False
    completed_by_ids: Optional[str] = None  # For individual chores: who has completed
    week_start: date
    # Recurring fields
    is_recurring: bool = False
    recurrence_type: Optional[Literal["daily", "weekly", "monthly"]] = None
    recurrence_interval: Optional[int] = None  # every N days/weeks/months
    recurrence_count: Optional[int] = None  # times per day (e.g., 2x per day)
    recurrence_days: Optional[str] = (
        None  # comma-separated days of week (0-6) for weekly
    )
    recurrence_time_of_day: Optional[
        Literal["morning", "afternoon", "evening", "anytime"]
    ] = None
    recurrence_end_date: Optional[date] = None
    parent_chore_id: Optional[int] = None
    max_completions: Optional[int] = (
        None  # Max times this chore can be completed (for recurring)
    )


class ChoreCreate(ChoreBase):
    pass


class ChoreUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    point_value: Optional[int] = None
    assigned_to: Optional[int] = None
    assigned_to_ids: Optional[str] = None
    is_group_chore: Optional[bool] = None
    completed: Optional[bool] = None
    completed_by_ids: Optional[str] = None
    # Recurring fields
    is_recurring: Optional[bool] = None
    recurrence_type: Optional[Literal["daily", "weekly", "monthly"]] = None
    recurrence_interval: Optional[int] = None
    recurrence_count: Optional[int] = None
    recurrence_days: Optional[str] = None
    recurrence_time_of_day: Optional[
        Literal["morning", "afternoon", "evening", "anytime"]
    ] = None
    recurrence_end_date: Optional[date] = None
    parent_chore_id: Optional[int] = None
    max_completions: Optional[int] = None


class ChoreOut(ChoreBase):
    id: int
    created_at: datetime
    completed_today: bool = False  # Added for frontend daily completion tracking

    class Config:
        from_attributes = True


class ChoreCompletionOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_emoji: Optional[str] = None
    completed_at: datetime
    points_awarded: int

    class Config:
        from_attributes = True


# Points
class PointCreate(BaseModel):
    user_id: int
    chore_id: Optional[int] = None
    points: int


class PointOut(PointCreate):
    id: int
    awarded_at: datetime

    class Config:
        from_attributes = True


# Leaderboard
class CompletedChoreOut(BaseModel):
    id: int
    title: str
    emoji: Optional[str] = None
    point_value: int
    awarded_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: int
    name: str
    icon_emoji: Optional[str] = None
    total_points: int
    completed_chores: List[CompletedChoreOut]

    class Config:
        from_attributes = True


# Goals
class GoalBase(BaseModel):
    family_id: int
    name: str
    description: Optional[str] = None
    point_requirement: Optional[int] = None
    prize: Optional[str] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    point_requirement: Optional[int] = None
    prize: Optional[str] = None


class GoalOut(GoalBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Calendars
class ICalConnectRequest(BaseModel):
    url: str


class GoogleConnectRequest(BaseModel):
    code: str  # OAuth authorization code (placeholder for dev)


class AlexaConnectRequest(BaseModel):
    token: str  # placeholder for dev


class WeeklyEventsOut(BaseModel):
    events: List[EventOut]
