# Copilot Instructions

This project is a full‑stack Next.js (App Router) admin panel using TypeScript, Tailwind CSS, Prisma (PostgreSQL), NextAuth and Zod. Keep suggestions tight, code-style consistent, and avoid changing global architecture decisions without explaining why.

Key facts (quick):

- Next.js App Router (src/app). Server components by default; use `"use client"` only when needed.
- TypeScript strict mode enabled (`tsconfig.json`). Prefer typed code and explicit return types.
- Prisma schema: `prisma/schema.prisma`. Prisma client is imported from `src/lib/prisma.ts`.
- Authentication: NextAuth configured in `src/app/api/auth/[...nextauth]/route.ts` and helper `src/lib/auth.ts`.
- Validation: Zod schemas live in `src/lib/validations.ts`. API routes return Zod issues in responses (see `src/app/api/debtors/route.ts`).
- Middleware: `middleware.ts` enforces route protection, CSP/security headers and simple in‑memory rate limiting. Important: rate limit map is in memory (replace with Redis for multi-instance PROD).
- UI patterns: components under `src/components` and `src/components/ui`. Follow existing patterns for `button`, `card`, `input`, and `table` components.

Where to look for examples (concrete files):

- Protected API + Zod error pattern: `src/app/api/debtors/route.ts` (returns `{ error: 'Validation failed', issues: [...] }`).
- Middleware behavior and security headers: `middleware.ts`.
- Auth helpers and session usage: `src/lib/auth.ts`, `src/components/providers/auth-provider.tsx`.
- Prisma usage patterns: `src/lib/prisma.ts` and many `src/app/api/**/route.ts` files.
- Validation and resolver usage in forms: `src/app/auth/register/page.tsx` (uses `zodResolver`).
- Scripts and dev tasks: `package.json` (see `dev`, `build`, `render-build`, `vercel-build`, `postinstall`, `db:push`, `db:studio`).
- DB & migrations: `prisma/migrations/` — changes should be done via Prisma migrations.
- Debug / helper scripts: `scripts/debug-users.ts`.

Coding and architecture conventions (do not change unless necessary):

- Server components by default. If a component needs browser-only APIs, add `"use client"` at top.
- Use Zod schemas for request validation in API routes and return Zod issues on 400 responses.
- Use `getServerSession(authOptions)` (from `src/lib/auth.ts`) in API routes to guard endpoints.
- Use Prisma client from `src/lib/prisma.ts` (do not instantiate new clients per request).
- Keep UI text in Thai where applicable — existing pages are Thai‑focused.
- Follow existing Tailwind/utility class usage and `ui/` components conventions.

Developer workflows & commands (explicit):

- Local dev: `npm run dev` (starts Next with Turbopack).
- Build: `npm run build` — runs `prisma generate` then `next build`.
- Deploy (Vercel/Render): `npm run vercel-build` / `npm run render-build` — these run `prisma generate` and `prisma db push` before building.
- Ensure `prisma generate` ran if you edit Prisma schema: `npm run postinstall` runs it automatically.
- Apply Prisma schema to DB (non-migration): `npm run db:push`. For migrations, use Prisma migration CLI and commit `prisma/migrations/` changes.
- Open Prisma studio: `npm run db:studio`.

API and error patterns to mirror:

- Standard API signature: export async function GET/POST/PUT/DELETE(request: NextRequest) { ... }
- Auth guard: call `getServerSession(authOptions)` and return 401 JSON when absent.
- Zod validation: `try { schema.parse(body) } catch (err) { if (err instanceof ZodError) return 400 with issues }`.

Security & infra notes observed in repo:

- Middleware adds strict CSP and other security headers in `middleware.ts`.
- Rate limiting currently in-memory — annotate changes when suggesting production-ready alternatives (Redis/edge store).
- NextAuth adapter uses `@auth/prisma-adapter` and `@prisma/client` — do not bypass adapters.

When proposing changes, include:

- Exact files to edit and a short rationale.
- Any required migration steps (`prisma migrate` or `prisma db push`) and updated `prisma/migrations` SQL.
- Impact on authentication or middleware (these have global effect).

Do not propose:

- Replacing server components with client components without clear need.
- Changing authentication flow or token shape without updating `src/app/api/auth/[...nextauth]/route.ts` and `src/lib/auth.ts`.

If anything here is unclear or you want a section expanded (examples of API responses, typical PR checklist, or a checklist for changing DB schema), tell me which section to expand.