import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CheckCircle, XCircle, Send, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Progress } from 'src/components/ui/progress';
import { Skeleton } from 'src/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Textarea } from 'src/components/ui/textarea';
import { cn } from '../lib/utils';

const EMPTY_FORM = { title: '', segmentId: '', channel: 'whatsapp', messageTemplate: '' };

export default function AgentProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => {
    api.get('/api/proposals?status=pending').then(r => { setProposals(r.data.proposals || r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/api/segments').then(r => {
      const all = r.data.segments || r.data;
      const seen = new Set();
      setSegments(all.filter(s => { if (seen.has(s.name)) return false; seen.add(s.name); return true; }));
      setSegmentsLoading(false);
    }).catch(() => setSegmentsLoading(false));
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

  const handleEdit = (proposal) => {
    setEditingProposal(proposal);
    setEditForm({
      title: proposal.title || '',
      segmentId: proposal.segmentId?._id || proposal.segmentId || '',
      channel: proposal.channel || 'whatsapp',
      messageTemplate: proposal.messageTemplate || '',
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editForm.title.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    try {
      const res = await api.patch(`/api/proposals/${editingProposal._id}`, editForm);
      setProposals(prev => prev.map(p => p._id === editingProposal._id ? res.data.proposal : p));
      setShowEditModal(false);
      setEditingProposal(null);
      setEditForm(EMPTY_FORM);
      toast.success('Proposal updated');
    } catch (err) {
      toast.error('Failed to update proposal: ' + (err?.response?.data?.error || err?.message));
    }
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
                <Send size={16} /> Send Campaign
              </Button>
              <Button onClick={() => handleEdit(p)} variant="outline" size="sm">
                <Pencil size={16} /> Edit
              </Button>
              <Button onClick={() => handleReject(p._id)} variant="outline" size="sm">
                <XCircle size={16} /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[480px]" style={{ zIndex: 100 }}>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Campaign Name"
            />
            <select
              value={editForm.segmentId || ''}
              onChange={e => setEditForm({ ...editForm, segmentId: e.target.value })}
              disabled={segmentsLoading}
              className={cn(
                "w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm",
                "focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !editForm.segmentId && "text-slate-500"
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
                  onClick={() => setEditForm({ ...editForm, channel: ch })}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    editForm.channel === ch
                      ? 'bg-[#0fd4b4] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
            <Textarea
              value={editForm.messageTemplate}
              onChange={e => setEditForm({ ...editForm, messageTemplate: e.target.value })}
              placeholder="Message template... Use {name} for personalization"
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditSave} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}