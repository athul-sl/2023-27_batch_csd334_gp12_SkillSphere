"""
Seed script to populate SkillSphere with demo data for the final presentation.
Run:  python seed_demo_data.py
All demo accounts use password: Demo@1234
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Ensure the app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.database import async_session_maker, create_tables, engine
from app.models import (
    User, UserRole, UserStatus,
    Category, Skill,
    ServiceListing, ServiceStatus, PricingType,
    Order, OrderStatus, PaymentStatus,
    Review,
    PortfolioProject,
    Conversation, Message,
)
from app.utils import generate_order_number

# Use bcrypt directly — passlib has a known bug with bcrypt >= 4.1
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ──────────────────────────────────────────────
#  DEMO USERS  (CEC departments only)
# ──────────────────────────────────────────────
DEMO_PASSWORD = "Demo@1234"

DEMO_USERS = [
    {
        "email": "arjun.nair@ceconline.edu",
        "full_name": "Arjun Nair",
        "student_id": "CHN23CS001",
        "department": "CSE",
        "year_of_study": 2026,
        "semester": 6,
        "batch": "C",
        "course_duration": "2022-2026",
        "phone": "9876543210",
        "bio": "Full-stack developer passionate about building scalable web applications. Experienced with React, Node.js, and Python. Love turning ideas into pixel-perfect interfaces.",
    },
    {
        "email": "meera.k@ceconline.edu",
        "full_name": "Meera Krishnan",
        "student_id": "CHN23EC002",
        "department": "ECE",
        "year_of_study": 2026,
        "semester": 6,
        "batch": "A",
        "course_duration": "2022-2026",
        "phone": "9876543211",
        "bio": "Electronics enthusiast specializing in IoT and embedded systems. Skilled in Arduino, Raspberry Pi, and PCB design. Always tinkering with circuits!",
    },
    {
        "email": "rahul.menon@ceconline.edu",
        "full_name": "Rahul Menon",
        "student_id": "CHN23CL003",
        "department": "AI/ML",
        "year_of_study": 2027,
        "semester": 4,
        "batch": "G",
        "course_duration": "2023-2027",
        "phone": "9876543212",
        "bio": "Video editor and motion graphics artist with 3+ years of freelance experience. Proficient in Premiere Pro, After Effects, and DaVinci Resolve.",
    },
    {
        "email": "sneha.t@ceconline.edu",
        "full_name": "Sneha Thomas",
        "student_id": "CHN23EE004",
        "department": "EEE",
        "year_of_study": 2026,
        "semester": 6,
        "batch": "F",
        "course_duration": "2022-2026",
        "phone": "9876543213",
        "bio": "Academic tutor and content writer. I simplify complex topics into easy-to-understand notes. Available for tutoring in Mathematics, Physics, and Technical Writing.",
    },
    {
        "email": "aditya.s@ceconline.edu",
        "full_name": "Aditya Sharma",
        "student_id": "CHN23CS005",
        "department": "CSE",
        "year_of_study": 2027,
        "semester": 4,
        "batch": "D",
        "course_duration": "2023-2027",
        "phone": "9876543214",
        "bio": "UI/UX designer and poster artist. I create stunning visual designs for events, social media, and branding. Figma and Adobe Creative Suite expert.",
    },
    {
        "email": "priya.p@ceconline.edu",
        "full_name": "Priya Pillai",
        "student_id": "CHN23MCA006",
        "department": "MCA",
        "year_of_study": 2026,
        "semester": 4,
        "batch": "A",
        "course_duration": "2024-2026",
        "phone": "9876543215",
        "bio": "Data analyst and Python developer. Experienced with Pandas, NumPy, and data visualization. I also build automation scripts and web scrapers.",
    },
]


# ──────────────────────────────────────────────
#  SERVICES  (2 per user — referenced by user index)
# ──────────────────────────────────────────────
DEMO_SERVICES = [
    # --- User 0: Arjun (CSE) ---
    {
        "user_idx": 0,
        "skill_slug": "web-development",
        "title": "Professional Website Development",
        "description": "I will build a modern, responsive website for your college project or startup idea. Includes clean code, mobile-friendly design, and deployment guidance. Technologies: React, Tailwind CSS, Node.js, PostgreSQL. Perfect for mini-projects, final year projects, or personal portfolios.",
        "short_description": "Modern responsive websites for projects & startups",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("1500"),
        "delivery_time_days": 5,
        "revision_count": 3,
        "view_count": 87,
        "order_count": 6,
        "is_featured": True,
    },
    {
        "user_idx": 0,
        "skill_slug": "mobile-app-development",
        "title": "Cross-Platform Mobile App Development",
        "description": "Get a fully functional mobile application built with React Native. I handle the complete development cycle from UI design to API integration. Great for project demos, hackathons, or personal apps. Includes both Android & iOS builds.",
        "short_description": "React Native apps for Android & iOS",
        "pricing_type": PricingType.NEGOTIABLE,
        "min_price": Decimal("1000"),
        "max_price": Decimal("3000"),
        "delivery_time_days": 7,
        "revision_count": 2,
        "view_count": 54,
        "order_count": 3,
    },
    # --- User 1: Meera (ECE) ---
    {
        "user_idx": 1,
        "skill_slug": "circuit-design",
        "title": "Custom Circuit Design & Simulation",
        "description": "I will design and simulate electronic circuits for your lab projects, mini projects, or final year work. Proficient with Proteus, Multisim, and LTSpice. Deliverables include circuit schematics, simulation output, and a brief report explaining the design.",
        "short_description": "Circuit schematics & simulation for lab/projects",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("800"),
        "delivery_time_days": 3,
        "revision_count": 2,
        "view_count": 62,
        "order_count": 5,
        "is_featured": True,
    },
    {
        "user_idx": 1,
        "skill_slug": "arduino-projects",
        "title": "Arduino & IoT Project Development",
        "description": "Need an Arduino or IoT project for your semester submission? I will build and program microcontroller-based projects with sensor integration, wireless connectivity (WiFi/Bluetooth), and cloud dashboards. Complete with working code and documentation.",
        "short_description": "Arduino/IoT projects with code & documentation",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("1200"),
        "delivery_time_days": 5,
        "revision_count": 2,
        "view_count": 45,
        "order_count": 4,
    },
    # --- User 2: Rahul (AI/ML) ---
    {
        "user_idx": 2,
        "skill_slug": "video-editing",
        "title": "Professional Video Editing & Color Grading",
        "description": "Transform your raw footage into a polished, cinematic masterpiece. I offer professional video editing including cuts, transitions, color grading, sound design, and subtitle addition. Perfect for college fest aftermovies, YouTube videos, event coverage, and promotional content.",
        "short_description": "Cinematic video editing for events & content",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("600"),
        "delivery_time_days": 3,
        "revision_count": 2,
        "view_count": 93,
        "order_count": 8,
        "is_featured": True,
    },
    {
        "user_idx": 2,
        "skill_slug": "animation",
        "title": "2D Motion Graphics & Animated Explainers",
        "description": "I create eye-catching motion graphics and animated explainer videos using After Effects and Blender. Ideal for presentations, social media promos, and college event teasers. Includes custom illustrations and royalty-free background music.",
        "short_description": "Motion graphics & animated explainer videos",
        "pricing_type": PricingType.HOURLY,
        "price": Decimal("300"),
        "delivery_time_days": 5,
        "revision_count": 2,
        "view_count": 38,
        "order_count": 2,
    },
    # --- User 3: Sneha (EEE) ---
    {
        "user_idx": 3,
        "skill_slug": "tutoring",
        "title": "Mathematics & Physics Tutoring Sessions",
        "description": "Struggling with calculus, linear algebra, or engineering physics? I provide clear, step-by-step tutoring sessions tailored to the CEC syllabus. Available for one-on-one sessions or small group study. Includes handwritten notes and practice problem sets.",
        "short_description": "1-on-1 tutoring for Maths & Physics (CEC syllabus)",
        "pricing_type": PricingType.HOURLY,
        "price": Decimal("200"),
        "delivery_time_days": 1,
        "revision_count": 0,
        "view_count": 110,
        "order_count": 12,
        "is_featured": True,
    },
    {
        "user_idx": 3,
        "skill_slug": "content-writing",
        "title": "Technical Report & Content Writing",
        "description": "Need a well-structured lab report, seminar report, or technical paper? I write clear, plagiarism-free content with proper formatting and references. Also available for blog posts, event descriptions, and social media content for college clubs.",
        "short_description": "Lab reports, seminar reports & technical writing",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("400"),
        "delivery_time_days": 2,
        "revision_count": 3,
        "view_count": 74,
        "order_count": 7,
    },
    # --- User 4: Aditya (CSE) ---
    {
        "user_idx": 4,
        "skill_slug": "poster-design",
        "title": "Event Poster & Social Media Graphics",
        "description": "I design vibrant, attention-grabbing posters for college events, workshops, and tech fests. Each design is custom-made to match your event's theme and branding. Deliverables include print-ready PDF and social media-optimized sizes. Designed in Figma & Illustrator.",
        "short_description": "Custom event posters & social media graphics",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("350"),
        "delivery_time_days": 2,
        "revision_count": 3,
        "view_count": 128,
        "order_count": 15,
        "is_featured": True,
    },
    {
        "user_idx": 4,
        "skill_slug": "ui-ux-design",
        "title": "UI/UX Design & Figma Prototyping",
        "description": "Get a complete UI/UX design for your web or mobile app project. I create wireframes, high-fidelity mockups, and interactive Figma prototypes. Includes user flow diagrams and a design system with reusable components. Perfect for final year project presentations.",
        "short_description": "Figma wireframes, mockups & interactive prototypes",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("1000"),
        "delivery_time_days": 4,
        "revision_count": 2,
        "view_count": 67,
        "order_count": 4,
    },
    # --- User 5: Priya (MCA) ---
    {
        "user_idx": 5,
        "skill_slug": "data-entry",
        "title": "Data Analysis & Visualization Reports",
        "description": "I provide comprehensive data analysis using Python (Pandas, Matplotlib, Seaborn) or Excel. Whether it's survey data for your project, experimental results, or any dataset — I'll clean, analyze, and create beautiful visualizations with actionable insights.",
        "short_description": "Python-based data analysis & visualization",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("500"),
        "delivery_time_days": 3,
        "revision_count": 2,
        "view_count": 56,
        "order_count": 5,
    },
    {
        "user_idx": 5,
        "skill_slug": "excel-spreadsheets",
        "title": "Excel Automation & Dashboard Creation",
        "description": "Tired of repetitive spreadsheet tasks? I build automated Excel solutions with VBA macros, pivot tables, dynamic charts, and interactive dashboards. Also available for Google Sheets automation using Apps Script. Great for clubs, departments, and event management.",
        "short_description": "Excel/Sheets automation, VBA macros & dashboards",
        "pricing_type": PricingType.FIXED,
        "price": Decimal("450"),
        "delivery_time_days": 2,
        "revision_count": 2,
        "view_count": 41,
        "order_count": 3,
    },
]


# ──────────────────────────────────────────────
#  PORTFOLIO PROJECTS  (2 per user)
# ──────────────────────────────────────────────
DEMO_PORTFOLIOS = [
    # Arjun
    {"user_idx": 0, "title": "College Event Management Portal", "description": "A full-stack web app built with React and FastAPI for managing college events, registrations, and ticketing. Features include QR-based check-in, real-time attendee tracking, and an admin dashboard.", "project_url": "https://github.com/arjun-nair/event-portal", "tags": "React,FastAPI,PostgreSQL,Full-Stack"},
    {"user_idx": 0, "title": "SkillSphere — Campus Marketplace", "description": "Contributed to the development of SkillSphere, a peer-to-peer skill exchange platform for CEC students. Worked on the frontend dashboard and service listing components.", "project_url": "https://github.com/cec-skillsphere", "tags": "React,FastAPI,Team Project,UI/UX"},
    # Meera
    {"user_idx": 1, "title": "Smart Irrigation System using IoT", "description": "Designed and built an automated irrigation system using Arduino, soil moisture sensors, and ESP8266 WiFi module. Data is logged to a cloud dashboard for remote monitoring.", "project_url": "https://github.com/meera-k/smart-irrigation", "tags": "Arduino,IoT,ESP8266,Embedded Systems"},
    {"user_idx": 1, "title": "4-Layer PCB for Audio Amplifier", "description": "Designed a custom 4-layer PCB for a Class-D audio amplifier using KiCad. Includes power supply regulation, input filtering, and output stage. Fabricated and tested successfully.", "tags": "PCB Design,KiCad,Electronics,Audio"},
    # Rahul
    {"user_idx": 2, "title": "CEC TechFest 2025 — Aftermovie", "description": "Edited the official aftermovie for CEC's annual technical festival. Shot and edited over 4 hours of footage into a 5-minute cinematic recap using Premiere Pro and After Effects.", "project_url": "https://youtube.com/watch?v=demo123", "tags": "Video Editing,Premiere Pro,After Effects,Event Coverage"},
    {"user_idx": 2, "title": "Animated Explainer — How Blockchain Works", "description": "Created a 3-minute animated explainer video about blockchain technology for a college seminar. Used After Effects with custom illustrations and voiceover.", "project_url": "https://youtube.com/watch?v=demo456", "tags": "Animation,Motion Graphics,After Effects,Explainer"},
    # Sneha
    {"user_idx": 3, "title": "Engineering Mathematics Study Notes", "description": "Compiled comprehensive handwritten-style digital notes for Engineering Mathematics (Semesters 1–4) covering Calculus, Linear Algebra, Probability, and Complex Analysis. Used by 200+ CEC students.", "tags": "Mathematics,Study Notes,Tutoring,Academic"},
    {"user_idx": 3, "title": "CEC Coding Club — Blog Series", "description": "Authored a 10-part blog series for the CEC Coding Club covering topics from Git basics to REST API design. Each post includes code examples and practice exercises.", "project_url": "https://medium.com/@sneha-thomas", "tags": "Technical Writing,Blog,Coding,Content"},
    # Aditya
    {"user_idx": 4, "title": "CEC Hackathon 2025 — Brand Identity", "description": "Designed the complete brand identity for CEC's inter-college hackathon including logo, poster series, social media kit, ID badges, and event banners. Created in Figma and Illustrator.", "tags": "Graphic Design,Branding,Figma,Illustrator"},
    {"user_idx": 4, "title": "Food Delivery App — UI/UX Case Study", "description": "A complete UI/UX case study for a campus food delivery app. Includes user research, persona creation, wireframes, high-fidelity mockups, and an interactive Figma prototype with 40+ screens.", "project_url": "https://figma.com/file/demo789", "tags": "UI/UX,Figma,Case Study,Mobile Design"},
    # Priya
    {"user_idx": 5, "title": "CEC Placement Statistics Dashboard", "description": "Built an interactive data visualization dashboard using Python (Streamlit, Plotly) analyzing 5 years of CEC placement data. Features filters by department, year, and company.", "project_url": "https://github.com/priya-p/placement-dashboard", "tags": "Data Analysis,Python,Streamlit,Visualization"},
    {"user_idx": 5, "title": "Automated Attendance Report Generator", "description": "Developed a Python script that reads attendance CSV exports, generates department-wise summaries, and emails formatted PDF reports to HODs automatically using schedule + smtplib.", "project_url": "https://github.com/priya-p/attendance-automation", "tags": "Python,Automation,Pandas,PDF Generation"},
]


# ──────────────────────────────────────────────
#  ORDERS (client_idx → provider_idx via service_idx)
# ──────────────────────────────────────────────
DEMO_ORDERS = [
    # client_idx, service_idx (in DEMO_SERVICES), requirements, agreed_price, days_ago_created, status
    {"client_idx": 3, "service_idx": 0, "requirements": "Need a portfolio website for my final year project. Should have sections for About Me, Projects, Skills, and Contact. Dark theme preferred.", "agreed_price": Decimal("1500"), "days_ago": 25, "status": OrderStatus.COMPLETED},
    {"client_idx": 5, "service_idx": 2, "requirements": "Need a circuit design for a temperature monitoring system using LM35 sensor and Arduino. Include Proteus simulation files.", "agreed_price": Decimal("800"), "days_ago": 20, "status": OrderStatus.COMPLETED},
    {"client_idx": 0, "service_idx": 4, "requirements": "Edit our college club's annual day video. Raw footage is about 2 hours. Need a 10-minute highlight reel with music and subtitles.", "agreed_price": Decimal("600"), "days_ago": 18, "status": OrderStatus.COMPLETED},
    {"client_idx": 1, "service_idx": 6, "requirements": "Need tutoring for Engineering Mathematics — specifically Laplace transforms and Fourier series. 3 sessions of 1.5 hours each.", "agreed_price": Decimal("900"), "days_ago": 15, "status": OrderStatus.COMPLETED},
    {"client_idx": 2, "service_idx": 8, "requirements": "Design a poster for our AI/ML workshop event. Theme: futuristic, neon blue/purple palette. Need both print (A3) and Instagram story sizes.", "agreed_price": Decimal("350"), "days_ago": 12, "status": OrderStatus.COMPLETED},
    {"client_idx": 4, "service_idx": 10, "requirements": "Analyze survey data from our department feedback form (150 responses). Need charts for each question and a summary report.", "agreed_price": Decimal("500"), "days_ago": 10, "status": OrderStatus.COMPLETED},
    {"client_idx": 5, "service_idx": 1, "requirements": "Build a simple React Native expense tracker app with categories, charts, and local storage. For my MCA project demo.", "agreed_price": Decimal("2000"), "days_ago": 8, "status": OrderStatus.IN_PROGRESS},
    {"client_idx": 0, "service_idx": 9, "requirements": "Need UI/UX design for a library management system. Should include book search, issue/return, and admin panel screens. Around 15 screens total.", "agreed_price": Decimal("1000"), "days_ago": 5, "status": OrderStatus.ACCEPTED},
]

# Reviews for completed orders (order_idx 0–5)
DEMO_REVIEWS = [
    {"order_idx": 0, "rating": 5, "title": "Absolutely stunning website!", "comment": "Arjun delivered an amazing portfolio website. The design was exactly what I wanted — clean, modern, and responsive. He even added a nice animation on the landing page. Highly recommended!", "communication_rating": 5, "quality_rating": 5, "delivery_rating": 5, "provider_response": "Thank you Sneha! It was great working with you. Glad you loved the animations!"},
    {"order_idx": 1, "rating": 5, "title": "Perfect circuit design", "comment": "Meera's circuit design was spot-on. The Proteus simulation worked flawlessly and the documentation was very detailed. Submitted my project with confidence!", "communication_rating": 5, "quality_rating": 5, "delivery_rating": 4, "provider_response": "Thanks Priya! Happy to hear your project went well. Feel free to reach out for future circuits!"},
    {"order_idx": 2, "rating": 4, "title": "Great video editing work", "comment": "Rahul did a fantastic job with our annual day video. The color grading was beautiful and the pace was perfect. Only minor feedback — couple of audio transitions could have been smoother.", "communication_rating": 5, "quality_rating": 4, "delivery_rating": 4, "provider_response": "Thanks for the feedback Arjun! I'll keep the audio transitions in mind for next time."},
    {"order_idx": 3, "rating": 5, "title": "Best tutor on campus!", "comment": "Sneha is an incredible tutor. She explained Laplace transforms so clearly that I actually started enjoying the subject. Her handwritten notes are gold. Wish I found her earlier!", "communication_rating": 5, "quality_rating": 5, "delivery_rating": 5, "provider_response": "Thank you so much Meera! Your dedication during the sessions really helped. All the best for exams!"},
    {"order_idx": 4, "rating": 5, "title": "Eye-catching poster design", "comment": "Aditya nailed the futuristic theme perfectly. The neon colors looked amazing on print and on Instagram. Got so many compliments at the event. Will definitely order again!", "communication_rating": 5, "quality_rating": 5, "delivery_rating": 5, "provider_response": "Thanks Rahul! The AI/ML workshop theme was fun to work on. Looking forward to designing more for your events!"},
    {"order_idx": 5, "rating": 4, "title": "Detailed and insightful analysis", "comment": "Priya delivered a thorough analysis with great visualizations. The charts were clear and presentation-ready. Minor delay but the quality made up for it.", "communication_rating": 4, "quality_rating": 5, "delivery_rating": 3, "provider_response": "Thanks Aditya! Sorry about the slight delay — the data cleaning took longer than expected. Glad the visualizations were useful!"},
]


# ──────────────────────────────────────────────
#  CONVERSATIONS
# ──────────────────────────────────────────────
DEMO_CONVERSATIONS = [
    {
        "user1_idx": 3, "user2_idx": 0, "service_idx": 0,
        "messages": [
            (3, "Hi Arjun! I saw your website development service. Can you build a portfolio site for my final year project?"),
            (0, "Hey Sneha! Yes, absolutely. Could you share some details about what sections you need and any design preferences?"),
            (3, "I need About Me, Projects, Skills, and Contact sections. Dark theme with a clean, minimal look would be great."),
            (0, "Sounds good! I can have a first draft ready in 3 days. I'll use React with a nice dark theme. Let me set up the order."),
            (3, "Perfect, thanks! Looking forward to it 😊"),
        ],
    },
    {
        "user1_idx": 0, "user2_idx": 2, "service_idx": 4,
        "messages": [
            (0, "Hey Rahul! Our college club needs a highlight reel from the annual day. Are you available?"),
            (2, "Hi Arjun! Yes, I'd love to work on it. How much raw footage do you have?"),
            (0, "About 2 hours. We need a 10-minute video with music, some text overlays, and subtitles for the speeches."),
            (2, "Got it. I can deliver in 3 days. I'll add color grading and smooth transitions. Want any specific music style?"),
            (0, "Something upbeat and energetic would be perfect. Go ahead and place the order!"),
            (2, "Done! I'll share a first cut in 2 days for your feedback."),
        ],
    },
    {
        "user1_idx": 2, "user2_idx": 4, "service_idx": 8,
        "messages": [
            (2, "Hi Aditya! We're organizing an AI/ML workshop at CEC. Can you design a poster for it?"),
            (4, "Hey Rahul! Sure thing. What's the theme and when is the deadline?"),
            (2, "Futuristic, neon blue/purple palette. We need it in 2 days — both A3 print and Instagram story sizes."),
            (4, "That's a cool theme! I'll start on it today. Any specific details like date, venue, or speaker names to include?"),
            (2, "I'll share all the details in the order description. Thanks!"),
        ],
    },
    {
        "user1_idx": 4, "user2_idx": 5, "service_idx": 10,
        "messages": [
            (4, "Hi Priya! I need help analyzing survey data from our department feedback form. Can you help?"),
            (5, "Hey Aditya! Of course. How many responses and what kind of questions are there?"),
            (4, "About 150 responses. Mix of rating scales and open-ended text. I need charts and a summary report."),
            (5, "Perfect. I'll use Python with Matplotlib and create a clean PDF report. Should take about 3 days."),
            (4, "Sounds great! Placing the order now."),
        ],
    },
]


# ══════════════════════════════════════════════
#  MAIN SEED FUNCTION
# ══════════════════════════════════════════════
async def seed():
    await create_tables()

    async with async_session_maker() as session:
        # ── Check idempotency ──
        result = await session.execute(
            select(User).where(User.email == DEMO_USERS[0]["email"])
        )
        if result.scalar_one_or_none():
            print("⚠️  Demo data already exists (found arjun.nair@ceconline.edu). Skipping seed.")
            return

        print("🌱 Seeding demo data...")

        # ── 1. Create users ──
        hashed_pw = hash_password(DEMO_PASSWORD)
        users = []
        for u in DEMO_USERS:
            user = User(
                **u,
                hashed_password=hashed_pw,
                role=UserRole.STUDENT,
                status=UserStatus.ACTIVE,
                is_verified=True,
            )
            session.add(user)
            users.append(user)
        await session.flush()  # get IDs
        print(f"   ✅ Created {len(users)} demo users")

        # ── 2. Build skill slug → skill id map ──
        result = await session.execute(select(Skill))
        all_skills = result.scalars().all()
        skill_map = {s.slug: s.id for s in all_skills}

        # ── 3. Create services ──
        services = []
        for svc_data in DEMO_SERVICES:
            user_idx = svc_data.pop("user_idx")
            skill_slug = svc_data.pop("skill_slug")
            svc = ServiceListing(
                **svc_data,
                provider_id=users[user_idx].id,
                skill_id=skill_map.get(skill_slug),
                status=ServiceStatus.APPROVED,
            )
            session.add(svc)
            services.append(svc)
            # restore popped keys for re-run safety
            svc_data["user_idx"] = user_idx
            svc_data["skill_slug"] = skill_slug
        await session.flush()
        print(f"   ✅ Created {len(services)} service listings")

        # ── 4. Create portfolio projects ──
        for p in DEMO_PORTFOLIOS:
            project = PortfolioProject(
                title=p["title"],
                description=p.get("description"),
                project_url=p.get("project_url"),
                image_url=p.get("image_url"),
                tags=p.get("tags"),
                user_id=users[p["user_idx"]].id,
            )
            session.add(project)
        await session.flush()
        print(f"   ✅ Created {len(DEMO_PORTFOLIOS)} portfolio projects")

        # ── 5. Create orders ──
        orders = []
        now = datetime.utcnow()
        for o in DEMO_ORDERS:
            svc = services[o["service_idx"]]
            client = users[o["client_idx"]]
            provider_idx = DEMO_SERVICES[o["service_idx"]]["user_idx"]
            provider = users[provider_idx]

            created_at = now - timedelta(days=o["days_ago"])
            order = Order(
                order_number=generate_order_number(),
                requirements=o["requirements"],
                agreed_price=o["agreed_price"],
                status=o["status"],
                payment_status=PaymentStatus.PAID if o["status"] in (OrderStatus.COMPLETED, OrderStatus.IN_PROGRESS) else PaymentStatus.PENDING,
                payment_method="UPI" if o["status"] == OrderStatus.COMPLETED else None,
                client_id=client.id,
                provider_id=provider.id,
                service_id=svc.id,
                service_title=svc.title,
                expected_delivery=created_at + timedelta(days=svc.delivery_time_days),
                actual_delivery=created_at + timedelta(days=svc.delivery_time_days - 1) if o["status"] == OrderStatus.COMPLETED else None,
                max_revisions=svc.revision_count,
                created_at=created_at,
                accepted_at=created_at + timedelta(hours=6),
                completed_at=created_at + timedelta(days=svc.delivery_time_days) if o["status"] == OrderStatus.COMPLETED else None,
            )
            session.add(order)
            orders.append(order)
        await session.flush()
        print(f"   ✅ Created {len(orders)} orders")

        # ── 6. Create reviews ──
        for r in DEMO_REVIEWS:
            order = orders[r["order_idx"]]
            review = Review(
                rating=r["rating"],
                title=r["title"],
                comment=r["comment"],
                communication_rating=r["communication_rating"],
                quality_rating=r["quality_rating"],
                delivery_rating=r["delivery_rating"],
                provider_response=r.get("provider_response"),
                response_at=datetime.utcnow() - timedelta(days=1) if r.get("provider_response") else None,
                reviewer_id=order.client_id,
                reviewee_id=order.provider_id,
                service_id=order.service_id,
                order_id=order.id,
            )
            session.add(review)
        await session.flush()
        print(f"   ✅ Created {len(DEMO_REVIEWS)} reviews")

        # ── 7. Update user stats ──
        for i, user in enumerate(users):
            # total_earnings = sum of agreed_price where user is provider & status completed
            earnings = sum(
                o["agreed_price"]
                for oi, o in enumerate(DEMO_ORDERS)
                if DEMO_SERVICES[o["service_idx"]]["user_idx"] == i and o["status"] == OrderStatus.COMPLETED
            )
            # total_spent = sum of agreed_price where user is client & status completed
            spent = sum(
                o["agreed_price"]
                for o in DEMO_ORDERS
                if o["client_idx"] == i and o["status"] == OrderStatus.COMPLETED
            )
            # average_rating from reviews where user is reviewee
            ratings_received = [
                r["rating"]
                for r in DEMO_REVIEWS
                if DEMO_SERVICES[DEMO_ORDERS[r["order_idx"]]["service_idx"]]["user_idx"] == i
            ]
            avg_rating = sum(ratings_received) / len(ratings_received) if ratings_received else 0.0

            user.total_earnings = float(earnings)
            user.total_spent = float(spent)
            user.average_rating = avg_rating
            user.total_reviews = len(ratings_received)
        print("   ✅ Updated user statistics")

        # ── 8. Update service stats ──
        for si, svc in enumerate(services):
            svc_reviews = [
                r for r in DEMO_REVIEWS
                if DEMO_ORDERS[r["order_idx"]]["service_idx"] == si
            ]
            if svc_reviews:
                svc.average_rating = sum(r["rating"] for r in svc_reviews) / len(svc_reviews)
                svc.total_reviews = len(svc_reviews)
        print("   ✅ Updated service statistics")

        # ── 9. Create conversations & messages ──
        for conv_data in DEMO_CONVERSATIONS:
            user1 = users[conv_data["user1_idx"]]
            user2 = users[conv_data["user2_idx"]]
            svc = services[conv_data["service_idx"]]
            conv = Conversation(
                user1_id=user1.id,
                user2_id=user2.id,
                service_id=svc.id,
            )
            session.add(conv)
            await session.flush()

            for msg_idx, (sender_idx, content) in enumerate(conv_data["messages"]):
                msg = Message(
                    conversation_id=conv.id,
                    sender_id=users[sender_idx].id,
                    content=content,
                    is_read=True,
                    created_at=datetime.utcnow() - timedelta(days=20, hours=-msg_idx),
                )
                session.add(msg)
        await session.flush()
        print(f"   ✅ Created {len(DEMO_CONVERSATIONS)} conversations with messages")

        # ── Commit everything ──
        await session.commit()
        print("\n🎉 Demo data seeded successfully!")
        print("━" * 50)
        print("📋 Demo Accounts (password for all: Demo@1234)")
        print("━" * 50)
        for u in DEMO_USERS:
            print(f"   {u['full_name']:<20s}  {u['email']:<30s}  {u['department']}")
        print("━" * 50)


async def main():
    try:
        await seed()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
