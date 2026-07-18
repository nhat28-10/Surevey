import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import type { AdminRevenueSummary, Campaign, CampaignPayment, CollaboratorAccount, Withdrawal } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, ClipboardList, Clock, CreditCard, Download, LayoutDashboard, RefreshCw, Search, UserRound, Users, WalletCards } from "lucide-react";
import { AdminDashboardSkeleton } from "./LoadingStates";
import { EmptyState } from "./EmptyState";
import { exportToXlsx } from "../utils/exportXlsx";

type AdminSection = "overview" | "payments" | "campaigns" | "withdrawals" | "revenue" | "collaborators";

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
  const [collaborators, setCollaborators] = useState<CollaboratorAccount[]>([]);
  const [collaboratorTotal, setCollaboratorTotal] = useState(0);
  const [revenue, setRevenue] = useState<AdminRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [withdrawalFilter, setWithdrawalFilter] = useState("ALL");
  const [collaboratorSearch, setCollaboratorSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentData, campaignData, withdrawalData, revenueData, collaboratorData] = await Promise.all([
        adminApi.payments(),
        adminApi.pendingCampaigns(),
        adminApi.withdrawals(),
        adminApi.revenueSummary(),
        adminApi.collaborators(1, 100, collaboratorSearch),
      ]);
      setPayments(paymentData);
      setCampaigns(campaignData);
      setWithdrawals(withdrawalData);
      setRevenue(revenueData);
      setCollaborators(collaboratorData.items);
      setCollaboratorTotal(collaboratorData.totalRecords);
    } catch (err) {
      setError(text(err));
    } finally {
      setLoading(false);
    }
  }, [collaboratorSearch]);

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

  if (loading) return <AdminDashboardSkeleton />;

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard quản trị</h1>
        <p className="mt-1 text-gray-600">Chọn từng mục ở sidebar để xử lý đúng luồng, tránh hiển thị quá nhiều dữ liệu cùng lúc.</p>
      </div>
      <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Tải lại</Button>
    </div>

    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
      <AdminSidebar
        active={activeSection}
        onChange={setActiveSection}
        counts={{
          payments: pendingPayments,
          campaigns: campaigns.length,
          withdrawals: pendingWithdrawals + approvedWithdrawals,
          revenue: revenue?.totalPlatformFeeAmount || 0,
          collaborators: collaboratorTotal,
        }}
      />

      <div className="min-w-0 space-y-5">
        {activeSection === "overview" && <AdminOverviewColumns
          payments={payments}
          campaigns={campaigns}
          withdrawals={withdrawals}
          collaborators={collaborators}
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
        />}

        {activeSection === "payments" && <PaymentPanel
          payments={visiblePayments}
          allPayments={payments}
          filter={paymentFilter}
          setFilter={setPaymentFilter}
          busy={busy}
          onRun={run}
        />}

        {activeSection === "campaigns" && <CampaignPanel
          campaigns={campaigns}
          busy={busy}
          onRun={run}
        />}

        {activeSection === "withdrawals" && <WithdrawalPanel
          withdrawals={visibleWithdrawals}
          allWithdrawals={withdrawals}
          filter={withdrawalFilter}
          setFilter={setWithdrawalFilter}
          busy={busy}
          onRun={run}
        />}

        {activeSection === "revenue" && <RevenuePanel
          revenue={revenue}
          pendingWithdrawalAmount={pendingWithdrawalAmount}
        />}

        {activeSection === "collaborators" && <CollaboratorPanel
          collaborators={collaborators}
          total={collaboratorTotal}
          search={collaboratorSearch}
          setSearch={setCollaboratorSearch}
        />}
      </div>
    </div>
  </div>;
}

function AdminSidebar({
  active,
  onChange,
  counts,
}: {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  counts: { payments: number; campaigns: number; withdrawals: number; revenue: number; collaborators: number };
}) {
  const items: Array<{ key: AdminSection; label: string; description: string; icon: ReactNode; count?: number | string }> = [
    { key: "overview", label: "Tổng quan", description: "KPI nhanh", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "payments", label: "Thanh toán", description: "Biên lai cần xác minh", icon: <CreditCard className="h-4 w-4" />, count: counts.payments },
    { key: "campaigns", label: "Campaign", description: "Nội dung chờ duyệt", icon: <ClipboardList className="h-4 w-4" />, count: counts.campaigns },
    { key: "withdrawals", label: "Rút tiền", description: "Yêu cầu từ collaborator", icon: <WalletCards className="h-4 w-4" />, count: counts.withdrawals },
    { key: "revenue", label: "Doanh thu", description: "Phí nền tảng", icon: <CheckCircle2 className="h-4 w-4" />, count: compactNumber(counts.revenue) },
    { key: "collaborators", label: "Collaborator", description: "Tài khoản người làm", icon: <Users className="h-4 w-4" />, count: counts.collaborators },
  ];

  return <aside className="h-fit rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
    <div className="border-b border-slate-100 px-3 py-3">
      <div className="text-sm font-semibold text-slate-950">Khu vực Admin</div>
      <div className="mt-1 text-xs text-slate-500">Trỏ vào từng mục để xử lý.</div>
    </div>
    <nav className="mt-2 space-y-1">
      {items.map(item => {
        const selected = active === item.key;
        return <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`w-full rounded-md px-3 py-3 text-left transition ${selected ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold">{item.icon}{item.label}</span>
            {item.count !== undefined && <span className={`rounded-full px-2 py-0.5 text-xs ${selected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}>{item.count}</span>}
          </div>
          <div className={`mt-1 text-xs ${selected ? "text-slate-300" : "text-slate-500"}`}>{item.description}</div>
        </button>;
      })}
    </nav>
  </aside>;
}

function PaymentPanel({
  payments,
  allPayments,
  filter,
  setFilter,
  busy,
  onRun,
}: {
  payments: CampaignPayment[];
  allPayments: CampaignPayment[];
  filter: string;
  setFilter: (value: string) => void;
  busy: string;
  onRun: (key: string, action: () => Promise<unknown>, success: string) => void;
}) {
  const pending = allPayments.filter(payment => payment.status === "PENDING_VERIFY").length;
  const paid = allPayments.filter(payment => payment.status === "PAID").length;
  const rejected = allPayments.filter(payment => payment.status === "REJECTED").length;
  const exportPayments = () => exportToXlsx("admin-payments", "Payments", payments.map(payment => ({
    "Mã thanh toán": payment.paymentCode,
    "Campaign ID": payment.campaignId,
    "Customer ID": payment.customerId,
    "Trạng thái": paymentStatusText(payment.status),
    "Tổng thanh toán": payment.totalAmount,
    "Ngân sách thưởng": payment.rewardBudget,
    "Phí nền tảng": payment.platformFeeAmount,
    "Ngân hàng": payment.bankName,
    "Nội dung chuyển khoản": payment.transferContent,
    "Ngày tạo": new Date(payment.createdAt).toLocaleString("vi-VN"),
  })));

  return <section className="space-y-3">
    <PaymentStatusChart pending={pending} paid={paid} rejected={rejected} />

    <SectionToolbar title="Danh sách thanh toán" description="Theo dõi biên lai, trạng thái và thao tác đồng bộ campaign.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="ALL">Tất cả thanh toán</option>
          <option value="PENDING_VERIFY">Chờ xác minh</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="REJECTED">Bị từ chối</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <Button type="button" variant="outline" className="border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" disabled={payments.length === 0} onClick={exportPayments}>
          <Download className="mr-2 h-4 w-4" />Xuất Excel
        </Button>
      </div>
    </SectionToolbar>

    {payments.length === 0 ? <Empty text="Không có thanh toán phù hợp." /> : payments.map(payment => <Card key={payment.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
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
            <InfoPanel label="Ngân hàng" value={payment.bankName || "-"} />
            <InfoPanel label="Nội dung chuyển khoản" value={payment.transferContent || "-"} />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-sm">
              {payment.qrImageUrl && <a href={payment.qrImageUrl} target="_blank" rel="noreferrer" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 font-medium text-blue-700 transition hover:bg-blue-100">Mở QR</a>}
              {payment.proofImageUrl && <a href={payment.proofImageUrl} target="_blank" rel="noreferrer" className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 font-medium text-indigo-700 transition hover:bg-indigo-100">Mở biên lai</a>}
            </div>
            <div className="flex flex-wrap gap-2">
              {payment.status === "PENDING_VERIFY" && <>
                <Button disabled={busy === `p-${payment.id}`} className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => onRun(`p-${payment.id}`, () => adminApi.approvePayment(payment.id), "Đã xác minh thanh toán.")}>Xác minh đã thanh toán</Button>
                <Button variant="destructive" disabled={busy === `p-${payment.id}`} onClick={() => {
                  const reason = window.prompt("Lý do từ chối:");
                  if (reason?.trim()) onRun(`p-${payment.id}`, () => adminApi.rejectPayment(payment.id, reason.trim()), "Đã từ chối thanh toán");
                }}>Từ chối</Button>
              </>}
              {payment.status === "PAID" && <Button variant="outline" className="border-slate-300 bg-white font-semibold text-slate-900 hover:bg-slate-100" disabled={busy === `sync-${payment.id}`} onClick={() => onRun(`sync-${payment.id}`, () => adminApi.approvePayment(payment.id), "Đã đồng bộ campaign sang marketplace.")}>Đồng bộ campaign</Button>}
            </div>
          </div>
          {payment.rejectReason && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{payment.rejectReason}</p>}
        </div>
      </CardContent>
    </Card>)}
  </section>;
}

function CampaignPanel({
  campaigns,
  busy,
  onRun,
}: {
  campaigns: Campaign[];
  busy: string;
  onRun: (key: string, action: () => Promise<unknown>, success: string) => void;
}) {
  const pendingResponses = campaigns.reduce((sum, campaign) => sum + campaign.targetResponses, 0);
  const pendingBudget = campaigns.reduce((sum, campaign) => sum + campaign.totalAmount, 0);
  const exportCampaigns = () => exportToXlsx("admin-campaigns", "Campaigns", campaigns.map(campaign => ({
    "Campaign ID": campaign.id,
    "Customer ID": campaign.customerId,
    "Tiêu đề": campaign.title,
    "Trạng thái": campaignStatusText(campaign.status),
    "Danh mục": campaign.category,
    "Response mục tiêu": campaign.targetResponses,
    "Response đã duyệt": campaign.approvedResponses,
    "Thưởng mỗi response": campaign.rewardPerResponse,
    "Tổng ngân sách": campaign.totalAmount,
    "Hạn chót": new Date(campaign.deadline).toLocaleString("vi-VN"),
  })));

  return <section className="space-y-3">
    <CampaignReviewChart pendingCampaigns={campaigns.length} pendingResponses={pendingResponses} pendingBudget={pendingBudget} />

    <SectionToolbar title="Campaign chờ duyệt" description="Kiểm tra nội dung, ngân sách và mục tiêu phản hồi trước khi đưa lên marketplace.">
      <Button type="button" variant="outline" className="border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" disabled={campaigns.length === 0} onClick={exportCampaigns}>
        <Download className="mr-2 h-4 w-4" />Xuất Excel
      </Button>
    </SectionToolbar>

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
            <InfoPanel label="Mô tả campaign" value={campaign.description || "-"} multiline />
            <InfoPanel label="Hạn chót" value={new Date(campaign.deadline).toLocaleString("vi-VN")} />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-sm">
              {campaign.googleFormUrl && <button type="button" onClick={() => window.open(campaign.googleFormUrl!, "_blank", "noopener,noreferrer")} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 font-medium text-blue-700 transition hover:bg-blue-100">Mở form</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy === `c-${campaign.id}`} onClick={() => onRun(`c-${campaign.id}`, () => adminApi.approveCampaign(campaign.id), "Đã duyệt campaign.")}>Duyệt campaign</Button>
              <Button size="sm" variant="destructive" disabled={busy === `c-${campaign.id}`} onClick={() => {
                const reason = window.prompt("Lý do từ chối:");
                if (reason?.trim()) onRun(`c-${campaign.id}`, () => adminApi.rejectCampaign(campaign.id, reason.trim()), "Đã từ chối campaign");
              }}>Từ chối</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>)}
  </section>;
}

function WithdrawalPanel({
  withdrawals,
  allWithdrawals,
  filter,
  setFilter,
  busy,
  onRun,
}: {
  withdrawals: Withdrawal[];
  allWithdrawals: Withdrawal[];
  filter: string;
  setFilter: (value: string) => void;
  busy: string;
  onRun: (key: string, action: () => Promise<unknown>, success: string) => void;
}) {
  const pending = allWithdrawals.filter(withdrawal => withdrawal.status === "PENDING").length;
  const approved = allWithdrawals.filter(withdrawal => withdrawal.status === "APPROVED").length;
  const pendingAmount = allWithdrawals
    .filter(withdrawal => withdrawal.status === "PENDING" || withdrawal.status === "APPROVED")
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
  const exportWithdrawals = () => exportToXlsx("admin-withdrawals", "Withdrawals", withdrawals.map(withdrawal => ({
    "Yêu cầu ID": withdrawal.id,
    "Collaborator ID": withdrawal.collaboratorId,
    "Số tiền": withdrawal.amount,
    "Trạng thái": withdrawalStatusText(withdrawal.status),
    "Ngân hàng": withdrawal.bankName,
    "Chủ tài khoản": withdrawal.bankAccountName,
    "Số tài khoản": withdrawal.bankAccountNumber,
    "Ngày yêu cầu": new Date(withdrawal.requestedAt).toLocaleString("vi-VN"),
    "Lý do từ chối": withdrawal.rejectReason || "",
  })));

  return <section className="space-y-3">
    <WithdrawalStatusChart pending={pending} approved={approved} pendingAmount={pendingAmount} />

    <SectionToolbar title="Yêu cầu rút tiền" description="Duyệt thông tin ngân hàng và đánh dấu trạng thái chuyển tiền.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="ALL">Tất cả yêu cầu</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt, chờ trả</option>
          <option value="PAID">Đã trả</option>
          <option value="REJECTED">Bị từ chối</option>
        </select>
        <Button type="button" variant="outline" className="border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" disabled={withdrawals.length === 0} onClick={exportWithdrawals}>
          <Download className="mr-2 h-4 w-4" />Xuất Excel
        </Button>
      </div>
    </SectionToolbar>

    {withdrawals.length === 0 ? <Empty text="Không có yêu cầu rút tiền phù hợp." /> : withdrawals.map(withdrawal => <Card key={withdrawal.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
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
            <InfoPanel label="Ngân hàng" value={withdrawal.bankName || "-"} />
            <InfoPanel label="Chủ tài khoản" value={withdrawal.bankAccountName || "-"} />
            <InfoPanel label="Số tài khoản" value={withdrawal.bankAccountNumber || "-"} />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            {withdrawal.status === "PENDING" && <>
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy === `w-${withdrawal.id}`} onClick={() => onRun(`w-${withdrawal.id}`, () => adminApi.approveWithdrawal(withdrawal.id), "Đã duyệt yêu cầu rút tiền.")}>Duyệt</Button>
              <Button size="sm" variant="destructive" disabled={busy === `w-${withdrawal.id}`} onClick={() => {
                const reason = window.prompt("Lý do từ chối:");
                if (reason?.trim()) onRun(`w-${withdrawal.id}`, () => adminApi.rejectWithdrawal(withdrawal.id, reason.trim()), "Đã từ chối yêu cầu rút tiền");
              }}>Từ chối</Button>
            </>}
            {withdrawal.status === "APPROVED" && <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy === `paid-${withdrawal.id}`} onClick={() => onRun(`paid-${withdrawal.id}`, () => adminApi.markWithdrawalPaid(withdrawal.id), "Đã đánh dấu đã chuyển tiền.")}>Đánh dấu đã chuyển tiền</Button>}
          </div>
          {withdrawal.rejectReason && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{withdrawal.rejectReason}</p>}
        </div>
      </CardContent>
    </Card>)}
  </section>;
}

function CollaboratorPanel({
  collaborators,
  total,
  search,
  setSearch,
}: {
  collaborators: CollaboratorAccount[];
  total: number;
  search: string;
  setSearch: (value: string) => void;
}) {
  const googleAccounts = collaborators.filter(item => item.authProvider === "Google").length;
  const completeProfiles = collaborators.filter(item => item.profileCompletionPercent >= 80).length;
  const exportCollaborators = () => exportToXlsx("admin-collaborators", "Collaborators", collaborators.map(collaborator => ({
    "User ID": collaborator.userId,
    "Tên đăng nhập": collaborator.userName,
    "Họ tên": collaborator.fullName || "",
    "Email": collaborator.email,
    "Số điện thoại": collaborator.phoneNumber || "",
    "Nguồn đăng nhập": collaborator.authProvider,
    "Hoàn thiện hồ sơ (%)": collaborator.profileCompletionPercent,
    "CCCD": collaborator.identityCard || "",
    "Giới tính": collaborator.sex || "",
    "Địa chỉ": collaborator.address || "",
  })));

  return <section className="space-y-4">
    <SectionToolbar title="Quản lý Collaborator" description="Tìm kiếm và kiểm tra hồ sơ tài khoản người làm khảo sát.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên, email, số điện thoại" className="pl-9" />
        </div>
        <Button type="button" variant="outline" className="border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" disabled={collaborators.length === 0} onClick={exportCollaborators}>
          <Download className="mr-2 h-4 w-4" />Xuất Excel
        </Button>
      </div>
    </SectionToolbar>

    <div className="grid gap-3 sm:grid-cols-3">
      <SmallStat label="Tổng collaborator" value={total} />
      <SmallStat label="Đăng nhập Google" value={googleAccounts} />
      <SmallStat label="Hồ sơ >= 80%" value={completeProfiles} />
    </div>

    {collaborators.length === 0 ? <EmptyState
      compact
      icon={<Users className="h-5 w-5" />}
      title="Không có Collaborator phù hợp"
      description="Thử đổi từ khóa tìm kiếm hoặc kiểm tra lại dữ liệu tài khoản trong UserService."
    /> : <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">Tài khoản</th>
                <th className="p-3">Liên hệ</th>
                <th className="p-3">Hồ sơ</th>
                <th className="p-3">Nguồn</th>
                <th className="p-3">Thông tin thêm</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map(collaborator => <tr key={collaborator.userId} className="border-b align-top last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-700">
                      {collaborator.avatarUrl ? <img src={collaborator.avatarUrl} alt={collaborator.userName} className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-950">{collaborator.fullName || collaborator.userName}</div>
                      <div className="text-xs text-slate-500">#{collaborator.userId} - {collaborator.userName}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-slate-800">{collaborator.email}</div>
                  <div className="text-xs text-slate-500">{collaborator.phoneNumber || "Chưa có số điện thoại"}</div>
                </td>
                <td className="p-3 min-w-[170px]">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Hoàn thiện</span>
                    <span className="font-semibold text-slate-800">{collaborator.profileCompletionPercent}%</span>
                  </div>
                  <Progress value={collaborator.profileCompletionPercent} className="h-2" />
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">{collaborator.authProvider}</Badge>
                </td>
                <td className="p-3 text-xs leading-5 text-slate-500">
                  <div>CCCD: {collaborator.identityCard || "-"}</div>
                  <div>Giới tính: {collaborator.sex || "-"}</div>
                  <div>Địa chỉ: {collaborator.address || "-"}</div>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>}
  </section>;
}

function RevenuePanel({
  revenue,
  pendingWithdrawalAmount,
}: {
  revenue: AdminRevenueSummary | null;
  pendingWithdrawalAmount: number;
}) {
  const totalPaidAmount = revenue?.totalPaidAmount || 0;
  const platformFeeAmount = revenue?.totalPlatformFeeAmount || 0;
  const rewardBudget = revenue?.totalRewardBudget || 0;
  const paidPaymentCount = revenue?.paidPaymentCount || 0;
  const feeRate = totalPaidAmount > 0 ? Math.round(platformFeeAmount / totalPaidAmount * 100) : 0;

  return <section className="space-y-4">
    <RevenueChart
      totalPaidAmount={totalPaidAmount}
      platformFeeAmount={platformFeeAmount}
      rewardBudget={rewardBudget}
      pendingWithdrawalAmount={pendingWithdrawalAmount}
    />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SmallStat label="Tổng tiền đã xác minh" value={money(totalPaidAmount)} />
      <SmallStat label="Phí nền tảng" value={money(platformFeeAmount)} />
      <SmallStat label="Ngân sách thưởng" value={money(rewardBudget)} />
      <SmallStat label="Payment đã thanh toán" value={paidPaymentCount} />
    </div>
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-slate-950">Tỷ lệ phí thực tế</div>
          <p className="text-sm text-slate-500">Tính theo phí nền tảng trên tổng tiền đã xác minh.</p>
        </div>
        <div className="text-3xl font-bold text-slate-950">{feeRate}%</div>
      </CardContent>
    </Card>
  </section>;
}

function AdminOverviewColumns({
  payments,
  campaigns,
  withdrawals,
  collaborators,
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
  payments: CampaignPayment[];
  campaigns: Campaign[];
  withdrawals: Withdrawal[];
  collaborators: CollaboratorAccount[];
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
  const timelineItems = [
    ...payments.slice(0, 3).map(payment => ({
      title: `Payment ${paymentStatusText(payment.status)}`,
      description: `${payment.paymentCode} - ${money(payment.totalAmount)}`,
      time: payment.updatedAt,
      tone: payment.status === "PAID" ? "green" as const : payment.status === "REJECTED" ? "red" as const : "amber" as const,
    })),
    ...campaigns.slice(0, 3).map(campaign => ({
      title: `Campaign ${campaignStatusText(campaign.status)}`,
      description: campaign.title,
      time: campaign.updatedAt,
      tone: "blue" as const,
    })),
    ...withdrawals.slice(0, 3).map(withdrawal => ({
      title: `Rút tiền ${withdrawalStatusText(withdrawal.status)}`,
      description: `Collaborator #${withdrawal.collaboratorId} - ${money(withdrawal.amount)}`,
      time: withdrawal.reviewedAt || withdrawal.requestedAt,
      tone: withdrawal.status === "PAID" ? "green" as const : withdrawal.status === "REJECTED" ? "red" as const : "amber" as const,
    })),
    ...collaborators.slice(0, 2).map(collaborator => ({
      title: "Collaborator trong hệ thống",
      description: collaborator.fullName || collaborator.email,
      time: new Date().toISOString(),
      tone: "slate" as const,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  return <div className="space-y-4">
    <SectionToolbar title="Tổng quan vận hành" description="Các chỉ số nhanh để Admin biết mục nào cần xử lý trước." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SmallStat label="Thanh toán chờ xác minh" value={pendingPayments} />
      <SmallStat label="Campaign chờ duyệt" value={pendingCampaigns} />
      <SmallStat label="Yêu cầu rút cần xử lý" value={pendingWithdrawals + approvedWithdrawals} />
      <SmallStat label="Phí nền tảng" value={money(platformFeeAmount)} />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SmallStat label="Payment đã xác minh" value={paidPayments} />
      <SmallStat label="Payment bị từ chối" value={rejectedPayments} />
      <SmallStat label="Response chờ duyệt" value={pendingCampaignResponses.toLocaleString("vi-VN")} />
      <SmallStat label="Tiền cần rút" value={money(pendingWithdrawalAmount)} />
    </div>
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="grid gap-4 py-5 md:grid-cols-3">
        <OverviewNote label="Doanh thu xác minh" value={money(totalPaidAmount)} description="Xem chi tiết ở mục Doanh thu." />
        <OverviewNote label="Ngân sách campaign chờ duyệt" value={money(pendingCampaignBudget)} description="Xem chart ở mục Campaign." />
        <OverviewNote label="Luồng xử lý" value="Theo từng sidebar" description="Mỗi mục có chart và danh sách riêng." />
      </CardContent>
    </Card>
    <AdminTimeline items={timelineItems} />
  </div>;
}

function PaymentStatusChart({ pending, paid, rejected }: { pending: number; paid: number; rejected: number }) {
  const paymentData = [
    { name: "Chờ xác minh", value: pending, color: "#f59e0b" },
    { name: "Đã xác minh", value: paid, color: "#16a34a" },
    { name: "Bị từ chối", value: rejected, color: "#dc2626" },
  ];

  return <ChartCard icon={<WalletCards className="h-5 w-5 text-green-700" />} title="Trạng thái thanh toán" description="So sánh số payment theo trạng thái xử lý.">
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
    </ChartCard>;
}

function CampaignReviewChart({ pendingCampaigns, pendingResponses, pendingBudget }: { pendingCampaigns: number; pendingResponses: number; pendingBudget: number }) {
  const campaignData = [
    { name: "Campaign", value: pendingCampaigns },
    { name: "Response", value: pendingResponses },
  ];

  return <ChartCard icon={<ClipboardList className="h-5 w-5 text-blue-700" />} title="Campaign chờ duyệt" description={`Tổng giá trị chờ duyệt: ${money(pendingBudget)}.`}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={campaignData} layout="vertical" margin={{ top: 10, right: 24, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={72} />
          <Tooltip formatter={(value) => [Number(value).toLocaleString("vi-VN"), ""]} />
          <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>;
}

function WithdrawalStatusChart({ pending, approved, pendingAmount }: { pending: number; approved: number; pendingAmount: number }) {
  const withdrawalData = [
    { name: "Chờ duyệt", value: pending, color: "#f97316" },
    { name: "Chờ trả", value: approved, color: "#2563eb" },
  ].filter(item => item.value > 0);

  return <ChartCard icon={<CheckCircle2 className="h-5 w-5 text-orange-700" />} title="Yêu cầu rút tiền" description={`Tổng tiền cần xử lý: ${money(pendingAmount)}.`}>
      {withdrawalData.length > 0 ? <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={withdrawalData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
            {withdrawalData.map(item => <Cell key={item.name} fill={item.color} />)}
          </Pie>
          <Tooltip formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} yêu cầu`, ""]} />
        </PieChart>
      </ResponsiveContainer> : <EmptyChartLabel text="Chưa có yêu cầu rút tiền" />}
      {withdrawalData.length > 0 && <ChartLegend items={withdrawalData} />}
    </ChartCard>;
}

function RevenueChart({
  totalPaidAmount,
  platformFeeAmount,
  rewardBudget,
  pendingWithdrawalAmount,
}: {
  totalPaidAmount: number;
  platformFeeAmount: number;
  rewardBudget: number;
  pendingWithdrawalAmount: number;
}) {
  const revenueData = [
    { name: "Đã xác minh", value: totalPaidAmount },
    { name: "Ngân sách thưởng", value: rewardBudget },
    { name: "Phí nền tảng", value: platformFeeAmount },
    { name: "Cần rút", value: pendingWithdrawalAmount },
  ];

  return <ChartCard icon={<CreditCard className="h-5 w-5 text-slate-700" />} title="Doanh thu & phí" description={`Tỷ lệ phí thực tế: ${totalPaidAmount > 0 ? Math.round(platformFeeAmount / totalPaidAmount * 100) : 0}%.`}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={revenueData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={compactNumber} />
          <Tooltip formatter={(value) => [money(Number(value)), ""]} />
          <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>;
}

function OverviewNote({ label, value, description }: { label: string; value: string; description: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div className="text-sm text-slate-500">{label}</div>
    <div className="mt-1 text-xl font-bold text-slate-950">{value}</div>
    <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
  </div>;
}

function AdminTimeline({ items }: { items: Array<{ title: string; description: string; time: string; tone: "slate" | "blue" | "amber" | "green" | "red" }> }) {
  if (items.length === 0) {
    return <EmptyState compact icon={<ActivityIcon />} title="Chưa có nhật ký vận hành" description="Khi có thanh toán, campaign hoặc yêu cầu rút tiền mới, timeline sẽ hiển thị tại đây." />;
  }

  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <ActivityIcon />
        Nhật ký vận hành gần đây
      </CardTitle>
    </CardHeader>
    <CardContent>
      {items.map((item, index) => <AdminTimelineItem key={`${item.title}-${item.time}-${index}`} item={item} last={index === items.length - 1} />)}
    </CardContent>
  </Card>;
}

function AdminTimelineItem({ item, last }: { item: { title: string; description: string; time: string; tone: "slate" | "blue" | "amber" | "green" | "red" }; last: boolean }) {
  const dotClass = item.tone === "green"
    ? "bg-green-600"
    : item.tone === "amber"
      ? "bg-amber-500"
      : item.tone === "red"
        ? "bg-red-600"
        : item.tone === "blue"
          ? "bg-blue-600"
          : "bg-slate-700";

  return <div className="grid grid-cols-[20px_1fr] gap-3">
    <div className="flex flex-col items-center">
      <span className={`mt-1 h-3 w-3 rounded-full ${dotClass}`} />
      {!last && <span className="mt-1 h-full w-px bg-slate-200" />}
    </div>
    <div className={`pb-4 ${last ? "pb-0" : ""}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-slate-950">{item.title}</div>
        <div className="text-xs text-slate-500">{new Date(item.time).toLocaleString("vi-VN")}</div>
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
    </div>
  </div>;
}

function ActivityIcon() {
  return <Clock className="h-5 w-5 text-slate-700" />;
}

function SectionToolbar({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </CardContent>
  </Card>;
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

function InfoPanel({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`mt-1 break-all text-sm font-semibold text-slate-950 ${multiline ? "line-clamp-3 font-normal leading-6 text-slate-700" : ""}`}>{value}</div>
  </div>;
}

function SmallStat({ label, value }: { label: string; value: number | string }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">{label}</CardTitle></CardHeader>
    <CardContent className="text-2xl font-bold text-slate-950">{value}</CardContent>
  </Card>;
}

function EmptyChartLabel({ text }: { text: string }) {
  return <div className="flex h-[230px] items-center justify-center rounded-md border border-dashed text-sm text-gray-500">{text}</div>;
}

function Empty({ text }: { text: string }) {
  return <EmptyState compact icon={<ClipboardList className="h-5 w-5" />} title={text} />;
}
