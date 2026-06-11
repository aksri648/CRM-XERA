import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Users, Megaphone, BarChart3, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from "src/components/ui/button";
import { Card, CardContent } from "src/components/ui/card";
import { Badge } from "src/components/ui/badge";
import api from '../lib/api';
import { formatCurrency, formatNumber, relativeTime } from '../lib/utils';

const quickActions = [
  { title: 'Import Data', subtitle: 'Upload customers & orders', icon: Upload, color: 'text-blue-500', bg: 'bg-blue-50', path: '/customers' },
  { title: 'Build Segment', subtitle: 'Create audience segments', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', path: '/segments' },
  { title: 'Launch Campaign', subtitle: 'Send personalized messages', icon: Megaphone, color: 'text-green-500', bg: 'bg-green-50', path: '/campaigns' },
  { title: 'View Insights', subtitle: 'Analyze performance', icon: BarChart3, color: 'text-yellow-500', bg: 'bg-yellow-50', path: '/analytics' },
];

const channelStyles = { whatsapp: 'bg-green-100 text-green-700 border-green-200', email: 'bg-blue-100 text-blue-700 border-blue-200', sms: 'bg-yellow-100 text-yellow-700 border-yellow-200', rcs: 'bg-purple-100 text-purple-700 border-purple-200' };
const statusStyles = { draft: 'bg-gray-100 text-gray-600 border-gray-200', running: 'bg-blue-100 text-blue-600 border-blue-200', completed: 'bg-green-100 text-green-700 border-green-200' };

export default function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [overviewRes, campaignsRes] = await Promise.all([
          api.get('/api/analytics/overview'),
          api.get('/api/campaigns?limit=5&sort=-createdAt'),
        ]);
        setOverview(overviewRes.data);
        setCampaigns(campaignsRes.data.campaigns || []);
      } catch (e) {}
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your campaign engagement performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Upload size={16} className="mr-2" /> Import
          </Button>
          <Button size="sm" className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white" onClick={() => navigate('/ai-studio')}>
            <Sparkles size={16} className="mr-2" /> New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.title} className="cursor-pointer hover:shadow-md" onClick={() => navigate(action.path)}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center ${action.color}`}>
                  <Icon size={20} />
                </div>
                <p className="font-semibold text-gray-900 mt-3">{action.title}</p>
                <p className="text-sm text-gray-500">{action.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        {[
          { label: 'Total Customers', value: overview?.total_customers, icon: Users, color: 'text-blue-500', trend: overview?.trends?.customers_pct },
          { label: 'Active Campaigns', value: overview?.active_campaigns, icon: Megaphone, color: 'text-teal-500', trend: overview?.trends?.campaigns_this_week, trendLabel: 'this week' },
          { label: 'Messages Sent', value: overview?.messages_sent, icon: BarChart3, color: 'text-purple-500', trend: overview?.trends?.messages_pct },
          { label: 'Revenue Attributed', value: overview?.revenue_attributed, icon: Sparkles, color: 'text-yellow-500', trend: overview?.trends?.revenue_pct, isCurrency: true },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <Icon size={18} className={kpi.color} />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {kpi.isCurrency ? formatCurrency(kpi.value || 0) : formatNumber(kpi.value || 0)}
                </p>
                {kpi.trend !== undefined && (
                  <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                    <ArrowUpRight size={14} />
                    +{kpi.trend}{kpi.trendLabel ? ` ${kpi.trendLabel}` : '%'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
          <Button variant="link" className="text-[#0fd4b4] p-0 h-auto" onClick={() => navigate('/campaigns')}>
            View All →
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {['CAMPAIGN', 'CHANNEL', 'SEGMENT', 'STATUS', 'SENT', 'OPEN RATE', 'CLICK RATE', 'REVENUE'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c._id} onClick={() => navigate(`/campaigns/${c._id}`)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${channelStyles[c.channel] || ''}`}>{c.channel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.segmentId?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${statusStyles[c.status] || ''}`}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatNumber(c.stats?.sent || 0)}</td>
                  <td className="px-4 py-3">{c.stats?.sent ? ((c.stats.opened / c.stats.sent) * 100).toFixed(1) : 0}%</td>
                  <td className="px-4 py-3">{c.stats?.opened ? ((c.stats.clicked / c.stats.opened) * 100).toFixed(1) : 0}%</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(c.stats?.revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
