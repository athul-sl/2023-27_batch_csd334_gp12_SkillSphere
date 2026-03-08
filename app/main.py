"""FastAPI Application - Simplified Entry Point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import select, text, update
from sqlalchemy.exc import SQLAlchemyError
import logging
import os

from app.config import settings
from app.database import engine, async_session_maker, create_tables
from app.routes import api_router
from app.models import User, UserRole, UserStatus, Category, Skill
from app.utils import (
    get_password_hash, setup_logging,
    AppException, app_exception_handler, validation_exception_handler,
    database_exception_handler, generic_exception_handler
)

# Setup logging
setup_logging(settings.log_level if hasattr(settings, 'log_level') else "INFO")
logger = logging.getLogger(__name__)


# Seed data for categories and skills
SEED_DATA = [
    {"name": "Design", "slug": "design", "description": "Creative and visual design services", "icon": "palette", "color": "#7C3AED",
     "skills": [("Poster Design", "poster-design"), ("Logo Design", "logo-design"), ("UI/UX Design", "ui-ux-design"), ("Presentation Design", "presentation-design")]},
    {"name": "Writing", "slug": "writing", "description": "Content writing and documentation", "icon": "edit", "color": "#2563EB",
     "skills": [("Content Writing", "content-writing"), ("Essay Writing", "essay-writing"), ("Technical Writing", "technical-writing"), ("Copywriting", "copywriting")]},
    {"name": "Academic", "slug": "academic", "description": "Academic help and tutoring", "icon": "book", "color": "#059669",
     "skills": [("Tutoring", "tutoring"), ("Assignment Help", "assignment-help"), ("Lab Reports", "lab-reports"), ("Journal Preparation", "journal-preparation")]},
    {"name": "Technology", "slug": "technology", "description": "Tech and programming services", "icon": "code", "color": "#DC2626",
     "skills": [("Web Development", "web-development"), ("Mobile App Development", "mobile-app-development"), ("Data Entry", "data-entry"), ("Excel/Spreadsheets", "excel-spreadsheets")]},
    {"name": "Media", "slug": "media", "description": "Video and audio production", "icon": "video", "color": "#D97706",
     "skills": [("Video Editing", "video-editing"), ("Photography", "photography"), ("Audio Editing", "audio-editing"), ("Animation", "animation")]},
    {"name": "Electronics", "slug": "electronics", "description": "Electronics and circuit projects", "icon": "cpu", "color": "#8B5CF6",
     "skills": [("Circuit Design", "circuit-design"), ("PCB Design", "pcb-design"), ("Arduino Projects", "arduino-projects"), ("IoT Solutions", "iot-solutions")]},
]


async def init_db():
    """Initialize database with tables and seed data."""
    await create_tables()
    
    async with async_session_maker() as session:
        # Check if admin exists
        result = await session.execute(select(User).where(User.email == settings.admin_email))
        existing_admin = result.scalar_one_or_none()
        if existing_admin:
            # Update admin password to match config using explicit UPDATE
            new_hash = get_password_hash(settings.admin_password)
            await session.execute(
                update(User)
                .where(User.email == settings.admin_email)
                .values(hashed_password=new_hash)
            )
            await session.commit()
            print(f"✅ Database already initialized, admin password synced (email: {settings.admin_email})")
            return
        
        # Create admin user
        admin = User(
            email=settings.admin_email,
            hashed_password=get_password_hash(settings.admin_password),
            full_name="System Admin",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_verified=True
        )
        session.add(admin)
        
        # Create categories and skills
        for cat_data in SEED_DATA:
            skills_list = cat_data.pop("skills")
            category = Category(**cat_data)
            session.add(category)
            await session.flush()
            
            for name, slug in skills_list:
                session.add(Skill(name=name, slug=slug, category_id=category.id))
        
        await session.commit()
        print("✅ Database initialized with admin user and seed data")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("🚀 Starting SkillSphere API...")
    try:
        await init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise
    
    yield
    
    logger.info("👋 Shutting down...")
    await engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="SkillSphere API",
    description="Campus Skill Exchange & Micro-Job Marketplace",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:3001", "http://localhost:3002",
        "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:3001",
        "http://127.0.0.1:3002", "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Serve static files (uploaded images)
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "healthy", "service": "SkillSphere API", "version": "1.0.0"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "error": str(e)})


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {"message": "Welcome to SkillSphere API", "docs": "/docs", "health": "/health"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
