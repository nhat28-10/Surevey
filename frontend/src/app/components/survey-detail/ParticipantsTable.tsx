import { useState, useMemo } from 'react';
import { HelperResponse, TableFilters, SortOption } from './types';
import { formatTime } from './mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import { Eye, Search, ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react';

interface ParticipantsTableProps {
  responses: HelperResponse[];
  onViewAnswers: (response: HelperResponse) => void;
}

const PAGE_SIZE = 10;

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).slice(-2).join('').toUpperCase();
}

function avatarColor(name: string): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
  let hash = 0;
  for (const c of name) hash = (hash + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

const DEVICE_ICONS = {
  Desktop: <Monitor className="w-3.5 h-3.5" />,
  Mobile: <Smartphone className="w-3.5 h-3.5" />,
  Tablet: <Tablet className="w-3.5 h-3.5" />,
};

export function ParticipantsTable({ responses, onViewAnswers }: ParticipantsTableProps) {
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    sortBy: 'newest',
    dateFrom: '',
    dateTo: '',
    minTime: '',
    maxTime: '',
  });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...responses];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        r.helperName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    if (filters.dateFrom) {
      list = list.filter(r => r.completedAt >= filters.dateFrom);
    }
    if (filters.dateTo) {
      list = list.filter(r => r.completedAt.slice(0, 10) <= filters.dateTo);
    }
    if (filters.minTime) {
      list = list.filter(r => r.completionTimeMinutes >= parseFloat(filters.minTime));
    }
    if (filters.maxTime) {
      list = list.filter(r => r.completionTimeMinutes <= parseFloat(filters.maxTime));
    }

    switch (filters.sortBy) {
      case 'newest': list.sort((a, b) => b.completedAt.localeCompare(a.completedAt)); break;
      case 'oldest': list.sort((a, b) => a.completedAt.localeCompare(b.completedAt)); break;
      case 'fastest': list.sort((a, b) => a.completionTimeMinutes - b.completionTimeMinutes); break;
      case 'slowest': list.sort((a, b) => b.completionTimeMinutes - a.completionTimeMinutes); break;
    }
    return list;
  }, [responses, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function setFilter<K extends keyof TableFilters>(key: K, val: TableFilters[K]) {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Danh sách người tham gia</h2>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-gray-600">Bộ lọc & tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Tên hoặc email..."
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter('dateTo', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">T. gian tối thiểu (phút)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={filters.minTime}
                onChange={(e) => setFilter('minTime', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">T. gian tối đa (phút)</Label>
              <Input
                type="number"
                min="0"
                placeholder="60"
                value={filters.maxTime}
                onChange={(e) => setFilter('maxTime', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Sắp xếp</Label>
              <Select value={filters.sortBy} onValueChange={(v) => setFilter('sortBy', v as SortOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                  <SelectItem value="fastest">Nhanh nhất</SelectItem>
                  <SelectItem value="slowest">Chậm nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người tham gia</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Hoàn thành lúc</TableHead>
                  <TableHead>T. gian</TableHead>
                  <TableHead className="hidden sm:table-cell">Thiết bị</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      Không tìm thấy kết quả phù hợp
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r) => (
                    <TableRow key={r.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className={`${avatarColor(r.helperName)} text-white text-xs font-semibold`}>
                              {initials(r.helperName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{r.helperName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">{r.email}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(r.completedAt).toLocaleDateString('vi-VN')}
                        <span className="block text-xs text-gray-400">
                          {new Date(r.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {formatTime(r.completionTimeMinutes)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          {DEVICE_ICONS[r.device]}
                          <span className="text-xs">{r.device}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewAnswers(r)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                {filtered.length} kết quả · trang {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === page ? 'default' : 'outline'}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
