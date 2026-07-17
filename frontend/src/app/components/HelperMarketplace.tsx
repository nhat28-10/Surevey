import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { campaignApi } from "../../api/campaignApi";
import type { AvailableCampaign, Participation } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Calendar, Clock, Search, Users, Wallet } from "lucide-react";
import { MarketplaceSkeleton } from "./LoadingStates";
import { EmptyState } from "./EmptyState";

function errorText(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải marketplace";
}

export function HelperMarketplace() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("DEADLINE_ASC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCampaigns(await campaignApi.available());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const categories = useMemo(() => Array.from(new Set(campaigns.map(c => c.category).filter(Boolean))).sort(), [campaigns]);
  const marketplaceStats = useMemo(() => ({
    total: campaigns.length,
    totalSlots: campaigns.reduce((sum, c) => sum + c.remainingSlots, 0),
    bestReward: campaigns.reduce((max, c) => Math.max(max, c.rewardPerResponse), 0),
  }), [campaigns]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const data = campaigns.filter(c => {
      const matchesQuery = `${c.title} ${c.description} ${c.category}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "ALL" || c.category === category;
      return matchesQuery && matchesCategory;
    });

    return data.sort((a, b) => {
      if (sortBy === "REWARD_DESC") return b.rewardPerResponse - a.rewardPerResponse;
      if (sortBy === "SLOTS_DESC") return b.remainingSlots - a.remainingSlots;
      if (sortBy === "NEWEST") return b.id - a.id;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [campaigns, category, query, sortBy]);

  const accept = async (campaign: AvailableCampaign) => {
    setBusyId(campaign.id);
    try {
      const participation = await campaignApi.accept(campaign.id) as Participation;
      toast.success("Đã nhận campaign. Hãy hoàn thành khảo sát rồi nộp mã xác nhận.");
      navigate(`/collaborator/participation/${participation.id}`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <MarketplaceSkeleton />;

  return <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">Marketplace khảo sát</h1>
      <p className="text-gray-600 mt-1">Chỉ hiển thị campaign đã thanh toán, còn hạn và còn lượt nhận.</p>
    </div>
    <div className="grid sm:grid-cols-3 gap-4">
      <Summary label="Campaign khả dụng" value={marketplaceStats.total} />
      <Summary label="Tổng slot còn lại" value={marketplaceStats.totalSlots} />
      <Summary label="Thưởng cao nhất" value={`${marketplaceStats.bestReward.toLocaleString("vi-VN")} đ`} />
    </div>
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_auto_auto]">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tiêu đề, mô tả hoặc danh mục" className="border-slate-300 pl-9 shadow-sm focus:border-slate-700" />
      </div>
      <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={category} onChange={event => setCategory(event.target.value)}>
        <option value="ALL">Tất cả danh mục</option>
        {categories.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200" value={sortBy} onChange={event => setSortBy(event.target.value)}>
        <option value="DEADLINE_ASC">Gần hết hạn trước</option>
        <option value="REWARD_DESC">Thưởng cao trước</option>
        <option value="SLOTS_DESC">Nhiều slot trước</option>
        <option value="NEWEST">Mới nhất</option>
      </select>
    </div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {filtered.length === 0 ?
      <EmptyState
        icon={<Search className="h-5 w-5" />}
        title="Chưa có campaign phù hợp"
        description="Campaign mới sẽ xuất hiện sau khi Customer thanh toán và Admin xác minh. Bạn có thể đổi từ khóa hoặc danh mục để kiểm tra lại."
      /> :
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{filtered.map(campaign => <Card key={campaign.id} className="flex flex-col overflow-hidden border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
        <CardHeader className="border-b border-slate-200 bg-green-50/70">
          <div className="flex justify-between items-start gap-3">
            <CardTitle className="text-lg text-slate-950">{campaign.title}</CardTitle>
            <Badge variant="outline" className="rounded-full border-green-200 bg-green-100 px-3 py-1 text-green-800">{campaign.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 p-4">
          <p className="text-sm text-slate-600 line-clamp-3">{campaign.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MarketMetric icon={<Wallet className="w-4 h-4" />} label="Thưởng" value={`${campaign.rewardPerResponse.toLocaleString("vi-VN")} đ`} tone="green" />
            <MarketMetric icon={<Users className="w-4 h-4" />} label="Còn slot" value={campaign.remainingSlots} tone="orange" />
            <MarketMetric icon={<Calendar className="w-4 h-4" />} label="Hạn" value={new Date(campaign.deadline).toLocaleDateString("vi-VN")} />
            <MarketMetric icon={<Clock className="w-4 h-4" />} label="Loại" value="Link ngoài" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 line-clamp-3">{campaign.instruction}</div>
          <Button className="mt-auto bg-slate-900 font-semibold text-white hover:bg-slate-800" disabled={busyId === campaign.id} onClick={() => void accept(campaign)}>{busyId === campaign.id ? "Đang nhận..." : "Nhận campaign"}</Button>
        </CardContent>
      </Card>)}</div>}
  </div>;
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">{label}</CardTitle></CardHeader>
    <CardContent className="text-2xl font-bold text-slate-950">{value}</CardContent>
  </Card>;
}

function MarketMetric({ icon, label, value, tone = "slate" }: { icon: ReactNode; label: string; value: number | string; tone?: "green" | "orange" | "slate" }) {
  const toneClass = tone === "green"
    ? "border-green-200 bg-green-50 text-green-800"
    : tone === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-800"
      : "border-slate-200 bg-slate-50 text-slate-800";
  return <div className={`rounded-lg border p-3 ${toneClass}`}>
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">{icon}{label}</div>
    <div className="mt-1 font-bold">{value}</div>
  </div>;
}
