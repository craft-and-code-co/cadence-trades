# Phase 4: Weekly Briefing + Coach Chat

**Goal:** The two core user-facing screens are live. User opens the app and sees their weekly briefing with KPIs and insight cards. User can open coach chat and have a data-aware conversation about their business. This is the product — everything else is infrastructure or distribution.

**Estimated effort:** 4-5 days

**Depends on:** Phase 3 (insights in DB, knowledge base searchable, metrics computable)

---

## 4.1 Weekly Briefing Screen (Home)

### Layout (top to bottom)

**Greeting Header**
```
"Morning, Josh. Here's what's happening with ABC Backflow."
```
- Time-of-day aware: "Morning" / "Afternoon" / "Evening"
- Pull name from company profile

**Data Health Banner** (conditional)
- Show if last data import/sync > 7 days: "Your data is X days old. [Import updated file]"
- Show if jobs < 30: "You have X jobs logged. Add more data to unlock personalized insights."
- Amber warning style, dismissible

**KPI Row — 3 Cards**
| KPI | Calculation | Comparison |
|---|---|---|
| Revenue this week | Sum `total_revenue` for jobs in last 7 days | vs. prior 7 days, show +/- % |
| Jobs completed | Count jobs in last 7 days | vs. prior 7 days |
| Average ticket | Avg `total_revenue` for last 30 days | vs. 90-day average |

- Cards use the dark navy background with amber accent for positive trends, muted red for negative
- If insufficient data for comparison, show "—" instead of a delta

**Insight Cards (1-2 max)**
- Pull highest-priority `new` insights from `insights` table
- Each card shows:
  - Insight type badge (pricing, staffing, seasonal, etc.)
  - Title
  - Estimated impact in dollars (bold, prominent)
  - Summary (2-3 sentences max)
  - Primary CTA: "See the plan" → generates action plan via `generate-insight` if not already generated, then shows it in an expandable panel or modal
  - Secondary: "Dismiss" (sets `status = 'dismissed'`, `dismissed_at = now()`)
  - Secondary: "Ask the coach about this" → opens Coach chat with the insight pre-loaded as context

**Empty State** (no insights yet)
```
"We're crunching your numbers. Check back soon — or add more data to speed things up."
```
With CTA to import data or enter jobs manually.

### Data Fetching
- KPIs: single SQL query aggregating from `jobs` table for the current company
- Insights: fetch top 2 from `insights` where `company_id = X` and `status = 'new'` ordered by priority, created_at desc
- Use React Query or SWR for caching + revalidation
- "Refresh insights" button triggers `analyze-data` Edge Function for this company (with loading state)

### Insight Action Plan Panel
When user clicks "See the plan":
1. Check if `action_plan` is already populated on the insight
2. If not, call `generate-insight` Edge Function (show loading: "Building your action plan...")
3. Display the markdown action plan in an expandable panel below the insight card
4. "Mark as in progress" button (sets `status = 'in_progress'`)

---

## 4.2 Coach Chat Page

### Chat Interface

**Layout:**
- Left sidebar: conversation thread list (scrollable, newest first)
- Right: active conversation messages
- Bottom: message input with send button
- Top: "New conversation" button + current thread topic

**Thread Management:**
- New conversation creates a row in `coach_conversations`
- Each message creates a row in `coach_messages`
- Thread topic auto-set from first user message (first 50 chars or LLM-generated summary)
- Conversations listed by `updated_at` desc

**Message Display:**
- User messages: right-aligned, amber/gold background
- Assistant messages: left-aligned, dark card background, markdown rendered
- Timestamps shown on hover or below each message
- Loading indicator while waiting for AI response: "Cadence is thinking..." with typing animation

### `coach-chat` Edge Function

```
POST /functions/v1/coach-chat
Body: {
  company_id: string,
  conversation_id: string,
  message: string
}
Returns: {
  response: string,
  sources: Array<{ title: string, category: string }>
}
```

**RAG Flow (every message):**
1. Save user message to `coach_messages`
2. Embed the user message via `text-embedding-3-small` (OpenRouter)
3. Call `match_knowledge_documents()` with:
   - `query_embedding`: the message embedding
   - `match_threshold`: 0.7
   - `match_count`: 5
   - `filter_trade`: company's trade (from profile)
4. Fetch the company profile
5. Fetch active insights for this company (summary only — type, title, estimated_impact)
6. Fetch recent conversation history from `coach_messages` (last 20 messages for this conversation)
7. Assemble the system prompt (as specified in V1 spec)
8. Call `anthropic/claude-sonnet-4-5` via OpenRouter with:
   - System prompt (company profile + insights + RAG chunks)
   - Message history (last 20 messages)
   - New user message
9. Save assistant response to `coach_messages`
10. Return response + source titles (for optional "Sources" disclosure)

**System Prompt:**
As specified in V1 spec — includes company profile, active insight summaries, and retrieved RAG chunks with source labels.

**Context Window Management:**
- Last 20 messages from the conversation (sufficient for V1)
- If conversation is very long, summarize older messages (V2 optimization)
- RAG chunks: top 5 at ~500 tokens each = ~2,500 tokens of KB context
- Company profile: ~500 tokens
- Insight summaries: ~500 tokens
- Total context budget: ~5,000 tokens of injected context + conversation history

### "Ask the coach about this" Flow
When triggered from an insight card on the briefing:
1. Create a new conversation with topic = insight title
2. Pre-populate with a system message or first user message: "Tell me more about this insight: [insight title]. [insight summary]"
3. Navigate to coach page with this conversation active
4. AI responds with deeper analysis tied to the specific insight

### Source Attribution (Optional, Nice-to-Have)
- Show a collapsible "Sources" section below AI responses
- Lists the KB document titles that were retrieved for this response
- Builds trust: "This advice is based on: Flat Rate Pricing Strategy, When to Raise Prices"

---

## 4.3 Shared Components

### InsightCard Component
Used on both Briefing and in Coach chat context. Props:
- `insight`: Insight object
- `onViewPlan`: callback
- `onDismiss`: callback
- `onAskCoach`: callback
- `compact`: boolean (for smaller rendering in lists)

### KPICard Component
- `label`: string
- `value`: number | string
- `delta`: number | null (% change)
- `trend`: 'up' | 'down' | 'flat' | null
- Amber for positive, muted red for negative, gray for flat/null

### MarkdownRenderer Component
- Renders markdown from AI responses
- Supports: headings, lists, bold/italic, code blocks, checklists
- Styled to match the dark navy + amber design system

---

## Phase 4 Completion Criteria

- [ ] Briefing screen shows time-of-day greeting with company name
- [ ] 3 KPI cards display with correct calculations and deltas
- [ ] Top 1-2 insight cards display with type, title, impact, summary
- [ ] "See the plan" generates and displays action plan
- [ ] "Dismiss" removes insight from briefing
- [ ] "Ask the coach about this" opens coach with insight context
- [ ] Data health banner shows when data is stale or below threshold
- [ ] Empty states render correctly when no insights or insufficient data
- [ ] Coach chat: user can send messages and receive AI responses
- [ ] AI responses reference the company's actual data (not generic)
- [ ] RAG retrieval working: responses draw on knowledge base content
- [ ] Conversation threads persist and are listable
- [ ] New conversation creation works
- [ ] Markdown rendering in chat messages
- [ ] Loading states for AI calls ("Cadence is thinking...")
- [ ] "Refresh insights" button triggers re-analysis

---

## Dependencies for Next Phase
Phase 5 (Push Email) requires:
- Insights being generated (Phase 3)
- Resend API key configured (Phase 1)
- pg_cron running (Phase 3)
