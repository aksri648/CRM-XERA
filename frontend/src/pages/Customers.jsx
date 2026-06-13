import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Upload, Mail, Phone, MapPin, User, Calendar, ShoppingCart, Tag, IndianRupee, Clock } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import api from '../lib/api';
import { formatCurrency, formatNumber, relativeTime, getAvatarColor, getInitials } from '../lib/utils';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import { Avatar, AvatarFallback } from 'src/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';

const tags = ['All', 'Active', 'VIP', 'At Risk', 'New'];

const HEADER_ALIASES = {
  name: ['name', 'full name', 'fullname', 'customer name', 'customer'],
  email: ['email', 'email address', 'e-mail', 'mail'],
  phone: ['phone', 'phone number', 'mobile', 'contact', 'contact number'],
  city: ['city', 'location'],
  gender: ['gender', 'sex'],
  age: ['age'],
  tags: ['tags', 'tag'],
  ltv: ['ltv', 'lifetime value', 'lifetimevalue'],
  totalOrders: ['total orders', 'totalorders', 'orders', 'order count'],
  lastOrderAt: ['last order at', 'last order', 'lastorderat', 'last order date'],
};

function normalizeRow(row) {
  const lowered = {};
  for (const k of Object.keys(row)) lowered[String(k).trim().toLowerCase()] = row[k];
  const pick = (field) => {
    for (const alias of HEADER_ALIASES[field]) {
      if (lowered[alias] !== undefined && lowered[alias] !== null && lowered[alias] !== '') return lowered[alias];
    }
    return undefined;
  };
  const out = {};
  const name = pick('name');
  const email = pick('email');
  if (!name || !email) return null;
  out.name = String(name).trim();
  out.email = String(email).trim().toLowerCase();
  const phone = pick('phone');         if (phone !== undefined) out.phone = String(phone).trim();
  const city = pick('city');           if (city !== undefined) out.city = String(city).trim();
  const gender = pick('gender');
  if (gender !== undefined) {
    const g = String(gender).trim().toLowerCase();
    if (['male', 'female', 'other'].includes(g)) out.gender = g;
  }
  const age = pick('age');             if (age !== undefined && !Number.isNaN(Number(age))) out.age = Number(age);
  const ltv = pick('ltv');             if (ltv !== undefined && !Number.isNaN(Number(ltv))) out.ltv = Number(ltv);
  const orders = pick('totalOrders');  if (orders !== undefined && !Number.isNaN(Number(orders))) out.totalOrders = Number(orders);
  const lastOrder = pick('lastOrderAt');
  if (lastOrder !== undefined) {
    const d = new Date(lastOrder);
    if (!Number.isNaN(d.getTime())) out.lastOrderAt = d.toISOString();
  }
  const tagVal = pick('tags');
  if (tagVal !== undefined) {
    out.tags = String(tagVal).split(',').map(t => t.trim()).filter(Boolean);
  }
  return out;
}

export default function Customers() {
  const fileInputRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const tagParam = activeTag === 'All' ? undefined : activeTag.toLowerCase().replace(' ', '_');
      const res = await api.get(`/api/customers?search=${search}&tag=${tagParam || ''}&page=${page}&limit=12`);
      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (e) {}
    setLoading(false);
  }, [search, activeTag, page]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerOrders([]);
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/customers/${customer._id}`);
      setSelectedCustomer(res.data.customer);
      setCustomerOrders(res.data.orders || []);
    } catch (e) {}
    setDetailLoading(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('File contains no sheets');
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      if (rows.length === 0) throw new Error('File is empty');
      if (rows.length > 10000) throw new Error('Maximum 10,000 rows per import');

      const customersPayload = [];
      let invalidRows = 0;
      for (const row of rows) {
        const normalized = normalizeRow(row);
        if (normalized) customersPayload.push(normalized);
        else invalidRows++;
      }
      if (customersPayload.length === 0) {
        toast.error('No valid rows found. Each row needs at least "name" and "email" columns.');
        setImporting(false);
        return;
      }

      const res = await api.post('/api/customers/bulk', { customers: customersPayload });
      const { inserted = 0, skipped = 0, errors = [] } = res.data;
      const parts = [`${inserted} added`];
      if (skipped) parts.push(`${skipped} duplicates skipped`);
      if (invalidRows) parts.push(`${invalidRows} rows missing name/email`);
      if (errors.length) parts.push(`${errors.length} errors`);
      toast.success(`Import complete: ${parts.join(', ')}`);
      setPage(1);
      fetchCustomers();
    } catch (err) {
      const detail = err?.response?.data?.error || err?.message || 'Unknown error';
      toast.error(`Import failed: ${detail}`);
    }
    setImporting(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{formatNumber(total)} total customers</p>
        </div>
        <Button variant="outline" onClick={handleImportClick} disabled={importing}>
          <Upload size={16} className={importing ? 'animate-pulse' : ''} />
          {importing ? 'Importing...' : 'Import'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {tags.map(tag => (
          <Badge
            key={tag}
            onClick={() => { setActiveTag(tag); setPage(1); }}
            variant={activeTag === tag ? 'default' : 'outline'}
            className={activeTag === tag
              ? 'cursor-pointer border-[#0fd4b4] bg-teal-50 text-[#0fd4b4] hover:bg-teal-100'
              : 'cursor-pointer border-gray-200 text-gray-600 hover:bg-gray-50'
            }
          >
            {tag}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1"><div className="h-3 w-10 mx-auto bg-gray-200 rounded animate-pulse" /><div className="h-4 w-14 mx-auto bg-gray-200 rounded animate-pulse" /></div>
                  <div className="space-y-1"><div className="h-3 w-10 mx-auto bg-gray-200 rounded animate-pulse" /><div className="h-4 w-14 mx-auto bg-gray-200 rounded animate-pulse" /></div>
                  <div className="space-y-1"><div className="h-3 w-10 mx-auto bg-gray-200 rounded animate-pulse" /><div className="h-4 w-14 mx-auto bg-gray-200 rounded animate-pulse" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {customers.map(c => (
              <Card key={c._id} onClick={() => handleCustomerClick(c)} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="text-white text-sm font-bold" style={{ backgroundColor: getAvatarColor(c.name) }}>
                        {getInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-xs text-gray-500">LTV</p><p className="font-semibold text-gray-900">{formatCurrency(c.ltv)}</p></div>
                    <div><p className="text-xs text-gray-500">Orders</p><p className="font-semibold text-gray-900">{formatNumber(c.totalOrders)}</p></div>
                    <div><p className="text-xs text-gray-500">Last Order</p><p className="font-semibold text-gray-900">{c.lastOrderAt ? relativeTime(c.lastOrderAt) : '—'}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)} variant="outline" size="sm">Prev</Button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} variant="outline" size="sm">Next</Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => { if (!open) setSelectedCustomer(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Customer Profile</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-4 mt-2">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-white text-xl font-bold" style={{ backgroundColor: getAvatarColor(selectedCustomer.name) }}>
                    {getInitials(selectedCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <Phone size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <MapPin size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">City</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.city || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <User size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Gender</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedCustomer.gender || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <Calendar size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Age</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.age || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center bg-teal-50 rounded-lg py-3">
                  <p className="text-xs text-gray-500">LTV</p>
                  <p className="text-lg font-bold text-[#0fd4b4]">{formatCurrency(selectedCustomer.ltv || 0)}</p>
                </div>
                <div className="text-center bg-blue-50 rounded-lg py-3">
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-lg font-bold text-blue-600">{formatNumber(selectedCustomer.totalOrders || 0)}</p>
                </div>
                <div className="text-center bg-purple-50 rounded-lg py-3">
                  <p className="text-xs text-gray-500">Last Order</p>
                  <p className="text-lg font-bold text-purple-600">{selectedCustomer.lastOrderAt ? relativeTime(selectedCustomer.lastOrderAt) : '—'}</p>
                </div>
              </div>

              {selectedCustomer.tags?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 uppercase mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCustomer.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs border-[#0fd4b4] text-[#0fd4b4]">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 text-center">
                <p className="text-[10px] text-gray-400">Customer since {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
              </div>

              {customerOrders.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase mb-2">Recent Orders</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customerOrders.map(order => (
                      <div key={order._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart size={12} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.productName}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{order.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                          <p className="text-[10px] text-gray-400">{order.orderedAt ? relativeTime(order.orderedAt) : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
