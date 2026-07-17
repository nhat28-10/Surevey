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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Activity, Calendar, CheckCircle2, Copy, ExternalLink, PlusCircle, QrCode, RefreshCw, Target, Users, WalletCards } from "lucide-react";

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
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
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
      setProofImageUrl(payment.proofImageUrl || "");
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

  const submitProof = async () => {
    if (!paymentInfo || !proofImageUrl.trim()) {
      toast.error("Vui lòng nhập URL ảnh biên lai trước khi gửi xác minh");
      return;
    }

    setSubmittingProof(true);
    try {
      const updated = await campaignApi.submitPaymentProof(paymentInfo.id, { proofImageUrl: proofImageUrl.trim() });
      setPaymentInfo(updated);
      toast.success("Đã gửi biên lai. Admin sẽ xác minh trạng thái thanh toán.");
      setPaymentDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-600">Đang tải campaign...</div>;

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

    <Card>
      <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">Quản lý campaign</h2>
          <p className="text-sm text-gray-500">Lọc theo trạng thái và ưu tiên campaign cần xử lý trước.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className="h-10 rounded-md border bg-white px-3 text-sm" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiển thị</option>
            <option value="PENDING_REVIEW">Chờ xử lý</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PAYMENT_VERIFYING">Chờ xác minh thanh toán</option>
          </select>
          <select className="h-10 rounded-md border bg-white px-3 text-sm" value={sortBy} onChange={event => setSortBy(event.target.value)}>
            <option value="UPDATED_DESC">Mới cập nhật</option>
            <option value="PROGRESS_ASC">Tiến độ thấp trước</option>
            <option value="RESPONSES_DESC">Nhiều response trước</option>
            <option value="DEADLINE_ASC">Gần hết hạn trước</option>
          </select>
        </div>
      </CardContent>
    </Card>

    {campaigns.length === 0 ? <Card><CardContent className="py-16 text-center"><p className="text-gray-600 mb-4">Chưa có campaign.</p><Button asChild><Link to="/customer/post">Tạo campaign đầu tiên</Link></Button></CardContent></Card> :
      filteredCampaigns.length === 0 ? <Card><CardContent className="py-12 text-center text-gray-500">Không có campaign phù hợp với bộ lọc hiện tại.</CardContent></Card> :
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{filteredCampaigns.map(campaign => {
        const progress = campaign.targetResponses ? Math.min(100, campaign.approvedResponses / campaign.targetResponses * 100) : 0;
        const remainingResponses = Math.max(campaign.targetResponses - campaign.approvedResponses, 0);
        const isComplete = campaign.targetResponses > 0 && campaign.approvedResponses >= campaign.targetResponses;
        const needsPayment = campaign.paymentStatus !== "PAID";
        return <Card key={campaign.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">{campaign.title}</CardTitle>
              <Badge variant="outline">{statusLabels[campaign.status] || campaign.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <p className="text-sm text-gray-600 line-clamp-3">{campaign.description}</p>
            <div><div className="flex justify-between text-sm mb-1"><span>{campaign.approvedResponses}/{campaign.targetResponses}</span><span>{Math.round(progress)}%</span></div><Progress value={progress} /></div>
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-gray-50 p-3 text-center text-xs">
              <div>
                <div className="text-gray-500">Đã duyệt</div>
                <div className="mt-1 text-base font-semibold text-gray-900">{campaign.approvedResponses}</div>
              </div>
              <div>
                <div className="text-gray-500">Còn thiếu</div>
                <div className={`mt-1 text-base font-semibold ${isComplete ? "text-green-700" : "text-orange-700"}`}>{remainingResponses}</div>
              </div>
              <div>
                <div className="text-gray-500">Mục tiêu</div>
                <div className="mt-1 text-base font-semibold text-gray-900">{campaign.targetResponses}</div>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p>Thưởng: <strong>{money(campaign.rewardPerResponse)}</strong></p>
              <p className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(campaign.deadline).toLocaleDateString("vi-VN")}</p>
              <p>Thanh toán: <strong>{paymentLabels[campaign.paymentStatus] || campaign.paymentStatus}</strong></p>
              {campaign.rejectReason && <p className="text-red-600">Lý do: {campaign.rejectReason}</p>}
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild><Link to={`/customer/campaign/${campaign.id}`}><ExternalLink className="w-4 h-4 mr-1" />Chi tiết</Link></Button>
              {needsPayment && <Button size="sm" disabled={busyId === campaign.id} onClick={() => void openPayment(campaign)}><QrCode className="w-4 h-4 mr-1" />Mở QR thanh toán</Button>}
            </div>
          </CardContent>
        </Card>;
      })}</div>}

    <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thanh toán campaign bằng mã QR</DialogTitle>
          <DialogDescription>Quét QR của hệ thống, chuyển đúng số tiền và nội dung, sau đó gửi URL ảnh biên lai để xác minh.</DialogDescription>
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
          </div>
        </div>}
        <div className="space-y-2">
          <Label htmlFor="proofImageUrl">URL ảnh biên lai *</Label>
          <Input id="proofImageUrl" value={proofImageUrl} onChange={event => setProofImageUrl(event.target.value)} placeholder="https://..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Đóng</Button>
          <Button onClick={() => void submitProof()} disabled={submittingProof} className="bg-green-600 hover:bg-green-700">{submittingProof ? "Đang gửi..." : "Gửi xác minh"}</Button>
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
        alt="QR thanh toán SureSurvey"
        className="h-full w-full scale-[1.24] object-cover [object-position:center_41%]"
      />
    </div>
    <a href={qrImageUrl} target="_blank" rel="noreferrer" className="block text-center text-xs text-blue-600 underline">Mở ảnh QR gốc</a>
  </div>;
}
