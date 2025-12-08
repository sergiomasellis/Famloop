from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from ..db.session import Base


class FamilyGroup(Base):
    __tablename__ = "family_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    admin_password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[list["User"]] = relationship(
        "User", back_populates="family", cascade="all, delete-orphan"
    )
    events: Mapped[list["Event"]] = relationship(
        "Event", back_populates="family", cascade="all, delete-orphan"
    )
    chores: Mapped[list["Chore"]] = relationship(
        "Chore", back_populates="family", cascade="all, delete-orphan"
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal", back_populates="family", cascade="all, delete-orphan"
    )
    tokens: Mapped[list["CalendarToken"]] = relationship(
        "CalendarToken", back_populates="family", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    family_id: Mapped[int | None] = mapped_column(ForeignKey("family_groups.id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, unique=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # parent | child
    profile_image_url: Mapped[str | None] = mapped_column(Text)
    icon_emoji: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    family: Mapped["FamilyGroup"] = relationship("FamilyGroup", back_populates="users")
    events: Mapped[list["EventParticipant"]] = relationship(
        "EventParticipant", back_populates="user", cascade="all, delete-orphan"
    )
    chores_assigned: Mapped[list["Chore"]] = relationship(
        "Chore", back_populates="assignee"
    )
    points: Mapped[list["Point"]] = relationship("Point", back_populates="user")
    subscription: Mapped["Subscription | None"] = relationship(
        "Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(String, nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String, nullable=True, unique=True
    )
    price_id: Mapped[str | None] = mapped_column(String, nullable=True)
    plan: Mapped[str] = mapped_column(String, default="free")
    status: Mapped[str] = mapped_column(String, default="inactive")
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="subscription")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("family_groups.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    emoji: Mapped[str | None] = mapped_column(String)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    source: Mapped[str | None] = mapped_column(String)  # ical | google | alexa | manual
    source_id: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    family: Mapped["FamilyGroup"] = relationship("FamilyGroup", back_populates="events")
    participants: Mapped[list["EventParticipant"]] = relationship(
        "EventParticipant", back_populates="event", cascade="all, delete-orphan"
    )


class EventParticipant(Base):
    __tablename__ = "event_participants"

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)

    event: Mapped["Event"] = relationship("Event", back_populates="participants")
    user: Mapped["User"] = relationship("User", back_populates="events")


class Chore(Base):
    __tablename__ = "chores"
    __table_args__ = (
        CheckConstraint(
            "point_value BETWEEN 1 AND 10", name="chk_chore_points_between_1_10"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("family_groups.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    emoji: Mapped[str | None] = mapped_column(String)
    point_value: Mapped[int] = mapped_column(Integer, nullable=False)
    assigned_to: Mapped[int | None] = mapped_column(
        ForeignKey("users.id")
    )  # Legacy single assignee
    assigned_to_ids: Mapped[str | None] = mapped_column(
        Text
    )  # Comma-separated user IDs for multiple assignees
    is_group_chore: Mapped[bool] = mapped_column(
        Boolean, default=True
    )  # True = one completion for all, False = each person completes individually
    completed: Mapped[bool] = mapped_column(
        Boolean, default=False
    )  # For group chores or when all individuals complete
    completed_by_ids: Mapped[str | None] = mapped_column(
        Text
    )  # For individual chores: comma-separated IDs of who completed
    week_start: Mapped[datetime] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Recurring chore fields
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_type: Mapped[str | None] = mapped_column(
        String
    )  # daily, weekly, monthly
    recurrence_interval: Mapped[int | None] = mapped_column(
        Integer
    )  # every N days/weeks/months (default 1)
    recurrence_count: Mapped[int | None] = mapped_column(
        Integer
    )  # times per day (e.g., 2x per day, default 1)
    recurrence_days: Mapped[str | None] = mapped_column(
        Text
    )  # comma-separated days of week (0-6) for weekly
    recurrence_time_of_day: Mapped[str | None] = mapped_column(
        String
    )  # morning, afternoon, evening, anytime
    recurrence_end_date: Mapped[datetime | None] = mapped_column(
        Date
    )  # optional end date
    parent_chore_id: Mapped[int | None] = mapped_column(
        ForeignKey("chores.id")
    )  # link to template for recurring instances
    max_completions: Mapped[int | None] = mapped_column(
        Integer
    )  # max number of times this chore can be completed (for recurring chores)

    family: Mapped["FamilyGroup"] = relationship("FamilyGroup", back_populates="chores")
    assignee: Mapped["User"] = relationship("User", back_populates="chores_assigned")
    points: Mapped[list["Point"]] = relationship("Point", back_populates="chore")


class ChoreCompletion(Base):
    __tablename__ = "chore_completions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chore_id: Mapped[int] = mapped_column(ForeignKey("chores.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    points_awarded: Mapped[int] = mapped_column(Integer, nullable=False)

    chore: Mapped["Chore"] = relationship("Chore")
    user: Mapped["User"] = relationship("User")


class Point(Base):
    __tablename__ = "points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    chore_id: Mapped[int | None] = mapped_column(ForeignKey("chores.id"))
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="points")
    chore: Mapped["Chore"] = relationship("Chore", back_populates="points")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("family_groups.id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    point_requirement: Mapped[int | None] = mapped_column(Integer)
    prize: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    family: Mapped["FamilyGroup"] = relationship("FamilyGroup", back_populates="goals")


class CalendarToken(Base):
    __tablename__ = "calendar_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("family_groups.id"))
    service: Mapped[str] = mapped_column(String)  # google | alexa
    access_token: Mapped[str | None] = mapped_column(Text)
    refresh_token: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    family: Mapped["FamilyGroup"] = relationship("FamilyGroup", back_populates="tokens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User")


class QRCodeSession(Base):
    __tablename__ = "qr_code_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_token: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True
    )
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scanned: Mapped[bool] = mapped_column(Boolean, default=False)
    scanned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User")
