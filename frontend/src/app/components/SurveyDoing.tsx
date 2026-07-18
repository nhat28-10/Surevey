import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "./ui/badge";
import { CalendarClock, CheckCircle2, ExternalLink, FileCheck2, Mail, Phone, WalletCards } from "lucide-react";
import { DetailSkeleton } from "./LoadingStates";

function errorText(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
}

function internalQuestions(instruction: string) {
  return instruction
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function statusText(status: string) {
  if (status === "ACCEPTED") return "Đã nhận";
  if (status === "IN_PROGRESS") return "Đang làm";
  if (status === "SUBMITTED") return "Chờ duyệt";
  if (status === "APPROVED") return "Đã duyệt thưởng";
  if (status === "REJECTED") return "Bị từ chối";
  return status;
}

function statusClass(status: string) {
  if (status === "APPROVED") return "border-green-200 bg-green-100 text-green-800";
  if (status === "SUBMITTED" || status === "ACCEPTED" || status === "IN_PROGRESS") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "REJECTED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
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
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const mine = await participationApi.mine();
        const found = mine.find(item => item.id === participationId) || null;
        if (!found?.campaign) setError("Không tìm thấy participation hoặc backend không trả campaign kèm theo.");
        else setParticipation(found);
      } catch (err) {
        setError(errorText(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [participationId]);

  const campaign = participation?.campaign || null;
  const isInternalForm = campaign?.campaignType === "INTERNAL_FORM";
  const questions = useMemo(() => internalQuestions(campaign?.instruction || ""), [campaign?.instruction]);

  useEffect(() => {
    if (isInternalForm) setAnswers(prev => questions.map((_, index) => prev[index] || ""));
  }, [isInternalForm, questions]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!participation || !campaign) return;
    setError("");

    if (campaign.campaignType === "GOOGLE_FORM" && !form.contactEmail.trim()) {
      setError("Vui lòng nhập email đã dùng trong Google Form để Customer đối chiếu.");
      return;
    }

    let note = form.note.trim();
    if (campaign.campaignType === "INTERNAL_FORM") {
      if (answers.some(answer => !answer.trim())) {
        setError("Vui lòng trả lời đầy đủ các câu hỏi trong form nội bộ.");
        return;
      }
      note = questions.map((question, index) => `Q: ${question}\nA: ${answers[index].trim()}`).join("\n\n");
    }

    setSubmitting(true);
    try {
      await participationApi.submit(participation.id, {
        confirmationCode: form.confirmationCode.trim() || undefined,
        proofImageUrl: form.proofImageUrl.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        note: note || undefined,
      });
      toast.success("Đã nộp kết quả. Customer sẽ kiểm tra và duyệt thưởng.");
      navigate("/collaborator/activities");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!participation?.campaign) return <Alert variant="destructive"><AlertDescription>{error || "Không tìm thấy dữ liệu"}</AlertDescription></Alert>;

  const alreadySubmitted = ["SUBMITTED", "APPROVED"].includes(participation.status);

  return <div className="space-y-6">
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(participation.status)}`}>{statusText(participation.status)}</Badge>
              <Badge variant="outline" className="rounded-full border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100">{isInternalForm ? "Form nội bộ" : "Google Form"}</Badge>
            </div>
            <CardTitle className="max-w-4xl text-2xl text-white">{campaign.title}</CardTitle>
            <CardDescription className="mt-2 max-w-4xl text-slate-300">{campaign.description}</CardDescription>
          </div>
          {campaign.campaignType === "GOOGLE_FORM" && campaign.googleFormUrl && <Button type="button" className="w-fit bg-white text-slate-950 hover:bg-slate-100" onClick={() => window.open(campaign.googleFormUrl!, "_blank", "noopener,noreferrer")}>
            <ExternalLink className="mr-2 h-4 w-4" />Mở Google Form
          </Button>}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
        <InfoMetric icon={<WalletCards className="h-4 w-4" />} label="Thưởng" value={`${campaign.rewardPerResponse.toLocaleString("vi-VN")} đ`} />
        <InfoMetric icon={<CalendarClock className="h-4 w-4" />} label="Hạn chót" value={new Date(campaign.deadline).toLocaleString("vi-VN")} />
        <InfoMetric icon={<FileCheck2 className="h-4 w-4" />} label="Participation" value={`#${participation.id}`} />
      </CardContent>
    </Card>

    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>{isInternalForm ? "Trả lời form nội bộ" : "Nộp kết quả Google Form"}</CardTitle>
          <CardDescription>{isInternalForm ? "Trả lời trực tiếp trong SureSurvey, không cần confirmation code." : "Nhập email đã dùng trong Google Form để Customer đối chiếu response."}</CardDescription>
        </CardHeader>
        <CardContent>
          {alreadySubmitted ? <Alert><AlertDescription>Participation đã ở trạng thái {statusText(participation.status)}; backend không cho tạo thêm submission pending/approved.</AlertDescription></Alert> : <form onSubmit={submit} className="space-y-4">
            {isInternalForm ? <>
              {questions.length === 0 && <Alert variant="destructive"><AlertDescription>Campaign này chưa có câu hỏi nội bộ.</AlertDescription></Alert>}
              {questions.map((question, index) => <div key={`${question}-${index}`} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Label htmlFor={`answer-${index}`} className="font-semibold text-slate-900">{index + 1}. {question}</Label>
                <Textarea id={`answer-${index}`} value={answers[index] || ""} onChange={event => setAnswers(prev => prev.map((value, answerIndex) => answerIndex === index ? event.target.value : value))} required maxLength={1000} className="bg-white" />
              </div>)}
            </> : <>
              <div className="space-y-2"><Label htmlFor="email">Email đã dùng trong Google Form *</Label><Input id="email" type="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} required maxLength={200} placeholder="email@example.com" /></div>
              <div className="space-y-2"><Label htmlFor="code">Mã xác nhận nếu Customer có cung cấp</Label><Input id="code" value={form.confirmationCode} onChange={event => setForm({ ...form, confirmationCode: event.target.value })} maxLength={32} /></div>
              <div className="space-y-2"><Label htmlFor="proof">URL bằng chứng nếu có</Label><Input id="proof" type="url" value={form.proofImageUrl} onChange={event => setForm({ ...form, proofImageUrl: event.target.value })} maxLength={1000} /></div>
              <div className="space-y-2"><Label htmlFor="note">Ghi chú</Label><Textarea id="note" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} maxLength={2000} /></div>
            </>}

            <div className="grid gap-4 sm:grid-cols-2">
              {isInternalForm && <div className="space-y-2"><Label htmlFor="email-internal">Email liên hệ</Label><Input id="email-internal" type="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} maxLength={200} /></div>}
              <div className="space-y-2"><Label htmlFor="phone">Số điện thoại</Label><Input id="phone" value={form.contactPhone} onChange={event => setForm({ ...form, contactPhone: event.target.value })} maxLength={30} /></div>
            </div>
            <Button type="submit" disabled={submitting || (isInternalForm && questions.length === 0)} className="bg-slate-900 text-white hover:bg-slate-800">{submitting ? "Đang nộp..." : "Nộp kết quả"}</Button>
          </form>}
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle className="text-base">Checklist trước khi nộp</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ChecklistItem icon={<CheckCircle2 className="h-4 w-4" />} text={isInternalForm ? "Trả lời đầy đủ từng câu hỏi." : "Hoàn thành Google Form trước."} />
            <ChecklistItem icon={<Mail className="h-4 w-4" />} text="Nhập đúng email để Customer đối chiếu." />
            <ChecklistItem icon={<Phone className="h-4 w-4" />} text="Có thể thêm số điện thoại để liên hệ khi cần." />
          </CardContent>
        </Card>
        {!isInternalForm && <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardContent className="p-4 text-sm leading-6 text-blue-900">Sau khi nộp, trạng thái sẽ chuyển sang chờ duyệt. Khi Customer duyệt, thưởng sẽ được cộng vào ví của bạn.</CardContent>
        </Card>}
      </aside>
    </div>
  </div>;
}

function InfoMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">{icon}{label}</div>
    <div className="mt-1 font-bold text-slate-950">{value}</div>
  </div>;
}

function ChecklistItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-700">
    <span className="mt-0.5 text-slate-900">{icon}</span>
    <span>{text}</span>
  </div>;
}
