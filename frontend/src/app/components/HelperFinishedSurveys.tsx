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
import { Activity, ExternalLink, RefreshCw, WalletCards } from "lucide-react";

function message(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải dữ liệu";
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

  if (loading) return <div className="py-16 text-center">Đang tải dữ liệu ví và công việc...</div>;

  return <div className="space-y-6">
    <div className="flex justify-between gap-3 items-center"><div><h1 className="text-3xl font-bold">Công việc và ví</h1><p className="text-gray-600 mt-1">Submission, số dư và giao dịch đều lấy từ backend.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Tải lại</Button></div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="grid sm:grid-cols-3 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Số dư khả dụng</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-700">{(wallet?.availableBalance || 0).toLocaleString('vi-VN')} đ</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Đang xử lý</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{(wallet?.pendingBalance || 0).toLocaleString('vi-VN')} đ</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Tổng đã kiếm</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalEarned.toLocaleString('vi-VN')} đ</CardContent></Card>
    </div>

    <div className="grid sm:grid-cols-4 gap-4">
      <WorkStat label="Campaign đã nhận" value={workStats.total} />
      <WorkStat label="Đang làm" value={workStats.active} />
      <WorkStat label="Chờ duyệt" value={workStats.submitted} />
      <WorkStat label="Đã duyệt" value={workStats.approved} />
    </div>

    <RecentWorkActivity participations={recentActivities} />

    <Tabs defaultValue="work">
      <TabsList><TabsTrigger value="work">Campaign đã nhận</TabsTrigger><TabsTrigger value="transactions">Giao dịch</TabsTrigger><TabsTrigger value="withdraw">Rút tiền</TabsTrigger></TabsList>
      <TabsContent value="work" className="space-y-3 mt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <select className="h-10 rounded-md border bg-white px-3 text-sm" value={workFilter} onChange={event => setWorkFilter(event.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACCEPTED">Đã nhận</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="SUBMITTED">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
          <select className="h-10 rounded-md border bg-white px-3 text-sm" value={workSort} onChange={event => setWorkSort(event.target.value)}>
            <option value="UPDATED_DESC">Mới cập nhật</option>
            <option value="ACCEPTED_ASC">Nhận sớm trước</option>
            <option value="STATUS">Theo trạng thái</option>
          </select>
        </div>
        {participations.length === 0 ? <Card><CardContent className="py-12 text-center"><p className="text-gray-600 mb-3">Bạn chưa nhận campaign nào.</p><Button asChild><Link to="/collaborator/marketplace">Mở Marketplace</Link></Button></CardContent></Card> :
          filteredParticipations.length === 0 ? <Card><CardContent className="py-12 text-center text-gray-500">Không có campaign phù hợp với bộ lọc.</CardContent></Card> :
          filteredParticipations.map(p => <Card key={p.id}><CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><p className="font-semibold">{p.campaign?.title || `Campaign #${p.campaignId}`}</p><p className="text-sm text-gray-500">Nhận lúc {new Date(p.acceptedAt).toLocaleString('vi-VN')}</p></div>
          <div className="flex items-center gap-2"><Badge variant="outline">{p.status}</Badge>{["ACCEPTED", "IN_PROGRESS"].includes(p.status) && <Button size="sm" asChild><Link to={`/collaborator/participation/${p.id}`}><ExternalLink className="w-4 h-4 mr-1" />Mở</Link></Button>}</div>
        </CardContent></Card>)}
      </TabsContent>

      <TabsContent value="transactions" className="mt-4">
        <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="text-left p-3">Thời gian</th><th className="text-left p-3">Loại</th><th className="text-left p-3">Mô tả</th><th className="text-right p-3">Số tiền</th><th className="text-right p-3">Số dư sau</th></tr></thead><tbody>{transactions.map(t => <tr key={t.id} className="border-b"><td className="p-3">{new Date(t.createdAt).toLocaleString('vi-VN')}</td><td className="p-3">{t.type}</td><td className="p-3">{t.description || '-'}</td><td className={`p-3 text-right font-medium ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{t.amount.toLocaleString('vi-VN')} đ</td><td className="p-3 text-right">{t.balanceAfter.toLocaleString('vi-VN')} đ</td></tr>)}</tbody></table>{transactions.length === 0 && <div className="py-12 text-center text-gray-500">Chưa có giao dịch.</div>}</CardContent></Card>
      </TabsContent>

      <TabsContent value="withdraw" className="mt-4 grid lg:grid-cols-2 gap-5">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="w-5 h-5" />Tạo yêu cầu rút tiền</CardTitle></CardHeader><CardContent><form onSubmit={withdraw} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="amount">Số tiền *</Label><Input id="amount" type="number" min="1" max={wallet?.availableBalance || 0} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required /></div>
          <div className="space-y-2"><Label htmlFor="bank">Ngân hàng *</Label><Input id="bank" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} required /></div>
          <div className="space-y-2"><Label htmlFor="accountName">Tên chủ tài khoản *</Label><Input id="accountName" value={form.bankAccountName} onChange={e => setForm({...form, bankAccountName: e.target.value})} required /></div>
          <div className="space-y-2"><Label htmlFor="accountNumber">Số tài khoản *</Label><Input id="accountNumber" value={form.bankAccountNumber} onChange={e => setForm({...form, bankAccountNumber: e.target.value})} required /></div>
          <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Đang gửi..." : "Gửi yêu cầu"}</Button>
        </form></CardContent></Card>
        <Card><CardHeader><CardTitle>Lịch sử rút tiền</CardTitle></CardHeader><CardContent className="space-y-3">{withdrawals.length === 0 ? <p className="text-gray-500">Chưa có yêu cầu.</p> : withdrawals.map(w => <div key={w.id} className="border rounded-lg p-3"><div className="flex justify-between"><strong>{w.amount.toLocaleString('vi-VN')} đ</strong><Badge variant="outline">{w.status}</Badge></div><p className="text-sm text-gray-600 mt-1">{w.bankName} • {w.bankAccountNumber}</p>{w.rejectReason && <p className="text-sm text-red-600 mt-1">{w.rejectReason}</p>}</div>)}</CardContent></Card>
      </TabsContent>
    </Tabs>
  </div>;
}

function WorkStat({ label, value }: { label: string; value: number | string }) {
  return <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader>
    <CardContent className="text-2xl font-bold">{value}</CardContent>
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
