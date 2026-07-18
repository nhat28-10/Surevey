import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, CheckCheck, CircleAlert, ClipboardList, FileCheck2, Loader2, WalletCards } from "lucide-react";
import type { User } from "../types/auth";
import { getNotificationsForUser, markAllNotificationsRead, markNotificationRead, type AppNotification } from "../services/notificationService";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function NotificationBell({ user }: { user: User }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(await getNotificationsForUser(user));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
    window.addEventListener("notifications-changed", load);
    return () => window.removeEventListener("notifications-changed", load);
  }, [load]);

  const unreadCount = notifications.filter(notification => !notification.read).length;
  const preview = notifications.slice(0, 6);

  const openNotification = (notification: AppNotification) => {
    markNotificationRead(user.id, notification.id);
    navigate(notification.href);
  };

  const markAll = () => {
    markAllNotificationsRead(user.id, notifications.map(notification => notification.id));
  };

  return <Popover>
    <PopoverTrigger asChild>
      <Button type="button" variant="outline" size="sm" className="relative h-9 w-9 rounded-full border-slate-300 p-0 text-slate-700 hover:bg-slate-100">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-24px)] p-0">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="font-bold text-slate-950">Thông báo</div>
          <div className="text-xs text-slate-500">{unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}</div>
        </div>
        {notifications.length > 0 && <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={markAll}>
          <CheckCheck className="mr-1 h-3.5 w-3.5" />Đã đọc
        </Button>}
      </div>

      <div className="max-h-[420px] overflow-y-auto p-2">
        {loading ? <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />Đang tải thông báo
        </div> : preview.length === 0 ? <div className="py-8 text-center text-sm text-slate-500">
          Chưa có thông báo phù hợp với tài khoản này.
        </div> : preview.map(notification => <button
          key={notification.id}
          type="button"
          onClick={() => openNotification(notification)}
          className={`mb-1 flex w-full gap-3 rounded-lg border p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 ${notification.read ? "border-transparent bg-white" : "border-blue-100 bg-blue-50"}`}
        >
          <NotificationIcon notification={notification} />
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-2">
              <span className="line-clamp-1 text-sm font-semibold text-slate-950">{notification.title}</span>
              {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
            </span>
            <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{notification.description}</span>
            <span className="mt-2 block text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleString("vi-VN")}</span>
          </span>
        </button>)}
      </div>

      <div className="border-t border-slate-200 p-3">
        <Button asChild type="button" variant="outline" className="w-full border-slate-300 font-semibold text-slate-900 hover:bg-slate-100">
          <Link to="/notifications">Xem tất cả thông báo</Link>
        </Button>
      </div>
    </PopoverContent>
  </Popover>;
}

export function NotificationIcon({ notification }: { notification: AppNotification }) {
  const icon = notification.type === "payment" || notification.type === "wallet"
    ? <WalletCards className="h-4 w-4" />
    : notification.type === "submission"
      ? <FileCheck2 className="h-4 w-4" />
      : notification.type === "campaign"
        ? <ClipboardList className="h-4 w-4" />
        : <CircleAlert className="h-4 w-4" />;

  const toneClass = notification.tone === "green"
    ? "border-green-200 bg-green-100 text-green-800"
    : notification.tone === "amber"
      ? "border-amber-200 bg-amber-100 text-amber-900"
      : notification.tone === "red"
        ? "border-red-200 bg-red-100 text-red-800"
        : notification.tone === "blue"
          ? "border-blue-200 bg-blue-100 text-blue-800"
          : "border-slate-200 bg-slate-100 text-slate-700";

  return <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${toneClass}`}>
    {icon}
  </span>;
}

export function NotificationTypeBadge({ type }: { type: AppNotification["type"] }) {
  const label = {
    campaign: "Campaign",
    payment: "Thanh toán",
    submission: "Submission",
    wallet: "Ví",
    system: "Hệ thống",
  }[type];

  return <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-600">{label}</Badge>;
}
