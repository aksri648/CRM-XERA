import { Sparkles, TrendingUp, AlertCircle, CheckCircle, XCircle, Lightbulb, Bot, Target, Package, Megaphone } from 'lucide-react';

function ChannelBadge({ channel }) {
  const colors = { whatsapp: 'bg-green-100 text-green-700', email: 'bg-blue-100 text-blue-700', sms: 'bg-yellow-100 text-yellow-700', rcs: 'bg-purple-100 text-purple-700' };
  return <span className={`text-xs px-2 py-1 rounded-full ${colors[channel] || 'bg-gray-100 text-gray-700'}`}>{channel}</span>;
}

function TextBubble({ content }) {
  return <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>;
}

function SegmentProposalCard({ data }) {
  return (
    <div className="border border-[#0fd4b4] rounded-xl p-4 bg-teal-50/30 mt-2">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-[#0fd4b4] uppercase">Proposed Segment</span>
          <h3 className="font-semibold text-gray-900 mt-1">{data.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{data.description}</p>
          <p className="text-xs text-gray-500 mt-2">Rules: {data.filter_rules_summary}</p>
        </div>
        <span className="bg-teal-100 text-teal-700 rounded-full px-3 py-1 text-sm font-medium">{data.estimated_count} customers</span>
      </div>
      <button className="mt-3 bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">Use This Segment</button>
    </div>
  );
}

function MessageProposalCard({ data }) {
  const variants = [data.variant_a, data.variant_b].filter(Boolean);
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white mt-2">
      <span className="text-xs font-semibold text-gray-500 uppercase">Message Variants</span>
      <div className="grid grid-cols-2 gap-3 mt-3">
        {variants.map((variant, i) => (
          <div key={i} className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold">Variant {i === 0 ? 'A' : 'B'}</span>
              <ChannelBadge channel={data.channel} />
            </div>
            <p className="text-sm text-gray-700">{variant.message}</p>
            <button className="mt-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-1.5 text-xs w-full transition-colors">Use This</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignDetailsCard({ data }) {
  const details = data?.CampaignDetails || data?.campaign_details || data || {};
  const title = details['Campaign Title'] || details.campaign_title || 'Untitled Campaign';
  const audience = details['Target Audience'] || details.target_audience || '—';
  const description = details['Description'] || details.description || '';
  const category = details['ProductCategory'] || details.product_category || '—';

  const audienceColors = {
    'Active Buyers': 'bg-green-100 text-green-700 border-green-200',
    'At risk of losing buyers': 'bg-red-100 text-red-700 border-red-200',
    'VIP': 'bg-purple-100 text-purple-700 border-purple-200',
    'New Buyers': 'bg-blue-100 text-blue-700 border-blue-200',
    'Value Buyers': 'bg-amber-100 text-amber-700 border-amber-200',
  };
  const audienceClass = audienceColors[audience] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="border border-[#0fd4b4]/40 rounded-2xl bg-gradient-to-br from-teal-50/40 to-white shadow-sm overflow-hidden mt-2">
      <div className="px-5 py-3 border-b border-gray-100 bg-white/60 flex items-center gap-2">
        <Megaphone size={16} className="text-[#0fd4b4]" />
        <span className="text-xs font-semibold text-[#0fd4b4] uppercase tracking-wide">Campaign Plan</span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-gray-100">
            <Target size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Target Audience</p>
              <span className={`mt-1 inline-block text-xs font-medium px-2 py-1 rounded-full border ${audienceClass}`}>
                {audience}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-gray-100">
            <Package size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Product Category</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{category}</p>
            </div>
          </div>
        </div>
        {description && (
          <div className="mt-4 p-3 rounded-xl bg-white border border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Strategy</p>
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Launch Campaign
          </button>
          <button className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignProposalCard({ data }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white mt-2">
      <span className="text-xs font-semibold text-gray-500 uppercase">Campaign Proposal</span>
      <h3 className="font-semibold text-gray-900 mt-1">{data.campaign_manifest?.name || 'Campaign'}</h3>
      <div className="flex gap-2 mt-2">
        <ChannelBadge channel={data.campaign_manifest?.channel} />
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Audience: {data.estimated_audience}</span>
      </div>
      {data.confidence_score && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Confidence</span><span>{(data.confidence_score * 100).toFixed(0)}%</span></div>
          <div className="h-2 bg-gray-200 rounded-full"><div className="h-2 bg-[#0fd4b4] rounded-full" style={{ width: `${data.confidence_score * 100}%` }} /></div>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">Launch Campaign</button>
        <button className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm transition-colors">Edit</button>
      </div>
    </div>
  );
}

function InsightReportCard({ data }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white mt-2">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={18} className="text-[#0fd4b4]" />
        <span className="text-xs font-semibold text-gray-500 uppercase">Insight Report</span>
      </div>
      <p className="text-sm text-gray-700">{data.summary}</p>
      {data.metrics && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {data.metrics.slice(0, 6).map((m, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">{m.label || m.metric}</p>
              <p className="text-lg font-bold text-gray-900">{m.value}</p>
              {m.status && (
                <span className={`text-xs ${m.status === 'above' ? 'text-green-600' : m.status === 'below' ? 'text-red-600' : 'text-gray-500'}`}>
                  {m.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {data.recommendations && (
        <div className="mt-3 space-y-2">
          {data.recommendations.map((r, i) => (
            <div key={i} className="border-l-2 border-[#0fd4b4] pl-3">
              <p className="text-sm font-medium text-gray-900">{r.title}</p>
              <p className="text-xs text-gray-500">{r.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunityListCard({ data }) {
  const opportunities = data.opportunities || [];
  return (
    <div className="space-y-2 mt-2">
      {opportunities.map((opp, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-start gap-3">
            <Lightbulb size={18} className="text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{opp.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{opp.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{opp.audience_description}</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">₹{opp.expected_revenue_inr?.toLocaleString('en-IN')}</span>
              </div>
              <button className="mt-2 bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">Generate Campaign</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
      <AlertCircle size={20} className="text-red-500" />
      <p className="text-sm text-red-700">{message || 'An error occurred'}</p>
    </div>
  );
}

function ConfirmationCard({ data, onConfirm, onReject }) {
  return (
    <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={18} className="text-yellow-600" />
        <span className="text-xs font-semibold text-yellow-700 uppercase">Confirmation Required</span>
      </div>
      <p className="text-sm text-gray-700">{data?.message || 'Please confirm this action:'}</p>
      <div className="flex gap-2 mt-3">
        <button onClick={onConfirm} className="flex items-center gap-1 bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          <CheckCircle size={16} /> Confirm
        </button>
        <button onClick={onReject} className="flex items-center gap-1 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm transition-colors">
          <XCircle size={16} /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function AgentResponseRenderer({ events = [] }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="space-y-2">
      {events.map((event, i) => {
        switch (event.type) {
          case 'text': return <TextBubble key={i} content={event.content} />;
          case 'segment_proposal': return <SegmentProposalCard key={i} data={event.data} />;
          case 'message_proposal': return <MessageProposalCard key={i} data={event.data} />;
          case 'campaign_proposal': return <CampaignProposalCard key={i} data={event.data} />;
          case 'campaign_details': return <CampaignDetailsCard key={i} data={event.data} />;
          case 'insight_report': return <InsightReportCard key={i} data={event.data} />;
          case 'opportunity_list': return <OpportunityListCard key={i} data={event.data} />;
          case 'error': return <ErrorCard key={i} message={event.message} />;
          case 'confirmation_required': return <ConfirmationCard key={i} data={event.data} onConfirm={event.onConfirm || (() => {})} onReject={event.onReject || (() => {})} />;
          default: return null;
        }
      })}
    </div>
  );
}
