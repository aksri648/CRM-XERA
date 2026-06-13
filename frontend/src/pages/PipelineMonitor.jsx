import { useState, useEffect } from 'react';
import { RefreshCw, Send, Package, Mail, CheckCheck, Eye, MousePointerClick, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import api from '../lib/api';
import { formatNumber } from '../lib/utils';

const stageIcons = [Send, Package, Mail, CheckCheck, Eye, MousePointerClick, DollarSign];
const stageLabels = ['Campaign', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Converted'];
const stageKeys = ['active_campaigns', 'total_sent', 'total_delivered', 'total_opened', 'total_clicked', 'total_converted'];

export default function PipelineMonitor() {
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, e] = await Promise.all([
          api.get('/api/pipeline/status'),
          api.get('/api/pipeline/events?limit=50'),
        ]);
        setStatus(s.data);
        setEvents(e.data);
      } catch (err) {}
    };
    fetch();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetch();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const badgeVariant = { Event: 'outline', OK: 'secondary', Failed: 'destructive' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Pipeline Monitor</h1><p className="text-sm text-gray-500 mt-1">Real-time campaign delivery pipeline</p></div>
        <Button variant="outline" size="sm" onClick={() => { api.get('/api/pipeline/status').then(r => setStatus(r.data)); api.get('/api/pipeline/events?limit=50').then(r => setEvents(r.data)); }}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-6 gap-3">
            {stageKeys.map((key, i) => {
              const Icon = stageIcons[i];
              return (
                <div key={key} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto"><Icon size={18} className="text-gray-500" /></div>
                  <p className="text-xs text-gray-500 mt-1">{stageLabels[i]}</p>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(status?.[key] || 0)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Event Timeline</CardTitle></CardHeader>
          <CardContent className="max-h-[480px] overflow-y-auto p-4">
            <div className="space-y-0">
              {events.map((ev, i) => (
                <div key={ev._id || i} className="flex gap-3 pb-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-2" />
                    {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">{new Date(ev.createdAt).toLocaleTimeString()}</p>
                    <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                    <p className="text-xs text-gray-500">{ev.description}</p>
                    {ev.badge && <Badge variant={badgeVariant[ev.badge] || 'outline'} className="mt-1">{ev.badge}</Badge>}
                  </div>
                </div>
              ))}
              {events.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No events yet</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Delivery Summary</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{formatNumber(status?.total_sent || 0)}</p>
                <p className="text-xs text-gray-500">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{formatNumber(status?.total_delivered || 0)}</p>
                <p className="text-xs text-gray-500">Delivered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{formatNumber(status?.total_converted || 0)}</p>
                <p className="text-xs text-gray-500">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
