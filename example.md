# .env.example

# Database connection URL (must be a valid URL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

# Node environment: development, test, or production
NODE_ENV="development"

# Better Auth configuration
BETTER_AUTH_SECRET="your_better_auth_secret_here"
BETTER_AUTH_URL="https://your-auth-domain.com"
BETTER_AUTH_GOOGLE_ID="your_google_oauth_client_id"
BETTER_AUTH_GOOGLE_SECRET="your_google_oauth_client_secret"

# Disable Next.js telemetry (optional, defaults to true)
NEXT_TELEMETRY_DISABLED="true"

# Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_POSTHOG_KEY="your_posthog_project_api_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
