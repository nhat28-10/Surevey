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
import { ExternalLink } from "lucide-react";

function errorText(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
}

function internalQuestions(instruction: string) {
  return instruction
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
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
    if (isInternalForm) {
      setAnswers(prev => questions.map((_, index) => prev[index] || ""));
    }
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

  if (loading) return <div className="py-16 text-center">Đang tải participation...</div>;
  if (!participation?.campaign) return <Alert variant="destructive"><AlertDescription>{error || "Không tìm thấy dữ liệu"}</AlertDescription></Alert>;

  const alreadySubmitted = ["SUBMITTED", "APPROVED"].includes(participation.status);

  return <div className="max-w-3xl mx-auto space-y-5">
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card>
      <CardHeader><CardTitle>{campaign!.title}</CardTitle><CardDescription>{campaign!.description}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {!isInternalForm && <div className="rounded-lg bg-gray-50 p-4 text-sm whitespace-pre-wrap">{campaign!.instruction}</div>}
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>Thưởng: <strong>{campaign!.rewardPerResponse.toLocaleString("vi-VN")} đ</strong></div>
          <div>Trạng thái: <strong>{participation.status}</strong></div>
          <div>Hạn: <strong>{new Date(campaign!.deadline).toLocaleString("vi-VN")}</strong></div>
        </div>
        {campaign!.campaignType === "GOOGLE_FORM" && campaign!.googleFormUrl && <Button type="button" onClick={() => window.open(campaign!.googleFormUrl!, "_blank", "noopener,noreferrer")}><ExternalLink className="w-4 h-4 mr-2" />Mở Google Form</Button>}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{isInternalForm ? "Trả lời form nội bộ" : "Nộp kết quả Google Form"}</CardTitle>
        <CardDescription>{isInternalForm ? "Trả lời trực tiếp trong SureSurvey, không cần confirmation code." : "Nhập email đã dùng trong Google Form để Customer đối chiếu response."}</CardDescription>
      </CardHeader>
      <CardContent>
        {alreadySubmitted ? <Alert><AlertDescription>Participation đã ở trạng thái {participation.status}; backend không cho tạo thêm submission pending/approved.</AlertDescription></Alert> : <form onSubmit={submit} className="space-y-4">
          {isInternalForm ? <>
            {questions.length === 0 && <Alert variant="destructive"><AlertDescription>Campaign này chưa có câu hỏi nội bộ.</AlertDescription></Alert>}
            {questions.map((question, index) => <div key={`${question}-${index}`} className="space-y-2">
              <Label htmlFor={`answer-${index}`}>{index + 1}. {question}</Label>
              <Textarea id={`answer-${index}`} value={answers[index] || ""} onChange={event => setAnswers(prev => prev.map((value, answerIndex) => answerIndex === index ? event.target.value : value))} required maxLength={1000} />
            </div>)}
          </> : <>
            <div className="space-y-2"><Label htmlFor="email">Email đã dùng trong Google Form *</Label><Input id="email" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} required maxLength={200} placeholder="email@example.com" /></div>
            <div className="space-y-2"><Label htmlFor="code">Mã xác nhận nếu Customer có cung cấp</Label><Input id="code" value={form.confirmationCode} onChange={e => setForm({ ...form, confirmationCode: e.target.value })} maxLength={32} /></div>
            <div className="space-y-2"><Label htmlFor="proof">URL bằng chứng nếu có</Label><Input id="proof" type="url" value={form.proofImageUrl} onChange={e => setForm({ ...form, proofImageUrl: e.target.value })} maxLength={1000} /></div>
            <div className="space-y-2"><Label htmlFor="note">Ghi chú</Label><Textarea id="note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} maxLength={2000} /></div>
          </>}
          <div className="grid sm:grid-cols-2 gap-4">
            {isInternalForm && <div className="space-y-2"><Label htmlFor="email-internal">Email liên hệ</Label><Input id="email-internal" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} maxLength={200} /></div>}
            <div className="space-y-2"><Label htmlFor="phone">Số điện thoại</Label><Input id="phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} maxLength={30} /></div>
          </div>
          <Button type="submit" disabled={submitting || (isInternalForm && questions.length === 0)}>{submitting ? "Đang nộp..." : "Nộp kết quả"}</Button>
        </form>}
      </CardContent>
    </Card>
  </div>;
}
