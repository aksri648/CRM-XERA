import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassButton } from '../components/ui/glass-button';
import { GlassCard, GlassCardContent, GlassCardTitle } from '../components/ui/glass-card';
import { GlassBadge } from '../components/ui/glass-badge';
import { GlassSeparator } from '../components/glass-separator';
import { GlassTabs, GlassTabsList, GlassTabsTrigger, GlassTabsContent } from '../components/ui/glass-tabs';
import MermaidDiagram from '../components/MermaidDiagram';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'stack', label: 'Tech Stack' },
  { id: 'data-model', label: 'Data Model' },
  { id: 'send-loop', label: 'Send / Receipt Loop' },
  { id: 'ai-agent', label: 'AI Agent Layer' },
  { id: 'ingestion', label: 'Ingestion API' },
  { id: 'api-reference', label: 'API Reference' },
  { id: 'tradeoffs', label: 'Design Tradeoffs' },
  { id: 'deploy', label: 'Deployment' },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function SidebarNav({ active }) {
  return (
    <nav className="sticky top-24 hidden w-48 flex-shrink-0 lg:block">
      <div className="space-y-1">
        {NAV.map(item => (
          <a key={item.id} href={`#${item.id}`}
            className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${active === item.id ? 'bg-white/10 text-cyan-400 font-medium' : 'text-gray-500 hover:text-gray-300'}`}>
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function H2({ id, children }) {
  return <h2 id={id} className="scroll-mt-24 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl"><a href={`#${id}`} className="hover:text-cyan-400 transition-colors">{children}</a></h2>;
}
function H3({ children }) { return <h3 className="mt-8 mb-3 text-lg font-semibold text-white">{children}</h3>; }
function P({ children, className = '' }) { return <p className={`text-sm leading-relaxed text-gray-400 sm:text-base ${className}`}>{children}</p>; }

function GlassTable({ headers, rows }) {
  return (
    <div className="my-4 overflow-x-auto">
      <GlassCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {headers.map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] last:border-0">
                {row.map((cell, j) => <td key={j} className="px-4 py-3 text-sm text-gray-300">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

function Code({ children, lang = '' }) {
  return (
    <GlassCard className="my-4 overflow-hidden">
      {lang && <div className="border-b border-white/[0.06] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">{lang}</div>}
      <pre className="p-4 text-sm leading-relaxed text-gray-300"><code>{children}</code></pre>
    </GlassCard>
  );
}

function DocCard({ number, title, children }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-2 flex items-center gap-3">
        <GlassBadge variant="primary" size="sm">{number}</GlassBadge>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-400">{children}</p>
    </GlassCard>
  );
}

export default function Docs() {
  const [active, setActive] = useState('overview');
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      for (const e of entries) { if (e.isIntersecting) setActive(e.target.id); }
    }, { rootMargin: '-20% 0px -60% 0px' });
    NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 text-gray-500 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" /><span className="text-xs font-medium">Back</span>
            </Link>
            <GlassSeparator orientation="vertical" className="h-4" />
            <Link to="/" className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-white">Xeno</span>
              <GlassBadge variant="outline" size="sm" className="text-[9px] uppercase tracking-[0.3em]">CRM</GlassBadge>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com/aksri648/CRM-XERA" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-white">
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
            <Link to="/dashboard"><GlassButton variant="primary" size="sm">Open CRM</GlassButton></Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto flex max-w-7xl gap-12 px-5 py-10 sm:px-8">
        <SidebarNav active={active} />
        <main className="min-w-0 flex-1">
          {/* Overview */}
          <motion.section id="overview" className="scroll-mt-24 pb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="overview">Overview</H2>
            <P className="mt-4">Xeno CRM is an AI-native marketing & engagement platform for consumer brands reaching shoppers over WhatsApp, SMS, Email, and RCS. It is <em className="text-gray-300">not</em> a sales/support CRM — no deals, pipelines, leads, or tickets.</P>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[{ n: '1', t: 'Ingest', d: 'Bulk JSON or CSV import with per-row validation.' },
                { n: '2', t: 'Segment', d: 'Natural-language AI segmentation compiled to a JSON filter DSL.' },
                { n: '3', t: 'Launch', d: 'Transactional outbox → worker → channel service → async callbacks.' },
                { n: '4', t: 'Insights', d: 'Real-time counters, revenue attribution, AI-written briefs.' },
              ].map(c => <DocCard key={c.t} number={c.n} title={c.t}>{c.d}</DocCard>)}
            </div>
          </motion.section>

          <GlassSeparator />

          {/* Architecture */}
          <motion.section id="architecture" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="architecture">Architecture</H2>
            <P className="mt-4">Three runtimes, two managed datastores. The backend is Express split into two processes. The channel service is a separate Node.js process. The frontend is React + Vite. MongoDB is the system of record.</P>
            <GlassTable
              headers={['Service', 'Directory', 'Port', 'Runtime', 'Role']}
              rows={[
                ['Frontend', 'frontend/', '5173', 'React + Vite', 'Dashboard, AI agent chat, live stats'],
                ['Backend API', 'backend/', '8000', 'Express + Node.js', 'REST + SSE, AI tool layer, ingestion'],
                ['Agent Service', 'agent-service/', '8001', 'FastAPI + CrewAI', 'AI crews, opportunity scanning, insights'],
                ['Channel Service', 'channel-service/', '8002', 'Node.js', 'Multi-channel delivery + callbacks'],
                ['MongoDB', 'managed', '27017', 'MongoDB 7', 'System of record'],
              ]}
            />
            <H3>System Architecture</H3>
            <MermaidDiagram chart={`flowchart TB
    subgraph Frontend["Frontend — React + Vite :5173"]
        FE[Dashboard · AI Chat · Landing]
    end

    subgraph Backend["Backend API — Express :8000"]
        API[REST + SSE Endpoints]
        AUTH[Clerk Auth Middleware]
        DB[Mongoose ODM]
    end

    subgraph Agent["Agent Service — FastAPI :8001"]
        CR[CrewAI Orchestrator]
        LLM[LLM Provider — BYOK]
    end

    subgraph Channel["Channel Service — Node.js :8002"]
        CH[Multi-channel Delivery]
        CB[Async Callbacks]
    end

    subgraph Data["Data Layer"]
        MONGO[(MongoDB :27017)]
    end

    subgraph External["External Channels"]
        WA[WhatsApp]
        SMS[SMS]
        EM[Email]
        RCS[RCS]
    end

    FE -->|REST + SSE| API
    API --> AUTH
    API --> DB
    API -->|SSE Stream| CR
    CR --> LLM
    CR -->|Tool Calls| API
    DB --> MONGO
    API -->|POST /send| CH
    CH --> WA
    CH --> SMS
    CH --> EM
    CH --> RCS
    CH -->|Callbacks| CB
    CB -->|POST /receipts| API`} />
            <H3>Why two backend processes?</H3>
            <P>SSE streams need long-lived connections, and the agent service must handle AI orchestration independently. Splitting the agent from the API keeps latency off the request path and lets each scale independently.</P>
          </motion.section>

          <GlassSeparator />

          {/* Tech Stack */}
          <motion.section id="stack" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="stack">Tech Stack</H2>
            <GlassTable
              headers={['Layer', 'Technology', 'Why']}
              rows={[
                ['Backend API', 'Express + Node.js', 'Pure API service — lightweight, SSE-friendly'],
                ['Channel Service', 'Node.js', 'Separate process mirrors real provider boundary'],
                ['Database', 'MongoDB via Mongoose', 'Flexible schema for segments, campaigns, orders'],
                ['AI Layer', 'CrewAI + FastAPI', 'Multi-agent AI orchestration with tool calling'],
                ['Frontend', 'React + Vite + Tailwind', 'Fast SPA with shadcn/ui + Ein UI glass components'],
                ['ORM', 'Mongoose 8', 'Schema validation, middleware, compound indexes'],
                ['Auth', 'Clerk', 'Managed auth with JWT middleware'],
              ]}
            />
          </motion.section>

          <GlassSeparator />

          {/* Data Model */}
          <motion.section id="data-model" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="data-model">Data Model</H2>
            <P className="mt-4">Nine Mongoose models covering the full CRM domain. Flexible schema for segment filters, order products, and campaign configurations.</P>
            <GlassTable
              headers={['Model', 'Purpose', 'Key fields']}
              rows={[
                ['Customer', 'Shopper profile', 'name, email, phone, city, tags, ltv, totalOrders'],
                ['Order', 'Purchase record', 'customerId, amount, products, channel, orderedAt'],
                ['Segment', 'Named audience', 'name, filterRules, logic (AND/OR), customerCount'],
                ['Campaign', 'Send job', 'segmentId, status, channel, messageTemplate, stats'],
                ['Communication', 'Per-customer send', 'campaignId, customerId, channel, status'],
                ['Opportunity', 'AI discovery', 'title, audienceDescription, expectedRevenue, status'],
                ['AgentProposal', 'AI campaign draft', 'segmentId, channel, confidenceScore, status'],
                ['PipelineEvent', 'Event log', 'type, campaignId, timestamp, data'],
                ['Settings', 'User config', 'platformName, timezone, aiModel, autoApprove'],
              ]}
            />
            <H3>Entity Relationships</H3>
            <MermaidDiagram chart={`erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    CUSTOMER ||--o{ COMMUNICATION : "receives"
    CUSTOMER ||--o{ SEGMENT : "belongs to"
    CUSTOMER ||--o{ CHANNEL_DECISION : "recommended for"

    SEGMENT ||--o{ CAMPAIGN : "targets"
    SEGMENT ||--o{ AGENT_PROPOSAL : "drafted for"

    CAMPAIGN ||--o{ COMMUNICATION : "sends"
    CAMPAIGN ||--o{ PIPELINE_EVENT : "generates"

    COMMUNICATION ||--o{ COMM_EVENT : "tracked by"

    OPPORTUNITY }o--|| CAMPAIGN : "converted to"

    SETTINGS }o--|| USER : "configured by"

    CUSTOMER {
        string name
        string email
        string phone
        string city
        array tags
        number ltv
        number totalOrders
        date lastOrderAt
    }

    ORDER {
        string customerId
        number amount
        array products
        string channel
        date orderedAt
    }

    SEGMENT {
        string name
        array filterRules
        string logic
        number customerCount
        string createdBy
    }

    CAMPAIGN {
        string segmentId
        string status
        string channel
        string messageTemplate
        object stats
    }

    COMMUNICATION {
        string campaignId
        string customerId
        string channel
        string status
    }`} />
          </motion.section>

          <GlassSeparator />

          <motion.section id="send-loop" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="send-loop">Send / Receipt Loop</H2>
            <P className="mt-4">Two patterns make the send path correct under crashes, retries, and out-of-order callbacks: a transactional outbox and an append-only event log.</P>
            <MermaidDiagram chart={`flowchart LR
    subgraph Ingest["1. Ingest"]
        CSV[CSV / JSON Import]
        VAL[Per-row Validation]
        CSV --> VAL
    end

    subgraph Segment["2. Segment"]
        AI[AI NL Segmentation]
        DSL[Filter DSL]
        AI --> DSL
    end

    subgraph Outbox["3. Outbox Pattern"]
        TXN["DB Transaction"]
        COMM[(Communications)]
        OBX[(Outbox Events)]
        TXN --> COMM
        TXN --> OBX
    end

    subgraph Worker["4. Poller Worker"]
        CLAIM["SELECT FOR UPDATE\nSKIP LOCKED"]
        BATCH[Batch of 50]
        CLAIM --> BATCH
    end

    subgraph Channel["5. Channel Service"]
        WA[WhatsApp]
        SMS[SMS]
        EM[Email]
        RCS[RCS]
    end

    subgraph Receipts["6. Receipts"]
        CB[Async Callbacks]
        EVT[(CommEvent\nAppend-only)]
        RANK[Monotonic\nRank Max]
        CB --> EVT
        EVT --> RANK
    end

    subgraph Attribute["7. Attribution"]
        WIN[7-day Window]
        REV[Revenue Attribution]
        WIN --> REV
    end

    subgraph Insights["8. Insights"]
        REDIS[(Redis Counters)]
        AI_INS[AI Performance Briefs]
        REDIS --> AI_INS
    end

    CSV --> DSL
    DSL --> TXN
    OBX --> CLAIM
    BATCH --> WA
    BATCH --> SMS
    BATCH --> EM
    BATCH --> RCS
    WA --> CB
    SMS --> CB
    EM --> CB
    RCS --> CB
    RANK --> WIN
    REV --> REDIS`} />
            <H3>Transactional Outbox</H3>
            <P>Communication rows and send-intents are written in one database transaction. Either both persist or neither does.</P>
            <Code lang="javascript">{`await mongoose.connection.transaction(async (session) => {
  await Communication.insertMany(communications, { session });
  await Outbox.insertMany(outboxEvents, { session });
});`}</Code>
            <H3>Append-only event log + monotonic ranking</H3>
            <P>Callbacks can arrive out of order. Events are append-only — current status is derived as the highest-rank event seen.</P>
            <Code lang="javascript">{`const STATUS_RANK = {
  pending: 0, sent: 1, delivered: 2,
  opened: 3, read: 3, clicked: 4,
};`}</Code>
            <H3>Channel simulation rates</H3>
            <GlassTable
              headers={['Channel', 'Sequence', 'Deliver', 'Engage', 'Click']}
              rows={[
                ['WhatsApp', 'sent → delivered → read → clicked', '80%', '65% read', '30%'],
                ['Email', 'sent → delivered → opened → clicked', '95%', '25% open', '15%'],
                ['SMS', 'sent → delivered', '90%', '—', '—'],
                ['RCS', 'sent → delivered → opened → clicked', '85%', '60% open', '25%'],
              ]}
            />
          </motion.section>

          <GlassSeparator />

          {/* AI Agent Layer */}
          <motion.section id="ai-agent" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="ai-agent">AI Agent Layer</H2>
            <P className="mt-4">CRM operations are exposed as tools the LLM invokes dynamically. The agent decides the workflow, with a confirmation gate before destructive operations.</P>
            <GlassTable
              headers={['#', 'Tool', 'Confirm?', 'Description']}
              rows={[
                ['1', 'describe_schema', 'No', 'Get queryable fields for segmentation'],
                ['2', 'query_customers', 'No', 'Query customers with filters'],
                ['3', 'create_segment', 'No', 'Create named segment from criteria'],
                ['4', 'preview_audience', 'No', 'Preview customers in a segment'],
                ['5', 'draft_messages', 'No', 'Generate channel-specific messages'],
                ['6', 'recommend_channels', 'No', 'Recommend best channel per customer'],
                ['7', 'launch_campaign', 'Yes ✓', 'Launch campaign — requires approval'],
                ['8', 'get_campaign_stats', 'No', 'Real-time delivery stats'],
                ['9', 'analyze_performance', 'No', 'AI analysis of campaign results'],
                ['10', 'compare_campaigns', 'No', 'Compare metrics across campaigns'],
                ['11', 'get_segment_analytics', 'No', 'Historical performance by segment'],
              ]}
            />
            <H3>BYOK Multi-provider</H3>
            <P>Three providers: Anthropic (Claude), OpenAI (GPT-4o), Google (Gemini) — all behind a shared interface. Credentials travel in HTTP headers and are never persisted.</P>
            <H3>Merge fields</H3>
            <Code>{`{{name}}  {{top_product}}  {{city}}  {{days_since_last_order}}  {{total_orders}}`}</Code>
          </motion.section>

          <GlassSeparator />

          {/* Ingestion API */}
          <motion.section id="ingestion" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="ingestion">Ingestion API</H2>
            <P className="mt-4">Two hardened JSON REST endpoints. Both validate every row, import what is valid, and report what is not.</P>
            <H3>POST /api/customers/bulk</H3>
            <GlassTable
              headers={['Field', 'Rule']}
              rows={[
                ['name', 'required, trimmed, non-empty'],
                ['email', 'optional, valid email — duplicates skipped'],
                ['phone', 'optional, non-empty'],
                ['city', 'optional, non-empty'],
                ['tags', 'optional array of strings'],
              ]}
            />
            <Code lang="json">{`{
  "received": 4, "imported": 2, "skipped": 0, "rejected": 2,
  "errors": [
    { "row": 2, "error": "name: expected string, received undefined" },
    { "row": 3, "error": "email: invalid email" }
  ]
}`}</Code>
          </motion.section>

          <GlassSeparator />

          {/* API Reference */}
          <motion.section id="api-reference" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="api-reference">API Reference</H2>
            <P className="mt-4">All routes under <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">/api</code>. <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">GET /health</code> is the liveness probe.</P>
            <GlassTable
              headers={['Method', 'Path', 'Description']}
              rows={[
                ['GET', '/health', 'Liveness probe'],
                ['GET', '/api/customers', 'List customers with search/filter'],
                ['POST', '/api/customers/bulk', 'Bulk JSON ingest'],
                ['POST', '/api/customers/import', 'CSV file upload'],
                ['GET', '/api/orders', 'List orders'],
                ['POST', '/api/orders/bulk', 'Bulk JSON ingest with attribution'],
                ['GET', '/api/segments', 'List segments with counts'],
                ['POST', '/api/segments', 'Create segment'],
                ['GET', '/api/segments/:id/preview', 'Preview audience'],
                ['GET', '/api/campaigns', 'List campaigns'],
                ['POST', '/api/campaigns', 'Create campaign'],
                ['POST', '/api/campaigns/:id/launch', 'Launch campaign'],
                ['GET', '/api/campaigns/:id/stats', 'Live campaign stats'],
                ['POST', '/api/receipts', 'Channel callback sink'],
                ['GET', '/api/analytics', 'Funnel + performance aggregates'],
                ['GET', '/api/opportunities', 'AI-discovered opportunities'],
                ['POST', '/api/opportunities/scan', 'Trigger AI scan'],
                ['GET', '/api/proposals', 'AI campaign proposals'],
                ['POST', '/api/proposals/:id/approve', 'Approve proposal'],
                ['GET', '/api/pipeline', 'Pipeline status + events'],
                ['GET', '/api/settings', 'User settings'],
                ['POST', '/api/agent/chat', 'AI agent chat (SSE)'],
                ['POST', '/api/agent/command', 'AI agent command (SSE)'],
              ]}
            />
          </motion.section>

          <GlassSeparator />

          {/* Design Tradeoffs */}
          <motion.section id="tradeoffs" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="tradeoffs">Design Tradeoffs</H2>
            <P className="mt-4">Every decision is tuned for "correct, observable, and demoable" at ~2k customers / ~8k orders.</P>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { n: '1', t: 'Outbox vs. Kafka/SQS', d: 'At-least-once delivery without a broker. At scale: replace with SQS/Kafka.' },
                { n: '2', t: 'FOR UPDATE SKIP LOCKED', d: 'Atomic claim for concurrent workers. At scale: shard by campaignId.' },
                { n: '3', t: 'Monotonic receipt ranking', d: 'Correct ordering with idempotent duplicates.' },
                { n: '4', t: 'Live counters', d: 'O(1) reads during sends. At scale: Redis Cluster.' },
                { n: '5', t: 'Separate channel service', d: 'Mirrors real provider boundary for honest design.' },
                { n: '6', t: 'BYOK multi-provider AI', d: 'No vendor lock-in. Works without any key.' },
                { n: '7', t: 'Confirmation gate', d: 'launch_campaign requires approval. Idempotent via hash.' },
                { n: '8', t: 'Live segment counts', d: 'Fresh on every read. At scale: materialize with trigger.' },
              ].map(t => <DocCard key={t.n} number={t.n} title={t.t}>{t.d}</DocCard>)}
            </div>
          </motion.section>

          <GlassSeparator />

          {/* Deployment */}
          <motion.section id="deploy" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="deploy">Deployment</H2>
            <P className="mt-4">Four services orchestrated via Docker Compose, backed by MongoDB.</P>
            <H3>Local dev</H3>
            <Code lang="bash">{`# Start all services
docker compose up --build

# Or run individually:
cd backend && npm run dev        # :8000
cd agent-service && uvicorn main:app --port 8001
cd channel-service && npm run dev  # :8002
cd frontend && npm run dev         # :5173`}</Code>
            <H3>Environment variables</H3>
            <GlassTable
              headers={['Variable', 'Service', 'Example']}
              rows={[
                ['MONGODB_URI', 'backend', 'mongodb://localhost:27017/xenocrm'],
                ['CLERK_SECRET_KEY', 'backend', 'sk_test_...'],
                ['VITE_CLERK_PUBLISHABLE_KEY', 'frontend', 'pk_test_...'],
                ['FRONTEND_URL', 'backend', 'http://localhost:5173'],
                ['PORT', 'backend', '8000'],
              ]}
            />
            <H3>Post-deploy smoke test</H3>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-gray-400">
              <li><code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">GET /health</code> → <code className="text-gray-300">{`{ "status": "ok" }`}</code></li>
              <li>Open frontend — landing page loads with "Enter the CRM"</li>
              <li>Sign in → dashboard loads with counts</li>
              <li>Import customers via CSV</li>
              <li>Use AI Agent to create segment and launch campaign</li>
              <li>Watch live stats update in real time</li>
            </ol>
          </motion.section>
        </main>
      </div>

      <footer className="border-t border-white/[0.06] py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-white">Xeno</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500">CRM</span>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Xeno CRM</p>
        </div>
      </footer>
    </div>
  );
}
