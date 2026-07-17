import type { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardContent className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "py-16"}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </CardContent>
  </Card>;
}
