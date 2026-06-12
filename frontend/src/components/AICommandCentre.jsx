import { useState, useEffect, useRef } from 'react';

import { Bot, X, Send, Users, Megaphone, TrendingUp, CheckCircle, AlertCircle, MousePointerClick, Eye, DollarSign } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import api from '../lib/api';
import { formatNumber, formatCurrency } from '../lib/utils';

function SystemStatusCard({ data }) {
  return (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Worker', value: data?.channel_service_health === 'ok' ? 'Healthy' : 'Degraded', ok: data?.channel_service_health === 'ok' },
          { label: 'Queue', value: `${formatNumber(data?.queue_pending || 0)} pending`, ok: (data?.queue_pending || 0) < 50 },
          { label: 'Active Runs', value: formatNumber(data?.active_campaigns || 0), ok: true },
        ].map(item => (
          <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
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

function CustomersTableCard({ customers }) {
  if (!customers?.length) return null;
  return (
    <div className="space-y-1 mt-2">
      {customers.map(c => (
        <div key={c._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-500">{c.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{formatCurrency(c.ltv)}</p>
            <p className="text-xs text-gray-500">{formatNumber(c.totalOrders || 0)} orders</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignsTableCard({ campaigns }) {
  if (!campaigns?.length) return null;
  const statusColors = { draft: 'bg-gray-100 text-gray-600', running: 'bg-blue-100 text-blue-600', completed: 'bg-green-100 text-green-700' };
  const channelColors = { whatsapp: 'bg-green-100 text-green-700', email: 'bg-blue-100 text-blue-700', sms: 'bg-yellow-100 text-yellow-700', rcs: 'bg-purple-100 text-purple-700' };
  return (
    <div className="space-y-1 mt-2">
      {campaigns.map(c => (
        <div key={c._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{c.name}</p>
            <div className="flex gap-1 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border-0 ${channelColors[c.channel] || 'bg-gray-100 text-gray-600'}`}>{c.channel}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border-0 ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Sent: {formatNumber(c.stats?.sent || 0)}</p>
            <p className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SegmentsTableCard({ segments }) {
  if (!segments?.length) return null;
  return (
    <div className="space-y-1 mt-2">
      {segments.map(s => (
        <div key={s._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{s.name}</p>
            <p className="text-xs text-gray-500">{s.filterRules?.length || 0} filter rules · {s.logic}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border-0 ${s.createdBy === 'agent' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
            {s.createdBy}
          </span>
        </div>
      ))}
    </div>
  );
}

function PipelineCard({ data }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase">{k.replace(/_/g, ' ')}</p>
          <p className="text-sm font-bold text-gray-900">{String(v)}</p>
        </div>
      ))}
    </div>
  );
}

function CampaignPlanCard({ details }) {
  const title = details?.['Campaign Title'] || details?.campaign_title || 'Untitled';
  const audience = details?.['Target Audience'] || details?.target_audience || '—';
  const description = details?.['Description'] || details?.description || '';
  const category = details?.['ProductCategory'] || details?.product_category || '—';
  const colors = {
    'Active Buyers': 'bg-green-100 text-green-700',
    'At risk of losing buyers': 'bg-red-100 text-red-700',
    'VIP': 'bg-purple-100 text-purple-700',
    'New Buyers': 'bg-blue-100 text-blue-700',
    'Value Buyers': 'bg-amber-100 text-amber-700',
  };
  return (
    <div className="border border-[#0fd4b4]/40 rounded-xl bg-teal-50/40 p-4 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <Megaphone size={14} className="text-[#0fd4b4]" />
        <span className="text-xs font-semibold text-[#0fd4b4] uppercase">Campaign Plan</span>
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        <span className={`text-xs px-2 py-1 rounded-full border-0 ${colors[audience] || 'bg-gray-100 text-gray-700'}`}>{audience}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border-0">{category}</span>
      </div>
      {description && <p className="text-sm text-gray-700 mt-2">{description}</p>}
    </div>
  );
}

export default function AICommandCentre({ onClose }) {

  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const { events, isStreaming, startStream } = useSSE();
  const chatEndRef = useRef(null);
  const [suggestions] = useState([
    'System status',
    'Top customers by LTV',
    'Recent campaigns',
    'How many customers?',
    'Create a campaign for VIP customers',
  ]);

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

  const handleSuggestion = (text) => {
    setInput(text);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');

    await startStream(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent/command`,
      { session_id: sessionId, message: msg }
    );
  };

  // Handle command_result events — these tell us what API to call
  const handleCommandResult = async (data) => {
    const { action, params } = data;
    try {
      let fetchedData = null;
      switch (action) {
        case 'fetch_customers': {
          const r = await api.get('/api/customers', { params: { ...params, limit: params.limit || 10 } });
          fetchedData = { customers: r.data.customers || r.data };
          break;
        }
        case 'fetch_campaigns': {
          const r = await api.get('/api/campaigns', { params: { ...params, sort: params.sort || '-createdAt' } });
          fetchedData = { campaigns: r.data.campaigns || r.data };
          break;
        }
        case 'fetch_segments': {
          const r = await api.get('/api/segments');
          fetchedData = { segments: r.data.segments || r.data };
          break;
        }
        case 'fetch_pipeline_status': {
          const r = await api.get('/api/pipeline/status');
          fetchedData = { pipeline: r.data };
          break;
        }
        case 'fetch_system_status': {
          const r = await api.get('/api/agent/system-status');
          fetchedData = { pipeline: r.data };
          break;
        }
        case 'fetch_opportunities': {
          const r = await api.get('/api/opportunities', { params: { status: 'active', limit: params.limit || 5 } });
          fetchedData = { opportunities: r.data.opportunities || r.data };
          break;
        }
        case 'generate_campaign': {
          fetchedData = { campaign_details: params };
          break;
        }
        default:
          break;
      }
      if (fetchedData) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const updated = [...prev];
            const existing = updated[updated.length - 1];
            updated[updated.length - 1] = { ...existing, fetchData: { ...existing.fetchData, ...fetchedData } };
            return updated;
          }
          return [...prev, { role: 'assistant', content: '', fetchData: fetchedData, structuredEvents: [] }];
        });
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    }
  };

  // Process all buffered events whenever events array changes
  useEffect(() => {
    if (events.length === 0) return;

    // Process all new events in order
    for (const event of events) {
      if (event.type === 'done') {
        // useSSE resets isStreaming internally on 'done' event
        break;
      }

      if (event.type === 'error') {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, content: `Error: ${event.message}` };
            return updated;
          }
          return [...prev, { role: 'assistant', content: `Error: ${event.message}`, fetchData: null, structuredEvents: [] }];
        });
        break;
      }

      if (event.type === 'text') {
        setMessages(prev => {
          // Append text to last assistant message, or create new one
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...last,
              content: last.content ? `${last.content} ${event.content}` : event.content,
            };
            return updated;
          }
          return [...prev, { role: 'assistant', content: event.content, fetchData: null, structuredEvents: [] }];
        });
      }

      if (event.type === 'command_result') {
        // Fire and forget - update the last assistant message's fetchData
        const { action, params } = event.data || {};
        const safeUpdate = (updater) => setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role !== 'assistant') return prev;
          return [...prev.slice(0, -1), updater(last)];
        });

        const applyFetch = (fetched) => {
          safeUpdate(last => ({ ...last, fetchData: { ...last.fetchData, ...fetched } }));
        };

        if (action === 'fetch_customers') {
          api.get('/api/customers', { params: { ...params, limit: params.limit || 10 } })
            .then(r => applyFetch({ customers: r.data.customers || r.data }))
            .catch(() => applyFetch({ customers: [] }));
        } else if (action === 'fetch_campaigns') {
          api.get('/api/campaigns', { params: { ...params, sort: params.sort || '-createdAt' } })
            .then(r => applyFetch({ campaigns: r.data.campaigns || r.data }))
            .catch(() => applyFetch({ campaigns: [] }));
        } else if (action === 'fetch_segments') {
          api.get('/api/segments')
            .then(r => applyFetch({ segments: r.data.segments || r.data }))
            .catch(() => applyFetch({ segments: [] }));
        } else if (action === 'fetch_pipeline_status') {
          api.get('/api/pipeline/status')
            .then(r => applyFetch({ pipeline: r.data }))
            .catch(() => applyFetch({ pipeline: {} }));
        } else if (action === 'fetch_system_status') {
          api.get('/api/agent/system-status')
            .then(r => applyFetch({ pipeline: r.data }))
            .catch(() => applyFetch({ pipeline: {} }));
        } else if (action === 'fetch_opportunities') {
          api.get('/api/opportunities', { params: { status: 'active', limit: params.limit || 5 } })
            .then(r => applyFetch({ opportunities: r.data.opportunities || r.data }))
            .catch(() => applyFetch({ opportunities: [] }));
        } else if (action === 'generate_campaign') {
          applyFetch({ campaign_details: params });
        }
      }
    }
  }, [events]);

  const renderFetchData = (msg) => {
    const fd = msg.fetchData;
    if (!fd) return null;
    return (
      <div className="mt-2 space-y-2">
        {fd.customers && <CustomersTableCard customers={fd.customers} />}
        {fd.campaigns && <CampaignsTableCard campaigns={fd.campaigns} />}
        {fd.segments && <SegmentsTableCard segments={fd.segments} />}
        {fd.pipeline && <PipelineCard data={fd.pipeline} />}
        {fd.opportunities && <CampaignsTableCard campaigns={fd.opportunities.map(o => ({ _id: o._id, name: o.title, channel: o.recommended_channel || 'whatsapp', status: 'opportunity', stats: { sent: 0 }, createdAt: o.createdAt }))} />}
        {fd.campaign_details && <CampaignPlanCard details={fd.campaign_details} />}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0fd4b4] flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">AI Command Centre</p>
              <p className="text-xs text-gray-500">Ask anything or describe a marketing goal</p>
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
            <div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                <p className="text-sm text-gray-700">
                  Hello! I can answer questions about your CRM, check system status, analyze customers and campaigns, or help you create marketing campaigns. What would you like to do?
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 ml-2">
                {suggestions.map(s => (
                  <button key={s} onClick={() => handleSuggestion(s)} className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-gray-50 hover:border-[#0fd4b4] hover:text-[#0fd4b4] transition-colors">
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 ml-2">Click a suggestion or type your own query</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none px-4 py-3' : 'bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3'}`}>
                {msg.content && <p className="text-sm">{msg.content}</p>}
                {msg.fetchData && renderFetchData(msg)}
                {msg.structuredEvents?.length > 0 && msg.structuredEvents.map((ev, j) => {
                  if (ev.type === 'campaign_details') {
                    return <CampaignPlanCard key={j} details={ev.data?.CampaignDetails || ev.data} />;
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
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