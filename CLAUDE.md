# Cadence Trades

AI-powered business coach for trades and home service companies (HVAC, plumbing, electrical, backflow). Push-first engagement model — weekly email with dollar-impact recommendations, conversational AI coach, weekly briefing screen.

## Tech Stack

- **Frontend:** React 19 + TypeScript (Vite), Tailwind CSS v4, shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI:** OpenRouter API (Claude Sonnet via Edge Functions — key never in client)
- **Vector Search:** Supabase pgvector + HNSW index
- **Email:** Resend
- **Scheduling:** pg_cron (daily analysis + weekly email)
- **Deployment:** Cloudflare Pages (frontend) + Supabase Edge Functions (backend)

## Project Structure

```
src/
  components/ui/         # shadcn/ui components
  components/layout/     # AppShell, Sidebar, TopBar, MobileNav, ProtectedRoute
  components/briefing/   # Weekly briefing widgets
  components/insights/   # Insight cards
  components/data/       # CSV import, manual entry
  components/coach/      # Chat interface
  components/onboarding/ # Onboarding steps
  pages/                 # Route-level pages
  hooks/                 # useAuth, useCompanyProfile
  lib/                   # supabase client, utils
  types/                 # database.ts (all DB types + enums)
  contexts/              # AuthContext
supabase/
  migrations/            # SQL migrations
  functions/             # Edge Functions (Deno)
knowledge/               # Founder's coaching content (markdown, organized by topic)
scripts/                 # seed-knowledge.ts
build-plan/              # Phase-by-phase build docs
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
supabase db push     # Push migrations to remote Supabase project
supabase functions deploy <name>  # Deploy an Edge Function
```

## Supabase

- **CLI installed:** v2.47.2 — use `supabase db push` to apply migrations directly to remote
- **Project ref:** nethroisexlhyqgyxtvw (linked via supabase/.temp/project-ref)
- **No local Docker required** — we push directly to hosted Supabase
- **Migrations:** supabase/migrations/ — run `supabase db push` after adding/editing
- **Edge Functions:** supabase/functions/ — deploy with `supabase functions deploy`
- **Secrets:** OPENROUTER_API_KEY, RESEND_API_KEY set in Supabase dashboard

## Design System

- **Theme:** Dark navy base + amber/gold accent (always dark mode)
- **Colors:** Navy backgrounds (oklch 0.12-0.25), amber primary (oklch 0.80 0.16 85), muted red for destructive/negative
- **Font:** Geist Variable (via shadcn default)
- **Shadcn components:** Use `@/components/ui/` — already configured with custom theme

## File Size & Architecture Rules

- Keep `App.tsx` as a router/shell only — no business logic, no inline UI blocks
- Component files should stay under ~150 lines; split when they grow past that
- Each component lives in its own file under `/components`
- Extract hooks into `/hooks` when logic exceeds a few lines
- Extract constants, types, and config into their own files — never inline them in components
- If a file needs a scroll to read, it needs to be split

## Key Patterns

- **Auth:** AuthContext wraps app, `useAuth()` hook, `ProtectedRoute` component
- **RLS:** All tables company-scoped via `auth.company_id()` helper function
- **Data import:** Pluggable `DataImporter` interface — CSV/manual now, Jobber/others later
- **AI calls:** Always via Edge Functions, never from client
- **Path alias:** `@/` maps to `src/`

## Build Phases

See `build-plan/` for detailed phase docs:
1. Foundation (complete) — scaffolding, auth, schema, app shell
2. Onboarding + Data Import
3. Knowledge Base + AI Engine
4. Weekly Briefing + Coach Chat
5. Push Email + Settings
6. Polish + Deploy

## Important Notes

- Launch trades: HVAC, Plumbing, Electrical, Backflow
- Market benchmarks stored in `market_benchmarks` table (founder-curated)
- Minimum data threshold: 30 jobs before insight engine generates recommendations
- Coach chat uses RAG via pgvector — `match_knowledge_documents()` function
- All dollar projections labeled as estimates with confidence tiers
