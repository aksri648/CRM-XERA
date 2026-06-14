import { useState, useEffect, useRef } from 'react';

import { Bot, X, Send, Megaphone, CheckCircle, AlertCircle, Wrench, AlertTriangle, Check, XCircle } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import api from '../lib/api';
import { formatNumber, formatCurrency } from '../lib/utils';

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
  const statusColors = { draft: 'bg-gray-100 text-gray-600', running: 'bg-blue-100 text-blue-600', stopped: 'bg-orange-100 text-orange-600', completed: 'bg-green-100 text-green-700' };
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
            <p className="text-xs text-gray-500">{s.filterRules?.length || 0} filter rules · {s.logic} · {formatNumber(s.customerCount || 0)} customers</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border-0 ${s.createdBy === 'agent' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
            {s.createdBy}
          </span>
        </div>
      ))}
    </div>
  );
}

function OpportunitiesTableCard({ opportunities }) {
  if (!opportunities?.length) return null;
  return (
    <div className="space-y-1 mt-2">
      {opportunities.map(o => (
        <div key={o._id} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{o.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{o.audienceDescription}</p>
          <p className="text-xs text-gray-500">Expected revenue: {formatCurrency(o.expectedRevenue || 0)}</p>
        </div>
      ))}
    </div>
  );
}

function KeyValueCard({ data }) {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(([k]) => !['_id', '__v'].includes(k));
  if (entries.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {entries.map(([k, v]) => (
        <div key={k} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase">{k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}</p>
          <p className="text-sm font-bold text-gray-900 break-all">
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

function RawJsonCard({ data }) {
  return (
    <pre className="bg-gray-50 border border-gray-100 rounded-lg p-2 mt-2 text-[11px] text-gray-700 overflow-x-auto max-h-48">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ToolResultCard({ tool, data }) {
  const customers = data?.customers;
  const campaigns = data?.campaigns;
  const segments = data?.segments;
  const opportunities = data?.opportunities;

  if (tool === 'list_customers' || tool === 'get_segment_customers') {
    return <CustomersTableCard customers={customers || (Array.isArray(data) ? data : [])} />;
  }
  if (tool === 'list_campaigns') {
    return <CampaignsTableCard campaigns={campaigns || (Array.isArray(data) ? data : [])} />;
  }
  if (tool === 'list_segments') {
    return <SegmentsTableCard segments={segments || (Array.isArray(data) ? data : [])} />;
  }
  if (tool === 'list_opportunities') {
    return <OpportunitiesTableCard opportunities={opportunities || (Array.isArray(data) ? data : [])} />;
  }
  if (tool === 'get_pipeline_status' || tool === 'get_analytics_overview' || tool === 'get_channels_analytics' || tool === 'get_funnel' || tool === 'get_settings' || tool === 'get_customer_distributions') {
    return <KeyValueCard data={data} />;
  }
  if (tool === 'get_customer' || tool === 'get_campaign' || tool === 'get_campaign_stats' || tool === 'get_segment' || tool === 'get_proposal') {
    return <KeyValueCard data={data?.campaign || data?.customer || data?.segment || data?.proposal || data?.stats || data} />;
  }
  return <RawJsonCard data={data} />;
}

function ToolCallBreadcrumb({ tool, params }) {
  const paramStr = Object.entries(params || {})
    .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(', ');
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
      <Wrench size={11} />
      <code className="font-mono">{tool}({paramStr})</code>
    </div>
  );
}

function PendingActionCard({ action, onApprove, onReject }) {
  const { tool, params, description, status, error } = action;
  const isPending = !status || status === 'pending';
  const paramRows = Object.entries(params || {}).filter(([k]) => k !== 'patch' && k !== 'filterRules');
  return (
    <div className={`border rounded-xl p-3 mt-2 ${isPending ? 'border-amber-300 bg-amber-50' : status === 'approved' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        {isPending ? <AlertTriangle size={14} className="text-amber-600" /> : status === 'approved' ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-gray-500" />}
        <span className="text-xs font-semibold uppercase tracking-wide">
          {isPending ? 'Approval needed' : status === 'approved' ? 'Approved' : 'Rejected'}
        </span>
        <code className="text-[11px] font-mono text-gray-600 ml-auto">{tool}</code>
      </div>
      <p className="text-sm text-gray-800 mb-2">{description}</p>
      {paramRows.length > 0 && (
        <div className="text-[11px] text-gray-600 space-y-0.5 mb-2 bg-white/60 rounded px-2 py-1">
          {paramRows.map(([k, v]) => (
            <div key={k}><span className="font-semibold">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
          ))}
        </div>
      )}
      {isPending && (
        <div className="flex gap-2 mt-2">
          <button onClick={onApprove} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md px-3 py-1.5">
            <Check size={12} /> Approve
          </button>
          <button onClick={onReject} className="flex items-center gap-1 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-md px-3 py-1.5">
            <XCircle size={12} /> Reject
          </button>
        </div>
      )}
      {error && (
        <div className="mt-2 text-[11px] text-red-700 bg-red-50 rounded px-2 py-1">
          Error: {error}
        </div>
      )}
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
  const processedEventsRef = useRef(0);
  const [suggestions] = useState([
    'System status',
    'Top customers by LTV',
    'Recent campaigns',
    'Create a draft campaign for the VIP segment on WhatsApp',
    'What were our top-performing campaigns?',
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

  const handleSuggestion = (text) => setInput(text);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    processedEventsRef.current = 0;

    await startStream(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent/command`,
      { session_id: sessionId, message: msg }
    );
  };

  const ensureAssistantMessage = (prev) => {
    const last = prev[prev.length - 1];
    if (last?.role === 'assistant') return { msgs: prev, idx: prev.length - 1 };
    return {
      msgs: [...prev, { role: 'assistant', content: '', toolCalls: [], toolResults: [], pendingActions: [] }],
      idx: prev.length,
    };
  };

  useEffect(() => {
    if (events.length <= processedEventsRef.current) return;
    const newEvents = events.slice(processedEventsRef.current);
    processedEventsRef.current = events.length;

    for (const ev of newEvents) {
      if (ev.type === 'done') continue;

      if (ev.type === 'error') {
        setMessages(prev => {
          const { msgs, idx } = ensureAssistantMessage(prev);
          const updated = [...msgs];
          updated[idx] = { ...updated[idx], content: `Error: ${ev.message}` };
          return updated;
        });
        continue;
      }

      if (ev.type === 'text') {
        setMessages(prev => {
          const { msgs, idx } = ensureAssistantMessage(prev);
          const updated = [...msgs];
          const cur = updated[idx];
          updated[idx] = { ...cur, content: cur.content ? `${cur.content}\n${ev.content}` : ev.content };
          return updated;
        });
        continue;
      }

      if (ev.type === 'tool_call') {
        setMessages(prev => {
          const { msgs, idx } = ensureAssistantMessage(prev);
          const updated = [...msgs];
          const cur = updated[idx];
          updated[idx] = { ...cur, toolCalls: [...(cur.toolCalls || []), { tool: ev.tool, params: ev.params || {} }] };
          return updated;
        });
        continue;
      }

      if (ev.type === 'tool_result') {
        setMessages(prev => {
          const { msgs, idx } = ensureAssistantMessage(prev);
          const updated = [...msgs];
          const cur = updated[idx];
          updated[idx] = { ...cur, toolResults: [...(cur.toolResults || []), { tool: ev.tool, data: ev.data }] };
          return updated;
        });
        continue;
      }

      if (ev.type === 'pending_action') {
        setMessages(prev => {
          const { msgs, idx } = ensureAssistantMessage(prev);
          const updated = [...msgs];
          const cur = updated[idx];
          const action = {
            tool: ev.tool,
            params: ev.params || {},
            description: ev.description || ev.tool,
            status: 'pending',
          };
          updated[idx] = { ...cur, pendingActions: [...(cur.pendingActions || []), action] };
          return updated;
        });
        continue;
      }

      if (ev.type === 'suggestions') {
        setMessages(prev => {
          const { msgs, idx } = ensureAssistantMessage(prev);
          const updated = [...msgs];
          const cur = updated[idx];
          updated[idx] = { ...cur, suggestions: Array.isArray(ev.items) ? ev.items : [] };
          return updated;
        });
        continue;
      }
    }
  }, [events]);

  const handleApprove = async (msgIdx, actionIdx) => {
    const action = messages[msgIdx]?.pendingActions?.[actionIdx];
    if (!action || action.status !== 'pending') return;
    try {
      const r = await api.post('/api/agent/execute', { tool: action.tool, params: action.params });
      setMessages(prev => {
        const updated = [...prev];
        const msg = { ...updated[msgIdx] };
        const actions = [...msg.pendingActions];
        actions[actionIdx] = {
          ...actions[actionIdx],
          status: r.data?.ok ? 'approved' : 'pending',
          result: r.data?.result,
          error: r.data?.ok ? undefined : (r.data?.error || 'Execute failed'),
        };
        msg.pendingActions = actions;
        updated[msgIdx] = msg;
        return updated;
      });
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        const msg = { ...updated[msgIdx] };
        const actions = [...msg.pendingActions];
        actions[actionIdx] = { ...actions[actionIdx], error: e?.response?.data?.error || e.message };
        msg.pendingActions = actions;
        updated[msgIdx] = msg;
        return updated;
      });
    }
  };

  const handleReject = (msgIdx, actionIdx) => {
    setMessages(prev => {
      const updated = [...prev];
      const msg = { ...updated[msgIdx] };
      const actions = [...msg.pendingActions];
      actions[actionIdx] = { ...actions[actionIdx], status: 'rejected' };
      msg.pendingActions = actions;
      updated[msgIdx] = msg;
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[720px] max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0fd4b4] flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">AI Command Centre</p>
              <p className="text-xs text-gray-500">Full backend access · writes require approval</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 border-b border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">CHANNEL HEALTH</p>
            <p className={`text-sm font-bold ${sysStatus?.channel_service_health === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {sysStatus?.channel_service_health === 'ok' ? 'Healthy' : 'Degraded'}
            </p>
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
                  Hi! I have full access to your CRM. Ask anything — search customers, inspect campaigns, run analytics, or describe an action and I'll set it up for your approval.
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
              <div className={`max-w-[88%] ${msg.role === 'user' ? 'bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none px-4 py-3' : 'bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3'}`}>
                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                {msg.toolCalls?.map((tc, j) => <ToolCallBreadcrumb key={`tc-${j}`} tool={tc.tool} params={tc.params} />)}
                {msg.toolResults?.map((tr, j) => <ToolResultCard key={`tr-${j}`} tool={tr.tool} data={tr.data} />)}
                {msg.pendingActions?.map((pa, j) => (
                  <PendingActionCard
                    key={`pa-${j}`}
                    action={pa}
                    onApprove={() => handleApprove(i, j)}
                    onReject={() => handleReject(i, j)}
                  />
                ))}
                {msg.role === 'assistant' && msg.suggestions?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.suggestions.map((s, k) => (
                      <button
                        key={`sg-${k}`}
                        onClick={() => handleSuggestion(s)}
                        className="text-[11px] border border-gray-300 rounded-full px-3 py-1 text-gray-600 bg-white hover:border-[#0fd4b4] hover:text-[#0fd4b4] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
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
              placeholder="Ask anything about your CRM, or describe an action..."
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
