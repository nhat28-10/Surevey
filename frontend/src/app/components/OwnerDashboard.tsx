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
import { Activity, Calendar, CheckCircle2, Copy, ExternalLink, PlusCircle, QrCode, RefreshCw, Target, Users, WalletCards } from "lucide-react";
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

export function OwnerDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<CampaignPayment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("UPDATED_DESC");

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
    const paidCampaigns = campaigns.filter(c => c.paymentStatus === "PAID");

    return {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === "ACTIVE").length,
      waitingPayment: campaigns.filter(c => c.paymentStatus !== "PAID").length,
      approved: campaigns.reduce((sum, c) => sum + c.approvedResponses, 0),
      paidRewards: campaigns.reduce((sum, c) => sum + c.approvedResponses * c.rewardPerResponse, 0),
      paidCampaigns: paidCampaigns.length,
      targetResponses: paidCampaigns.reduce((sum, c) => sum + c.targetResponses, 0),
      paidApprovedResponses: paidCampaigns.reduce((sum, c) => sum + c.approvedResponses, 0),
      remainingResponses: paidCampaigns.reduce((sum, c) => sum + Math.max(c.targetResponses - c.approvedResponses, 0), 0),
      completedCampaigns: paidCampaigns.filter(c => c.targetResponses > 0 && c.approvedResponses >= c.targetResponses).length,
      paidBudget: paidCampaigns.reduce((sum, c) => sum + c.totalAmount, 0),
    };
  }, [campaigns]);

  const overallProgress = stats.targetResponses > 0
    ? Math.min(100, stats.paidApprovedResponses / stats.targetResponses * 100)
    : 0;

  const filteredCampaigns = useMemo(() => {
    const data = statusFilter === "ALL"
      ? [...campaigns]
      : campaigns.filter(c => c.status === statusFilter || c.paymentStatus === statusFilter);

    return data.sort((a, b) => {
      if (sortBy === "PROGRESS_ASC") {
        const aProgress = a.targetResponses ? a.approvedResponses / a.targetResponses : 0;
        const bProgress = b.targetResponses ? b.approvedResponses / b.targetResponses : 0;
        return aProgress - bProgress;
      }
      if (sortBy === "DEADLINE_ASC") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortBy === "RESPONSES_DESC") return b.approvedResponses - a.approvedResponses;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [campaigns, sortBy, statusFilter]);

  const recentActivities = useMemo(() => campaigns
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5), [campaigns]);

  const openPayment = async (campaign: Campaign) => {
    setBusyId(campaign.id);
    try {
      const payment = await campaignApi.createPayment(campaign.id, {
        targetResponses: campaign.targetResponses,
        answerCount: campaign.answerCount,
        unitPricePerAnswer: campaign.unitPricePerAnswer,
      });
      setPaymentInfo(payment);
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

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold">Campaign của tôi</h1>
        <p className="text-gray-600 mt-1">Tạo campaign, mở mã QR thanh toán và theo dõi trạng thái hiển thị trên marketplace.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Tải lại</Button>
        <Button asChild className="bg-green-600 hover:bg-green-700"><Link to="/customer/post"><PlusCircle className="w-4 h-4 mr-2" />Tạo campaign</Link></Button>
      </div>
    </div>

    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <ProgressOverview
      approved={stats.paidApprovedResponses}
      target={stats.targetResponses}
      remaining={stats.remainingResponses}
      completedCampaigns={stats.completedCampaigns}
      totalCampaigns={stats.paidCampaigns}
      paidBudget={stats.paidBudget}
      progress={overallProgress}
    />

    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Stat label="Tổng campaign" value={stats.total} />
      <Stat label="Đang hiển thị" value={stats.active} />
      <Stat label="Chờ thanh toán" value={stats.waitingPayment} />
      <Stat label="Phản hồi đã duyệt" value={stats.approved} />
      <Stat label="Đã trả thưởng" value={money(stats.paidRewards)} />
    </div>

    <RecentCampaignActivity campaigns={recentActivities} />

    {paymentInfo && <Alert><WalletCards className="w-4 h-4" /><AlertDescription>Thanh toán <strong>{paymentInfo.paymentCode}</strong> - trạng thái <strong>{paymentInfo.status}</strong> - {money(paymentInfo.totalAmount)}.</AlertDescription></Alert>}

    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Quản lý campaign</h2>
          <p className="text-sm text-gray-500">Lọc theo trạng thái và ưu tiên campaign cần xử lý trước.</p>
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
            <option value="UPDATED_DESC">Mới cập nhật</option>
            <option value="PROGRESS_ASC">Tiến độ thấp trước</option>
            <option value="RESPONSES_DESC">Nhiều response trước</option>
            <option value="DEADLINE_ASC">Gần hết hạn trước</option>
          </select>
        </div>
      </CardContent>
    </Card>

    {campaigns.length === 0 ? <EmptyState
      icon={<PlusCircle className="h-5 w-5" />}
      title="Chưa có campaign"
      description="Tạo campaign đầu tiên, nhập mục tiêu response và mở QR thanh toán để campaign có thể xuất hiện trên marketplace."
      action={<Button asChild className="bg-slate-900 text-white hover:bg-slate-800"><Link to="/customer/post">Tạo campaign đầu tiên</Link></Button>}
    /> :
      filteredCampaigns.length === 0 ? <EmptyState
        compact
        icon={<Target className="h-5 w-5" />}
        title="Không có campaign phù hợp"
        description="Thử đổi trạng thái hoặc cách sắp xếp để xem lại các campaign khác."
      /> :
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{filteredCampaigns.map(campaign => {
        const progress = campaign.targetResponses ? Math.min(100, campaign.approvedResponses / campaign.targetResponses * 100) : 0;
        const remainingResponses = Math.max(campaign.targetResponses - campaign.approvedResponses, 0);
        const isComplete = campaign.targetResponses > 0 && campaign.approvedResponses >= campaign.targetResponses;
        const needsPayment = campaign.paymentStatus !== "PAID";
        return <Card key={campaign.id} className="flex flex-col overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-slate-950">{campaign.title}</CardTitle>
                <p className="mt-1 text-xs text-slate-500">{campaign.category} - hạn {new Date(campaign.deadline).toLocaleDateString("vi-VN")}</p>
              </div>
              <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${campaignStatusClass(campaign.status)}`}>{statusLabels[campaign.status] || campaign.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col p-4">
            <p className="text-sm text-slate-600 line-clamp-3">{campaign.description}</p>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex justify-between text-sm mb-2"><span className="font-medium text-slate-700">Tiến độ response</span><span className="font-semibold text-slate-950">{Math.round(progress)}%</span></div>
              <Progress value={progress} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <MiniMetric label="Đã duyệt" value={campaign.approvedResponses} />
              <MiniMetric label="Còn thiếu" value={remainingResponses} tone={isComplete ? "success" : "warning"} />
              <MiniMetric label="Mục tiêu" value={campaign.targetResponses} />
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Thưởng</span>
                <strong className="text-slate-950">{money(campaign.rewardPerResponse)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Thanh toán</span>
                <Badge variant="outline" className={`rounded-full border px-2 py-0.5 ${paymentStatusClass(campaign.paymentStatus)}`}>{paymentLabels[campaign.paymentStatus] || campaign.paymentStatus}</Badge>
              </div>
              {campaign.rejectReason && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Lý do: {campaign.rejectReason}</p>}
            </div>
            <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button size="sm" variant="outline" className="border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" asChild><Link to={`/customer/campaign/${campaign.id}`}><ExternalLink className="w-4 h-4 mr-1" />Chi tiết</Link></Button>
              {needsPayment && <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busyId === campaign.id} onClick={() => void openPayment(campaign)}><QrCode className="w-4 h-4 mr-1" />Mở QR thanh toán</Button>}
            </div>
          </CardContent>
        </Card>;
      })}</div>}

    <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thanh toán campaign bằng mã QR</DialogTitle>
          <DialogDescription>Quét QR, chuyển đúng số tiền và nội dung. Hệ thống sẽ tự cập nhật khi SePay xác nhận giao dịch.</DialogDescription>
        </DialogHeader>
        {paymentInfo && <div className="grid md:grid-cols-[240px_1fr] gap-5">
          <PaymentQrPreview qrImageUrl={paymentInfo.qrImageUrl} />
          <div className="space-y-3 text-sm">
            <PaymentLine label="Mã thanh toán" value={paymentInfo.paymentCode} onCopy={() => void copy(paymentInfo.paymentCode, "mã thanh toán")} />
            <PaymentLine label="Số tiền" value={money(paymentInfo.totalAmount)} onCopy={() => void copy(String(paymentInfo.totalAmount), "số tiền")} />
            <PaymentLine label="Ngân hàng" value={paymentInfo.bankName} />
            <PaymentLine label="Chủ tài khoản" value={paymentInfo.bankAccountName} />
            <PaymentLine label="Số tài khoản" value={paymentInfo.bankAccountNumber} onCopy={() => void copy(paymentInfo.bankAccountNumber, "số tài khoản")} />
            <PaymentLine label="Nội dung chuyển khoản" value={paymentInfo.transferContent} onCopy={() => void copy(paymentInfo.transferContent, "nội dung chuyển khoản")} />
            <PaymentLine label="Trạng thái" value={paymentInfo.status === "PAID" ? "Đã thanh toán" : "Đang chờ SePay xác nhận"} />
          </div>
        </div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Đóng</Button>
          <Button type="button" onClick={() => paymentInfo && void campaignApi.payment(paymentInfo.id).then(setPaymentInfo).then(() => load())} className="bg-green-600 hover:bg-green-700">Kiểm tra trạng thái</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function ProgressOverview({
  approved,
  target,
  remaining,
  completedCampaigns,
  totalCampaigns,
  paidBudget,
  progress,
}: {
  approved: number;
  target: number;
  remaining: number;
  completedCampaigns: number;
  totalCampaigns: number;
  paidBudget: number;
  progress: number;
}) {
  return <Card className="overflow-hidden border-green-100">
    <CardHeader className="bg-green-50/70">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-green-700" />
            Tiến độ response đã đặt
          </CardTitle>
          <p className="mt-1 text-sm text-gray-600">
            Tính theo số response đã duyệt trên tổng số response Customer đặt khi tạo và thanh toán campaign.
          </p>
        </div>
        <div className="rounded-md bg-white px-4 py-2 text-right shadow-sm">
          <div className="text-sm text-gray-500">Hoàn thành</div>
          <div className="text-2xl font-bold text-green-700">{Math.round(progress)}%</div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-5 pt-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">{approved}/{target} response đã duyệt</span>
          <span className={remaining === 0 && target > 0 ? "text-green-700" : "text-orange-700"}>
            {target === 0 ? "Chưa có mục tiêu" : remaining === 0 ? "Đã đạt mục tiêu" : `Còn ${remaining} response để đạt 100%`}
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressMetric icon={<Users className="h-4 w-4" />} label="Response mục tiêu" value={target} />
        <ProgressMetric icon={<CheckCircle2 className="h-4 w-4" />} label="Response đã duyệt" value={approved} />
        <ProgressMetric icon={<Target className="h-4 w-4" />} label="Response còn thiếu" value={remaining} />
        <ProgressMetric icon={<WalletCards className="h-4 w-4" />} label="Ngân sách đã thanh toán" value={money(paidBudget)} />
      </div>

      <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
        {completedCampaigns}/{totalCampaigns} campaign đã đạt đủ số response mục tiêu.
      </div>
    </CardContent>
  </Card>;
}

function ProgressMetric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return <div className="rounded-md border bg-white p-3">
    <div className="flex items-center gap-2 text-sm text-gray-500">{icon}{label}</div>
    <div className="mt-2 text-xl font-semibold text-gray-900">{value}</div>
  </div>;
}

function RecentCampaignActivity({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) return null;

  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Activity className="h-5 w-5 text-blue-600" />
        Hoạt động gần đây
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {campaigns.map(campaign => {
        const progress = campaign.targetResponses ? Math.min(100, campaign.approvedResponses / campaign.targetResponses * 100) : 0;
        return <div key={campaign.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">{campaign.title}</div>
            <div className="text-sm text-gray-500">
              Cập nhật {new Date(campaign.updatedAt).toLocaleString("vi-VN")} - {campaign.approvedResponses}/{campaign.targetResponses} response
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{statusLabels[campaign.status] || campaign.status}</Badge>
            <span className="text-sm font-semibold text-gray-700">{Math.round(progress)}%</span>
          </div>
        </div>;
      })}
    </CardContent>
  </Card>;
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

function PaymentLine({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return <div className="rounded-md bg-gray-50 p-3">
    <div className="text-gray-500">{label}</div>
    <div className="mt-1 flex items-start justify-between gap-2">
      <strong className="break-all">{value || "-"}</strong>
      {onCopy && <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={onCopy} title={`Sao chép ${label}`}><Copy className="w-4 h-4" /></Button>}
    </div>
  </div>;
}

function PaymentQrPreview({ qrImageUrl }: { qrImageUrl?: string | null }) {
  if (!qrImageUrl) {
    return <div className="h-60 w-60 rounded-lg border bg-white p-4 flex items-center justify-center">
      <div className="text-center text-sm text-gray-600 space-y-2">
        <QrCode className="w-12 h-12 mx-auto text-gray-400" />
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
