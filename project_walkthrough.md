# Xeno AI Campaign Studio — Complete Project Walkthrough

> A plain-English guide to every part of this codebase, written for someone with zero technical background.

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [The Big Picture — How Everything Fits Together](#2-the-big-picture--how-everything-fits-together)
3. [The Four Services Explained](#3-the-four-services-explained)
4. [Frontend — The Website You See](#4-frontend--the-website-you-see)
5. [Backend — The Brain Behind the Website](#5-backend--the-brain-behind-the-website)
6. [Agent Service — The AI Brain](#6-agent-service--the-ai-brain)
7. [Channel Service — The Message Delivery System](#7-channel-service--the-message-delivery-system)
8. [The Database — Where Everything Is Stored](#8-the-database--where-everything-is-stored)
9. [How a Typical User Journey Works](#9-how-a-typical-user-journey-works)
10. [Every File Explained](#10-every-file-explained)
11. [Security & Authentication](#11-security--authentication)
12. [Deployment — How It Goes Live](#12-deployment--how-it-goes-live)

---

## 1. What Is This Project?

**Xeno AI Campaign Studio** is an AI-powered marketing platform for Direct-to-Consumer (D2C) brands. Think of it as a smart marketing assistant that helps businesses:

- **Understand their customers** — Who buys what, how much they spend, when they last bought something
- **Group customers into segments** — Like "VIP customers who spend a lot" or "customers who haven't bought in 3 months"
- **Create marketing campaigns** — Send personalized messages via WhatsApp, SMS, or Email
- **Let AI do the heavy lifting** — The AI suggests campaign ideas, writes messages, finds hidden opportunities, and can even launch campaigns for you
- **Track results** — See how many messages were sent, delivered, opened, and how much money each campaign made

**In simple terms:** A business owner logs in, sees their customer data, asks the AI "help me win back customers who stopped buying," and the AI creates a campaign plan, writes the messages, and sends them out — all automatically.

---

## 2. The Big Picture — How Everything Fits Together

The project is made of **4 separate services** that talk to each other:

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S WEB BROWSER                    │
│                    (Frontend Website)                     │
└─────────────────┬───────────────────────────────────────┘
                  │ Sends requests
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND SERVER                          │
│            (The Main Brain — Port 8000)                  │
│                                                         │
│  • Handles all data (customers, campaigns, orders)      │
│  • Checks if user is logged in                          │
│  • Talks to the database                                │
│  • Calls the AI service when needed                     │
│  • Calls the channel service to send messages           │
└────────┬─────────────────┬──────────────────────────────┘
         │                 │
         ▼                 ▼
┌────────────────┐  ┌────────────────────────────────────┐
│   DATABASE     │  │         AI AGENT SERVICE            │
│  (MongoDB)     │  │      (The AI Brain — Port 8001)    │
│                │  │                                    │
│ Stores all     │  │ • Understands natural language     │
│ customer data, │  │ • Creates campaign plans           │
│ campaigns,     │  │ • Writes marketing messages        │
│ orders, etc.   │  │ • Finds opportunities              │
└────────────────┘  │ • Generates customer segments      │
                    │ • Uses web search for trends       │
                    └────────────────────────────────────┘
                              │
                              ▼
                    ┌────────────────────────────────────┐
                    │      CHANNEL SERVICE                │
                    │   (Message Sender — Port 8002)     │
                    │                                    │
                    │ • Sends WhatsApp messages           │
                    │ • Sends SMS                        │
                    │ • Sends Emails                     │
                    │ • Reports delivery status back     │
                    └────────────────────────────────────┘
```

---

## 3. The Four Services Explained

### Service 1: Frontend (Port 5173)
**What it is:** The website the user sees and interacts with.
**Technology:** React (a JavaScript library for building user interfaces)
**Analogy:** The dashboard and controls of a car — buttons, screens, and gauges.

### Service 2: Backend (Port 8000)
**What it is:** The main server that handles all the business logic.
**Technology:** Node.js with Express framework, connected to MongoDB database
**Analogy:** The engine of the car — it does all the actual work.

### Service 3: Agent Service (Port 8001)
**What it is:** The AI brain that understands language and makes smart decisions.
**Technology:** Python with FastAPI, using CrewAI (a framework for AI agents)
**Analogy:** The GPS navigator — it analyzes the situation and suggests the best route.

### Service 4: Channel Service (Port 8002)
**What it is:** The delivery person that actually sends messages to customers.
**Technology:** Node.js
**Analogy:** The postal service — it takes messages and delivers them to the right place.

---

## 4. Frontend — The Website You See

### 4.1 What the User Sees

When you open the website, you see a **dark sidebar** on the left with navigation links, and the main content area on the right. The sidebar has sections:

| Section | Links | What It Does |
|---------|-------|--------------|
| **MAIN** | Dashboard, AI Campaign Studio, Opportunities, Agent Proposals | The home base and AI features |
| **AUDIENCE** | Customers, Segments | Managing who you're marketing to |
| **ENGAGE** | Campaigns | Creating and tracking marketing campaigns |
| **ANALYZE** | Analytics, Pipeline Monitor | Seeing how well things are working |
| **SYSTEM** | AI Command Centre, Settings | Talking to AI and configuring the app |

### 4.2 Every Page Explained

#### Dashboard (`/`)
The first page you see. It shows:
- **Quick Action buttons**: Import customers, Build a segment, Launch a campaign, View insights
- **KPI Cards**: Total customers, Active campaigns, Messages sent, Revenue attributed
- **Recent Campaigns table**: The last 5 campaigns with their status

**What happens behind the scenes:** When you first visit, the app checks if there's demo data. If not, it automatically loads sample customers, orders, and campaigns so you can see how everything works.

#### AI Campaign Studio (`/ai-studio`)
This is the **star feature**. It's a chat interface where you talk to the AI in plain English.

**How it works:**
1. You see a landing page with suggestion pills like "Active Buyers," "At risk," "VIP," "New Buyers"
2. You type something like: "Create a campaign for VIP customers who haven't bought in 60 days"
3. The AI responds in real-time (streaming) with:
   - A campaign plan (title, target audience, description)
   - Two message variants (A/B testing)
   - A confidence score
4. You can click "Launch Now" to send the campaign

**Behind the scenes:** Your message is sent to the AI Agent Service, which uses multiple AI "agents" (specialized AI workers) to analyze your request, create a campaign plan, write messages, and send everything back as a stream of events.

#### Opportunities (`/opportunities`)
Shows AI-discovered marketing opportunities. The AI scans your customer data and web trends to find things like:
- "You have 1,200 high-value customers who haven't bought in 60 days — reactivate them for ₹4.5L revenue"
- "Cross-sell beauty products to fashion buyers — potential ₹2.8L revenue"

**How it works:** Click "Scan for Opportunities" and the AI analyzes your data + searches the web for trending marketing ideas, then suggests specific opportunities.

#### Agent Proposals (`/proposals`)
When the AI creates a campaign plan, it shows up here for your approval. Each proposal shows:
- The campaign title and channel (WhatsApp/SMS/Email)
- The message template
- A confidence score (how sure the AI is)
- AI reasoning (why it thinks this will work)

You can: **Approve** (launches the campaign), **Edit** (modify before launching), or **Reject**

#### Customers (`/customers`)
A full customer management page:
- **Search** by name, email, or phone
- **Filter** by tags: All, Active (bought in 30 days), VIP (spent ₹10,000+), At Risk (high spender but inactive 45+ days), New (signed up in 30 days)
- **Import** customers from Excel/CSV files
- **View** customer details (click any customer card to see their full profile, orders, and tags)

**Phone validation:** All Indian phone numbers are validated to be exactly 10 digits starting with 6-9.

#### Segments (`/segments`)
Groups of customers defined by rules. Two tabs:

1. **AI-Suggested**: Segments created automatically by the AI
2. **Manual Segments**: Segments you create yourself

**Creating a segment manually:**
1. Give it a name (e.g., "High-Value Mumbai Customers")
2. Set rules like: City = Mumbai AND LTV > 5000
3. The system shows how many customers match
4. Save it

**AI-generated segments:** Click "Generate with AI" and the AI analyzes your customer data to automatically create 5-8 meaningful segments.

#### Campaigns (`/campaigns`)
All your marketing campaigns in one place:
- See each campaign's status (Draft, Running, Stopped, Completed)
- View stats: Sent, Delivered, Opened, Clicked, Converted, Revenue
- Create new campaigns with a form
- Launch or stop campaigns
- Click into any campaign for detailed analytics

#### Campaign Detail (`/campaigns/:id`)
Deep dive into one campaign:
- KPI cards showing every metric
- A bar chart showing the funnel (Sent → Delivered → Opened → Clicked → Converted)
- A table of all individual messages sent with their status

#### Analytics (`/analytics`)
Aggregate performance across all campaigns:
- **Channel Performance**: How each channel (WhatsApp, SMS, Email) performs
- **Top Campaigns**: Best performing campaigns ranked by revenue
- **Campaign Funnel**: Overall funnel across all campaigns

#### Pipeline Monitor (`/pipeline`)
Real-time view of message delivery:
- **Pipeline stages**: Campaign → Sent → Delivered → Opened → Clicked → Converted
- **Event Timeline**: A live feed of what's happening (auto-refreshes every 10 seconds)
- **Delivery Summary**: Big numbers for Sent, Delivered, Converted

#### Settings (`/settings`)
Configure the platform:
- Platform name, timezone, currency
- AI model selection
- Scanning schedule
- Auto-approve toggle (let AI launch campaigns without your approval)
- Notification preferences

### 4.3 The AI Command Centre

This is a **floating chat button** (bottom-right corner) that opens a full-screen AI assistant. Unlike the AI Studio (which focuses on campaign creation), the Command Centre can:

- Answer questions about your data ("How many VIP customers do I have?")
- Take actions ("Stop the running campaign")
- Show live system status
- Execute commands that require your approval before running

**How it works:**
1. You type a message
2. The AI processes it and may call "tools" (functions that fetch or modify data)
3. Each tool call is shown to you with details
4. For write actions (create, update, delete, launch), you see a "Pending Action" card
5. You click "Approve" or "Reject"
6. If approved, the action is executed

### 4.4 Key Components

#### ProtectedRoute
A security guard. Before showing any page, it checks: "Is the user logged in?" If not, it redirects to the sign-in page.

#### AppLayout
The main frame of the website. It puts the sidebar on the left and the page content on the right. It also manages the floating AI bot button and the AI Command Centre overlay.

#### Sidebar
The navigation menu. It:
- Shows all navigation links grouped by category
- Displays badge counts (number of pending opportunities and proposals)
- Polls every 30 seconds to update badge counts
- Shows the user's profile at the bottom with a logout button

#### AICommandCentre (480 lines — the biggest component)
The full AI chat overlay. Features:
- **Chat interface**: Send messages, see streaming responses
- **System status**: Shows channel health and active AI runs
- **Suggestion pills**: Quick prompts to try
- **Structured responses**: The AI's responses are rendered as beautiful cards (not just plain text)
- **Tool call visualization**: Shows which tools the AI used and their results
- **Pending action cards**: For actions needing approval

#### AgentResponseRenderer
Turns the AI's structured responses into visual cards:
- `text` → Plain text bubble
- `segment_proposal` → A segment card with "Use This Segment" button
- `message_proposal` → A/B message variant cards
- `campaign_details` → Full campaign plan card
- `campaign_proposal` → Campaign proposal with confidence bar
- `insight_report` → Metrics + recommendations
- `opportunity_list` → Opportunity cards with "Generate Campaign"
- `error` → Error card
- `confirmation_required` → Confirm/reject card

### 4.5 Hooks (Reusable Code)

#### useApi
A custom hook that fetches data from the API. It:
- Shows loading state while fetching
- Handles errors gracefully
- Supports automatic re-fetching
- Cancels requests when the component unloads (prevents memory leaks)

#### useSSE (Server-Sent Events)
A hook for real-time streaming from the AI. It:
- Opens a connection to the server
- Receives events one by one as the AI processes
- Buffers events and updates the UI in batches (for smooth rendering)
- Can be stopped or cleared

### 4.6 Utility Files

#### api.js (Axios Instance)
A pre-configured HTTP client that:
- Points to the backend server (http://localhost:8000)
- Automatically adds the user's authentication token to every request
- Has a 15-second timeout

#### utils.js
Helper functions:
- `cn()` — Merges CSS class names
- `formatCurrency()` — Formats money as ₹1,234
- `formatNumber()` — Formats numbers with commas
- `relativeTime()` — Shows "Today", "5d", "2mo", "1y"
- `getAvatarColor()` — Picks a color based on the person's name
- `getInitials()` — Gets first letters of name (e.g., "John Doe" → "JD")

### 4.7 UI Components (shadcn/ui)

All 16 UI components come from **shadcn/ui**, a library of beautiful, accessible components:

| Component | What It Looks Like |
|-----------|-------------------|
| `button` | Clickable buttons with variants (primary, secondary, danger, etc.) |
| `card` | Rounded boxes with shadows for content sections |
| `dialog` | Pop-up modals for forms and confirmations |
| `input` | Text fields for typing |
| `textarea` | Multi-line text fields |
| `select` | Dropdown menus |
| `badge` | Small colored labels (e.g., "Running", "Draft") |
| `tabs` | Tab interfaces for switching between views |
| `progress` | Progress bars |
| `skeleton` | Loading placeholders (gray pulsing shapes) |
| `sonner` | Toast notifications (small pop-ups in the corner) |
| `switch` | Toggle on/off switches |
| `separator` | Horizontal or vertical lines |
| `avatar` | User profile pictures or initials |
| `alert` | Alert messages |
| `label` | Labels for form fields |

---

## 5. Backend — The Brain Behind the Website

### 5.1 What the Backend Does

The backend is the **central hub** that:
1. Receives requests from the frontend
2. Checks if the user is authenticated (logged in)
3. Reads/writes data to the database
4. Calls the AI service when needed
5. Calls the channel service to send messages
6. Returns responses to the frontend

### 5.2 Entry Point (`src/index.js`)

When the backend starts, it:
1. Loads environment variables (secret keys, database URLs)
2. Creates an Express app (a web server)
3. Enables CORS (allows the frontend to talk to the backend)
4. Sets up Clerk middleware (authentication)
5. Connects all the route handlers (like plugging in different modules)
6. Connects to MongoDB
7. Starts listening on port 8000

### 5.3 Database Connection (`src/db.js`)

Connects to MongoDB (a NoSQL database) at `mongodb://localhost:27017/xenocrm`. If the connection fails, the server won't start.

### 5.4 Authentication Middleware

Two layers of security:

1. **Clerk Middleware** (`clerkMiddleware`): Validates JWT tokens on every request. This is like a bouncer checking IDs at the door.

2. **requireAuth** (`src/middleware/auth.js`): Extracts the user ID from the validated token and attaches it to the request. This ensures every database query is scoped to the logged-in user — you can only see YOUR customers, YOUR campaigns, etc.

### 5.5 Error Handler (`src/middleware/errorHandler.js`)

A safety net that catches errors and returns friendly messages:
- **Validation errors** (bad input) → 400 status
- **Invalid ID format** → 400 status
- **Duplicate entry** (e.g., same email) → 409 status
- **Server errors** → 500 status (hides details in production)

### 5.6 Data Models (The Database Blueprint)

#### Customer
Represents a person who buys products.

| Field | Type | What It Means |
|-------|------|---------------|
| `userId` | String | Who owns this customer (the logged-in user) |
| `name` | Text | Customer's full name |
| `email` | Text | Email address (must be unique) |
| `phone` | Text | Indian phone number (10 digits, starts with 6-9) |
| `city` | Text | Which city they live in |
| `gender` | Text | male, female, or other |
| `age` | Number | Their age |
| `tags` | List of text | Labels like "vip", "active", "at_risk" |
| `ltv` | Number | Lifetime Value — total money they've spent |
| `totalOrders` | Number | How many orders they've placed |
| `lastOrderAt` | Date | When they last ordered something |
| `createdAt` | Date | When they were added to the system |

**Smart features:**
- Phone numbers are automatically cleaned up (removes spaces, dashes, country code)
- Indexed fields (ltv, lastOrderAt, city, tags, totalOrders) for fast searching

#### Order
Represents a purchase.

| Field | Type | What It Means |
|-------|------|---------------|
| `customerId` | Reference | Links to the Customer who made the purchase |
| `productName` | Text | What was bought |
| `category` | Text | Fashion, Beauty, Food, Electronics, or Accessories |
| `amount` | Number | How much they paid |
| `orderedAt` | Date | When the order was placed |

#### Segment
A group of customers defined by rules.

| Field | Type | What It Means |
|-------|------|---------------|
| `name` | Text | Segment name (e.g., "VIP Customers") |
| `description` | Text | What this segment represents |
| `filterRules` | List of rules | Conditions like "LTV > 5000" |
| `logic` | Text | AND (all rules must match) or OR (any rule can match) |
| `customerCount` | Number | How many customers match |
| `createdBy` | Text | "human" (you created it) or "agent" (AI created it) |

**Filter Rule example:**
```json
{"field": "ltv", "operator": "gte", "value": 5000}
```
This means: "LTV is greater than or equal to 5000"

#### Campaign
A marketing campaign.

| Field | Type | What It Means |
|-------|------|---------------|
| `name` | Text | Campaign name |
| `segmentId` | Reference | Which segment this targets |
| `channel` | Text | whatsapp, sms, email, or rcs |
| `messageTemplate` | Text | The message with placeholders like {name} and {brand} |
| `status` | Text | draft, running, stopped, or completed |
| `createdBy` | Text | "human" or "agent" |
| `stats` | Object | sent, delivered, opened, read, clicked, converted, revenue, failed |
| `launchedAt` | Date | When it was launched |
| `completedAt` | Date | When it finished |

#### Communication
An individual message sent to one customer.

| Field | Type | What It Means |
|-------|------|---------------|
| `campaignId` | Reference | Which campaign this belongs to |
| `customerId` | Reference | Who received it |
| `message` | Text | The actual message content |
| `channel` | Text | whatsapp, sms, or email |
| `status` | Text | pending → sent → delivered → opened → read → clicked → converted (or failed) |

#### Opportunity
An AI-discovered marketing opportunity.

| Field | Type | What It Means |
|-------|------|---------------|
| `title` | Text | Opportunity name |
| `description` | Text | What the opportunity is |
| `audienceDescription` | Text | Who to target |
| `expectedRevenue` | Number | Estimated revenue in ₹ |
| `aiReasoning` | Text | Why the AI thinks this will work |
| `status` | Text | active, dismissed, or converted |

#### AgentProposal
A campaign plan created by the AI for human approval.

| Field | Type | What It Means |
|-------|------|---------------|
| `title` | Text | Campaign title |
| `segmentId` | Reference | Target segment |
| `channel` | Text | whatsapp, sms, email, or rcs |
| `messageTemplate` | Text | The proposed message |
| `confidenceScore` | Number | 0-1, how confident the AI is |
| `aiReasoning` | Text | Why this campaign should work |
| `status` | Text | pending, approved, or rejected |

#### PipelineEvent
A log entry in the delivery pipeline.

| Field | Type | What It Means |
|-------|------|---------------|
| `type` | Text | What happened (e.g., "campaign_dispatched") |
| `title` | Text | Short description |
| `description` | Text | Longer description |
| `badge` | Text | Event, OK, Retry, or Failed |
| `campaignId` | Reference | Related campaign |

#### Settings
User preferences.

| Field | Type | Default |
|-------|------|---------|
| `platformName` | Text | "Xeno AI Campaign Studio" |
| `timezone` | Text | "Asia/Kolkata" |
| `currency` | Text | "INR" |
| `aiModel` | Text | "default" |
| `scanSchedule` | Text | "daily_6am" |
| `autoApprove` | Boolean | false |
| `notifCampaignComplete` | Boolean | true |
| `notifOpportunities` | Boolean | true |
| `notifWeeklyDigest` | Boolean | false |

### 5.7 Routes (API Endpoints)

Each route is a URL that the frontend can call to perform an action.

#### Customers Routes (`/api/customers`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/customers` | List customers with search, filtering, pagination, sorting |
| GET | `/api/customers/distributions` | Get aggregated stats (LTV buckets, order counts, recency, city, gender) |
| GET | `/api/customers/:id` | Get one customer + their recent orders |
| POST | `/api/customers` | Create a new customer |
| POST | `/api/customers/bulk` | Import up to 10,000 customers at once |
| DELETE | `/api/customers/:id` | Delete a customer |

**Smart features:**
- **Tag filtering**: Pre-defined rules for "active" (ordered in 30 days), "vip" (LTV > ₹10,000), "at_risk" (high LTV but inactive 45+ days), "new" (signed up in 30 days)
- **Segment filtering**: Apply any segment's rules to filter customers
- **Phone validation**: All phones must be 10-digit Indian numbers starting with 6-9

#### Orders Routes (`/api/orders`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/orders` | List orders with pagination |
| POST | `/api/orders/bulk` | Import up to 10,000 orders at once |

#### Segments Routes (`/api/segments`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/segments` | List all segments |
| GET | `/api/segments/:id` | Get one segment |
| GET | `/api/segments/:id/customers` | Get customers matching a segment |
| POST | `/api/segments` | Create/update a segment |
| POST | `/api/segments/preview` | Preview how many customers match rules |
| POST | `/api/segments/generate` | Ask AI to generate segments |
| POST | `/api/segments/ai-generate` | Generate segments with a custom prompt |
| DELETE | `/api/segments/:id` | Delete a segment |

**How segment creation works:**
1. You define filter rules (e.g., "city = Mumbai AND ltv > 5000")
2. The system converts these rules into a MongoDB query
3. It counts how many customers match
4. It saves the segment with the count

#### Campaigns Routes (`/api/campaigns`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/campaigns` | List all campaigns |
| GET | `/api/campaigns/:id` | Get one campaign |
| GET | `/api/campaigns/:id/stats` | Get campaign statistics |
| GET | `/api/campaigns/:id/communications` | Get individual messages |
| POST | `/api/campaigns` | Create a campaign |
| PATCH | `/api/campaigns/:id` | Update a campaign |
| POST | `/api/campaigns/:id/launch` | Launch a campaign |
| PATCH | `/api/campaigns/:id/stop` | Stop a running campaign |
| DELETE | `/api/campaigns/:id` | Delete a campaign |

**How launching works:**
1. Find all customers matching the campaign's segment
2. Create a Communication record for each customer
3. Personalize the message (replace {name} with customer's name, {brand} with brand name)
4. Send messages in batches of 100 to the Channel Service
5. Log a pipeline event

#### Analytics Routes (`/api/analytics`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/analytics/overview` | KPI summary (total customers, active campaigns, messages sent, revenue) |
| GET | `/api/analytics/channels` | Performance by channel (delivery rate, open rate, click rate, conversion rate) |
| GET | `/api/analytics/campaigns/top` | Top campaigns by revenue |
| GET | `/api/analytics/funnel` | Overall funnel (sent → delivered → opened → clicked → converted) |

#### Opportunities Routes (`/api/opportunities`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/opportunities` | List opportunities |
| GET | `/api/opportunities/count` | Count active opportunities |
| POST | `/api/opportunities/scan` | Ask AI to find opportunities |
| PATCH | `/api/opportunities/:id/dismiss` | Dismiss an opportunity |
| POST | `/api/opportunities/:id/generate-campaign` | Create a proposal from an opportunity |

**How scanning works:**
1. Gather customer data (total customers, city distribution, LTV segments, order count, top campaigns, lapsed customers)
2. Send this data to the AI Agent Service
3. The AI analyzes the data + searches the web for trends
4. Returns a list of opportunities with revenue estimates
5. Save them to the database

#### Proposals Routes (`/api/proposals`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/proposals` | List proposals |
| GET | `/api/proposals/count` | Count pending proposals |
| GET | `/api/proposals/:id` | Get one proposal |
| POST | `/api/proposals` | Create a proposal |
| PATCH | `/api/proposals/:id` | Update a proposal |
| PATCH | `/api/proposals/:id/approve` | Approve and launch |
| PATCH | `/api/proposals/:id/reject` | Reject a proposal |

**How approval works:**
1. Find the proposal
2. Create a Campaign from the proposal's details
3. Find customers matching the proposal's segment
4. Launch the campaign immediately
5. Mark the proposal as "approved"

#### Pipeline Routes (`/api/pipeline`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/pipeline/status` | Get pipeline stage counts |
| GET | `/api/pipeline/events` | Get event timeline |

#### Settings Routes (`/api/settings`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update settings |

#### Agent Routes (`/api/agent`)

| Method | URL | What It Does |
|--------|-----|--------------|
| POST | `/api/agent/chat` | Chat with AI (streaming SSE) |
| POST | `/api/agent/command` | Send command to AI (streaming SSE) |
| POST | `/api/agent/execute` | Execute a pending action |

#### Setup Routes (`/api/setup`)

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/api/setup/check` | Check if demo data exists |
| POST | `/api/setup/seed` | Load demo data (customers, orders, campaigns) |

#### Receipts Routes (`/api/receipts`)

| Method | URL | What It Does |
|--------|-----|--------------|
| POST | `/api/receipts/callback` | Channel service reports delivery status |

### 5.8 Services (Business Logic)

#### Segmentation Service (`services/segmentation.js`)
Converts filter rules into MongoDB queries.

**Example:**
- Rule: "LTV > 5000" → `{ ltv: { $gt: 5000 } }`
- Rule: "Last order > 30 days ago" → `{ lastOrderAt: { $lt: cutoff_date } }`
- Multiple rules with AND → `{ $and: [rule1, rule2] }`
- Multiple rules with OR → `{ $or: [rule1, rule2] }`

#### Campaign Launcher (`services/campaignLauncher.js`)
Handles sending out a campaign:
1. Creates a Communication record for each customer
2. Personalizes messages with customer names and brand name
3. Sends messages in batches of 100 to the Channel Service
4. Logs a pipeline event when done

#### Pipeline Logger (`services/pipelineLogger.js`)
A simple helper that creates pipeline event records.

---

## 6. Agent Service — The AI Brain

### 6.1 What It Does

The Agent Service is a **Python FastAPI server** that uses **CrewAI** (a framework for AI agents) to:
- Understand natural language requests
- Create campaign plans
- Write marketing messages
- Find marketing opportunities
- Generate customer segments
- Answer questions about data

### 6.2 Architecture

The AI service uses the concept of **Crews** — teams of specialized AI agents working together:

```
User Request
    │
    ▼
┌─────────────────────────────────────────────┐
│                  CREWS                       │
│                                             │
│  CampaignCrew     → Creates campaign plans  │
│  CommandCrew      → Answers questions/takes │
│                     actions                  │
│  OpportunityCrew  → Finds opportunities     │
│  InsightsCrew     → Analyzes performance    │
│  SegmentCrew      → Creates segments        │
└─────────────────────────────────────────────┘
```

Each crew has specialized **Agents** (AI workers with specific roles):

| Agent | Role | What It Does |
|-------|------|--------------|
| Campaign Synthesizer | D2C Campaign Strategist | Translates briefs into campaign plans |
| Campaign Dispatcher | Campaign Execution Manager | Validates and finalizes campaigns |
| Intent Classifier | CRM Intent Router | Routes requests to the right specialist |
| Data Analyst | CRM Data Intelligence Analyst | Fetches and summarizes data |
| Message Composer | Marketing Copywriter | Writes A/B message variants |
| Opportunity Scanner | Marketing Opportunity Detective | Finds opportunities using data + web search |
| Insights Reporter | Campaign Performance Analyst | Analyzes campaign performance |
| Segment Builder | Customer Segmentation Specialist | Creates MongoDB filter rules |
| Segment Generator | AI Segmentation Engine | Analyzes data and creates segments |
| Command Agent | CRM Command Agent | Uses tools to answer questions/take actions |

### 6.3 LLM Configuration (`crew/llm_config.py`)

Connects to a custom LLM (Large Language Model) provider. Uses environment variables:
- `CUSTOM_LLM_BASE_URL` — Where the AI model is hosted
- `CUSTOM_LLM_API_KEY` — Authentication key
- `CUSTOM_LLM_MODEL` — Which model to use

Temperature is set to 0.3 (focused, not too creative/random).

### 6.4 Campaign Crew (`crew/crews/campaign_crew.py`)

**How it works:**
1. User sends a message like "Create a Diwali sale campaign for VIP customers"
2. The Campaign Synthesizer agent creates a campaign plan as JSON:
   - Campaign Title
   - Target Audience (one of: Active Buyers, At Risk, VIP, New Buyers, Value Buyers)
   - Description
   - Product Category
3. Returns structured events that the frontend renders as beautiful cards

### 6.5 Command Crew (`crew/crews/command_crew.py`)

**How it works:**
1. User sends a command like "Show me the top 5 customers by LTV"
2. The Command Agent decides which tools to use (list_customers, get_analytics, etc.)
3. Tools make HTTP requests to the backend to fetch/modify data
4. The agent synthesizes the results into a natural language answer
5. For write actions (launch, stop, create), the tool creates a "pending action" that needs human approval

### 6.6 Opportunity Crew (`crew/crews/opportunity_crew.py`)

**How it works:**
1. Receives customer data (total customers, city distribution, LTV segments, etc.)
2. The Opportunity Scanner agent:
   - Uses **Tavily** (a web search tool) to research current marketing trends
   - Analyzes the customer data for patterns
   - Combines internal data + external trends
3. Returns 3-5 specific opportunities with revenue estimates

### 6.7 Segment Crew (`crew/crews/segment_crew.py`)

**How it works:**
1. The Segment Generator agent calls `fetch_customer_distributions` to get customer data
2. Analyzes the distributions to find meaningful segments
3. Creates precise MongoDB filter rules for each segment
4. Calls `save_segments` to store them in the database

### 6.8 Tools (Functions the AI Can Use)

The Command Agent has access to **35+ tools** organized by category:

**Customer Tools:** list_customers, get_customer, get_customer_distributions, create_customer, delete_customer

**Campaign Tools:** list_campaigns, get_campaign, get_campaign_stats, create_campaign, update_campaign, launch_campaign, stop_campaign, delete_campaign

**Segment Tools:** list_segments, get_segment, get_segment_customers, preview_segment, create_segment, delete_segment

**Opportunity Tools:** list_opportunities, dismiss_opportunity, generate_campaign_from_opportunity

**Proposal Tools:** list_proposals, get_proposal, approve_proposal, reject_proposal, update_proposal

**Analytics Tools:** get_analytics_overview, get_channels_analytics, get_top_campaigns, get_funnel

**Other Tools:** get_pipeline_status, get_settings, update_settings, list_orders

**How tools work:**
1. Each tool makes an HTTP request to the backend
2. Read-only tools (list, get) return data directly
3. Write tools (create, update, delete, launch, stop) create a "pending action" instead of executing immediately
4. The pending action is sent to the frontend for human approval
5. When approved, the frontend calls `/api/agent/execute` which executes the action

### 6.9 Schemas (`schemas/responses.py`)

Pydantic models that define the structure of AI responses. Each crew's output is validated against these schemas to ensure consistent formatting.

---

## 7. Channel Service — The Message Delivery System

### 7.1 What It Does

The Channel Service is a simple Node.js server that:
1. Receives message requests from the backend
2. Simulates sending messages via WhatsApp, SMS, or Email
3. Reports delivery status back to the backend via a callback URL

### 7.2 How It Works

1. Backend sends a POST request to `/send` with:
   - Communication ID
   - Campaign ID
   - Customer ID
   - Channel (whatsapp/sms/email)
   - Message content
   - Callback URL

2. The Channel Service:
   - Simulates network delay (50-200ms)
   - Randomly determines if delivery succeeds (85% success rate) or fails
   - After a random delay (500-3000ms), calls the callback URL with the delivery status

3. The callback hits `/api/receipts/callback` on the backend, which:
   - Updates the Communication record's status
   - Updates the Campaign's stats (delivered count)
   - Logs a pipeline event

**Note:** This is a simulation. In production, you would integrate with real WhatsApp Business API, SMS providers (like Twilio), or email services (like SendGrid).

---

## 8. The Database — Where Everything Is Stored

The project uses **MongoDB** (a NoSQL database) with the database name `xenocrm`.

### Collections (like tables in a traditional database):

| Collection | What It Stores | Estimated Size |
|------------|----------------|----------------|
| `customers` | All customer records | Large (thousands to millions) |
| `orders` | All purchase records | Large |
| `segments` | Customer segment definitions | Small (tens) |
| `campaigns` | Marketing campaigns | Small (tens to hundreds) |
| `communications` | Individual messages sent | Large (proportional to campaign size) |
| `opportunities` | AI-discovered opportunities | Small (tens) |
| `agentproposals` | AI campaign proposals | Small (tens) |
| `pipelineevents` | Pipeline event logs | Medium (grows over time) |
| `settings` | User preferences | Very small (one per user) |

### Indexes (for fast searching):

The database has indexes on frequently searched fields:
- `customers`: userId, name, email, city, ltv, lastOrderAt, tags, totalOrders
- `orders`: userId, customerId, orderedAt
- `segments`: userId, (userId + name unique)
- `campaigns`: userId, status, createdAt, stats.revenue
- `communications`: userId, campaignId, status
- `opportunities`: userId, status, createdAt
- `agentproposals`: userId, status, createdAt
- `pipelineevents`: userId, createdAt

---

## 9. How a Typical User Journey Works

### Journey 1: Creating a Campaign with AI

```
1. User opens AI Campaign Studio
2. User types: "Create a re-engagement campaign for VIP customers 
   who haven't ordered in 60 days. Use WhatsApp."
3. Frontend sends POST /api/agent/chat with the message
4. Backend forwards to Agent Service POST /crew/chat
5. CampaignCrew's Campaign Synthesizer agent processes the request
6. Returns a campaign plan with:
   - Title: "Win Back Our VIPs"
   - Audience: "At risk of losing buyers"
   - Channel: WhatsApp
   - Message variants A and B
7. Events stream back to frontend via SSE
8. Frontend renders the plan as beautiful cards
9. User clicks "Launch Now"
10. Frontend creates a proposal via POST /api/proposals
11. User goes to Agent Proposals page
12. User clicks "Approve"
13. Backend creates a Campaign, finds matching customers, 
    sends messages via Channel Service
14. Messages are delivered, status updates flow back via callbacks
15. User sees real-time updates in Pipeline Monitor
```

### Journey 2: Importing Customers

```
1. User goes to Customers page
2. User clicks "Import"
3. User selects an Excel/CSV file
4. Frontend reads the file using the xlsx library
5. Column names are mapped (e.g., "Customer Name" → "name", 
   "E-mail Address" → "email")
6. Frontend sends POST /api/customers/bulk with the customer array
7. Backend validates phone numbers, normalizes data
8. Backend inserts customers into MongoDB (skipping duplicates)
9. Frontend shows results: "500 inserted, 3 skipped"
10. Customer cards appear on the page
```

### Journey 3: Scanning for Opportunities

```
1. User goes to Opportunities page
2. User clicks "Scan for Opportunities"
3. Frontend sends POST /api/opportunities/scan
4. Backend gathers customer data:
   - Total customers count
   - Top 5 cities
   - LTV distribution
   - Total orders
   - Top 5 campaigns
   - Count of lapsed high-value customers
5. Backend sends this data to Agent Service POST /crew/opportunities
6. OpportunityCrew's Opportunity Scanner agent:
   a. Searches the web for "top marketing opportunities trends D2C"
   b. Searches for "trending marketing catchphrases viral campaigns"
   c. Analyzes the customer data
   d. Combines internal patterns + external trends
7. Returns 3-5 opportunities with revenue estimates
8. Backend saves them to the database
9. Frontend displays opportunity cards with title, revenue, reasoning
10. User can click "Generate Campaign" on any opportunity
```

---

## 10. Every File Explained

### Frontend Files

| File | Lines | What It Does (Simple Language) |
|------|-------|-------------------------------|
| `src/main.jsx` | 25 | The starting point. Sets up Clerk authentication, React Router for navigation, and renders the App. |
| `src/App.jsx` | 40 | The map of the website. Defines which page shows for each URL. |
| `src/index.css` | 30 | Global styles. Defines colors, fonts, and base styling. |
| `src/lib/api.js` | 30 | The HTTP client. Sends requests to the backend with the user's auth token. |
| `src/lib/utils.js` | 50 | Helper functions for formatting numbers, currencies, colors, and CSS classes. |
| `src/hooks/useApi.js` | 50 | A reusable hook for fetching data from the API with loading and error states. |
| `src/hooks/useSSE.js` | 80 | A hook for receiving real-time streaming data from the AI. |
| `src/components/ProtectedRoute.jsx` | 20 | Security guard. Redirects to login if not authenticated. |
| `src/components/AICommandCentre.jsx` | 480 | The full AI chat overlay. The biggest and most complex component. |
| `src/components/AgentResponseRenderer.jsx` | 250 | Turns AI responses into beautiful visual cards. |
| `src/components/layout/AppLayout.jsx` | 50 | The main frame: sidebar + content area + floating AI button. |
| `src/components/layout/Sidebar.jsx` | 146 | The navigation menu with badges and user profile. |
| `src/components/ui/*.jsx` | ~800 total | 16 reusable UI components (buttons, cards, dialogs, etc.) |
| `src/pages/Dashboard.jsx` | 155 | The home page with stats and quick actions. |
| `src/pages/AIStudio.jsx` | 348 | The AI chat interface for creating campaigns. |
| `src/pages/Opportunities.jsx` | 130 | AI-discovered marketing opportunities. |
| `src/pages/AgentProposals.jsx` | 239 | Pending AI campaign proposals for approval. |
| `src/pages/Customers.jsx` | 377 | Customer management with import, search, and filtering. |
| `src/pages/Segments.jsx` | 341 | Customer segment management with AI generation. |
| `src/pages/Campaigns.jsx` | 263 | Campaign management with create, launch, stop. |
| `src/pages/CampaignDetail.jsx` | 146 | Deep dive into one campaign's performance. |
| `src/pages/Analytics.jsx` | 135 | Aggregate analytics across all campaigns. |
| `src/pages/PipelineMonitor.jsx` | 109 | Real-time message delivery monitoring. |
| `src/pages/Settings.jsx` | 108 | Platform configuration. |
| `src/pages/SignInPage.jsx` | 9 | Clerk sign-in page. |
| `src/pages/SignUpPage.jsx` | 9 | Clerk sign-up page. |
| `src/pages/Login.jsx` | 5 | Redirects to home page. |

### Backend Files

| File | Lines | What It Does |
|------|-------|-------------|
| `src/index.js` | 55 | Entry point. Sets up Express server, connects all routes, starts listening. |
| `src/db.js` | 15 | Connects to MongoDB database. |
| `src/middleware/auth.js` | 12 | Checks if user is logged in and extracts their ID. |
| `src/middleware/errorHandler.js` | 25 | Catches errors and returns friendly messages. |
| `src/models/Customer.js` | 55 | Database schema for customers with validation. |
| `src/models/Order.js` | 20 | Database schema for orders. |
| `src/models/Segment.js` | 30 | Database schema for customer segments. |
| `src/models/Campaign.js` | 45 | Database schema for campaigns with stats. |
| `src/models/Communication.js` | 30 | Database schema for individual messages. |
| `src/models/Opportunity.js` | 25 | Database schema for AI opportunities. |
| `src/models/AgentProposal.js` | 30 | Database schema for AI proposals. |
| `src/models/PipelineEvent.js` | 20 | Database schema for pipeline events. |
| `src/models/Settings.js` | 20 | Database schema for user settings. |
| `src/routes/customers.js` | 200 | Customer CRUD, bulk import, distributions. |
| `src/routes/orders.js` | 35 | Order listing and bulk import. |
| `src/routes/segments.js` | 130 | Segment CRUD, AI generation, preview. |
| `src/routes/campaigns.js` | 150 | Campaign CRUD, launch, stop, stats. |
| `src/routes/analytics.js` | 100 | Analytics endpoints for dashboard. |
| `src/routes/opportunities.js` | 110 | Opportunity listing, scanning, dismissing. |
| `src/routes/proposals.js` | 120 | Proposal CRUD, approve, reject. |
| `src/routes/pipeline.js` | 50 | Pipeline status and events. |
| `src/routes/settings.js` | 30 | Settings CRUD. |
| `src/routes/setup.js` | 100 | Demo data seeder. |
| `src/routes/agent.js` | 100 | AI agent chat and command endpoints. |
| `src/routes/receipts.js` | 40 | Delivery callback webhook. |
| `src/services/segmentation.js` | 50 | Converts filter rules to MongoDB queries. |
| `src/services/campaignLauncher.js` | 80 | Sends campaign messages via Channel Service. |
| `src/services/pipelineLogger.js` | 10 | Logs pipeline events. |

### Agent Service Files

| File | Lines | What It Does |
|------|-------|-------------|
| `main.py` | 100 | FastAPI entry point. Defines all API endpoints. |
| `requirements.txt` | 8 | Python dependencies. |
| `schemas/responses.py` | 120 | Pydantic models for AI response validation. |
| `crew/llm_config.py` | 20 | Configures the AI language model. |
| `crew/agents/*.py` | ~300 total | 10 specialized AI agents with different roles. |
| `crew/crews/*.py` | ~400 total | 5 crews (teams of agents) for different tasks. |
| `crew/tools/__init__.py` | 30 | Exports all 35+ tools. |
| `crew/tools/http.py` | 80 | HTTP client for talking to the backend. |
| `crew/tools/customers.py` | 100 | Customer-related tools. |
| `crew/tools/campaigns.py` | 150 | Campaign-related tools. |
| `crew/tools/segments.py` | 100 | Segment-related tools. |
| `crew/tools/opportunities.py` | 60 | Opportunity-related tools. |
| `crew/tools/proposals.py` | 80 | Proposal-related tools. |
| `crew/tools/analytics.py` | 60 | Analytics-related tools. |
| `crew/tools/pipeline.py` | 30 | Pipeline-related tools. |
| `crew/tools/settings.py` | 40 | Settings-related tools. |
| `crew/tools/orders.py` | 30 | Order-related tools. |

### Channel Service Files

| File | Lines | What It Does |
|------|-------|-------------|
| `src/index.js` | ~60 | Express server that simulates message sending. |
| `package.json` | 15 | Node.js dependencies. |
| `Dockerfile` | 10 | Docker configuration. |

---

## 11. Security & Authentication

### How Authentication Works

1. **Clerk** handles all authentication (sign-up, sign-in, sessions)
2. When a user signs in, Clerk gives them a **JWT token** (a digital ID card)
3. The frontend stores this token and attaches it to every API request
4. The backend validates the token using Clerk's middleware
5. The user's ID is extracted and used to scope all database queries

### Security Features

- **Multi-tenancy**: Each user can only see their own data. Every database query includes `userId: req.userId`
- **JWT validation**: Tokens are validated on every request
- **Phone validation**: Indian phone numbers must be 10 digits starting with 6-9
- **Input validation**: Mongoose schemas validate all data before saving
- **Rate limiting**: Bulk imports limited to 10,000 records
- **Error handling**: Production mode hides internal error details
- **CORS**: Only the frontend URL can access the backend

### Environment Variables (Secret Keys)

| Variable | What It Protects |
|----------|-----------------|
| `CLERK_SECRET_KEY` | Backend authentication |
| `CLERK_PUBLISHABLE_KEY` | Frontend authentication |
| `MONGODB_URI` | Database connection |
| `CUSTOM_LLM_API_KEY` | AI model access |
| `TAVILY_API_KEY` | Web search access |

---

## 12. Deployment — How It Goes Live

### Docker Compose (All Services Together)

The `docker-compose.yml` file defines how all 4 services run together:

```yaml
services:
  mongodb:        → Port 27017 (database)
  backend:        → Port 8000 (main server)
  agent-service:  → Port 8001 (AI brain)
  channel-service: → Port 8002 (message sender)
  frontend:       → Port 5173 → 80 (website)
```

Each service has its own **Dockerfile** (instructions for building a container):

- **Frontend**: Multi-stage build — Node.js builds the React app, then Nginx serves the static files
- **Backend**: Node.js 20 Alpine image, installs dependencies, runs the server
- **Agent Service**: Python 3.11 Slim image, installs pip dependencies, runs uvicorn
- **Channel Service**: Node.js 20 Alpine image

### Nginx Configuration

The frontend's Nginx config handles **SPA routing**:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
This means: "If a file doesn't exist, serve index.html" — which allows React Router to handle URLs.

### Vercel Deployment

The `vercel.json` file configures Vercel for SPA deployment:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Same concept as Nginx — all URLs redirect to index.html.

---

## Summary

**Xeno AI Campaign Studio** is a full-stack AI-powered marketing platform with:

- **4 services** working together (Frontend, Backend, AI Agent, Channel)
- **9 database models** storing customers, orders, segments, campaigns, and more
- **35+ API endpoints** for CRUD operations
- **35+ AI tools** the agent can use to interact with data
- **5 specialized AI crews** for different marketing tasks
- **14 frontend pages** with a beautiful dark sidebar design
- **Real-time streaming** for AI responses
- **Human-in-the-loop** approval for AI actions
- **Multi-tenant security** ensuring data isolation

The platform empowers D2C marketers to leverage AI for customer segmentation, campaign creation, opportunity discovery, and performance analytics — all through natural language interaction.
