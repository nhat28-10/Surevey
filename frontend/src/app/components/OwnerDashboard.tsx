import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Calendar, Copy, ExternalLink, PlusCircle, QrCode, RefreshCw, WalletCards } from "lucide-react";

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

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === "ACTIVE").length,
    waitingPayment: campaigns.filter(c => c.paymentStatus !== "PAID").length,
    approved: campaigns.reduce((sum, c) => sum + c.approvedResponses, 0),
    paidRewards: campaigns.reduce((sum, c) => sum + c.approvedResponses * c.rewardPerResponse, 0),
  }), [campaigns]);

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
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Stat label="Tổng campaign" value={stats.total} />
      <Stat label="Đang hiển thị" value={stats.active} />
      <Stat label="Chờ thanh toán" value={stats.waitingPayment} />
      <Stat label="Phản hồi đã duyệt" value={stats.approved} />
      <Stat label="Đã trả thưởng" value={money(stats.paidRewards)} />
    </div>

    {paymentInfo && <Alert><WalletCards className="w-4 h-4" /><AlertDescription>Thanh toán <strong>{paymentInfo.paymentCode}</strong> - trạng thái <strong>{paymentInfo.status}</strong> - {money(paymentInfo.totalAmount)}.</AlertDescription></Alert>}

    {campaigns.length === 0 ? <Card><CardContent className="py-16 text-center"><p className="text-gray-600 mb-4">Chưa có campaign.</p><Button asChild><Link to="/customer/post">Tạo campaign đầu tiên</Link></Button></CardContent></Card> :
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{campaigns.map(campaign => {
        const progress = campaign.targetResponses ? Math.min(100, campaign.approvedResponses / campaign.targetResponses * 100) : 0;
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
