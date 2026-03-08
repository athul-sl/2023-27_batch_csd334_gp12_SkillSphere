# SkillSphere - Campus Skill Exchange Marketplace

A production-ready, campus-restricted platform enabling students at **@ceconline.edu** to offer and hire micro-services within their college ecosystem.

## 🚀 Features

- **Student Registration** with college email validation (@ceconline.edu)
- **JWT Authentication** with secure token refresh
- **Service Listings** with categories, pricing, and reviews
- **Order Management** with status tracking and payment confirmation
- **Rating & Review System** with 5-star ratings
- **Admin Moderation** for service approval and user management
- **Responsive React UI** with TailwindCSS
- **RESTful APIs** with FastAPI
- **PostgreSQL Database** with SQLAlchemy ORM
- **Docker Support** for easy deployment

## 📋 Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Docker** and Docker Compose (recommended)
- **PostgreSQL 15** (if not using Docker)

## 🏗️ Tech Stack

### Backend
- **FastAPI** 0.109+ - Async REST API framework
- **PostgreSQL** 15 - Primary database
- **SQLAlchemy** 2.0 - ORM
- **Alembic** - Database migrations
- **JWT** - Authentication
- **Pydantic** v2 - Data validation
- **pytest** - Testing

### Frontend
- **React** 18 - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client

## 🐳 Quick Start with Docker

### 1. Clone and Setup

```bash
cd /Users/apple/Desktop/project

# Copy environment file
cp .env.example .env

# Update .env with your settings if needed
```

### 2. Start Backend

```bash
# Build and start all services
docker-compose up --build

# Access the API at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access the app at http://localhost:3000
```

## 💻 Manual Setup (Without Docker)

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Mac/Linux
# or
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL database
# Update DATABASE_URL in .env with your credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /api/v1/auth/register` | Register new user |
| Auth | `POST /api/v1/auth/login` | Login |
| Services | `GET /api/v1/services` | List services |
| Services | `POST /api/v1/services` | Create service |
| Orders | `POST /api/v1/orders` | Create order |
| Admin | `GET /admin/stats` | Dashboard stats |

## 👤 Default Credentials

**Admin Account**:
- Email: `admin@ceconline.edu`
- Password: `Admin@123`

## 🧪 Testing

### Backend Tests
```bash
pytest tests/ -v --cov=app
```

### API Testing
Use Swagger UI at http://localhost:8000/docs or tools like Postman/Insomnia.

## 📂 Project Structure

```
project/
├── app/                      # FastAPI backend
│   ├── api/                  # API routes
│   ├── core/                 # Security & config
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── main.py               # App entry point
│   └── database.py           # DB configuration
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # API client
│   │   ├── store/            # State management
│   │   └── App.jsx           # Main app
│   └── package.json
├── alembic/                  # Database migrations
├── docker-compose.yml        # Docker services
├── Dockerfile                # Backend container
└── requirements.txt          # Python dependencies
```

## 🔒 Security Features

- JWT token authentication with refresh tokens
- Password hashing with bcrypt
- College email domain validation
- Role-based access control (Student/Admin)
- SQL injection protection via ORM
- CORS configuration
- Rate limiting ready

## 🌐 Deployment

### Production Build

**Backend**:
```bash
# Set environment to production in .env
APP_ENV=production
DEBUG=false

# Use production database
DATABASE_URL=postgresql+asyncpg://user:pass@production-db/skillhub

# Run with Docker in production mode
docker-compose --profile production up -d
```

**Frontend**:
```bash
cd frontend
npm run build

# Serve the dist folder with nginx or any static server
```

## 📝 Environment Variables

Key variables in `.env`:

```env
# App
APP_ENV=development
DEBUG=true
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql+asyncpg://skillhub:skillhub123@db:5432/skillhub

# JWT
JWT_SECRET_KEY=your-jwt-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30

# College
ALLOWED_EMAIL_DOMAIN=ceconline.edu

# Admin
ADMIN_EMAIL=admin@ceconline.edu
ADMIN_PASSWORD=Admin@123
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is developed for educational purposes.

## 💡 Support

For issues or questions:
1. Check API documentation at `/docs`
2. Review system logs
3. Check database connections

## 🎯 Future Enhancements

- [ ] File upload for service portfolios
- [ ] Real-time notifications
- [ ] Payment gateway integration
- [ ] Advanced search with Elasticsearch
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Chat system for orders

---

**Built with ❤️ for @ceconline.edu students**
