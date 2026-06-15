import { Sparkles, TrendingUp, AlertCircle, CheckCircle, XCircle, Lightbulb, Bot, Target, Package, Megaphone, Quote, MessageCircle, Mail, Smartphone, Radio, Instagram, Bell, Clock, Tag, Users, Brain, Edit3, Rocket } from 'lucide-react';

function ChannelBadge({ channel }) {
  const colors = { whatsapp: 'bg-green-100 text-green-700', email: 'bg-blue-100 text-blue-700', sms: 'bg-yellow-100 text-yellow-700', rcs: 'bg-purple-100 text-purple-700', instagram: 'bg-pink-100 text-pink-700', push: 'bg-orange-100 text-orange-700' };
  return <span className={`text-xs px-2 py-1 rounded-full ${colors[channel] || 'bg-gray-100 text-gray-700'}`}>{channel}</span>;
}

const channelIconFor = (c) => {
  const k = String(c || '').toLowerCase();
  if (k === 'whatsapp') return <MessageCircle size={12} />;
  if (k === 'email') return <Mail size={12} />;
  if (k === 'sms') return <Smartphone size={12} />;
  if (k === 'rcs') return <Radio size={12} />;
  if (k === 'instagram') return <Instagram size={12} />;
  if (k === 'push') return <Bell size={12} />;
  return <Radio size={12} />;
};

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

function CampaignDetailsCard({ data, onLaunch, onEdit }) {
  const details = data?.CampaignDetails || data?.campaign_details || data || {};
  const title = details['Campaign Title'] || details.campaign_title || 'Untitled Campaign';
  const audience = details['Target Audience'] || details.target_audience || '—';
  const description = details['Description'] || details.description || '';
  const category = details['ProductCategory'] || details.product_category || '—';
  const tagline = details['Tagline'] || details.tagline || '';
  const persona = details['AudiencePersona'] || details.audience_persona || '';
  const channel = (details['RecommendedChannel'] || details.recommended_channel || '').toLowerCase();
  const tone = details['Tone'] || details.tone || '';
  const catchphrases = details['Catchphrases'] || details.catchphrases || [];
  const variants = details['MessageVariants'] || details.message_variants || [];
  const cta = details['CTA'] || details.cta || '';
  const sendTime = details['SendTimeSuggestion'] || details.send_time_suggestion || '';
  const tokens = details['PersonalizationTokens'] || details.personalization_tokens || [];
  const kpis = details['KPIs'] || details.kpis || [];
  const confidence = Number(details['ConfidenceScore'] ?? details.confidence_score ?? 0);
  const reasoning = details['AIReasoning'] || details.ai_reasoning || '';

  const audienceColors = {
    'Active Buyers': 'bg-green-100 text-green-700 border-green-200',
    'At risk of losing buyers': 'bg-red-100 text-red-700 border-red-200',
    'VIP': 'bg-purple-100 text-purple-700 border-purple-200',
    'New Buyers': 'bg-blue-100 text-blue-700 border-blue-200',
    'Value Buyers': 'bg-amber-100 text-amber-700 border-amber-200',
  };
  const audienceClass = audienceColors[audience] || 'bg-teal-100 text-teal-700 border-teal-200';

  return (
    <div className="border border-[#0fd4b4]/40 rounded-2xl bg-gradient-to-br from-teal-50/40 to-white shadow-sm overflow-hidden mt-2">
      <div className="px-5 py-3 border-b border-gray-100 bg-white/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-[#0fd4b4]" />
          <span className="text-xs font-semibold text-[#0fd4b4] uppercase tracking-wide">Campaign Blueprint</span>
        </div>
        {confidence > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase">Confidence</span>
            <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#0fd4b4]" style={{ width: `${Math.min(100, confidence * 100)}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-gray-700 tabular-nums">{Math.round(confidence * 100)}%</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
          {tagline && (
            <p className="text-sm italic text-[#0bbfa1] mt-1 flex items-start gap-1.5">
              <Quote size={14} className="mt-0.5 flex-shrink-0" /> {tagline}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-gray-100">
            <Target size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Target Audience</p>
              <span className={`mt-1 inline-block text-xs font-medium px-2 py-1 rounded-full border ${audienceClass}`}>
                {audience}
              </span>
              {persona && <p className="text-[11px] text-gray-600 mt-1.5 leading-snug">{persona}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-gray-100">
            <Package size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Product Category</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{category}</p>
              {tone && (
                <p className="text-[11px] text-gray-600 mt-1.5">
                  <span className="text-gray-500">Tone:</span> {tone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {channel && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-gray-100">
              <div className="text-gray-500 mt-0.5">{channelIconFor(channel)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Channel</p>
                <span className="mt-1 inline-block"><ChannelBadge channel={channel} /></span>
              </div>
            </div>
          )}
          {sendTime && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-gray-100">
              <Clock size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Send Time</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{sendTime}</p>
              </div>
            </div>
          )}
          {cta && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-gray-100">
              <Rocket size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Primary CTA</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{cta}</p>
              </div>
            </div>
          )}
        </div>

        {description && (
          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Strategy</p>
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}

        {catchphrases.length > 0 && (
          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#0fd4b4]" /> Suggested Catchphrases
            </p>
            <div className="flex flex-wrap gap-1.5">
              {catchphrases.map((p, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {variants.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2 px-1">Message Variants</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variants.slice(0, 2).map((v, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-gray-100 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-gray-700">{v.label || `Variant ${i === 0 ? 'A' : 'B'}`}</span>
                    {channel && <ChannelBadge channel={channel} />}
                  </div>
                  {v.subject && (
                    <p className="text-[11px] mb-1.5">
                      <span className="text-gray-500 font-semibold">Subject: </span>
                      <span className="text-gray-900">{v.subject}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed flex-1">{v.body || v.message || ''}</p>
                  {v.cta && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-500 uppercase">CTA</span>
                      <p className="text-xs font-semibold text-[#0bbfa1] mt-0.5">{v.cta}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tokens.length > 0 && (
            <div className="p-3 rounded-xl bg-white border border-gray-100">
              <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <Tag size={12} className="text-[#0fd4b4]" /> Personalization
              </p>
              <div className="flex flex-wrap gap-1">
                {tokens.map((t, i) => (
                  <code key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">{`{${t}}`}</code>
                ))}
              </div>
            </div>
          )}
          {kpis.length > 0 && (
            <div className="p-3 rounded-xl bg-white border border-gray-100">
              <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-[#0fd4b4]" /> Success KPIs
              </p>
              <ul className="space-y-0.5">
                {kpis.map((k, i) => (
                  <li key={i} className="text-[11px] text-gray-700 flex items-start gap-1.5">
                    <CheckCircle size={10} className="text-[#0fd4b4] mt-0.5 flex-shrink-0" /> {k}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {reasoning && (
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
              <Brain size={12} className="text-gray-500" /> AI Reasoning
            </p>
            <p className="text-[12px] text-gray-700 leading-relaxed italic">{reasoning}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onLaunch?.(details)}
            className="flex items-center gap-1.5 bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Rocket size={14} /> Send to Proposals
          </button>
          <button
            onClick={() => onEdit?.(details)}
            className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm transition-colors"
          >
            <Edit3 size={14} /> Edit & Save
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

export default function AgentResponseRenderer({ events = [], onLaunch, onEdit }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="space-y-2">
      {events.map((event, i) => {
        switch (event.type) {
          case 'text': return <TextBubble key={i} content={event.content} />;
          case 'segment_proposal': return <SegmentProposalCard key={i} data={event.data} />;
          case 'message_proposal': return <MessageProposalCard key={i} data={event.data} />;
          case 'campaign_proposal': return <CampaignProposalCard key={i} data={event.data} />;
          case 'campaign_details': return <CampaignDetailsCard key={i} data={event.data} onLaunch={onLaunch} onEdit={onEdit} />;
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
