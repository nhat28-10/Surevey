import { useEffect, useState } from "react";
import { XCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type NotificationType = "error" | "success" | "warning" | "info";

interface NotificationProps {
  type: NotificationType;
  title?: string;
  message: string;
  onClose?: () => void;
  autoDismiss?: number; // ms — omit to disable auto-dismiss
}

const config: Record<
  NotificationType,
  { icon: React.ReactNode; containerCls: string; iconCls: string; titleCls: string; msgCls: string }
> = {
  error: {
    icon: <XCircle className="w-5 h-5" />,
    containerCls: "bg-red-50 border-red-300",
    iconCls: "text-red-500",
    titleCls: "text-red-800",
    msgCls: "text-red-700",
  },
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    containerCls: "bg-green-50 border-green-300",
    iconCls: "text-green-500",
    titleCls: "text-green-800",
    msgCls: "text-green-700",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    containerCls: "bg-yellow-50 border-yellow-300",
    iconCls: "text-yellow-500",
    titleCls: "text-yellow-800",
    msgCls: "text-yellow-700",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    containerCls: "bg-blue-50 border-blue-300",
    iconCls: "text-blue-500",
    titleCls: "text-blue-800",
    msgCls: "text-blue-700",
  },
};

export function Notification({
  type,
  title,
  message,
  onClose,
  autoDismiss,
}: NotificationProps) {
  const [visible, setVisible] = useState(true);
  const c = config[type];

  useEffect(() => {
    if (!autoDismiss) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, autoDismiss);
    return () => clearTimeout(timer);
  }, [autoDismiss, onClose]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${c.containerCls}`}
    >
      <span className={`mt-0.5 shrink-0 ${c.iconCls}`}>{c.icon}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-semibold leading-snug ${c.titleCls}`}>
            {title}
          </p>
        )}
        <p className={`text-sm leading-relaxed ${title ? "mt-0.5" : ""} ${c.msgCls}`}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className={`shrink-0 mt-0.5 rounded-md p-0.5 hover:bg-black/5 transition-colors ${c.iconCls}`}
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
