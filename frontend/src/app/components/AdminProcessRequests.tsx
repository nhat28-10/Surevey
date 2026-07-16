import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import type { AdminRevenueSummary, CampaignPayment } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { RefreshCw } from "lucide-react";

function text(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export function AdminProcessRequests() {
  const [payments, setPayments] = useState<CampaignPayment[]>([]);
  const [revenue, setRevenue] = useState<AdminRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentData, revenueData] = await Promise.all([
        adminApi.payments(),
        adminApi.revenueSummary(),
      ]);
      setPayments(paymentData);
      setRevenue(revenueData);
    } catch (err) {
      setError(text(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(text(err));
    } finally {
      setBusy("");
    }
  };

  if (loading) return <div className="py-16 text-center">Đang tải trạng thái thanh toán...</div>;

  return <div className="space-y-6">
    <div className="flex justify-between gap-3 items-center">
      <div>
        <h1 className="text-3xl font-bold">Theo dõi thanh toán</h1>
        <p className="text-gray-600 mt-1">Admin chỉ xem và xác minh thanh toán campaign. Campaign sẽ tự hiển thị cho collaborator sau khi thanh toán được xác minh.</p>
      </div>
      <Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Tải lại</Button>
    </div>

    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <div className="grid sm:grid-cols-3 gap-4">
      <Stat label="Tổng tiền đã xác minh" value={money(revenue?.totalPaidAmount || 0)} />
      <Stat label="Phí nền tảng" value={money(revenue?.totalPlatformFeeAmount || 0)} />
      <Stat label="Thanh toán chờ xác minh" value={revenue?.pendingVerifyPaymentCount || 0} />
    </div>

    {payments.length === 0 ? <Card><CardContent className="py-12 text-center text-gray-500">Chưa có thanh toán.</CardContent></Card> :
      <div className="space-y-3">{payments.map(payment => <Card key={payment.id}>
        <CardContent className="py-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong>{payment.paymentCode}</strong>
              <p className="text-sm text-gray-500">Campaign #{payment.campaignId} - Customer #{payment.customerId}</p>
            </div>
            <Badge variant="outline">{payment.status}</Badge>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <span>Tổng: <strong>{money(payment.totalAmount)}</strong></span>
            <span>Ngân sách: {money(payment.rewardBudget)}</span>
            <span>Phí: {money(payment.platformFeeAmount)}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <span>Ngân hàng: <strong>{payment.bankName}</strong></span>
            <span>Nội dung: <strong>{payment.transferContent}</strong></span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {payment.qrImageUrl && <a href={payment.qrImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Mở QR</a>}
            {payment.proofImageUrl && <a href={payment.proofImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Mở biên lai</a>}
          </div>
          {payment.rejectReason && <p className="text-red-600 text-sm">{payment.rejectReason}</p>}
          {payment.status === "PENDING_VERIFY" && <div className="flex gap-2">
            <Button disabled={busy === `p-${payment.id}`} onClick={() => void run(`p-${payment.id}`, () => adminApi.approvePayment(payment.id), "Đã xác minh thanh toán. Campaign đã được kích hoạt.")}>Xác minh đã thanh toán</Button>
            <Button variant="destructive" disabled={busy === `p-${payment.id}`} onClick={() => {
              const reason = window.prompt("Lý do từ chối:");
              if (reason?.trim()) void run(`p-${payment.id}`, () => adminApi.rejectPayment(payment.id, reason.trim()), "Đã từ chối thanh toán");
            }}>Từ chối</Button>
          </div>}
        </CardContent>
      </Card>)}</div>}
  </div>;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>;
}
