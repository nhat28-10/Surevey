import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Progress } from "./ui/progress";
import { ArrowLeft, BarChart3, CheckCircle2, Clock, Download, ExternalLink, FileCheck2, FileText, RefreshCw, Target, Users, WalletCards, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DetailSkeleton } from "./LoadingStates";
import { EmptyState } from "./EmptyState";
import { exportToXlsx } from "../utils/exportXlsx";

const statusLabels: Record<string, string> = {
  DRAFT: "Chờ thanh toán",
  PENDING_REVIEW: "Chờ xử lý",
  ACTIVE: "Đang hiển thị",
  REJECTED: "Bị từ chối",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const paymentLabels: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAYMENT_PENDING: "Chờ thanh toán",
  PAYMENT_VERIFYING: "Chờ xác minh",
  PAID: "Đã thanh toán",
  PAYMENT_REJECTED: "Thanh toán bị từ chối",
};

const submissionLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  RESUBMISSION_REQUIRED: "Cần nộp lại",
};

function message(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải dữ liệu";
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function campaignStatusClass(status: string) {
  if (status === "ACTIVE" || status === "COMPLETED") return "border-green-200 bg-green-100 text-green-800";
  if (status === "PENDING_REVIEW" || status === "DRAFT" || status === "PAUSED") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function paymentStatusClass(status: string) {
  if (status === "PAID") return "border-green-200 bg-green-100 text-green-800";
  if (status === "PAYMENT_VERIFYING" || status === "PAYMENT_PENDING" || status === "UNPAID") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "PAYMENT_REJECTED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function submissionStatusClass(status: string) {
  if (status === "APPROVED") return "border-green-200 bg-green-100 text-green-800";
  if (status === "PENDING" || status === "RESUBMISSION_REQUIRED") return "border-amber-200 bg-amber-100 text-amber-900";
  if (status === "REJECTED") return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function SurveyDetail() {
  const { surveyId } = useParams();
  const id = Number(surveyId);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [campaignData, submissionData] = await Promise.all([campaignApi.get(id), campaignApi.submissions(id)]);
      setCampaign(campaignData);
      setSubmissions(submissionData);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isFinite(id)) void load();
  }, [id, load]);

  const counts = useMemo(() => ({
    pending: submissions.filter(s => s.status === "PENDING").length,
    approved: submissions.filter(s => s.status === "APPROVED").length,
    rejected: submissions.filter(s => s.status === "REJECTED").length,
  }), [submissions]);

  const report = useMemo(() => {
    const total = submissions.length;
    const reviewed = counts.approved + counts.rejected;
    const approvedSubmissions = submissions.filter(submission => submission.status === "APPROVED");

    return {
      reviewed,
      approvalRate: reviewed ? Math.round(counts.approved / reviewed * 100) : 0,
      submissionRate: campaign?.targetResponses ? Math.min(100, Math.round(total / campaign.targetResponses * 100)) : 0,
      approvedSubmissions,
      statusChart: [
        { name: "Chờ duyệt", value: counts.pending, color: "#f59e0b" },
        { name: "Đã duyệt", value: counts.approved, color: "#16a34a" },
        { name: "Bị từ chối", value: counts.rejected, color: "#dc2626" },
      ].filter(item => item.value > 0),
      goalChart: campaign ? [
        { name: "Đã duyệt", value: campaign.approvedResponses, color: "#16a34a" },
        { name: "Còn thiếu", value: Math.max(campaign.targetResponses - campaign.approvedResponses, 0), color: "#cbd5e1" },
      ].filter(item => item.value > 0) : [],
      answerInsights: parseInternalAnswerInsights(approvedSubmissions),
    };
  }, [campaign, counts.approved, counts.pending, counts.rejected, submissions]);

  const approve = async (submission: Submission) => {
    setBusy(submission.id);
    try {
      const response = await submissionApi.approve(submission.id);
      toast.success(response.message || "Đã duyệt submission");
      await load();
    } catch (err) {
      toast.error(message(err));
    } finally {
      setBusy(null);
    }
  };

  const reject = async (submission: Submission) => {
    const reason = window.prompt("Lý do từ chối:");
    if (!reason?.trim()) return;
    setBusy(submission.id);
    try {
      const response = await submissionApi.reject(submission.id, reason.trim());
      toast.success(response.message || "Đã từ chối submission");
      await load();
    } catch (err) {
      toast.error(message(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!campaign) return <Alert variant="destructive"><AlertDescription>{error || "Không tìm thấy campaign"}</AlertDescription></Alert>;

  const progress = campaign.targetResponses ? Math.min(100, campaign.approvedResponses / campaign.targetResponses * 100) : 0;
  const remainingResponses = Math.max(campaign.targetResponses - campaign.approvedResponses, 0);
  const isGoogleForm = campaign.campaignType === "GOOGLE_FORM";
  const rewardBudget = campaign.rewardBudget || campaign.targetResponses * campaign.rewardPerResponse;
  const spentReward = campaign.approvedResponses * campaign.rewardPerResponse;
  const remainingReward = Math.max(rewardBudget - spentReward, 0);
  const exportSubmissions = () => exportToXlsx(`campaign-${campaign.id}-submissions`, "Submissions", submissions.map(submission => ({
    "Submission ID": submission.id,
    "Collaborator ID": submission.collaboratorId,
    "Trạng thái": submissionLabels[submission.status] || submission.status,
    "Email đối chiếu": submission.contactEmail || "",
    "Số điện thoại": submission.contactPhone || "",
    "Mã xác nhận": submission.confirmationCode || "",
    "Ghi chú": submission.note || "",
    "Lý do từ chối": submission.rejectReason || "",
    "Ngày nộp": new Date(submission.createdAt).toLocaleString("vi-VN"),
    "Cập nhật": new Date(submission.updatedAt).toLocaleString("vi-VN"),
  })));
  const exportReport = () => exportToXlsx(`campaign-${campaign.id}-report`, "Report", [
    { "Nhóm": "Tổng quan", "Chỉ số": "Mục tiêu response", "Giá trị": campaign.targetResponses },
    { "Nhóm": "Tổng quan", "Chỉ số": "Submission đã nộp", "Giá trị": submissions.length },
    { "Nhóm": "Tổng quan", "Chỉ số": "Response đã duyệt", "Giá trị": campaign.approvedResponses },
    { "Nhóm": "Tổng quan", "Chỉ số": "Response còn thiếu", "Giá trị": remainingResponses },
    { "Nhóm": "Tổng quan", "Chỉ số": "Tỷ lệ hoàn thành", "Giá trị": `${Math.round(progress)}%` },
    { "Nhóm": "Tổng quan", "Chỉ số": "Tỷ lệ submission/mục tiêu", "Giá trị": `${report.submissionRate}%` },
    { "Nhóm": "Tổng quan", "Chỉ số": "Tỷ lệ duyệt trên submission đã xử lý", "Giá trị": `${report.approvalRate}%` },
    { "Nhóm": "Tài chính", "Chỉ số": "Ngân sách thưởng", "Giá trị": rewardBudget },
    { "Nhóm": "Tài chính", "Chỉ số": "Đã dùng cho response duyệt", "Giá trị": spentReward },
    { "Nhóm": "Tài chính", "Chỉ số": "Còn lại dự kiến", "Giá trị": remainingReward },
    ...report.answerInsights.flatMap(insight => insight.answers.map(answer => ({
      "Nhóm": "Câu trả lời",
      "Chỉ số": insight.question,
      "Giá trị": `${answer.answer} (${answer.count}/${insight.total})`,
    }))),
  ]);
  const timelineItems = [
    {
      title: "Campaign được tạo",
      description: `Customer tạo campaign với mục tiêu ${campaign.targetResponses.toLocaleString("vi-VN")} response.`,
      time: campaign.createdAt,
      tone: "slate" as const,
    },
    {
      title: paymentLabels[campaign.paymentStatus] || campaign.paymentStatus,
      description: campaign.paymentStatus === "PAID"
        ? "Thanh toán đã được xác minh, campaign đủ điều kiện hiển thị khi được duyệt."
        : "Campaign cần hoàn tất thanh toán hoặc chờ Admin xác minh.",
      time: campaign.updatedAt,
      tone: campaign.paymentStatus === "PAID" ? "green" as const : "amber" as const,
    },
    {
      title: `${submissions.length.toLocaleString("vi-VN")} submission đã nộp`,
      description: `${counts.pending} chờ duyệt, ${counts.approved} đã duyệt, ${counts.rejected} bị từ chối.`,
      time: submissions[0]?.createdAt || campaign.updatedAt,
      tone: "blue" as const,
    },
    {
      title: "Cập nhật gần nhất",
      description: `${campaign.approvedResponses}/${campaign.targetResponses} response đã được duyệt.`,
      time: campaign.updatedAt,
      tone: remainingResponses === 0 && campaign.targetResponses > 0 ? "green" as const : "slate" as const,
    },
  ];

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button variant="outline" asChild className="w-fit border-slate-300 font-semibold text-slate-900 hover:bg-slate-100">
        <Link to="/customer/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại dashboard</Link>
      </Button>
      <Button variant="outline" onClick={() => void load()} className="w-fit border-slate-300 font-semibold text-slate-900 hover:bg-slate-100">
        <RefreshCw className="mr-2 h-4 w-4" />Tải lại
      </Button>
    </div>

    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${campaignStatusClass(campaign.status)}`}>{statusLabels[campaign.status] || campaign.status}</Badge>
              <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-semibold ${paymentStatusClass(campaign.paymentStatus)}`}>{paymentLabels[campaign.paymentStatus] || campaign.paymentStatus}</Badge>
              <Badge variant="outline" className="rounded-full border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100">{campaign.category}</Badge>
            </div>
            <CardTitle className="max-w-4xl text-2xl text-white">{campaign.title}</CardTitle>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{campaign.description || "Campaign chưa có mô tả."}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-wide text-slate-400">Hoàn thành</div>
            <div className="mt-1 text-3xl font-bold text-white">{Math.round(progress)}%</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-slate-700">{campaign.approvedResponses}/{campaign.targetResponses} response đã duyệt</span>
            <span className={remainingResponses === 0 && campaign.targetResponses > 0 ? "text-green-700" : "text-orange-700"}>
              {campaign.targetResponses === 0 ? "Chưa có mục tiêu" : remainingResponses === 0 ? "Đã đạt mục tiêu" : `Còn ${remainingResponses} response để đạt 100%`}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailMetric icon={<Target className="h-4 w-4" />} label="Mục tiêu" value={campaign.targetResponses.toLocaleString("vi-VN")} />
          <DetailMetric icon={<CheckCircle2 className="h-4 w-4" />} label="Đã duyệt" value={campaign.approvedResponses.toLocaleString("vi-VN")} tone="green" />
          <DetailMetric icon={<WalletCards className="h-4 w-4" />} label="Thưởng mỗi response" value={money(campaign.rewardPerResponse)} />
          <DetailMetric icon={<Clock className="h-4 w-4" />} label="Hạn chót" value={new Date(campaign.deadline).toLocaleDateString("vi-VN")} />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Hướng dẫn cho collaborator</div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{campaign.instruction || "Chưa có hướng dẫn."}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            {isGoogleForm
              ? "Google Form: duyệt submission bằng cách đối chiếu email collaborator nhập với response trong Google Form. Mã xác nhận chỉ dùng nếu Customer tự cung cấp thêm."
              : "Form nội bộ: collaborator trả lời trực tiếp trong SureVey, hệ thống lưu câu trả lời ở phần ghi chú submission."}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {campaign.googleFormUrl && <Button variant="outline" type="button" className="border-blue-200 bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100" onClick={() => window.open(campaign.googleFormUrl!, "_blank", "noopener,noreferrer")}>
            <ExternalLink className="mr-2 h-4 w-4" />Mở form
          </Button>}
        </div>
      </CardContent>
    </Card>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<FileText className="h-4 w-4" />} label="Tổng submission" value={submissions.length} />
      <Stat icon={<Clock className="h-4 w-4" />} label="Đang chờ" value={counts.pending} />
      <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Đã duyệt" value={counts.approved} />
      <Stat icon={<XCircle className="h-4 w-4" />} label="Bị từ chối" value={counts.rejected} />
    </div>

    <CustomerReportPanel
      campaign={campaign}
      submissions={submissions}
      report={report}
      progress={progress}
      remainingResponses={remainingResponses}
      isGoogleForm={isGoogleForm}
      onExport={exportReport}
    />

    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <WalletCards className="h-5 w-5 text-slate-700" />
          Báo cáo mini campaign
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportMetric label="Ngân sách thưởng" value={money(rewardBudget)} />
        <ReportMetric label="Đã dùng cho response duyệt" value={money(spentReward)} />
        <ReportMetric label="Còn lại dự kiến" value={money(remainingReward)} />
        <ReportMetric label="Tổng thanh toán" value={money(campaign.totalAmount)} />
      </CardContent>
    </Card>

    <TimelineCard title="Nhật ký hoạt động campaign" items={timelineItems} />

    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCheck2 className="h-5 w-5 text-slate-700" />
            Submission cần kiểm tra
          </CardTitle>
          <Button type="button" variant="outline" className="w-fit border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" disabled={submissions.length === 0} onClick={exportSubmissions}>
            <Download className="mr-2 h-4 w-4" />Xuất Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.length === 0 ? <EmptyState
          compact
          icon={<Users className="h-5 w-5" />}
          title="Chưa có submission"
          description="Khi collaborator nhận và hoàn thành khảo sát, submission sẽ xuất hiện ở đây để Customer kiểm tra và duyệt thưởng."
        /> : submissions.map(submission => <SubmissionCard
          key={submission.id}
          submission={submission}
          busy={busy === submission.id}
          onApprove={() => void approve(submission)}
          onReject={() => void reject(submission)}
        />)}
      </CardContent>
    </Card>
  </div>;
}

type AnswerInsight = {
  question: string;
  total: number;
  answers: Array<{ answer: string; count: number }>;
};

type SurveyReport = {
  reviewed: number;
  approvalRate: number;
  submissionRate: number;
  approvedSubmissions: Submission[];
  statusChart: Array<{ name: string; value: number; color: string }>;
  goalChart: Array<{ name: string; value: number; color: string }>;
  answerInsights: AnswerInsight[];
};

function CustomerReportPanel({
  campaign,
  submissions,
  report,
  progress,
  remainingResponses,
  isGoogleForm,
  onExport,
}: {
  campaign: Campaign;
  submissions: Submission[];
  report: SurveyReport;
  progress: number;
  remainingResponses: number;
  isGoogleForm: boolean;
  onExport: () => void;
}) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader className="border-b border-slate-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-slate-700" />
            Báo cáo kết quả khảo sát
          </CardTitle>
          <p className="mt-1 text-sm leading-6 text-slate-500">Theo dõi chất lượng response và xem nhanh kết quả thu được từ campaign.</p>
        </div>
        <Button type="button" variant="outline" className="w-fit border-slate-300 font-semibold text-slate-900 hover:bg-slate-100" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />Xuất báo cáo
        </Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-5 p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportInsightMetric label="Hoàn thành mục tiêu" value={`${Math.round(progress)}%`} helper={remainingResponses === 0 ? "Đã đủ response đã duyệt" : `Còn ${remainingResponses.toLocaleString("vi-VN")} response`} tone={remainingResponses === 0 ? "green" : "amber"} />
        <ReportInsightMetric label="Submission/mục tiêu" value={`${report.submissionRate}%`} helper={`${submissions.length.toLocaleString("vi-VN")}/${campaign.targetResponses.toLocaleString("vi-VN")} submission`} />
        <ReportInsightMetric label="Tỷ lệ duyệt" value={`${report.approvalRate}%`} helper={`${report.reviewed.toLocaleString("vi-VN")} submission đã xử lý`} tone="green" />
        <ReportInsightMetric label="Response hợp lệ" value={report.approvedSubmissions.length.toLocaleString("vi-VN")} helper="Dùng cho thống kê câu trả lời" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Tiến độ đạt mục tiêu" empty={report.goalChart.length === 0}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={report.goalChart} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={84} tick={{ fill: "#475569", fontSize: 12 }} />
              <Tooltip formatter={(value: number) => value.toLocaleString("vi-VN")} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {report.goalChart.map(item => <Cell key={item.name} fill={item.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Trạng thái submission" empty={report.statusChart.length === 0}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={report.statusChart} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                {report.statusChart.map(item => <Cell key={item.name} fill={item.color} />)}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [value.toLocaleString("vi-VN"), name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {report.statusChart.map(item => <div key={item.name} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
              <span className="font-bold text-slate-950">{item.value}</span>
            </div>)}
          </div>
        </ChartPanel>
      </div>

      <AnswerInsightPanel insights={report.answerInsights} isGoogleForm={isGoogleForm} approvedCount={report.approvedSubmissions.length} />
    </CardContent>
  </Card>;
}

function ReportInsightMetric({ label, value, helper, tone = "slate" }: { label: string; value: string; helper: string; tone?: "slate" | "green" | "amber" }) {
  const toneClass = tone === "green"
    ? "border-green-200 bg-green-50 text-green-900"
    : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-slate-200 bg-slate-50 text-slate-950";

  return <div className={`rounded-lg border p-4 ${toneClass}`}>
    <div className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</div>
    <div className="mt-2 text-2xl font-bold">{value}</div>
    <div className="mt-1 text-sm opacity-75">{helper}</div>
  </div>;
}

function ChartPanel({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div className="mb-3 text-sm font-semibold text-slate-950">{title}</div>
    {empty ? <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">
      Chưa có dữ liệu để vẽ biểu đồ.
    </div> : children}
  </div>;
}

function AnswerInsightPanel({ insights, isGoogleForm, approvedCount }: { insights: AnswerInsight[]; isGoogleForm: boolean; approvedCount: number }) {
  if (isGoogleForm) {
    return <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
      Campaign dùng Google Form nên câu trả lời chi tiết nằm trong Google Forms/Sheets. SureVey vẫn thống kê được tiến độ, trạng thái submission và dữ liệu duyệt thưởng.
    </div>;
  }

  if (approvedCount === 0) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
      Chưa có response đã duyệt để tổng hợp câu trả lời.
    </div>;
  }

  if (insights.length === 0) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      Đã có response được duyệt, nhưng phần ghi chú chưa theo format câu hỏi/câu trả lời nên chưa thể gom thống kê tự động.
    </div>;
  }

  return <div className="space-y-3">
    <div>
      <div className="text-sm font-semibold text-slate-950">Tổng hợp câu trả lời form nội bộ</div>
      <p className="mt-1 text-sm text-slate-500">Hiển thị các câu trả lời xuất hiện nhiều nhất trên những response đã được duyệt.</p>
    </div>
    <div className="grid gap-3 lg:grid-cols-2">
      {insights.map(insight => <div key={insight.question} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="line-clamp-2 text-sm font-semibold text-slate-950">{insight.question}</div>
        <div className="mt-3 space-y-2">
          {insight.answers.slice(0, 5).map(answer => {
            const width = insight.total ? Math.max(8, Math.round(answer.count / insight.total * 100)) : 0;
            return <div key={answer.answer} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-slate-700">{answer.answer}</span>
                <span className="shrink-0 font-semibold text-slate-950">{answer.count}/{insight.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-slate-800" style={{ width: `${width}%` }} />
              </div>
            </div>;
          })}
        </div>
      </div>)}
    </div>
  </div>;
}

function parseInternalAnswerInsights(submissions: Submission[]): AnswerInsight[] {
  const questionMap = new Map<string, Map<string, number>>();

  submissions.forEach(submission => {
    const note = submission.note?.replace(/\r\n/g, "\n").trim();
    if (!note) return;

    const matches = note.matchAll(/Q:\s*([\s\S]*?)\nA:\s*([\s\S]*?)(?=\n\nQ:|$)/g);
    for (const match of matches) {
      const question = normalizeInsightText(match[1]);
      const answer = normalizeInsightText(match[2]);
      if (!question || !answer) continue;

      if (!questionMap.has(question)) questionMap.set(question, new Map<string, number>());
      const answerMap = questionMap.get(question)!;
      answerMap.set(answer, (answerMap.get(answer) || 0) + 1);
    }
  });

  return Array.from(questionMap.entries()).map(([question, answerMap]) => {
    const answers = Array.from(answerMap.entries())
      .map(([answer, count]) => ({ answer, count }))
      .sort((left, right) => right.count - left.count || left.answer.localeCompare(right.answer, "vi"));

    return {
      question,
      total: answers.reduce((sum, answer) => sum + answer.count, 0),
      answers,
    };
  });
}

function normalizeInsightText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function DetailMetric({ icon, label, value, tone = "slate" }: { icon: ReactNode; label: string; value: number | string; tone?: "slate" | "green" }) {
  const toneClass = tone === "green" ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-slate-50 text-slate-800";
  return <div className={`rounded-lg border p-4 ${toneClass}`}>
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-80">{icon}{label}</div>
    <div className="mt-2 text-xl font-bold">{value}</div>
  </div>;
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-slate-500">{icon}{label}</CardTitle></CardHeader>
    <CardContent className="text-2xl font-bold text-slate-950">{value}</CardContent>
  </Card>;
}

function ReportMetric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-2 text-lg font-bold text-slate-950">{value}</div>
  </div>;
}

function TimelineCard({ title, items }: { title: string; items: Array<{ title: string; description: string; time: string; tone: "slate" | "green" | "amber" | "blue" }> }) {
  return <Card className="border-slate-200 bg-white shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Clock className="h-5 w-5 text-slate-700" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-0">
      {items.map((item, index) => <TimelineItem key={`${item.title}-${index}`} item={item} last={index === items.length - 1} />)}
    </CardContent>
  </Card>;
}

function TimelineItem({ item, last }: { item: { title: string; description: string; time: string; tone: "slate" | "green" | "amber" | "blue" }; last: boolean }) {
  const dotClass = item.tone === "green"
    ? "bg-green-600"
    : item.tone === "amber"
      ? "bg-amber-500"
      : item.tone === "blue"
        ? "bg-blue-600"
        : "bg-slate-700";

  return <div className="grid grid-cols-[20px_1fr] gap-3">
    <div className="flex flex-col items-center">
      <span className={`mt-1 h-3 w-3 rounded-full ${dotClass}`} />
      {!last && <span className="mt-1 h-full w-px bg-slate-200" />}
    </div>
    <div className={`pb-4 ${last ? "pb-0" : ""}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-slate-950">{item.title}</div>
        <div className="text-xs text-slate-500">{new Date(item.time).toLocaleString("vi-VN")}</div>
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
    </div>
  </div>;
}

function SubmissionCard({
  submission,
  busy,
  onApprove,
  onReject,
}: {
  submission: Submission;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="font-bold text-slate-950">Submission #{submission.id}</div>
        <p className="mt-1 text-sm text-slate-500">Collaborator #{submission.collaboratorId} - {new Date(submission.createdAt).toLocaleString("vi-VN")}</p>
      </div>
      <Badge variant="outline" className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${submissionStatusClass(submission.status)}`}>
        {submissionLabels[submission.status] || submission.status}
      </Badge>
    </div>

    <div className="space-y-3 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <InfoBox label="Email đối chiếu" value={submission.contactEmail || "-"} />
        <InfoBox label="Số điện thoại" value={submission.contactPhone || "-"} />
        <InfoBox label="Mã xác nhận" value={submission.confirmationCode || "-"} mono />
        <InfoBox label="Cập nhật" value={new Date(submission.updatedAt).toLocaleString("vi-VN")} />
      </div>

      {submission.note && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Ghi chú / câu trả lời</div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.note}</p>
      </div>}

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {submission.proofImageUrl && <a className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100" href={submission.proofImageUrl} target="_blank" rel="noreferrer">Mở bằng chứng</a>}
          {submission.rejectReason && <span className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Lý do: {submission.rejectReason}</span>}
        </div>
        {submission.status === "PENDING" && <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" disabled={busy} onClick={onApprove}>Duyệt & trả thưởng</Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={onReject}>Từ chối</Button>
        </div>}
      </div>
    </div>
  </div>;
}

function InfoBox({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`mt-1 break-all text-sm font-semibold text-slate-950 ${mono ? "font-mono" : ""}`}>{value}</div>
  </div>;
}
