import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { campaignApi } from "../../api/campaignApi";
import { ApiError } from "../../api/httpClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Badge } from "./ui/badge";
import { CalendarClock, ClipboardList, CreditCard, FileText, Link2, Target, WalletCards } from "lucide-react";

type CampaignFormType = "GOOGLE_FORM" | "INTERNAL_FORM";

function money(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export function PostSurvey() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    instruction: "",
    googleFormUrl: "",
    category: "Khác",
    campaignType: "GOOGLE_FORM" as CampaignFormType,
    rewardPerResponse: "1000",
    targetResponses: "10",
    deadline: "",
  });

  const set = (name: string, value: string) => setForm(prev => ({ ...prev, [name]: value }));
  const isGoogleForm = form.campaignType === "GOOGLE_FORM";
  const reward = Number(form.rewardPerResponse || 0);
  const target = Number(form.targetResponses || 0);
  const rewardBudget = reward * target;
  const platformFee = Math.round(rewardBudget * 0.2);
  const estimatedTotal = rewardBudget + platformFee;
  const questionCount = useMemo(() => form.instruction.split(/\r?\n/).map(item => item.trim()).filter(Boolean).length, [form.instruction]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const instruction = form.instruction.trim();

    if (isGoogleForm && !form.googleFormUrl.startsWith("http://") && !form.googleFormUrl.startsWith("https://")) {
      setError("Liên kết Google Form phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    if (!isGoogleForm && !instruction) {
      setError("Form nội bộ cần ít nhất một câu hỏi. Nhập mỗi câu hỏi trên một dòng.");
      return;
    }
    if (!form.deadline || new Date(form.deadline) <= new Date()) {
      setError("Hạn chót phải nằm trong tương lai");
      return;
    }
    if (reward <= 0 || target <= 0) {
      setError("Mức thưởng và số phản hồi phải lớn hơn 0");
      return;
    }

    setSubmitting(true);
    try {
      await campaignApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        instruction: isGoogleForm
          ? instruction || "Hoàn thành Google Form, sau đó quay lại SureVey và nhập email đã dùng trong form."
          : instruction,
        campaignType: form.campaignType,
        googleFormUrl: isGoogleForm ? form.googleFormUrl.trim() : undefined,
        rewardPerResponse: reward,
        targetResponses: target,
        answerCount: 1,
        unitPricePerAnswer: reward,
        deadline: new Date(form.deadline).toISOString(),
        category: form.category.trim() || "Khác",
        submitForReview: false,
      });
      toast.success("Đã tạo campaign. Bước tiếp theo: thanh toán để campaign hiển thị trên marketplace.");
      navigate("/customer/dashboard");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Không thể tạo campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Tạo campaign khảo sát</h1>
        <p className="mt-1 max-w-2xl text-slate-600">Đi theo 3 bước: chọn loại khảo sát, nhập nội dung, rồi xác định ngân sách và thời hạn.</p>
      </div>
      <Button variant="outline" onClick={() => navigate("/customer/dashboard")} className="w-fit border-slate-300 font-semibold text-slate-900 hover:bg-slate-100">Quay lại dashboard</Button>
    </div>

    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <StepCard
          step="01"
          icon={<ClipboardList className="h-5 w-5" />}
          title="Chọn loại campaign"
          description="Google Form phù hợp khi đã có form ngoài; Form nội bộ phù hợp demo luồng trả lời ngay trong SureVey."
        >
          <RadioGroup value={form.campaignType} onValueChange={value => set("campaignType", value as CampaignFormType)}>
            <div className="grid gap-3 md:grid-cols-2">
              <label htmlFor="google-form" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${isGoogleForm ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                <RadioGroupItem value="GOOGLE_FORM" id="google-form" className="mt-1" />
                <span>
                  <strong>Google Form</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">Người làm mở link ngoài, sau đó nộp email đã dùng trong form để Customer đối chiếu.</span>
                </span>
              </label>
              <label htmlFor="internal-form" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${!isGoogleForm ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                <RadioGroupItem value="INTERNAL_FORM" id="internal-form" className="mt-1" />
                <span>
                  <strong>Form nội bộ</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">Người làm trả lời trực tiếp trong SureVey, không cần confirmation code.</span>
                </span>
              </label>
            </div>
          </RadioGroup>
        </StepCard>

        <StepCard
          step="02"
          icon={<FileText className="h-5 w-5" />}
          title="Nội dung khảo sát"
          description="Tiêu đề và mô tả càng rõ thì collaborator càng dễ hiểu yêu cầu trước khi nhận campaign."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label htmlFor="title">Tiêu đề *</Label><Input id="title" value={form.title} onChange={event => set("title", event.target.value)} required maxLength={200} placeholder="Ví dụ: Khảo sát thói quen mua sắm online" /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Mô tả *</Label><Textarea id="description" value={form.description} onChange={event => set("description", event.target.value)} required maxLength={2000} rows={4} placeholder="Mô tả đối tượng cần khảo sát, thời gian dự kiến và yêu cầu chính." /></div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="instruction">{isGoogleForm ? "Hướng dẫn" : "Câu hỏi form nội bộ *"}</Label>
              <Textarea
                id="instruction"
                value={form.instruction}
                onChange={event => set("instruction", event.target.value)}
                maxLength={2000}
                rows={isGoogleForm ? 3 : 6}
                placeholder={isGoogleForm ? "Ví dụ: nhập email trong Google Form để Customer đối chiếu." : "Mỗi dòng là một câu hỏi, ví dụ:\nBạn đang học ngành gì?\nBạn dùng sản phẩm này bao lâu rồi?"}
                required={!isGoogleForm}
              />
            </div>
            {isGoogleForm && <div className="space-y-2 md:col-span-2"><Label htmlFor="url">Google Form *</Label><Input id="url" type="url" placeholder="https://forms.gle/..." value={form.googleFormUrl} onChange={event => set("googleFormUrl", event.target.value)} required /></div>}
          </div>
        </StepCard>

        <StepCard
          step="03"
          icon={<CreditCard className="h-5 w-5" />}
          title="Ngân sách và thời hạn"
          description="Số response mục tiêu sẽ được dùng để theo dõi tiến độ hoàn thành sau khi campaign được thanh toán."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="reward">Thưởng mỗi phản hồi (đ) *</Label><Input id="reward" type="number" min="100" step="100" value={form.rewardPerResponse} onChange={event => set("rewardPerResponse", event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="target">Mục tiêu phản hồi *</Label><Input id="target" type="number" min="1" value={form.targetResponses} onChange={event => set("targetResponses", event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="deadline">Hạn chót *</Label><Input id="deadline" type="datetime-local" value={form.deadline} onChange={event => set("deadline", event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="category">Danh mục *</Label><Input id="category" value={form.category} onChange={event => set("category", event.target.value)} required maxLength={100} /></div>
          </div>
        </StepCard>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-950 text-white">
            <CardTitle className="flex items-center gap-2 text-lg text-white"><WalletCards className="h-5 w-5" />Preview campaign</CardTitle>
            <CardDescription className="text-slate-300">Tóm tắt trước khi tạo campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Tiêu đề</div>
              <div className="mt-1 font-semibold text-slate-950">{form.title.trim() || "Chưa nhập tiêu đề"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1">{isGoogleForm ? "Google Form" : "Form nội bộ"}</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1">{form.category || "Khác"}</Badge>
            </div>
            <PreviewLine icon={<Target className="h-4 w-4" />} label="Response mục tiêu" value={target || 0} />
            <PreviewLine icon={<WalletCards className="h-4 w-4" />} label="Ngân sách thưởng" value={money(rewardBudget)} />
            <PreviewLine icon={<CreditCard className="h-4 w-4" />} label="Phí nền tảng dự kiến" value={money(platformFee)} />
            <PreviewLine icon={<CalendarClock className="h-4 w-4" />} label="Tổng thanh toán dự kiến" value={money(estimatedTotal)} emphasize />
            <PreviewLine icon={<Link2 className="h-4 w-4" />} label={isGoogleForm ? "Link form" : "Số câu hỏi"} value={isGoogleForm ? (form.googleFormUrl ? "Đã nhập" : "Chưa nhập") : questionCount} />
            <Button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white hover:bg-slate-800">{submitting ? "Đang tạo..." : "Tạo campaign"}</Button>
          </CardContent>
        </Card>
      </aside>
    </form>
  </div>;
}

function StepCard({ step, icon, title, description, children }: { step: string; icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader className="border-b border-slate-100">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">{icon}</div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bước {step}</div>
          <CardTitle className="mt-1 text-lg text-slate-950">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-5">{children}</CardContent>
  </Card>;
}

function PreviewLine({ icon, label, value, emphasize = false }: { icon: React.ReactNode; label: string; value: number | string; emphasize?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${emphasize ? "border-slate-300 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}>
    <div className={`flex items-center gap-2 text-sm ${emphasize ? "text-slate-200" : "text-slate-500"}`}>{icon}{label}</div>
    <div className="font-bold">{value}</div>
  </div>;
}
