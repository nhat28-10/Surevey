import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { AppNotification, AppNotificationType } from "../services/notificationService";
import { getNotificationsForUser, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import { getCurrentUser } from "../services/authService";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { EmptyState } from "./EmptyState";
import { NotificationIcon, NotificationTypeBadge } from "./NotificationBell";

type NotificationFilter = "all" | AppNotificationType;
type ReadFilter = "all" | "unread" | "read";

const typeFilters: Array<{ value: NotificationFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "campaign", label: "Campaign" },
  { value: "payment", label: "Thanh toán" },
  { value: "submission", label: "Submission" },
  { value: "wallet", label: "Ví" },
];

const readFilters: Array<{ value: ReadFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "read", label: "Đã đọc" },
];

export function NotificationsPage() {
  const user = getCurrentUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificationFilter>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setNotifications(await getNotificationsForUser(user));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
    window.addEventListener("notifications-changed", load);
    return () => window.removeEventListener("notifications-changed", load);
  }, [load]);

  const filtered = useMemo(() => notifications.filter(notification => {
    const typeMatched = typeFilter === "all" || notification.type === typeFilter;
    const readMatched = readFilter === "all" || (readFilter === "read" ? notification.read : !notification.read);
    return typeMatched && readMatched;
  }), [notifications, readFilter, typeFilter]);

  if (!user) return null;

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const markAll = () => {
    markAllNotificationsRead(user.id, notifications.map(notification => notification.id));
  };

  const markOne = (notification: AppNotification) => {
    markNotificationRead(user.id, notification.id);
  };

  return <div className="space-y-6">
    <div className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 rounded-full border-slate-700 bg-slate-900 px-3 py-1 text-slate-200">{user.role}</Badge>
          <h1 className="text-2xl font-bold">Trung tâm thông báo</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Tổng hợp các cập nhật quan trọng từ campaign, thanh toán, submission và ví dựa trên dữ liệu hiện có của SureVey.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
          <HeaderMetric label="Tổng thông báo" value={notifications.length} />
          <HeaderMetric label="Chưa đọc" value={unreadCount} />
        </div>
      </div>
    </div>

    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-4 border-b border-slate-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-slate-700" />
            Danh sách thông báo
          </CardTitle>
          <Button type="button" variant="outline" className="w-fit border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" disabled={notifications.length === 0} onClick={markAll}>
            <CheckCheck className="mr-2 h-4 w-4" />Đánh dấu tất cả đã đọc
          </Button>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedFilter values={typeFilters} value={typeFilter} onChange={value => setTypeFilter(value as NotificationFilter)} />
          <SegmentedFilter values={readFilters} value={readFilter} onChange={value => setReadFilter(value as ReadFilter)} />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />Đang tải thông báo
        </div> : filtered.length === 0 ? <EmptyState
          compact
          icon={<Bell className="h-5 w-5" />}
          title="Không có thông báo phù hợp"
          description="Thử đổi bộ lọc hoặc quay lại khi hệ thống có thêm campaign, submission, thanh toán hay giao dịch mới."
        /> : <div className="space-y-3">
          {filtered.map(notification => <NotificationRow key={notification.id} notification={notification} onMarkRead={() => markOne(notification)} />)}
        </div>}
      </CardContent>
    </Card>
  </div>;
}

function HeaderMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 text-2xl font-bold text-white">{value.toLocaleString("vi-VN")}</div>
  </div>;
}

function SegmentedFilter({
  values,
  value,
  onChange,
}: {
  values: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
    {values.map(item => <button
      key={item.value}
      type="button"
      onClick={() => onChange(item.value)}
      className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition ${item.value === value ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}
    >
      {item.label}
    </button>)}
  </div>;
}

function NotificationRow({ notification, onMarkRead }: { notification: AppNotification; onMarkRead: () => void }) {
  return <div className={`rounded-lg border p-4 transition hover:border-slate-300 ${notification.read ? "border-slate-200 bg-white" : "border-blue-100 bg-blue-50"}`}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 gap-3">
        <NotificationIcon notification={notification} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">{notification.title}</h3>
            <NotificationTypeBadge type={notification.type} />
            {!notification.read && <Badge className="rounded-full bg-blue-600 text-white">Mới</Badge>}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{notification.description}</p>
          <div className="mt-2 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString("vi-VN")}</div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {!notification.read && <Button type="button" size="sm" variant="outline" className="border-slate-300 bg-white font-semibold text-slate-900 hover:bg-slate-100" onClick={onMarkRead}>
          Đã đọc
        </Button>}
        <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
          <Link to={notification.href} onClick={onMarkRead}>Mở</Link>
        </Button>
      </div>
    </div>
  </div>;
}
