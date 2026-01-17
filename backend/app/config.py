"""
Application configuration with validation.
All configuration is loaded from environment variables with sensible defaults.
"""

import sys
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation."""

    # Application
    app_name: str = Field(default="FamLoop API", description="Application name")
    app_version: str = Field(default="0.1.0", description="Application version")
    environment: str = Field(
        default="development",
        description="Environment (development, staging, production)",
    )
    debug: bool = Field(default=False, description="Debug mode")

    # Security
    secret_key: str = Field(..., description="Secret key for JWT signing")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        default=10080, description="Token expiration in minutes (default: 7 days)"
    )

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        description="Comma-separated CORS origins",
    )

    # Database
    database_url: str = Field(
        default="sqlite:///./data.db", description="Database connection URL"
    )
    db_pool_size: int = Field(default=5, description="Database connection pool size")
    db_max_overflow: int = Field(default=10, description="Max overflow connections")

    # Rate limiting
    rate_limit_enabled: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_requests: int = Field(default=100, description="Max requests per window")
    rate_limit_window: str = Field(default="1 minute", description="Rate limit window")

    # OAuth
    google_client_id: str | None = Field(
        default=None, description="Google OAuth client ID"
    )
    google_client_secret: str | None = Field(
        default=None, description="Google OAuth client secret"
    )
    google_redirect_uri: str | None = Field(
        default=None,
        description="Google OAuth redirect URI (backend) - defaults to local /api/auth/google/callback",
    )
    frontend_app_url: str | None = Field(
        default=None,
        description="Frontend base URL used for auth redirects (defaults to first CORS origin or localhost)",
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(default="json", description="Log format (json or text)")

    # Stripe billing
    stripe_secret_key: str | None = Field(
        default=None, description="Stripe secret key for server-side calls"
    )
    stripe_publishable_key: str | None = Field(
        default=None, description="Stripe publishable key for frontend"
    )
    stripe_webhook_secret: str | None = Field(
        default=None, description="Stripe webhook signing secret"
    )
    stripe_checkout_success_url: str | None = Field(
        default=None,
        description="Success redirect URL for Checkout sessions (frontend URL)",
    )
    stripe_checkout_cancel_url: str | None = Field(
        default=None,
        description="Cancel redirect URL for Checkout sessions (frontend URL)",
    )
    stripe_billing_return_url: str | None = Field(
        default=None,
        description="Return URL for Stripe Billing Portal (frontend URL)",
    )
    stripe_price_family_plus_monthly: str | None = Field(
        default=None, description="Stripe price ID for Family Plus monthly"
    )
    stripe_price_family_plus_annual: str | None = Field(
        default=None, description="Stripe price ID for Family Plus annual"
    )
    stripe_price_family_pro_monthly: str | None = Field(
        default=None, description="Stripe price ID for Family Pro monthly"
    )
    stripe_price_family_pro_annual: str | None = Field(
        default=None, description="Stripe price ID for Family Pro annual"
    )

    # Security headers
    enable_security_headers: bool = Field(
        default=True, description="Enable security headers"
    )

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v = v.upper()
        if v not in allowed:
            raise ValueError(f"log_level must be one of {allowed}")
        return v

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("secret_key must be at least 32 characters long")
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"

    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite database."""
        return self.database_url.startswith("sqlite")

    @property
    def stripe_enabled(self) -> bool:
        """Check if Stripe is configured."""
        return bool(self.stripe_secret_key)

    @property
    def default_frontend_origin(self) -> str:
        """Return the preferred frontend origin for redirects."""
        if self.frontend_app_url:
            return self.frontend_app_url.rstrip("/")
        if self.cors_origins_list:
            return self.cors_origins_list[0].rstrip("/")
        return "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


def get_settings() -> Settings:
    """
    Load and validate settings from environment variables.
    Raises ValidationError if required settings are missing or invalid.
    """
    try:
        return Settings()
    except Exception as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        print("\nRequired environment variables:", file=sys.stderr)
        print(
            "  SECRET_KEY - Secret key for JWT signing (min 32 characters)",
            file=sys.stderr,
        )
        print("\nOptional environment variables:", file=sys.stderr)
        print(
            "  ENVIRONMENT - development, staging, or production (default: development)",
            file=sys.stderr,
        )
        print(
            "  DATABASE_URL - Database connection URL (default: sqlite:///./data.db)",
            file=sys.stderr,
        )
        print("  CORS_ORIGINS - Comma-separated allowed origins", file=sys.stderr)
        print(
            "  LOG_LEVEL - DEBUG, INFO, WARNING, ERROR, CRITICAL (default: INFO)",
            file=sys.stderr,
        )
        print("  LOG_FORMAT - json or text (default: json)", file=sys.stderr)
        print(
            "  RATE_LIMIT_ENABLED - Enable rate limiting (default: true)",
            file=sys.stderr,
        )
        print(
            "  RATE_LIMIT_REQUESTS - Max requests per window (default: 100)",
            file=sys.stderr,
        )
        print(
            "  RATE_LIMIT_WINDOW - Rate limit window (default: 1 minute)",
            file=sys.stderr,
        )
        sys.exit(1)


# Create a singleton instance
settings = get_settings()
