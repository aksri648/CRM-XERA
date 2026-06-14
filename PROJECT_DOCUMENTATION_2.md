# Xeno AI — Campaign Intelligence Platform

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Services](#3-services)
4. [Frontend](#4-frontend)
5. [Backend API](#5-backend-api)
6. [Agent Service](#6-agent-service)
7. [Channel Service](#7-channel-service)
8. [Data Models](#8-data-models)
9. [Infrastructure](#9-infrastructure)
10. [Environment Variables](#10-environment-variables)
11. [Development Setup](#11-development-setup)

---

## 1. Project Overview

**Xeno AI** is a full-stack AI-native CRM campaign intelligence platform. It enables D2C brands to manage customers, build audience segments, launch multi-channel campaigns, and leverage AI agents for opportunity discovery, campaign strategy, and performance insights.

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, ShadCN UI, Tailwind CSS, Recharts |
| Backend | Node.js, Express, Mongoose (MongoDB) |
| Agent Service | Python 3.12, FastAPI, CrewAI, Pydantic |
| Channel Service | Node.js, Express (mock delivery simulator) |
| Auth | Clerk (JWT-based) |
| Database | MongoDB 7 |
| Orchestration | Docker Compose |

**Ports:**

| Service | Port |
|---------|------|
| Frontend | 5173 |
| Backend | 8000 |
| Agent Service | 8001 |
| Channel Service | 8002 |
| MongoDB | 27017 |

---

## 2. Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│   Backend    │────▶│  Agent Service  │
│  (React/Vite)│     │  (Express)   │     │  (FastAPI/CrewAI)│
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │   Channel    │────▶│    MongoDB      │
                    │   Service    │     │                 │
                    └──────────────┘     └─────────────────┘
```

**Request Flow:**
1. Frontend sends authenticated requests (Clerk JWT) to Backend
2. Backend routes handle CRUD operations and business logic
3. For AI features, Backend proxies to Agent Service (CrewAI crews)
4. Campaign launches dispatch messages via Channel Service
5. Channel Service simulates delivery and sends callbacks to Backend
6. Backend updates Communication and Campaign stats via receipt callbacks

---

## 3. Services

### 3.1 Frontend (`frontend/`)

React SPA with client-side routing via `react-router-dom`. Auth via `@clerk/react`. Data fetching via `axios` with automatic JWT injection.

### 3.2 Backend (`backend/`)

Express REST API. Multi-tenant via Clerk `userId` on every query. Mongoose ODM for MongoDB. Handles all CRUD, analytics aggregation, campaign launching, and receipt processing.

### 3.3 Agent Service (`agent-service/`)

Python FastAPI service running CrewAI crews. Five specialized crews handle campaign strategy, CRM commands, opportunity scanning, insights reporting, and segment generation. Communicates with Backend via HTTP.

### 3.4 Channel Service (`channel-service/`)

Mock delivery service that simulates message sending across WhatsApp, SMS, Email, and RCS channels. Models realistic delivery rates, engagement funnels, and async callbacks.

---

## 4. Frontend

### 4.1 Entry Point

**`main.jsx`** — Wraps app in `ClerkProvider` + `BrowserRouter`. Initializes Clerk JWT token getter for axios interceptor.

**`App.jsx`** — Route definitions:

| Path | Component | Description |
|------|-----------|-------------|
| `/sign-in/*` | `SignInPage` | Clerk sign-in |
| `/sign-up/*` | `SignUpPage` | Clerk sign-up |
| `/` | `Dashboard` | KPI overview, quick actions, recent campaigns |
| `/ai-studio` | `AIStudio` | AI chat interface for campaign generation |
| `/opportunities` | `Opportunities` | AI-discovered marketing opportunities |
| `/proposals` | `AgentProposals` | Review/approve AI campaign proposals |
| `/customers` | `Customers` | Customer grid with search, import, detail modal |
| `/segments` | `Segments` | AI-suggested + manual segments with rule builder |
| `/campaigns` | `Campaigns` | Campaign list, create modal, detail modal |
| `/campaigns/:id` | `CampaignDetail` | Full campaign view with funnel chart |
| `/analytics` | `Analytics` | Channel performance, top campaigns, funnel |
| `/pipeline` | `PipelineMonitor` | Real-time delivery pipeline status |
| `/settings` | `Settings` | Platform configuration |

All routes under `/` are protected by `ProtectedRoute` (Clerk auth guard).

### 4.2 Layout

**`AppLayout.jsx`** — Sidebar + main content outlet + floating bot button + Sonner toaster.

**`Sidebar.jsx`** — Navigation with grouped sections (Main, Audience, Engage, Analyze, System). Badge counters for opportunities and proposals. "AI Command Centre" button triggers modal.

### 4.3 Key Components

**`AICommandCentre.jsx`** — Floating chat modal with full CRM backend access. Streams SSE from `/api/agent/command`. Renders tool call breadcrumbs, tool result cards (customers, campaigns, segments, opportunities, key-value), and pending action cards with approve/reject buttons.

**`AgentResponseRenderer.jsx`** — Structured JSON card renderer for AI Studio responses. Card types: `TextBubble`, `SegmentProposalCard`, `MessageProposalCard`, `CampaignDetailsCard`, `CampaignProposalCard`, `InsightReportCard`, `OpportunityListCard`, `ErrorCard`, `ConfirmationCard`.

**`ProtectedRoute.jsx`** — Clerk `useAuth` guard. Shows spinner while loading, redirects to `/sign-in` if not authenticated.

### 4.4 Hooks

**`useSSE.js`** — Generic Server-Sent Events hook. Manages streaming state, event buffering (50ms batch), abort controller. Returns `{ events, isStreaming, startStream, stopStream, clearEvents }`.

**`useApi.js`** — Generic data-fetching hook with abort support. Currently unused (dead code).

### 4.5 Utilities (`lib/`)

**`api.js`** — Axios instance with `VITE_API_URL` base, 15s timeout, Clerk JWT interceptor.

**`utils.js`** — `cn()` (Tailwind merge), `formatCurrency()` (INR), `formatNumber()` (INR locale), `relativeTime()`, `getAvatarColor()`, `getInitials()`.

### 4.6 Pages Summary

| Page | Key Features |
|------|-------------|
| `Dashboard` | Auto-seeds demo data, 4 KPI cards, 4 quick actions, recent campaigns table |
| `AIStudio` | Chat UI with suggestion pills, SSE streaming, campaign detail cards, edit modal |
| `Opportunities` | Scan button triggers agent, opportunity cards with generate/dismiss |
| `AgentProposals` | Pending proposals with approve/edit/reject, confidence score bars |
| `Customers` | Paginated grid, tag filters, search, CSV/XLSX import, detail modal with orders |
| `Segments` | AI-suggested vs manual tabs, rule builder dialog, AI segment builder, customer preview |
| `Campaigns` | Campaign list, create modal (segment + channel + message), detail modal with stats |
| `CampaignDetail` | Funnel bar chart (Recharts), KPI grid, communications table |
| `Analytics` | 3 tabs: channel performance, top campaigns, aggregate funnel |
| `PipelineMonitor` | 6-stage pipeline counters, event timeline, delivery summary |
| `Settings` | General config (name, timezone, currency), AI config (model, schedule, auto-approve) |

---

## 5. Backend API

All routes require Clerk JWT auth via `requireAuth` middleware (except `/health` and `/api/receipts/callback`).

### 5.1 Customers (`/api/customers`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List customers with search, tag filter, segment filter, pagination |
| `GET` | `/distributions` | Aggregated distributions (LTV, orders, recency, city, gender) |
| `POST` | `/` | Create single customer |
| `POST` | `/bulk` | Bulk import up to 10,000 customers |
| `GET` | `/:id` | Get customer with recent orders |
| `DELETE` | `/:id` | Delete customer |

### 5.2 Orders (`/api/orders`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List orders with customer filter |

### 5.3 Segments (`/api/segments`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List segments (deduplicated by name), filter by `created_by` |
| `POST` | `/` | Create/upsert segment with filter rules, auto-counts customers |
| `POST` | `/generate` | Trigger AI segment generation via agent service |
| `POST` | `/ai-generate` | AI segment generation with custom prompt |
| `POST` | `/preview` | Preview segment customer count and sample |
| `GET` | `/:id` | Get segment by ID |
| `GET` | `/:id/customers` | Paginated customers in segment |
| `DELETE` | `/:id` | Delete segment |

### 5.4 Campaigns (`/api/campaigns`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List campaigns with status filter, sort, limit |
| `POST` | `/` | Create campaign (draft) |
| `GET` | `/:id` | Get campaign with populated segment name |
| `PATCH` | `/:id` | Update campaign |
| `POST` | `/:id/launch` | Launch campaign: resolves segment customers, dispatches via channel service |
| `GET` | `/:id/stats` | Get campaign stats |
| `GET` | `/:id/communications` | Paginated communications for campaign |
| `PATCH` | `/:id/stop` | Stop running campaign |
| `DELETE` | `/:id` | Delete campaign |

### 5.5 Receipts (`/api/receipts`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/callback` | Channel service delivery callback. Updates Communication status, Campaign stats, creates PipelineEvents. Auto-completes campaign when all communications reach terminal state. |

### 5.6 Analytics (`/api/analytics`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/overview` | Total customers, active campaigns, messages sent, revenue |
| `GET` | `/channels` | Per-channel delivery/open/click/conversion rates |
| `GET` | `/campaigns/top` | Top campaigns by revenue |
| `GET` | `/funnel` | Aggregate funnel (sent → delivered → opened → read → clicked → converted) |

### 5.7 Opportunities (`/api/opportunities`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List opportunities with status filter |
| `GET` | `/count` | Count active opportunities |
| `POST` | `/scan` | Trigger AI opportunity scan (aggregates customer data, calls agent service with Tavily web search) |
| `PATCH` | `/:id/dismiss` | Dismiss opportunity |
| `POST` | `/:id/generate-campaign` | Generate campaign proposal from opportunity |

### 5.8 Proposals (`/api/proposals`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List proposals with status filter |
| `GET` | `/count` | Count pending proposals |
| `POST` | `/` | Create proposal |
| `GET` | `/:id` | Get proposal |
| `PATCH` | `/:id` | Update proposal |
| `PATCH` | `/:id/approve` | Approve: creates campaign, resolves segment, launches immediately |
| `PATCH` | `/:id/reject` | Reject proposal |

### 5.9 Pipeline (`/api/pipeline`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Pipeline stats + channel service health check |
| `GET` | `/events` | Recent pipeline events (timeline) |

### 5.10 Settings (`/api/settings`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Get or create default settings |
| `PUT` | `/` | Update settings |

### 5.11 Setup (`/api/setup`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/check` | Check if user has data (customer count) |
| `POST` | `/seed` | Seed demo data: 10K customers, 30K orders, 5 segments, 1 campaign, 5 opportunities, 3 proposals |

### 5.12 Agent (`/api/agent`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | SSE proxy to agent service `/crew/chat` (campaign strategy) |
| `POST` | `/command` | SSE proxy to agent service `/crew/command` (CRM commands) |
| `POST` | `/confirm` | Stub confirmation endpoint |
| `POST` | `/execute` | Execute tool action (resolves entity names to IDs, dispatches to internal API) |
| `GET` | `/system-status` | Active running campaigns count |

### 5.13 Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server health check |

---

## 6. Agent Service

### 6.1 FastAPI Endpoints

| Method | Path | Crew | Description |
|--------|------|------|-------------|
| `POST` | `/crew/chat` | `CampaignCrew` | SSE streaming campaign strategy generation |
| `POST` | `/crew/command` | `CommandCrew` | SSE streaming CRM command execution |
| `POST` | `/crew/opportunities` | `OpportunityCrew` | AI opportunity scanning with Tavily web search |
| `POST` | `/crew/insights` | `InsightsCrew` | Campaign performance insights generation |
| `POST` | `/crew/segment` | `SegmentCrew` | AI segment generation from customer distributions |
| `GET` | `/health` | — | Service health check |

### 6.2 LLM Configuration (`crew/llm_config.py`)

Uses custom LLM via `CUSTOM_LLM_MODEL`, `CUSTOM_LLM_BASE_URL`, `CUSTOM_LLM_API_KEY` env vars. Configured as `openai/{model}` with `temperature=0.3`, `max_tokens=4000`.

### 6.3 Agents

| Agent | File | Role | Tools |
|-------|------|------|-------|
| `campaign_synthesizer` | `agents/campaign_synthesizer.py` | D2C Campaign Strategist | None |
| `command_judge` | `agents/command_judge.py` | CRM Command Agent | All 23 CRM tools |
| `opportunity_scanner` | `agents/opportunity_scanner.py` | Marketing Opportunity Detective | `tavily_search` |
| `insights_reporter` | `agents/insights_reporter.py` | Campaign Performance Analyst | None |
| `segment_generator_agent` | `agents/segment_generator_agent.py` | AI Segmentation Engine | `fetch_customer_distributions`, `save_segments` |

### 6.4 Crews

**`CampaignCrew`** — Single agent (campaign_synthesizer). Produces structured `CampaignDetailsResult` JSON with Campaign Title, Target Audience (5 allowed values), Description, ProductCategory.

**`CommandCrew`** — Single agent (command_judge) with all 23 CRM tools. Chains tool calls for CRUD operations. Write actions are queued as pending for human approval. Generates 3 follow-up suggestion prompts.

**`OpportunityCrew`** — Single agent (opportunity_scanner). Combines internal customer data patterns with Tavily web search for marketing trends. Produces `OpportunityScanResult` with ranked opportunities.

**`InsightsCrew`** — Single agent (insights_reporter). Analyzes campaign stats into `InsightReportResult` with metrics, recommendations, and chart data.

**`SegmentCrew`** — Single agent (segment_generator_agent). Fetches customer distributions, analyzes patterns, creates segments with MongoDB filter rules, saves to database.

### 6.5 Tools (23 total)

All tools are defined in `crew/tools/` and exported via `__init__.py` as `ALL_TOOLS`.

| Module | Tools |
|--------|-------|
| `http.py` | `set_http_tool`, `get_http_tool`, `add_pending`, `clear_pending`, `record_tool_call`, `record_tool_result`, `_safe_summary` |
| `customers.py` | `list_customers`, `get_customer`, `get_customer_distributions`, `create_customer`, `delete_customer` |
| `campaigns.py` | `list_campaigns`, `get_campaign`, `get_campaign_stats`, `create_campaign`, `update_campaign`, `launch_campaign`, `stop_campaign`, `delete_campaign` |
| `segments.py` | `list_segments`, `get_segment`, `get_segment_customers`, `preview_segment`, `create_segment`, `delete_segment` |
| `opportunities.py` | `list_opportunities`, `dismiss_opportunity`, `generate_campaign_from_opportunity` |
| `proposals.py` | `list_proposals`, `get_proposal`, `approve_proposal`, `reject_proposal`, `update_proposal` |
| `analytics.py` | `get_analytics_overview`, `get_channels_analytics`, `get_top_campaigns`, `get_funnel` |
| `pipeline.py` | `get_pipeline_status` |
| `settings.py` | `get_settings`, `update_settings` |
| `orders.py` | `list_orders` |

### 6.6 Pydantic Schemas (`schemas/responses.py`)

| Schema | Used By |
|--------|---------|
| `CampaignDetailsResult` / `CampaignDetails` | `CampaignCrew` |
| `OpportunityScanResult` / `OpportunityItem` | `OpportunityCrew` |
| `InsightReportResult` | `InsightsCrew` |
| `CommandResult` | (available but not enforced) |

---

## 7. Channel Service

### 7.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/send` | Accept message job, simulate async delivery |
| `GET` | `/health` | Health check with processed count |
| `GET` | `/stats` | Delivery stats (sent, outcomes breakdown) |

### 7.2 Simulator (`simulator.js`)

**Delivery Rates:**
| Channel | Rate |
|---------|------|
| WhatsApp | 92% |
| SMS | 96% |
| Email | 87% |
| RCS | 85% |

**Engagement Funnel:**
| Stage | Rate |
|-------|------|
| Opened | 45% |
| Read | 70% |
| Clicked | 30% |
| Converted | 12% |

**Simulated Delays (ms):**
| Transition | Range |
|------------|-------|
| Pending → Sent | 500–1,500 |
| Sent → Delivered | 1,000–4,000 |
| Delivered → Opened | 3,000–15,000 |
| Opened → Read | 2,000–8,000 |
| Read → Clicked | 1,000–5,000 |
| Clicked → Converted | 2,000–10,000 |

Each stage sends an async callback to the backend's `/api/receipts/callback` endpoint with exponential retry (3 attempts).

---

## 8. Data Models

### 8.1 Customer

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `name` | String | Required, indexed |
| `email` | String | Required, unique, indexed |
| `phone` | String | 10-digit Indian, validated, set via `normalizePhone` |
| `city` | String | Indexed |
| `gender` | String | Enum: male, female, other |
| `age` | Number | |
| `tags` | [String] | Indexed |
| `ltv` | Number | Default 0 |
| `totalOrders` | Number | Default 0 |
| `lastOrderAt` | Date | |
| `createdAt` | Date | Default now |

Indexes: `{ ltv, lastOrderAt, city }`, `{ tags }`, `{ totalOrders }`

### 8.2 Order

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `customerId` | ObjectId→Customer | Required, indexed |
| `productName` | String | Required |
| `category` | String | Enum: fashion, beauty, food, electronics, accessories |
| `amount` | Number | Required |
| `orderedAt` | Date | Default now, indexed descending |

### 8.3 Segment

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `name` | String | Required, unique per user |
| `description` | String | |
| `filterRules` | [{field, operator, value}] | Subdocument schema |
| `logic` | String | Enum: AND, OR. Default AND |
| `customerCount` | Number | Default 0 |
| `createdBy` | String | Enum: human, agent |
| `createdAt` | Date | Default now |

### 8.4 Campaign

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `name` | String | Required |
| `segmentId` | ObjectId→Segment | |
| `channel` | String | Enum: whatsapp, sms, email, rcs. Required |
| `messageTemplate` | String | Required. Supports `{name}`, `{brand}` |
| `status` | String | Enum: draft, running, stopped, completed |
| `createdBy` | String | Enum: human, agent |
| `stats` | Object | sent, delivered, opened, read, clicked, converted, revenue, failed |
| `launchedAt` | Date | |
| `completedAt` | Date | |
| `createdAt` | Date | Default now |

### 8.5 Communication

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `campaignId` | ObjectId→Campaign | Required, indexed |
| `customerId` | ObjectId→Customer | Required |
| `message` | String | Required |
| `channel` | String | Required |
| `status` | String | Enum: pending→sent→delivered→opened→read→clicked→converted→failed |
| `sentAt` | Date | |
| `updatedAt` | Date | Default now |

### 8.6 Opportunity

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `title` | String | Required |
| `description` | String | |
| `audienceDescription` | String | |
| `expectedRevenue` | Number | |
| `aiReasoning` | String | |
| `status` | String | Enum: active, dismissed, converted |
| `createdAt` | Date | Default now |

### 8.7 AgentProposal

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `title` | String | Required |
| `segmentId` | ObjectId→Segment | |
| `channel` | String | Enum: whatsapp, sms, email, rcs |
| `messageTemplate` | String | |
| `confidenceScore` | Number | 0–1 |
| `aiReasoning` | String | |
| `status` | String | Enum: pending, approved, rejected |
| `createdAt` | Date | Default now |

### 8.8 PipelineEvent

| Field | Type | Notes |
|-------|------|-------|
| `userId` | String | Required, indexed |
| `type` | String | e.g. campaign_dispatched, callback_received |
| `title` | String | |
| `description` | String | |
| `badge` | String | Enum: Event, OK, Retry, Failed |
| `campaignId` | ObjectId→Campaign | |
| `createdAt` | Date | Default now, indexed |

### 8.9 Settings

| Field | Type | Default |
|-------|------|---------|
| `userId` | String | Required, unique |
| `platformName` | String | Xeno AI Campaign Studio |
| `timezone` | String | Asia/Kolkata |
| `currency` | String | INR |
| `aiModel` | String | default |
| `scanSchedule` | String | daily_6am |
| `autoApprove` | Boolean | false |
| `notifCampaignComplete` | Boolean | true |
| `notifOpportunities` | Boolean | true |
| `notifWeeklyDigest` | Boolean | false |

---

## 9. Infrastructure

### 9.1 Docker Compose

5 services: `mongodb`, `backend`, `agent-service`, `channel-service`, `frontend`.

- MongoDB uses `mongo:7` image with persistent volume `mongodb_data`
- Backend depends on MongoDB
- Frontend built with Vite, served on port 80 inside container, mapped to 5173
- Agent service requires LLM and Tavily API keys via env vars

### 9.2 Frontend Build

- Vite + React plugin
- Tailwind CSS with `tailwindcss-animate`
- ShadCN UI components (16 components in `components/ui/`)
- Path aliases: `src/` mapped in Vite config

### 9.3 Backend

- ESM modules (`"type": "module"`)
- `node --watch` for dev
- Clerk middleware applied globally
- JSON body limit: 10mb

### 9.4 Agent Service

- Python 3.12
- FastAPI with uvicorn
- CrewAI 0.121.0
- httpx for HTTP requests to backend
- Tavily Python SDK for web search

---

## 10. Environment Variables

### Root `.env.example`

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/xenocrm

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_placeholder
CLERK_SECRET_KEY=sk_test_placeholder

# Custom LLM (OpenAI-compatible)
CUSTOM_LLM_BASE_URL=https://your-llm-provider.com/v1
CUSTOM_LLM_API_KEY=your-api-key-here
CUSTOM_LLM_MODEL=your-model-name

# Service URLs
CHANNEL_SERVICE_URL=http://localhost:8002
AGENT_SERVICE_URL=http://localhost:8001
RECEIPT_CALLBACK_URL=http://localhost:8000/api/receipts/callback

# Frontend
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder

# Node env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Agent Service `.env`

```bash
CUSTOM_LLM_BASE_URL=...
CUSTOM_LLM_API_KEY=...
CUSTOM_LLM_MODEL=...
TAVILY_API_KEY=...
```

---

## 11. Development Setup

### Prerequisites

- Node.js 18+
- Python 3.12+
- MongoDB (local or Docker)
- Clerk account (for auth keys)
- LLM provider (OpenAI-compatible API)
- Tavily API key (for web search)

### Quick Start

```bash
# 1. Clone and install
cd PlacementPrep
npm install --prefix frontend
npm install --prefix backend
npm install --prefix channel-service
pip install -r agent-service/requirements.txt

# 2. Configure env
cp .env.example .env
# Edit .env with your keys

# 3. Start with Docker Compose
docker-compose up -d

# Or start individually:
mongod --dbpath /data/db                    # Terminal 1
cd backend && npm run dev                   # Terminal 2
cd agent-service && uvicorn main:app --port 8001 --reload  # Terminal 3
cd channel-service && npm run dev           # Terminal 4
cd frontend && npm run dev                  # Terminal 5
```

### First Visit

1. Open `http://localhost:5173`
2. Sign up/in via Clerk
3. Dashboard auto-seeds 10K customers, 30K orders, 5 segments, 1 campaign, 5 opportunities, 3 proposals
4. Navigate to AI Studio to generate campaigns via chat
5. Use AI Command Centre for direct CRM queries and actions
