import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import api from '../lib/api';
import { formatNumber } from '../lib/utils';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('channels');
  const [overview, setOverview] = useState(null);
  const [channels, setChannels] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [funnel, setFunnel] = useState(null);

  useEffect(() => {
    api.get('/api/analytics/overview').then(r => setOverview(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'channels' && channels.length === 0) {
      api.get('/api/analytics/channels').then(r => setChannels(r.data)).catch(() => {});
    } else if (activeTab === 'top-campaigns' && topCampaigns.length === 0) {
      api.get('/api/analytics/campaigns/top?limit=10').then(r => setTopCampaigns(r.data)).catch(() => {});
    } else if (activeTab === 'campaign-funnel' && !funnel) {
      api.get('/api/analytics/funnel').then(r => setFunnel(r.data)).catch(() => {});
    }
  }, [activeTab]);

  const kpis = overview ? [
    { label: 'Total Messages', value: formatNumber(overview.messages_sent || 0) },
    { label: 'Avg Delivery Rate', value: overview.delivery_rate ? `${(overview.delivery_rate * 100).toFixed(1)}%` : '0%' },
    { label: 'Avg Open Rate', value: overview.open_rate ? `${(overview.open_rate * 100).toFixed(1)}%` : '0%' },
    { label: 'Avg Conversion Rate', value: overview.conversion_rate ? `${(overview.conversion_rate * 100).toFixed(1)}%` : '0%' },
  ] : [];

  const funnelData = funnel ? Object.entries(funnel).filter(([k]) => k !== '_id').map(([stage, value]) => ({ stage, value })) : [];

  const channelColors = { whatsapp: '#10b981', email: '#3b82f6', sms: '#f59e0b', rcs: '#8b5cf6' };

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="text-sm text-gray-500 mt-1">Campaign performance and engagement metrics</p></div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="channels">Channel Performance</TabsTrigger>
          <TabsTrigger value="top-campaigns">Top Campaigns</TabsTrigger>
          <TabsTrigger value="campaign-funnel">Campaign Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="mt-4">
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">CHANNEL</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">SENT</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">DELIVERY RATE</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">OPEN RATE</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">CLICK RATE</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">CONVERSION</th>
              </tr></thead>
              <tbody>
                {channels.map(ch => (
                  <tr key={ch.channel || ch._id} className="border-b border-gray-50">
                    <td className="px-4 py-3"><Badge style={{ backgroundColor: channelColors[ch.channel] || '#9ca3af', color: 'white' }}>{ch.channel}</Badge></td>
                    <td className="px-4 py-3">{formatNumber(ch.sent || 0)}</td>
                    <td className="px-4 py-3">{(ch.delivery_rate * 100 || 0).toFixed(1)}%</td>
                    <td className="px-4 py-3">{(ch.open_rate * 100 || 0).toFixed(1)}%</td>
                    <td className="px-4 py-3">{(ch.click_rate * 100 || 0).toFixed(1)}%</td>
                    <td className="px-4 py-3">{(ch.conversion_rate * 100 || 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="top-campaigns" className="mt-4">
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Campaign Name</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Channel</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Segment</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Sent</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Open Rate</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Revenue</th>
              </tr></thead>
              <tbody>
                {topCampaigns.map(c => (
                  <tr key={c._id || c.campaign} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.campaign_name || c.name}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{c.channel}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{c.segment_name || '-'}</td>
                    <td className="px-4 py-3">{formatNumber(c.sent || 0)}</td>
                    <td className="px-4 py-3">{(c.open_rate * 100 || 0).toFixed(1)}%</td>
                    <td className="px-4 py-3 font-medium">₹{((c.revenue || 0)).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="campaign-funnel" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Aggregate Campaign Funnel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0fd4b4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
