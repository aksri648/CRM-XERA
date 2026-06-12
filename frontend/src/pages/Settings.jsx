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
    scanSchedule: 'daily_6am',
    autoApprove: false,
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
              <Label className="text-gray-600 block mb-1">AI Model</Label>
              <Select value={settings.aiModel} onValueChange={(v) => setSettings({...settings, aiModel: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (from env)</SelectItem>
                </SelectContent>
              </Select>
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
