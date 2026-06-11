import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Progress } from 'src/components/ui/progress';
import { Skeleton } from 'src/components/ui/skeleton';

export default function AgentProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/proposals?status=pending').then(r => { setProposals(r.data.proposals || r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/proposals/${id}/approve`);
      setProposals(prev => prev.filter(p => p._id !== id));
    } catch (e) {}
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/api/proposals/${id}/reject`);
      setProposals(prev => prev.filter(p => p._id !== id));
    } catch (e) {}
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2].map(i => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-48 rounded-full" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-9 w-40 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
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
          <h1 className="text-2xl font-bold text-gray-900">Agent Proposals</h1>
          <p className="text-sm text-gray-500 mt-1">AI-generated campaign proposals awaiting your review</p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <Bot size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No pending proposals.</p>
            <p className="text-sm text-gray-400 mt-1">Ask the AI to suggest campaigns in <button onClick={() => navigate('/ai-studio')} className="text-[#0fd4b4] hover:underline">AI Studio</button>.</p>
          </CardContent>
        </Card>
      ) : proposals.map(p => (
        <Card key={p._id} className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge className={
                    p.channel === 'whatsapp' ? 'bg-green-100 text-green-700 border-green-200' :
                    p.channel === 'email' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    p.channel === 'sms' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-purple-100 text-purple-700 border-purple-200'
                  }>{p.channel}</Badge>
                  <Badge variant="secondary">{p.segmentId?.name || 'Segment'}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.messageTemplate}</p>
                {p.confidenceScore !== undefined && (
                  <div className="mt-3 w-48">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Confidence</span>
                      <span>{(p.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={p.confidenceScore * 100} className="h-2.5 [&>div]:bg-[#0fd4b4]" />
                  </div>
                )}
                {p.aiReasoning && (
                  <details className="mt-2">
                    <summary className="text-sm text-[#0fd4b4] cursor-pointer">AI Reasoning</summary>
                    <p className="text-sm text-gray-600 mt-2">{p.aiReasoning}</p>
                  </details>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleApprove(p._id)} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white" size="sm">
                <CheckCircle size={16} /> Approve & Launch
              </Button>
              <Button onClick={() => handleReject(p._id)} variant="outline" size="sm">
                <XCircle size={16} /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
