# PulseGuard

Uptime monitoring for websites and APIs. Track availability, response times, and share public status pages with your users.

## Features

- **HTTP monitoring** — Check any URL at configurable intervals (30s–1h)
- **Status tracking** — Response codes, latency, and up/down history
- **Public status pages** — Shareable pages with 90-day uptime bars
- **Alerting-ready** — Cron-based check runner with Bearer token auth

## Tech stack

- **Next.js 16** (App Router)
- **PostgreSQL** via Prisma ORM
- **NextAuth.js** (JWT + credentials)
- **Zod** for input validation
- **Tailwind CSS 4**

## Local development

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your local values (defaults work with docker-compose)

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### Useful commands

```bash
npx prisma studio    # Database GUI at localhost:5555
npx prisma migrate dev --name <name>  # Create a new migration
npm run build        # Production build
npm run lint         # Run ESLint
```

## Deployment (Vercel + Supabase)

1. Create a [Supabase](https://supabase.com) project and copy the PostgreSQL connection string
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — Supabase connection string
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — Your Vercel domain (e.g. `https://pulseguard.vercel.app`)
   - `CRON_SECRET` — `openssl rand -base64 32`
4. Deploy — Vercel builds and ships automatically
5. Run migrations against Supabase: `npx prisma migrate deploy`

Monitor checks run on set intervals via Vercel Cron (configured in `vercel.json` but requires a pay plan) OR via cron-job.org (free).

## Project structure

```
prisma/
  schema.prisma       # Database schema
src/
  app/
    api/
      auth/           # Signup + NextAuth endpoints
      checks/run/     # Cron-triggered monitor checker
      monitors/       # CRUD for monitors
      status-pages/   # CRUD for status pages
    dashboard/        # Authenticated dashboard UI
    status/[slug]/    # Public status page
    signin/           # Sign in page
    signup/           # Sign up page
  lib/
    auth.ts           # NextAuth configuration
    db.ts             # Prisma client singleton
    rate-limit.ts     # In-memory rate limiter
    schemas.ts        # Zod validation schemas
```

## License

Private.
