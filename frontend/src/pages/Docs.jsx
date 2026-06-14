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
  { id: 'frontend-arch', label: 'Frontend Architecture' },
  { id: 'routing', label: 'Routing & Layout' },
  { id: 'ai-agent-flow', label: 'AI Agent Flow' },
  { id: 'stack', label: 'Tech Stack' },
  { id: 'data-model', label: 'Data Model' },
  { id: 'send-loop', label: 'Send / Receipt Loop' },
  { id: 'ai-tools', label: 'AI Tool Layer' },
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
      <pre className="p-4 text-sm leading-relaxed text-gray-300 overflow-x-auto"><code>{children}</code></pre>
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

function FlowDiagram() {
  const steps = ['Ingest', 'Segment', 'Outbox', 'Worker', 'Channel', 'Receipts', 'Attribute', 'Insights'];
  return (
    <div className="my-6 flex flex-wrap items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <GlassBadge variant={i === steps.length - 1 ? 'primary' : 'default'} size="sm">
            <span className="mr-1.5 text-[10px] font-bold">{i + 1}</span>{s}
          </GlassBadge>
          {i < steps.length - 1 && <span className="text-gray-600">→</span>}
        </div>
      ))}
    </div>
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

          {/* ─── Overview ─── */}
          <motion.section id="overview" className="scroll-mt-24 pb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="overview">Overview</H2>
            <P className="mt-4">Xeno CRM is an AI-native marketing & engagement platform for consumer brands reaching shoppers over WhatsApp, SMS, Email, and RCS. It is <em className="text-gray-300">not</em> a sales/support CRM — no deals, pipelines, leads, or tickets.</P>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[{ n: '1', t: 'Ingest', d: 'Bulk CSV/XLSX import with per-row validation. Server-side parsing via xlsx (SheetJS).' },
                { n: '2', t: 'Segment', d: 'Natural-language AI segmentation compiled to a JSON filter DSL.' },
                { n: '3', t: 'Launch', d: 'Transactional outbox → worker → channel service → async callbacks.' },
                { n: '4', t: 'Insights', d: 'Real-time counters, revenue attribution, AI-written briefs.' },
              ].map(c => <DocCard key={c.t} number={c.n} title={c.t}>{c.d}</DocCard>)}
            </div>
            <FlowDiagram />
          </motion.section>

          <GlassSeparator />

          {/* ─── Architecture ─── */}
          <motion.section id="architecture" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="architecture">Architecture</H2>
            <P className="mt-4">Four runtimes, one managed datastore. The backend is Express. The agent service is FastAPI + CrewAI. The channel service is a separate Node.js process for delivery simulation. The frontend is React + Vite SPA. MongoDB is the system of record.</P>
            <GlassTable
              headers={['Service', 'Directory', 'Port', 'Runtime', 'Role']}
              rows={[
                ['Frontend', 'frontend/', '5173', 'React 18 + Vite 5', 'Dashboard, AI chat, landing page'],
                ['Backend API', 'backend/', '8000', 'Express 4 + Node.js', 'REST + SSE, AI proxy, ingestion'],
                ['Agent Service', 'agent-service/', '8001', 'FastAPI + CrewAI', 'AI crews, opportunity scanning, insights'],
                ['Channel Service', 'channel-service/', '8002', 'Node.js', 'Multi-channel delivery simulation + callbacks'],
                ['MongoDB', 'managed', '27017', 'MongoDB 7', 'System of record'],
              ]}
            />
            <H3>System Architecture</H3>
            <MermaidDiagram chart={`flowchart TB
    subgraph Frontend["Frontend — React 18 + Vite :5173"]
        FE[Dashboard · AI Chat · Landing · 14 Pages]
        SSE["useSSE Hook\n(fetch + ReadableStream)"]
        AX[Axios Client\nVITE_API_URL]
    end

    subgraph Backend["Backend API — Express :8000"]
        API[REST + SSE Endpoints]
        AUTH["Auth Middleware\n(DEFAULT_USER_ID)"]
        DB[Mongoose 8 ODM]
        AGENT_PROXY["Agent Proxy\n/api/agent/*"]
    end

    subgraph Agent["Agent Service — FastAPI :8001"]
        CR[CrewAI Orchestrator]
        LLM[LLM Provider — BYOK]
        TOOLS[23+ CRM Tools]
    end

    subgraph Channel["Channel Service — Node.js :8002"]
        CH[Multi-channel Delivery]
        SIM[Delivery Simulator]
        CB[Async Callbacks]
    end

    subgraph Data["Data Layer"]
        MONGO[(MongoDB 7 :27017)]
    end

    subgraph External["External Channels"]
        WA[WhatsApp]
        SMS[SMS]
        EM[Email]
        RCS[RCS]
    end

    FE -->|"REST + SSE"| AX
    AX --> API
    API --> AUTH
    API --> DB
    AGENT_PROXY -->|"SSE Stream"| CR
    CR --> LLM
    CR -->|"Tool Calls"| TOOLS
    TOOLS -->|"HTTP"| API
    DB --> MONGO
    API -->|"POST /send"| CH
    CH --> SIM
    SIM --> WA
    SIM --> SMS
    SIM --> EM
    SIM --> RCS
    CH -->|"Callbacks"| CB
    CB -->|"POST /api/receipts"| API`} />
            <H3>Why four services?</H3>
            <P>SSE streams need long-lived connections, and the agent service must handle AI orchestration independently. The channel service mirrors a real provider boundary (WhatsApp/SMS/Email/RCS vendors are separate processes in production). Splitting them keeps latency off the request path and lets each scale independently.</P>
          </motion.section>

          <GlassSeparator />

          {/* ─── Frontend Architecture ─── */}
          <motion.section id="frontend-arch" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="frontend-arch">Frontend Architecture</H2>
            <P className="mt-4">React 18 SPA built with Vite 5. No SSR. Two visual systems: standard shadcn/ui for the CRM dashboard and custom "Glass" components for the landing/docs pages. All state is local — no Redux, Zustand, or React Context.</P>

            <H3>Component Hierarchy</H3>
            <MermaidDiagram chart={`graph TB
    ROOT["main.jsx\nReact.StrictMode + BrowserRouter"]
    APP["App.jsx\nRoute definitions"]
    LANDING["Landing.jsx\nDark marketing page"]
    DOCS["Docs.jsx\nTechnical documentation"]
    LAYOUT["AppLayout.jsx\nSidebar + Content + Bot"]
    SIDEBAR["Sidebar.jsx\nNav groups · Badge polling"]
    CMD["AICommandCentre.jsx\nFull-screen AI chat overlay"]
    BOT["Floating Bot Button\nFixed bottom-right"]
    TOASTER["Sonner Toaster\ntop-right"]

    subgraph Pages["Dashboard Pages"]
        DASH["Dashboard"]
        AISTUDIO["AIStudio"]
        OPPS["Opportunities"]
        PROPS["AgentProposals"]
        CUST["Customers"]
        SEGS["Segments"]
        CAMPS["Campaigns"]
        CAMPDET["CampaignDetail"]
        ANA["Analytics"]
        PIPE["PipelineMonitor"]
        SET["Settings"]
    end

    subgraph Hooks["Hooks"]
        SSE["useSSE.js\nfetch + ReadableStream\n50ms batch buffer"]
    end

    subgraph Lib["Libraries"]
        API["api.js\nAxios instance"]
        UTILS["utils.js\ncn · formatCurrency\nformatNumber · relativeTime"]
    end

    subgraph UI["UI Components"]
        SHADCN["shadcn/ui (16)\nbutton · card · dialog\ntabs · input · badge ..."]
        GLASS["Glass Components (9)\nglass-card · glass-button\nglass-dialog · glass-tabs ..."]
    end

    ROOT --> APP
    APP --> LANDING
    APP --> DOCS
    APP --> LAYOUT
    LAYOUT --> SIDEBAR
    LAYOUT --> CMD
    LAYOUT --> BOT
    LAYOUT --> TOASTER
    LAYOUT --> Pages
    CMD --> SSE
    CMD --> API
    SIDEBAR --> API
    Pages --> API
    Pages --> UTILS
    LANDING --> GLASS
    DOCS --> GLASS
    Pages --> SHADCN`} />

            <H3>Design Systems</H3>
            <GlassTable
              headers={['System', 'Components', 'Used By', 'Style']}
              rows={[
                ['shadcn/ui', '16 components', 'All CRM pages', 'Standard light theme, Radix primitives'],
                ['Glass (custom)', '9 components', 'Landing, Docs', 'Frosted-glass dark theme, teal accent (#0fd4b4)'],
              ]}
            />
            <P className="mt-2">Glass components live in <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">components/ui/glass-*.jsx</code>. They wrap Radix primitives with translucent backgrounds and the brand teal accent color.</P>

            <H3>State Management</H3>
            <P>No external state library. All state is managed via:</P>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DocCard number="1" title="Local useState">Every page/component manages its own state. No shared global store.</DocCard>
              <DocCard number="2" title="Polling Patterns">Sidebar badges poll every 30s. Pipeline monitor polls every 10s. AICommandCentre system status polls every 10s.</DocCard>
              <DocCard number="3" title="SSE Streaming">The useSSE hook manages real-time AI responses via fetch + ReadableStream with 50ms batch buffering.</DocCard>
              <DocCard number="4" title="Direct Axios Calls">Each page fetches its own data via the Axios instance in lib/api.js. No React Query or SWR.</DocCard>
            </div>

            <H3>UI Component Map</H3>
            <MermaidDiagram chart={`graph LR
    subgraph Layout["Layout"]
        AL["AppLayout\nFixed sidebar + main"]
        SB["Sidebar\n5 nav groups"]
        AI["AICommandCentre\nFull-screen overlay"]
    end

    subgraph CRM_Pages["CRM Pages (inside AppLayout)"]
        DASH["Dashboard\nKPI cards + quick actions"]
        AISTUDIO["AIStudio\nChat with SSE streaming"]
        OPPS["Opportunities\nAI scan + generate/dismiss"]
        PROPS["Proposals\nApprove/edit/reject"]
        CUST["Customers\nGrid + import + search"]
        SEGS["Segments\nAI + manual builder"]
        CAMPS["Campaigns\nList + create modal"]
        CAMPDET["CampaignDetail\nFunnel chart + KPIs"]
        ANA["Analytics\n3 tabs: channels/campaigns/funnel"]
        PIPE["Pipeline\n6-stage counters + timeline"]
        SET["Settings\nGeneral + AI config"]
    end

    subgraph Public["Public Pages"]
        LANDING["Landing\nDark marketing page"]
        DOCS["Docs\nTechnical documentation"]
    end

    AL --> SB
    AL --> AI
    AL --> CRM_Pages

    subgraph Shared["Shared Components"]
        ARR["AgentResponseRenderer\n9 card types"]
        MMD["MermaidDiagram\nMermaid.js renderer"]
        GS["glass-separator"]
    end

    AI --> ARR
    AISTUDIO --> ARR
    DOCS --> MMD`} />
          </motion.section>

          <GlassSeparator />

          {/* ─── Routing & Layout ─── */}
          <motion.section id="routing" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="routing">Routing & Layout</H2>
            <P className="mt-4">Client-side routing via react-router-dom v6. Two standalone pages (Landing, Docs) and 11 CRM pages inside AppLayout. No route protection is currently active — ProtectedRoute exists as a component but is not wired into the route tree.</P>

            <H3>Route Map</H3>
            <MermaidDiagram chart={`flowchart TB
    MAIN["BrowserRouter"]
    HOME["/ → Landing.jsx\nPublic marketing page"]
    DOCS["/docs → Docs.jsx\nPublic documentation"]
    APP["AppLayout\nSidebar + Content + Bot"]

    subgraph CRM["CRM Routes (inside AppLayout)"]
        DASH["/dashboard → Dashboard"]
        AI["/ai-studio → AIStudio"]
        OPPS["/opportunities → Opportunities"]
        PROP["/proposals → AgentProposals"]
        CUST["/customers → Customers"]
        SEGS["/segments → Segments"]
        CAMPS["/campaigns → Campaigns"]
        CAMPD["/campaigns/:id → CampaignDetail"]
        ANA["/analytics → Analytics"]
        PIPE["/pipeline → PipelineMonitor"]
        SET["/settings → Settings"]
    end

    CATCH["* → Redirect to /"]

    MAIN --> HOME
    MAIN --> DOCS
    MAIN --> APP
    APP --> CRM
    MAIN --> CATCH`} />

            <H3>AppLayout Structure</H3>
            <MermaidDiagram chart={`graph TB
    AL["AppLayout"]
    SIDEBAR["Sidebar\n260px fixed left\nDark theme #0f1923"]
    MAIN["Main Content\nml-[260px] p-6\nbg-gray-50"]
    BOT["Floating Bot Button\nFixed bottom-right\n#0fd4b4 circle"]
    CMD["AICommandCentre\nModal overlay\nSSE chat"]
    TOAST["Sonner Toaster\ntop-right richColors"]

    AL --> SIDEBAR
    AL --> MAIN
    AL --> BOT
    AL --> CMD
    AL --> TOAST

    SIDEBAR -->|"5 groups"| NAV["MAIN · AUDIENCE\nENGAGE · ANALYZE\nSYSTEM"]
    SIDEBAR -->|"Polls every 30s"| BADGES["Badge counts\nopportunities · proposals"]`} />

            <H3>Navigation Groups</H3>
            <GlassTable
              headers={['Group', 'Items', 'Badges']}
              rows={[
                ['MAIN', 'Dashboard, AI Campaign Studio, Opportunities, Agent Proposals', 'Opportunities count, Proposals count (polled)'],
                ['AUDIENCE', 'Customers, Segments', '—'],
                ['ENGAGE', 'Campaigns', '—'],
                ['ANALYZE', 'Analytics, Pipeline Monitor', '—'],
                ['SYSTEM', 'AI Command Centre, Settings, Exit button', 'Live indicator on Command Centre'],
              ]}
            />
          </motion.section>

          <GlassSeparator />

          {/* ─── AI Agent Interaction Flow ─── */}
          <motion.section id="ai-agent-flow" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="ai-agent-flow">AI Agent Interaction Flow</H2>
            <P className="mt-4">The AI Command Centre provides full CRM access via natural language. It streams responses via SSE, renders structured tool calls, and queues destructive actions for human approval.</P>

            <H3>SSE Streaming Architecture</H3>
            <MermaidDiagram chart={`sequenceDiagram
    participant User
    participant CMD as AICommandCentre
    participant SSE as useSSE Hook
    participant BE as Backend API :8000
    participant AG as Agent Service :8001
    participant LLM as LLM Provider

    User->>CMD: Type message + Send
    CMD->>SSE: startStream(url, body)
    SSE->>BE: POST /api/agent/command
    BE->>AG: POST /crew/command
    AG->>LLM: Prompt + tools
    LLM-->>AG: Stream response

    loop SSE Stream
        AG-->>BE: data: {type: "text", content: "..."}
        BE-->>SSE: Forward SSE event
        SSE-->>CMD: Buffer 50ms → events[]
        CMD-->>User: Render text/chunk
    end

    loop Tool Call
        AG-->>BE: data: {type: "tool_call", tool: "list_customers"}
        BE-->>SSE: Forward
        SSE-->>CMD: Append to events
        CMD-->>User: Show ToolCallBreadcrumb
        AG->>AG: Execute tool
        AG-->>BE: data: {type: "tool_result", data: {...}}
        BE-->>SSE: Forward
        SSE-->>CMD: Append to events
        CMD-->>User: Render ToolResultCard
    end

    opt Destructive Action
        AG-->>BE: data: {type: "pending_action", tool: "launch_campaign"}
        BE-->>SSE: Forward
        SSE-->>CMD: Append to events
        CMD-->>User: Show PendingActionCard
        User->>CMD: Approve / Reject
        CMD->>BE: POST /api/agent/execute
        BE->>AG: Execute action
    end`} />

            <H3>useSSE Hook Internals</H3>
            <MermaidDiagram chart={`flowchart TB
    START["startStream(url, body)"]
    ABORT["Abort previous stream"]
    FETCH["fetch() with ReadableStream"]
    READER["reader.read() loop"]
    DECODE["TextDecoder → lines"]
    PARSE["Parse 'data: ' prefixed lines"]
    BUFFER["bufferRef.push(event)"]
    FLUSH["setTimeout 50ms → flushBuffer"]
    DONE{"event.type === 'done'?"}
    SET["setEvents(prev + batch)"]
    STOP["isStreaming = false"]

    START --> ABORT
    ABORT --> FETCH
    FETCH --> READER
    READER --> DECODE
    DECODE --> PARSE
    PARSE --> BUFFER
    BUFFER --> FLUSH
    FLUSH --> DONE
    DONE -->|"No"| READER
    DONE -->|"Yes"| SET
    SET --> STOP

    style START fill:#0ea5e9,color:#fff
    style STOP fill:#10b981,color:#fff`} />

            <H3>AICommandCentre Event Types</H3>
            <GlassTable
              headers={['Event Type', 'Source', 'Renders As']}
              rows={[
                ['text', 'LLM response chunks', 'TextBubble — plain text message'],
                ['tool_call', 'Agent tool invocation', 'ToolCallBreadcrumb — tool name + params'],
                ['tool_result', 'Tool execution result', 'ToolResultCard — contextual table/card'],
                ['pending_action', 'Destructive action gate', 'PendingActionCard — approve/reject buttons'],
                ['suggestions', 'LLM follow-up hints', 'Clickable pill buttons'],
                ['error', 'Stream or tool error', 'ErrorCard — red alert'],
                ['done', 'Stream completion', 'Stops streaming indicator'],
              ]}
            />

            <H3>Tool Result Rendering</H3>
            <P className="mt-2">AgentResponseRenderer dispatches 9 card types based on event.type. Tool results are contextualized by tool name:</P>
            <GlassTable
              headers={['Tool', 'Renders As']}
              rows={[
                ['list_customers, get_segment_customers', 'CustomersTableCard — name, email, LTV, orders'],
                ['list_campaigns', 'CampaignsTableCard — name, channel, status, sent count'],
                ['list_segments', 'SegmentsTableCard — name, rules, logic, customer count'],
                ['list_opportunities', 'OpportunitiesTableCard — title, audience, expected revenue'],
                ['get_pipeline_status, get_analytics_*', 'KeyValueCard — 2-col grid of metric values'],
                ['get_customer, get_campaign', 'KeyValueCard — entity detail fields'],
                ['All others', 'RawJsonCard — syntax-highlighted JSON dump'],
              ]}
            />

            <H3>Confirmation Gate Flow</H3>
            <MermaidDiagram chart={`flowchart LR
    AI["AI Agent\nProposes action"]
    QUEUE["Pending Action\nQueued in message"]
    CARD["PendingActionCard\nAmber border · Approve/Reject"]
    APPROVE["User clicks Approve"]
    REJECT["User clicks Reject"]
    EXEC["POST /api/agent/execute\nBackend executes"]
    OK["✅ Green border\nResult shown"]
    FAIL["❌ Red error\nError message shown"]

    AI --> QUEUE
    QUEUE --> CARD
    CARD --> APPROVE
    CARD --> REJECT
    APPROVE --> EXEC
    EXEC -->|"ok: true"| OK
    EXEC -->|"ok: false"| FAIL
    REJECT -->|"Grey border\nRejected"`} />
          </motion.section>

          <GlassSeparator />

          {/* ─── Tech Stack ─── */}
          <motion.section id="stack" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="stack">Tech Stack</H2>
            <GlassTable
              headers={['Layer', 'Technology', 'Why']}
              rows={[
                ['Frontend', 'React 18 + Vite 5', 'Fast SPA with HMR, Tailwind CSS, path aliases'],
                ['UI (CRM)', 'shadcn/ui (16 components)', 'Radix primitives, accessible, composable'],
                ['UI (Landing)', 'Glass components (9)', 'Custom frosted-glass dark theme'],
                ['Routing', 'react-router-dom v6', 'Client-side routing, no SSR needed'],
                ['Charts', 'Recharts', 'CampaignDetail funnel, Analytics tabs'],
                ['Animations', 'Framer Motion', 'Landing page, page transitions'],
                ['HTTP', 'Axios + fetch', 'REST via Axios, SSE via fetch ReadableStream'],
                ['Icons', 'Lucide React', 'Consistent icon set across all pages'],
                ['Toasts', 'Sonner', 'Rich notifications, top-right'],
                ['File Import', 'xlsx (SheetJS)', 'CSV/XLSX parsing in Customers page'],
                ['Backend API', 'Express 4 + Node.js', 'Pure API service, SSE-friendly'],
                ['Agent Service', 'FastAPI + CrewAI 0.121', 'Multi-agent AI orchestration with tool calling'],
                ['Channel Service', 'Node.js', 'Separate process mirrors real provider boundary'],
                ['Database', 'MongoDB 7 via Mongoose 8', 'Flexible schema, compound indexes'],
                ['Auth', 'Custom Middleware', 'Hardcoded DEFAULT_USER_ID, no real auth yet'],
                ['AI Models', 'BYOK (Anthropic/OpenAI/Google)', 'No vendor lock-in, works without any key'],
              ]}
            />
          </motion.section>

          <GlassSeparator />

          {/* ─── Data Model ─── */}
          <motion.section id="data-model" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="data-model">Data Model</H2>
            <P className="mt-4">Nine Mongoose models covering the full CRM domain. Flexible schema for segment filters, order products, and campaign configurations.</P>
            <GlassTable
              headers={['Model', 'Purpose', 'Key Fields']}
              rows={[
                ['Customer', 'Shopper profile', 'name, email, phone, city, tags[], ltv, totalOrders, lastOrderAt'],
                ['Order', 'Purchase record', 'customerId, amount, products[], channel, orderedAt'],
                ['Segment', 'Named audience', 'name, filterRules[], logic (AND/OR), customerCount, createdBy'],
                ['Campaign', 'Send job', 'segmentId, status, channel, messageTemplate, stats{}'],
                ['Communication', 'Per-customer send', 'campaignId, customerId, channel, status'],
                ['Opportunity', 'AI discovery', 'title, audienceDescription, expectedRevenue, status'],
                ['AgentProposal', 'AI campaign draft', 'segmentId, channel, confidenceScore, status'],
                ['PipelineEvent', 'Event log', 'type, campaignId, timestamp, data{}'],
                ['Settings', 'User config', 'platformName, timezone, aiModel, autoApprove'],
              ]}
            />
            <H3>Entity Relationships</H3>
            <MermaidDiagram chart={`erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    CUSTOMER ||--o{ COMMUNICATION : "receives"
    CUSTOMER ||--o{ SEGMENT : "belongs to"

    SEGMENT ||--o{ CAMPAIGN : "targets"
    SEGMENT ||--o{ AGENT_PROPOSAL : "drafted for"

    CAMPAIGN ||--o{ COMMUNICATION : "sends"
    CAMPAIGN ||--o{ PIPELINE_EVENT : "generates"

    OPPORTUNITY }o--o{ CAMPAIGN : "converted to"

    SETTINGS ||--|| SETTINGS_DOC : "singleton"

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
    }

    OPPORTUNITY {
        string title
        string audienceDescription
        number expectedRevenue
        string status
    }

    AGENT_PROPOSAL {
        string segmentId
        string channel
        number confidenceScore
        string status
    }

    PIPELINE_EVENT {
        string type
        string campaignId
        date timestamp
        object data
    }`} />
          </motion.section>

          <GlassSeparator />

          {/* ─── Send / Receipt Loop ─── */}
          <motion.section id="send-loop" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="send-loop">Send / Receipt Loop</H2>
            <P className="mt-4">Two patterns make the send path correct under crashes, retries, and out-of-order callbacks: a transactional outbox and an append-only event log.</P>
            <MermaidDiagram chart={`flowchart LR
    subgraph Ingest["1. Ingest"]
        CSV["CSV / XLSX Import\nxlsx (SheetJS)"]
        VAL["Per-row Validation"]
        CSV --> VAL
    end

    subgraph Segment["2. Segment"]
        AI["AI NL Segmentation"]
        DSL["Filter DSL → MongoDB query"]
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
        BATCH["Batch of 50"]
        CLAIM --> BATCH
    end

    subgraph Channel["5. Channel Service"]
        WA[WhatsApp]
        SMS[SMS]
        EM[Email]
        RCS[RCS]
    end

    subgraph Receipts["6. Receipts"]
        CB["Async Callbacks\nPOST /api/receipts"]
        EVT[(CommEvent\nAppend-only)]
        RANK["Monotonic\nRank Max"]
        CB --> EVT
        EVT --> RANK
    end

    subgraph Attribute["7. Attribution"]
        WIN["7-day Window"]
        REV["Revenue Attribution"]
        WIN --> REV
    end

    subgraph Insights["8. Insights"]
        COUNTERS["Live Counters\nIn-memory"]
        AI_INS["AI Performance Briefs"]
        COUNTERS --> AI_INS
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
    REV --> COUNTERS`} />
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

          {/* ─── AI Tool Layer ─── */}
          <motion.section id="ai-tools" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="ai-tools">AI Tool Layer</H2>
            <P className="mt-4">CRM operations are exposed as tools the LLM invokes dynamically. The agent decides the workflow, with a confirmation gate before destructive operations.</P>

            <H3>Crew Architecture</H3>
            <MermaidDiagram chart={`graph TB
    subgraph AgentService["Agent Service — FastAPI :8001"]
        direction TB
        CC["/crew/chat → CampaignCrew"]
        CMD["/crew/command → CommandCrew"]
        OPP["/crew/opportunities → OpportunityCrew"]
        INS["/crew/insights → InsightsCrew"]
        SEG["/crew/segment → SegmentCrew"]
    end

    subgraph Agents["10 Specialized Agents"]
        CS["Campaign Synthesizer"]
        CD["Campaign Dispatcher"]
        IC["Intent Classifier"]
        DA["Data Analyst"]
        MC["Message Composer"]
        OS["Opportunity Scanner"]
        IR["Insights Reporter"]
        SB["Segment Builder"]
        SGA["Segment Generator"]
        CJ["Command Judge"]
    end

    subgraph Tools["23+ CRM Tools"]
        THTTP["http.py — Pending action queue"]
        TCUST["customers.py"]
        TCAMP["campaigns.py"]
        TSEG["segments.py"]
        TOPP["opportunities.py"]
        TPROP["proposals.py"]
        TANA["analytics.py"]
        TPIPE["pipeline.py"]
        TSET["settings.py"]
        TORD["orders.py"]
    end

    CC --> CS
    CC --> CD
    CMD --> IC
    CMD --> DA
    CMD --> CJ
    OPP --> OS
    INS --> IR
    SEG --> SB
    SEG --> SGA

    CS --> THTTP
    CD --> THTTP
    IC --> TCUST
    DA --> TANA
    MC --> TCAMP
    OS --> TOPP
    IR --> TANA
    SB --> TSEG
    CJ --> TPROP

    THTTP -->|"HTTP to :8000"| BE["Backend API"]`} />

            <H3>Tool Reference</H3>
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

          {/* ─── Ingestion API ─── */}
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
            <H3>Frontend Import Flow</H3>
            <MermaidDiagram chart={`flowchart LR
    USER["User drops CSV/XLSX"]
    PARSE["xlsx (SheetJS)\nClient-side parsing"]
    VALID["Row validation\nname required, email format"]
    POST["POST /api/customers/bulk\nJSON body"]
    RES["Response: imported/rejected"]
    UI["Toast: X imported, Y rejected"]

    USER --> PARSE
    PARSE --> VALID
    VALID --> POST
    POST --> RES
    RES --> UI`} />
          </motion.section>

          <GlassSeparator />

          {/* ─── API Reference ─── */}
          <motion.section id="api-reference" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="api-reference">API Reference</H2>
            <P className="mt-4">All routes under <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">/api</code>. <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">GET /health</code> is the liveness probe. Auth middleware sets <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">req.userId = 'default-user'</code> — no real authentication.</P>

            <H3>Route Map</H3>
            <MermaidDiagram chart={`graph LR
    subgraph Customers["/api/customers"]
        C1["GET / — List with search/filter"]
        C2["POST / — Create one"]
        C3["POST /bulk — Bulk JSON ingest"]
        C4["GET /:id — Get one"]
        C5["DELETE /:id — Delete one"]
        C6["GET /distributions — Tag/city stats"]
    end

    subgraph Orders["/api/orders"]
        O1["GET / — List orders"]
    end

    subgraph Segments["/api/segments"]
        S1["GET / — List with counts"]
        S2["POST / — Create"]
        S3["POST /generate — AI generate"]
        S4["POST /ai-generate — AI NL generate"]
        S5["POST /preview — Preview audience"]
        S6["GET /:id — Get one"]
        S7["GET /:id/customers — Segment members"]
        S8["DELETE /:id — Delete"]
    end

    subgraph Campaigns["/api/campaigns"]
        CA1["GET / — List"]
        CA2["POST / — Create"]
        CA3["GET /:id — Get one"]
        CA4["PATCH /:id — Update"]
        CA5["POST /:id/launch — Launch"]
        CA6["GET /:id/stats — Live stats"]
        CA7["GET /:id/communications — Sends"]
        CA8["PATCH /:id/stop — Stop"]
        CA9["DELETE /:id — Delete"]
    end

    subgraph Analytics["/api/analytics"]
        A1["GET /overview — KPIs"]
        A2["GET /channels — Per-channel perf"]
        A3["GET /campaigns/top — Top campaigns"]
        A4["GET /funnel — Aggregate funnel"]
    end

    subgraph AI["/api/agent"]
        AI1["POST /chat — SSE stream"]
        AI2["POST /command — SSE stream"]
        AI3["POST /execute — Run tool"]
        AI4["POST /confirm — Confirm action"]
        AI5["GET /system-status — Health"]
    end

    subgraph Other["Other"]
        OP1["GET /api/opportunities — List"]
        OP2["POST /api/opportunities/scan — Trigger"]
        PR1["GET /api/proposals — List"]
        PR2["PATCH /api/proposals/:id/approve"]
        PR3["PATCH /api/proposals/:id/reject"]
        PL1["GET /api/pipeline/status"]
        PL2["GET /api/pipeline/events"]
        SET1["GET /api/settings"]
        SET2["PUT /api/settings"]
        REC1["POST /api/receipts/callback"]
        H1["GET /health"]
    end`} />

            <H3>Complete Endpoint Table</H3>
            <GlassTable
              headers={['Method', 'Path', 'Description']}
              rows={[
                ['GET', '/health', 'Liveness probe'],
                ['GET', '/api/customers', 'List customers with search/filter'],
                ['POST', '/api/customers', 'Create a customer'],
                ['POST', '/api/customers/bulk', 'Bulk JSON ingest'],
                ['GET', '/api/customers/:id', 'Get single customer'],
                ['DELETE', '/api/customers/:id', 'Delete a customer'],
                ['GET', '/api/customers/distributions', 'Tag and city distribution stats'],
                ['GET', '/api/orders', 'List orders'],
                ['GET', '/api/segments', 'List segments with counts'],
                ['POST', '/api/segments', 'Create segment'],
                ['POST', '/api/segments/generate', 'AI segment generation'],
                ['POST', '/api/segments/ai-generate', 'AI natural-language segment'],
                ['POST', '/api/segments/preview', 'Preview segment audience'],
                ['GET', '/api/segments/:id', 'Get segment'],
                ['GET', '/api/segments/:id/customers', 'Get segment members'],
                ['DELETE', '/api/segments/:id', 'Delete segment'],
                ['GET', '/api/campaigns', 'List campaigns'],
                ['POST', '/api/campaigns', 'Create campaign'],
                ['GET', '/api/campaigns/:id', 'Get campaign'],
                ['PATCH', '/api/campaigns/:id', 'Update campaign'],
                ['POST', '/api/campaigns/:id/launch', 'Launch campaign'],
                ['GET', '/api/campaigns/:id/stats', 'Live campaign stats'],
                ['GET', '/api/campaigns/:id/communications', 'Campaign sends'],
                ['PATCH', '/api/campaigns/:id/stop', 'Stop campaign'],
                ['DELETE', '/api/campaigns/:id', 'Delete campaign'],
                ['GET', '/api/analytics/overview', 'KPI overview'],
                ['GET', '/api/analytics/channels', 'Per-channel performance'],
                ['GET', '/api/analytics/campaigns/top', 'Top campaigns'],
                ['GET', '/api/analytics/funnel', 'Aggregate funnel'],
                ['GET', '/api/opportunities', 'AI-discovered opportunities'],
                ['GET', '/api/opportunities/count', 'Opportunity count for badge'],
                ['POST', '/api/opportunities/scan', 'Trigger AI opportunity scan'],
                ['PATCH', '/api/opportunities/:id/dismiss', 'Dismiss opportunity'],
                ['POST', '/api/opportunities/:id/generate-campaign', 'Convert to campaign'],
                ['GET', '/api/proposals', 'AI campaign proposals'],
                ['GET', '/api/proposals/count', 'Proposal count for badge'],
                ['POST', '/api/proposals', 'Create proposal'],
                ['GET', '/api/proposals/:id', 'Get proposal'],
                ['PATCH', '/api/proposals/:id', 'Update proposal'],
                ['PATCH', '/api/proposals/:id/approve', 'Approve proposal'],
                ['PATCH', '/api/proposals/:id/reject', 'Reject proposal'],
                ['GET', '/api/pipeline/status', 'Pipeline health + active runs'],
                ['GET', '/api/pipeline/events', 'Event timeline'],
                ['GET', '/api/settings', 'User settings'],
                ['PUT', '/api/settings', 'Update settings'],
                ['POST', '/api/setup/check', 'Check if data exists'],
                ['POST', '/api/setup/seed', 'Seed demo data'],
                ['POST', '/api/agent/chat', 'AI agent chat (SSE)'],
                ['POST', '/api/agent/command', 'AI agent command (SSE)'],
                ['POST', '/api/agent/execute', 'Execute approved tool'],
                ['POST', '/api/agent/confirm', 'Confirm pending action'],
                ['GET', '/api/agent/system-status', 'System health status'],
                ['POST', '/api/receipts/callback', 'Channel callback sink (no auth)'],
              ]}
            />
          </motion.section>

          <GlassSeparator />

          {/* ─── Design Tradeoffs ─── */}
          <motion.section id="tradeoffs" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="tradeoffs">Design Tradeoffs</H2>
            <P className="mt-4">Every decision is tuned for "correct, observable, and demoable" at ~2k customers / ~8k orders.</P>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { n: '1', t: 'Outbox vs. Kafka/SQS', d: 'At-least-once delivery without a broker. At scale: replace with SQS/Kafka.' },
                { n: '2', t: 'FOR UPDATE SKIP LOCKED', d: 'Atomic claim for concurrent workers. At scale: shard by campaignId.' },
                { n: '3', t: 'Monotonic receipt ranking', d: 'Correct ordering with idempotent duplicates.' },
                { n: '4', t: 'Live counters (in-memory)', d: 'O(1) reads during sends. At scale: Redis Cluster.' },
                { n: '5', t: 'Separate channel service', d: 'Mirrors real provider boundary for honest design.' },
                { n: '6', t: 'BYOK multi-provider AI', d: 'No vendor lock-in. Works without any key.' },
                { n: '7', t: 'Confirmation gate', d: 'launch_campaign requires approval. Idempotent via hash.' },
                { n: '8', t: 'No external state library', d: 'All state is local useState. Simple but no cross-component sync.' },
                { n: '9', t: 'No auth enforcement', d: 'DEFAULT_USER_ID bypass. Multi-tenant data isolation via userId field — ready for real auth.' },
                { n: '10', t: 'Client-side CSV parsing', d: 'xlsx (SheetJS) in browser. At scale: stream to server for large files.' },
              ].map(t => <DocCard key={t.n} number={t.n} title={t.t}>{t.d}</DocCard>)}
            </div>
          </motion.section>

          <GlassSeparator />

          {/* ─── Deployment ─── */}
          <motion.section id="deploy" className="scroll-mt-24 py-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <H2 id="deploy">Deployment</H2>
            <P className="mt-4">Four services orchestrated via Docker Compose, backed by MongoDB.</P>

            <H3>Service Orchestration</H3>
            <MermaidDiagram chart={`flowchart TB
    DC["docker-compose.yml"]
    MONGO["mongodb\nmongo:7\nport 27017\nVolume: mongo-data"]
    BE["backend\nNode.js + Express\nport 8000\nDepends: mongodb"]
    AG["agent-service\nFastAPI + CrewAI\nport 8001"]
    CH["channel-service\nNode.js\nport 8002\nDepends: mongodb"]
    FE["frontend\nMulti-stage build\nNode → Nginx\nport 80"]

    DC --> MONGO
    DC --> BE
    DC --> AG
    DC --> CH
    DC --> FE

    BE -->|"MONGODB_URI"| MONGO
    CH -->|"MongoDB"| MONGO
    AG -->|"HTTP to :8000"| BE
    FE -->|"VITE_API_URL"| BE
    BE -->|"POST /send"| CH`} />

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
              headers={['Variable', 'Service', 'Default', 'Description']}
              rows={[
                ['MONGODB_URI', 'backend', 'mongodb://localhost:27017/xenocrm', 'MongoDB connection string'],
                ['FRONTEND_URL', 'backend', 'http://localhost:5173', 'CORS origin'],
                ['PORT', 'backend', '8000', 'Express port'],
                ['VITE_API_URL', 'frontend', 'http://localhost:8000', 'Backend API base URL'],
                ['DEFAULT_USER_ID', 'backend', 'default-user', 'Hardcoded user for auth bypass'],
              ]}
            />
            <H3>Frontend Build</H3>
            <P className="mt-2">Vite builds to static files. Deployed on Vercel (SPA rewrites in vercel.json) or via Docker with Nginx serving the <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">dist/</code> folder on port 80.</P>
            <H3>Post-deploy smoke test</H3>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-gray-400">
              <li><code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">GET /health</code> → <code className="text-gray-300">{`{ "status": "ok" }`}</code></li>
              <li>Open frontend — landing page loads with video background</li>
              <li>Navigate to <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400">/docs</code> — documentation loads with Mermaid diagrams</li>
              <li>Click "Open CRM" → dashboard loads with KPI cards</li>
              <li>Import customers via CSV on the Customers page</li>
              <li>Open AI Command Centre → ask "Show me top customers"</li>
              <li>Watch live stats update in real time on Pipeline Monitor</li>
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
