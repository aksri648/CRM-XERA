import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, Eye, MousePointerClick, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { formatNumber, formatCurrency } from '../lib/utils';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [commPage, setCommPage] = useState(1);
  const [commTotal, setCommTotal] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchComms();
    api.get(`/api/campaigns/${id}`).then(r => { setCampaign(r.data.campaign || r.data); }).catch(() => {});
  }, [id, fetchStats, fetchComms]);

  useEffect(() => {
    if (campaign?.status === 'running') {
      const interval = setInterval(() => { fetchStats(); }, 5000);
      return () => clearInterval(interval);
    }
  }, [campaign?.status, fetchStats]);

  const fetchStats = async () => {
    try { const r = await api.get(`/api/campaigns/${id}/stats`); setStats(r.data.stats || r.data); } catch (e) {}
  };

  const fetchComms = async () => {
    try { const r = await api.get(`/api/campaigns/${id}/communications?page=${commPage}&limit=25`); setCommunications(r.data.communications || r.data.comms || []); setCommTotal(r.data.total || 0); } catch (e) {}
  };

  const handleLaunch = async () => {
    try { await api.post(`/api/campaigns/${id}/launch`); fetchStats(); } catch (e) {}
  };

  if (!campaign) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#0fd4b4] border-t-transparent rounded-full animate-spin" /></div>;

  const s = stats || campaign.stats || {};
  const funnelData = [
    { stage: 'Sent', value: s.sent || 0 },
    { stage: 'Delivered', value: s.delivered || 0 },
    { stage: 'Opened', value: s.opened || 0 },
    { stage: 'Read', value: s.read || 0 },
    { stage: 'Clicked', value: s.clicked || 0 },
    { stage: 'Converted', value: s.converted || 0 },
  ];

  const kpis = [
    { label: 'Sent', value: formatNumber(s.sent || 0), icon: Send, color: 'text-blue-500' },
    { label: 'Delivered', value: formatNumber(s.delivered || 0), icon: CheckCircle, color: 'text-green-500' },
    { label: 'Opened', value: formatNumber(s.opened || 0), icon: Eye, color: 'text-purple-500' },
    { label: 'Clicked', value: formatNumber(s.clicked || 0), icon: MousePointerClick, color: 'text-yellow-500' },
    { label: 'Converted', value: formatNumber(s.converted || 0), icon: TrendingUp, color: 'text-orange-500' },
    { label: 'Revenue', value: formatCurrency(s.revenue || 0), icon: DollarSign, color: 'text-teal-500' },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')} className="mb-4">
        <ArrowLeft size={16} /> Back to Campaigns
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <Badge className={`${campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : campaign.status === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-green-100 text-green-700'} border-0`}>{campaign.status}</Badge>
          </div>
          <div className="flex gap-3 mt-2 text-sm text-gray-500">
            <Badge className={`${campaign.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : campaign.channel === 'email' ? 'bg-blue-100 text-blue-700' : campaign.channel === 'sms' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'} border-0`}>{campaign.channel}</Badge>
            <span>{campaign.segmentId?.name || 'No segment'}</span>
            <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {campaign.status === 'draft' && (
          <Button onClick={handleLaunch} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">Launch Campaign</Button>
        )}
      </div>

      <div className="grid grid-cols-6 gap-4 mb-6">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><Icon size={16} className={k.color} /><span className="text-xs text-gray-500">{k.label}</span></div>
                <p className="text-xl font-bold text-gray-900">{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Campaign Funnel</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={funnelData}>
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#0fd4b4" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Communications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-50">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Customer Name</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Channel</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Message</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Sent At</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Updated</th>
            </tr></thead>
            <tbody>
              {communications.map(comm => (
                <tr key={comm._id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{comm.customerId?.name || comm.customer_name || '-'}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-700 border-0">{comm.channel}</Badge></td>
                  <td className="px-4 py-3"><Badge className={`${comm.status === 'delivered' ? 'bg-green-100 text-green-700' : comm.status === 'failed' ? 'bg-red-100 text-red-700' : comm.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'} border-0`}>{comm.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{comm.message}</td>
                  <td className="px-4 py-3 text-gray-500">{comm.sentAt ? new Date(comm.sentAt).toLocaleTimeString() : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(comm.updatedAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
