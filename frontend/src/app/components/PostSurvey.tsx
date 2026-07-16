import { useState } from "react";
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

export function PostSurvey() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", instruction: "", googleFormUrl: "", category: "Khác",
    rewardPerResponse: "1000", targetResponses: "10", deadline: "",
  });

  const set = (name: string, value: string) => setForm(prev => ({ ...prev, [name]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const reward = Number(form.rewardPerResponse);
    const target = Number(form.targetResponses);
    if (!form.googleFormUrl.startsWith("http://") && !form.googleFormUrl.startsWith("https://")) {
      setError("Liên kết khảo sát phải bắt đầu bằng http:// hoặc https://"); return;
    }
    if (!form.deadline || new Date(form.deadline) <= new Date()) {
      setError("Hạn chót phải nằm trong tương lai"); return;
    }
    if (reward <= 0 || target <= 0) { setError("Mức thưởng và số phản hồi phải lớn hơn 0"); return; }

    setSubmitting(true);
    try {
      await campaignApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        instruction: form.instruction.trim() || "Hoàn thành khảo sát và nhập mã xác nhận được cung cấp ở cuối biểu mẫu.",
        campaignType: "GOOGLE_FORM",
        googleFormUrl: form.googleFormUrl.trim(),
        rewardPerResponse: reward,
        targetResponses: target,
        answerCount: 1,
        unitPricePerAnswer: reward,
        deadline: new Date(form.deadline).toISOString(),
        category: form.category.trim() || "Khác",
        submitForReview: false,
      });
      toast.success("Đã tạo campaign. Bước tiếp theo: tạo thanh toán và gửi chứng từ.");
      navigate("/customer/dashboard");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Không thể tạo campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="max-w-3xl mx-auto">
    <Card><CardHeader><CardTitle className="text-2xl">Tạo campaign khảo sát</CardTitle><CardDescription>Campaign link ngoài hoạt động đầy đủ qua backend. Survey Builder nội bộ được tách riêng để không trộn dữ liệu nháp với production.</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-5">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-2"><Label htmlFor="title">Tiêu đề *</Label><Input id="title" value={form.title} onChange={e => set("title", e.target.value)} required maxLength={200} /></div>
        <div className="space-y-2"><Label htmlFor="description">Mô tả *</Label><Textarea id="description" value={form.description} onChange={e => set("description", e.target.value)} required maxLength={2000} rows={4} /></div>
        <div className="space-y-2"><Label htmlFor="instruction">Hướng dẫn</Label><Textarea id="instruction" value={form.instruction} onChange={e => set("instruction", e.target.value)} maxLength={2000} rows={3} /></div>
        <div className="space-y-2"><Label htmlFor="url">Google Form / liên kết ngoài *</Label><Input id="url" type="url" placeholder="https://forms.gle/..." value={form.googleFormUrl} onChange={e => set("googleFormUrl", e.target.value)} required /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="reward">Thưởng mỗi phản hồi (đ) *</Label><Input id="reward" type="number" min="1" step="100" value={form.rewardPerResponse} onChange={e => set("rewardPerResponse", e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="target">Mục tiêu phản hồi *</Label><Input id="target" type="number" min="1" value={form.targetResponses} onChange={e => set("targetResponses", e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="deadline">Hạn chót *</Label><Input id="deadline" type="datetime-local" value={form.deadline} onChange={e => set("deadline", e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="category">Danh mục *</Label><Input id="category" value={form.category} onChange={e => set("category", e.target.value)} required maxLength={100} /></div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-sm">Ngân sách thưởng: <strong>{(Number(form.rewardPerResponse || 0) * Number(form.targetResponses || 0)).toLocaleString('vi-VN')} đ</strong>. Phí nền tảng 20% sẽ được tính ở bước thanh toán.</div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => navigate("/customer/dashboard")}>Hủy</Button><Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">{submitting ? "Đang tạo..." : "Tạo campaign"}</Button></div>
      </form></CardContent>
    </Card>
  </div>;
}
