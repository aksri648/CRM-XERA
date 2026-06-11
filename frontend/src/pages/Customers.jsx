import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatNumber, relativeTime, getAvatarColor, getInitials } from '../lib/utils';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import { Avatar, AvatarFallback } from 'src/components/ui/avatar';

const tags = ['All', 'Active', 'VIP', 'At Risk', 'New'];

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{formatNumber(total)} total customers</p>
        </div>
        <Button variant="outline">
          <Upload size={16} /> Import
        </Button>
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
              <Card key={c._id} onClick={() => navigate(`/customers/${c._id}`)} className="cursor-pointer hover:shadow-md transition-shadow">
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
    </div>
  );
}
