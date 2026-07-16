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
import { Calendar, ExternalLink, PlusCircle, RefreshCw, Send, WalletCards } from "lucide-react";

const statusLabels: Record<string, string> = {
  DRAFT: "Bản nháp", PENDING_REVIEW: "Chờ duyệt", ACTIVE: "Đang hoạt động", REJECTED: "Bị từ chối",
  PAUSED: "Tạm dừng", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy", EXPIRED: "Hết hạn",
};

function errorText(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải dữ liệu";
}

export function OwnerDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<CampaignPayment | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setCampaigns(await campaignApi.myCampaigns()); }
    catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === "ACTIVE").length,
    pending: campaigns.filter(c => c.status === "PENDING_REVIEW").length,
    approved: campaigns.reduce((sum, c) => sum + c.approvedResponses, 0),
    paidRewards: campaigns.reduce((sum, c) => sum + c.approvedResponses * c.rewardPerResponse, 0),
  }), [campaigns]);

  const pay = async (campaign: Campaign) => {
    setBusyId(campaign.id);
    try {
      const payment = await campaignApi.createPayment(campaign.id, {
        targetResponses: campaign.targetResponses,
        answerCount: campaign.answerCount,
        unitPricePerAnswer: campaign.unitPricePerAnswer,
      });
      setPaymentInfo(payment);
      const proof = window.prompt(
        `Mã thanh toán: ${payment.paymentCode}\nSố tiền: ${payment.totalAmount.toLocaleString("vi-VN")} đ\nNgân hàng: ${payment.bankName}\nSố tài khoản: ${payment.bankAccountNumber}\nNội dung: ${payment.transferContent}\n\nNhập URL ảnh biên lai để gửi xác minh:`,
        payment.proofImageUrl || "",
      );
      if (proof?.trim()) {
        const updated = await campaignApi.submitPaymentProof(payment.id, { proofImageUrl: proof.trim() });
        setPaymentInfo(updated);
        toast.success("Đã gửi chứng từ tới API WalletService");
      } else {
        toast.info("Đã tạo yêu cầu thanh toán; bạn có thể bấm lại để gửi chứng từ");
      }
      await load();
    } catch (err) { toast.error(errorText(err)); }
    finally { setBusyId(null); }
  };

  const submitReview = async (campaign: Campaign) => {
    setBusyId(campaign.id);
    try {
      await campaignApi.submitForReview(campaign.id);
      toast.success("Đã gửi campaign cho Admin duyệt");
      await load();
    } catch (err) { toast.error(errorText(err)); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className="py-16 text-center text-gray-600">Đang tải campaign từ SurveyService...</div>;

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-3xl font-bold">Campaign của tôi</h1><p className="text-gray-600 mt-1">Frontend dùng đúng các endpoint backend hiện có; không gọi API sửa, tạm dừng hoặc hủy vì backend chưa cung cấp.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2"/>Tải lại</Button><Button asChild className="bg-green-600 hover:bg-green-700"><Link to="/customer/post"><PlusCircle className="w-4 h-4 mr-2"/>Tạo campaign</Link></Button></div>
    </div>

    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[["Tổng campaign",stats.total],["Đang hoạt động",stats.active],["Chờ duyệt",stats.pending],["Phản hồi đã duyệt",stats.approved],["Đã trả thưởng",`${stats.paidRewards.toLocaleString("vi-VN")} đ`]].map(([label,value]) => <Card key={String(label)}><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>)}
    </div>

    {paymentInfo && <Alert><WalletCards className="w-4 h-4"/><AlertDescription>Thanh toán <strong>{paymentInfo.paymentCode}</strong> — trạng thái <strong>{paymentInfo.status}</strong> — {paymentInfo.totalAmount.toLocaleString("vi-VN")} đ.</AlertDescription></Alert>}

    {campaigns.length === 0 ? <Card><CardContent className="py-16 text-center"><p className="text-gray-600 mb-4">Chưa có campaign.</p><Button asChild><Link to="/customer/post">Tạo campaign đầu tiên</Link></Button></CardContent></Card> :
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{campaigns.map(campaign => {
        const progress = campaign.targetResponses ? Math.min(100, campaign.approvedResponses / campaign.targetResponses * 100) : 0;
        const canSubmitReview = campaign.paymentStatus === "PAID" && ["DRAFT","REJECTED"].includes(campaign.status);
        return <Card key={campaign.id} className="flex flex-col"><CardHeader><div className="flex items-start justify-between gap-2"><CardTitle className="text-lg">{campaign.title}</CardTitle><Badge variant="outline">{statusLabels[campaign.status] || campaign.status}</Badge></div></CardHeader><CardContent className="space-y-4 flex-1 flex flex-col">
          <p className="text-sm text-gray-600 line-clamp-3">{campaign.description}</p>
          <div><div className="flex justify-between text-sm mb-1"><span>{campaign.approvedResponses}/{campaign.targetResponses}</span><span>{Math.round(progress)}%</span></div><Progress value={progress}/></div>
          <div className="text-sm space-y-1"><p>Thưởng: <strong>{campaign.rewardPerResponse.toLocaleString("vi-VN")} đ</strong></p><p className="flex items-center gap-1"><Calendar className="w-4 h-4"/>{new Date(campaign.deadline).toLocaleDateString("vi-VN")}</p><p>Thanh toán: <strong>{campaign.paymentStatus}</strong></p>{campaign.rejectReason && <p className="text-red-600">Lý do: {campaign.rejectReason}</p>}</div>
          <div className="mt-auto flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><Link to={`/customer/campaign/${campaign.id}`}><ExternalLink className="w-4 h-4 mr-1"/>Chi tiết</Link></Button>
            {campaign.paymentStatus !== "PAID" && <Button size="sm" disabled={busyId===campaign.id} onClick={() => void pay(campaign)}><WalletCards className="w-4 h-4 mr-1"/>Thanh toán</Button>}
            {canSubmitReview && <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={busyId===campaign.id} onClick={() => void submitReview(campaign)}><Send className="w-4 h-4 mr-1"/>Gửi duyệt</Button>}
          </div>
        </CardContent></Card>;
      })}</div>}
  </div>;
}
