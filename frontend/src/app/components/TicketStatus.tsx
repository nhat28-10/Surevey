import { useState } from 'react';
import { Search, FileText, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { getUserTickets, getTicketById } from '../services/supportService';
import { getCurrentUser } from '../services/surveyService';
import { 
  SupportTicket, 
  DisputeTicket, 
  TicketStatus as Status,
  TICKET_CATEGORY_LABELS,
  DISPUTE_TYPE_LABELS,
  TICKET_STATUS_LABELS 
} from '../types/support';
import { Link } from 'react-router';

export function TicketStatus() {
  const currentUser = getCurrentUser();
  const [searchId, setSearchId] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<SupportTicket | DisputeTicket | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(true);

  const { supportTickets, disputeTickets } = getUserTickets(currentUser.id);
  const allMyTickets = [
    ...supportTickets.map(t => ({ ...t, type: 'support' as const })),
    ...disputeTickets.map(t => ({ ...t, type: 'dispute' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    const ticket = getTicketById(searchId.trim());
    if (ticket) {
      setSearchedTicket(ticket);
      setNotFound(false);
    } else {
      setSearchedTicket(null);
      setNotFound(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Status) => {
    if (status === Status.RESOLVED) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          {TICKET_STATUS_LABELS[status]}
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        {TICKET_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const renderTicketCard = (
    ticket: (SupportTicket | DisputeTicket) & { type?: 'support' | 'dispute' },
    isSearchResult = false
  ) => {
    const isSupportTicket = 'category' in ticket;
    const isDisputeTicket = 'disputeType' in ticket;

    return (
      <Card key={ticket.id} className={isSearchResult ? 'border-blue-500 border-2' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {isSupportTicket ? (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {isSupportTicket ? 'Vấn đề chung' : 'Tranh chấp'}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Mã: {ticket.id}
              </CardDescription>
            </div>
            {getStatusBadge(ticket.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupportTicket && (
            <div>
              <p className="text-sm font-medium text-gray-700">Danh mục:</p>
              <p className="text-sm text-gray-600">
                {TICKET_CATEGORY_LABELS[ticket.category]}
              </p>
            </div>
          )}
          
          {isDisputeTicket && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700">Khảo sát:</p>
                <p className="text-sm text-gray-600">{ticket.surveyName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Loại vấn đề:</p>
                <p className="text-sm text-gray-600">
                  {DISPUTE_TYPE_LABELS[ticket.disputeType]}
                </p>
              </div>
            </>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700">Mô tả:</p>
            <p className="text-sm text-gray-600 line-clamp-3">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-gray-500">Ngày gửi</p>
              <p className="text-sm font-medium">{formatDate(ticket.createdAt)}</p>
            </div>
            {ticket.resolvedAt && (
              <div>
                <p className="text-xs text-gray-500">Ngày giải quyết</p>
                <p className="text-sm font-medium">{formatDate(ticket.resolvedAt)}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500">Email liên hệ</p>
            <p className="text-sm font-medium">{ticket.email}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link to="/support/faq">
          <Button variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại FAQ
          </Button>
        </Link>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Trạng thái đơn báo cáo</h1>
          <p className="text-lg text-gray-600">
            Kiểm tra trạng thái của các đơn báo cáo hỗ trợ của bạn
          </p>
        </div>
      </div>

      {/* Search by ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Tìm kiếm theo mã đơn báo cáo
          </CardTitle>
          <CardDescription>
            Nhập mã đơn báo cáo bạn nhận được khi gửi báo cáo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Nhập mã đơn báo cáo (ví dụ: ticket_1234567890)"
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value);
                    setNotFound(false);
                    setSearchedTicket(null);
                  }}
                />
              </div>
              <Button type="submit" className="gap-2">
                <Search className="w-4 h-4" />
                Tìm kiếm
              </Button>
            </div>
          </form>

          {notFound && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Không tìm thấy đơn báo cáo với mã này. Vui lòng kiểm tra lại mã.
              </AlertDescription>
            </Alert>
          )}

          {searchedTicket && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-green-600">Tìm thấy đơn báo cáo!</p>
              {renderTicketCard(searchedTicket, true)}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* My Tickets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đơn báo cáo của tôi</h2>
            <p className="text-sm text-gray-600">
              Tất cả đơn báo cáo đã gửi từ tài khoản của bạn
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {allMyTickets.length} đơn
          </Badge>
        </div>

        {allMyTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 space-y-3">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-600">Bạn chưa có đơn báo cáo nào</p>
                <Link to="/support/faq">
                  <Button variant="outline" className="gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Tạo đơn báo cáo mới
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {allMyTickets.map((ticket) => renderTicketCard(ticket))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">Thông tin hữu ích</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24 giờ làm việc</li>
              <li>• Bạn sẽ nhận được email cập nhật về trạng thái đơn báo cáo</li>
              <li>• Lưu mã đơn báo cáo để theo dõi tiến độ</li>
              <li>• Đơn báo cáo đã giải quyết sẽ được lưu giữ trong lịch sử của bạn</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
