import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { campaignApi } from "../../api/campaignApi";
import { submissionApi } from "../../api/submissionApi";
import type { Campaign, Submission } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

function message(error: unknown) { return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải dữ liệu"; }

export function SurveyDetail() {
  const { surveyId } = useParams();
  const id = Number(surveyId);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [campaignData, submissionData] = await Promise.all([campaignApi.get(id), campaignApi.submissions(id)]);
      setCampaign(campaignData); setSubmissions(submissionData);
    } catch (err) { setError(message(err)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { if (Number.isFinite(id)) void load(); }, [id, load]);

  const counts = useMemo(() => ({
    pending: submissions.filter(s => s.status === "PENDING").length,
    approved: submissions.filter(s => s.status === "APPROVED").length,
    rejected: submissions.filter(s => s.status === "REJECTED").length,
  }), [submissions]);

  const approve = async (submission: Submission) => {
    setBusy(submission.id);
    try { const response = await submissionApi.approve(submission.id); toast.success(response.message || "Đã duyệt submission"); await load(); }
    catch (err) { toast.error(message(err)); }
    finally { setBusy(null); }
  };
  const reject = async (submission: Submission) => {
    const reason = window.prompt("Lý do từ chối:");
    if (!reason?.trim()) return;
    setBusy(submission.id);
    try { const response = await submissionApi.reject(submission.id, reason.trim()); toast.success(response.message || "Đã từ chối submission"); await load(); }
    catch (err) { toast.error(message(err)); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="py-16 text-center">Đang tải chi tiết từ backend...</div>;
  if (!campaign) return <Alert variant="destructive"><AlertDescription>{error || "Không tìm thấy campaign"}</AlertDescription></Alert>;

  return <div className="space-y-6">
    <div className="flex justify-between"><Button variant="outline" asChild><Link to="/customer/dashboard"><ArrowLeft className="w-4 h-4 mr-2"/>Quay lại</Link></Button><Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2"/>Tải lại</Button></div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><CardHeader><div className="flex justify-between gap-3"><CardTitle className="text-2xl">{campaign.title}</CardTitle><Badge variant="outline">{campaign.status}</Badge></div></CardHeader><CardContent className="space-y-3">
      <p>{campaign.description}</p><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm"><div>Mục tiêu: <strong>{campaign.targetResponses}</strong></div><div>Đã duyệt: <strong>{campaign.approvedResponses}</strong></div><div>Thưởng: <strong>{campaign.rewardPerResponse.toLocaleString("vi-VN")} đ</strong></div><div>Hạn: <strong>{new Date(campaign.deadline).toLocaleDateString("vi-VN")}</strong></div></div>
      {campaign.campaignType === "GOOGLE_FORM"
        ? <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm">Google Form: duyệt submission bằng cách đối chiếu email collaborator nhập với response trong Google Form. Mã xác nhận chỉ dùng nếu Customer tự cung cấp thêm.</div>
        : <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm">Form nội bộ: collaborator trả lời trực tiếp trong SureSurvey, hệ thống lưu câu trả lời ở phần ghi chú submission.</div>}
      {campaign.googleFormUrl && <Button variant="outline" type="button" onClick={() => window.open(campaign.googleFormUrl!,"_blank","noopener,noreferrer")}><ExternalLink className="w-4 h-4 mr-2"/>Mở form</Button>}
    </CardContent></Card>
    <div className="grid sm:grid-cols-4 gap-4"><Stat label="Tổng submission" value={submissions.length}/><Stat label="Đang chờ" value={counts.pending}/><Stat label="Đã duyệt" value={counts.approved}/><Stat label="Bị từ chối" value={counts.rejected}/></div>
    <Card><CardHeader><CardTitle>Submission</CardTitle></CardHeader><CardContent className="space-y-3">{submissions.length === 0 ? <p className="text-gray-500 py-8 text-center">Chưa có submission.</p> : submissions.map(submission => <div key={submission.id} className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between gap-2"><div><strong>Submission #{submission.id}</strong><p className="text-sm text-gray-500">Collaborator #{submission.collaboratorId} • {new Date(submission.createdAt).toLocaleString("vi-VN")}</p></div><Badge variant="outline">{submission.status}</Badge></div>
      {submission.contactEmail && <p className="text-sm">Email đối chiếu: <strong>{submission.contactEmail}</strong></p>}{submission.contactPhone && <p className="text-sm">Số điện thoại: <strong>{submission.contactPhone}</strong></p>}{submission.confirmationCode && <p className="text-sm">Mã xác nhận: <span className="font-mono">{submission.confirmationCode}</span></p>}{submission.note && <p className="text-sm whitespace-pre-wrap">Ghi chú / câu trả lời: {submission.note}</p>}{submission.proofImageUrl && <a className="text-sm text-blue-600 underline" href={submission.proofImageUrl} target="_blank" rel="noreferrer">Mở bằng chứng</a>}{submission.rejectReason && <p className="text-sm text-red-600">Lý do: {submission.rejectReason}</p>}
      {submission.status === "PENDING" && <div className="flex gap-2"><Button size="sm" disabled={busy===submission.id} onClick={() => void approve(submission)}>Duyệt & trả thưởng</Button><Button size="sm" variant="destructive" disabled={busy===submission.id} onClick={() => void reject(submission)}>Từ chối</Button></div>}
    </div>)}</CardContent></Card>
  </div>;
}

function Stat({label,value}:{label:string;value:number|string}) { return <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>; }
