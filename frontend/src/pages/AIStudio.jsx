import { useState, useRef, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "src/components/ui/dialog";
import { cn } from '../lib/utils';
import { Textarea } from "src/components/ui/textarea";
import { useSSE } from '../hooks/useSSE';
import AgentResponseRenderer from '../components/AgentResponseRenderer';
import api from '../lib/api';

const suggestionPills = [
  'Active Buyers', 'At risk of losing buyers', 'VIP', 'New Buyers', 'Value Buyers',
];

const EMPTY_FORM = { name: '', segmentId: '', channel: 'whatsapp', messageTemplate: '', category: '' };

const PRODUCT_CATEGORIES = [
  'Fashion', 'Beauty & Personal Care', 'Electronics', 'Home & Kitchen',
  'Health & Wellness', 'Sports & Fitness', 'Books & Stationery',
  'Toys & Games', 'Groceries', 'Jewelry & Accessories',
];

const DEFAULT_SEGMENTS = [
  { name: 'Active Buyers', createdBy: 'agent', filterRules: [{ field: 'totalOrders', operator: 'gte', value: 3 }], logic: 'AND' },
  { name: 'Value Buyers', createdBy: 'agent', filterRules: [{ field: 'ltv', operator: 'gte', value: 1000 }, { field: 'totalOrders', operator: 'lt', value: 5 }], logic: 'AND' },
  { name: 'High Risk of Leaving', createdBy: 'agent', filterRules: [{ field: 'last_order_days', operator: 'gt', value: 60 }, { field: 'ltv', operator: 'gt', value: 0 }], logic: 'AND' },
  { name: 'VIP', createdBy: 'agent', filterRules: [{ field: 'ltv', operator: 'gte', value: 10000 }], logic: 'AND' },
];

export default function AIStudio() {
  const navigate = useNavigate();

  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const { events, isStreaming, startStream, clearEvents } = useSSE();
  const chatEndRef = useRef(null);

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState(EMPTY_FORM);
  const [segments, setSegments] = useState([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);

  useEffect(() => {
    api.get('/api/segments').then(r => {
      const all = r.data.segments || r.data;
      const seen = new Set();
      setSegments(all.filter(s => { if (seen.has(s.name)) return false; seen.add(s.name); return true; }));
      setSegmentsLoading(false);
    }).catch(() => setSegmentsLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, events]);

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInput('');
    if (!hasStarted) setHasStarted(true);

    await startStream(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent/chat`,
      { session_id: sessionId, message }
    );
  };

  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.type === 'text') {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...lastMsg, content: lastEvent.content };
            return updated;
          }
          return [...prev, { role: 'assistant', content: lastEvent.content, structuredEvents: [] }];
        });
      } else {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              structuredEvents: [...(lastMsg.structuredEvents || []), lastEvent],
            };
            return updated;
          }
          return [...prev, { role: 'assistant', content: '', structuredEvents: [lastEvent] }];
        });
      }
    }
  }, [events]);

  const handleLaunch = async (details) => {
    const title = details?.['Campaign Title'] || details?.campaign_title || 'AI Campaign';
    const targetAudience = details?.['Target Audience'] || details?.target_audience || '';
    const description = details?.['Description'] || details?.description || '';
    const productCategory = details?.['ProductCategory'] || details?.product_category || '';
    try {
      await api.post('/api/proposals', {
        title,
        segmentId: null,
        channel: 'whatsapp',
        messageTemplate: description,
        aiReasoning: `Target audience: ${targetAudience}. Product category: ${productCategory}`,
      });
      toast.success('Campaign proposal sent to Agent Proposals!');
      navigate('/proposals');
    } catch (err) {
      toast.error('Failed to create proposal: ' + (err?.response?.data?.error || err?.message));
    }
  };

  const handleEdit = (details) => {
    const title = details?.['Campaign Title'] || details?.campaign_title || '';
    const description = details?.['Description'] || details?.description || '';
    const productCategory = details?.['ProductCategory'] || details?.product_category || '';
    setCampaignForm({
      name: title,
      segmentId: '',
      channel: 'whatsapp',
      messageTemplate: description,
      category: productCategory,
    });
    setShowCampaignModal(true);
  };

  const handleCampaignSubmit = async (launchNow) => {
    if (!campaignForm.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    try {
      const res = await api.post('/api/campaigns', { ...campaignForm, createdBy: 'agent' });
      const campaignId = res.data.campaign?._id || res.data?._id;
      if (launchNow && campaignId) {
        await api.post(`/api/campaigns/${campaignId}/launch`);
        toast.success('Campaign launched!');
      } else {
        toast.success('Campaign saved as draft');
      }
      setShowCampaignModal(false);
      setCampaignForm(EMPTY_FORM);
      navigate('/campaigns');
    } catch (err) {
      toast.error('Failed to save campaign: ' + (err?.response?.data?.error || err?.message));
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Sparkles size={64} className="text-[#0fd4b4] animate-pulse" />
        <h2 className="text-xl font-bold text-gray-900">What marketing goal would you like to achieve?</h2>
        <p className="text-gray-500 text-sm max-w-lg text-center">
          Describe your objective and Xeno AI will generate a complete campaign strategy including audience, channels, messaging, and A/B tests.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {suggestionPills.map(pill => (
            <button
              key={pill}
              onClick={() => handleSend(`Create a marketing campaign targeting the "${pill}" customer segment.`)}
              className="border border-[#0fd4b4] text-[#0fd4b4] rounded-full px-4 py-2 text-sm hover:bg-[#0fd4b4] hover:text-white transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>
        <div className="w-full max-w-2xl mt-8">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your marketing goal..."
              className="flex-1"
            />
            <Button onClick={() => handleSend()} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Campaign Studio</h1>
        <p className="text-sm text-gray-500">Describe your marketing goal and let AI build the campaign</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-[#0fd4b4]'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} className="text-white" />}
              </div>
              <div>
                <div className={`px-4 py-3 ${msg.role === 'user' ? 'bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.structuredEvents && msg.structuredEvents.length > 0 && (
                  <div className="mt-2">
                    <AgentResponseRenderer
                      events={msg.structuredEvents}
                      onLaunch={handleLaunch}
                      onEdit={handleEdit}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-[#0fd4b4] flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
            placeholder="Describe your marketing goal..."
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            onClick={() => handleSend()}
            disabled={isStreaming}
            className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white"
          >
            {isStreaming ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </div>

      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent className="sm:max-w-[480px]" style={{ zIndex: 100 }}>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={campaignForm.name}
              onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
              placeholder="Campaign Name"
            />
            <select
              value={campaignForm.segmentId || ''}
              onChange={e => setCampaignForm({ ...campaignForm, segmentId: e.target.value })}
              disabled={segmentsLoading}
              className={cn(
                "w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm",
                "focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !campaignForm.segmentId && "text-slate-500"
              )}
            >
              <option value="">{segmentsLoading ? 'Loading segments...' : 'Select Segment'}</option>
              {segments.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              {['whatsapp', 'sms', 'email', 'rcs'].map(ch => (
                <button
                  key={ch}
                  onClick={() => setCampaignForm({ ...campaignForm, channel: ch })}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    campaignForm.channel === ch
                      ? 'bg-[#0fd4b4] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
            <select
              value={campaignForm.category || ''}
              onChange={e => setCampaignForm({ ...campaignForm, category: e.target.value })}
              className={cn(
                "w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm",
                "focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
                !campaignForm.category && "text-slate-500"
              )}
            >
              <option value="">Select Product Category</option>
              {PRODUCT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Textarea
              value={campaignForm.messageTemplate}
              onChange={e => setCampaignForm({ ...campaignForm, messageTemplate: e.target.value })}
              placeholder="Message template... Use {name} for personalization"
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleCampaignSubmit(false)}>Save as Draft</Button>
            <Button onClick={() => handleCampaignSubmit(true)} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">
              Launch Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}