import { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Eye } from 'lucide-react';
import api from '../lib/api';
import { formatNumber } from '../lib/utils';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs';
import { Input } from 'src/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'src/components/ui/select';

const FIELDS = ['city', 'age', 'ltv', 'total_orders', 'last_order_days', 'gender', 'tags', 'category'];
const OPERATORS = ['gt', 'lt', 'eq', 'gte', 'lte', 'contains', 'not_contains'];

export default function Segments() {
  const [activeTab, setActiveTab] = useState('ai-suggested');
  const [aiSegments, setAiSegments] = useState([]);
  const [manualSegments, setManualSegments] = useState([]);
  const [rules, setRules] = useState([{ field: '', operator: '', value: '' }]);
  const [logic, setLogic] = useState('AND');
  const [preview, setPreview] = useState(null);
  const [segmentName, setSegmentName] = useState('');

  useEffect(() => {
    api.get('/api/segments?created_by=agent').then(r => setAiSegments(r.data.segments || r.data)).catch(() => {});
    api.get('/api/segments?created_by=human').then(r => setManualSegments(r.data.segments || r.data)).catch(() => {});
  }, []);

  const addRule = () => setRules([...rules, { field: '', operator: '', value: '' }]);
  const removeRule = (i) => setRules(rules.filter((_, idx) => idx !== i));
  const updateRule = (i, key, val) => {
    const updated = [...rules];
    updated[i][key] = val;
    setRules(updated);
  };

  const handlePreview = async () => {
    try {
      const res = await api.post('/api/segments/preview', { filterRules: rules, logic });
      setPreview(res.data);
    } catch (e) {}
  };

  const handleSave = async () => {
    try {
      await api.post('/api/segments', { name: segmentName, description: '', filterRules: rules, logic });
      setSegmentName('');
      setRules([{ field: '', operator: '', value: '' }]);
      setPreview(null);
    } catch (e) {}
  };

  const handleUseSegment = (seg) => {
    setActiveTab('segment-builder');
    setRules(seg.filterRules || []);
    setSegmentName(`Copy: ${seg.name}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Segments</h1><p className="text-sm text-gray-500 mt-1">Create and manage audience segments</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#0fd4b4] text-[#0fd4b4] hover:bg-[#0fd4b4] hover:text-white"><Sparkles size={16} /> AI Segment Builder</Button>
          <Button className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white"><Plus size={16} /> Create Segment</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="ai-suggested">AI-Suggested</TabsTrigger>
          <TabsTrigger value="manual">Manual Segments</TabsTrigger>
          <TabsTrigger value="segment-builder">Segment Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-suggested">
          <div className="flex items-center gap-2 mb-4"><h2 className="font-semibold text-gray-900">AI-Suggested Segments</h2><Badge className="bg-[#0fd4b4]/20 text-[#0fd4b4] border-0 font-medium">AI Powered</Badge></div>
          <p className="text-sm text-gray-500 mb-4">Based on your customer data, our AI has identified these high-potential segments:</p>
          <div className="grid grid-cols-2 gap-4">
            {aiSegments.map(s => (
              <Card key={s._id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge className="bg-teal-100 text-teal-700 border-0 text-sm font-medium">{formatNumber(s.customerCount)} customers</Badge>
                    <Button variant="link" onClick={() => handleUseSegment(s)} className="text-[#0fd4b4] p-0 h-auto">Use</Button>
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
                  <tr key={s._id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.filterRules?.length || 0} rules</td>
                    <td className="px-4 py-3">{formatNumber(s.customerCount)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 px-1"><Eye size={16} /></Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500 px-1"><Trash2 size={16} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="segment-builder">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <Input value={segmentName} onChange={e => setSegmentName(e.target.value)} placeholder="Segment Name" className="mb-4" />

            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Logic:</span>
              <button onClick={() => setLogic('AND')} className={`px-3 py-1 text-sm rounded-full ${logic === 'AND' ? 'bg-[#0fd4b4] text-white' : 'bg-gray-100 text-gray-600'}`}>AND</button>
              <button onClick={() => setLogic('OR')} className={`px-3 py-1 text-sm rounded-full ${logic === 'OR' ? 'bg-[#0fd4b4] text-white' : 'bg-gray-100 text-gray-600'}`}>OR</button>
            </div>

            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={rule.field || undefined} onValueChange={val => updateRule(i, 'field', val)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={rule.operator || undefined} onValueChange={val => updateRule(i, 'operator', val)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={rule.value} onChange={e => updateRule(i, 'value', e.target.value)} placeholder="Value" className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600 px-1"><Trash2 size={16} /></Button>
                </div>
              ))}
            </div>

            <Button variant="link" onClick={addRule} className="text-[#0fd4b4] p-0 h-auto mt-3">+ Add Rule</Button>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handlePreview} className="flex items-center gap-2"><Eye size={16} /> Preview Segment</Button>
              <Button onClick={handleSave} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">Save Segment</Button>
            </div>

            {preview && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900">Estimated count: {formatNumber(preview.count)} customers</p>
                {preview.sample?.map((c, i) => (
                  <p key={i} className="text-xs text-gray-500 mt-1">{c.name} — {c.email}</p>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
