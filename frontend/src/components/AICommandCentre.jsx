import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bot, X, Send, Users, Megaphone, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import AgentResponseRenderer from './AgentResponseRenderer';
import api from '../lib/api';
import { formatNumber, formatCurrency } from '../lib/utils';

function SystemStatusCard({ data }) {
  return (
    <div className="space-y-3 mt-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Worker', value: data?.channel_service_health === 'ok' ? 'Healthy' : 'Degraded', ok: data?.channel_service_health === 'ok' },
          { label: 'Queue', value: `${formatNumber(data?.queue_pending || 0)} pending`, ok: (data?.queue_pending || 0) < 50 },
          { label: 'Active Campaigns', value: formatNumber(data?.active_campaigns || 0), ok: true },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase">{item.label}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {item.ok ? <CheckCircle size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-red-500" />}
              <p className={`text-sm font-bold ${item.ok ? 'text-green-600' : 'text-red-600'}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountsCard({ data }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {[
        { label: 'Total Customers', value: formatNumber(data?.customers || 0), icon: Users },
        { label: 'Total Campaigns', value: formatNumber(data?.campaigns || 0), icon: Megaphone },
        { label: 'Active Campaigns', value: formatNumber(data?.activeCampaigns || 0), icon: TrendingUp },
        { label: 'Running Campaigns', value: formatNumber(data?.runningCampaigns || 0), icon: CheckCircle },
      ].map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="bg-white rounded-lg p-3 border border-gray-100 flex items-center gap-2">
            <Icon size={16} className="text-[#0fd4b4]" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase">{item.label}</p>
              <p className="text-sm font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopCustomersCard({ customers }) {
  if (!customers?.length) return null;
  return (
    <div className="space-y-1 mt-2">
      {customers.map(c => (
        <div key={c._id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-500">{c.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{formatCurrency(c.ltv)}</p>
            <p className="text-xs text-gray-500">{formatNumber(c.totalOrders)} orders</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentCampaignsCard({ campaigns }) {
  if (!campaigns?.length) return null;
  return (
    <div className="space-y-1 mt-2">
      {campaigns.map(c => (
        <div key={c._id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-500">{c.channel} · {c.status}</p>
          </div>
          <p className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</p>
        </div>
      ))}
    </div>
  );
}

export default function AICommandCentre({ onClose }) {
  const { getToken } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const { events, isStreaming, startStream } = useSSE();
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try { const r = await api.get('/api/pipeline/status'); setSysStatus(r.data); } catch (e) {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, events]);

  // ─── Hardcoded response handlers ────────────────────────────────────────────

  const handleAbout = async () => {
    return "Xeno CRM is a D2C (Direct-to-Consumer) marketing automation platform built for brands to manage campaigns, customer segments, and AI-powered insights. You can use it to create multi-channel campaigns (WhatsApp, SMS, Email, RCS), discover customer opportunities, generate AI campaigns, and track performance — all in one place.";
  };

  const handleSystemStatus = async () => {
    try {
      const [pipelineRes, campaignRes] = await Promise.all([
        api.get('/api/pipeline/status').catch(() => ({ data: {} })),
        api.get('/api/agent/system-status').catch(() => ({ data: {} })),
      ]);
      const merged = {
        channel_service_health: pipelineRes.data?.channel_service_health || 'unknown',
        queue_pending: pipelineRes.data?.queue_pending || 0,
        active_campaigns: campaignRes.data?.active_campaigns || 0,
      };
      setSysStatus(merged);
      return { type: 'system_status', data: merged };
    } catch {
      return "I couldn't fetch the system status right now. Please try again in a moment.";
    }
  };

  const handleCounts = async () => {
    try {
      const [customerRes, campaignRes] = await Promise.all([
        api.get('/api/customers?limit=1').catch(() => ({ data: {} })),
        api.get('/api/campaigns?limit=1').catch(() => ({ data: {} })),
      ]);
      const totalCustomers = customerRes.data?.total || 0;
      const totalCampaigns = campaignRes.data?.campaigns?.length
        ? campaignRes.data.total || campaignRes.data.campaigns.length
        : (campaignRes.data?.total || 0);
      const activeCampaigns = campaignRes.data?.campaigns
        ? campaignRes.data.campaigns.filter(c => c.status === 'running' || c.status === 'draft').length
        : 0;
      return { type: 'counts', data: { customers: totalCustomers, campaigns: totalCampaigns, activeCampaigns, runningCampaigns: campaignRes.data?.campaigns?.filter(c => c.status === 'running').length || 0 } };
    } catch {
      return "Couldn't retrieve counts right now. The database might be unavailable.";
    }
  };

  const handleTopCustomers = async () => {
    try {
      const r = await api.get('/api/customers?limit=10&sort=ltv').catch(() => ({ data: {} }));
      const customers = r.data?.customers || [];
      if (!customers.length) return "No customer data found yet.";
      return { type: 'top_customers', customers };
    } catch {
      return "Couldn't fetch customer data right now.";
    }
  };

  const handleRecentCampaigns = async () => {
    try {
      const r = await api.get('/api/campaigns?limit=5&sort=-createdAt').catch(() => ({ data: {} }));
      const campaigns = r.data?.campaigns || r.data || [];
      if (!campaigns.length) return "No campaigns found yet. Create your first campaign!";
      return { type: 'recent_campaigns', campaigns };
    } catch {
      return "Couldn't fetch campaigns right now.";
    }
  };

  // ─── Pattern matcher ────────────────────────────────────────────────────────

  const routeMessage = async (text) => {
    const lower = text.toLowerCase();

    // About / help patterns
    if (/what (is|does) (this|xeno|your|the) (crm|app|platform|software|application)\??$/.test(lower) ||
        /what are you\??$/.test(lower) ||
        /who are you\??$/.test(lower) ||
        /how (do|can) i (use|work with) (this|xeno|your|the) (crm|app|platform)\??$/.test(lower) ||
        /what can you (do|help|assist)\??$/.test(lower) ||
        /help( me)?( with)?( this)?$/i.test(lower) ||
        /^about$/.test(lower.trim())) {
      return { type: 'text', content: await handleAbout() };
    }

    // System status patterns
    if (/system (status|health|check)\??$/.test(lower) ||
        /(is everything|is the system|is it) (working|running|ok|healthy|up)\??$/.test(lower) ||
        /how('s| is) the (system|app|platform) (doing|running)\??$/.test(lower) ||
        /(show|display|get) (me)? ?(system|status) (report|info|overview)\??$/.test(lower) ||
        /^status$/.test(lower.trim())) {
      return handleSystemStatus();
    }

    // Count / stats patterns
    if (/how many (customers?|campaigns?|segments?|orders?|opportunities?)\??$/.test(lower) ||
        /total (customers?|campaigns?|segments?|orders?)\??$/.test(lower) ||
        /(show|what('s| is)?|tell me|get) (me )?(the )?(total|count|number) (of )?(customers?|campaigns?|segments?|orders?)\??$/.test(lower) ||
        /(customers?|campaigns?|segments?) (count|stats|statistics|overview)\??$/.test(lower)) {
      return handleCounts();
    }

    // Top customers patterns
    if (/top (customers?|buyers?|high.?value|lvp)\??$/.test(lower) ||
        /best (customers?|buyers?)\??$/.test(lower) ||
        /highest (ltv|spend|value) (customers?)?\??$/.test(lower) ||
        /vip (customers?|buyers?)\??$/.test(lower) ||
        /(show|what('s| is)?|tell me|get) (me )?(the )?top( |-)?(customers?|buyers?|high.?value)\??$/.test(lower) ||
        /(who are|which are) (my |the )?(best|top|high.?value) (customers?|buyers?)\??$/.test(lower)) {
      return handleTopCustomers();
    }

    // Recent / last campaign patterns
    if (/recent (campaigns?|orders?|activity)\??$/.test(lower) ||
        /latest (campaigns?|orders?|activity)\??$/.test(lower) ||
        /last (campaign|order|activity)\??$/.test(lower) ||
        /(show|what('s| is)?|tell me|get) (me )?(the )?recent (campaigns?|orders?|activity)\??$/.test(lower) ||
        /(what was|how did) (my|the) (last|latest) (campaign|order)\??$/.test(lower)) {
      return handleRecentCampaigns();
    }

    // Fall through to LLM
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');

    const routed = await routeMessage(msg);

    if (routed) {
      if (routed.type === 'text') {
        setMessages(prev => [...prev, { role: 'assistant', content: routed.content, structuredEvents: [] }]);
      } else if (routed.type === 'system_status') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Here is the current system status:', structuredEvents: [{ type: 'text', content: '' }, routed] }]);
      } else if (routed.type === 'counts') {
        setMessages(prev => [...prev, { role: 'assistant', content: `Here are the current counts:`, structuredEvents: [routed] }]);
      } else if (routed.type === 'top_customers') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Here are your top customers by LTV:', structuredEvents: [routed] }]);
      } else if (routed.type === 'recent_campaigns') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Here are your most recent campaigns:', structuredEvents: [routed] }]);
      }
      return;
    }

    // Route to LLM
    const token = await getToken();
    await startStream(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent/chat`,
      { session_id: sessionId, message: msg },
      token
    );
  };

  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.type === 'text') {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, content: lastEvent.content };
            return updated;
          }
          return [...prev, { role: 'assistant', content: lastEvent.content, structuredEvents: [] }];
        });
      } else {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, structuredEvents: [...(last.structuredEvents || []), lastEvent] };
            return updated;
          }
          return [...prev, { role: 'assistant', content: '', structuredEvents: [lastEvent] }];
        });
      }
    }
  }, [events]);

  const renderStructuredEvent = (event) => {
    if (event.type === 'system_status') return <SystemStatusCard data={event.data} />;
    if (event.type === 'counts') return <CountsCard data={event.data} />;
    if (event.type === 'top_customers') return <TopCustomersCard customers={event.customers} />;
    if (event.type === 'recent_campaigns') return <RecentCampaignsCard campaigns={event.campaigns} />;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0fd4b4] flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">AI Command Centre</p>
              <p className="text-xs text-gray-500">System overview & assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">WORKER</p>
            <p className={`text-sm font-bold ${sysStatus?.channel_service_health === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {sysStatus?.channel_service_health === 'ok' ? 'Healthy' : 'Degraded'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">QUEUE</p>
            <p className="text-sm font-bold text-gray-900">{formatNumber(sysStatus?.queue_pending || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">ACTIVE RUNS</p>
            <p className="text-sm font-bold text-gray-900">{formatNumber(sysStatus?.active_campaigns || 0)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
              <p className="text-sm text-gray-700">
                Hello! I'm the Xeno AI Command Centre. Ask me about the system, your customers, or campaigns — or describe any marketing goal and I'll generate a campaign for you.
              </p>
              <p className="text-xs text-gray-400 text-right mt-1">{new Date().toLocaleTimeString()}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none px-4 py-3' : 'bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3'}`}>
                {msg.content && <p className="text-sm">{msg.content}</p>}
                {msg.structuredEvents && msg.structuredEvents.length > 0 && (
                  <div className="mt-2">
                    {msg.structuredEvents.map((ev, j) => {
                      if (ev.type && ev.type !== 'text') return <div key={j}>{renderStructuredEvent(ev)}</div>;
                      if (ev.type === 'text' && ev.content) return <p key={j} className="text-sm text-gray-700">{ev.content}</p>;
                      if (ev.structuredEvents) return <AgentResponseRenderer key={j} events={ev.structuredEvents} />;
                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about system status, customers, campaigns, or describe a marketing goal..."
              disabled={isStreaming}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0fd4b4] disabled:opacity-50"
            />
            <button onClick={handleSend} disabled={isStreaming} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-3 transition-colors disabled:opacity-50">
              {isStreaming ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}