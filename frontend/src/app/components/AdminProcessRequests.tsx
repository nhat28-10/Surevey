import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import type { AdminRevenueSummary, Campaign, CampaignPayment, Withdrawal } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CheckCircle2, Clock, ClipboardList, RefreshCw, WalletCards } from "lucide-react";

function text(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export function AdminProcessRequests() {
  const [payments, setPayments] = useState<CampaignPayment[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [revenue, setRevenue] = useState<AdminRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [withdrawalFilter, setWithdrawalFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentData, campaignData, withdrawalData, revenueData] = await Promise.all([
        adminApi.payments(),
        adminApi.pendingCampaigns(),
        adminApi.withdrawals(),
        adminApi.revenueSummary(),
      ]);
      setPayments(paymentData);
      setCampaigns(campaignData);
      setWithdrawals(withdrawalData);
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

  const visiblePayments = useMemo(() => paymentFilter === "ALL" ? payments : payments.filter(p => p.status === paymentFilter), [paymentFilter, payments]);
  const visibleWithdrawals = useMemo(() => withdrawalFilter === "ALL" ? withdrawals : withdrawals.filter(w => w.status === withdrawalFilter), [withdrawalFilter, withdrawals]);
  const pendingPayments = payments.filter(p => p.status === "PENDING_VERIFY").length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "PENDING").length;
  const approvedWithdrawals = withdrawals.filter(w => w.status === "APPROVED").length;
  const paidPayments = payments.filter(p => p.status === "PAID").length;
  const rejectedPayments = payments.filter(p => p.status === "REJECTED").length;
  const pendingCampaignResponses = campaigns.reduce((sum, campaign) => sum + campaign.targetResponses, 0);
  const pendingCampaignBudget = campaigns.reduce((sum, campaign) => sum + campaign.totalAmount, 0);
  const pendingWithdrawalAmount = withdrawals
    .filter(withdrawal => withdrawal.status === "PENDING" || withdrawal.status === "APPROVED")
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  if (loading) return <div className="py-16 text-center">Đang tải dashboard quản trị...</div>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard quản trị</h1>
        <p className="text-gray-600 mt-1">Theo dõi các việc cần duyệt: thanh toán, campaign và yêu cầu rút tiền.</p>
      </div>
      <Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Tải lại</Button>
    </div>

    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <AdminOverviewColumns
      totalPaidAmount={revenue?.totalPaidAmount || 0}
      platformFeeAmount={revenue?.totalPlatformFeeAmount || 0}
      pendingPayments={pendingPayments}
      paidPayments={paidPayments}
      rejectedPayments={rejectedPayments}
      pendingCampaigns={campaigns.length}
      pendingCampaignResponses={pendingCampaignResponses}
      pendingCampaignBudget={pendingCampaignBudget}
      pendingWithdrawals={pendingWithdrawals}
      approvedWithdrawals={approvedWithdrawals}
      pendingWithdrawalAmount={pendingWithdrawalAmount}
    />

    <Tabs defaultValue="payments">
      <TabsList>
        <TabsTrigger value="payments">Thanh toán</TabsTrigger>
        <TabsTrigger value="campaigns">Campaign</TabsTrigger>
        <TabsTrigger value="withdrawals">Rút tiền</TabsTrigger>
      </TabsList>

      <TabsContent value="payments" className="space-y-3 mt-4">
        <div className="flex justify-end">
          <select className="h-10 rounded-md border bg-white px-3 text-sm" value={paymentFilter} onChange={event => setPaymentFilter(event.target.value)}>
            <option value="ALL">Tất cả thanh toán</option>
            <option value="PENDING_VERIFY">Chờ xác minh</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        {visiblePayments.length === 0 ? <Empty text="Không có thanh toán phù hợp." /> : visiblePayments.map(payment => <Card key={payment.id}>
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
              <Button disabled={busy === `p-${payment.id}`} onClick={() => void run(`p-${payment.id}`, () => adminApi.approvePayment(payment.id), "Đã xác minh thanh toán.")}>Xác minh đã thanh toán</Button>
              <Button variant="destructive" disabled={busy === `p-${payment.id}`} onClick={() => {
                const reason = window.prompt("Lý do từ chối:");
                if (reason?.trim()) void run(`p-${payment.id}`, () => adminApi.rejectPayment(payment.id, reason.trim()), "Đã từ chối thanh toán");
              }}>Từ chối</Button>
            </div>}
            {payment.status === "PAID" && <Button variant="outline" disabled={busy === `sync-${payment.id}`} onClick={() => void run(`sync-${payment.id}`, () => adminApi.approvePayment(payment.id), "Đã đồng bộ campaign sang marketplace.")}>Đồng bộ campaign</Button>}
          </CardContent>
        </Card>)}
      </TabsContent>

      <TabsContent value="campaigns" className="space-y-3 mt-4">
        {campaigns.length === 0 ? <Empty text="Không có campaign chờ duyệt." /> : campaigns.map(campaign => <Card key={campaign.id}>
          <CardContent className="py-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <strong>{campaign.title}</strong>
                <p className="text-sm text-gray-500">Customer #{campaign.customerId} - {campaign.targetResponses} response - {money(campaign.totalAmount)}</p>
              </div>
              <Badge variant="outline">{campaign.status}</Badge>
            </div>
            <p className="text-sm text-gray-600">{campaign.description}</p>
            <div className="flex flex-wrap gap-2">
              {campaign.googleFormUrl && <Button size="sm" variant="outline" type="button" onClick={() => window.open(campaign.googleFormUrl!, "_blank", "noopener,noreferrer")}>Mở form</Button>}
              <Button size="sm" disabled={busy === `c-${campaign.id}`} onClick={() => void run(`c-${campaign.id}`, () => adminApi.approveCampaign(campaign.id), "Đã duyệt campaign.")}>Duyệt campaign</Button>
              <Button size="sm" variant="destructive" disabled={busy === `c-${campaign.id}`} onClick={() => {
                const reason = window.prompt("Lý do từ chối:");
                if (reason?.trim()) void run(`c-${campaign.id}`, () => adminApi.rejectCampaign(campaign.id, reason.trim()), "Đã từ chối campaign");
              }}>Từ chối</Button>
            </div>
          </CardContent>
        </Card>)}
      </TabsContent>

      <TabsContent value="withdrawals" className="space-y-3 mt-4">
        <div className="flex justify-end">
          <select className="h-10 rounded-md border bg-white px-3 text-sm" value={withdrawalFilter} onChange={event => setWithdrawalFilter(event.target.value)}>
            <option value="ALL">Tất cả yêu cầu</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt, chờ trả</option>
            <option value="PAID">Đã trả</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
        </div>
        {visibleWithdrawals.length === 0 ? <Empty text="Không có yêu cầu rút tiền phù hợp." /> : visibleWithdrawals.map(withdrawal => <Card key={withdrawal.id}>
          <CardContent className="py-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong>{money(withdrawal.amount)}</strong>
                <p className="text-sm text-gray-500">Collaborator #{withdrawal.collaboratorId} - {new Date(withdrawal.requestedAt).toLocaleString("vi-VN")}</p>
              </div>
              <Badge variant="outline">{withdrawal.status}</Badge>
            </div>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              <span>Ngân hàng: <strong>{withdrawal.bankName}</strong></span>
              <span>Chủ TK: <strong>{withdrawal.bankAccountName}</strong></span>
              <span>Số TK: <strong>{withdrawal.bankAccountNumber}</strong></span>
            </div>
            {withdrawal.rejectReason && <p className="text-sm text-red-600">{withdrawal.rejectReason}</p>}
            {withdrawal.status === "PENDING" && <div className="flex gap-2">
              <Button size="sm" disabled={busy === `w-${withdrawal.id}`} onClick={() => void run(`w-${withdrawal.id}`, () => adminApi.approveWithdrawal(withdrawal.id), "Đã duyệt yêu cầu rút tiền.")}>Duyệt</Button>
              <Button size="sm" variant="destructive" disabled={busy === `w-${withdrawal.id}`} onClick={() => {
                const reason = window.prompt("Lý do từ chối:");
                if (reason?.trim()) void run(`w-${withdrawal.id}`, () => adminApi.rejectWithdrawal(withdrawal.id, reason.trim()), "Đã từ chối yêu cầu rút tiền");
              }}>Từ chối</Button>
            </div>}
            {withdrawal.status === "APPROVED" && <Button size="sm" disabled={busy === `paid-${withdrawal.id}`} onClick={() => void run(`paid-${withdrawal.id}`, () => adminApi.markWithdrawalPaid(withdrawal.id), "Đã đánh dấu đã chuyển tiền.")}>Đánh dấu đã chuyển tiền</Button>}
          </CardContent>
        </Card>)}
      </TabsContent>
    </Tabs>
  </div>;
}

function AdminOverviewColumns({
  totalPaidAmount,
  platformFeeAmount,
  pendingPayments,
  paidPayments,
  rejectedPayments,
  pendingCampaigns,
  pendingCampaignResponses,
  pendingCampaignBudget,
  pendingWithdrawals,
  approvedWithdrawals,
  pendingWithdrawalAmount,
}: {
  totalPaidAmount: number;
  platformFeeAmount: number;
  pendingPayments: number;
  paidPayments: number;
  rejectedPayments: number;
  pendingCampaigns: number;
  pendingCampaignResponses: number;
  pendingCampaignBudget: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  pendingWithdrawalAmount: number;
}) {
  return <div className="grid gap-4 xl:grid-cols-4">
    <OperationColumn
      icon={<WalletCards className="h-5 w-5" />}
      title="Thanh toán"
      description="Theo dõi giao dịch campaign cần xác minh."
      tone="green"
      rows={[
        ["Chờ xác minh", pendingPayments],
        ["Đã xác minh", paidPayments],
        ["Bị từ chối", rejectedPayments],
      ]}
    />
    <OperationColumn
      icon={<ClipboardList className="h-5 w-5" />}
      title="Campaign"
      description="Campaign đang chờ kiểm tra trước khi lên marketplace."
      tone="blue"
      rows={[
        ["Chờ duyệt", pendingCampaigns],
        ["Response mục tiêu", pendingCampaignResponses],
        ["Giá trị chờ duyệt", money(pendingCampaignBudget)],
      ]}
    />
    <OperationColumn
      icon={<CheckCircle2 className="h-5 w-5" />}
      title="Rút tiền"
      description="Yêu cầu rút tiền cần duyệt hoặc đánh dấu đã chuyển."
      tone="orange"
      rows={[
        ["Chờ duyệt", pendingWithdrawals],
        ["Đã duyệt, chờ trả", approvedWithdrawals],
        ["Tổng tiền cần xử lý", money(pendingWithdrawalAmount)],
      ]}
    />
    <OperationColumn
      icon={<Clock className="h-5 w-5" />}
      title="Doanh thu"
      description="Số liệu tổng hợp từ các thanh toán đã xác minh."
      tone="slate"
      rows={[
        ["Tổng tiền đã xác minh", money(totalPaidAmount)],
        ["Phí nền tảng", money(platformFeeAmount)],
        ["Tỷ lệ phí thực tế", totalPaidAmount > 0 ? `${Math.round(platformFeeAmount / totalPaidAmount * 100)}%` : "0%"],
      ]}
    />
  </div>;
}

function OperationColumn({
  icon,
  title,
  description,
  tone,
  rows,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone: "green" | "blue" | "orange" | "slate";
  rows: Array<[string, number | string]>;
}) {
  const toneClass = {
    green: "bg-green-50 text-green-700 border-green-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  }[tone];

  return <Card className="overflow-hidden">
    <CardHeader className={`${toneClass} border-b`}>
      <CardTitle className="flex items-center gap-2 text-base">
        {icon}
        {title}
      </CardTitle>
      <p className="text-sm font-normal text-gray-600">{description}</p>
    </CardHeader>
    <CardContent className="divide-y p-0">
      {rows.map(([label, value]) => <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
        <span className="text-sm text-gray-600">{label}</span>
        <strong className="text-right text-sm text-gray-900">{value}</strong>
      </div>)}
    </CardContent>
  </Card>;
}

function Empty({ text }: { text: string }) {
  return <Card><CardContent className="py-12 text-center text-gray-500">{text}</CardContent></Card>;
}
