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
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function text(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function paymentStatusText(status: string) {
  if (status === "PAID") return "Đã thanh toán";
  if (status === "PENDING_VERIFY") return "Chờ xác minh";
  if (status === "PENDING") return "Chờ xử lý";
  if (status === "REJECTED") return "Bị từ chối";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

function paymentStatusClass(status: string) {
  if (status === "PAID") return "border-green-200 bg-green-100 text-green-800";
  if (status === "PENDING_VERIFY" || status === "PENDING") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "REJECTED" || status === "CANCELLED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function campaignStatusText(status: string) {
  if (status === "PENDING_REVIEW") return "Chờ duyệt";
  if (status === "ACTIVE") return "Đang hiển thị";
  if (status === "REJECTED") return "Bị từ chối";
  if (status === "COMPLETED") return "Hoàn thành";
  if (status === "DRAFT") return "Bản nháp";
  return status;
}

function campaignStatusClass(status: string) {
  if (status === "PENDING_REVIEW") return "border-blue-200 bg-blue-100 text-blue-800";
  if (status === "ACTIVE" || status === "COMPLETED") return "border-green-200 bg-green-100 text-green-800";
  if (status === "REJECTED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function withdrawalStatusText(status: string) {
  if (status === "PENDING") return "Chờ duyệt";
  if (status === "APPROVED") return "Chờ chuyển tiền";
  if (status === "PAID") return "Đã trả";
  if (status === "REJECTED") return "Bị từ chối";
  return status;
}

function withdrawalStatusClass(status: string) {
  if (status === "PENDING") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "APPROVED") return "border-blue-200 bg-blue-100 text-blue-800";
  if (status === "PAID") return "border-green-200 bg-green-100 text-green-800";
  if (status === "REJECTED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
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

    <Tabs defaultValue="payments" className="space-y-5">
      <TabsList className="h-12 rounded-lg bg-slate-900 p-1 text-slate-200 shadow-sm">
        <TabsTrigger className="rounded-md px-5 py-2 text-sm font-semibold text-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm" value="payments">Thanh toán</TabsTrigger>
        <TabsTrigger className="rounded-md px-5 py-2 text-sm font-semibold text-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm" value="campaigns">Campaign</TabsTrigger>
        <TabsTrigger className="rounded-md px-5 py-2 text-sm font-semibold text-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm" value="withdrawals">Rút tiền</TabsTrigger>
      </TabsList>

      <TabsContent value="payments" className="space-y-3 mt-4">
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Danh sách thanh toán</h2>
            <p className="text-xs text-slate-500">Theo dõi biên lai, trạng thái và thao tác đồng bộ campaign.</p>
          </div>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={paymentFilter} onChange={event => setPaymentFilter(event.target.value)}>
            <option value="ALL">Tất cả thanh toán</option>
            <option value="PENDING_VERIFY">Chờ xác minh</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        {visiblePayments.length === 0 ? <Empty text="Không có thanh toán phù hợp." /> : visiblePayments.map(payment => <Card key={payment.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-lg font-bold tracking-tight text-slate-950">{payment.paymentCode}</div>
                <p className="mt-1 text-sm text-slate-600">Campaign #{payment.campaignId} - Customer #{payment.customerId}</p>
              </div>
              <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${paymentStatusClass(payment.status)}`}>{paymentStatusText(payment.status)}</Badge>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid gap-3 md:grid-cols-3">
                <PaymentMetric label="Tổng thanh toán" value={money(payment.totalAmount)} emphasize />
                <PaymentMetric label="Ngân sách thưởng" value={money(payment.rewardBudget)} />
                <PaymentMetric label="Phí nền tảng" value={money(payment.platformFeeAmount)} />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Ngân hàng</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{payment.bankName || "-"}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Nội dung chuyển khoản</div>
                  <div className="mt-1 break-all text-sm font-semibold text-slate-950">{payment.transferContent || "-"}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 text-sm">
                  {payment.qrImageUrl && <a href={payment.qrImageUrl} target="_blank" rel="noreferrer" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 font-medium text-blue-700 transition hover:bg-blue-100">Mở QR</a>}
                  {payment.proofImageUrl && <a href={payment.proofImageUrl} target="_blank" rel="noreferrer" className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 font-medium text-indigo-700 transition hover:bg-indigo-100">Mở biên lai</a>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {payment.status === "PENDING_VERIFY" && <>
                    <Button disabled={busy === `p-${payment.id}`} className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => void run(`p-${payment.id}`, () => adminApi.approvePayment(payment.id), "Đã xác minh thanh toán.")}>Xác minh đã thanh toán</Button>
                    <Button variant="destructive" disabled={busy === `p-${payment.id}`} onClick={() => {
                      const reason = window.prompt("Lý do từ chối:");
                      if (reason?.trim()) void run(`p-${payment.id}`, () => adminApi.rejectPayment(payment.id, reason.trim()), "Đã từ chối thanh toán");
                    }}>Từ chối</Button>
                  </>}
                  {payment.status === "PAID" && <Button variant="outline" className="border-slate-300 bg-white font-semibold text-slate-900 hover:bg-slate-100" disabled={busy === `sync-${payment.id}`} onClick={() => void run(`sync-${payment.id}`, () => adminApi.approvePayment(payment.id), "Đã đồng bộ campaign sang marketplace.")}>Đồng bộ campaign</Button>}
                </div>
              </div>
              {payment.rejectReason && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{payment.rejectReason}</p>}
            </div>
          </CardContent>
        </Card>)}
      </TabsContent>

      <TabsContent value="campaigns" className="space-y-3 mt-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Campaign chờ duyệt</h2>
          <p className="text-xs text-slate-500">Kiểm tra nội dung, ngân sách và mục tiêu phản hồi trước khi đưa lên marketplace.</p>
        </div>
        {campaigns.length === 0 ? <Empty text="Không có campaign chờ duyệt." /> : campaigns.map(campaign => <Card key={campaign.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-blue-50/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-lg font-bold tracking-tight text-slate-950">{campaign.title}</div>
                <p className="mt-1 text-sm text-slate-600">Customer #{campaign.customerId} - Campaign #{campaign.id}</p>
              </div>
              <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${campaignStatusClass(campaign.status)}`}>{campaignStatusText(campaign.status)}</Badge>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid gap-3 md:grid-cols-3">
                <PaymentMetric label="Tổng ngân sách" value={money(campaign.totalAmount)} emphasize />
                <PaymentMetric label="Response mục tiêu" value={campaign.targetResponses.toLocaleString("vi-VN")} />
                <PaymentMetric label="Thưởng mỗi response" value={money(campaign.rewardPerResponse)} />
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Mô tả campaign</div>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-700">{campaign.description || "-"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Hạn chót</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{new Date(campaign.deadline).toLocaleString("vi-VN")}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 text-sm">
                  {campaign.googleFormUrl && <button type="button" onClick={() => window.open(campaign.googleFormUrl!, "_blank", "noopener,noreferrer")} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 font-medium text-blue-700 transition hover:bg-blue-100">Mở form</button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy === `c-${campaign.id}`} onClick={() => void run(`c-${campaign.id}`, () => adminApi.approveCampaign(campaign.id), "Đã duyệt campaign.")}>Duyệt campaign</Button>
                  <Button size="sm" variant="destructive" disabled={busy === `c-${campaign.id}`} onClick={() => {
                    const reason = window.prompt("Lý do từ chối:");
                    if (reason?.trim()) void run(`c-${campaign.id}`, () => adminApi.rejectCampaign(campaign.id, reason.trim()), "Đã từ chối campaign");
                  }}>Từ chối</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>)}
      </TabsContent>

      <TabsContent value="withdrawals" className="space-y-3 mt-4">
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Yêu cầu rút tiền</h2>
            <p className="text-xs text-slate-500">Duyệt thông tin ngân hàng và đánh dấu trạng thái chuyển tiền.</p>
          </div>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={withdrawalFilter} onChange={event => setWithdrawalFilter(event.target.value)}>
            <option value="ALL">Tất cả yêu cầu</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt, chờ trả</option>
            <option value="PAID">Đã trả</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
        </div>
        {visibleWithdrawals.length === 0 ? <Empty text="Không có yêu cầu rút tiền phù hợp." /> : visibleWithdrawals.map(withdrawal => <Card key={withdrawal.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-orange-50/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-lg font-bold tracking-tight text-slate-950">{money(withdrawal.amount)}</div>
                <p className="mt-1 text-sm text-slate-600">Collaborator #{withdrawal.collaboratorId} - yêu cầu #{withdrawal.id}</p>
              </div>
              <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${withdrawalStatusClass(withdrawal.status)}`}>{withdrawalStatusText(withdrawal.status)}</Badge>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid gap-3 md:grid-cols-3">
                <PaymentMetric label="Số tiền rút" value={money(withdrawal.amount)} emphasize />
                <PaymentMetric label="Ngày yêu cầu" value={new Date(withdrawal.requestedAt).toLocaleDateString("vi-VN")} />
                <PaymentMetric label="Trạng thái" value={withdrawalStatusText(withdrawal.status)} />
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Ngân hàng</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{withdrawal.bankName || "-"}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Chủ tài khoản</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{withdrawal.bankAccountName || "-"}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Số tài khoản</div>
                  <div className="mt-1 break-all text-sm font-semibold text-slate-950">{withdrawal.bankAccountNumber || "-"}</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                {withdrawal.status === "PENDING" && <>
                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy === `w-${withdrawal.id}`} onClick={() => void run(`w-${withdrawal.id}`, () => adminApi.approveWithdrawal(withdrawal.id), "Đã duyệt yêu cầu rút tiền.")}>Duyệt</Button>
                  <Button size="sm" variant="destructive" disabled={busy === `w-${withdrawal.id}`} onClick={() => {
                    const reason = window.prompt("Lý do từ chối:");
                    if (reason?.trim()) void run(`w-${withdrawal.id}`, () => adminApi.rejectWithdrawal(withdrawal.id, reason.trim()), "Đã từ chối yêu cầu rút tiền");
                  }}>Từ chối</Button>
                </>}
                {withdrawal.status === "APPROVED" && <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy === `paid-${withdrawal.id}`} onClick={() => void run(`paid-${withdrawal.id}`, () => adminApi.markWithdrawalPaid(withdrawal.id), "Đã đánh dấu đã chuyển tiền.")}>Đánh dấu đã chuyển tiền</Button>}
              </div>
              {withdrawal.rejectReason && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{withdrawal.rejectReason}</p>}
            </div>
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
  const paymentData = [
    { name: "Chờ xác minh", value: pendingPayments, color: "#f59e0b" },
    { name: "Đã xác minh", value: paidPayments, color: "#16a34a" },
    { name: "Bị từ chối", value: rejectedPayments, color: "#dc2626" },
  ];
  const campaignData = [
    { name: "Campaign", value: pendingCampaigns },
    { name: "Response", value: pendingCampaignResponses },
  ];
  const withdrawalData = [
    { name: "Chờ duyệt", value: pendingWithdrawals, color: "#f97316" },
    { name: "Chờ trả", value: approvedWithdrawals, color: "#2563eb" },
  ].filter(item => item.value > 0);
  const revenueData = [
    { name: "Đã xác minh", value: totalPaidAmount },
    { name: "Phí nền tảng", value: platformFeeAmount },
    { name: "Cần rút", value: pendingWithdrawalAmount },
  ];

  return <div className="grid gap-4 xl:grid-cols-2">
    <ChartCard
      icon={<WalletCards className="h-5 w-5 text-green-700" />}
      title="Trạng thái thanh toán"
      description="So sánh số payment theo trạng thái xử lý."
    >
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={paymentData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} payment`, ""]} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {paymentData.map(item => <Cell key={item.name} fill={item.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard
      icon={<ClipboardList className="h-5 w-5 text-blue-700" />}
      title="Campaign chờ duyệt"
      description={`Tổng giá trị chờ duyệt: ${money(pendingCampaignBudget)}.`}
    >
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={campaignData} layout="vertical" margin={{ top: 10, right: 24, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={72} />
          <Tooltip formatter={(value) => [Number(value).toLocaleString("vi-VN"), ""]} />
          <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard
      icon={<CheckCircle2 className="h-5 w-5 text-orange-700" />}
      title="Yêu cầu rút tiền"
      description={`Tổng tiền cần xử lý: ${money(pendingWithdrawalAmount)}.`}
    >
      {withdrawalData.length > 0 ? <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={withdrawalData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
            {withdrawalData.map(item => <Cell key={item.name} fill={item.color} />)}
          </Pie>
          <Tooltip formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} yêu cầu`, ""]} />
        </PieChart>
      </ResponsiveContainer> : <EmptyChartLabel text="Chưa có yêu cầu rút tiền" />}
      {withdrawalData.length > 0 && <ChartLegend items={withdrawalData} />}
    </ChartCard>

    <ChartCard
      icon={<Clock className="h-5 w-5 text-slate-700" />}
      title="Doanh thu & phí"
      description={`Tỷ lệ phí thực tế: ${totalPaidAmount > 0 ? Math.round(platformFeeAmount / totalPaidAmount * 100) : 0}%.`}
    >
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={revenueData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={compactNumber} />
          <Tooltip formatter={(value) => [money(Number(value)), ""]} />
          <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>;
}

function ChartCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle>
      <p className="text-sm font-normal text-gray-600">{description}</p>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>;
}

function ChartLegend({ items }: { items: Array<{ name: string; color: string; value: number }> }) {
  return <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-gray-600">
    {items.map(item => <span key={item.name} className="inline-flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
      {item.name}: {item.value}
    </span>)}
  </div>;
}

function PaymentMetric({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return <div className={`rounded-lg border p-3 ${emphasize ? "border-slate-300 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-950"}`}>
    <div className={`text-xs font-medium uppercase tracking-wide ${emphasize ? "text-slate-300" : "text-slate-500"}`}>{label}</div>
    <div className="mt-1 text-lg font-bold">{value}</div>
  </div>;
}

function EmptyChartLabel({ text }: { text: string }) {
  return <div className="flex h-[230px] items-center justify-center rounded-md border border-dashed text-sm text-gray-500">{text}</div>;
}

function Empty({ text }: { text: string }) {
  return <Card><CardContent className="py-12 text-center text-gray-500">{text}</CardContent></Card>;
}
