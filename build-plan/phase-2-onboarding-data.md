# Phase 2: Onboarding + Data Import

**Goal:** New user completes onboarding, imports their data via CSV or manual entry, and has a populated `jobs` table ready for analysis. This is the critical data pipeline — without data, nothing downstream works.

**Estimated effort:** 3-4 days

**Depends on:** Phase 1 (auth, schema, app shell)

---

## 2.1 Onboarding Flow

### Architecture
- Multi-step wizard inside `Onboarding.tsx`
- State managed locally (React state or form library) until final submission
- On completion: upsert to `company_profiles`, set `onboarding_complete = true`
- User is redirected to `/` (Briefing) after completion
- If user navigates away mid-onboarding, progress is lost (acceptable for V1 — onboarding is short)

### Step 1: Business Basics
| Field | Type | Required |
|---|---|---|
| Company name | text | yes |
| Primary trade | select: HVAC, Plumbing, Electrical, Backflow, Landscaping, Pest Control, General Home Services, Other | yes |
| Service area | text (city/region) | no |
| Years in business | number | no |
| Annual revenue range | select: Under $500k / $500k-$1M / $1M-$3M / $3M+ | no |

### Step 2: Team Structure
| Field | Type | Required |
|---|---|---|
| Number of field technicians | number | no |
| Number of office/admin staff | number | no |
| Dedicated dispatcher? | yes/no toggle | no |
| Service manager? | yes/no toggle | no |
| Average tech hourly cost (fully burdened) | currency input | no |

### Step 3: Current Tools
| Field | Type | Required |
|---|---|---|
| Field service software | select: ServiceTitan / Housecall Pro / Jobber / Workiz / None / Other | no |
| Marketing tracking method | text or "I don't" | no |
| Run paid advertising? | select: Google / Facebook / Both / Neither | no |
| Membership/maintenance plan? | yes/no + description if yes | no |

### Step 4: Goals and Pain Points
| Field | Type | Required |
|---|---|---|
| Biggest challenges | multiselect (see design doc for options) | yes (at least 1) |
| Success vision (12 months) | textarea, 2-3 sentences | no |

### Step 5: Connect Your Data
Three options presented as cards:
- **Upload CSV** — primary CTA, most prominent
- **Enter Manually** — secondary option
- **Skip for now** — tertiary, with note: "You'll see limited insights until you add data"

Selecting CSV or Manual routes to the respective import flow (sections 2.2 / 2.3 below). Selecting Skip completes onboarding and redirects to Briefing with an empty-state prompt.

### UX Notes
- Progress indicator showing current step (1 of 5)
- "Back" button on each step
- Dark navy background with amber accent on CTAs
- Conversational tone in headings: "Let's get to know your business" not "Company Information"
- Required fields are minimal — don't block onboarding for optional data

---

## 2.2 CSV Import

### Downloadable Templates
Provide 3 CSV templates via public URLs (stored in `/public/templates/`):
1. **Job history** — date, service_type, tech_name, hours, revenue, lead_source, customer_name, customer_zip
2. **Customer list** — name, zip, first_job_date, last_job_date, total_spend
3. **Price book** — service_name, category, flat_rate_price, estimated_hours, parts_cost_estimate

### Import Flow (5 steps)
**Step 1: Upload**
- Drag-and-drop zone + file picker
- Accept `.csv` files only
- Max file size: 10MB
- Store raw CSV in Supabase Storage (bucket: `csv-uploads/{company_id}/`)

**Step 2: Column Mapping**
- Parse CSV headers
- Show a mapping UI: each CSV column → dropdown of target fields
- Auto-map obvious matches (e.g., "date" → job_date, "revenue" → total_revenue)
- Allow user to skip columns they don't want to import
- Show first 3-5 rows as preview

**Step 3: Validation**
- Flag issues: missing dates, negative revenue, unrecognized service types
- Categorize: errors (block import) vs. warnings (allow import with note)
- Show error/warning counts

**Step 4: Summary**
- "Ready to import X jobs, Y customers" (or whichever template)
- List any warnings that will be imported as-is
- "Import" button

**Step 5: Confirmation**
- Success message with row counts
- If job count < 30: show the minimum-data-threshold message — "Keep logging jobs — we need a bit more data to give you specific advice. You have X jobs, we need at least 30."
- CTA to import another file or continue to briefing

### Data Normalization
- All imported rows get `source = 'csv'`
- Dates parsed flexibly (support MM/DD/YYYY, YYYY-MM-DD, M/D/YY)
- Revenue stored as numeric, strip currency symbols and commas
- Customer matching: if a customer list is imported, link jobs to customers by name/zip match
- Deduplication: if `external_id` matches an existing row, update rather than duplicate

### Supabase Storage
- Bucket: `csv-uploads`
- RLS: users can only access their own company's folder
- Raw CSV preserved for audit/re-import

---

## 2.3 Manual Entry

### Simple Table UI
- Inline-editable table for adding jobs one at a time
- Fields per row: date, service name, tech name, hours, total revenue, lead source
- "Add row" button at bottom
- Save on blur or explicit "Save" button
- All rows get `source = 'manual'`

### UX
- Pre-populate date with today
- Autocomplete tech name and service name from previously entered values
- Show running total of jobs entered
- Same minimum-data-threshold messaging as CSV: "You have X jobs. We need 30+ to generate insights."

---

## 2.4 Data Connection Record

When data is imported (CSV or manual), create/update a row in `data_connections`:
```
platform: 'csv' | 'manual'
status: 'active'
last_sync: now()
```

This powers the data health indicator on the briefing screen.

---

## 2.5 Integration Architecture (Prep for Jobber)

Even though Jobber OAuth ships later, structure the data import layer now so it's pluggable:

```typescript
// src/lib/importers/types.ts
interface DataImporter {
  source: 'csv' | 'manual' | 'jobber' | 'housecall_pro'
  normalizeJobs(rawData: unknown[]): NormalizedJob[]
  normalizeCustomers?(rawData: unknown[]): NormalizedCustomer[]
}
```

CSV and manual entry implement this interface. When Jobber ships, it slots in without restructuring.

---

## Phase 2 Completion Criteria

- [ ] New user completes 5-step onboarding and lands on Briefing
- [ ] Company profile saved to `company_profiles` with `onboarding_complete = true`
- [ ] CSV templates downloadable from `/public/templates/`
- [ ] CSV import: upload → column mapping → validation → summary → import works end-to-end
- [ ] Raw CSV stored in Supabase Storage
- [ ] Normalized job data in `jobs` table with `source = 'csv'`
- [ ] Manual entry: user can add jobs row-by-row
- [ ] Minimum data threshold message shows when < 30 jobs
- [ ] `data_connections` record created on import
- [ ] Importer interface defined for future Jobber/Housecall Pro integrations
- [ ] Returning user who has completed onboarding goes straight to Briefing (not onboarding)
- [ ] User who skips data import sees appropriate empty-state messaging

---

## Dependencies for Next Phase
Phase 3 (Knowledge Base + AI Engine) requires:
- Jobs data in the database (this phase)
- Company profile populated (this phase)
- `knowledge_documents` table ready (Phase 1)
- OpenRouter API key set in Supabase secrets (Phase 1)
