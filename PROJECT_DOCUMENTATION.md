# Xeno AI — CRM Campaign Intelligence Platform

> AI-Native Mini CRM powered by MERN + CrewAI. Multi-agent orchestration for campaign intelligence, audience segmentation, and automated marketing.

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Frontend   │────▶│   Backend    │────▶│  Agent Service   │     │  Channel Service │
│  React+Vite │     │  Express.js  │     │  Python+CrewAI   │     │  Node.js+Express │
│  :5173/80   │     │  :8000       │     │  :8001           │     │  :8002           │
│             │     │              │     │                  │     │                  │
│  Clerk Auth │     │  Clerk JWT   │     │  Custom LLM      │     │  Mock Delivery   │
│  ShadCN UI  │     │  Mongoose    │     │  7 Agents        │     │  Callback → BE   │
└─────────────┘     └──────┬───────┘     └─────────────────┘     └──────────────────┘
                           │
                    ┌──────▼───────┐
                    │   MongoDB    │
                    │  Atlas/M7    │
                    └──────────────┘
```

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite + ShadCN + Tailwind CSS | Component ecosystem, fast HMR |
| Backend | Node.js + Express.js | REST API, MERN uniformity |
| Database | MongoDB + Mongoose | Flexible schema for campaign/customer data |
| Auth | Clerk (`@clerk/clerk-react` + `@clerk/express`) | Managed auth, Google OAuth, JWT |
| AI Agents | Python + CrewAI | Multi-agent orchestration |
| LLM | Custom OpenAI-compatible endpoint | Configurable LLM integration |
| Channel Service | Node.js + Express | Mock callback service |
| Agent-Backend Bridge | HTTP REST | Clean service separation |

## Project Structure

```
xeno-crm/
├── frontend/                  # React + Vite + ShadCN
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── layout/        # Sidebar, AppLayout
│   │   │   ├── AICommandCentre.jsx
│   │   │   ├── AgentResponseRenderer.jsx  # 6 card types
│   │   │   ├── FunnelChart.jsx
│   │   │   └── CustomerCard.jsx
│   │   ├── pages/             # 13 pages
│   │   ├── hooks/             # useApi, useSSE
│   │   └── lib/               # api, utils
│   └── package.json
│
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── models/            # 10 Mongoose models
│   │   ├── routes/            # 12 route modules
│   │   └── services/          # segmentation, campaignLauncher, pipelineLogger
│   └── scripts/seed.js        # 10K customers + 30K orders
│
├── agent-service/             # Python + CrewAI + FastAPI
│   ├── crew/
│   │   ├── agents/            # 7 agents (Intent, Data, Segment, Message, Dispatch, Insights, Opportunity)
│   │   └── crews/             # 3 crews (Campaign, Insights, Opportunity)
│   └── schemas/responses.py   # Pydantic response models
│
├── channel-service/           # Node.js + Express (Mock)
│   └── src/
│       ├── simulator.js       # Weighted outcome engine
│       └── index.js            # Request handler + delivery simulation
│
├── docker-compose.yml         # 5 services
└── .env.example               # Environment variables
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB 7+ (local, Docker, or Atlas)
- Docker & Docker Compose (optional)

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install

# Agent Service
cd ../agent-service
cp .env.example .env
pip install -r requirements.txt

# Channel Service
cd ../channel-service
cp .env.example .env
npm install
```

### 2. Configure Environment Variables

#### Root `.env` (for Docker Compose)
```env
MONGODB_URI=mongodb://localhost:27017/xenocrm
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
CUSTOM_LLM_BASE_URL=https://your-llm-provider.com/v1
CUSTOM_LLM_API_KEY=your-api-key
CUSTOM_LLM_MODEL=your-model-name
```

#### Backend `.env`
```env
MONGODB_URI=mongodb://localhost:27017/xenocrm
CLERK_SECRET_KEY=sk_test_your_key
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CHANNEL_SERVICE_URL=http://localhost:8002
AGENT_SERVICE_URL=http://localhost:8001
RECEIPT_CALLBACK_URL=http://localhost:8000/api/receipts/callback
FRONTEND_URL=http://localhost:5173
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

#### Agent Service `.env`
```env
CUSTOM_LLM_BASE_URL=https://your-llm-provider.com/v1
CUSTOM_LLM_API_KEY=your-api-key
CUSTOM_LLM_MODEL=your-model-name
CORE_BACKEND_URL=http://localhost:8000
```

### 3. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or use Docker Compose
docker-compose up mongodb
```

### 4. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- 10,000 customers (Indian names, emails, cities)
- 30,000 orders (₹200-₹15,000, 2 year span)
- 5 AI-suggested segments
- 2 A/B tests (1 completed, 1 draft)
- 5 active opportunities
- 3 pending agent proposals
- 1 completed campaign with stats

### 5. Run All Services

```bash
# Terminal 1: Channel Service
cd channel-service && npm run dev

# Terminal 2: Agent Service
cd agent-service && uvicorn main:app --reload --port 8001

# Terminal 3: Backend
cd backend && npm run dev

# Terminal 4: Frontend
cd frontend && npm run dev
```

Or with Docker Compose:
```bash
docker-compose up --build
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Agent Service**: http://localhost:8001
- **Channel Service**: http://localhost:8002

## Key Features

### Pages
1. **Dashboard** — KPI cards, quick actions, recent campaigns table
2. **AI Campaign Studio** — Natural language chat interface with SSE streaming
3. **Opportunities** — AI-discovered marketing opportunities with scan capability
4. **Agent Proposals** — Review and approve AI-generated campaigns
5. **Customers** — Search, filter, paginate, import CSV/JSON
6. **Segments** — AI-suggested + manual + rule builder with preview
7. **Campaigns** — Create, launch, monitor with real-time stats
8. **Campaign Detail** — KPIs, funnel chart (Recharts), communications table
9. **A/B Tests** — Winner detection, variant comparison
10. **Analytics** — Channel breakdown, top campaigns, aggregate funnel
11. **Pipeline Monitor** — Real-time delivery stats, event timeline, auto-refresh
12. **AI Command Centre** — Floating modal with system status + chat
13. **Settings** — Platform config, notifications, AI, Telegram

### AI Agents (7 CrewAI Agents)
1. **Intent Classifier** — Routes user requests to the right specialist
2. **Data Analyst** — Analyzes CRM data for context
3. **Segment Builder** — Translates natural language to filter rules
4. **Message Composer** — Writes 2 message variants (emotional + transactional)
5. **Campaign Dispatcher** — Validates and creates launch manifests
6. **Insights Reporter** — Performance analysis with benchmarks
7. **Opportunity Scanner** — Proactive revenue opportunity detection

### Channel Service (Mock)
- Simulates WhatsApp/SMS/Email/RCS delivery
- Weighted probabilistic outcomes per channel
- Full lifecycle simulation: pending → sent → delivered → opened → read → clicked → converted
- Callback to backend receipt endpoint with exponential backoff retry

## API Endpoints

| Endpoint | Description | Auth |
|---|---|---|
| `GET/POST /api/customers` | List/Create customers | Required |
| `POST /api/customers/bulk` | Bulk import | Required |
| `GET /api/orders` | List orders | Required |
| `GET/POST /api/segments` | List/Create segments | Required |
| `POST /api/segments/preview` | Preview segment count | Required |
| `GET/POST /api/campaigns` | List/Create campaigns | Required |
| `POST /api/campaigns/:id/launch` | Launch campaign | Required |
| `GET /api/campaigns/:id/stats` | Campaign stats | Required |
| `POST /api/receipts/callback` | Delivery callback | **None** |
| `GET /api/analytics/*` | Analytics endpoints | Required |
| `GET/POST /api/ab-tests` | A/B tests | Required |
| `GET/POST /api/opportunities` | Opportunities | Required |
| `POST /api/opportunities/scan` | AI scan | Required |
| `GET/PATCH /api/proposals` | Agent proposals | Required |
| `GET /api/pipeline/status` | Pipeline status | Required |
| `GET/PUT /api/settings` | Settings | Required |
| `POST /api/agent/chat` | AI chat (SSE) | Required |

## Deployment Guide (Render.com)

### Services to Deploy

| Service | Platform | Type | Plan |
|---|---|---|---|
| Frontend | Vercel | SPA (Static) | Free |
| Backend | Render | Web Service | Starter |
| Agent Service | Render | Web Service | Starter |
| Channel Service | Render | Web Service | Free |
| Database | MongoDB Atlas | M0 Free | Free |

### Step 1: MongoDB Atlas

1. Create free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user (username + password)
3. Whitelist `0.0.0.0/0` for network access
4. Get connection string: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/xenocrm`

### Step 2: Clerk Setup

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create new application
3. Get `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
4. Configure OAuth (Google) if desired

### Step 3: Deploy Frontend to Vercel

```bash
cd frontend
npm install
npm run build
```

Or connect GitHub repo to Vercel:
- Framework: Vite
- Root Directory: `frontend/`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL`: Your Render backend URL (e.g., `https://xeno-backend.onrender.com`)
  - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

The `vercel.json` file handles SPA routing automatically.

### Step 4: Deploy Backend to Render

1. Create new **Web Service** on Render
2. Connect your GitHub repo
3. Settings:
   - Name: `xeno-crm-backend`
   - Root Directory: `backend/`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
   - Plan: `Starter`
4. Environment Variables:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `CLERK_SECRET_KEY`: Clerk secret key
   - `CLERK_PUBLISHABLE_KEY`: Clerk publishable key
   - `CHANNEL_SERVICE_URL`: `https://xeno-channel.onrender.com`
   - `AGENT_SERVICE_URL`: `https://xeno-agent.onrender.com`
   - `RECEIPT_CALLBACK_URL`: `https://xeno-backend.onrender.com/api/receipts/callback`
   - `FRONTEND_URL`: `https://xeno-crm.vercel.app`
   - `NODE_ENV`: `production`

### Step 5: Deploy Agent Service to Render

1. Create new **Web Service**
2. Settings:
   - Name: `xeno-crm-agent`
   - Root Directory: `agent-service/`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`
   - Plan: `Starter`
3. Environment Variables:
   - `CUSTOM_LLM_BASE_URL`: Your LLM provider URL
   - `CUSTOM_LLM_API_KEY`: Your LLM API key
   - `CUSTOM_LLM_MODEL`: Your model name
   - `CORE_BACKEND_URL`: `https://xeno-backend.onrender.com`

### Step 6: Deploy Channel Service to Render

1. Create new **Web Service**
2. Settings:
   - Name: `xeno-crm-channel`
   - Root Directory: `channel-service/`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
   - Plan: `Free`
3. Environment Variables:
   - `CORE_BACKEND_URL`: `https://xeno-backend.onrender.com`

### Step 7: Run Seed Script

After all services are deployed:

```bash
# Locally, with production MongoDB URI
MONGODB_URI="mongodb+srv://..." npm run seed
```

Or via Render Shell:
```bash
# Connect to backend service shell
node scripts/seed.js
```

### Step 8: Verify Deployment

1. Access frontend URL
2. Sign in with Clerk (Google OAuth or email)
3. Dashboard should load with seeded data
4. Navigate to Opportunities → Click "Scan for Opportunities"
5. Navigate to AI Studio → Send a message
6. Check Pipeline Monitor for real-time updates

## Key Tradeoffs (from §13)

1. **MongoDB vs PostgreSQL**: MongoDB chosen for flexible schema. Tradeoff: no JOIN optimization, mitigated by Mongoose populate and compound indexes.
2. **CrewAI agents vs LangGraph**: CrewAI gives opinionated multi-agent orchestration. LangGraph offers more state control. CrewAI chosen for clear specialization and faster iteration.
3. **All agents return structured JSON**: Makes frontend rendering deterministic. Tradeoff: agents need explicit instruction to avoid prose outside JSON.
4. **Direct job processing in channel service**: Jobs are processed immediately on receipt. Replace with BullMQ + Redis for persistence at scale.
5. **SSE over WebSockets**: SSE is unidirectional (server→client) which is all we need. Simpler to implement and proxy.
6. **Idempotent receipt endpoint (no auth)**: Machine-to-machine. Add HMAC signature verification for production.
7. **Single MongoDB Atlas cluster**: Simplest deployment. Add read replicas for analytics at scale.

## Testing the Application

### End-to-End Flow

```
Login → Import → Build Segment → AI Studio → Launch Campaign → Watch Pipeline → View Analytics
```

1. Login with Google OAuth or email
2. View Dashboard with seeded KPI data
3. Navigate to AI Studio → type "Create a campaign for VIP customers"
4. Watch SSE streaming response with segment proposal, message variants
5. View Agent Proposals → Approve a proposal → Campaign launches
6. Watch Pipeline Monitor for real-time events (auto-refreshes every 5s)
7. View Campaign Detail for funnel chart (auto-refreshes every 5s while running)
8. Check Analytics for channel breakdown and top campaigns

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start only MongoDB
docker-compose up mongodb

# View logs
docker-compose logs -f backend
docker-compose logs -f agent-service

# Stop all
docker-compose down

# Reset data
docker-compose down -v
```
