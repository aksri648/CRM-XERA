import { useState, useEffect } from 'react';
import { Sparkles, Plus, Trophy, FlaskConical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import api from '../lib/api';

export default function ABTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/ab-tests').then(r => { setTests(r.data.tests || r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#0fd4b4] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">A/B Tests</h1><p className="text-sm text-gray-500 mt-1">Compare campaign variants</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#0fd4b4] text-[#0fd4b4] hover:bg-[#0fd4b4] hover:text-white"><Sparkles size={16} /> AI Generate Test</Button>
          <Button variant="outline"><Plus size={16} /> Create Manual Test</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {tests.map(t => (
          <Card key={t._id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <Badge variant={t.status === 'running' ? 'default' : t.status === 'completed' ? 'secondary' : 'outline'} className={t.status === 'running' ? 'animate-pulse' : ''}>{t.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded-xl p-4 ${t.winnerCampaignId === t.campaignAId ? 'border-2 border-[#0fd4b4]' : 'border-gray-200'}`}>
                  {t.winnerCampaignId === t.campaignAId && <span className="text-xs font-bold text-[#0fd4b4] flex items-center gap-1 mb-2"><Trophy size={14} /> WINNER</span>}
                  <p className="text-xs font-semibold text-gray-500 mb-1">A - {t.campaignA_name || 'Variant A'}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{t.campaignA_message || 'Campaign A message'}</p>
                </div>
                <div className={`border rounded-xl p-4 ${t.winnerCampaignId === t.campaignBId ? 'border-2 border-[#0fd4b4]' : 'border-gray-200'}`}>
                  {t.winnerCampaignId === t.campaignBId && <span className="text-xs font-bold text-[#0fd4b4] flex items-center gap-1 mb-2"><Trophy size={14} /> WINNER</span>}
                  <p className="text-xs font-semibold text-gray-500 mb-1">B - {t.campaignB_name || 'Variant B'}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{t.campaignB_message || 'Campaign B message'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {tests.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center py-20">
              <FlaskConical size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500">No A/B tests yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
