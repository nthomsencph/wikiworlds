# Deployment Secrets Configuration

This document explains the GitHub secrets required for automated deployment to staging and production environments.

## Required Secrets

The deployment workflows will only run if the following **essential secrets** are configured:

### Core Secrets (Required for both staging and production)
- `SECRET_KEY` - FastAPI secret key for JWT tokens
- `POSTGRES_PASSWORD` - Database password

### Environment-Specific Secrets
- `DOMAIN_STAGING` - Domain for staging environment (e.g., `staging.example.com`)
- `DOMAIN_PRODUCTION` - Domain for production environment (e.g., `example.com`)

## Optional Secrets

These secrets are used if available but won't prevent deployment:

- `STACK_NAME_STAGING` / `STACK_NAME_PRODUCTION` - Docker stack names
- `FIRST_SUPERUSER` - Initial admin user email
- `FIRST_SUPERUSER_PASSWORD` - Initial admin user password
- `SMTP_HOST` - Email server host
- `SMTP_USER` - Email server username
- `SMTP_PASSWORD` - Email server password
- `EMAILS_FROM_EMAIL` - From email address
- `SENTRY_DSN` - Sentry error tracking DSN

## How to Configure

1. Go to your repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Add the required secrets listed above
4. The deployment workflows will automatically start running once the essential secrets are configured

## Workflow Behavior

- **Without secrets**: Workflows run but skip deployment with a clear message
- **With secrets**: Full deployment process executes
- **Missing essential secrets**: Clear error message explaining what's needed

This prevents unnecessary workflow runs while providing clear guidance on what's needed for deployment.
