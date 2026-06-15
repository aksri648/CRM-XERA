import { useState, useEffect, useRef } from 'react';

import {
  Bot, X, Send, CheckCircle, Wrench, AlertTriangle, Check, XCircle, ChevronDown, ChevronRight,
  TrendingUp, BarChart3, Mail, MessageCircle, Smartphone, Radio, Users, Target, Lightbulb,
  ShoppingCart, Activity, Settings as SettingsIcon, FileText,
} from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import api from '../lib/api';
import { formatNumber, formatCurrency } from '../lib/utils';

// ---------- helpers ----------
const stripFences = (s = '') => String(s).replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim();
const pct = (v) => `${(Number(v || 0) * 100).toFixed(1)}%`;
const arr = (v) => (Array.isArray(v) ? v : []);

const channelIcon = (c) => {
  const k = String(c || '').toLowerCase();
  if (k === 'whatsapp') return <MessageCircle size={12} />;
  if (k === 'email') return <Mail size={12} />;
  if (k === 'sms') return <Smartphone size={12} />;
  if (k === 'rcs') return <Radio size={12} />;
  return <Radio size={12} />;
};

const channelColors = {
  whatsapp: 'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-yellow-100 text-yellow-700',
  rcs: 'bg-purple-100 text-purple-700',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-600',
  stopped: 'bg-orange-100 text-orange-600',
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
};

// ---------- card primitives ----------
function CardShell({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
      {(title || Icon) && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
          {Icon && <Icon size={14} className="text-[#0fd4b4]" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{title}</p>
            {subtitle && <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="p-2">{children}</div>
    </div>
  );
}

function MetricTile({ label, value, sub, accent }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold ${accent || 'text-gray-900'} break-all`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function MetricGrid({ items, cols = 2 }) {
  const colsClass = cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : 'grid-cols-2';
  return (
    <div className={`grid ${colsClass} gap-2`}>
      {items.map((it, i) => <MetricTile key={i} {...it} />)}
    </div>
  );
}

function ProgressRow({ label, value, max, suffix, color = 'bg-[#0fd4b4]' }) {
  const ratio = max ? Math.min(100, (Number(value || 0) / Number(max)) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-gray-600 mb-0.5">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{formatNumber(value || 0)}{suffix || ''}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

// ---------- tool-specific cards ----------
function CustomersCard({ data }) {
  const customers = arr(data?.customers || (Array.isArray(data) ? data : []));
  if (!customers.length) return <EmptyHint label="No customers found." />;
  return (
    <CardShell icon={Users} title={`${customers.length} customers`} subtitle={data?.total ? `${formatNumber(data.total)} total` : null}>
      <div className="space-y-1">
        {customers.map((c) => (
          <div key={c._id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{c.email}</p>
            </div>
            <div className="text-right pl-2">
              <p className="text-sm font-bold text-gray-900">{formatCurrency(c.ltv || 0)}</p>
              <p className="text-[11px] text-gray-500">{formatNumber(c.totalOrders || 0)} orders</p>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function CampaignsCard({ data }) {
  const campaigns = arr(data?.campaigns || (Array.isArray(data) ? data : []));
  if (!campaigns.length) return <EmptyHint label="No campaigns found." />;
  return (
    <CardShell icon={Target} title={`${campaigns.length} campaigns`} subtitle={data?.total ? `${formatNumber(data.total)} total` : null}>
      <div className="space-y-1">
        {campaigns.map((c) => (
          <div key={c._id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
              <div className="flex gap-1 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${channelColors[c.channel] || 'bg-gray-100 text-gray-600'}`}>
                  {channelIcon(c.channel)} {c.channel}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
              </div>
            </div>
            <div className="text-right pl-2">
              <p className="text-[11px] text-gray-500">Sent: <span className="text-gray-900 font-medium">{formatNumber(c.stats?.sent || 0)}</span></p>
              <p className="text-[11px] text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function SegmentsCard({ data }) {
  const segments = arr(data?.segments || (Array.isArray(data) ? data : []));
  if (!segments.length) return <EmptyHint label="No segments found." />;
  return (
    <CardShell icon={Users} title={`${segments.length} segments`}>
      <div className="space-y-1">
        {segments.map((s) => (
          <div key={s._id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {arr(s.filterRules).length} rules · {s.logic || 'AND'} · {formatNumber(s.customerCount || 0)} customers
              </p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.createdBy === 'agent' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
              {s.createdBy || 'user'}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function OpportunitiesCard({ data }) {
  const opps = arr(data?.opportunities || (Array.isArray(data) ? data : []));
  if (!opps.length) return <EmptyHint label="No opportunities." />;
  return (
    <CardShell icon={Lightbulb} title={`${opps.length} opportunities`}>
      <div className="space-y-1.5">
        {opps.map((o) => (
          <div key={o._id || o.title} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">{o.title}</p>
              <span className="text-[11px] font-semibold text-emerald-700">{formatCurrency(o.expectedRevenue || o.expected_revenue_inr || 0)}</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">{o.audienceDescription || o.audience_description}</p>
            {(o.recommendedChannel || o.recommended_channel) && (
              <span className={`inline-flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded-full ${channelColors[o.recommendedChannel || o.recommended_channel] || 'bg-gray-100 text-gray-600'}`}>
                {channelIcon(o.recommendedChannel || o.recommended_channel)} {o.recommendedChannel || o.recommended_channel}
              </span>
            )}
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function ProposalsCard({ data }) {
  const proposals = arr(data?.proposals || (Array.isArray(data) ? data : []));
  if (!proposals.length) return <EmptyHint label="No proposals." />;
  return (
    <CardShell icon={FileText} title={`${proposals.length} proposals`}>
      <div className="space-y-1">
        {proposals.map((p) => (
          <div key={p._id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
              <p className="text-[11px] text-gray-500 truncate">{p.channel} · {p.audience || p.segmentName || ''}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function OrdersCard({ data }) {
  const orders = arr(data?.orders || (Array.isArray(data) ? data : []));
  if (!orders.length) return <EmptyHint label="No orders." />;
  return (
    <CardShell icon={ShoppingCart} title={`${orders.length} orders`} subtitle={data?.total ? `${formatNumber(data.total)} total` : null}>
      <div className="space-y-1">
        {orders.slice(0, 20).map((o) => (
          <div key={o._id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{o.orderId || o._id}</p>
              <p className="text-[11px] text-gray-500">{o.orderedAt ? new Date(o.orderedAt).toLocaleDateString() : ''}</p>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(o.amount || 0)}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function AnalyticsOverviewCard({ data }) {
  if (!data) return null;
  return (
    <CardShell icon={TrendingUp} title="Analytics overview">
      <MetricGrid
        cols={2}
        items={[
          { label: 'Customers', value: formatNumber(data.total_customers || 0) },
          { label: 'Active campaigns', value: formatNumber(data.active_campaigns || 0) },
          { label: 'Messages sent', value: formatNumber(data.messages_sent || 0) },
          { label: 'Revenue', value: formatCurrency(data.revenue_attributed || 0), accent: 'text-emerald-700' },
          { label: 'Delivery rate', value: pct(data.delivery_rate) },
          { label: 'Open rate', value: pct(data.open_rate) },
          { label: 'Conversion rate', value: pct(data.conversion_rate) },
        ]}
      />
    </CardShell>
  );
}

function ChannelsCard({ data }) {
  const channels = arr(data);
  if (!channels.length) return <EmptyHint label="No channel data." />;
  return (
    <CardShell icon={BarChart3} title="Channel performance">
      <div className="space-y-2">
        {channels.map((c) => (
          <div key={c.channel} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${channelColors[c.channel] || 'bg-gray-100 text-gray-700'}`}>
                {channelIcon(c.channel)} {c.channel}
              </span>
              <span className="text-[11px] text-gray-500">Sent {formatNumber(c.sent || 0)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div><p className="text-[10px] text-gray-500">Delivery</p><p className="text-xs font-bold text-gray-900">{pct(c.delivery_rate)}</p></div>
              <div><p className="text-[10px] text-gray-500">Open</p><p className="text-xs font-bold text-gray-900">{pct(c.open_rate)}</p></div>
              <div><p className="text-[10px] text-gray-500">Click</p><p className="text-xs font-bold text-gray-900">{pct(c.click_rate)}</p></div>
              <div><p className="text-[10px] text-gray-500">Conv</p><p className="text-xs font-bold text-emerald-700">{pct(c.conversion_rate)}</p></div>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function TopCampaignsCard({ data }) {
  const items = arr(data);
  if (!items.length) return <EmptyHint label="No completed campaigns yet." />;
  return (
    <CardShell icon={TrendingUp} title="Top campaigns by revenue">
      <div className="space-y-1">
        {items.map((c, i) => (
          <div key={`${c.campaign_name}-${i}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{c.campaign_name}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {c.channel}{c.segment_name ? ` · ${c.segment_name}` : ''} · Open {pct(c.open_rate)}
              </p>
            </div>
            <p className="text-sm font-bold text-emerald-700 pl-2">{formatCurrency(c.revenue || 0)}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function FunnelCard({ data }) {
  if (!data) return null;
  const steps = [
    { label: 'Sent', key: 'sent', color: 'bg-blue-500' },
    { label: 'Delivered', key: 'delivered', color: 'bg-indigo-500' },
    { label: 'Opened', key: 'opened', color: 'bg-violet-500' },
    { label: 'Clicked', key: 'clicked', color: 'bg-fuchsia-500' },
    { label: 'Converted', key: 'converted', color: 'bg-emerald-500' },
  ];
  const max = Math.max(...steps.map(s => Number(data[s.key] || 0)), 1);
  return (
    <CardShell icon={BarChart3} title="Marketing funnel">
      <div className="space-y-2">
        {steps.map(s => (
          <ProgressRow key={s.key} label={s.label} value={data[s.key] || 0} max={max} color={s.color} />
        ))}
      </div>
    </CardShell>
  );
}

function PipelineStatusCard({ data }) {
  if (!data) return null;
  const health = data.channel_service_health || data.health;
  return (
    <CardShell icon={Activity} title="Pipeline status">
      <MetricGrid
        cols={2}
        items={[
          { label: 'Channel health', value: health || 'unknown', accent: health === 'ok' ? 'text-emerald-700' : 'text-rose-700' },
          { label: 'Active campaigns', value: formatNumber(data.active_campaigns || 0) },
          { label: 'Queued', value: formatNumber(data.queued || data.in_queue || 0) },
          { label: 'Delivered (24h)', value: formatNumber(data.delivered_24h || data.delivered || 0) },
        ]}
      />
    </CardShell>
  );
}

function DistributionsCard({ data }) {
  if (!data) return null;
  const buckets = (key) => arr(data[key]);
  return (
    <CardShell icon={Users} title="Customer distributions" subtitle={data.totalCustomers ? `${formatNumber(data.totalCustomers)} total` : null}>
      {buckets('ltvDistribution').length > 0 && (
        <div className="mb-2">
          <p className="text-[11px] font-semibold text-gray-600 mb-1">LTV</p>
          {buckets('ltvDistribution').slice(0, 5).map((b, i) => (
            <ProgressRow key={i} label={b.bucket || `Band ${i + 1}`} value={b.count || 0} max={Math.max(...buckets('ltvDistribution').map(x => x.count || 0), 1)} />
          ))}
        </div>
      )}
      {buckets('cityDistribution').length > 0 && (
        <div className="mb-1">
          <p className="text-[11px] font-semibold text-gray-600 mb-1">Top cities</p>
          {buckets('cityDistribution').slice(0, 5).map((b, i) => (
            <div key={i} className="flex justify-between text-[11px] py-0.5">
              <span className="text-gray-700">{b._id || '—'}</span>
              <span className="tabular-nums text-gray-900 font-medium">{formatNumber(b.count || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function SettingsCard({ data }) {
  if (!data) return null;
  const entries = [
    ['Platform', data.platformName],
    ['Timezone', data.timezone],
    ['Currency', data.currency],
    ['AI model', data.aiModel],
    ['Scan schedule', data.scanSchedule],
    ['Auto-approve', data.autoApprove ? 'On' : 'Off'],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '');
  return (
    <CardShell icon={SettingsIcon} title="Settings">
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([k, v]) => <MetricTile key={k} label={k} value={String(v)} />)}
      </div>
    </CardShell>
  );
}

function CampaignDetailCard({ data }) {
  const c = data?.campaign || data;
  if (!c?.name) return <RawJsonCard data={data} />;
  return (
    <CardShell icon={Target} title={c.name} subtitle={`${c.channel || ''} · ${c.status || ''}`}>
      {c.messageTemplate && (
        <div className="bg-gray-50 rounded-lg p-2 mb-2 border border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Message</p>
          <p className="text-xs text-gray-800 whitespace-pre-wrap">{c.messageTemplate}</p>
        </div>
      )}
      <MetricGrid
        cols={3}
        items={[
          { label: 'Sent', value: formatNumber(c.stats?.sent || 0) },
          { label: 'Delivered', value: formatNumber(c.stats?.delivered || 0) },
          { label: 'Opened', value: formatNumber(c.stats?.opened || 0) },
          { label: 'Clicked', value: formatNumber(c.stats?.clicked || 0) },
          { label: 'Converted', value: formatNumber(c.stats?.converted || 0) },
          { label: 'Revenue', value: formatCurrency(c.stats?.revenue || 0), accent: 'text-emerald-700' },
        ]}
      />
    </CardShell>
  );
}

function CustomerDetailCard({ data }) {
  const c = data?.customer || data;
  if (!c?.name) return <RawJsonCard data={data} />;
  return (
    <CardShell icon={Users} title={c.name} subtitle={c.email}>
      <MetricGrid
        cols={3}
        items={[
          { label: 'LTV', value: formatCurrency(c.ltv || 0), accent: 'text-emerald-700' },
          { label: 'Orders', value: formatNumber(c.totalOrders || 0) },
          { label: 'City', value: c.city || '—' },
        ]}
      />
    </CardShell>
  );
}

function SegmentDetailCard({ data }) {
  const s = data?.segment || data;
  if (!s?.name) return <RawJsonCard data={data} />;
  return (
    <CardShell icon={Users} title={s.name} subtitle={s.description}>
      <div className="bg-gray-50 rounded-lg p-2 mb-2 border border-gray-100">
        <p className="text-[10px] text-gray-500 uppercase mb-1">Rules ({s.logic || 'AND'})</p>
        <div className="space-y-0.5">
          {arr(s.filterRules).map((r, i) => (
            <code key={i} className="block text-[11px] text-gray-800 font-mono">
              {r.field} {r.operator} {typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value)}
            </code>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-gray-500">{formatNumber(s.customerCount || 0)} customers match</p>
    </CardShell>
  );
}

function EmptyHint({ label }) {
  return <div className="mt-2 text-[11px] text-gray-500 italic px-2">{label}</div>;
}

function RawJsonCard({ data }) {
  return (
    <CardShell title="Raw result">
      <pre className="text-[11px] text-gray-700 overflow-x-auto max-h-48 font-mono">{JSON.stringify(data, null, 2)}</pre>
    </CardShell>
  );
}

function ToolResultCard({ tool, data }) {
  if (data && typeof data === 'object' && data.error) {
    return (
      <div className="mt-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-[11px] text-rose-700">
        <span className="font-semibold">{tool} failed:</span> {String(data.error)}
      </div>
    );
  }
  switch (tool) {
    case 'list_customers':
    case 'get_segment_customers':
      return <CustomersCard data={data} />;
    case 'list_campaigns':
      return <CampaignsCard data={data} />;
    case 'list_segments':
      return <SegmentsCard data={data} />;
    case 'list_opportunities':
      return <OpportunitiesCard data={data} />;
    case 'list_proposals':
      return <ProposalsCard data={data} />;
    case 'list_orders':
      return <OrdersCard data={data} />;
    case 'get_analytics_overview':
      return <AnalyticsOverviewCard data={data} />;
    case 'get_channels_analytics':
      return <ChannelsCard data={data} />;
    case 'get_top_campaigns':
      return <TopCampaignsCard data={data} />;
    case 'get_funnel':
      return <FunnelCard data={data} />;
    case 'get_pipeline_status':
      return <PipelineStatusCard data={data} />;
    case 'get_customer_distributions':
      return <DistributionsCard data={data} />;
    case 'get_settings':
      return <SettingsCard data={data} />;
    case 'get_campaign':
    case 'get_campaign_stats':
      return <CampaignDetailCard data={data} />;
    case 'get_customer':
      return <CustomerDetailCard data={data} />;
    case 'get_segment':
      return <SegmentDetailCard data={data} />;
    case 'get_proposal':
      return <CardShell icon={FileText} title="Proposal"><RawJsonCard data={data?.proposal || data} /></CardShell>;
    case 'preview_segment':
      return (
        <CardShell icon={Users} title="Segment preview">
          <MetricTile label="Matching customers" value={formatNumber(data?.count || data?.total || 0)} />
        </CardShell>
      );
    default:
      return <RawJsonCard data={data} />;
  }
}

function paramSummary(params) {
  return Object.entries(params || {})
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(', ');
}

function ActivityTimeline({ calls, results }) {
  const [open, setOpen] = useState(false);
  const count = calls.length;
  if (count === 0) return null;
  const finishedCount = results.length;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 text-[11px] text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Wrench size={11} />
        <span className="font-medium">
          {finishedCount === count ? `Used ${count} tool${count === 1 ? '' : 's'}` : `Working… (${finishedCount}/${count})`}
        </span>
      </button>
      {open && (
        <div className="mt-1 pl-2 border-l-2 border-gray-100 space-y-1">
          {calls.map((tc, i) => (
            <div key={i} className="text-[11px] text-gray-600">
              <code className="font-mono text-gray-800">{tc.tool}</code>
              <span className="text-gray-400">({paramSummary(tc.params)})</span>
            </div>
          ))}
        </div>
      )}
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

// ---------- main component ----------
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
    'Show analytics overview',
    'Show channel performance',
    'Create a draft campaign for the VIP segment on WhatsApp',
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
      msgs: [...prev, { role: 'assistant', content: '', toolCalls: [], toolResults: [], pendingActions: [], error: null }],
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
          updated[idx] = { ...updated[idx], error: ev.message || 'Something went wrong.' };
          return updated;
        });
        continue;
      }

      if (ev.type === 'text') {
        setMessages(prev => {
          const { msgs, idx } = ensureAssistantMessage(prev);
          const updated = [...msgs];
          const cur = updated[idx];
          const clean = stripFences(ev.content || '');
          updated[idx] = { ...cur, content: cur.content ? `${cur.content}\n${clean}` : clean };
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
      <div className="bg-white rounded-2xl shadow-2xl w-[760px] max-h-[88vh] flex flex-col">
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
          {messages.map((msg, i) => {
            const isAssistant = msg.role === 'assistant';
            const hasAnyContent = msg.content || msg.toolResults?.length || msg.pendingActions?.length || msg.error;
            return (
              <div key={i} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={
                    isAssistant
                      ? 'max-w-[92%] bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3'
                      : 'max-w-[88%] bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none px-4 py-3'
                  }
                >
                  {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                  {isAssistant && !hasAnyContent && (
                    <p className="text-sm text-gray-500 italic">Thinking…</p>
                  )}
                  {isAssistant && msg.error && (
                    <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                      Error: {msg.error}
                    </div>
                  )}
                  {isAssistant && (
                    <ActivityTimeline calls={msg.toolCalls || []} results={msg.toolResults || []} />
                  )}
                  {isAssistant && msg.toolResults?.map((tr, j) => (
                    <ToolResultCard key={`tr-${j}`} tool={tr.tool} data={tr.data} />
                  ))}
                  {isAssistant && msg.pendingActions?.map((pa, j) => (
                    <PendingActionCard
                      key={`pa-${j}`}
                      action={pa}
                      onApprove={() => handleApprove(i, j)}
                      onReject={() => handleReject(i, j)}
                    />
                  ))}
                  {isAssistant && msg.suggestions?.length > 0 && (
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
            );
          })}
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
