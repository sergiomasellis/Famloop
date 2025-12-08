"""
FamLoop API - Family calendar, chores, and rewards.
Production-ready FastAPI application with security, logging, and rate limiting.
"""

from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables before importing config
load_dotenv()

from fastapi import FastAPI, Request, status  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from fastapi.exceptions import RequestValidationError  # noqa: E402
from starlette.exceptions import HTTPException as StarletteHTTPException  # noqa: E402
from slowapi import Limiter  # noqa: E402
from slowapi.util import get_remote_address  # noqa: E402
from slowapi.errors import RateLimitExceeded  # noqa: E402

# Import configuration and logging first
from .config import settings  # noqa: E402
from .logging_config import setup_logging, get_request_id  # noqa: E402

# Setup logging
logger = setup_logging(
    level=settings.log_level, log_format=settings.log_format, app_name="famloop"
)

# Import middleware
from .middleware import (  # noqa: E402
    SecurityHeadersMiddleware,
    RequestIdMiddleware,
    RequestLoggingMiddleware,
    HTTPSRedirectMiddleware,
)

# Import routers
from .routers import (  # noqa: E402
    auth,
    users,
    families,
    calendars,
    chores,
    points,
    goals,
    billing,
)
from .db.session import engine, Base  # noqa: E402

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_requests}/{settings.rate_limit_window}"],
    enabled=settings.rate_limit_enabled,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    logger.info(
        "Application starting",
        extra={
            "environment": settings.environment,
            "version": settings.app_version,
            "database": "sqlite" if settings.is_sqlite else "postgresql",
        },
    )

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    yield

    # Shutdown
    logger.info("Application shutting down")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Family calendar, chores, and rewards API",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# Add rate limiter to app state
app.state.limiter = limiter


# Exception handlers
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors."""
    logger.warning(
        "Rate limit exceeded",
        extra={
            "client_host": request.client.host if request.client else "unknown",
            "path": str(request.url.path),
        },
    )
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "request_id": get_request_id(),
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    logger.warning(
        f"HTTP {exc.status_code}: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": str(request.url.path),
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "request_id": get_request_id(),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.warning(
        "Validation error",
        extra={
            "errors": exc.errors(),
            "path": str(request.url.path),
        },
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "request_id": get_request_id(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "path": str(request.url.path),
            "exception_type": type(exc).__name__,
        },
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "request_id": get_request_id(),
        },
    )


# Add middleware (order matters - first added is last executed)
# 1. Request ID (outermost - runs first)
app.add_middleware(RequestIdMiddleware)

# 2. Request logging
app.add_middleware(RequestLoggingMiddleware)

# 3. Security headers
if settings.enable_security_headers:
    app.add_middleware(
        SecurityHeadersMiddleware,
        enable_hsts=settings.is_production,
        enable_csp=True,
        environment=settings.environment,
    )

# 4. HTTPS redirect (only in production)
if settings.is_production:
    app.add_middleware(HTTPSRedirectMiddleware, enabled=True)

# 5. CORS (innermost for API requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


# Health check endpoint (not rate limited)
@app.get("/healthz", tags=["health"])
def health():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "ok",
        "version": settings.app_version,
        "environment": settings.environment,
    }


# Ready check endpoint (not rate limited)
@app.get("/readyz", tags=["health"])
def ready():
    """
    Readiness check endpoint.
    Returns 200 if the application is ready to serve traffic.
    """
    # TODO: Add database connectivity check
    return {"status": "ready"}


# API versioned routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(families.router, prefix="/api/families", tags=["families"])
app.include_router(calendars.router, prefix="/api/calendars", tags=["calendars"])
app.include_router(chores.router, prefix="/api/chores", tags=["chores"])
app.include_router(points.router, prefix="/api/points", tags=["points"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])

# Log application configuration on import
logger.info(
    "Application configured",
    extra={
        "cors_origins": settings.cors_origins_list,
        "rate_limit_enabled": settings.rate_limit_enabled,
        "security_headers_enabled": settings.enable_security_headers,
    },
)
