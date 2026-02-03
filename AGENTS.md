# Repository Guidelines

## Project Structure & Module Organization

- `src/app/`: Next.js App Router pages, layouts, and API routes (e.g., `src/app/api/monitors`).
- `src/lib/`: Server-side utilities (auth, db, logger, schemas, rate limiting).
- `src/components/`: Shared React components (providers).
- `prisma/`: Database schema and migrations.
- `public/`: Static assets.

## Build, Test, and Development Commands

- `docker compose up -d`: Start local PostgreSQL.
- `npm install`: Install dependencies.
- `npx prisma migrate dev`: Apply migrations in dev.
- `npm run dev`: Start the Next.js dev server.
- `npm run build`: Generate Prisma client and build for production.
- `npm run lint`: Run ESLint.
- `npx prisma studio`: Open Prisma Studio at `localhost:5555`.

## Coding Style & Naming Conventions

- TypeScript/TSX throughout; keep modules small and focused.
- Prefer concise, readable code (KISS).
- Formatting: Prettier (run `npx prettier -w <paths>`).
- Linting: ESLint via `npm run lint`.
- Naming: React components in PascalCase; API route folders use kebab-case or bracket params (e.g., `src/app/api/monitors/[id]`).

## Testing Guidelines

- No test framework currently configured.
- If adding tests, keep them close to related modules or under a `tests/` folder, and document how to run them.

## Commit & Pull Request Guidelines

- Git history shows short, imperative, lowercase messages (e.g., “add …”, “fix …”). Follow that pattern.
- PRs should include: summary of changes, testing performed, and screenshots for UI changes when applicable.

## Security & Configuration Tips

- Configure secrets in `.env` (see `.env.example`): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`.
- The monitor checker calls external URLs server-side; avoid allowing private/internal targets in production.
