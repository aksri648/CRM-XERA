import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import api from '../lib/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    platformName: 'Xeno AI Campaign Studio',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    aiModel: 'default',
    customModel: '',
    scanSchedule: 'daily_6am',
    autoApprove: false,
    configSource: 'env',
    openaiBaseUrl: '',
    openaiApiKey: '',
    mongodbUrl: '',
  });

  useEffect(() => {
    api.get('/api/settings').then(r => { if (r.data) setSettings(r.data); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/api/settings', settings);
    } catch (e) {}
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-1">Configure your platform preferences</p></div>

      <Card>
        <CardContent className="p-6">
          <CardTitle className="mb-4">General</CardTitle>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-600 block mb-1">Platform Name</Label>
              <Input value={settings.platformName} onChange={e => setSettings({...settings, platformName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600 block mb-1">Default Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => setSettings({...settings, timezone: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST, UTC +5:30)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST, UTC -5:00)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT, UTC +0:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-600 block mb-1">Default Currency</Label>
                <Select value={settings.currency} onValueChange={(v) => setSettings({...settings, currency: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <CardTitle className="mb-4">AI Configuration</CardTitle>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-600 block mb-1">Configuration Source</Label>
              <Select value={settings.configSource} onValueChange={(v) => setSettings({...settings, configSource: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="env">Use Environment Variables</SelectItem>
                  <SelectItem value="manual">Manual Configuration</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-400">
                {settings.configSource === 'env' ? 'App reads credentials from .env file on the server.' : 'Override env vars with custom values below.'}
              </p>
            </div>

            {settings.configSource === 'manual' && (
              <div className="space-y-4 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <div>
                  <Label className="text-gray-600 block mb-1">OpenAI Base URL</Label>
                  <Input
                    placeholder="https://api.openai.com/v1"
                    value={settings.openaiBaseUrl}
                    onChange={e => setSettings({...settings, openaiBaseUrl: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-gray-400">Base URL for any OpenAI-compatible API (OpenAI, Together, Groq, local, etc.)</p>
                </div>
                <div>
                  <Label className="text-gray-600 block mb-1">API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={e => setSettings({...settings, openaiApiKey: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-gray-400">Your API key. Stored locally, never sent to our servers.</p>
                </div>
                <div>
                  <Label className="text-gray-600 block mb-1">MongoDB URL</Label>
                  <Input
                    placeholder="mongodb://localhost:27017/xeno"
                    value={settings.mongodbUrl}
                    onChange={e => setSettings({...settings, mongodbUrl: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-gray-400">MongoDB connection string for your CRM database.</p>
                </div>
              </div>
            )}

            <div>
              <Label className="text-gray-600 block mb-1">AI Model</Label>
              <Select value={settings.aiModel} onValueChange={(v) => setSettings({...settings, aiModel: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (from env)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="custom">Custom Model</SelectItem>
                </SelectContent>
              </Select>
              {settings.aiModel === 'custom' && (
                <Input
                  className="mt-2"
                  placeholder="e.g. claude-3-opus, llama-3-70b, mistral-large"
                  value={settings.customModel}
                  onChange={e => setSettings({...settings, customModel: e.target.value})}
                />
              )}
            </div>
            <div>
              <Label className="text-gray-600 block mb-1">Autonomous Scanning Schedule</Label>
              <Select value={settings.scanSchedule} onValueChange={(v) => setSettings({...settings, scanSchedule: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_6am">Daily at 6:00 AM</SelectItem>
                  <SelectItem value="every_6h">Every 6 hours</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Auto-approve Low Risk Proposals</p><p className="text-xs text-gray-500">Auto-approve proposals with confidence score &gt; 95%</p></div>
              <Switch checked={settings.autoApprove} onCheckedChange={(v) => setSettings({...settings, autoApprove: v})} />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
