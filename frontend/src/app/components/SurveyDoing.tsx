import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { participationApi } from "../../api/participationApi";
import type { Participation } from "../../api/types";
import { ApiError } from "../../api/httpClient";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { ExternalLink } from "lucide-react";

function errorText(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
}

export function SurveyDoing() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const participationId = Number(surveyId);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ confirmationCode: "", proofImageUrl: "", contactEmail: "", contactPhone: "", note: "" });

  useEffect(() => {
    void (async () => {
      try {
        const mine = await participationApi.mine();
        const found = mine.find(item => item.id === participationId) || null;
        if (!found?.campaign) setError("Không tìm thấy participation hoặc backend không trả campaign kèm theo.");
        else setParticipation(found);
      } catch (err) { setError(errorText(err)); }
      finally { setLoading(false); }
    })();
  }, [participationId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!participation) return;
    if (!form.confirmationCode.trim()) { setError("Confirmation code là bắt buộc theo backend."); return; }
    setSubmitting(true); setError("");
    try {
      await participationApi.submit(participation.id, {
        confirmationCode: form.confirmationCode.trim(),
        proofImageUrl: form.proofImageUrl.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      toast.success("Đã nộp submission vào SurveyService");
      navigate("/collaborator/activities");
    } catch (err) { setError(errorText(err)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="py-16 text-center">Đang tải participation...</div>;
  if (!participation?.campaign) return <Alert variant="destructive"><AlertDescription>{error || "Không tìm thấy dữ liệu"}</AlertDescription></Alert>;

  const campaign = participation.campaign;
  const alreadySubmitted = ["SUBMITTED", "APPROVED"].includes(participation.status);

  return <div className="max-w-3xl mx-auto space-y-5">
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card><CardHeader><CardTitle>{campaign.title}</CardTitle><CardDescription>{campaign.description}</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="rounded-lg bg-gray-50 p-4 text-sm whitespace-pre-wrap">{campaign.instruction}</div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm"><div>Thưởng: <strong>{campaign.rewardPerResponse.toLocaleString("vi-VN")} đ</strong></div><div>Trạng thái: <strong>{participation.status}</strong></div><div>Hạn: <strong>{new Date(campaign.deadline).toLocaleString("vi-VN")}</strong></div></div>
      {campaign.googleFormUrl ? <Button type="button" onClick={() => window.open(campaign.googleFormUrl!, "_blank", "noopener,noreferrer")}><ExternalLink className="w-4 h-4 mr-2"/>Mở khảo sát bên ngoài</Button> : <Alert variant="destructive"><AlertDescription>Campaign không có GoogleFormUrl. Backend hiện chưa triển khai Internal Form Builder.</AlertDescription></Alert>}
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Nộp kết quả</CardTitle><CardDescription>Request gửi đúng SubmitSubmissionRequest của backend.</CardDescription></CardHeader><CardContent>
      {alreadySubmitted ? <Alert><AlertDescription>Participation đã ở trạng thái {participation.status}; backend không cho tạo thêm submission pending/approved.</AlertDescription></Alert> : <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="code">Confirmation code *</Label><Input id="code" value={form.confirmationCode} onChange={e => setForm({...form,confirmationCode:e.target.value})} required maxLength={32}/></div>
        <div className="space-y-2"><Label htmlFor="proof">URL bằng chứng</Label><Input id="proof" type="url" value={form.proofImageUrl} onChange={e => setForm({...form,proofImageUrl:e.target.value})} maxLength={1000}/></div>
        <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="email">Email liên hệ</Label><Input id="email" type="email" value={form.contactEmail} onChange={e => setForm({...form,contactEmail:e.target.value})} maxLength={200}/></div><div className="space-y-2"><Label htmlFor="phone">Số điện thoại</Label><Input id="phone" value={form.contactPhone} onChange={e => setForm({...form,contactPhone:e.target.value})} maxLength={30}/></div></div>
        <div className="space-y-2"><Label htmlFor="note">Ghi chú</Label><Textarea id="note" value={form.note} onChange={e => setForm({...form,note:e.target.value})} maxLength={2000}/></div>
        <Button type="submit" disabled={submitting}>{submitting ? "Đang nộp..." : "Nộp submission"}</Button>
      </form>}
    </CardContent></Card>
  </div>;
}
