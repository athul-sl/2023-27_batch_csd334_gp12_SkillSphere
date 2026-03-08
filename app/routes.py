"""All API routes combined into a single file."""
from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, delete, update
from sqlalchemy.orm import selectinload
import uuid
import os

from app.database import get_db
from app.models import (
    User, UserRole, UserStatus,
    ServiceListing, ServiceStatus, PricingType,
    Order, OrderStatus, PaymentStatus,
    Review, Category, Skill,
    Conversation, Message,
    PortfolioProject
)
from app.schemas import (
    # User schemas
    UserCreate, UserLogin, UserResponse, UserUpdate, UserListResponse,
    Token, RefreshToken,
    # Skill schemas
    CategoryCreate, CategoryResponse, CategoryListResponse,
    SkillCreate, SkillResponse, SkillListResponse,
    # Service schemas
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceListResponse, ServiceVerify,
    # Order schemas
    OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate, PaymentUpdate,
    # Review schemas
    ReviewCreate, ReviewResponse, ReviewListResponse, ProviderResponseCreate,
    # Chat schemas
    ConversationCreate, MessageCreate, MessageResponse,
    # Portfolio schemas
    PortfolioProjectCreate, PortfolioProjectResponse, PortfolioProjectListResponse,
    ConversationResponse, ConversationListResponse
)
from app.utils import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user, get_admin_user, generate_order_number
)
from app.config import settings


# Create main router
api_router = APIRouter()


# ============ PAGINATION HELPER ============

async def paginate(db: AsyncSession, query, count_query, page: int, page_size: int, order_by=None):
    """Run a paginated query and return (items, total, pages)."""
    total = (await db.execute(count_query)).scalar()
    if order_by is not None:
        query = query.order_by(order_by)
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    return result.scalars().all(), total, pages


# ============ AUTH ROUTES ============

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    result = await db.execute(select(User).where(User.email == user_data.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_data.student_id and user_data.student_id.strip():
        result = await db.execute(select(User).where(User.student_id == user_data.student_id.strip()))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Student ID already registered")
    
    user = User(
        email=user_data.email.lower(),
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        student_id=user_data.student_id.strip() if user_data.student_id and user_data.student_id.strip() else None,
        department=user_data.department.strip() if user_data.department and user_data.department.strip() else None,
        year_of_study=user_data.year_of_study,
        phone=user_data.phone.strip() if user_data.phone and user_data.phone.strip() else None,
        semester=user_data.semester,
        batch=user_data.batch.strip() if user_data.batch and user_data.batch.strip() else None,
        course_duration=user_data.course_duration.strip() if user_data.course_duration and user_data.course_duration.strip() else None,
        status=UserStatus.ACTIVE,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@auth_router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail=f"Account is {user.status.value}")
    
    user.last_login = datetime.utcnow()
    await db.commit()
    
    return Token(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.access_token_expire_minutes * 60
    )

@auth_router.post("/refresh", response_model=Token)
async def refresh_token(token_data: RefreshToken, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    payload = decode_token(token_data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return Token(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.access_token_expire_minutes * 60
    )



# ============ USER ROUTES ============

users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@users_router.put("/me", response_model=UserResponse)
async def update_my_profile(update_data: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@users_router.get("/", response_model=UserListResponse)
async def list_users(page: int = 1, page_size: int = 20, search: str = None, department: str = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(User)
    count_query = select(func.count(User.id))
    
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%"))
        count_query = count_query.where(User.full_name.ilike(f"%{search}%"))
    if department:
        query = query.where(User.department == department)
        count_query = count_query.where(User.department == department)
    
    items, total, pages = await paginate(db, query, count_query, page, page_size, User.created_at.desc())
    return UserListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)


# ============ SKILL/CATEGORY ROUTES ============

skills_router = APIRouter(prefix="/skills", tags=["Skills & Categories"])

@skills_router.get("/categories", response_model=CategoryListResponse)
async def list_categories(include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    query = select(Category).options(selectinload(Category.skills))
    if not include_inactive:
        query = query.where(Category.is_active == True)
    result = await db.execute(query.order_by(Category.display_order, Category.name))
    categories = result.scalars().all()
    return CategoryListResponse(items=categories, total=len(categories))

@skills_router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).options(selectinload(Category.skills)).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@skills_router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(category_data: CategoryCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(Category).where(Category.slug == category_data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category with this slug exists")
    category = Category(**category_data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@skills_router.get("/", response_model=SkillListResponse)
async def list_skills(category_id: int = None, include_inactive: bool = False, db: AsyncSession = Depends(get_db)):
    query = select(Skill)
    if category_id:
        query = query.where(Skill.category_id == category_id)
    if not include_inactive:
        query = query.where(Skill.is_active == True)
    result = await db.execute(query.order_by(Skill.name))
    skills = result.scalars().all()
    return SkillListResponse(items=skills, total=len(skills))

@skills_router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@skills_router.post("/", response_model=SkillResponse, status_code=201)
async def create_skill(skill_data: SkillCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(Category).where(Category.id == skill_data.category_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")
    skill = Skill(**skill_data.model_dump())
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill


# ============ SERVICE ROUTES ============

services_router = APIRouter(prefix="/services", tags=["Services"])

@services_router.get("/", response_model=ServiceListResponse)
async def list_services(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None, skill_id: Optional[int] = None,
    provider_id: Optional[int] = None,
    min_price: Optional[Decimal] = None, max_price: Optional[Decimal] = None,
    pricing_type: Optional[PricingType] = None, min_rating: Optional[float] = None,
    search: Optional[str] = None, sort_by: str = "created_at", sort_order: str = "desc",
    db: AsyncSession = Depends(get_db)
):
    query = select(ServiceListing).options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category)).where(ServiceListing.status == ServiceStatus.APPROVED)
    count_query = select(func.count(ServiceListing.id)).where(ServiceListing.status == ServiceStatus.APPROVED)
    
    if provider_id:
        query = query.where(ServiceListing.provider_id == provider_id)
        count_query = count_query.where(ServiceListing.provider_id == provider_id)
    if category_id:
        query = query.join(Skill).where(Skill.category_id == category_id)
        count_query = count_query.join(Skill).where(Skill.category_id == category_id)
    if skill_id:
        query = query.where(ServiceListing.skill_id == skill_id)
        count_query = count_query.where(ServiceListing.skill_id == skill_id)
    if min_price is not None:
        query = query.where(ServiceListing.price >= min_price)
        count_query = count_query.where(ServiceListing.price >= min_price)
    if max_price is not None:
        query = query.where(ServiceListing.price <= max_price)
        count_query = count_query.where(ServiceListing.price <= max_price)
    if pricing_type:
        query = query.where(ServiceListing.pricing_type == pricing_type)
        count_query = count_query.where(ServiceListing.pricing_type == pricing_type)
    if min_rating is not None:
        query = query.where(ServiceListing.average_rating >= min_rating)
        count_query = count_query.where(ServiceListing.average_rating >= min_rating)
    if search:
        search_filter = or_(ServiceListing.title.ilike(f"%{search}%"), ServiceListing.description.ilike(f"%{search}%"))
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    sort_column = getattr(ServiceListing, sort_by, ServiceListing.created_at)
    order = sort_column.desc() if sort_order == "desc" else sort_column.asc()
    items, total, pages = await paginate(db, query, count_query, page, page_size, order)
    return ServiceListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)

@services_router.get("/my-services", response_model=ServiceListResponse)
async def list_my_services(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: Optional[ServiceStatus] = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(ServiceListing).options(selectinload(ServiceListing.skill).selectinload(Skill.category)).where(ServiceListing.provider_id == current_user.id)
    count_query = select(func.count(ServiceListing.id)).where(ServiceListing.provider_id == current_user.id)
    if status:
        query = query.where(ServiceListing.status == status)
        count_query = count_query.where(ServiceListing.status == status)
    items, total, pages = await paginate(db, query, count_query, page, page_size, ServiceListing.created_at.desc())
    return ServiceListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)

@services_router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ServiceListing).options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category)).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.view_count += 1
    await db.commit()
    return service

@services_router.post("/", response_model=ServiceResponse, status_code=201)
async def create_service(service_data: ServiceCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Treat skill_id of 0 or invalid as None
    if service_data.skill_id is not None and service_data.skill_id <= 0:
        service_data.skill_id = None
    if not service_data.skill_id and not service_data.custom_skill_name:
        raise HTTPException(status_code=400, detail="Either skill_id or custom_skill_name required")
    if service_data.skill_id:
        result = await db.execute(select(Skill).where(Skill.id == service_data.skill_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Skill not found")
    service = ServiceListing(**service_data.model_dump(), provider_id=current_user.id, status=ServiceStatus.APPROVED)
    db.add(service)
    await db.commit()
    # Re-query with full relationship loading (matches GET endpoint pattern)
    result = await db.execute(
        select(ServiceListing)
        .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.id == service.id)
    )
    return result.scalar_one()

@services_router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: int, update_data: ServiceUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.provider_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(service, field, value)
    await db.commit()
    # Re-query with full relationship loading (matches GET endpoint pattern)
    result = await db.execute(
        select(ServiceListing)
        .options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
        .where(ServiceListing.id == service.id)
    )
    return result.scalar_one()

@services_router.delete("/{service_id}", status_code=204)
async def delete_service(service_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.provider_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(service)
    await db.commit()


# ============ ORDER ROUTES ============

orders_router = APIRouter(prefix="/orders", tags=["Orders"])

@orders_router.get("/", response_model=OrderListResponse)
async def list_my_orders(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), role: str = Query("all", regex="^(client|provider|all)$"), order_status: Optional[OrderStatus] = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Order).options(selectinload(Order.client), selectinload(Order.provider), selectinload(Order.service))
    count_query = select(func.count(Order.id))
    
    if role == "client":
        query = query.where(Order.client_id == current_user.id)
        count_query = count_query.where(Order.client_id == current_user.id)
    elif role == "provider":
        query = query.where(Order.provider_id == current_user.id)
        count_query = count_query.where(Order.provider_id == current_user.id)
    else:
        condition = or_(Order.client_id == current_user.id, Order.provider_id == current_user.id)
        query = query.where(condition)
        count_query = count_query.where(condition)
    
    if order_status:
        query = query.where(Order.status == order_status)
        count_query = count_query.where(Order.status == order_status)
    
    items, total, pages = await paginate(db, query, count_query, page, page_size, Order.created_at.desc())
    return OrderListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)

@orders_router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Order).options(selectinload(Order.client), selectinload(Order.provider), selectinload(Order.service)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id and order.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return order

@orders_router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(order_data: OrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == order_data.service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.status != ServiceStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Service not available")
    if service.provider_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot hire your own service")
    
    order = Order(
        order_number=generate_order_number(),
        requirements=order_data.requirements,
        additional_notes=order_data.additional_notes,
        agreed_price=order_data.agreed_price,
        expected_delivery=datetime.utcnow() + timedelta(days=service.delivery_time_days),
        max_revisions=service.revision_count,
        client_id=current_user.id,
        provider_id=service.provider_id,
        service_id=service.id,
        service_title=service.title,
        status=OrderStatus.PENDING
    )
    db.add(order)
    service.order_count += 1
    await db.commit()
    result = await db.execute(select(Order).options(selectinload(Order.client), selectinload(Order.provider), selectinload(Order.service)).where(Order.id == order.id))
    return result.scalar_one()

@orders_router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: int, status_update: OrderStatusUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    is_client = order.client_id == current_user.id
    is_provider = order.provider_id == current_user.id
    if not is_client and not is_provider:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_status = status_update.status
    current_status = order.status
    
    valid_transitions = {
        (OrderStatus.PENDING, OrderStatus.ACCEPTED, True),
        (OrderStatus.PENDING, OrderStatus.REJECTED, True),
        (OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, True),
        (OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED, True),
        (OrderStatus.REVISION, OrderStatus.DELIVERED, True),
        (OrderStatus.DELIVERED, OrderStatus.COMPLETED, False),
        (OrderStatus.DELIVERED, OrderStatus.REVISION, False),
    }
    
    if new_status == OrderStatus.CANCELLED:
        if current_status == OrderStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Cannot cancel completed order")
        order.cancellation_reason = status_update.cancellation_reason
    elif (current_status, new_status, is_provider) not in valid_transitions:
        raise HTTPException(status_code=400, detail=f"Invalid transition {current_status.value} -> {new_status.value}")
    
    order.status = new_status
    if new_status == OrderStatus.ACCEPTED:
        order.accepted_at = datetime.utcnow()
    elif new_status == OrderStatus.REJECTED:
        order.rejection_reason = status_update.rejection_reason
    elif new_status == OrderStatus.DELIVERED:
        order.actual_delivery = datetime.utcnow()
    elif new_status == OrderStatus.COMPLETED:
        order.completed_at = datetime.utcnow()
        provider = (await db.execute(select(User).where(User.id == order.provider_id))).scalar_one()
        provider.total_earnings += float(order.agreed_price)
        client = (await db.execute(select(User).where(User.id == order.client_id))).scalar_one()
        client.total_spent += float(order.agreed_price)
    elif new_status == OrderStatus.REVISION:
        order.revision_count += 1
    
    await db.commit()
    await db.refresh(order, ["client", "provider", "service"])
    return order

@orders_router.put("/{order_id}/payment", response_model=OrderResponse)
async def update_payment(order_id: int, payment_update: PaymentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only provider can update payment")
    order.payment_status = payment_update.payment_status
    order.payment_method = payment_update.payment_method
    await db.commit()
    await db.refresh(order, ["client", "provider", "service"])
    return order


# ============ REVIEW ROUTES ============

reviews_router = APIRouter(prefix="/reviews", tags=["Reviews"])

@reviews_router.get("/service/{service_id}", response_model=ReviewListResponse)
async def list_service_reviews(service_id: int, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    query = select(Review).options(selectinload(Review.reviewer)).where(Review.service_id == service_id, Review.is_visible == True)
    count_query = select(func.count(Review.id)).where(Review.service_id == service_id, Review.is_visible == True)
    avg_result = await db.execute(select(func.avg(Review.rating)).where(Review.service_id == service_id, Review.is_visible == True))
    avg_rating = avg_result.scalar() or 0
    items, total, pages = await paginate(db, query, count_query, page, page_size, Review.created_at.desc())
    return ReviewListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages, average_rating=float(avg_rating))

@reviews_router.get("/user/{user_id}", response_model=ReviewListResponse)
async def list_user_reviews(user_id: int, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    query = select(Review).options(selectinload(Review.reviewer)).where(Review.reviewee_id == user_id, Review.is_visible == True)
    count_query = select(func.count(Review.id)).where(Review.reviewee_id == user_id, Review.is_visible == True)
    avg_result = await db.execute(select(func.avg(Review.rating)).where(Review.reviewee_id == user_id, Review.is_visible == True))
    avg_rating = avg_result.scalar() or 0
    items, total, pages = await paginate(db, query, count_query, page, page_size, Review.created_at.desc())
    return ReviewListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages, average_rating=float(avg_rating))

@reviews_router.post("/", response_model=ReviewResponse, status_code=201)
async def create_review(review_data: ReviewCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Order).where(Order.id == review_data.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only client can review")
    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed orders")
    existing = await db.execute(select(Review).where(Review.order_id == order.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already reviewed")
    
    review = Review(
        rating=review_data.rating, title=review_data.title, comment=review_data.comment,
        communication_rating=review_data.communication_rating, quality_rating=review_data.quality_rating,
        delivery_rating=review_data.delivery_rating, reviewer_id=current_user.id,
        reviewee_id=order.provider_id, service_id=order.service_id, order_id=order.id
    )
    db.add(review)
    
    # Update service ratings
    service = (await db.execute(select(ServiceListing).where(ServiceListing.id == order.service_id))).scalar_one()
    rating_result = await db.execute(select(func.avg(Review.rating), func.count(Review.id)).where(Review.service_id == order.service_id, Review.is_visible == True))
    avg_rating, review_count = rating_result.one()
    service.average_rating = float(avg_rating) if avg_rating else review_data.rating
    service.total_reviews = review_count + 1
    
    # Update provider ratings
    provider = (await db.execute(select(User).where(User.id == order.provider_id))).scalar_one()
    provider_result = await db.execute(select(func.avg(Review.rating), func.count(Review.id)).where(Review.reviewee_id == order.provider_id, Review.is_visible == True))
    provider_avg, provider_count = provider_result.one()
    provider.average_rating = float(provider_avg) if provider_avg else review_data.rating
    provider.total_reviews = provider_count + 1
    
    await db.commit()
    await db.refresh(review, ["reviewer"])
    return review

@reviews_router.post("/{review_id}/response", response_model=ReviewResponse)
async def add_provider_response(review_id: int, response_data: ProviderResponseCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only provider can respond")
    if review.provider_response:
        raise HTTPException(status_code=400, detail="Already responded")
    review.provider_response = response_data.provider_response
    review.response_at = datetime.utcnow()
    await db.commit()
    await db.refresh(review, ["reviewer"])
    return review


# ============ ADMIN ROUTES ============

admin_router = APIRouter(prefix="/admin", tags=["Admin"])

@admin_router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    pending_services = (await db.execute(select(func.count(ServiceListing.id)).where(ServiceListing.status == ServiceStatus.PENDING))).scalar()
    total_services = (await db.execute(select(func.count(ServiceListing.id)))).scalar()
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar()
    total_revenue = (await db.execute(select(func.sum(Order.agreed_price)).where(Order.status == "completed"))).scalar() or 0
    return {"total_users": total_users, "pending_services": pending_services, "total_services": total_services, "total_orders": total_orders, "total_revenue": float(total_revenue)}

@admin_router.get("/users", response_model=UserListResponse)
async def list_all_users(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), user_status: Optional[UserStatus] = None, role: Optional[UserRole] = None, search: Optional[str] = None, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    query = select(User)
    count_query = select(func.count(User.id))
    if user_status:
        query = query.where(User.status == user_status)
        count_query = count_query.where(User.status == user_status)
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
        count_query = count_query.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    items, total, pages = await paginate(db, query, count_query, page, page_size, User.created_at.desc())
    return UserListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)

@admin_router.put("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(user_id: int, new_status: UserStatus = Query(...), db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change own status")
    user.status = new_status
    await db.commit()
    await db.refresh(user)
    return user

@admin_router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(user_id: int, new_role: UserRole = Query(...), db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return user

@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    # Delete reviews (no need to preserve)
    await db.execute(delete(Review).where((Review.reviewer_id == user_id) | (Review.reviewee_id == user_id)))
    # Preserve order history by nullifying user references
    await db.execute(update(Order).where(Order.client_id == user_id).values(client_id=None))
    await db.execute(update(Order).where(Order.provider_id == user_id).values(provider_id=None))
    # Delete services
    await db.execute(delete(ServiceListing).where(ServiceListing.provider_id == user_id))
    await db.delete(user)
    await db.commit()
    return {"message": f"User {user.full_name} deleted successfully"}

@admin_router.get("/services", response_model=ServiceListResponse)
async def list_all_services(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: Optional[str] = None, status: Optional[ServiceStatus] = None, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    query = select(ServiceListing).options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category))
    count_query = select(func.count(ServiceListing.id))
    if status:
        query = query.where(ServiceListing.status == status)
        count_query = count_query.where(ServiceListing.status == status)
    if search:
        query = query.where(ServiceListing.title.ilike(f"%{search}%"))
        count_query = count_query.where(ServiceListing.title.ilike(f"%{search}%"))
    items, total, pages = await paginate(db, query, count_query, page, page_size, ServiceListing.created_at.desc())
    return ServiceListResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)

@admin_router.delete("/services/{service_id}")
async def admin_delete_service(service_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(ServiceListing).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    title = service.title
    await db.execute(delete(Review).where(Review.service_id == service_id))
    await db.execute(update(Order).where(Order.service_id == service_id).values(service_id=None))
    await db.delete(service)
    await db.commit()
    return {"message": f"Service '{title}' deleted successfully"}

@admin_router.put("/services/{service_id}/verify", response_model=ServiceResponse)
async def verify_service(service_id: int, verification: ServiceVerify, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(ServiceListing).options(selectinload(ServiceListing.provider), selectinload(ServiceListing.skill).selectinload(Skill.category)).where(ServiceListing.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if verification.status not in [ServiceStatus.APPROVED, ServiceStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Can only approve or reject")
    if verification.status == ServiceStatus.REJECTED and not verification.rejection_reason:
        raise HTTPException(status_code=400, detail="Rejection reason required")
    service.status = verification.status
    service.approved_by = admin.id
    service.approved_at = datetime.utcnow()
    if verification.status == ServiceStatus.REJECTED:
        service.rejection_reason = verification.rejection_reason
    await db.commit()
    await db.refresh(service, ["provider", "skill"])
    return service

@admin_router.get("/reviews/flagged")
async def list_flagged_reviews(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    query = select(Review).options(selectinload(Review.reviewer)).where(Review.is_flagged == True)
    total = (await db.execute(select(func.count(Review.id)).where(Review.is_flagged == True))).scalar()
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size).order_by(Review.created_at.desc()))
    return {"items": result.scalars().all(), "total": total, "page": page, "page_size": page_size}

@admin_router.put("/reviews/{review_id}/visibility")
async def toggle_review_visibility(review_id: int, is_visible: bool, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_visible = is_visible
    review.is_flagged = False
    await db.commit()
    return {"message": f"Review visibility set to {is_visible}"}


# ============ CHAT ROUTES ============

chat_router = APIRouter(prefix="/chat", tags=["Chat"])

@chat_router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all conversations for the current user, sorted by last activity. Only shows conversations with at least one message."""
    query = select(Conversation).options(
        selectinload(Conversation.user1),
        selectinload(Conversation.user2),
        selectinload(Conversation.service),
        selectinload(Conversation.messages).selectinload(Message.sender)
    ).where(
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    ).order_by(Conversation.updated_at.desc())
    
    result = await db.execute(query)
    conversations = result.scalars().all()
    
    items = []
    for conv in conversations:
        # Skip conversations with no messages (don't show empty chats)
        if not conv.messages:
            continue
        other_user = conv.user2 if conv.user1_id == current_user.id else conv.user1
        last_message = conv.messages[-1] if conv.messages else None
        unread_count = sum(1 for m in conv.messages if not m.is_read and m.sender_id != current_user.id)
        
        items.append(ConversationResponse(
            id=conv.id,
            other_user={"id": other_user.id, "full_name": other_user.full_name, "profile_image": other_user.profile_image} if other_user else None,
            service={"id": conv.service.id, "title": conv.service.title, "thumbnail": conv.service.thumbnail} if conv.service else None,
            last_message=MessageResponse(
                id=last_message.id, conversation_id=last_message.conversation_id,
                sender_id=last_message.sender_id, content=last_message.content,
                is_read=last_message.is_read,
                sender={"id": last_message.sender.id, "full_name": last_message.sender.full_name, "profile_image": last_message.sender.profile_image} if last_message.sender else None,
                created_at=last_message.created_at
            ) if last_message else None,
            unread_count=unread_count,
            created_at=conv.created_at,
            updated_at=conv.updated_at
        ))
    
    return ConversationListResponse(items=items, total=len(items))

@chat_router.post("/conversations", response_model=ConversationResponse)
async def create_or_get_conversation(data: ConversationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Start a new conversation or return existing one."""
    if data.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start conversation with yourself")
    
    # Check target user exists
    target = (await db.execute(select(User).where(User.id == data.user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Look for ANY existing conversation between these two users (one conversation per pair)
    existing_query = select(Conversation).where(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == data.user_id),
            and_(Conversation.user1_id == data.user_id, Conversation.user2_id == current_user.id)
        )
    )
    
    existing_query = existing_query.options(
        selectinload(Conversation.user1),
        selectinload(Conversation.user2),
        selectinload(Conversation.service),
        selectinload(Conversation.messages).selectinload(Message.sender)
    )
    result = await db.execute(existing_query)
    conv = result.scalar_one_or_none()
    
    if not conv:
        conv = Conversation(user1_id=current_user.id, user2_id=data.user_id, service_id=data.service_id)
        db.add(conv)
        await db.commit()
        # Reload with relationships
        result = await db.execute(
            select(Conversation).options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
                selectinload(Conversation.service),
                selectinload(Conversation.messages).selectinload(Message.sender)
            ).where(Conversation.id == conv.id)
        )
        conv = result.scalar_one()
    
    other_user = conv.user2 if conv.user1_id == current_user.id else conv.user1
    last_message = conv.messages[-1] if conv.messages else None
    unread_count = sum(1 for m in conv.messages if not m.is_read and m.sender_id != current_user.id)
    
    return ConversationResponse(
        id=conv.id,
        other_user={"id": other_user.id, "full_name": other_user.full_name, "profile_image": other_user.profile_image} if other_user else None,
        service={"id": conv.service.id, "title": conv.service.title, "thumbnail": conv.service.thumbnail} if conv.service else None,
        last_message=MessageResponse(
            id=last_message.id, conversation_id=last_message.conversation_id,
            sender_id=last_message.sender_id, content=last_message.content,
            is_read=last_message.is_read,
            sender={"id": last_message.sender.id, "full_name": last_message.sender.full_name, "profile_image": last_message.sender.profile_image} if last_message.sender else None,
            created_at=last_message.created_at
        ) if last_message else None,
        unread_count=unread_count,
        created_at=conv.created_at,
        updated_at=conv.updated_at
    )

@chat_router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(conversation_id: int, page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=100), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get messages for a conversation."""
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = select(Message).options(selectinload(Message.sender)).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    messages = list(reversed(result.scalars().all()))  # Reverse to get chronological order
    return messages

@chat_router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(conversation_id: int, msg_data: MessageCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Send a message in a conversation."""
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=msg_data.content
    )
    db.add(message)
    conv.updated_at = datetime.utcnow()
    await db.commit()
    
    result = await db.execute(select(Message).options(selectinload(Message.sender)).where(Message.id == message.id))
    return result.scalar_one()

@chat_router.put("/conversations/{conversation_id}/read")
async def mark_as_read(conversation_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Mark all messages in a conversation as read."""
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.execute(
        update(Message)
        .where(Message.conversation_id == conversation_id, Message.sender_id != current_user.id, Message.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "Messages marked as read"}

@chat_router.get("/unread-count")
async def get_unread_count(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get total unread message count for the current user."""
    # Get all conversation IDs the user is part of
    conv_query = select(Conversation.id).where(
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    )
    count = (await db.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id.in_(conv_query),
            Message.sender_id != current_user.id,
            Message.is_read == False
        )
    )).scalar()
    return {"unread_count": count or 0}


# ============ PORTFOLIO ROUTES ============

portfolio_router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@portfolio_router.get("/user/{user_id}", response_model=PortfolioProjectListResponse)
async def list_user_portfolio(user_id: int, db: AsyncSession = Depends(get_db)):
    """List all portfolio projects for a user."""
    result = await db.execute(
        select(PortfolioProject)
        .where(PortfolioProject.user_id == user_id)
        .order_by(PortfolioProject.created_at.desc())
    )
    items = result.scalars().all()
    return PortfolioProjectListResponse(items=items, total=len(items))

@portfolio_router.post("/", response_model=PortfolioProjectResponse, status_code=201)
async def create_portfolio_project(
    project_data: PortfolioProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a portfolio project."""
    project = PortfolioProject(**project_data.model_dump(), user_id=current_user.id)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

@portfolio_router.delete("/{project_id}", status_code=204)
async def delete_portfolio_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete own portfolio project."""
    result = await db.execute(
        select(PortfolioProject).where(PortfolioProject.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(project)
    await db.commit()


# ============ UPLOAD ROUTES ============

upload_router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@upload_router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image file. Returns the URL to access it."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, and WebP images are allowed")
    
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")
    
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return {"url": f"/static/uploads/{unique_name}", "filename": unique_name}


# Register all routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(skills_router)
api_router.include_router(services_router)
api_router.include_router(orders_router)
api_router.include_router(reviews_router)
api_router.include_router(admin_router)
api_router.include_router(chat_router)
api_router.include_router(portfolio_router)
api_router.include_router(upload_router)
