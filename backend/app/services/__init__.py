"""
Services package for business logic and utilities.

This package contains:
- email: Email sending and template management
- auth: JWT token utilities for authentication
"""

# Import all services for easy access
from .auth import generate_password_reset_token, verify_password_reset_token
from .email import (
    EmailData,
    generate_new_account_email,
    generate_reset_password_email,
    generate_test_email,
    render_email_template,
    send_email,
)

# Export all services
__all__ = [
    # Email services
    "EmailData",
    "render_email_template",
    "send_email",
    "generate_test_email",
    "generate_reset_password_email",
    "generate_new_account_email",
    # Auth services
    "generate_password_reset_token",
    "verify_password_reset_token",
]
