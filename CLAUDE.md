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
  lib/                   # supabase client, utils, constants
  lib/importers/         # DataImporter interface, CSV/manual normalizers, lead-source, customer matching
  types/                 # database.ts (all DB types + enums)
  contexts/              # AuthContext
supabase/
  migrations/            # SQL migrations
  functions/             # Edge Functions (Deno)
knowledge/               # Founder's coaching content (markdown, organized by topic)
scripts/                 # seed-knowledge.ts
build-plan/              # Phase-by-phase build docs
design/                  # Iron Amber design system — DESIGN.md, reference screenshots + HTML per page
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

## Design System — "Iron Amber"

Full spec: `design/iron_amber/DESIGN.md`
Reference screenshots: `design/weekly_briefing_v2/`, `design/coach_chat_v2/`, `design/insights_feed/`, `design/settings/`
Each folder contains `screen.png` (visual target) and `code.html` (reference implementation with exact Tailwind classes).

- **Aesthetic:** "The Financial Architect" — editorial precision, premium financial instrument feel
- **Theme:** Always dark mode. Tonal surface layering (no flat backgrounds)
- **Fonts:** Manrope (headlines, extrabold, -0.02em tracking) + Inter (body, 400-600wt)
- **Icons:** Material Symbols Outlined (Google Fonts CDN), wrapped in `<Icon>` component at `src/components/ui/icon.tsx`
- **Colors — Tonal Surface Hierarchy:**
  - `surface-container-lowest` #060E20 (deepest void)
  - `surface` #0B1326 (page background)
  - `surface-container-low` #131B2E (sidebar, subtle sections)
  - `surface-container` #171F33 (primary cards)
  - `surface-container-high` #222A3D (raised elements)
  - `surface-container-highest` #2D3449 (inputs, modals)
- **Amber spectrum:** `primary-container` #F59E0B (bold CTA), `primary` #FFC174 (text highlights)
- **The "No-Line" Rule:** 1px solid borders are prohibited for sectioning. Use background color shifts or `ghost-border` utility (15% opacity max). See DESIGN.md for details.
- **Inputs:** Solid `bg-surface-container-highest`, 2px bottom-border focus state (ledger style)
- **Active nav:** `border-r-4 border-primary` accent bar, not full background highlight
- **Glassmorphic top bar:** `glass-surface` utility class
- **Spacing:** Generous — `p-10`, `gap-8`, `mb-12` throughout
- **Shadcn overrides:** Button, Card, Input, Label all customized in `src/components/ui/`

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
2. Onboarding + Data Import (complete) — 5-step wizard, CSV import, manual entry, customer matching
3. Knowledge Base + AI Engine
4. Weekly Briefing + Coach Chat
5. Push Email + Settings
6. Polish + Deploy

Iron Amber design system applied across all phases 1-2 components.

## Important Notes

- Launch trades: HVAC, Plumbing, Electrical, Backflow
- Market benchmarks stored in `market_benchmarks` table (founder-curated)
- Minimum data threshold: 30 jobs before insight engine generates recommendations
- Coach chat uses RAG via pgvector — `match_knowledge_documents()` function
- All dollar projections labeled as estimates with confidence tiers
