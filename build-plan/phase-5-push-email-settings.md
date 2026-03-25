# Phase 5: Push Email System + Settings

**Goal:** The Monday morning email is live — the real front door of the product. Users receive a weekly email with their highest-priority insight and a dollar figure. Settings page allows basic profile edits and account management.

**Estimated effort:** 2-3 days

**Depends on:** Phase 3 (insights generated, pg_cron running), Phase 4 (briefing screen exists for email CTA deep links)

---

## 5.1 Resend Integration

### Setup
- Resend account + API key (already in Supabase secrets from Phase 1)
- Verify sending domain (or use Resend's default for dev/testing)
- Create email templates (HTML + plain text fallback)

### `send-weekly-email` Edge Function

```
POST /functions/v1/send-weekly-email
Body: { company_id?: string }  // optional — if omitted, sends to all eligible companies
Returns: { sent: number, skipped: number, errors: string[] }
```

**Process:**
1. If no `company_id`, query all companies with `onboarding_complete = true`
2. For each company:
   a. Fetch the highest-priority `new` insight (skip if none)
   b. Fetch 3 KPIs (same as briefing: revenue this week, jobs completed, avg ticket)
   c. Render the email template
   d. Send via Resend API
   e. Log success/failure
3. Return summary

**Skip conditions:**
- No insights with status `new` → skip (nothing actionable to send)
- Company has < 30 jobs → skip (insights aren't reliable yet)
- User has explicitly opted out of emails (future — not in V1, but leave the hook)

### pg_cron Schedule
```sql
-- Monday mornings at 8:00 AM EST (13:00 UTC)
select cron.schedule(
  'weekly-email',
  '0 13 * * 1',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-weekly-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## 5.2 Email Template

### Design
- Clean, minimal HTML email
- Dark navy header bar with Cadence Trades logo/wordmark
- White/light body for readability in email clients
- Amber CTA buttons

### Content Structure

```
SUBJECT: "Josh, you left $1,050 on the table last month"
(Dynamic — uses first name + estimated_impact from top insight)

---

[Header: Cadence Trades logo]

Morning, Josh.

Here's your weekly briefing for ABC Backflow Testing.

YOUR NUMBERS THIS WEEK
┌─────────────────────────────┐
│ Revenue:     $3,250 (+12%)  │
│ Jobs:        18 (+3)        │
│ Avg Ticket:  $180           │
└─────────────────────────────┘

THIS WEEK'S TOP RECOMMENDATION

[Insight type badge]
[Insight title]

[Insight summary — 2-3 sentences]

Estimated impact: $1,050/month
[CTA button: "See the full plan →"]

---

[Footer]
Cadence Trades — Your AI business coach
[Unsubscribe link]  |  [Open in app]
```

### CTA Deep Link
"See the full plan" links to: `https://app.cadencetrades.com/?insight={insight_id}`

The briefing page should handle this query param:
- If `insight_id` is present, auto-expand that insight's action plan
- Generate the action plan if not already generated

### Email Variants
- **Has insights:** Full template above
- **No new insights but has data:** "Things are steady this week. Your numbers: [KPIs]. Keep logging jobs — we'll flag opportunities as we spot them."
- Don't send if there's truly nothing to show

### Plain Text Fallback
Every HTML email must have a plain text version for clients that don't render HTML.

---

## 5.3 Email Tracking (Minimal)

Resend provides basic analytics (delivered, opened, clicked). For V1, don't build custom tracking — just monitor Resend's dashboard to validate the success criteria:
- Are emails being delivered?
- Are they being opened?
- Are CTAs being clicked?

Store a record per send for audit:
```sql
-- Optional: add to schema if we want in-app tracking
create table email_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  email_type text not null,         -- 'weekly_briefing'
  insight_id uuid references insights,
  sent_at timestamptz default now(),
  resend_id text                    -- Resend message ID for tracking
);
```

This table is optional for V1 but useful for debugging and for measuring the success criteria ("opens at least 2 push notifications per week").

---

## 5.4 Settings Page

### Sections

**Company Profile**
- Edit all onboarding fields (Steps 1-4)
- Same form components as onboarding, pre-populated with current values
- Save button updates `company_profiles`

**Account**
- Display current email
- Change password (via Supabase Auth `updateUser`)
- Email preferences: toggle for weekly email (on by default, off disables `send-weekly-email` for this user) — store as a field on `company_profiles` or a separate `user_preferences` table

**Danger Zone**
- "Delete my account and all data" button
- Confirmation dialog: "This will permanently delete your company profile, all imported data, insights, and conversation history. This cannot be undone."
- On confirm: cascade delete all company data, then delete Supabase Auth user
- Redirect to marketing/login page

### UX
- Organized in card sections with clear headings
- Danger zone visually separated (red border or warning color)
- Save confirmation via toast notifications

---

## Phase 5 Completion Criteria

- [ ] `send-weekly-email` Edge Function sends emails via Resend
- [ ] pg_cron triggers email send every Monday at 8 AM EST
- [ ] Email template: personalized greeting, 3 KPIs, top insight with dollar impact
- [ ] CTA deep links to briefing with insight auto-expanded
- [ ] Plain text email fallback works
- [ ] Skip logic: no email for companies with no insights or < 30 jobs
- [ ] Settings page: edit company profile
- [ ] Settings page: change password
- [ ] Settings page: email preference toggle
- [ ] Settings page: delete account with confirmation
- [ ] Email log records each send (optional but recommended)
- [ ] Test email delivery: send to founder's email and verify rendering

---

## Dependencies for Next Phase
Phase 6 (Polish + Deploy) requires:
- All core features working (Phases 1-5)
- Domain and hosting accounts ready
