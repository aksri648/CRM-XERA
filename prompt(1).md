# Xeno AI — Full-Stack Build Prompt (MERN + CrewAI)
## AI-Native Mini CRM for Campaign Intelligence

> **Target agent**: Claude Code / Cursor / Windsurf
> **Read this ENTIRE file before writing a single line of code.**
> Every section is a binding contract. Do not invent unlisted features. Do not skip described ones.
> All code is JavaScript/TypeScript unless explicitly noted. Python is used ONLY for the CrewAI agent service.

---

## 0. Stack Decisions & Rationale

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite + ShadCN + Tailwind CSS | Component ecosystem + fast HMR |
| Backend (Core) | Node.js + Express.js | MERN uniformity, fast REST APIs |
| Database | MongoDB + Mongoose | Flexible schema for campaign/customer data |
| Auth | Clerk (`@clerk/clerk-react` + `@clerk/express`) | Managed auth, Google OAuth, JWT |
| AI Agents | Python + CrewAI framework | Multi-agent orchestration with custom LLM |
| LLM | Custom OpenAI-compatible endpoint | Via `CUSTOM_LLM_BASE_URL` + `CUSTOM_LLM_API_KEY` |
| Channel Service | Node.js + Express.js | JS mock callback service |
| Agent–Backend Bridge | HTTP REST (Express ↔ CrewAI FastAPI) | Clean separation |

---

## 1. Monorepo Structure

```
xeno-crm/
│
├── frontend/                          # React + Vite + ShadCN
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── lib/
│   │   │   ├── api.js                 # axios instance + Clerk JWT interceptor
│   │   │   └── utils.js
│   │   ├── hooks/
│   │   │   ├── useApi.js              # generic data-fetching hook
│   │   │   └── useSSE.js              # SSE streaming hook for agent responses
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── AppLayout.jsx
│   │   │   ├── ui/                    # ShadCN auto-generated components
│   │   │   ├── AICommandCentre.jsx    # floating modal
│   │   │   ├── AgentResponseRenderer.jsx  # renders structured JSON from agents
│   │   │   ├── FunnelChart.jsx        # Recharts campaign funnel
│   │   │   ├── StatusBadge.jsx
│   │   │   └── CustomerCard.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── AIStudio.jsx
│   │       ├── Opportunities.jsx
│   │       ├── AgentProposals.jsx
│   │       ├── Customers.jsx
│   │       ├── Segments.jsx
│   │       ├── Campaigns.jsx
│   │       ├── CampaignDetail.jsx
│   │       ├── ABTests.jsx
│   │       ├── Analytics.jsx
│   │       ├── PipelineMonitor.jsx
│   │       └── Settings.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── components.json                # ShadCN config
│   └── package.json
│
├── backend/                           # Node.js + Express (Core App Service)
│   ├── src/
│   │   ├── index.js                   # Express app entry point
│   │   ├── db.js                      # Mongoose connection
│   │   ├── middleware/
│   │   │   ├── auth.js                # Clerk JWT verification middleware
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── Customer.js
│   │   │   ├── Order.js
│   │   │   ├── Segment.js
│   │   │   ├── Campaign.js
│   │   │   ├── Communication.js
│   │   │   ├── ABTest.js
│   │   │   ├── Opportunity.js
│   │   │   ├── AgentProposal.js
│   │   │   ├── PipelineEvent.js
│   │   │   └── Settings.js
│   │   ├── routes/
│   │   │   ├── customers.js
│   │   │   ├── orders.js
│   │   │   ├── segments.js
│   │   │   ├── campaigns.js
│   │   │   ├── receipts.js            # ← CRITICAL: callback ingestion from channel service
│   │   │   ├── analytics.js
│   │   │   ├── abTests.js
│   │   │   ├── opportunities.js
│   │   │   ├── proposals.js
│   │   │   ├── pipeline.js
│   │   │   ├── settings.js
│   │   │   └── agent.js               # proxies to CrewAI service, streams SSE back
│   │   └── services/
│   │       ├── segmentation.js        # filter_rules → MongoDB query
│   │       ├── campaignLauncher.js    # sends to channel service
│   │       └── pipelineLogger.js     # writes PipelineEvent documents
│   ├── scripts/
│   │   └── seed.js                    # seed 10k customers + 30k orders
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── agent-service/                     # Python + CrewAI (AI Agent Service)
│   ├── main.py                        # FastAPI app, port 8001
│   ├── crew/
│   │   ├── __init__.py
│   │   ├── llm_config.py              # custom OpenAI-compatible LLM setup
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── intent_classifier.py
│   │   │   ├── data_analyst.py
│   │   │   ├── segment_builder.py
│   │   │   ├── message_composer.py
│   │   │   ├── campaign_dispatcher.py
│   │   │   ├── insights_reporter.py
│   │   │   └── opportunity_scanner.py
│   │   └── crews/
│   │       ├── campaign_crew.py       # orchestrates agents for campaign creation
│   │       ├── insights_crew.py
│   │       └── opportunity_crew.py
│   ├── schemas/
│   │   └── responses.py               # Pydantic schemas for all agent JSON outputs
│   ├── requirements.txt
│   └── Dockerfile
│
├── channel-service/                   # Node.js + Express (Mock Channel Service)
│   ├── src/
│   │   ├── index.js
│   │   ├── simulator.js               # weighted outcome engine
│   │   └── index.js                  # request handler + delivery simulation
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 2. Environment Variables

### Root `.env.example`
```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/xenocrm

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Custom LLM (OpenAI-compatible)
CUSTOM_LLM_BASE_URL=https://your-llm-provider.com/v1
CUSTOM_LLM_API_KEY=your-api-key-here
CUSTOM_LLM_MODEL=your-model-name

# Service URLs
CHANNEL_SERVICE_URL=http://localhost:8002
AGENT_SERVICE_URL=http://localhost:8001
CORE_BACKEND_URL=http://localhost:8000
RECEIPT_CALLBACK_URL=http://localhost:8000/api/receipts/callback

# Frontend
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## 3. Design System & Visual Language

### Color Tokens (use in `tailwind.config.js` as custom colors)
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0f1923',
          active: '#1a2d3d',
          text: '#cbd5e1',
        },
        xeno: {
          teal: '#0fd4b4',
          'teal-hover': '#0bbfa1',
        }
      }
    }
  }
}
```

### CSS Variables in `index.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --color-sidebar-bg:       #0f1923;
  --color-sidebar-active:   #1a2d3d;
  --color-accent-teal:      #0fd4b4;
  --color-accent-hover:     #0bbfa1;
  --color-main-bg:          #f9fafb;
  --color-card-bg:          #ffffff;
  --color-text-primary:     #111827;
  --color-text-secondary:   #6b7280;
  --color-text-sidebar:     #cbd5e1;
  --color-border:           #e5e7eb;
  --color-success:          #10b981;
  --color-warning:          #f59e0b;
  --color-danger:           #ef4444;
  --color-info:             #3b82f6;
}

body { font-family: 'Inter', sans-serif; }
```

### Layout Rules
- **Sidebar**: `fixed left-0 top-0 h-screen w-[260px] bg-[#0f1923] z-40 flex flex-col`
- **Main content**: `ml-[260px] min-h-screen bg-gray-50 p-6`
- **Cards**: `bg-white rounded-xl shadow-sm border border-gray-100`
- **Primary button**: `bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-2 font-medium transition-colors`
- **Outline button**: `border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2`

---

## 4. Sidebar Navigation (`components/layout/Sidebar.jsx`)

### Structure
```
┌─────────────────────────────────┐
│  [X]  Xeno AI                   │  ← teal 32px square with X + bold white text
├─────────────────────────────────┤
│  MAIN                           │  ← section label: text-[10px] uppercase tracking-widest text-slate-500
│  📊  Dashboard                  │
│  ✦   AI Campaign Studio  [New]  │  ← [New] = teal pill badge
│  💡  Opportunities        [5]   │  ← count = grey pill badge, number from API
│  🤖  Agent Proposals      [3]   │  ← count = grey pill badge, number from API
├─────────────────────────────────┤
│  AUDIENCE                       │
│  👥  Customers                  │
│  🗂  Segments                   │
├─────────────────────────────────┤
│  ENGAGE                         │
│  📣  Campaigns                  │
│  🧪  A/B Tests                  │
├─────────────────────────────────┤
│  ANALYZE                        │
│  📈  Analytics                  │
│  🔄  Pipeline Monitor           │
├─────────────────────────────────┤
│  SYSTEM                         │
│  🤖  AI Command Centre  [Live●] │  ← [Live] = green pill with animated pulse dot
│  ⚙️  Settings                   │
├─────────────────────────────────┤
│  [A]  Admin              [→]    │  ← avatar + name + logout
│       Admin                     │
└─────────────────────────────────┘
```

### Behavior Rules
- Active route: `bg-[#1a2d3d] text-white border-l-2 border-[#0fd4b4]`
- Inactive: `text-slate-300 hover:bg-white/5` transition
- "AI Command Centre" click → does NOT route anywhere, opens `<AICommandCentre />` modal overlay
- "Live" badge: `bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full` with `<span className="animate-pulse">●</span>`
- Opportunity + Proposal counts: fetched from `/api/opportunities/count` and `/api/proposals/count` on sidebar mount

---

## 5. Page Specifications

---

### 5.1 Login Page (`/login`)

**Route guard**: All pages wrapped in `<ClerkProvider>`. Non-authenticated users → redirect to `/login`. Use `<SignedIn>` / `<SignedOut>` + `useAuth()` hook.

**Layout**: `min-h-screen bg-[#0f1923] flex flex-col items-center justify-center`

**Top section** (above card):
- Teal 48px square div with white "X" text (font-bold text-2xl) + `rounded-xl`
- "Xeno AI" — `text-white text-3xl font-bold ml-3`
- "Campaign Intelligence Platform" — `text-slate-400 text-sm mt-1`

**White card** (`bg-white rounded-2xl p-8 w-[420px] shadow-xl`):
- Use Clerk's `<SignIn />` component with appearance overrides matching the card design
- OR implement custom form calling Clerk's `signIn.create()` methods:
  - Title: "Sign in to My Application" — `text-xl font-semibold`
  - Subtitle: "Welcome back! Please sign in to continue" — `text-sm text-gray-500`
  - "Continue with Google" button — full width, Google SVG icon, outlined style
  - "or" divider
  - Email input — ShadCN `<Input>` component
  - "Continue ▶" button — full width, dark bg (`bg-gray-900 text-white`)
  - "Don't have an account? Sign up" link — `text-sm text-[#0fd4b4]`

---

### 5.2 Dashboard (`/`)

**Header row**: "Dashboard" h1 + subtitle "Overview of your campaign engagement performance" + right side: `<Import />` outline button + `<New Campaign />` teal button (rocket icon).

**Quick Action Grid** (`grid grid-cols-4 gap-4 mt-6`):
Each card `cursor-pointer hover:shadow-md transition-shadow` onClick navigates:
| # | Title | Subtitle | Icon Color | Navigates To |
|---|---|---|---|---|
| 1 | Import Data | Upload customers & orders | blue | /customers (opens import modal) |
| 2 | Build Segment | Create audience segments | purple | /segments |
| 3 | Launch Campaign | Send personalized messages | green | /campaigns (opens create modal) |
| 4 | View Insights | Analyze performance | yellow | /analytics |

**KPI Cards** (`grid grid-cols-4 gap-4 mt-4`):
Fetched from `GET /api/analytics/overview`:
| Field | Icon | Trend Format |
|---|---|---|
| `total_customers` | people (blue) | `+12.5%` green |
| `active_campaigns` | megaphone (teal) | `+2 this week` green |
| `messages_sent` | send arrow (purple) | `+12.3%` green |
| `revenue_attributed` | $ (yellow) | `+5.4%` green |

Trend: `<TrendArrow />` component: `↑ +X%` in `text-green-500 text-sm flex items-center gap-1`

**Recent Campaigns Table**:
Fetched from `GET /api/campaigns?limit=5&sort=-createdAt`:
Columns: CAMPAIGN | CHANNEL | SEGMENT | STATUS | SENT | OPEN RATE | CLICK RATE | REVENUE
- Channel badge colors: whatsapp=`bg-green-100 text-green-700` | email=`bg-blue-100 text-blue-700` | sms=`bg-yellow-100 text-yellow-700` | rcs=`bg-purple-100 text-purple-700`
- Status badge: draft=`bg-gray-100 text-gray-600` | running=`bg-blue-100 text-blue-600` | completed=`bg-green-100 text-green-700`
- Row hover: `hover:bg-gray-50 cursor-pointer` → navigate to `/campaigns/:id`
- "View All →" link top-right of section

---

### 5.3 AI Campaign Studio (`/ai-studio`)

**Header**: "AI Campaign Studio" h1 + subtitle "Describe your marketing goal and let AI build the campaign"

**Empty state** (shown before first message):
- Center of page, `flex flex-col items-center justify-center gap-4`
- Large animated sparkle icon (teal, `animate-pulse` subtle, 64px)
- `h2`: "What marketing goal would you like to achieve?"
- `p`: "Describe your objective and Xeno AI will generate a complete campaign strategy including audience, channels, messaging, and A/B tests."
- Suggestion pills (flex wrap justify-center gap-2):
  - "Loyal Customers" | "Inactive High-Value Customers" | "Reactivation Prospects" | "VIP Segment" | "New Customers"
  - Clicking pill: pre-fills input + auto-submits

**Chat thread** (appears after first message, scrollable):
- User messages: right-aligned, `bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]`
- AI messages: left-aligned, `bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]` with teal robot avatar
- Streaming text: characters appear progressively via SSE
- After text, agent may emit structured JSON cards (see §8 for rendering rules)

**Input bar** (sticky bottom, `bg-white border-t border-gray-200 p-4`):
- ShadCN `<Input>` full width placeholder "Describe your marketing goal..."
- Teal send button (paper plane icon) right side
- Disabled + spinner while agent is processing

**Session management**: Each page load = new `session_id` (UUID generated client-side). Sent with every message to `POST /api/agent/chat`.

---

### 5.4 Opportunities (`/opportunities`)

**Header**: "Opportunities" + subtitle "AI-discovered marketing opportunities for your business". Right: "✦ Scan for Opportunities" outline button → calls `POST /api/opportunities/scan` → shows loading spinner for 3-5s.

**Opportunity cards** (stacked, `flex flex-col gap-4`):
Fetched from `GET /api/opportunities?status=active`:

Each card:
```
┌──────────────────────────────────────────────────────────┐
│  💡  [Title]                                             │
│                                                          │
│  Audience: [value or —]    Expected Revenue: ₹XX,XXX    │
│                                                          │
│  ▸ AI Reasoning                                          │
│    [reasoning text or "No reasoning available."]         │
│                                                          │
│  [Generate Campaign]  [Review Proposal]  [Dismiss]       │
└──────────────────────────────────────────────────────────┘
```
- "AI Reasoning" is a collapsible `<details>` element, teal `▸` indicator
- "Generate Campaign" → `POST /api/opportunities/:id/generate-campaign` → redirects to `/proposals`
- "Dismiss" → `PATCH /api/opportunities/:id/dismiss` → removes card with `opacity-0 h-0 overflow-hidden transition-all duration-300`

---

### 5.5 Agent Proposals (`/proposals`)

**Header**: "Agent Proposals" + subtitle "AI-generated campaign proposals awaiting your review"

**Proposal cards** (fetched from `GET /api/proposals?status=pending`):

Each card:
```
┌───────────────────────────────────────────────────────────┐
│  [Title]                               [Pending badge]    │
│  Channel: [badge]   Segment: [name]                       │
│                                                           │
│  Message preview (truncated 2 lines)                      │
│                                                           │
│  Confidence: ████████░░ 87%                               │
│                                                           │
│  ▸ AI Reasoning                                           │
│    [reasoning text]                                       │
│                                                           │
│  [Approve & Launch]          [Reject]                     │
└───────────────────────────────────────────────────────────┘
```
- Confidence bar: ShadCN `<Progress value={score * 100} />`
- "Approve & Launch" → `PATCH /api/proposals/:id/approve` → creates + launches campaign → shows success toast
- "Reject" → `PATCH /api/proposals/:id/reject` → card fades out
- Empty state: "No pending proposals. Ask the AI to suggest campaigns in AI Studio." with link.
- Error state: Show ShadCN `<Alert variant="destructive">` with retry button (NOT just red text)

---

### 5.6 Customers (`/customers`)

**Header**: "Customers" + subtitle showing live count "X total customers"

**Filter bar**:
- ShadCN `<Input>` full width: "Search by name, email, phone..." — debounced 300ms → refetches
- Pill filter tabs: All | Active | VIP | At Risk | New
  - Active: `border border-[#0fd4b4] text-[#0fd4b4]`
  - Tag maps to MongoDB `tags` field contains filter

**Customer grid** (`grid grid-cols-3 gap-4 mt-4`):
Fetched from `GET /api/customers?search=&tag=&page=1&limit=12`

Each `<CustomerCard />`:
```jsx
<div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md cursor-pointer transition-shadow">
  <div className="flex items-center gap-3 mb-3">
    <Avatar initials="VD" color="#3b82f6" />   // color derived from name hash
    <div>
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500">{email}</p>
    </div>
  </div>
  <div className="grid grid-cols-3 gap-2 text-center">
    <Metric label="LTV" value={`$${ltv}`} />
    <Metric label="Orders" value={totalOrders} />
    <Metric label="Last Order" value={lastOrderRelative} />  // "1mo", "3mo"
  </div>
</div>
```
- `Avatar` component: colored circle, 2-letter initials, color from a palette based on `name.charCodeAt(0) % 8`
- `lastOrderRelative`: compute days since last order → display as "Xd", "Xmo", "Xy"
- Clicking card → navigate to `/customers/:id`
- **Pagination**: ShadCN `<Pagination>` component at bottom

**Import modal** (opened from "Import" button on Dashboard OR header button):
- Drag-drop or file picker for CSV/JSON
- Preview first 5 rows in table
- "Import X customers" confirm button → `POST /api/customers/bulk`

---

### 5.7 Segments (`/segments`)

**Header** + "✦ AI Segment Builder" teal button + "+ Create Segment" outline button

**Tabs**: AI-Suggested | Manual Segments | Segment Builder

**AI-Suggested tab**:
- Section: "AI-Suggested Segments" + "✦ AI Powered" badge
- Subtitle: "Based on your customer data, our AI has identified these high-potential segments:"
- Cards with: name + description + `customer_count` badge + "Use" button
- Fetched from `GET /api/segments?created_by=agent`
- "Use" → creates segment copy for user, navigates to Campaigns create with pre-filled segment

**Manual Segments tab**:
- Table: Name | Filter Rules summary | Customers | Created | Actions(edit/delete)
- Fetched from `GET /api/segments?created_by=human`

**Segment Builder tab**:
- Dynamic rule builder:
  ```
  [field ▾] [operator ▾] [value input]  [✕ remove]
  [+ Add Rule]   [AND ◉  OR ○]
  ```
  - Fields: city | age | ltv | total_orders | last_order_days | gender | tags | category
  - Operators: > | < | = | >= | <= | contains | not_contains
- "Preview Segment" → `POST /api/segments/preview` → shows count + 3 sample customers inline
- "Save Segment" → `POST /api/segments`

---

### 5.8 Campaigns (`/campaigns`)

**Header** + "+ Create Campaign" teal button → opens create modal

**Campaign list** (fetched from `GET /api/campaigns?sort=-createdAt`):

Each campaign card:
```
┌──────────────────────────────────────────────────── [Draft/Running/Completed] ─┐
│  AI: VIP Segment Campaign        Channel: [WhatsApp]   Segment: [VIP Segment] │
│                                                                                 │
│  Sent: 1,234  Delivered: 1,100  Opened: 543  Clicked: 198  Conv: 42  Rev: ₹X │
└─────────────────────────────────────────────────────────────────────────────────┘
```
- "AI:" prefix if `created_by === "agent"`
- Clicking → navigate to `/campaigns/:id`
- Running campaigns: status badge `animate-pulse`

**Create Campaign Modal**:
- Name input
- Segment selector (dropdown from `GET /api/segments`)
- Channel selector (WhatsApp | SMS | Email | RCS) — pill buttons
- Message template textarea with `{name}` and `{brand}` substitution hint
- "Save as Draft" + "Launch Now" buttons

---

### 5.9 Campaign Detail (`/campaigns/:id`)

**Header**: Campaign name + status badge + back arrow
**Sub-header**: Channel badge + Segment name + Created date + "Launch" button (if draft)

**KPI row** (6 cards): Sent | Delivered | Opened | Clicked | Converted | Revenue

**Funnel chart** (`FunnelChart.jsx` using Recharts `BarChart`):
- X-axis: Sent → Delivered → Opened → Read → Clicked → Converted
- Bars: teal color, opacity decreasing per stage
- Updates via polling every 5s (`GET /api/campaigns/:id/stats`)

**Communications table** (`GET /api/campaigns/:id/communications?page=1`):
Columns: Customer Name | Channel | Status Badge | Message Preview | Sent At | Updated At
25 rows per page, pagination at bottom.

---

### 5.10 A/B Tests (`/ab-tests`)

**Header** + "✦ AI Generate Test" teal button + "Create Manual Test" outline button

**Test cards** (from `GET /api/ab-tests`):

Each card:
```
Summer Sale Offer Test   [🏆 A - Discount]                    [Completed]
┌─────────────────────────────────┬────────────────────────────────┐
│ A - Discount          [WINNER]  │ B - Urgency                    │
│ "Hey {name}! ☀️ Summer sale..." │ "LAST CALL! Summer sale ends.."│
│                                 │                                │
│ Open Rate:   72.5%              │ Open Rate:   68.2%             │
│ CTR:         22.3%              │ CTR:         18.7%             │
│ Conversion:   4.8%              │ Conversion:   3.9%             │
│ Revenue:    $12,345             │ Revenue:     $9,876            │
└─────────────────────────────────┴────────────────────────────────┘
```
- Winner variant panel: `border-2 border-[#0fd4b4]`
- Running tests: show live stats polling every 10s

---

### 5.11 Analytics (`/analytics`)

**Header** + subtitle "Campaign performance and engagement metrics"

**KPI row** (4 cards, from `GET /api/analytics/overview`):
Total Messages | Avg Delivery Rate | Avg Open Rate | Avg Conversion Rate

**Tabs**: Channel Performance | Top Campaigns | Campaign Funnel

**Channel Performance tab**:
Table: CHANNEL | SENT | DELIVERY RATE | OPEN RATE | CLICK RATE | CONVERSION
Fetched from `GET /api/analytics/channels`
Channel cell: colored pill badge (rcs=purple, sms=yellow, email=blue, whatsapp=green)

**Top Campaigns tab**:
Table sorted by revenue descending.
Columns: Campaign Name | Channel | Segment | Sent | Open Rate | Revenue

**Campaign Funnel tab**:
Recharts `FunnelChart` or `BarChart` showing aggregate totals across all campaigns.

---

### 5.12 Pipeline Monitor (`/pipeline`)

**Header** + "↻ Refresh" outline button → manual refetch

**Pipeline Status Bar** (`grid grid-cols-8 gap-3 bg-white rounded-xl border p-4`):
```
🚀                                        ✉️           ☑️           👁           👆          💰
Campaign                                  Sent         Delivered    Opened       Clicked     Converted
4 Active                                  45,678       44,170       27,562       8,832       1,855
```
- Fetched from `GET /api/pipeline/status`
- Auto-refreshes every 5s via `setInterval`
- Each stat: icon in `w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center` + label `text-xs text-gray-500` + value `text-xl font-bold`

**Two-column layout** below:

**Left: Event Timeline** (scrollable, `max-h-[480px] overflow-y-auto`):
Fetched from `GET /api/pipeline/events?limit=50`
Each event row:
```
○  10:32:15 AM
   Campaign Dispatched                              [Event]
   Summer Sale → WhatsApp Channel
```
- Timeline line: left vertical dashed border
- Badge colors: Event=gray | OK=green | Retry=orange | Failed=red
- Auto-polls every 5s

**Right: Delivery Stats panel**:
- Large teal number (total delivered)
- "Delivery Stats" label
- Row: Processing (blue large) | Pending (yellow large) | Retry (red large)

---

### 5.13 AI Command Centre (Floating Modal)

**Trigger**: Sidebar "AI Command Centre" click. Can also open via floating `?` bot button on any page (bottom-right corner).

**Overlay**: `fixed inset-0 bg-black/40 z-50 flex items-center justify-center`
**Modal**: `bg-white rounded-2xl shadow-2xl w-[680px] max-h-[80vh] flex flex-col`

**Header**:
- Teal 40px square robot icon (`rounded-xl bg-[#0fd4b4] flex items-center justify-center`)
- "AI Command Centre" bold + "System overview & assistant" grey subtitle
- X close button top-right

**System Status bar** (3 cells in a row inside modal):
Data from `GET /api/pipeline/status` (polled every 10s while modal open):
- WORKER: "Healthy" (or "Degraded")
- QUEUE: number
- ACTIVE RUNS: number

**Chat area** (flex-1, scrollable, `p-4 flex flex-col gap-3`):
- Initial greeting bubble (left, grey bg):
  "Hello, I am the Xeno AI Command Centre. I can help you monitor system activity, generate campaigns, discover opportunities, or answer questions about your CRM. How can I assist you?"
  Timestamp: bottom-right, `text-xs text-gray-400`

**Input**: sticky bottom, same as AI Studio input bar
Placeholder: "Ask about system status, campaigns, or customers..."

**Behavior**: Same SSE streaming + structured JSON card rendering as AI Studio. Session persists while modal is open (new session on each open).

---

### 5.14 Settings (`/settings`)

**Header**: "Settings" + subtitle "Configure your platform preferences"

**Sections** (separated by `<Separator />` ShadCN component):

**General**:
- Platform Name: `<Input defaultValue="Xeno AI Campaign Studio" />`
- Default Timezone: `<Select>` with timezones, default "Asia/Kolkata (IST, UTC +5:30)"
- Default Currency: `<Select>` options INR/USD/EUR, default "INR (₹)"

**Notifications** (4 toggle rows):
| Label | Description | Default |
|---|---|---|
| Telegram Bot Notifications | Receive proposal alerts via Telegram | ON |
| Campaign Completion Alerts | Notify when campaigns finish sending | ON |
| AI Opportunity Alerts | Get notified when new opportunities are discovered | ON |
| Weekly Digest Email | Receive a weekly performance summary | OFF |

Each row: label left, description below in grey, `<Switch />` right.

**AI Configuration**:
- AI Model: `<Select>` options matching what's in env (display names from `GET /api/settings`)
- Autonomous Scanning Schedule: `<Select>` — "Daily at 6:00 AM" | "Every 6 hours" | "Manual only"
- Auto-approve Low Risk Proposals: `<Switch>` — "Auto-approve proposals with confidence score > 95%" — default OFF

**Telegram Bot**:
- Bot Token: `<Input type="password" />`
- Chat ID: `<Input />`
- "Test Connection" outline button → `POST /api/settings/test-telegram` → toast success/error

**Footer**: sticky `bottom-0 bg-white border-t p-4 flex justify-end gap-3` — "Cancel" + "Save Changes" teal button → `PUT /api/settings` → success toast

---

## 6. Agent Response Renderer (`components/AgentResponseRenderer.jsx`)

This is a CRITICAL component. All AI agent responses return structured JSON. This component parses and renders them.

### Rendering Logic
```jsx
// AgentResponseRenderer receives: { type, data }
// Renders different card UI based on type

const AgentResponseRenderer = ({ events }) => {
  return events.map((event, i) => {
    switch (event.type) {
      case 'text':
        return <TextBubble key={i} content={event.content} />;

      case 'segment_proposal':
        return <SegmentProposalCard key={i} data={event.data} />;
        // Shows: name, description, filter_rules summary, estimated_count, [Use This Segment] button

      case 'message_proposal':
        return <MessageProposalCard key={i} data={event.data} />;
        // Shows: channel badge, variant A + variant B, [Use Variant A] [Use Variant B] buttons

      case 'campaign_proposal':
        return <CampaignProposalCard key={i} data={event.data} />;
        // Shows: segment name, channel, message preview, [Launch Campaign] [Edit] buttons

      case 'insight_report':
        return <InsightReportCard key={i} data={event.data} />;
        // Shows: metric cards, narrative text, chart data (pass to Recharts)

      case 'opportunity_list':
        return <OpportunityListCard key={i} data={event.data} />;
        // Shows: list of opportunity objects as cards with [Generate Campaign] buttons

      case 'error':
        return <ErrorCard key={i} message={event.message} />;

      case 'confirmation_required':
        return <ConfirmationCard key={i} data={event.data}
          onConfirm={() => confirmAction(event.data)}
          onReject={() => rejectAction(event.data)} />;
    }
  });
};
```

### SegmentProposalCard
```jsx
<div className="border border-[#0fd4b4] rounded-xl p-4 bg-teal-50/30">
  <div className="flex justify-between items-start">
    <div>
      <span className="text-xs font-semibold text-[#0fd4b4] uppercase">Proposed Segment</span>
      <h3 className="font-semibold text-gray-900 mt-1">{data.name}</h3>
      <p className="text-sm text-gray-600 mt-1">{data.description}</p>
      <p className="text-xs text-gray-500 mt-2">Rules: {data.filter_rules_summary}</p>
    </div>
    <span className="bg-teal-100 text-teal-700 rounded-full px-3 py-1 text-sm font-medium">
      {data.estimated_count} customers
    </span>
  </div>
  <button onClick={() => onUseSegment(data)} className="mt-3 btn-primary text-sm">
    Use This Segment
  </button>
</div>
```

### MessageProposalCard
```jsx
<div className="border border-gray-200 rounded-xl p-4 bg-white">
  <span className="text-xs font-semibold text-gray-500 uppercase">Message Variants</span>
  <div className="grid grid-cols-2 gap-3 mt-3">
    {[data.variant_a, data.variant_b].map((variant, i) => (
      <div key={i} className="border rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold">Variant {i === 0 ? 'A' : 'B'}</span>
          <ChannelBadge channel={variant.channel} />
        </div>
        <p className="text-sm text-gray-700">{variant.message}</p>
        <button onClick={() => onUseMessage(variant)} className="mt-2 btn-outline text-xs w-full">
          Use This
        </button>
      </div>
    ))}
  </div>
</div>
```

---

## 7. Backend — Node.js + Express (Port 8000)

### 7.1 Entry Point (`src/index.js`)
```js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(clerkMiddleware());  // attaches auth to req.auth

// Routes
app.use('/api/customers',    routes.customers);
app.use('/api/orders',       routes.orders);
app.use('/api/segments',     routes.segments);
app.use('/api/campaigns',    routes.campaigns);
app.use('/api/receipts',     routes.receipts);     // NO auth — called by channel service
app.use('/api/analytics',    routes.analytics);
app.use('/api/ab-tests',     routes.abTests);
app.use('/api/opportunities', routes.opportunities);
app.use('/api/proposals',    routes.proposals);
app.use('/api/pipeline',     routes.pipeline);
app.use('/api/settings',     routes.settings);
app.use('/api/agent',        routes.agent);

app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(8000, () => console.log('Backend running on :8000'));
});
```

### 7.2 Auth Middleware (`src/middleware/auth.js`)
```js
import { requireAuth } from '@clerk/express';

// Use on all routes EXCEPT /api/receipts/callback (called by channel service)
export const protect = requireAuth();

// Usage in routes: router.get('/', protect, handler)
```

### 7.3 MongoDB Schemas (`src/models/`)

#### Customer.js
```js
const CustomerSchema = new mongoose.Schema({
  name:          { type: String, required: true, index: true },
  email:         { type: String, required: true, unique: true, index: true },
  phone:         { type: String },
  city:          { type: String, index: true },
  gender:        { type: String, enum: ['male', 'female', 'other'] },
  age:           { type: Number },
  tags:          [{ type: String }],      // ["VIP", "loyal", "at_risk", "new"]
  ltv:           { type: Number, default: 0 },
  totalOrders:   { type: Number, default: 0 },
  lastOrderAt:   { type: Date },
  createdAt:     { type: Date, default: Date.now },
});
// Compound index for segment queries
CustomerSchema.index({ ltv: 1, lastOrderAt: 1, city: 1 });
```

#### Order.js
```js
const OrderSchema = new mongoose.Schema({
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  productName:  { type: String, required: true },
  category:     { type: String, enum: ['fashion', 'beauty', 'food', 'electronics', 'accessories'] },
  amount:       { type: Number, required: true },
  orderedAt:    { type: Date, default: Date.now },
});
```

#### Segment.js
```js
const FilterRuleSchema = new mongoose.Schema({
  field:    { type: String }, // ltv | age | city | last_order_days | total_orders | gender | tags | category
  operator: { type: String }, // gt | lt | eq | gte | lte | contains | not_contains
  value:    { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const SegmentSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  description:   { type: String },
  filterRules:   [FilterRuleSchema],
  logic:         { type: String, enum: ['AND', 'OR'], default: 'AND' },
  customerCount: { type: Number, default: 0 },  // cached, refreshed on preview
  createdBy:     { type: String, enum: ['human', 'agent'], default: 'human' },
  createdAt:     { type: Date, default: Date.now },
});
```

#### Campaign.js
```js
const CampaignSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  segmentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' },
  channel:         { type: String, enum: ['whatsapp', 'sms', 'email', 'rcs'], required: true },
  messageTemplate: { type: String, required: true },
  status:          { type: String, enum: ['draft', 'running', 'completed'], default: 'draft' },
  createdBy:       { type: String, enum: ['human', 'agent'], default: 'human' },
  abTestId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ABTest', default: null },
  stats: {
    sent:       { type: Number, default: 0 },
    delivered:  { type: Number, default: 0 },
    opened:     { type: Number, default: 0 },
    read:       { type: Number, default: 0 },
    clicked:    { type: Number, default: 0 },
    converted:  { type: Number, default: 0 },
    revenue:    { type: Number, default: 0 },
    failed:     { type: Number, default: 0 },
  },
  launchedAt:   { type: Date },
  completedAt:  { type: Date },
  createdAt:    { type: Date, default: Date.now },
});
```

#### Communication.js
```js
// STATUS FSM: pending → sent → delivered → failed (terminal)
//                                        → opened → read → clicked → converted (terminal)
const STATUS_ORDER = ['pending', 'sent', 'delivered', 'opened', 'read', 'clicked', 'converted', 'failed'];

const CommunicationSchema = new mongoose.Schema({
  campaignId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  customerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  message:     { type: String, required: true },  // personalized (name substituted)
  channel:     { type: String, required: true },
  status:      { type: String, enum: STATUS_ORDER, default: 'pending', index: true },
  sentAt:      { type: Date },
  updatedAt:   { type: Date, default: Date.now },
});
CommunicationSchema.index({ campaignId: 1, status: 1 });
```

#### ABTest.js
```js
const ABTestSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  campaignAId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  campaignBId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  status:           { type: String, enum: ['draft', 'running', 'completed'], default: 'draft' },
  winnerCampaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  createdAt:        { type: Date, default: Date.now },
});
```

#### Opportunity.js
```js
const OpportunitySchema = new mongoose.Schema({
  title:               { type: String, required: true },
  description:         { type: String },
  audienceDescription: { type: String },
  expectedRevenue:     { type: Number },
  aiReasoning:         { type: String },
  status:              { type: String, enum: ['active', 'dismissed', 'converted'], default: 'active' },
  createdAt:           { type: Date, default: Date.now },
});
```

#### AgentProposal.js
```js
const AgentProposalSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  segmentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Segment', default: null },
  channel:         { type: String, enum: ['whatsapp', 'sms', 'email', 'rcs'] },
  messageTemplate: { type: String },
  confidenceScore: { type: Number, min: 0, max: 1 },   // 0.0 to 1.0
  aiReasoning:     { type: String },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt:       { type: Date, default: Date.now },
});
```

#### PipelineEvent.js
```js
const PipelineEventSchema = new mongoose.Schema({
  type:        { type: String },   // "campaign_dispatched" | "callback_received" | "failed"
  title:       { type: String },
  description: { type: String },
  badge:       { type: String, enum: ['Event', 'OK', 'Retry', 'Failed'] },
  campaignId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  createdAt:   { type: Date, default: Date.now, index: true },
});
```

#### Settings.js
```js
const SettingsSchema = new mongoose.Schema({
  singleton:             { type: String, default: 'global', unique: true },
  platformName:          { type: String, default: 'Xeno AI Campaign Studio' },
  timezone:              { type: String, default: 'Asia/Kolkata' },
  currency:              { type: String, default: 'INR' },
  aiModel:               { type: String, default: 'default' },
  scanSchedule:          { type: String, default: 'daily_6am' },
  autoApprove:           { type: Boolean, default: false },
  telegramToken:         { type: String, default: '' },
  telegramChatId:        { type: String, default: '' },
  notifTelegram:         { type: Boolean, default: true },
  notifCampaignComplete: { type: Boolean, default: true },
  notifOpportunities:    { type: Boolean, default: true },
  notifWeeklyDigest:     { type: Boolean, default: false },
});
```

---

### 7.4 Routes Specification

#### `routes/customers.js`
```
GET    /api/customers
  Query: ?search=str, ?tag=str, ?page=1, ?limit=12
  Auth: required
  Response: { customers: [...], total, page, pages }

POST   /api/customers
  Auth: required
  Body: { name, email, phone, city, gender, age, tags }
  Response: { customer }

POST   /api/customers/bulk
  Auth: required
  Body: { customers: [...] }  — array up to 10,000
  Response: { inserted, skipped, errors }

GET    /api/customers/:id
  Auth: required
  Response: { customer, orders: [...] }

DELETE /api/customers/:id
  Auth: required
```

#### `routes/orders.js`
```
GET    /api/orders
  Query: ?customerId=, ?page=, ?limit=
  Auth: required

POST   /api/orders/bulk
  Auth: required
  Body: { orders: [...] }
```

#### `routes/segments.js`
```
GET    /api/segments
  Query: ?created_by=human|agent
  Auth: required

POST   /api/segments
  Auth: required
  Body: { name, description, filterRules, logic }

POST   /api/segments/preview
  Auth: required
  Body: { filterRules, logic }
  Response: { count, sample: [3 customers] }
  — Does NOT save. Only evaluates.

GET    /api/segments/:id
  Auth: required

GET    /api/segments/:id/customers
  Query: ?page=, ?limit=
  Auth: required

DELETE /api/segments/:id
  Auth: required
```

#### `routes/campaigns.js`
```
GET    /api/campaigns
  Query: ?status=, ?sort=, ?limit=
  Auth: required

POST   /api/campaigns
  Auth: required
  Body: { name, segmentId, channel, messageTemplate }
  — Creates with status: "draft"

GET    /api/campaigns/:id
  Auth: required
  Response: { campaign, segment, stats }

PATCH  /api/campaigns/:id
  Auth: required

POST   /api/campaigns/:id/launch
  Auth: required
  — 1. Set status to "running", set launchedAt
  — 2. Fetch all customers in segment
   — 3. For each customer: create Communication doc (status: "pending")
  — 4. Call campaignLauncher.js service → POST to channel service /send for each
  — 5. Log PipelineEvent: "campaign_dispatched"
  — 6. Return { dispatched: N, campaignId }

GET    /api/campaigns/:id/stats
  Auth: required
  Response: { stats: { sent, delivered, opened, read, clicked, converted, failed, revenue } }

GET    /api/campaigns/:id/communications
  Query: ?page=, ?limit=25
  Auth: required

DELETE /api/campaigns/:id
  Auth: required (only if status=draft)
```

#### `routes/receipts.js` — CRITICAL: THE CALLBACK ENDPOINT
```
POST   /api/receipts/callback
  Auth: NONE — this is called by the channel service
  Body: {
    communication_id: String,  // MongoDB ObjectId as string
    campaign_id:      String,
    customer_id:      String,
    channel:          String,
    event:            String,  // "sent"|"delivered"|"failed"|"opened"|"read"|"clicked"|"converted"
    timestamp:        String   // ISO 8601
  }
  
  Logic (MUST implement exactly):
  1. Find Communication by communication_id
  2. If not found: return 404 (log warning, do not throw)
  3. Check STATUS FSM: can_transition(current_status, event)
      — STATUS_ORDER = ['pending','sent','delivered','opened','read','clicked','converted','failed']
     — 'failed' is terminal: no transitions out
     — Only forward transitions allowed (index must increase)
     — Duplicate same-status event: return 200 silently (idempotent)
  4. If transition allowed:
     a. Update Communication.status = event
     b. Update Communication.updatedAt = now
     c. If event === 'sent': set Communication.sentAt = timestamp
     d. Atomically increment Campaign.stats[event] += 1
     e. If event === 'converted': Campaign.stats.revenue += (random ₹200–₹2000 simulated order value)
     f. If all communications for campaign are in terminal state (converted/failed):
        → Set Campaign.status = 'completed', Campaign.completedAt = now
     g. Log PipelineEvent: { type: 'callback_received', badge: 'OK', description: `${event} for comm ${communication_id}` }
  5. Return 200 { ok: true } always
  
  This endpoint must be IDEMPOTENT. Never throw 500. Always return 200.
```

#### `routes/analytics.js`
```
GET    /api/analytics/overview
  Auth: required
  Response: {
    total_customers: Number,
    active_campaigns: Number,
    messages_sent: Number,
    revenue_attributed: Number,
    trends: {
      customers_pct: Number,
      campaigns_this_week: Number,
      messages_pct: Number,
      revenue_pct: Number
    }
  }

GET    /api/analytics/channels
  Auth: required
  Response: [{ channel, sent, delivery_rate, open_rate, click_rate, conversion_rate }]
  — Aggregate from Communications grouped by channel

GET    /api/analytics/campaigns/top
  Auth: required
  Query: ?limit=10
  Response: [{ campaign, channel, sent, open_rate, revenue }]

GET    /api/analytics/funnel
  Auth: required
  Response: { sent, delivered, opened, read, clicked, converted }
  — Aggregate totals across ALL campaigns
```

#### `routes/abTests.js`
```
GET    /api/ab-tests          Auth: required
POST   /api/ab-tests          Auth: required
  Body: { name, campaignAId, campaignBId }
GET    /api/ab-tests/:id      Auth: required
PATCH  /api/ab-tests/:id/winner
  Auth: required
  Body: { winnerCampaignId }
```

#### `routes/opportunities.js`
```
GET    /api/opportunities
  Query: ?status=active
  Auth: required

GET    /api/opportunities/count
  Auth: required
  Response: { count }   ← used by sidebar badge

POST   /api/opportunities/scan
  Auth: required
  — Calls agent service POST /crew/opportunities
  — Saves returned opportunities to DB
  — Response: { created: N }

PATCH  /api/opportunities/:id/dismiss
  Auth: required
  — Sets status = 'dismissed'

POST   /api/opportunities/:id/generate-campaign
  Auth: required
  — Creates AgentProposal from opportunity
  — Returns { proposal }
```

#### `routes/proposals.js`
```
GET    /api/proposals
  Query: ?status=pending
  Auth: required

GET    /api/proposals/count
  Auth: required
  Response: { count }   ← used by sidebar badge

GET    /api/proposals/:id
  Auth: required

PATCH  /api/proposals/:id/approve
  Auth: required
  — 1. Create Campaign from proposal data
  — 2. Launch campaign immediately
  — 3. Set proposal.status = 'approved'
  — Response: { campaign }

PATCH  /api/proposals/:id/reject
  Auth: required
  — Set proposal.status = 'rejected'
```

#### `routes/pipeline.js`
```
GET    /api/pipeline/status
  Auth: required
  Response: {
    active_campaigns:   Number,
    total_sent:         Number,
    total_delivered:    Number,
    total_opened:       Number,
    total_clicked:      Number,
    total_converted:    Number,
    channel_service_health: String   // fetched from channel-service GET /health
  }

GET    /api/pipeline/events
  Query: ?limit=50
  Auth: required
  Response: [{ type, title, description, badge, createdAt }]
  — PipelineEvent documents sorted by createdAt DESC
```

#### `routes/agent.js`
```
POST   /api/agent/chat
  Auth: required
  Body: { session_id: String, message: String }
  Response: text/event-stream (SSE)
  
  Logic:
  1. Fetch DB context (recent campaigns, customer stats, segment list)
  2. POST to agent-service: POST http://AGENT_SERVICE_URL/crew/chat
     Body: { session_id, message, context: { ... } }
  3. Stream response back to frontend as SSE
  4. Parse agent JSON events and forward as SSE data frames

POST   /api/agent/confirm
  Auth: required
  Body: { session_id: String, action: String, data: Object }
  — Handles confirmed actions (create segment, launch campaign)
  — Returns { success, result }

GET    /api/agent/system-status
  Auth: required
  — Returns pipeline status for AI Command Centre modal header
```

#### `routes/settings.js`
```
GET    /api/settings        Auth: required
PUT    /api/settings        Auth: required
POST   /api/settings/test-telegram   Auth: required
```

---

### 7.5 Services

#### `services/segmentation.js`
Converts `filterRules` array → MongoDB query object:
```js
export function buildMongoQuery(filterRules, logic = 'AND') {
  const conditions = filterRules.map(rule => {
    const { field, operator, value } = rule;
    
    // Special case: last_order_days → compute cutoff date
    if (field === 'last_order_days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(value));
      return operator === 'gt'
        ? { lastOrderAt: { $lt: cutoff } }    // "inactive for > N days" means lastOrderAt < cutoff
        : { lastOrderAt: { $gte: cutoff } };
    }
    
    const mongoOp = {
      gt: '$gt', lt: '$lt', eq: '$eq',
      gte: '$gte', lte: '$lte',
      contains: '$in', not_contains: '$nin'
    }[operator];
    
    const queryValue = operator === 'contains' || operator === 'not_contains'
      ? [value]
      : isNaN(value) ? value : Number(value);
    
    return { [field]: { [mongoOp]: queryValue } };
  });
  
  return logic === 'AND' ? { $and: conditions } : { $or: conditions };
}
```

#### `services/campaignLauncher.js`
```js
export async function launchCampaign(campaign, customers) {
  const communications = [];
  
  for (const customer of customers) {
    // Personalize message
    const message = campaign.messageTemplate
      .replace('{name}', customer.name)
      .replace('{brand}', 'Xeno AI');
    
    // Create Communication doc
    const comm = await Communication.create({
      campaignId: campaign._id,
      customerId: customer._id,
      message,
      channel: campaign.channel,
      status: 'pending',
    });
    
    communications.push({ comm, customer });
  }
  
  // Batch POST to channel service
  // POST channel-service/send in batches of 100
  const batches = chunkArray(communications, 100);
  for (const batch of batches) {
    await Promise.all(batch.map(({ comm, customer }) =>
      fetch(`${process.env.CHANNEL_SERVICE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communication_id: comm._id.toString(),
          campaign_id: campaign._id.toString(),
          customer_id: customer._id.toString(),
          channel: campaign.channel,
          message: comm.message,
          callback_url: `${process.env.RECEIPT_CALLBACK_URL}`,
        }),
      })
    ));
  }
  
  await pipelineLogger.log({
    type: 'campaign_dispatched',
    title: 'Campaign Dispatched',
    description: `${campaign.name} → ${campaign.channel} Channel`,
    badge: 'Event',
    campaignId: campaign._id,
  });
  
  return { dispatched: communications.length };
}
```

---

### 7.6 Seed Script (`scripts/seed.js`)

Run with: `node scripts/seed.js`

Generate using `@faker-js/faker` with `faker.locale = 'en_IN'`:

```js
// Generates:
// - 10,000 customers (Indian names, emails, Indian cities, age 18-65)
// - 30,000 orders (3 per customer average, ₹200-₹15,000, past 2 years)
// - Compute + update ltv, totalOrders, lastOrderAt on each customer after orders inserted
// - 5 AI-suggested segments (created_by: 'agent'):
//   1. "VIP Customers"            — ltv > 10000
//   2. "Inactive 60+ Days"        — last_order_days > 60
//   3. "High-Value Fashion Buyers"— category=fashion AND ltv > 5000
//   4. "New Customers"            — created < 30 days ago
//   5. "At-Risk Reactivation"     — ltv > 2000 AND last_order_days > 45
// - 2 completed A/B tests with realistic stats (Summer Sale, Re-engagement)
// - 5 active opportunities
// - 3 pending agent proposals (confidence 0.87, 0.91, 0.75)
// - Settings doc (singleton)
// - 1 completed campaign with full communication stats

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane'
];

// Customer email format: firstname.lastname.{index}@email.com
// This matches exactly what's shown in the screenshots
```

---

## 8. Agent Service — Python + CrewAI (Port 8001)

### 8.1 Custom LLM Configuration (`crew/llm_config.py`)
```python
from crewai import LLM

def get_llm():
    """
    Returns a CrewAI LLM instance using a custom OpenAI-compatible endpoint.
    All agent calls go through this single LLM instance.
    """
    return LLM(
        model=f"openai/{os.environ['CUSTOM_LLM_MODEL']}",
        base_url=os.environ['CUSTOM_LLM_BASE_URL'],
        api_key=os.environ['CUSTOM_LLM_API_KEY'],
        temperature=0.3,    # lower = more structured, predictable output
        max_tokens=2000,
    )
```

### 8.2 All Agents MUST Return Structured JSON

**Rule**: Every agent's expected output is a Pydantic model. Every task instructs the agent to return ONLY valid JSON matching the schema. No prose, no markdown. Frontend parses and renders.

### 8.3 Agent Definitions

---

#### Agent 1: Intent Classifier (`agents/intent_classifier.py`)

**Role**: CRM Intent Router

**Goal**: Analyze a user's natural language message and classify it into exactly one intent category, extracting key parameters.

**Backstory**:
> You are an expert CRM analyst at a D2C brand. Your job is to understand what a marketer wants to accomplish and route their request to the right specialist. You are precise, fast, and always output clean JSON.

**Task User Story**:
> As a marketer typing a message into the AI Studio, I need the system to understand my intent immediately so the right agent can respond. I might say "find customers who haven't bought in 2 months" or "show me how my last campaign performed" or "write a win-back message for VIP customers." The intent classifier must understand all these variations.

**System Prompt**:
```
You are an intent classification engine for a CRM platform. Your ONLY job is to output a JSON object classifying the user's intent. You NEVER respond in prose. You ALWAYS output valid JSON only.

Intent categories:
- "segment_request": User wants to find/build a customer segment
- "compose_request": User wants to draft a message/campaign copy
- "launch_request": User wants to create and/or launch a campaign
- "insight_request": User wants analytics or performance data
- "opportunity_scan": User wants AI to find marketing opportunities
- "system_status": User asks about system health
- "general": Everything else (greetings, unrelated questions)

Extract parameters when present:
- channel: whatsapp | sms | email | rcs | null
- time_period: number of days mentioned (e.g. "60 days" → 60) or null
- customer_tag: VIP | loyal | inactive | new | null
- metric: revenue | open_rate | conversion | delivery | null
```

**Output Schema**:
```python
class IntentResult(BaseModel):
    intent: str                    # one of the 7 categories
    confidence: float              # 0.0-1.0
    extracted_params: dict         # channel, time_period, customer_tag, metric
    routing_reason: str            # one sentence explaining the classification
```

**Output Example**:
```json
{
  "intent": "segment_request",
  "confidence": 0.95,
  "extracted_params": {
    "channel": "whatsapp",
    "time_period": 60,
    "customer_tag": null,
    "metric": null
  },
  "routing_reason": "User wants to find customers inactive for 60 days to target on WhatsApp"
}
```

---

#### Agent 2: Data Analyst (`agents/data_analyst.py`)

**Role**: CRM Data Intelligence Analyst

**Goal**: Fetch and summarize relevant customer and campaign data from the CRM database to provide context for other agents.

**Backstory**:
> You are a senior data analyst who has spent 10 years analyzing retail customer data. You know how to read raw numbers and translate them into actionable insights. You always present data in clean, structured JSON that other agents and frontend systems can consume directly.

**Task User Story**:
> As a CrewAI orchestrator, before I can build a segment or draft a message, I need accurate data about the customer base. The Data Analyst fetches this context: total customers, revenue distributions, top cities, recent campaign performance. This context is passed to the Segment Builder and Message Composer.

**System Prompt**:
```
You are a CRM data analyst. You receive customer and campaign statistics as a JSON context object. Your job is to analyze this data and return a structured summary that other agents will use to make decisions.

You output ONLY valid JSON. No prose, no explanation outside the JSON object.

When analyzing segments:
- Identify patterns (high LTV customers, inactive users, recent buyers)
- Estimate potential revenue impact
- Suggest optimal channels based on customer demographics

When analyzing campaigns:
- Calculate delivery rates, open rates, conversion rates
- Identify top and bottom performers
- Flag anomalies (unusually high failure rates, etc.)
```

**Output Schema**:
```python
class DataAnalysisResult(BaseModel):
    summary: str                   # 2-3 sentence plain English summary
    key_metrics: dict              # computed metrics relevant to the query
    customer_segments_found: list  # list of segment patterns detected
    recommended_channels: list     # channels with highest engagement for this audience
    data_quality_notes: list       # any data issues or caveats
    raw_context_used: dict         # echo back what was analyzed (for audit)
```

---

#### Agent 3: Segment Builder (`agents/segment_builder.py`)

**Role**: Customer Segmentation Specialist

**Goal**: Translate natural language segment descriptions into precise MongoDB filter rules that the CRM can execute.

**Backstory**:
> You are a customer segmentation expert who has built audience models for 100+ D2C brands. You understand the business logic behind segments — why "VIP" means high LTV AND frequent purchases, why "at-risk" means good LTV but recent inactivity. You translate business language into technical filter rules with zero ambiguity.

**Task User Story**:
> As a marketer, I say "find me customers who spent over ₹5000 and haven't ordered in the last 45 days." The Segment Builder must understand this business rule and produce a JSON filter_rules array that the Node.js segmentation service can execute against MongoDB. The estimated_count comes from calling the preview API.

**System Prompt**:
```
You are a customer segmentation engine. You receive a natural language segment description and database context. You output ONLY a JSON object with filter_rules that can be executed against MongoDB.

Supported fields and their MongoDB representations:
- ltv → Customer.ltv (Number, in INR/USD)
- age → Customer.age (Number)
- city → Customer.city (String)
- total_orders → Customer.totalOrders (Number)
- last_order_days → Derived: days since Customer.lastOrderAt
- gender → Customer.gender (male/female/other)
- tags → Customer.tags (Array: VIP, loyal, at_risk, new)
- category → Most frequent Order.category for customer

Supported operators: gt, lt, eq, gte, lte, contains, not_contains
Logic: AND (default) or OR between rules

Always produce the MINIMUM number of rules needed. Do not over-filter.
If a rule cannot be expressed in the supported fields, note it in caveats.
```

**Output Schema**:
```python
class SegmentBuildResult(BaseModel):
    segment_name: str              # suggested name for this segment
    description: str               # human-readable description
    filter_rules: list[dict]       # [{"field": "ltv", "operator": "gt", "value": 5000}]
    logic: str                     # "AND" or "OR"
    estimated_count: int           # from preview API call (0 if preview not available)
    confidence: float              # how confident the builder is in the rules (0-1)
    caveats: list[str]             # any assumptions or limitations
    filter_rules_summary: str      # human readable: "LTV > ₹5000 AND inactive > 45 days"
```

**Output Example**:
```json
{
  "segment_name": "High-Value Inactive Customers",
  "description": "Customers with LTV above ₹5000 who haven't ordered in the last 45 days",
  "filter_rules": [
    { "field": "ltv", "operator": "gt", "value": 5000 },
    { "field": "last_order_days", "operator": "gt", "value": 45 }
  ],
  "logic": "AND",
  "estimated_count": 234,
  "confidence": 0.92,
  "caveats": [],
  "filter_rules_summary": "LTV > ₹5,000 AND Inactive > 45 days"
}
```

---

#### Agent 4: Message Composer (`agents/message_composer.py`)

**Role**: Marketing Copywriter & Channel Strategist

**Goal**: Write compelling, personalized campaign messages for a given audience and channel, always producing two variants for A/B consideration.

**Backstory**:
> You are a senior marketing copywriter who has written thousands of D2C campaign messages. You know that WhatsApp messages need to feel personal and conversational, SMS must be under 160 characters, email subject lines determine open rates, and RCS allows rich formatting. You always write two message variants — one emotional (empathy-led) and one transactional (offer-led) — so marketers can choose or A/B test.

**Task User Story**:
> As a marketer who has chosen a segment (e.g., inactive high-value customers), I need two message options tailored to that audience and channel. The composer should use the customer context (average LTV, city, purchase category) to make messages feel relevant and personal. Messages must use `{name}` placeholder for personalization.

**System Prompt**:
```
You are a D2C marketing copywriter. You write personalized campaign messages for WhatsApp, SMS, Email, and RCS channels.

RULES:
- Always write exactly TWO variants: variant_a (empathy/emotional angle) and variant_b (offer/transactional angle)
- Always include {name} as the personalization placeholder
- WhatsApp: conversational, 50-100 words, can use emoji
- SMS: strictly under 160 characters, no emoji, clear CTA
- Email: subject line + body (subject under 60 chars, body 100-200 words)
- RCS: similar to WhatsApp but can suggest a button CTA text

Output ONLY valid JSON. No explanation outside the JSON.

Quality checklist (apply silently):
- Does it mention a clear benefit?
- Is the CTA specific (not just "click here")?
- Does it feel personal (not mass-marketing)?
- Is the brand voice friendly but professional?
```

**Output Schema**:
```python
class MessageComposerResult(BaseModel):
    channel: str
    segment_context: str           # brief description of who this is for
    variant_a: dict                # { label, angle, message, cta, character_count }
    variant_b: dict                # { label, angle, message, cta, character_count }
    recommended_variant: str       # "a" or "b" with reason
    send_time_suggestion: str      # "Tuesday 10am IST" type suggestion
    personalization_vars: list     # ["name", "city"] — vars used in messages
```

**Output Example**:
```json
{
  "channel": "whatsapp",
  "segment_context": "High-LTV customers inactive for 45+ days",
  "variant_a": {
    "label": "We miss you",
    "angle": "emotional",
    "message": "Hey {name}! 💙 We noticed it's been a while. Your last purchase made us smile — we'd love to see you back. Here's 15% off, just for you: COMEBACK15",
    "cta": "Shop Now",
    "character_count": 148
  },
  "variant_b": {
    "label": "Exclusive offer",
    "angle": "transactional",
    "message": "Hi {name}, your exclusive 15% discount expires in 48 hours! Use SAVE15 at checkout. Offer valid on all categories → [link]",
    "cta": "Claim Discount",
    "character_count": 126
  },
  "recommended_variant": "a",
  "send_time_suggestion": "Tuesday or Wednesday, 10-11am IST",
  "personalization_vars": ["name"]
}
```

---

#### Agent 5: Campaign Dispatcher (`agents/campaign_dispatcher.py`)

**Role**: Campaign Execution Manager

**Goal**: Validate and finalize campaign parameters, then instruct the backend to create and launch the campaign.

**Backstory**:
> You are a campaign operations manager who has launched thousands of marketing campaigns. Before any campaign goes live, you validate that the audience is right, the message is appropriate, the channel is configured, and the expected volume is within acceptable limits. You produce a final launch manifest that the backend executes.

**Task User Story**:
> As a marketer who has confirmed a segment and picked a message, I need the agent to produce the final campaign configuration object that will be sent to the backend's POST /api/campaigns + POST /api/campaigns/:id/launch endpoints. The dispatcher validates everything and creates the launch manifest.

**System Prompt**:
```
You are a campaign validation and launch manager. You receive a segment definition, a chosen message variant, and channel. Your job is to produce a final campaign launch manifest.

Validation rules (check all):
- message must contain {name}
- estimated audience > 0 and < 100,000 (flag if too large)
- channel must be one of: whatsapp, sms, email, rcs
- message length must be appropriate for channel (SMS < 160 chars)
- campaign name must be descriptive (not empty or generic)

If ALL validations pass: produce launch manifest.
If ANY validation fails: produce a structured error response listing which validations failed.

Output ONLY valid JSON.
```

**Output Schema**:
```python
class CampaignDispatchResult(BaseModel):
    valid: bool
    validation_errors: list[str]   # empty if valid
    campaign_manifest: dict        # { name, segmentId, channel, messageTemplate }
    estimated_audience: int
    estimated_cost_inr: float      # rough estimate (simulated)
    estimated_revenue_inr: float   # based on historical conversion rates
    confidence_score: float        # 0-1, how confident the agent is in this campaign
    ai_reasoning: str              # explanation for marketer
    ready_to_launch: bool          # true if valid AND marketer should proceed
```

---

#### Agent 6: Insights Reporter (`agents/insights_reporter.py`)

**Role**: Campaign Performance Analyst

**Goal**: Analyze campaign performance data and produce a comprehensive, actionable insights report in structured JSON.

**Backstory**:
> You are a marketing analytics expert who translates raw campaign numbers into board-ready insights. You know that a 45% open rate is excellent for email but average for WhatsApp. You identify what worked, what didn't, and what should change next time. You always end with 3 specific, actionable recommendations.

**Task User Story**:
> As a marketer who asks "how did my last campaign perform?", I need a clear narrative with numbers, comparisons to benchmarks, and specific next steps. The insights reporter fetches campaign stats and produces a structured report that the frontend renders as metric cards + narrative text.

**System Prompt**:
```
You are a campaign performance analyst. You receive campaign statistics and produce a structured insights report.

Industry benchmarks for D2C brands (use as comparison):
- WhatsApp: delivered 90%+, opened 45%+, clicked 15%+, converted 5%+
- SMS: delivered 95%+, opened 30%+, clicked 8%+, converted 3%+
- Email: delivered 85%+, opened 20%+, clicked 5%+, converted 2%+
- RCS: delivered 85%+, opened 35%+, clicked 10%+, converted 4%+

Your report must:
1. State clearly if each metric is ABOVE, BELOW, or AT benchmark
2. Identify the single biggest problem (if any)
3. Provide exactly 3 specific, actionable recommendations
4. Calculate estimated revenue lift if recommendations are followed

Output ONLY valid JSON. Narrative fields can be full sentences but must be inside JSON strings.
```

**Output Schema**:
```python
class InsightReportResult(BaseModel):
    campaign_name: str
    summary: str                   # 2-3 sentence executive summary
    metrics: list[dict]            # [{ metric, value, benchmark, status: "above"|"below"|"at", label }]
    top_finding: str               # single most important insight
    recommendations: list[dict]    # 3 items: [{ title, description, expected_impact }]
    chart_data: list[dict]         # [{ stage, count, rate }] for funnel chart
    overall_score: float           # 0-10 campaign health score
    next_campaign_suggestion: str  # brief suggestion for next campaign
```

---

#### Agent 7: Opportunity Scanner (`agents/opportunity_scanner.py`)

**Role**: Proactive Marketing Opportunity Detective

**Goal**: Autonomously scan customer data patterns to identify high-revenue marketing opportunities the brand may be missing.

**Backstory**:
> You are a growth hacker who has helped 50+ D2C brands unlock hidden revenue. You look for patterns that humans miss: seasonal purchase clusters, cross-sell gaps, loyal customers who suddenly went quiet, new customers who need nurturing. You package each finding as a concrete, actionable opportunity with an estimated revenue impact.

**Task User Story**:
> As a brand manager who hasn't run a campaign in a while, I click "Scan for Opportunities" and want the AI to proactively tell me: here are 5 opportunities you're missing, here's why, here's how much revenue each could unlock. I should be able to turn any opportunity into a campaign with one click.

**System Prompt**:
```
You are a marketing opportunity detector. You receive customer analytics data and must identify 3-7 specific marketing opportunities.

For each opportunity, you must:
1. Give it a specific, compelling name (not generic like "re-engagement")
2. Identify the exact audience (with estimated size)
3. Estimate revenue potential (be conservative, show your math in ai_reasoning)
4. Recommend the best channel and message angle
5. Explain WHY this is an opportunity (data evidence)

Opportunity types to look for:
- Lapsing high-value customers (high LTV, increasing inactivity)
- Cross-sell opportunities (bought A, never bought B which complements A)
- Loyalty reward opportunities (top 10% customers who deserve recognition)
- Seasonal opportunities (purchase patterns around dates)
- New customer nurturing (first purchase made, no second yet)
- Reactivation (truly dormant, last order > 90 days)
- Category expansion (customers only buying one category)

Output ONLY valid JSON.
```

**Output Schema**:
```python
class OpportunityItem(BaseModel):
    title: str
    description: str
    audience_description: str
    audience_size_estimate: int
    expected_revenue_inr: float
    recommended_channel: str       # whatsapp | sms | email | rcs
    message_angle: str             # emotional | transactional | loyalty | urgency
    ai_reasoning: str              # evidence from data

class OpportunityScanResult(BaseModel):
    opportunities: list[OpportunityItem]   # 3-7 items
    total_revenue_potential_inr: float     # sum of all opportunities
    scan_summary: str              # 1-2 sentence overview
    data_analyzed: dict            # what data was examined
    scan_timestamp: str            # ISO 8601
```

---

### 8.4 Crew Definitions (`crew/crews/`)

#### `campaign_crew.py`
Orchestrates: IntentClassifier → DataAnalyst → SegmentBuilder → MessageComposer → CampaignDispatcher

```python
from crewai import Crew, Process

class CampaignCrew:
    def __init__(self):
        self.llm = get_llm()
        # Initialize all 5 agents with self.llm
    
    def run(self, user_message: str, context: dict) -> list[dict]:
        """
        Returns list of structured events to stream to frontend:
        [
          { "type": "text", "content": "Analyzing your request..." },
          { "type": "segment_proposal", "data": { ...SegmentBuildResult } },
          { "type": "message_proposal", "data": { ...MessageComposerResult } },
          { "type": "campaign_proposal", "data": { ...CampaignDispatchResult } },
          { "type": "done" }
        ]
        """
        crew = Crew(
            agents=[intent_agent, data_agent, segment_agent, compose_agent, dispatch_agent],
            tasks=[intent_task, data_task, segment_task, compose_task, dispatch_task],
            process=Process.sequential,
            verbose=False,
        )
        result = crew.kickoff(inputs={"message": user_message, "context": context})
        return self._parse_to_events(result)
```

#### `insights_crew.py`
Single agent: InsightsReporter
```python
# Receives campaign stats → returns InsightReportResult
# Emits: { "type": "insight_report", "data": {...} }
```

#### `opportunity_crew.py`
Single agent: OpportunityScanner
```python
# Receives customer analytics → returns OpportunityScanResult
# Emits: { "type": "opportunity_list", "data": {...} }
```

---

### 8.5 FastAPI Entry Point (`main.py`)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json, asyncio

app = FastAPI()

@app.post("/crew/chat")
async def chat(body: ChatRequest):
    """
    Runs CampaignCrew and streams JSON events as SSE.
    Each event: data: {"type": "...", "content/data": ...}\n\n
    """
    async def generate():
        crew = CampaignCrew()
        events = crew.run(body.message, body.context)
        for event in events:
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.05)  # small delay for streaming feel
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/crew/opportunities")
async def scan_opportunities(body: OpportunityScanRequest):
    """
    Runs OpportunityCrew synchronously.
    Returns: { opportunities: [...] }
    """
    crew = OpportunityCrew()
    result = crew.run(body.context)
    return result

@app.post("/crew/insights")
async def get_insights(body: InsightsRequest):
    """
    Runs InsightsCrew for a specific campaign.
    Returns: InsightReportResult JSON
    """
    crew = InsightsCrew()
    return crew.run(body.campaign_stats)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "agent-service"}
```

### 8.6 `requirements.txt`
```
fastapi==0.110.0
uvicorn==0.27.0
crewai==0.28.0
crewai-tools==0.1.6
pydantic==2.6.0
python-dotenv==1.0.0
httpx==0.27.0
```

---

## 9. Channel Service — Node.js + Express (Port 8002)

This is a **MOCK** service. It does NOT deliver real messages. It simulates the entire message lifecycle with realistic random outcomes and calls back into the core backend.

### 9.1 `src/index.js`
```js
import express from 'express';
import { processJob } from './simulator.js';

const app = express();
app.use(express.json());

// POST /send — accepts message job and processes it directly
app.post('/send', (req, res) => {
  const {
    communication_id, campaign_id, customer_id,
    channel, message, callback_url
  } = req.body;

  if (!communication_id || !channel || !callback_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const job = {
    id:               crypto.randomUUID(),
    communication_id,
    campaign_id,
    customer_id,
    channel,
    message,
    callback_url,
  };

  // Process directly (fire-and-forget)
  processJob(job).catch(console.error);

  return res.status(202).json({
    accepted: true,
    job_id: job.id,
  });
});

// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    processed_total: global.processedCount || 0,
  });
});

// GET /stats
app.get('/stats', (req, res) => {
  res.json(global.stats || {
    total_sent: 0,
    outcomes: { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 }
  });
});

app.listen(8002, () => console.log('Channel service running on :8002'));
```

### 9.2 `src/simulator.js`
```js
// Delivery rates per channel
export const DELIVERY_RATES = {
  whatsapp: 0.92,
  sms:      0.96,
  email:    0.87,
  rcs:      0.85,
};

// Engagement funnel (conditional probabilities)
export const ENGAGEMENT_FUNNEL = {
  opened:    0.45,   // P(opened | delivered)
  read:      0.70,   // P(read | opened)
  clicked:   0.30,   // P(clicked | read)
  converted: 0.12,   // P(converted | clicked)
};

// Delays in milliseconds (realistic simulation)
export const DELAYS = {
  pending_to_sent:       [500, 1500],
  sent_to_delivered:    [1000, 4000],
  delivered_to_opened:  [3000, 15000],
  opened_to_read:       [2000, 8000],
  read_to_clicked:      [1000, 5000],
  clicked_to_converted: [2000, 10000],
};

export function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBool(probability) {
  return Math.random() < probability;
}
```

### 9.3 `src/simulator.js` (continued — processJob)
```js
import { DELIVERY_RATES, ENGAGEMENT_FUNNEL, DELAYS, randomDelay, randomBool } from './simulator.js';

global.processedCount = 0;
global.stats = {
  total_sent: 0,
  outcomes: { delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 }
};

// Sends a single callback event to the core backend
async function sendCallback(callbackUrl, payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
    } catch (err) {
      if (attempt === retries) {
        console.error(`Callback failed after ${retries} attempts:`, err.message);
        return false;
      }
      // Exponential backoff: 2s, 4s, 8s
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
    }
  }
}

// Builds a callback payload
function buildPayload(job, event) {
  return {
    communication_id: job.communication_id,
    campaign_id:      job.campaign_id,
    customer_id:      job.customer_id,
    channel:          job.channel,
    event,
    timestamp:        new Date().toISOString(),
  };
}

// Processes a single job through the full lifecycle
export async function processJob(job) {
  const { callback_url, channel } = job;

  // 1. SENT
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.pending_to_sent)));
  await sendCallback(callback_url, buildPayload(job, 'sent'));
  global.stats.total_sent++;
  global.processedCount++;

  // 2. DELIVERED or FAILED
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.sent_to_delivered)));
  const isDelivered = randomBool(DELIVERY_RATES[channel] || 0.90);

  if (!isDelivered) {
    await sendCallback(callback_url, buildPayload(job, 'failed'));
    global.stats.outcomes.failed++;
    return;
  }

  await sendCallback(callback_url, buildPayload(job, 'delivered'));
  global.stats.outcomes.delivered++;

  // 3. OPENED
  if (!randomBool(ENGAGEMENT_FUNNEL.opened)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.delivered_to_opened)));
  await sendCallback(callback_url, buildPayload(job, 'opened'));
  global.stats.outcomes.opened++;

  // 4. READ
  if (!randomBool(ENGAGEMENT_FUNNEL.read)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.opened_to_read)));
  await sendCallback(callback_url, buildPayload(job, 'read'));

  // 5. CLICKED
  if (!randomBool(ENGAGEMENT_FUNNEL.clicked)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.read_to_clicked)));
  await sendCallback(callback_url, buildPayload(job, 'clicked'));
  global.stats.outcomes.clicked++;

  // 6. CONVERTED
  if (!randomBool(ENGAGEMENT_FUNNEL.converted)) return;
  await new Promise(r => setTimeout(r, randomDelay(...DELAYS.clicked_to_converted)));
  await sendCallback(callback_url, buildPayload(job, 'converted'));
  global.stats.outcomes.converted++;
}
```

**Key design note**: `processJob` runs concurrently via fire-and-forget. Each incoming request triggers immediate processing with async delays simulating realistic message delivery timing. This simulates real parallel message delivery without needing a queue infrastructure.

---

## 10. Frontend — API Integration

### 10.1 `src/lib/api.js`
```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

// Inject Clerk JWT before every request
// Note: must be called inside a component or hook that has Clerk context
export function setupInterceptors(getToken) {
  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export default api;
```

### 10.2 `src/hooks/useSSE.js`
```js
import { useState, useCallback } from 'react';

export function useSSE() {
  const [events, setEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback(async (url, body, token) => {
    setIsStreaming(true);
    setEvents([]);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'done') {
              setIsStreaming(false);
              return;
            }
            setEvents(prev => [...prev, event]);
          } catch (e) { /* ignore malformed */ }
        }
      }
    }
    setIsStreaming(false);
  }, []);

  return { events, isStreaming, startStream };
}
```

### 10.3 Real-Time Polling
```js
// In PipelineMonitor.jsx
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await api.get('/api/pipeline/status');
    setStatus(data.data);
    const events = await api.get('/api/pipeline/events?limit=50');
    setPipelineEvents(events.data);
  }, 5000);
  return () => clearInterval(interval);
}, []);

// In CampaignDetail.jsx — poll while running
useEffect(() => {
  if (campaign?.status !== 'running') return;
  const interval = setInterval(async () => {
    const data = await api.get(`/api/campaigns/${id}/stats`);
    setStats(data.data.stats);
  }, 5000);
  return () => clearInterval(interval);
}, [campaign?.status]);
```

---

## 11. Docker Compose

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongodb_data:/data/db]
    environment:
      MONGO_INITDB_DATABASE: xenocrm

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      MONGODB_URI: mongodb://mongodb:27017/xenocrm
      CHANNEL_SERVICE_URL: http://channel-service:8002
      AGENT_SERVICE_URL: http://agent-service:8001
      RECEIPT_CALLBACK_URL: http://backend:8000/api/receipts/callback
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      FRONTEND_URL: http://localhost:5173
    depends_on: [mongodb]

  agent-service:
    build: ./agent-service
    ports: ["8001:8001"]
    environment:
      CUSTOM_LLM_BASE_URL: ${CUSTOM_LLM_BASE_URL}
      CUSTOM_LLM_API_KEY: ${CUSTOM_LLM_API_KEY}
      CUSTOM_LLM_MODEL: ${CUSTOM_LLM_MODEL}
      CORE_BACKEND_URL: http://backend:8000

  channel-service:
    build: ./channel-service
    ports: ["8002:8002"]
    environment:
      CORE_BACKEND_URL: http://backend:8000

  frontend:
    build: ./frontend
    ports: ["5173:80"]
    environment:
      VITE_API_URL: http://localhost:8000
      VITE_CLERK_PUBLISHABLE_KEY: ${CLERK_PUBLISHABLE_KEY}

volumes:
  mongodb_data:
```

---

## 12. Deployment Targets

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Add `vercel.json` with SPA `rewrites` → `index.html` |
| Backend | Render.com | Web Service, Node 20, `npm start` |
| Agent Service | Render.com | Web Service, Python 3.11, `uvicorn main:app --host 0.0.0.0 --port 8001` |
| Channel Service | Render.com | Web Service, Node 20, separate service |
| Database | MongoDB Atlas | Free M0 tier (512MB, plenty for this) |

### `vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 13. Key Tradeoffs (Document in README)

1. **MongoDB vs PostgreSQL**: MongoDB chosen for flexible schema — campaign stats evolve, filter_rules are arbitrary JSON. Tradeoff: no JOIN optimization, mitigated by Mongoose populate and compound indexes.
2. **CrewAI agents vs LangGraph**: CrewAI gives opinionated multi-agent orchestration with role/goal/backstory structure. LangGraph offers more control over state flow. CrewAI was chosen for clear agent specialization and faster iteration.
3. **All agents return structured JSON**: Makes frontend rendering deterministic. Tradeoff: agents need explicit instruction to not add prose outside JSON — mitigated by system prompts.
4. **Direct processing in channel service**: Each request is processed immediately via fire-and-forget. At production scale, replace with BullMQ + Redis for persistence, retries, and monitoring. Explicit tradeoff for this scope.
5. **SSE over WebSockets for agent streaming**: SSE is unidirectional (server→client) which is all we need for agent responses. Simpler to implement and proxy than WebSockets.
6. **Idempotent receipt endpoint (no auth)**: Receipt endpoint has no auth because it's called machine-to-machine. In production, add HMAC signature verification on callbacks.
7. **Single MongoDB Atlas cluster**: Simplest deployment path. In production, read replicas for analytics queries.

---

## 14. Build Order

Execute strictly in this sequence:

```
Step 1:  mongodb running (docker-compose up mongodb)
Step 2:  backend/ — models + all routes (no agent route yet)
Step 3:  backend/scripts/seed.js — seed all data, verify in MongoDB Compass
Step 4:  channel-service/ — simulator + direct processing + /send + callbacks
Step 5:  Test callback loop: POST /send → watch callbacks hit /api/receipts/callback → verify DB updates
Step 6:  agent-service/ — llm_config + all 7 agents + 3 crews + FastAPI endpoints
Step 7:  Test agent service in isolation: POST /crew/chat with sample message
Step 8:  backend/routes/agent.js — SSE proxy to agent service
Step 9:  frontend/ — scaffold Vite + ShadCN + Tailwind + Clerk
Step 10: frontend Sidebar.jsx — exact nav structure
Step 11: Login page (Clerk)
Step 12: Dashboard page (with real API data)
Step 13: Customers + Segments pages
Step 14: Campaigns + CampaignDetail pages
Step 15: AI Studio page (SSE chat + AgentResponseRenderer)
Step 16: Opportunities + Agent Proposals pages
Step 17: A/B Tests + Analytics + Pipeline Monitor pages
Step 18: Settings page
Step 19: AICommandCentre floating modal
Step 20: docker-compose up — full stack smoke test
Step 21: Deploy all 4 services
Step 22: Run seed.js against production MongoDB Atlas
Step 23: E2E test: Login → Import → Segment → AI Studio → Launch Campaign → Watch Pipeline → View Analytics
Step 24: Record walkthrough video
```

---

## 15. Non-Negotiables

- [ ] All services deployed and publicly accessible before submission
- [ ] Channel service is a **separate Node.js service** (NOT a module inside backend)
- [ ] `/api/receipts/callback` is implemented **exactly** as specified — idempotent, no auth, FSM transitions only
- [ ] All 7 CrewAI agents have distinct roles, goals, backstories, and system prompts as specified
- [ ] All agent outputs are structured JSON — no prose responses
- [ ] `AgentResponseRenderer.jsx` renders all 6 card types correctly
- [ ] Seed data shows 10,000 customers with realistic stats
- [ ] Agent Proposals page loads from DB (zero empty states in demo)
- [ ] Pipeline Monitor shows live delivery stats updating every 5s
- [ ] Campaign funnel chart fills in real-time as callbacks arrive
- [ ] CORS configured for all production domains
- [ ] README documents all tradeoffs from §13
- [ ] Code is fully your own — every line explainable in a live interview
```
