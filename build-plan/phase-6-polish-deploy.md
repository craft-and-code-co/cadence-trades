# Phase 6: Polish, Empty States, Error Handling + Deploy

**Goal:** Production-ready. Every edge case has a graceful UX. Deployed to Cloudflare Pages + Supabase production. The founder can onboard Josh.

**Estimated effort:** 3-4 days

**Depends on:** Phases 1-5 complete

---

## 6.1 Empty States

Every screen needs a considered empty state. These are not error pages — they're guidance moments.

### Briefing — No Data Yet
```
Welcome to Cadence, Josh.

We need some data before we can start coaching.
Import your job history or start logging jobs manually.

[Import CSV]  [Enter jobs manually]
```

### Briefing — Data Imported, < 30 Jobs
```
You've got {X} jobs logged. We need at least 30 to start
generating specific insights for your business.

Keep adding data — we'll crunch the numbers as soon as we can.

Progress: ████████░░░░ {X}/30 jobs
[Import more data]
```

### Briefing — Data Imported, No Insights Yet
```
We're analyzing your data now.
Check back in a few minutes — or refresh to see if your insights are ready.

[Refresh insights]
```

### Briefing — All Insights Dismissed
```
You've reviewed all current insights. Nice work.
We'll generate new ones as more data comes in.
```

### Coach — No Conversations Yet
```
This is your AI business coach.
Ask anything about your business — pricing, hiring, marketing, growth.
Every answer is based on your actual data.

Try: "Am I charging enough for my services?"
     "How do I prepare for slow season?"
     "Should I start a membership program?"
```

### Coach — Insufficient Data for Meaningful Responses
If company has < 30 jobs, coach should still work but caveat its responses:
- Inject into system prompt: "This company has limited data ({X} jobs). Acknowledge this limitation in your responses and base advice more heavily on the knowledge base and industry benchmarks rather than company-specific data."

---

## 6.2 Loading States

AI calls take 3-15 seconds. Loading states must feel intentional, not broken.

### Insight Generation
```
Analyzing your last 90 days...
[Progress bar or animated dots]
```

### Action Plan Generation
```
Building your action plan...
[Progress bar or animated dots]
```

### Coach Chat
```
Cadence is thinking...
[Typing indicator animation — 3 animated dots]
```

### Data Import
```
Importing {X} jobs...
[Progress bar with percentage]
```

### KPI Calculation
- Skeleton cards (gray shimmer animation) while KPIs load
- No spinner — use skeleton loading patterns

---

## 6.3 Error Handling

### Network Errors
- Toast notification: "Something went wrong. Please try again."
- Retry button where applicable
- Don't show stack traces or technical error messages

### AI Call Failures
- If `analyze-data` fails: "We couldn't generate insights right now. We'll try again automatically."
- If `coach-chat` fails: "Cadence couldn't respond. Try sending your message again." + retry button
- If `generate-insight` fails: "Couldn't build the action plan. Try again in a moment."
- All failures logged to Edge Function logs for debugging

### CSV Import Errors
- Validation errors shown inline during the mapping/validation step (Phase 2)
- If the import itself fails: "Import failed. Your data wasn't saved. [Try again]"
- Raw CSV preserved in Storage so user doesn't have to re-upload

### Auth Errors
- Invalid credentials: "Email or password is incorrect."
- Email not confirmed: "Check your email for a confirmation link."
- Session expired: redirect to login with message "Your session expired. Please sign in again."
- Password reset errors: "We couldn't send a reset email. Check the address and try again."

### Data Threshold Messaging
Consistent language everywhere the 30-job threshold matters:
- "We need at least 30 jobs with dates and revenue to generate specific insights. You have {X} so far."
- Show on: briefing empty state, after CSV import, in coach responses

---

## 6.4 Responsive Design

Desktop-primary, but responsive. Test at:
- Desktop: 1440px, 1280px, 1024px
- Tablet: 768px (iPad)
- Mobile: 375px (iPhone SE), 390px (iPhone 14)

### Sidebar
- Desktop: fixed left sidebar, always visible
- Tablet: collapsible sidebar with hamburger toggle
- Mobile: bottom navigation bar (3 items: Briefing, Coach, Settings)

### Briefing
- KPI cards: 3-column on desktop, stack on mobile
- Insight cards: full-width on all sizes

### Coach Chat
- Desktop: sidebar (threads) + main (messages) side by side
- Mobile: thread list as a separate view, tap to enter conversation

---

## 6.5 Final Design Polish

### Color System Verification
- Dark navy base: all backgrounds, cards, sidebar
- Amber/gold accent: CTAs, positive trends, active states
- Muted red: negative trends, danger zone, errors
- Neutral grays: secondary text, borders, disabled states
- White: text on dark backgrounds, input fields

### Typography
- Confirm font selection — something with weight (Inter, Plus Jakarta Sans, or similar)
- Heading hierarchy clear and consistent
- Body text readable at all sizes

### Micro-interactions
- Button hover/active states
- Card hover elevation or border glow
- Smooth transitions on sidebar collapse
- Toast notifications: slide in from top-right, auto-dismiss after 5s

---

## 6.6 Production Deployment

### Cloudflare Pages
1. Connect GitHub repo to Cloudflare Pages
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js version: 18+
3. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Custom domain: configure when ready (e.g., `app.cadencetrades.com`)
5. Verify `_redirects` file works for SPA routing

### Supabase Production
1. Create production Supabase project (if using separate dev/prod)
2. Run all migrations against production
3. Enable pgvector and pg_cron extensions
4. Set Edge Function secrets:
   - `OPENROUTER_API_KEY`
   - `RESEND_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for pg_cron → Edge Function calls)
5. Configure pg_cron jobs:
   - `daily-analyze`: daily at 5 AM UTC
   - `weekly-email`: Monday at 1 PM UTC (8 AM EST)
6. Seed knowledge base: run `seed-knowledge.ts` against production
7. Seed market benchmarks for HVAC, Plumbing, Electrical, Backflow
8. Verify RLS policies work correctly in production

### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      # Cloudflare Pages handles deploy via GitHub integration
      # Supabase migrations: run manually or via supabase CLI in CI
```

### Pre-Launch Checklist
- [ ] Sign up flow works end-to-end in production
- [ ] Onboarding completes and saves to DB
- [ ] CSV import works with real Jobber export data
- [ ] Insights generate for a test company with 30+ jobs
- [ ] Coach chat returns data-aware responses
- [ ] Weekly email sends and renders correctly
- [ ] Email CTA deep link opens the app and shows the right insight
- [ ] Settings: edit profile, change password, delete account all work
- [ ] RLS: user A cannot see user B's data
- [ ] No API keys exposed in client bundle (check network tab)
- [ ] Error states render gracefully (disconnect network, test)
- [ ] Mobile responsive: all 3 screens usable on phone
- [ ] Performance: briefing loads in < 3s, coach responds in < 15s

---

## 6.7 Founder Onboarding Prep

Before putting Josh on the product:

1. **Test with real data:** Import actual Jobber CSV export from a test account
2. **Verify insight quality:** Are the dollar projections reasonable? Do they reference real data points?
3. **Test the email:** Send a test weekly email, check rendering in Gmail/Apple Mail/Outlook
4. **Prepare fallback:** If something breaks during Josh's first session, founder should be on a call to troubleshoot
5. **Feedback mechanism:** Simple way for Josh to say "this is wrong" or "this helped" — even just a reply-to email address works for V1

---

## Phase 6 Completion Criteria

- [ ] All empty states implemented and rendering correctly
- [ ] All loading states implemented (no raw spinners)
- [ ] All error states handled with user-friendly messages
- [ ] Responsive design verified at desktop, tablet, and mobile breakpoints
- [ ] Design system consistent across all screens
- [ ] Cloudflare Pages deployed and serving the app
- [ ] Supabase production configured with all migrations, extensions, secrets
- [ ] pg_cron jobs running in production
- [ ] Knowledge base + benchmarks seeded in production
- [ ] GitHub Actions CI/CD pipeline working
- [ ] Pre-launch checklist passed
- [ ] Test email sent and verified in multiple clients
- [ ] RLS verified: data isolation between companies
- [ ] No client-exposed secrets
- [ ] Ready for founder to onboard Josh
