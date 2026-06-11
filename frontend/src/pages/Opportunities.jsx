import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lightbulb } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Skeleton } from 'src/components/ui/skeleton';

export default function Opportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    api.get('/api/opportunities?status=active').then(r => { setOpportunities(r.data.opportunities || r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setScanError('');
    try {
      const res = await api.post('/api/opportunities/scan');
      const newOpps = res.data.opportunities || [];
      if (newOpps.length === 0) {
        setScanError('Scan completed but no opportunities were returned. Try again or check agent service logs.');
      } else {
        setOpportunities(prev => [...newOpps, ...prev]);
      }
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.response?.data?.error || e?.message || 'Unknown error';
      setScanError(`Scan failed: ${detail}`);
    }
    setScanning(false);
  };

  const handleDismiss = async (id) => {
    try {
      await api.patch(`/api/opportunities/${id}/dismiss`);
      setOpportunities(prev => prev.filter(o => o._id !== id));
    } catch (e) {}
  };

  const handleGenerate = async (id) => {
    await api.post(`/api/opportunities/${id}/generate-campaign`);
    navigate('/proposals');
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-96" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-9 w-36 rounded-lg" />
                  <Skeleton className="h-9 w-32 rounded-lg" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">AI-discovered marketing opportunities for your business</p>
        </div>
        <Button onClick={handleScan} disabled={scanning} variant="outline" className="border-[#0fd4b4] text-[#0fd4b4] hover:bg-[#0fd4b4] hover:text-white disabled:opacity-50">
          <Sparkles size={16} className={scanning ? 'animate-spin' : ''} /> {scanning ? 'Scanning...' : 'Scan for Opportunities'}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {scanError && (
          <Card>
            <CardContent className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {scanError}
            </CardContent>
          </Card>
        )}
        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-20 text-gray-500">
              <Lightbulb size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No opportunities yet. Click "Scan for Opportunities" to discover new ones.</p>
            </CardContent>
          </Card>
        ) : opportunities.map(opp => (
          <Card key={opp._id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb size={20} className="text-yellow-500 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-500">Audience: {opp.audienceDescription || '—'}</span>
                    <span className="text-gray-500">Expected Revenue: {formatCurrency(opp.expectedRevenue || 0)}</span>
                  </div>
                  <details className="mt-2">
                    <summary className="text-sm text-[#0fd4b4] cursor-pointer">AI Reasoning</summary>
                    <p className="text-sm text-gray-600 mt-2">{opp.aiReasoning || 'No reasoning available.'}</p>
                  </details>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => handleGenerate(opp._id)} size="sm" className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">Generate Campaign</Button>
                    <Button variant="outline" size="sm">Review Proposal</Button>
                    <Button onClick={() => handleDismiss(opp._id)} variant="ghost" size="sm">Dismiss</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
