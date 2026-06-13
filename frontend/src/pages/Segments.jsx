import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { formatNumber, formatCurrency, relativeTime, getAvatarColor, getInitials } from '../lib/utils';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs';
import { Input } from 'src/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'src/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { Avatar, AvatarFallback } from 'src/components/ui/avatar';

const FIELDS = ['city', 'age', 'ltv', 'total_orders', 'last_order_days', 'gender', 'tags', 'category'];
const OPERATORS = [
  { value: 'gt', label: '> greater than' },
  { value: 'gte', label: '>= greater or equal' },
  { value: 'lt', label: '< less than' },
  { value: 'lte', label: '<= less or equal' },
  { value: 'eq', label: '= equal to' },
  { value: 'contains', label: '∈ contains' },
  { value: 'not_contains', label: '∉ not contains' },
];

const EMPTY_RULE = { field: '', operator: '', value: '' };

export default function Segments() {
  const [activeTab, setActiveTab] = useState('ai-suggested');
  const [aiSegments, setAiSegments] = useState([]);
  const [manualSegments, setManualSegments] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [segmentCustomers, setSegmentCustomers] = useState([]);
  const [segmentTotal, setSegmentTotal] = useState(0);
  const [segmentPage, setSegmentPage] = useState(1);
  const [segmentPages, setSegmentPages] = useState(1);
  const [segmentLoading, setSegmentLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRules, setFormRules] = useState([{ ...EMPTY_RULE }]);
  const [formLogic, setFormLogic] = useState('AND');
  const [formSaving, setFormSaving] = useState(false);

  const fetchAiSegments = () => {
    api.get('/api/segments?created_by=agent').then(r => {
      const all = r.data.segments || r.data;
      const seen = new Set();
      setAiSegments(all.filter(s => { if (seen.has(s.name)) return false; seen.add(s.name); return true; }));
    }).catch(() => {});
  };

  const fetchManualSegments = () => {
    api.get('/api/segments?created_by=human').then(r => setManualSegments(r.data.segments || r.data)).catch(() => {});
  };

  const handleGenerateSegments = async () => {
    setGenerating(true);
    try {
      await api.post('/api/segments/generate');
      await new Promise(r => setTimeout(r, 2000));
      fetchAiSegments();
    } catch (e) {} finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchAiSegments();
    fetchManualSegments();
  }, []);

  const addRule = () => setFormRules([...formRules, { ...EMPTY_RULE }]);
  const removeRule = (i) => setFormRules(formRules.filter((_, idx) => idx !== i));
  const updateRule = (i, key, val) => {
    const updated = [...formRules];
    updated[i][key] = val;
    setFormRules(updated);
  };

  const handleCreateSegment = async () => {
    if (!formName.trim()) return;
    setFormSaving(true);
    try {
      await api.post('/api/segments', { name: formName.trim(), description: '', filterRules: formRules, logic: formLogic });
      setCreateOpen(false);
      setFormName('');
      setFormRules([{ ...EMPTY_RULE }]);
      setFormLogic('AND');
      fetchManualSegments();
      setActiveTab('manual');
    } catch (e) {}
    setFormSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/segments/${id}`);
      setManualSegments(prev => prev.filter(s => s._id !== id));
    } catch (e) {}
  };

  const fetchSegmentCustomers = useCallback(async () => {
    if (!selectedSegment) return;
    setSegmentLoading(true);
    try {
      const res = await api.get(`/api/segments/${selectedSegment._id}/customers?page=${segmentPage}&limit=12`);
      setSegmentCustomers(res.data.customers || []);
      setSegmentTotal(res.data.total || 0);
      setSegmentPages(Math.ceil((res.data.total || 0) / 12));
    } catch (e) {}
    setSegmentLoading(false);
  }, [selectedSegment, segmentPage]);

  useEffect(() => {
    if (selectedSegment) fetchSegmentCustomers();
  }, [selectedSegment, segmentPage, fetchSegmentCustomers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Segments</h1><p className="text-sm text-gray-500 mt-1">Create and manage audience segments</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#0fd4b4] text-[#0fd4b4] hover:bg-[#0fd4b4] hover:text-white"><Sparkles size={16} /> AI Segment Builder</Button>
          <Button className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create Segment</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="ai-suggested">AI-Suggested</TabsTrigger>
          <TabsTrigger value="manual">Manual Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-suggested">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><h2 className="font-semibold text-gray-900">AI-Suggested Segments</h2><Badge className="bg-[#0fd4b4]/20 text-[#0fd4b4] border-0 font-medium">AI Powered</Badge></div>
            <Button variant="outline" size="sm" onClick={handleGenerateSegments} disabled={generating} className="border-[#0fd4b4] text-[#0fd4b4] hover:bg-[#0fd4b4] hover:text-white">
              <Sparkles size={14} className="mr-1" /> {generating ? 'Generating...' : 'Regenerate Segments'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Based on your customer data, our AI analyzes patterns and creates meaningful audience segments:</p>
          <div className="grid grid-cols-2 gap-4">
            {aiSegments.map(s => (
              <Card key={s._id} onClick={() => { setSelectedSegment(s); setSegmentPage(1); }} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge className="bg-teal-100 text-teal-700 border-0 text-sm font-medium">{formatNumber(s.customerCount)} customers</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manual">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Filter Rules</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Customers</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Created</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {manualSegments.map(s => (
                  <tr key={s._id} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setSelectedSegment(s); setSegmentPage(1); }}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.filterRules?.length || 0} rules</td>
                    <td className="px-4 py-3">{formatNumber(s.customerCount)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }} className="text-gray-400 hover:text-red-500 px-1"><Trash2 size={16} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Segment</DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Segment Name" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Logic:</span>
              <button onClick={() => setFormLogic('AND')} className={`px-3 py-1 text-sm rounded-full ${formLogic === 'AND' ? 'bg-[#0fd4b4] text-white' : 'bg-gray-100 text-gray-600'}`}>AND</button>
              <button onClick={() => setFormLogic('OR')} className={`px-3 py-1 text-sm rounded-full ${formLogic === 'OR' ? 'bg-[#0fd4b4] text-white' : 'bg-gray-100 text-gray-600'}`}>OR</button>
            </div>

            <div className="space-y-3">
              {formRules.map((rule, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={rule.field || undefined} onValueChange={val => updateRule(i, 'field', val)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Field" /></SelectTrigger>
                    <SelectContent>{FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={rule.operator || undefined} onValueChange={val => updateRule(i, 'operator', val)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Operator" /></SelectTrigger>
                    <SelectContent>{OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={rule.value} onChange={e => updateRule(i, 'value', e.target.value)} placeholder="Value" className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600 px-1"><Trash2 size={16} /></Button>
                </div>
              ))}
            </div>

            <Button variant="link" onClick={addRule} className="text-[#0fd4b4] p-0 h-auto">+ Add Rule</Button>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateSegment} disabled={formSaving || !formName.trim()} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">
                {formSaving ? 'Creating...' : 'Create Segment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSegment} onOpenChange={(open) => { if (!open) { setSelectedSegment(null); setSegmentCustomers([]); } }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedSegment && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSegment.name}</DialogTitle>
                <p className="text-sm text-gray-500">{formatNumber(segmentTotal)} customers in this segment</p>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto mt-2 -mx-6 px-6">
                {segmentLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                            <div className="h-3 w-32 bg-gray-200 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : segmentCustomers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No customers found in this segment.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {segmentCustomers.map(c => (
                      <Card key={c._id}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="text-white text-xs font-bold" style={{ backgroundColor: getAvatarColor(c.name) }}>
                                {getInitials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                              <p className="text-xs text-gray-500 truncate">{c.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center text-xs">
                            <div><p className="text-gray-400">LTV</p><p className="font-medium text-gray-900">{formatCurrency(c.ltv)}</p></div>
                            <div><p className="text-gray-400">Orders</p><p className="font-medium text-gray-900">{c.totalOrders}</p></div>
                            <div><p className="text-gray-400">Last</p><p className="font-medium text-gray-900">{c.lastOrderAt ? relativeTime(c.lastOrderAt) : '—'}</p></div>
                          </div>
                          {c.city && <p className="text-[10px] text-gray-400 mt-1 text-center">{c.city}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {segmentPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3 border-t">
                  <Button disabled={segmentPage <= 1} onClick={() => setSegmentPage(p => p - 1)} variant="outline" size="sm">
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-sm text-gray-500">Page {segmentPage} of {segmentPages}</span>
                  <Button disabled={segmentPage >= segmentPages} onClick={() => setSegmentPage(p => p + 1)} variant="outline" size="sm">
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
