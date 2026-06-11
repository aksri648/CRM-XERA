import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Send, CheckCircle, Eye, MousePointerClick, TrendingUp, DollarSign } from 'lucide-react';
import api from '../lib/api';
import { formatNumber, formatCurrency, relativeTime } from '../lib/utils';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'src/components/ui/select';
import { Textarea } from 'src/components/ui/textarea';
import { Skeleton } from 'src/components/ui/skeleton';

const channelBadges = { whatsapp: 'bg-green-100 text-green-700', email: 'bg-blue-100 text-blue-700', sms: 'bg-yellow-100 text-yellow-700', rcs: 'bg-purple-100 text-purple-700' };
const statusBadges = { draft: 'bg-gray-100 text-gray-600', running: 'bg-blue-100 text-blue-600 animate-pulse', completed: 'bg-green-100 text-green-700' };

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', segmentId: '', channel: 'whatsapp', messageTemplate: '' });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    api.get('/api/segments').then(r => setSegments(r.data.segments || r.data)).catch(() => {});
  }, []);

  const handleCreate = async (launchNow) => {
    try {
      const res = await api.post('/api/campaigns', form);
      if (launchNow) await api.post(`/api/campaigns/${res.data.campaign?._id || res.data._id}/launch`);
      setShowModal(false);
      setForm({ name: '', segmentId: '', channel: 'whatsapp', messageTemplate: '' });
      fetchCampaigns();
    } catch (e) {}
  };

  const handleCardClick = async (c) => {
    setSelectedCampaign(c);
    setCampaignStats(null);
    setDetailLoading(true);
    try {
      const [campaignRes, statsRes] = await Promise.all([
        api.get(`/api/campaigns/${c._id}`),
        api.get(`/api/campaigns/${c._id}/stats`),
      ]);
      setSelectedCampaign(campaignRes.data.campaign || campaignRes.data);
      setCampaignStats(statsRes.data.stats || statsRes.data || {});
    } catch (e) {}
    setDetailLoading(false);
  };

  const handleLaunch = async (id) => {
    try {
      await api.post(`/api/campaigns/${id}/launch`);
      const campaignRes = await api.get(`/api/campaigns/${id}`);
      setSelectedCampaign(campaignRes.data.campaign || campaignRes.data);
      fetchCampaigns();
    } catch (e) {}
  };

  const fetchCampaigns = () => {
    api.get('/api/campaigns?sort=-createdAt').then(r => { setCampaigns(r.data.campaigns || r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );

  return (
    <div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-gray-900">Campaigns</h1><p className="text-sm text-gray-500 mt-1">Manage your marketing campaigns</p></div>
          <DialogTrigger asChild>
            <Button className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white"><Plus size={16} /> Create Campaign</Button>
          </DialogTrigger>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {campaigns.length === 0 ? (
            <Card className="text-center py-20">
              <CardContent className="p-0">
                <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No campaigns yet. Create your first campaign!</p>
              </CardContent>
            </Card>
          ) : campaigns.map(c => (
            <Card key={c._id} onClick={() => handleCardClick(c)} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{c.createdBy === 'agent' ? 'AI: ' : ''}{c.name}</h3>
                    <Badge className={`${statusBadges[c.status] || ''} border-0`}>{c.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`${channelBadges[c.channel] || 'bg-gray-100 text-gray-700'} border-0`}>{c.channel}</Badge>
                    <Badge className="bg-gray-100 text-gray-700 border-0">{c.segmentId?.name || 'Segment'}</Badge>
                  </div>
                </div>
                <div className="flex gap-6 mt-3 text-sm">
                  <span className="text-gray-500">Sent: <strong>{formatNumber(c.stats?.sent || 0)}</strong></span>
                  <span className="text-gray-500">Delivered: <strong>{formatNumber(c.stats?.delivered || 0)}</strong></span>
                  <span className="text-gray-500">Opened: <strong>{formatNumber(c.stats?.opened || 0)}</strong></span>
                  <span className="text-gray-500">Clicked: <strong>{formatNumber(c.stats?.clicked || 0)}</strong></span>
                  <span className="text-gray-500">Conv: <strong>{formatNumber(c.stats?.converted || 0)}</strong></span>
                  <span className="text-gray-500">Rev: <strong>{formatCurrency(c.stats?.revenue || 0)}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Campaign Name" />
            <Select value={form.segmentId || undefined} onValueChange={val => setForm({...form, segmentId: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select Segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              {['whatsapp', 'sms', 'email', 'rcs'].map(ch => (
                <button key={ch} onClick={() => setForm({...form, channel: ch})} className={`px-4 py-2 text-sm rounded-lg transition-colors ${form.channel === ch ? 'bg-[#0fd4b4] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{ch}</button>
              ))}
            </div>
            <Textarea value={form.messageTemplate} onChange={e => setForm({...form, messageTemplate: e.target.value})} placeholder="Message template... Use {name} and {brand} for personalization" rows={4} className="resize-none" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleCreate(false)}>Save as Draft</Button>
            <Button onClick={() => handleCreate(true)} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">Launch Now</Button>
          </div>
        </DialogContent>

        <Dialog open={!!selectedCampaign} onOpenChange={v => !v && setSelectedCampaign(null)}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedCampaign && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedCampaign.name}
                    <Badge className={`${selectedCampaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : selectedCampaign.status === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-green-100 text-green-700'} border-0 ml-1`}>
                      {selectedCampaign.status}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${selectedCampaign.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : selectedCampaign.channel === 'email' ? 'bg-blue-100 text-blue-700' : selectedCampaign.channel === 'sms' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'} border-0`}>
                      {selectedCampaign.channel}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 border-0">{selectedCampaign.segmentId?.name || 'No segment'}</Badge>
                    {selectedCampaign.createdBy === 'agent' && <Badge className="bg-teal-100 text-teal-700 border-0">AI</Badge>}
                    <span className="text-sm text-gray-500 ml-auto">{selectedCampaign.createdAt ? new Date(selectedCampaign.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  {detailLoading ? (
                    <div className="grid grid-cols-6 gap-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : campaignStats ? (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {[
                        { label: 'Sent', value: campaignStats.sent, icon: Send, color: 'text-blue-500' },
                        { label: 'Delivered', value: campaignStats.delivered, icon: CheckCircle, color: 'text-green-500' },
                        { label: 'Opened', value: campaignStats.opened, icon: Eye, color: 'text-purple-500' },
                        { label: 'Clicked', value: campaignStats.clicked, icon: MousePointerClick, color: 'text-yellow-500' },
                        { label: 'Converted', value: campaignStats.converted, icon: TrendingUp, color: 'text-orange-500' },
                        { label: 'Revenue', value: campaignStats.revenue, icon: DollarSign, color: 'text-teal-500', formatted: true },
                      ].map(k => {
                        const Icon = k.icon;
                        const display = k.formatted ? formatCurrency(k.value || 0) : formatNumber(k.value || 0);
                        return (
                          <div key={k.label} className="bg-gray-50 rounded-lg p-3 text-center">
                            <Icon size={14} className={`mx-auto mb-1 ${k.color}`} />
                            <p className="text-xs text-gray-500">{k.label}</p>
                            <p className="text-sm font-bold text-gray-900">{display}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {selectedCampaign.messageTemplate && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Message</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCampaign.messageTemplate}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setSelectedCampaign(null)}>Close</Button>
                  {selectedCampaign.status === 'draft' && (
                    <Button onClick={() => handleLaunch(selectedCampaign._id)} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">
                      Launch Campaign
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Dialog>
    </div>
  );
}
