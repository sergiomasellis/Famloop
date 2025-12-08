# FamLoop - Family Calendar Application

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Overview
FamLoop is a modern, touch-friendly multi-user calendar application designed for families. It provides a weekly view of events, chore tracking with a point system, and a leaderboard to encourage children to complete their tasks.

<img width="1103" height="1030" alt="image" src="https://github.com/user-attachments/assets/5041e590-4f73-4ef0-bba1-71757d9381a1" />

## Features
- Weekly calendar view with events
- Event details view
- Chore tracking with points system
- Leaderboard for family members
- Goal setting and prize tracking

## Tech Stack
- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: FastAPI with SQLAlchemy
- Database: SQLite (for development)- 


## Project Structure
```
.
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   └── postcss.config.js
└── backend/
    ├── main.py
    ├── models.py
    ├── schemas.py
    ├── crud.py
    ├── database.py
    └── requirements.txt
```

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- Docker and Docker Compose (optional, for containerized deployment)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies using uv:
   ```bash
   uv sync
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env and set SECRET_KEY to a strong random value
   # Generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
4. Run the backend server:
   ```bash
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```
3. Run the development server:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

### Docker Setup (Recommended for Production)
See [DOCKER.md](./DOCKER.md) for detailed Docker setup instructions.

Quick start:
```bash
# Production build
docker-compose up --build

# Development mode with hot reload
docker-compose -f docker-compose.dev.yml up --build
```

## Environment Variables

### Backend (.env)
- `SECRET_KEY` - **REQUIRED**: Strong secret key for JWT tokens (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `DATABASE_URL` - Database connection string (default: `sqlite:///./data.db`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT token expiration in minutes (default: 10080 = 7 days)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins (default: `http://localhost:3000,http://localhost:8000`)

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: auto-detected from current hostname)

## Database
The application uses SQLite for development. The database file (`data.db`) will be created automatically when you run the backend for the first time.

**Note**: For production deployments, consider migrating to PostgreSQL for better performance and reliability.

## API Endpoints
The backend provides RESTful API endpoints for:
- Users management
- Family groups management
- Events management
- Chores management
- Points tracking
- Goals management

API documentation is available at `http://localhost:8000/docs` when the backend is running.

## Production Deployment

### Security Checklist
Before deploying to production, ensure:

1. **Set a strong SECRET_KEY**: Generate a secure random key and set it in your environment variables
2. **Configure CORS_ORIGINS**: Set to your production frontend domain(s) only
3. **Use HTTPS**: Always use HTTPS in production
4. **Database Security**: Consider migrating from SQLite to PostgreSQL with proper access controls
5. **Environment Variables**: Never commit `.env` files to version control
6. **Rate Limiting**: Consider adding rate limiting for API endpoints
7. **Monitoring**: Set up logging and monitoring for production

### Deployment Options

#### Option 1: Docker Compose (Recommended)
```bash
# Set environment variables
export SECRET_KEY="your-production-secret-key"
export CORS_ORIGINS="https://yourdomain.com"
export NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"

# Build and run
docker-compose up -d --build
```

#### Option 2: Manual Deployment
1. Deploy backend to a cloud platform (AWS, Google Cloud, Azure)
2. Deploy frontend to Vercel, Netlify, or similar
3. Configure environment variables in your hosting platform
4. Update CORS_ORIGINS to match your frontend domain

## Contributing
To contribute to FamLoop:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the [MIT License](./LICENSE) © 2025 Sergio Masellis.
