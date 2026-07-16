import { useCallback, useEffect, useMemo, useState } from "react";
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

function errorText(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải marketplace";
}

export function HelperMarketplace() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([]);
  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => campaigns.filter(c => `${c.title} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase())), [campaigns, query]);

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

  return <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">Marketplace khảo sát</h1>
      <p className="text-gray-600 mt-1">Chỉ hiển thị campaign đã thanh toán, còn hạn và còn lượt nhận.</p>
    </div>
    <div className="relative max-w-xl">
      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tiêu đề, mô tả hoặc danh mục" className="pl-9" />
    </div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {loading ? <div className="py-16 text-center text-gray-600">Đang tải campaign...</div> : filtered.length === 0 ?
      <Card><CardContent className="py-16 text-center text-gray-600">Hiện chưa có campaign phù hợp. Campaign mới sẽ xuất hiện sau khi thanh toán được xác minh.</CardContent></Card> :
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{filtered.map(campaign => <Card key={campaign.id} className="flex flex-col hover:shadow-md transition-shadow">
        <CardHeader><div className="flex justify-between items-start gap-3"><CardTitle className="text-lg">{campaign.title}</CardTitle><Badge variant="outline">{campaign.category}</Badge></div></CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <p className="text-sm text-gray-600 line-clamp-3">{campaign.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-green-600" /><strong>{campaign.rewardPerResponse.toLocaleString("vi-VN")} đ</strong></div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-600" />Còn {campaign.remainingSlots}</div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600" />{new Date(campaign.deadline).toLocaleDateString("vi-VN")}</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" />Link ngoài</div>
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600 line-clamp-3">{campaign.instruction}</div>
          <Button className="mt-auto bg-green-600 hover:bg-green-700" disabled={busyId === campaign.id} onClick={() => void accept(campaign)}>{busyId === campaign.id ? "Đang nhận..." : "Nhận campaign"}</Button>
        </CardContent>
      </Card>)}</div>}
  </div>;
}
