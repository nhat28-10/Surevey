import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { participationApi } from "../../api/participationApi";
import { walletApi } from "../../api/walletApi";
import type { Participation, Wallet, WalletTransaction, Withdrawal } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Activity, ClipboardList, ExternalLink, ReceiptText, RefreshCw, Search, WalletCards } from "lucide-react";
import { CollaboratorActivitySkeleton } from "./LoadingStates";
import { EmptyState } from "./EmptyState";

function message(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải dữ liệu";
}

function workStatusText(status: string) {
  if (status === "ACCEPTED") return "Đã nhận";
  if (status === "IN_PROGRESS") return "Đang làm";
  if (status === "SUBMITTED") return "Chờ duyệt";
  if (status === "APPROVED") return "Đã duyệt";
  if (status === "REJECTED") return "Bị từ chối";
  return status;
}

function statusClass(status: string) {
  if (status === "APPROVED" || status === "PAID") return "border-green-200 bg-green-100 text-green-800";
  if (status === "SUBMITTED" || status === "PENDING" || status === "ACCEPTED" || status === "IN_PROGRESS") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "REJECTED" || status === "CANCELLED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function HelperFinishedSurveys() {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: "", bankName: "", bankAccountName: "", bankAccountNumber: "" });
  const [workFilter, setWorkFilter] = useState("ALL");
  const [workSort, setWorkSort] = useState("UPDATED_DESC");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [p, w, t, wd] = await Promise.all([
        participationApi.mine(), walletApi.get(), walletApi.transactions(), walletApi.withdrawals(),
      ]);
      setParticipations(p); setWallet(w); setTransactions(t); setWithdrawals(wd);
    } catch (err) { setError(message(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalEarned = useMemo(() => transactions.filter(t => t.type === "REWARD_PAID" || t.type === "REWARD").reduce((sum, t) => sum + Math.max(0, t.amount), 0), [transactions]);
  const workStats = useMemo(() => ({
    total: participations.length,
    active: participations.filter(p => ["ACCEPTED", "IN_PROGRESS"].includes(p.status)).length,
    submitted: participations.filter(p => p.status === "SUBMITTED").length,
    approved: participations.filter(p => p.status === "APPROVED").length,
  }), [participations]);
  const filteredParticipations = useMemo(() => {
    const data = workFilter === "ALL" ? [...participations] : participations.filter(p => p.status === workFilter);
    return data.sort((a, b) => {
      if (workSort === "ACCEPTED_ASC") return new Date(a.acceptedAt).getTime() - new Date(b.acceptedAt).getTime();
      if (workSort === "STATUS") return a.status.localeCompare(b.status);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [participations, workFilter, workSort]);
  const recentActivities = useMemo(() => participations
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5), [participations]);

  const withdraw = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!wallet || amount <= 0 || amount > wallet.availableBalance) { toast.error("Số tiền rút không hợp lệ hoặc vượt số dư"); return; }
    setSubmitting(true);
    try {
      await walletApi.createWithdrawal({ amount, bankName: form.bankName.trim(), bankAccountName: form.bankAccountName.trim(), bankAccountNumber: form.bankAccountNumber.trim() });
      toast.success("Đã gửi yêu cầu rút tiền");
      setForm({ amount: "", bankName: "", bankAccountName: "", bankAccountNumber: "" });
      await load();
    } catch (err) { toast.error(message(err)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <CollaboratorActivitySkeleton />;

  return <div className="space-y-6">
    <div className="flex justify-between gap-3 items-center"><div><h1 className="text-3xl font-bold">Công việc và ví</h1><p className="text-gray-600 mt-1">Submission, số dư và giao dịch đều lấy từ backend.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Tải lại</Button></div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="grid sm:grid-cols-3 gap-4">
      <WalletSummary label="Số dư khả dụng" value={`${(wallet?.availableBalance || 0).toLocaleString('vi-VN')} đ`} emphasis />
      <WalletSummary label="Đang xử lý" value={`${(wallet?.pendingBalance || 0).toLocaleString('vi-VN')} đ`} />
      <WalletSummary label="Tổng đã kiếm" value={`${totalEarned.toLocaleString('vi-VN')} đ`} />
    </div>

    <div className="grid sm:grid-cols-4 gap-4">
      <WorkStat label="Campaign đã nhận" value={workStats.total} />
      <WorkStat label="Đang làm" value={workStats.active} />
      <WorkStat label="Chờ duyệt" value={workStats.submitted} />
      <WorkStat label="Đã duyệt" value={workStats.approved} />
    </div>

    <RecentWorkActivity participations={recentActivities} />

    <Tabs defaultValue="work" className="space-y-5">
      <TabsList className="h-12 rounded-lg bg-slate-900 p-1 text-slate-200 shadow-sm"><TabsTrigger className="rounded-md px-5 py-2 text-sm font-semibold text-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm" value="work">Campaign đã nhận</TabsTrigger><TabsTrigger className="rounded-md px-5 py-2 text-sm font-semibold text-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm" value="transactions">Giao dịch</TabsTrigger><TabsTrigger className="rounded-md px-5 py-2 text-sm font-semibold text-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm" value="withdraw">Rút tiền</TabsTrigger></TabsList>
      <TabsContent value="work" className="space-y-3 mt-4">
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-semibold text-slate-900">Công việc đã nhận</h2><p className="text-xs text-slate-500">Theo dõi trạng thái và mở lại campaign đang làm.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={workFilter} onChange={event => setWorkFilter(event.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACCEPTED">Đã nhận</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="SUBMITTED">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={workSort} onChange={event => setWorkSort(event.target.value)}>
            <option value="UPDATED_DESC">Mới cập nhật</option>
            <option value="ACCEPTED_ASC">Nhận sớm trước</option>
            <option value="STATUS">Theo trạng thái</option>
          </select>
          </div>
        </div>
        {participations.length === 0 ? <EmptyState
          compact
          icon={<ClipboardList className="h-5 w-5" />}
          title="Bạn chưa nhận campaign nào"
          description="Vào marketplace để chọn campaign phù hợp, hoàn thành khảo sát và nhận thưởng về ví."
          action={<Button asChild className="bg-slate-900 text-white hover:bg-slate-800"><Link to="/collaborator/marketplace">Mở Marketplace</Link></Button>}
        /> :
          filteredParticipations.length === 0 ? <EmptyState
            compact
            icon={<Search className="h-5 w-5" />}
            title="Không có campaign phù hợp"
            description="Thử đổi trạng thái hoặc cách sắp xếp để xem lại các campaign đã nhận."
          /> :
          filteredParticipations.map(p => <Card key={p.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"><CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-blue-50/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="font-bold text-slate-950">{p.campaign?.title || `Campaign #${p.campaignId}`}</p><p className="text-sm text-slate-600">Nhận lúc {new Date(p.acceptedAt).toLocaleString('vi-VN')}</p></div>
            <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(p.status)}`}>{workStatusText(p.status)}</Badge>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Campaign</div><div className="mt-1 font-semibold text-slate-950">#{p.campaignId}</div></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Cập nhật</div><div className="mt-1 font-semibold text-slate-950">{new Date(p.updatedAt).toLocaleDateString('vi-VN')}</div></div>
            </div>
            {["ACCEPTED", "IN_PROGRESS"].includes(p.status) && <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" asChild><Link to={`/collaborator/participation/${p.id}`}><ExternalLink className="w-4 h-4 mr-1" />Mở</Link></Button>}
          </div>
        </CardContent></Card>)}
      </TabsContent>

      <TabsContent value="transactions" className="mt-4">
        {transactions.length === 0 ? <EmptyState
          compact
          icon={<ReceiptText className="h-5 w-5" />}
          title="Chưa có giao dịch"
          description="Khi submission được duyệt hoặc bạn gửi yêu cầu rút tiền, lịch sử ví sẽ được ghi lại tại đây."
        /> : <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="text-left p-3">Thời gian</th><th className="text-left p-3">Loại</th><th className="text-left p-3">Mô tả</th><th className="text-right p-3">Số tiền</th><th className="text-right p-3">Số dư sau</th></tr></thead><tbody>{transactions.map(t => <tr key={t.id} className="border-b"><td className="p-3">{new Date(t.createdAt).toLocaleString('vi-VN')}</td><td className="p-3">{t.type}</td><td className="p-3">{t.description || '-'}</td><td className={`p-3 text-right font-medium ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{t.amount.toLocaleString('vi-VN')} đ</td><td className="p-3 text-right">{t.balanceAfter.toLocaleString('vi-VN')} đ</td></tr>)}</tbody></table></CardContent></Card>}
      </TabsContent>

      <TabsContent value="withdraw" className="mt-4 grid lg:grid-cols-2 gap-5">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="w-5 h-5" />Tạo yêu cầu rút tiền</CardTitle></CardHeader><CardContent><form onSubmit={withdraw} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="amount">Số tiền *</Label><Input id="amount" type="number" min="1" max={wallet?.availableBalance || 0} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required /></div>
          <div className="space-y-2"><Label htmlFor="bank">Ngân hàng *</Label><Input id="bank" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} required /></div>
          <div className="space-y-2"><Label htmlFor="accountName">Tên chủ tài khoản *</Label><Input id="accountName" value={form.bankAccountName} onChange={e => setForm({...form, bankAccountName: e.target.value})} required /></div>
          <div className="space-y-2"><Label htmlFor="accountNumber">Số tài khoản *</Label><Input id="accountNumber" value={form.bankAccountNumber} onChange={e => setForm({...form, bankAccountNumber: e.target.value})} required /></div>
          <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Đang gửi..." : "Gửi yêu cầu"}</Button>
        </form></CardContent></Card>
        <Card><CardHeader><CardTitle>Lịch sử rút tiền</CardTitle></CardHeader><CardContent className="space-y-3">{withdrawals.length === 0 ? <EmptyState
          compact
          icon={<WalletCards className="h-5 w-5" />}
          title="Chưa có yêu cầu rút tiền"
          description="Sau khi có số dư khả dụng, bạn có thể tạo yêu cầu rút tiền và theo dõi trạng thái xử lý tại đây."
        /> : withdrawals.map(w => <div key={w.id} className="border rounded-lg p-3"><div className="flex justify-between"><strong>{w.amount.toLocaleString('vi-VN')} đ</strong><Badge variant="outline">{w.status}</Badge></div><p className="text-sm text-gray-600 mt-1">{w.bankName} • {w.bankAccountNumber}</p>{w.rejectReason && <p className="text-sm text-red-600 mt-1">{w.rejectReason}</p>}</div>)}</CardContent></Card>
      </TabsContent>
    </Tabs>
  </div>;
}

function WalletSummary({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <Card className={`border-slate-200 shadow-sm ${emphasis ? "bg-slate-900 text-white" : "bg-white"}`}>
    <CardHeader className="pb-2"><CardTitle className={`text-sm ${emphasis ? "text-slate-300" : "text-slate-500"}`}>{label}</CardTitle></CardHeader>
    <CardContent className={`text-2xl font-bold ${emphasis ? "text-white" : "text-slate-950"}`}>{value}</CardContent>
  </Card>;
}

function WorkStat({ label, value }: { label: string; value: number | string }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">{label}</CardTitle></CardHeader>
    <CardContent className="text-2xl font-bold text-slate-950">{value}</CardContent>
  </Card>;
}

function RecentWorkActivity({ participations }: { participations: Participation[] }) {
  if (participations.length === 0) return null;

  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Activity className="h-5 w-5 text-blue-600" />
        Hoạt động công việc gần đây
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {participations.map(item => <div key={item.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium">{item.campaign?.title || `Campaign #${item.campaignId}`}</div>
          <div className="text-sm text-gray-500">Cập nhật {new Date(item.updatedAt).toLocaleString("vi-VN")}</div>
        </div>
        <Badge variant="outline">{item.status}</Badge>
      </div>)}
    </CardContent>
  </Card>;
}
