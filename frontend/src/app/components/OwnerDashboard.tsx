import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { campaignApi } from "../../api/campaignApi";
import type { Campaign, CampaignPayment } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { CheckCircle2, Copy, ExternalLink, PlusCircle, QrCode, RefreshCw, Target, WalletCards } from "lucide-react";
import { CustomerDashboardSkeleton } from "./LoadingStates";
import { EmptyState } from "./EmptyState";

const statusLabels: Record<string, string> = {
  DRAFT: "Chờ thanh toán",
  PENDING_REVIEW: "Chờ xử lý",
  ACTIVE: "Đang hiển thị",
  REJECTED: "Bị từ chối",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const paymentLabels: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAYMENT_PENDING: "Chờ thanh toán",
  PAYMENT_VERIFYING: "Chờ xác minh",
  PAID: "Đã thanh toán",
  PAYMENT_REJECTED: "Thanh toán bị từ chối",
};

function campaignStatusClass(status: string) {
  if (status === "ACTIVE" || status === "COMPLETED") return "border-green-200 bg-green-100 text-green-800";
  if (status === "PENDING_REVIEW" || status === "DRAFT" || status === "PAUSED") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function paymentStatusClass(status: string) {
  if (status === "PAID") return "border-green-200 bg-green-100 text-green-800";
  if (status === "PAYMENT_VERIFYING" || status === "PAYMENT_PENDING" || status === "UNPAID") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "PAYMENT_REJECTED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function errorText(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải dữ liệu";
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function progressOf(campaign: Campaign) {
  return campaign.targetResponses ? Math.min(100, campaign.approvedResponses / campaign.targetResponses * 100) : 0;
}

function remainingOf(campaign: Campaign) {
  return Math.max(campaign.targetResponses - campaign.approvedResponses, 0);
}

function isComplete(campaign: Campaign) {
  return campaign.targetResponses > 0 && remainingOf(campaign) === 0;
}

export function OwnerDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<CampaignPayment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("ATTENTION");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCampaigns(await campaignApi.myCampaigns());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const paidCampaigns = campaigns.filter(campaign => campaign.paymentStatus === "PAID");
    const incompletePaidCampaigns = paidCampaigns.filter(campaign => !isComplete(campaign));

    return {
      total: campaigns.length,
      active: campaigns.filter(campaign => campaign.status === "ACTIVE").length,
      waitingPayment: campaigns.filter(campaign => campaign.paymentStatus !== "PAID").length,
      paidCampaigns: paidCampaigns.length,
      incompletePaid: incompletePaidCampaigns.length,
      completedPaid: paidCampaigns.filter(isComplete).length,
      paidRewards: campaigns.reduce((sum, campaign) => sum + campaign.approvedResponses * campaign.rewardPerResponse, 0),
    };
  }, [campaigns]);

  const attentionCampaigns = useMemo(() => campaigns
    .filter(campaign => campaign.paymentStatus === "PAID")
    .slice()
    .sort((a, b) => {
      const aDone = isComplete(a);
      const bDone = isComplete(b);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return progressOf(a) - progressOf(b);
    })
    .slice(0, 5), [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const data = statusFilter === "ALL"
      ? [...campaigns]
      : campaigns.filter(campaign => campaign.status === statusFilter || campaign.paymentStatus === statusFilter);

    return data.sort((a, b) => {
      if (sortBy === "ATTENTION") {
        const aNeedsWork = a.paymentStatus === "PAID" && !isComplete(a);
        const bNeedsWork = b.paymentStatus === "PAID" && !isComplete(b);
        if (aNeedsWork !== bNeedsWork) return aNeedsWork ? -1 : 1;
        return progressOf(a) - progressOf(b);
      }
      if (sortBy === "PROGRESS_ASC") return progressOf(a) - progressOf(b);
      if (sortBy === "DEADLINE_ASC") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortBy === "RESPONSES_DESC") return b.approvedResponses - a.approvedResponses;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [campaigns, sortBy, statusFilter]);

  const openPayment = async (campaign: Campaign) => {
    setBusyId(campaign.id);
    try {
      const payment = await campaignApi.createPayment(campaign.id, {
        targetResponses: campaign.targetResponses,
        answerCount: campaign.answerCount,
        unitPricePerAnswer: campaign.unitPricePerAnswer,
      });

      setPaymentInfo(payment);
      if (payment.status === "PAID") {
        setPaymentDialogOpen(false);
        toast.success("Campaign này đã được xác nhận thanh toán.");
        await load();
        return;
      }

      setPaymentDialogOpen(true);
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  useEffect(() => {
    if (!paymentDialogOpen || !paymentInfo || paymentInfo.status === "PAID") return;

    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const updated = await campaignApi.payment(paymentInfo.id);
        if (cancelled) return;

        setPaymentInfo(updated);
        if (updated.status === "PAID") {
          toast.success("Thanh toán đã được SePay xác nhận tự động.");
          setPaymentDialogOpen(false);
          await load();
        }
      } catch {
        // Keep the dialog open; the user can still copy transfer details.
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [load, paymentDialogOpen, paymentInfo]);

  if (loading) return <CustomerDashboardSkeleton />;

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Campaign của tôi</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi thanh toán, tiến độ response và các campaign cần xử lý.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Tải lại</Button>
        <Button asChild className="bg-green-600 hover:bg-green-700"><Link to="/customer/post"><PlusCircle className="mr-2 h-4 w-4" />Tạo campaign</Link></Button>
      </div>
    </div>

    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <SummaryStrip stats={stats} />
    <CampaignFocusPanel campaigns={attentionCampaigns} />

    {paymentInfo && <Alert>
      <WalletCards className="h-4 w-4" />
      <AlertDescription>Thanh toán <strong>{paymentInfo.paymentCode}</strong> - trạng thái <strong>{paymentInfo.status}</strong> - {money(paymentInfo.totalAmount)}.</AlertDescription>
    </Alert>}

    <div className="flex flex-col gap-3 border-y border-slate-200 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="font-semibold text-slate-950">Danh sách campaign</h2>
        <p className="text-sm text-slate-500">Ưu tiên các campaign đã thanh toán nhưng chưa đủ response.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hiển thị</option>
          <option value="PENDING_REVIEW">Chờ xử lý</option>
          <option value="REJECTED">Bị từ chối</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="PAYMENT_VERIFYING">Chờ xác minh thanh toán</option>
        </select>
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={sortBy} onChange={event => setSortBy(event.target.value)}>
          <option value="ATTENTION">Cần chú ý trước</option>
          <option value="PROGRESS_ASC">Tiến độ thấp trước</option>
          <option value="RESPONSES_DESC">Nhiều response trước</option>
          <option value="DEADLINE_ASC">Gần hết hạn trước</option>
          <option value="UPDATED_DESC">Mới cập nhật</option>
        </select>
      </div>
    </div>

    {campaigns.length === 0 ? <EmptyState
      icon={<PlusCircle className="h-5 w-5" />}
      title="Chưa có campaign"
      description="Tạo campaign đầu tiên, thanh toán và theo dõi tiến độ response tại đây."
      action={<Button asChild className="bg-slate-900 text-white hover:bg-slate-800"><Link to="/customer/post">Tạo campaign đầu tiên</Link></Button>}
    /> :
      filteredCampaigns.length === 0 ? <EmptyState
        compact
        icon={<Target className="h-5 w-5" />}
        title="Không có campaign phù hợp"
        description="Thử đổi trạng thái hoặc cách sắp xếp để xem lại các campaign khác."
      /> :
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCampaigns.map(campaign => <CampaignCard
          key={campaign.id}
          campaign={campaign}
          busy={busyId === campaign.id}
          onOpenPayment={() => void openPayment(campaign)}
        />)}
      </div>}

    <PaymentDialog
      open={paymentDialogOpen}
      onOpenChange={setPaymentDialogOpen}
      paymentInfo={paymentInfo}
      onCopy={copy}
      onRefresh={() => paymentInfo && void campaignApi.payment(paymentInfo.id).then(updated => {
        setPaymentInfo(updated);
        if (updated.status === "PAID") {
          setPaymentDialogOpen(false);
          toast.success("Thanh toán đã được xác nhận.");
        }
      }).then(() => load())}
    />
  </div>;
}

function SummaryStrip({
  stats,
}: {
  stats: {
    total: number;
    active: number;
    waitingPayment: number;
    paidCampaigns: number;
    incompletePaid: number;
    completedPaid: number;
    paidRewards: number;
  };
}) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryItem label="Đang hiển thị" value={stats.active} helper={`${stats.total} campaign tổng`} />
    <SummaryItem label="Còn thiếu response" value={stats.incompletePaid} helper="Campaign đã thanh toán" tone="amber" />
    <SummaryItem label="Đạt chỉ tiêu" value={stats.completedPaid} helper={`${stats.paidCampaigns} campaign đã thanh toán`} tone="green" />
    <SummaryItem label="Đã trả thưởng" value={money(stats.paidRewards)} helper={`${stats.waitingPayment} campaign chờ thanh toán`} />
  </div>;
}

function SummaryItem({
  label,
  value,
  helper,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  helper: string;
  tone?: "slate" | "green" | "amber";
}) {
  const valueClass = tone === "green" ? "text-green-700" : tone === "amber" ? "text-amber-700" : "text-slate-950";

  return <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="text-sm text-slate-500">{label}</div>
    <div className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</div>
    <div className="mt-1 text-xs text-slate-500">{helper}</div>
  </div>;
}

function CampaignFocusPanel({ campaigns }: { campaigns: Campaign[] }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Target className="h-5 w-5 text-green-700" />
        Campaign cần chú ý
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {campaigns.length === 0 ? <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Chưa có campaign đã thanh toán để theo dõi tiến độ response.
      </div> : campaigns.map(campaign => {
        const progress = progressOf(campaign);
        const remaining = remainingOf(campaign);
        const complete = isComplete(campaign);

        return <div key={campaign.id} className="grid gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-950">{campaign.title}</div>
            <div className="mt-1 text-sm text-slate-500">{campaign.approvedResponses}/{campaign.targetResponses} response đã duyệt</div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>{Math.round(progress)}%</span>
              <span className={complete ? "text-green-700" : "text-amber-700"}>{complete ? "Đạt chỉ tiêu" : `Còn ${remaining}`}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <Button asChild size="sm" variant="outline" className="w-fit border-slate-300 font-semibold text-slate-900 hover:bg-slate-100">
            <Link to={`/customer/campaign/${campaign.id}`}>Chi tiết</Link>
          </Button>
        </div>;
      })}
    </CardContent>
  </Card>;
}

function CampaignCard({
  campaign,
  busy,
  onOpenPayment,
}: {
  campaign: Campaign;
  busy: boolean;
  onOpenPayment: () => void;
}) {
  const progress = progressOf(campaign);
  const remaining = remainingOf(campaign);
  const complete = isComplete(campaign);
  const needsPayment = campaign.paymentStatus !== "PAID";

  return <Card className="flex flex-col border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
    <CardHeader className="space-y-3 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="line-clamp-2 text-base text-slate-950">{campaign.title}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">{campaign.category} - hạn {new Date(campaign.deadline).toLocaleDateString("vi-VN")}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${campaignStatusClass(campaign.status)}`}>
          {statusLabels[campaign.status] || campaign.status}
        </Badge>
      </div>
      <Badge variant="outline" className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(campaign.paymentStatus)}`}>
        {paymentLabels[campaign.paymentStatus] || campaign.paymentStatus}
      </Badge>
    </CardHeader>
    <CardContent className="flex flex-1 flex-col gap-4 pt-0">
      <p className="line-clamp-2 text-sm leading-6 text-slate-600">{campaign.description}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">Tiến độ response</span>
          <span className={complete ? "font-semibold text-green-700" : "font-semibold text-amber-700"}>
            {complete ? "Đạt chỉ tiêu" : `Còn ${remaining}`}
          </span>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{campaign.approvedResponses}/{campaign.targetResponses} đã duyệt</span>
          <span>Thưởng {money(campaign.rewardPerResponse)}</span>
        </div>
      </div>

      {campaign.rejectReason && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Lý do: {campaign.rejectReason}</p>}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button size="sm" variant="outline" className="border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" asChild>
          <Link to={`/customer/campaign/${campaign.id}`}><ExternalLink className="mr-1 h-4 w-4" />Chi tiết</Link>
        </Button>
        {needsPayment && <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy} onClick={onOpenPayment}>
          <QrCode className="mr-1 h-4 w-4" />Mở QR
        </Button>}
      </div>
    </CardContent>
  </Card>;
}

function PaymentDialog({
  open,
  onOpenChange,
  paymentInfo,
  onCopy,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentInfo: CampaignPayment | null;
  onCopy: (value: string, label: string) => void;
  onRefresh: () => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Thanh toán campaign bằng mã QR</DialogTitle>
        <DialogDescription>Quét QR, chuyển đúng số tiền và nội dung. Hệ thống sẽ tự cập nhật khi SePay xác nhận giao dịch.</DialogDescription>
      </DialogHeader>
      {paymentInfo && <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <PaymentQrPreview qrImageUrl={paymentInfo.qrImageUrl} />
        <div className="space-y-3 text-sm">
          <PaymentLine label="Mã thanh toán" value={paymentInfo.paymentCode} onCopy={() => onCopy(paymentInfo.paymentCode, "mã thanh toán")} />
          <PaymentLine label="Số tiền" value={money(paymentInfo.totalAmount)} onCopy={() => onCopy(String(paymentInfo.totalAmount), "số tiền")} />
          <PaymentLine label="Ngân hàng" value={paymentInfo.bankName} />
          <PaymentLine label="Chủ tài khoản" value={paymentInfo.bankAccountName} />
          <PaymentLine label="Số tài khoản" value={paymentInfo.bankAccountNumber} onCopy={() => onCopy(paymentInfo.bankAccountNumber, "số tài khoản")} />
          <PaymentLine label="Nội dung chuyển khoản" value={paymentInfo.transferContent} onCopy={() => onCopy(paymentInfo.transferContent, "nội dung chuyển khoản")} />
          <PaymentLine label="Trạng thái" value={paymentInfo.status === "PAID" ? "Đã thanh toán" : "Đang chờ SePay xác nhận"} />
        </div>
      </div>}
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        <Button type="button" onClick={onRefresh} className="bg-green-600 hover:bg-green-700">Kiểm tra trạng thái</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function PaymentLine({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return <div className="rounded-md bg-gray-50 p-3">
    <div className="text-gray-500">{label}</div>
    <div className="mt-1 flex items-start justify-between gap-2">
      <strong className="break-all">{value || "-"}</strong>
      {onCopy && <Button type="button" size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0" onClick={onCopy} title={`Sao chép ${label}`}><Copy className="h-4 w-4" /></Button>}
    </div>
  </div>;
}

function PaymentQrPreview({ qrImageUrl }: { qrImageUrl?: string | null }) {
  if (!qrImageUrl) {
    return <div className="flex h-60 w-60 items-center justify-center rounded-lg border bg-white p-4">
      <div className="space-y-2 text-center text-sm text-gray-600">
        <QrCode className="mx-auto h-12 w-12 text-gray-400" />
        <p>Backend chưa cấu hình ảnh QR.</p>
        <p>Vẫn có thể chuyển khoản bằng thông tin bên cạnh.</p>
      </div>
    </div>;
  }

  return <div className="space-y-2">
    <div className="h-60 w-60 overflow-hidden rounded-lg border bg-white shadow-sm">
      <img
        src={qrImageUrl}
        alt="QR thanh toán SureVey"
        className="h-full w-full object-contain p-2"
      />
    </div>
    <a href={qrImageUrl} target="_blank" rel="noreferrer" className="block text-center text-xs text-blue-600 underline">Mở ảnh QR gốc</a>
  </div>;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>;
}

function MiniMetric({ label, value, tone = "default" }: { label: string; value: number | string; tone?: "default" | "success" | "warning" }) {
  const toneClass = tone === "success"
    ? "border-green-200 bg-green-50 text-green-800"
    : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-slate-50 text-slate-950";
  return <div className={`rounded-lg border p-3 ${toneClass}`}>
    <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</div>
    <div className="mt-1 text-lg font-bold">{value}</div>
  </div>;
}
