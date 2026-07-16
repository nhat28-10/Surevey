import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import type { AdminRevenueSummary, Campaign, CampaignPayment, UserProfile, Withdrawal } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { RefreshCw } from "lucide-react";

function text(error: unknown) { return error instanceof ApiError || error instanceof Error ? error.message : "Không thể xử lý yêu cầu"; }

export function AdminProcessRequests() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payments, setPayments] = useState<CampaignPayment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [revenue, setRevenue] = useState<AdminRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [campaignData, paymentData, withdrawalData, userData, revenueData] = await Promise.all([
        adminApi.pendingCampaigns(), adminApi.payments(), adminApi.withdrawals(), adminApi.users(), adminApi.revenueSummary(),
      ]);
      setCampaigns(campaignData); setPayments(paymentData); setWithdrawals(withdrawalData); setUsers(userData.items); setRevenue(revenueData);
    } catch (err) { setError(text(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try { await action(); toast.success(success); await load(); }
    catch (err) { toast.error(text(err)); }
    finally { setBusy(""); }
  };

  if (loading) return <div className="py-16 text-center">Đang tải dữ liệu Admin từ 3 service...</div>;

  return <div className="space-y-6">
    <div className="flex justify-between gap-3 items-center"><div><h1 className="text-3xl font-bold">Quản trị hệ thống</h1><p className="text-gray-600 mt-1">Chỉ dùng các API có sẵn trong backend gốc.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2"/>Tải lại</Button></div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <div className="grid sm:grid-cols-3 gap-4"><Stat label="Tổng tiền đã xác minh" value={`${(revenue?.totalPaidAmount || 0).toLocaleString("vi-VN")} đ`}/><Stat label="Phí nền tảng" value={`${(revenue?.totalPlatformFeeAmount || 0).toLocaleString("vi-VN")} đ`}/><Stat label="Thanh toán chờ xác minh" value={revenue?.pendingVerifyPaymentCount || 0}/></div>

    <Tabs defaultValue="payments">
      <TabsList className="flex flex-wrap h-auto"><TabsTrigger value="payments">Thanh toán ({payments.length})</TabsTrigger><TabsTrigger value="campaigns">Campaign chờ duyệt ({campaigns.length})</TabsTrigger><TabsTrigger value="withdrawals">Rút tiền ({withdrawals.length})</TabsTrigger><TabsTrigger value="users">Người dùng ({users.length})</TabsTrigger></TabsList>

      <TabsContent value="payments" className="space-y-3 mt-4">{payments.length===0?<Empty text="Chưa có thanh toán."/>:payments.map(payment => <Card key={payment.id}><CardContent className="py-4 space-y-3"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><strong>{payment.paymentCode}</strong><p className="text-sm text-gray-500">Campaign #{payment.campaignId} • Customer #{payment.customerId}</p></div><Badge variant="outline">{payment.status}</Badge></div><div className="grid sm:grid-cols-3 gap-2 text-sm"><span>Tổng: <strong>{payment.totalAmount.toLocaleString("vi-VN")} đ</strong></span><span>Ngân sách: {payment.rewardBudget.toLocaleString("vi-VN")} đ</span><span>Phí: {payment.platformFeeAmount.toLocaleString("vi-VN")} đ</span></div>{payment.proofImageUrl&&<a href={payment.proofImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Mở chứng từ</a>}{payment.rejectReason&&<p className="text-red-600 text-sm">{payment.rejectReason}</p>}
        {payment.status==="PENDING_VERIFY"&&<div className="flex gap-2"><Button disabled={busy===`p-${payment.id}`} onClick={() => void run(`p-${payment.id}`,()=>adminApi.approvePayment(payment.id),"Đã duyệt thanh toán")}>Duyệt</Button><Button variant="destructive" disabled={busy===`p-${payment.id}`} onClick={() => { const reason=window.prompt("Lý do từ chối:"); if(reason?.trim()) void run(`p-${payment.id}`,()=>adminApi.rejectPayment(payment.id,reason.trim()),"Đã từ chối thanh toán"); }}>Từ chối</Button></div>}
      </CardContent></Card>)}</TabsContent>

      <TabsContent value="campaigns" className="space-y-3 mt-4">{campaigns.length===0?<Empty text="Không có campaign PENDING_REVIEW."/>:campaigns.map(campaign => <Card key={campaign.id}><CardContent className="py-4 space-y-3"><div className="flex justify-between gap-2"><div><strong>{campaign.title}</strong><p className="text-sm text-gray-500">Customer #{campaign.customerId} • {campaign.totalAmount.toLocaleString("vi-VN")} đ</p></div><Badge variant="outline">{campaign.status}</Badge></div><p className="text-sm">{campaign.description}</p><div className="flex gap-2"><Button disabled={busy===`c-${campaign.id}`} onClick={() => void run(`c-${campaign.id}`,()=>adminApi.approveCampaign(campaign.id),"Đã duyệt campaign")}>Duyệt</Button><Button variant="destructive" disabled={busy===`c-${campaign.id}`} onClick={() => { const reason=window.prompt("Lý do từ chối:"); if(reason?.trim()) void run(`c-${campaign.id}`,()=>adminApi.rejectCampaign(campaign.id,reason.trim()),"Đã từ chối campaign"); }}>Từ chối</Button></div></CardContent></Card>)}</TabsContent>

      <TabsContent value="withdrawals" className="space-y-3 mt-4">{withdrawals.length===0?<Empty text="Chưa có yêu cầu rút tiền."/>:withdrawals.map(item => <Card key={item.id}><CardContent className="py-4 space-y-3"><div className="flex justify-between"><div><strong>{item.amount.toLocaleString("vi-VN")} đ</strong><p className="text-sm text-gray-500">Collaborator #{item.collaboratorId} • {item.bankName} • {item.bankAccountNumber}</p></div><Badge variant="outline">{item.status}</Badge></div>{item.rejectReason&&<p className="text-sm text-red-600">{item.rejectReason}</p>}
        {item.status==="PENDING"&&<div className="flex gap-2"><Button disabled={busy===`w-${item.id}`} onClick={() => void run(`w-${item.id}`,()=>adminApi.approveWithdrawal(item.id),"Đã duyệt yêu cầu rút")}>Duyệt</Button><Button variant="destructive" disabled={busy===`w-${item.id}`} onClick={() => { const reason=window.prompt("Lý do từ chối:"); if(reason?.trim()) void run(`w-${item.id}`,()=>adminApi.rejectWithdrawal(item.id,reason.trim()),"Đã từ chối yêu cầu"); }}>Từ chối</Button></div>}
        {item.status==="APPROVED"&&<Button disabled={busy===`w-${item.id}`} onClick={() => void run(`w-${item.id}`,()=>adminApi.markWithdrawalPaid(item.id),"Đã đánh dấu đã thanh toán")}>Đánh dấu đã trả</Button>}
      </CardContent></Card>)}</TabsContent>

      <TabsContent value="users" className="mt-4"><Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="p-3 text-left">ID</th><th className="p-3 text-left">Tên đăng nhập</th><th className="p-3 text-left">Họ tên</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Thao tác Wallet</th></tr></thead><tbody>{users.map(user => <tr key={user.userId} className="border-b"><td className="p-3">{user.userId}</td><td className="p-3">{user.userName}</td><td className="p-3">{user.fullName || "-"}</td><td className="p-3">{user.email}</td><td className="p-3"><Button size="sm" variant="outline" disabled={busy===`u-${user.userId}`} onClick={() => { const amount=Number(window.prompt("Số tiền top-up:","10000")); if(amount>0) void run(`u-${user.userId}`,()=>adminApi.topup(user.userId,amount,"Admin top-up từ giao diện"),"Đã top-up ví"); }}>Top-up</Button></td></tr>)}</tbody></table>{users.length===0&&<div className="py-12 text-center text-gray-500">Không có dữ liệu user.</div>}</CardContent></Card><Alert className="mt-4"><AlertDescription>UserService backend gốc không trả role và không có API khóa/mở tài khoản, nên frontend chỉ hiển thị dữ liệu và top-up qua WalletService.</AlertDescription></Alert></TabsContent>
    </Tabs>
  </div>;
}

function Stat({label,value}:{label:string;value:number|string}) { return <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>; }
function Empty({text}:{text:string}) { return <Card><CardContent className="py-12 text-center text-gray-500">{text}</CardContent></Card>; }
