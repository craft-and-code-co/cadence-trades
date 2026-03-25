# Phase 1: Foundation — Supabase, Auth, Project Scaffolding

**Goal:** Standing app shell with auth, database schema, and project structure. A user can sign up, log in, and land on a protected route.

**Estimated effort:** 2-3 days

---

## 1.1 Project Initialization

### Vite + React + TypeScript
- `npm create vite@latest . -- --template react-ts`
- Install core dependencies:
  ```
  npm install @supabase/supabase-js react-router-dom
  npm install -D tailwindcss @tailwindcss/vite
  ```
- Install shadcn/ui: `npx shadcn@latest init`
- Configure Tailwind with the design system colors:
  - Dark navy base (`#0F172A` / slate-900 range)
  - Amber/gold accent (`#F59E0B` / amber-500 range)
  - Ensure typography feels weighted and confident — not startup-generic

### Project Structure (V1 simplified)
```
cadence-trades/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui
│   │   ├── layout/          # AppShell, Sidebar, TopBar
│   │   ├── briefing/        # Weekly briefing widgets (replaces dashboard/)
│   │   ├── insights/        # Insight cards
│   │   ├── data/            # CSV import, manual entry
│   │   ├── coach/           # Chat interface components
│   │   └── onboarding/      # Onboarding step components
│   ├── pages/
│   │   ├── Briefing.tsx     # Weekly briefing (home)
│   │   ├── Coach.tsx        # Conversational AI coach
│   │   ├── Settings.tsx     # Basic settings
│   │   ├── Onboarding.tsx   # Onboarding flow
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── ResetPassword.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useCompanyProfile.ts
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client singleton
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts      # TypeScript types mirroring DB schema
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── App.tsx
├── supabase/
│   ├── functions/
│   └── migrations/
├── knowledge/               # Founder's existing content library
├── scripts/
│   └── seed-knowledge.ts
├── public/
│   └── _redirects           # /* /index.html 200
└── vite.config.ts
```

**Key V1 simplification:** No `campaigns/`, no `dashboard/` (replaced by `briefing/`), no `Insights.tsx` page (insights surface on briefing + coach chat only).

### Environment Setup
```env
# .env.local (never committed)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 1.2 Supabase Project Setup

### Dashboard Configuration
1. Create new Supabase project
2. Enable extensions:
   - `pgvector` — Dashboard > Database > Extensions > search "vector" > enable
   - `pg_cron` — Dashboard > Database > Extensions > search "pg_cron" > enable
3. Set Edge Function secrets:
   - `OPENROUTER_API_KEY`
   - `RESEND_API_KEY`

### Database Migration — Full Schema

Run as first migration. All tables created upfront (even `campaigns` and `roi_events` which are unused in V1) to avoid migration churn later.

**Tables created:**
| Table | V1 Status |
|---|---|
| `company_profiles` | Active — onboarding writes here |
| `jobs` | Active — CSV/manual entry target |
| `technicians` | Active — populated from imports |
| `service_catalog` | Active — populated from imports |
| `customers` | Active — populated from imports |
| `insights` | Active — AI engine writes here |
| `campaigns` | Created, unused in V1 |
| `roi_events` | Created, unused in V1 |
| `coach_conversations` | Active — thread metadata |
| `coach_messages` | Active — individual messages |
| `knowledge_documents` | Active — RAG KB chunks |
| `data_connections` | Active — tracks import sources |
| `market_benchmarks` | **NEW** — founder-curated benchmark data for HVAC, Plumbing, Electrical, Backflow |

**New table not in original spec — `market_benchmarks`:**
```sql
create table market_benchmarks (
  id uuid primary key default gen_random_uuid(),
  trade text not null,              -- 'hvac' | 'plumbing' | 'electrical' | 'backflow'
  region text,                      -- nullable for national averages
  service_name text not null,       -- e.g. 'AC Service Call', 'Backflow Test'
  benchmark_low numeric not null,
  benchmark_high numeric not null,
  benchmark_source text,            -- 'HomeAdvisor' | 'Angi' | 'BLS' | 'founder_experience'
  notes text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
```
This gives the dollar projection formula structured data to query rather than relying on hardcoded values or LLM guessing.

**Indexes:**
- HNSW on `knowledge_documents.embedding`
- Standard indexes on `jobs.company_id`, `jobs.job_date`, `insights.company_id`, `coach_messages.conversation_id`

**Functions:**
- `match_knowledge_documents()` — semantic search helper (as specified in V1 spec)

**RLS Policies:**
- All tables: users can only read/write rows where `company_id` matches their own company profile
- `knowledge_documents`: read-only for all authenticated users (shared KB)
- `market_benchmarks`: read-only for all authenticated users

---

## 1.3 Authentication

### Supabase Auth Config
- Email + password provider enabled
- Email confirmation required
- Password reset flow enabled

### Frontend Auth Flow
- `AuthContext.tsx` — wraps app, exposes `user`, `session`, `signIn`, `signUp`, `signOut`, `resetPassword`
- `useAuth()` hook for consuming auth state
- `supabase.auth.onAuthStateChange()` listener for session management

### Routes
```tsx
// Public routes
/login         → Login.tsx
/signup        → Signup.tsx
/reset-password → ResetPassword.tsx

// Protected routes (redirect to /login if no session)
/              → Briefing.tsx (or redirect to /onboarding if !onboarding_complete)
/coach         → Coach.tsx
/settings      → Settings.tsx
/onboarding    → Onboarding.tsx
```

### Auth Pages (minimal, functional)
- **Login:** Email + password fields, "Sign in" button, links to signup and reset
- **Signup:** Email + password + confirm password, "Create account" button
- **Reset Password:** Email field, "Send reset link" button
- All pages use the dark navy + amber design system
- Show toast on success/error

---

## 1.4 App Shell

### Layout Components
- **AppShell:** Sidebar + main content area. Sidebar is minimal for V1:
  - Briefing (home icon)
  - Coach (chat icon)
  - Settings (gear icon)
  - Sign out
- **TopBar:** "Good morning, [name]" greeting (pulled from company_profiles.company_name). Data health banner slot.
- Mobile: sidebar collapses to bottom nav or hamburger menu. Desktop-primary but responsive.

---

## Phase 1 Completion Criteria

- [ ] `npm run dev` serves the app locally
- [ ] User can sign up, confirm email, and log in
- [ ] Protected routes redirect unauthenticated users to /login
- [ ] Authenticated user sees the app shell with sidebar navigation
- [ ] All database tables exist with RLS policies
- [ ] pgvector and pg_cron extensions enabled
- [ ] `market_benchmarks` table seeded with founder's data for HVAC, Plumbing, Electrical, Backflow
- [ ] TypeScript types generated or manually written to match schema
- [ ] Cloudflare Pages `_redirects` file in place for SPA routing

---

## Dependencies for Next Phase
Phase 2 (Onboarding + Data Import) requires:
- Auth working (this phase)
- `company_profiles` table with RLS (this phase)
- `jobs`, `customers`, `service_catalog` tables ready (this phase)
