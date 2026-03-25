# Cadence Trades — V1 Build Plan

6 phases, each with clear entry/exit criteria and dependencies. Phases are sequential — each builds on the last.

## Phase Overview

| Phase | Name | Effort | What Ships |
|---|---|---|---|
| 1 | [Foundation](phase-1-foundation.md) | 2-3 days | Supabase project, full schema, auth, app shell, project scaffolding |
| 2 | [Onboarding + Data Import](phase-2-onboarding-data.md) | 3-4 days | 5-step onboarding, CSV import with column mapping, manual entry, importer interface |
| 3 | [Knowledge Base + AI Engine](phase-3-knowledge-ai-engine.md) | 4-5 days | KB seeded + searchable, benchmark data loaded, `analyze-data` + `generate-insight` Edge Functions, pg_cron daily schedule |
| 4 | [Briefing + Coach Chat](phase-4-briefing-coach.md) | 4-5 days | Weekly briefing screen (KPIs + insight cards), coach chat with full RAG, conversation threads |
| 5 | [Push Email + Settings](phase-5-push-email-settings.md) | 2-3 days | Monday morning email via Resend, pg_cron weekly schedule, settings page (profile edit, account, delete) |
| 6 | [Polish + Deploy](phase-6-polish-deploy.md) | 3-4 days | Empty states, loading states, error handling, responsive design, Cloudflare Pages + Supabase production, CI/CD |

**Total estimated effort: ~18-24 days**

## Dependency Chain

```
Phase 1 (Foundation)
  └── Phase 2 (Onboarding + Data)
        └── Phase 3 (KB + AI Engine)
              └── Phase 4 (Briefing + Coach)
              └── Phase 5 (Push Email + Settings)
                    └── Phase 6 (Polish + Deploy)
```

Phases 4 and 5 both depend on Phase 3 and could be partially parallelized — the email system doesn't depend on the briefing UI being done, and vice versa. But for a solo/small-team build, sequential is simpler.

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Vector index | HNSW (not IVFFlat) | Works at any scale, no reindexing needed |
| Chat storage | `coach_messages` table (not JSONB blob) | Queryable, pageable, enables future analytics |
| Scheduling | pg_cron via Supabase | Native, no external service, runs `analyze-data` daily + email weekly |
| Email | Resend | Simple DX, good deliverability, core feature not afterthought |
| Data import architecture | Pluggable `DataImporter` interface | CSV/manual now, Jobber slots in without restructuring |
| Market benchmarks | Dedicated `market_benchmarks` table | Structured data for dollar projections, not hardcoded or LLM-guessed |
| Launch trades | HVAC, Plumbing, Electrical, Backflow | Founder's expertise, benchmarks curated for these four |

## What's Not in V1

Built the schema for these but no UI or logic:
- Campaign generator (`campaigns` table exists, unused)
- ROI tracking loop (`roi_events` table exists, unused)
- Full insights page with filters
- Full dashboard with charts
- Housecall Pro / ServiceTitan integrations
- SMS notifications
- Stripe billing
- Team/multi-user accounts

## Pre-Build Reminder

> **Before writing code:** Call Josh + 2 other clients. Validate the push-first coaching thesis. If 2 of 3 react with more than "that sounds cool," build. If not, dig into why.
