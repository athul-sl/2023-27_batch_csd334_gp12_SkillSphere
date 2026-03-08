"""All database models for SkillSphere."""
import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Numeric, Boolean, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ============ ENUMS ============

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"

class UserStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"

class ServiceStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAUSED = "paused"
    ARCHIVED = "archived"

class PricingType(str, enum.Enum):
    FIXED = "fixed"
    HOURLY = "hourly"
    NEGOTIABLE = "negotiable"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    REVISION = "revision"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"


# ============ MODELS ============

class User(Base):
    """User model for students and admins."""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    student_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    year_of_study: Mapped[Optional[int]] = mapped_column(nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    semester: Mapped[Optional[int]] = mapped_column(nullable=True)
    batch: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    course_duration: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.PENDING, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    total_earnings: Mapped[float] = mapped_column(default=0.0)
    total_spent: Mapped[float] = mapped_column(default=0.0)
    average_rating: Mapped[float] = mapped_column(default=0.0)
    total_reviews: Mapped[int] = mapped_column(default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    services: Mapped[List["ServiceListing"]] = relationship("ServiceListing", back_populates="provider", foreign_keys="ServiceListing.provider_id", cascade="all, delete-orphan")
    orders_as_client: Mapped[List["Order"]] = relationship("Order", foreign_keys="Order.client_id", back_populates="client", cascade="all, delete-orphan")
    orders_as_provider: Mapped[List["Order"]] = relationship("Order", foreign_keys="Order.provider_id", back_populates="provider", cascade="all, delete-orphan")
    reviews_given: Mapped[List["Review"]] = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer", cascade="all, delete-orphan")
    reviews_received: Mapped[List["Review"]] = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee", cascade="all, delete-orphan")
    sent_messages: Mapped[List["Message"]] = relationship("Message", back_populates="sender", cascade="all, delete-orphan")
    portfolio_projects: Mapped[List["PortfolioProject"]] = relationship("PortfolioProject", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
    
    @property
    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE


class Category(Base):
    """Category for organizing skills."""
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    skills: Mapped[List["Skill"]] = relationship("Skill", back_populates="category", cascade="all, delete-orphan")


class Skill(Base):
    """Skill representing a specific ability."""
    __tablename__ = "skills"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    category: Mapped["Category"] = relationship("Category", back_populates="skills")
    services: Mapped[List["ServiceListing"]] = relationship("ServiceListing", back_populates="skill", cascade="all, delete-orphan")
    
    @property
    def category_name(self) -> Optional[str]:
        return self.category.name if self.category else None


class ServiceListing(Base):
    """Service listing for skill offerings."""
    __tablename__ = "service_listings"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    
    pricing_type: Mapped[PricingType] = mapped_column(Enum(PricingType), default=PricingType.FIXED, nullable=False)
    price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    min_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    max_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    
    delivery_time_days: Mapped[int] = mapped_column(Integer, default=1)
    revision_count: Mapped[int] = mapped_column(Integer, default=1)
    
    status: Mapped[ServiceStatus] = mapped_column(Enum(ServiceStatus), default=ServiceStatus.APPROVED, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    order_count: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float] = mapped_column(default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    
    thumbnail: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    portfolio_images: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    provider_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id: Mapped[Optional[int]] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"), nullable=True, index=True)
    custom_skill_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    provider: Mapped["User"] = relationship("User", foreign_keys=[provider_id], back_populates="services")
    skill: Mapped[Optional["Skill"]] = relationship("Skill", back_populates="services")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="service")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="service", cascade="all, delete-orphan")
    
    @property
    def is_available(self) -> bool:
        return self.status == ServiceStatus.APPROVED


class Order(Base):
    """Order for service transactions."""
    __tablename__ = "orders"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    agreed_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    expected_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    actual_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    revision_count: Mapped[int] = mapped_column(Integer, default=0)
    max_revisions: Mapped[int] = mapped_column(Integer, default=1)
    
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    client_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    provider_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    service_id: Mapped[Optional[int]] = mapped_column(ForeignKey("service_listings.id", ondelete="SET NULL"), nullable=True, index=True)
    service_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id], back_populates="orders_as_client")
    provider: Mapped["User"] = relationship("User", foreign_keys=[provider_id], back_populates="orders_as_provider")
    service: Mapped["ServiceListing"] = relationship("ServiceListing", back_populates="orders")
    review: Mapped[Optional["Review"]] = relationship("Review", back_populates="order", uselist=False)
    
    @property
    def can_be_reviewed(self) -> bool:
        return self.status == OrderStatus.COMPLETED and self.review is None


class Review(Base):
    """Review for rating services and providers."""
    __tablename__ = "reviews"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    communication_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quality_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    delivery_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    provider_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("service_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee: Mapped["User"] = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
    service: Mapped["ServiceListing"] = relationship("ServiceListing", back_populates="reviews")
    order: Mapped["Order"] = relationship("Order", back_populates="review")


class Conversation(Base):
    """Conversation between two users."""
    __tablename__ = "conversations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user1_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user2_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id: Mapped[Optional[int]] = mapped_column(ForeignKey("service_listings.id", ondelete="SET NULL"), nullable=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user1: Mapped["User"] = relationship("User", foreign_keys=[user1_id])
    user2: Mapped["User"] = relationship("User", foreign_keys=[user2_id])
    service: Mapped[Optional["ServiceListing"]] = relationship("ServiceListing")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    """Chat message within a conversation."""
    __tablename__ = "messages"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    sender: Mapped["User"] = relationship("User", back_populates="sent_messages")


class PortfolioProject(Base):
    """Portfolio project to showcase user's work."""
    __tablename__ = "portfolio_projects"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    project_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # comma-separated
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    user: Mapped["User"] = relationship("User", back_populates="portfolio_projects")
