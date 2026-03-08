"""All Pydantic schemas for request/response validation."""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

from app.config import settings
from app.models import ServiceStatus, PricingType, OrderStatus, PaymentStatus


# ============ USER SCHEMAS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    student_id: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=2020, le=2040)
    phone: Optional[str] = Field(None, max_length=20)
    semester: Optional[int] = Field(None, ge=1, le=8)
    batch: Optional[str] = Field(None, max_length=10)
    course_duration: Optional[str] = Field(None, max_length=20)
    
    @field_validator("email")
    @classmethod
    def validate_college_email(cls, v: str) -> str:
        domain = settings.allowed_email_domain
        if not v.lower().endswith(f"@{domain.lower()}"):
            raise ValueError(f"Email must be from @{domain} domain")
        return v.lower()
    
    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    student_id: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, pattern="^[a-zA-Z\\s\\-/&]+$", min_length=2, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=2020, le=2040)
    phone: Optional[str] = Field(None, max_length=20)
    semester: Optional[int] = Field(None, ge=1, le=8)
    batch: Optional[str] = Field(None, max_length=10)
    course_duration: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image: Optional[str] = Field(None, max_length=500)

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    student_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    phone: Optional[str] = None
    semester: Optional[int] = None
    batch: Optional[str] = None
    course_duration: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    role: str
    status: str
    is_verified: bool
    average_rating: float
    total_reviews: int
    total_earnings: float
    total_spent: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenPayload(BaseModel):
    sub: str
    exp: datetime
    type: str

class RefreshToken(BaseModel):
    refresh_token: str


# ============ SKILL SCHEMAS ============

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    display_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class SkillResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool
    category_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: bool
    display_order: int
    skills: List[SkillResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True

class CategoryListResponse(BaseModel):
    items: List[CategoryResponse]
    total: int

class SkillCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    category_id: int

class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None

class SkillListResponse(BaseModel):
    items: List[SkillResponse]
    total: int


# ============ SERVICE SCHEMAS ============

class ServiceCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=5000)
    short_description: Optional[str] = Field(None, max_length=300)
    skill_id: Optional[int] = None
    custom_skill_name: Optional[str] = Field(None, min_length=2, max_length=100)
    pricing_type: PricingType = PricingType.FIXED
    price: Optional[Decimal] = Field(Decimal("0"), ge=0)
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    delivery_time_days: int = Field(1, ge=1, le=30)
    revision_count: int = Field(1, ge=0, le=10)
    thumbnail: Optional[str] = None
    portfolio_images: Optional[str] = None

class ServiceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=20, max_length=5000)
    short_description: Optional[str] = Field(None, max_length=300)
    pricing_type: Optional[PricingType] = None
    price: Optional[Decimal] = Field(None, ge=0)
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    delivery_time_days: Optional[int] = Field(None, ge=1, le=30)
    revision_count: Optional[int] = Field(None, ge=0, le=10)
    thumbnail: Optional[str] = None
    portfolio_images: Optional[str] = None
    status: Optional[ServiceStatus] = None

class ProviderInfo(BaseModel):
    id: int
    full_name: str
    profile_image: Optional[str] = None
    average_rating: float
    total_reviews: int
    
    class Config:
        from_attributes = True

class SkillInfo(BaseModel):
    id: int
    name: str
    slug: str
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class ServiceResponse(BaseModel):
    id: int
    title: str
    description: str
    short_description: Optional[str] = None
    pricing_type: str
    price: Optional[Decimal] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    delivery_time_days: int
    revision_count: int
    status: str
    is_featured: bool
    view_count: int
    order_count: int
    average_rating: float
    total_reviews: int
    thumbnail: Optional[str] = None
    portfolio_images: Optional[str] = None
    provider_id: int
    skill_id: Optional[int] = None
    custom_skill_name: Optional[str] = None
    provider: Optional[ProviderInfo] = None
    skill: Optional[SkillInfo] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ServiceListResponse(BaseModel):
    items: List[ServiceResponse]
    total: int
    page: int
    page_size: int
    pages: int

class ServiceFilter(BaseModel):
    category_id: Optional[int] = None
    skill_id: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    pricing_type: Optional[PricingType] = None
    min_rating: Optional[float] = None
    search: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"

class ServiceVerify(BaseModel):
    status: ServiceStatus
    rejection_reason: Optional[str] = None


# ============ ORDER SCHEMAS ============

class OrderCreate(BaseModel):
    service_id: int
    requirements: str = Field(..., min_length=10, max_length=5000)
    additional_notes: Optional[str] = Field(None, max_length=2000)
    agreed_price: Decimal = Field(..., ge=0)

class OrderUpdate(BaseModel):
    requirements: Optional[str] = Field(None, min_length=10, max_length=5000)
    additional_notes: Optional[str] = Field(None, max_length=2000)

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    rejection_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None

class PaymentUpdate(BaseModel):
    payment_status: PaymentStatus
    payment_method: Optional[str] = Field(None, max_length=50)

class ClientInfo(BaseModel):
    id: int
    full_name: str
    email: str
    profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class OrderProviderInfo(BaseModel):
    id: int
    full_name: str
    email: str
    profile_image: Optional[str] = None
    average_rating: float
    
    class Config:
        from_attributes = True

class ServiceInfo(BaseModel):
    id: int
    title: str
    thumbnail: Optional[str] = None
    
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_number: str
    requirements: str
    additional_notes: Optional[str] = None
    agreed_price: Decimal
    expected_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    status: str
    payment_status: str
    payment_method: Optional[str] = None
    revision_count: int
    max_revisions: int
    rejection_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    client_id: Optional[int] = None
    provider_id: Optional[int] = None
    service_id: Optional[int] = None
    service_title: Optional[str] = None
    client: Optional[ClientInfo] = None
    provider: Optional[OrderProviderInfo] = None
    service: Optional[ServiceInfo] = None
    created_at: datetime
    updated_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============ REVIEW SCHEMAS ============

class ReviewCreate(BaseModel):
    order_id: int
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: Optional[str] = Field(None, max_length=2000)
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    quality_rating: Optional[int] = Field(None, ge=1, le=5)
    delivery_rating: Optional[int] = Field(None, ge=1, le=5)

class ReviewerInfo(BaseModel):
    id: int
    full_name: str
    profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    id: int
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    communication_rating: Optional[int] = None
    quality_rating: Optional[int] = None
    delivery_rating: Optional[int] = None
    provider_response: Optional[str] = None
    response_at: Optional[datetime] = None
    is_visible: bool
    reviewer_id: int
    reviewee_id: int
    service_id: int
    order_id: int
    reviewer: Optional[ReviewerInfo] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewListResponse(BaseModel):
    items: List[ReviewResponse]
    total: int
    page: int
    page_size: int
    pages: int
    average_rating: float

class ProviderResponseCreate(BaseModel):
    provider_response: str = Field(..., min_length=10, max_length=1000)


# ============ CHAT SCHEMAS ============

class ConversationCreate(BaseModel):
    user_id: int
    service_id: Optional[int] = None

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class MessageSenderInfo(BaseModel):
    id: int
    full_name: str
    profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    sender: Optional[MessageSenderInfo] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationUserInfo(BaseModel):
    id: int
    full_name: str
    profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class ConversationServiceInfo(BaseModel):
    id: int
    title: str
    thumbnail: Optional[str] = None
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    other_user: Optional[ConversationUserInfo] = None
    service: Optional[ConversationServiceInfo] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int


# ============ PORTFOLIO SCHEMAS ============

class PortfolioProjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    project_url: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[str] = Field(None, max_length=500)

class PortfolioProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    project_url: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[str] = None
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PortfolioProjectListResponse(BaseModel):
    items: List[PortfolioProjectResponse]
    total: int
