import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { campaignApi } from "../api/campaignApi";
import { submissionApi } from "../api/submissionApi";
import type { Campaign, CampaignPayment, Submission } from "../api/types";
import { AppButton, Badge, Card, EmptyState, ErrorBanner, Field, LoadingState, Metric, Row, Screen, Subtitle, Title } from "../components/ui";
import { colors, date, dateTime, message, money } from "../theme";

type CustomerRoute =
  | { name: "customer.dashboard" }
  | { name: "customer.create" }
  | { name: "customer.detail"; campaignId: number };

const statusLabels: Record<string, string> = {
  DRAFT: "Chờ thanh toán",
  PENDING_REVIEW: "Chờ xử lý",
  ACTIVE: "Đang hiển thị",
  REJECTED: "Bị từ chối",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn"
};

const paymentLabels: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAYMENT_PENDING: "Chờ thanh toán",
  PAYMENT_VERIFYING: "Chờ xác minh",
  PAID: "Đã thanh toán",
  PAYMENT_REJECTED: "Thanh toán bị từ chối"
};

function statusTone(status: string): "green" | "amber" | "red" | "slate" {
  if (status === "ACTIVE" || status === "COMPLETED" || status === "APPROVED" || status === "PAID") return "green";
  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") return "red";
  return "amber";
}

function ProgressBar({ value }: { value: number }) {
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, value))}%` }]} /></View>;
}

export function CustomerDashboardScreen({ navigate }: { navigate: (route: CustomerRoute) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<CampaignPayment | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setCampaigns(await campaignApi.myCampaigns());
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(campaign => campaign.status === "ACTIVE").length,
    waitingPayment: campaigns.filter(campaign => campaign.paymentStatus !== "PAID").length,
    approved: campaigns.reduce((sum, campaign) => sum + campaign.approvedResponses, 0)
  }), [campaigns]);

  const openPayment = async (campaign: Campaign) => {
    setBusyId(campaign.id);
    try {
      const result = await campaignApi.createPayment(campaign.id, {
        targetResponses: campaign.targetResponses,
        answerCount: campaign.answerCount,
        unitPricePerAnswer: campaign.unitPricePerAnswer
      });
      setPayment(result);
      await load();
    } catch (err) {
      Alert.alert("SureVey", message(err));
    } finally {
      setBusyId(null);
    }
  };

  const checkPayment = async () => {
    if (!payment) return;
    setCheckingPayment(true);
    try {
      const latest = await campaignApi.payment(payment.id);
      if (latest.status === "PAID") {
        Alert.alert("SureVey", "Thanh toán đã được xác nhận.");
        setPayment(null);
        await load();
      } else {
        setPayment(latest);
        Alert.alert("SureVey", `Trạng thái hiện tại: ${latest.status}`);
      }
    } catch (err) {
      Alert.alert("SureVey", message(err));
    } finally {
      setCheckingPayment(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải campaign" />;

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Screen>
      <View>
        <Title>Campaign của tôi</Title>
        <Subtitle>Tạo campaign, thanh toán QR và theo dõi response đã duyệt.</Subtitle>
      </View>
      <AppButton onPress={() => navigate({ name: "customer.create" })} icon="add-circle-outline">Tạo campaign</AppButton>
      <ErrorBanner messageText={error} />

      <Row wrap>
        <Metric label="Tổng campaign" value={stats.total} />
        <Metric label="Đang hiển thị" value={stats.active} tone="green" />
        <Metric label="Chờ thanh toán" value={stats.waitingPayment} tone="amber" />
        <Metric label="Response duyệt" value={stats.approved} tone="blue" />
      </Row>

      {payment && <PaymentCard payment={payment} checking={checkingPayment} onCheck={() => void checkPayment()} onClose={() => setPayment(null)} />}

      {campaigns.length === 0 ? <EmptyState title="Chưa có campaign" description="Tạo campaign đầu tiên để bắt đầu thu thập response." icon="clipboard-outline" /> :
        campaigns.map(campaign => {
          const progress = campaign.targetResponses ? Math.round(campaign.approvedResponses / campaign.targetResponses * 100) : 0;
          const needsPayment = campaign.paymentStatus !== "PAID";
          return <Card key={campaign.id}>
            <Row spread wrap>
              <Badge tone={statusTone(campaign.status)}>{statusLabels[campaign.status] || campaign.status}</Badge>
              <Badge tone={statusTone(campaign.paymentStatus)}>{paymentLabels[campaign.paymentStatus] || campaign.paymentStatus}</Badge>
            </Row>
            <View>
              <Text style={styles.cardTitle}>{campaign.title}</Text>
              <Text style={styles.meta}>{campaign.category} - hạn {date(campaign.deadline)}</Text>
            </View>
            <Text style={styles.description} numberOfLines={3}>{campaign.description}</Text>
            <View>
              <Row spread>
                <Text style={styles.meta}>Tiến độ response</Text>
                <Text style={styles.strong}>{progress}%</Text>
              </Row>
              <ProgressBar value={progress} />
            </View>
            <Row wrap>
              <Metric label="Đã duyệt" value={campaign.approvedResponses} />
              <Metric label="Mục tiêu" value={campaign.targetResponses} />
              <Metric label="Thưởng" value={money(campaign.rewardPerResponse)} />
            </Row>
            <AppButton variant="dark" onPress={() => navigate({ name: "customer.detail", campaignId: campaign.id })} icon="open-outline">Chi tiết</AppButton>
            {needsPayment && <AppButton loading={busyId === campaign.id} onPress={() => void openPayment(campaign)} icon="qr-code-outline">Mở QR thanh toán</AppButton>}
          </Card>;
        })}
    </Screen>
  </ScrollView>;
}

function PaymentCard({ payment, checking, onCheck, onClose }: { payment: CampaignPayment; checking: boolean; onCheck: () => void; onClose: () => void }) {
  return <Card tone="green">
    <Row spread>
      <Text style={styles.cardTitle}>Thanh toán campaign</Text>
      <Pressable onPress={onClose}><Text style={styles.linkText}>Đóng</Text></Pressable>
    </Row>
    {payment.qrImageUrl ? <Image source={{ uri: payment.qrImageUrl }} style={styles.qr} resizeMode="contain" /> : <Text style={styles.description}>Backend chưa cấu hình ảnh QR. Bạn vẫn có thể chuyển khoản bằng thông tin bên dưới.</Text>}
    <InfoLine label="Mã thanh toán" value={payment.paymentCode} />
    <InfoLine label="Số tiền" value={money(payment.totalAmount)} />
    <InfoLine label="Ngân hàng" value={payment.bankName} />
    <InfoLine label="Chủ tài khoản" value={payment.bankAccountName} />
    <InfoLine label="Số tài khoản" value={payment.bankAccountNumber} />
    <InfoLine label="Nội dung" value={payment.transferContent} />
    <InfoLine label="Trạng thái" value={payment.status} />
    <AppButton loading={checking} onPress={onCheck} icon="refresh-outline">Kiểm tra trạng thái</AppButton>
    {payment.qrImageUrl && <AppButton variant="outline" onPress={() => void Linking.openURL(payment.qrImageUrl!)} icon="open-outline">Mở ảnh QR</AppButton>}
  </Card>;
}

export function CustomerCreateCampaignScreen({ navigate }: { navigate: (route: CustomerRoute) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    instruction: "",
    googleFormUrl: "",
    category: "Khác",
    campaignType: "GOOGLE_FORM" as "GOOGLE_FORM" | "INTERNAL_FORM",
    rewardPerResponse: "1000",
    targetResponses: "10",
    deadline: ""
  });

  const set = (name: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [name]: value }));
  const isGoogleForm = form.campaignType === "GOOGLE_FORM";
  const reward = Number(form.rewardPerResponse || 0);
  const target = Number(form.targetResponses || 0);
  const total = reward * target + Math.round(reward * target * 0.2);

  const submit = async () => {
    setError("");
    if (!form.title.trim() || !form.description.trim()) {
      setError("Vui lòng nhập tiêu đề và mô tả.");
      return;
    }
    if (isGoogleForm && !form.googleFormUrl.startsWith("http")) {
      setError("Liên kết Google Form phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    if (!isGoogleForm && !form.instruction.trim()) {
      setError("Form nội bộ cần ít nhất một câu hỏi.");
      return;
    }
    if (!form.deadline || new Date(form.deadline) <= new Date()) {
      setError("Hạn chót phải là ISO datetime trong tương lai, ví dụ 2026-08-30T23:59.");
      return;
    }
    if (reward <= 0 || target <= 0) {
      setError("Mức thưởng và số phản hồi phải lớn hơn 0.");
      return;
    }

    setSubmitting(true);
    try {
      await campaignApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        instruction: isGoogleForm ? form.instruction.trim() || "Hoàn thành Google Form, sau đó quay lại SureVey và nhập email đã dùng trong form." : form.instruction.trim(),
        campaignType: form.campaignType,
        googleFormUrl: isGoogleForm ? form.googleFormUrl.trim() : undefined,
        rewardPerResponse: reward,
        targetResponses: target,
        answerCount: 1,
        unitPricePerAnswer: reward,
        deadline: new Date(form.deadline).toISOString(),
        category: form.category.trim() || "Khác",
        submitForReview: false
      });
      Alert.alert("SureVey", "Đã tạo campaign. Hãy thanh toán để campaign hiển thị.");
      navigate({ name: "customer.dashboard" });
    } catch (err) {
      setError(message(err));
    } finally {
      setSubmitting(false);
    }
  };

  return <ScrollView>
    <Screen>
      <AppButton variant="outline" onPress={() => navigate({ name: "customer.dashboard" })} icon="arrow-back-outline">Quay lại</AppButton>
      <View>
        <Title>Tạo campaign</Title>
        <Subtitle>Nhập nội dung khảo sát, ngân sách và thời hạn.</Subtitle>
      </View>
      <ErrorBanner messageText={error} />
      <Card>
        <Row>
          <AppButton variant={isGoogleForm ? "dark" : "outline"} onPress={() => set("campaignType", "GOOGLE_FORM")} icon="link-outline">Google Form</AppButton>
          <AppButton variant={!isGoogleForm ? "dark" : "outline"} onPress={() => set("campaignType", "INTERNAL_FORM")} icon="document-text-outline">Form nội bộ</AppButton>
        </Row>
        <Field label="Tiêu đề" value={form.title} onChangeText={value => set("title", value)} />
        <Field label="Mô tả" value={form.description} onChangeText={value => set("description", value)} multiline />
        <Field label={isGoogleForm ? "Hướng dẫn" : "Câu hỏi, mỗi dòng một câu"} value={form.instruction} onChangeText={value => set("instruction", value)} multiline />
        {isGoogleForm && <Field label="Google Form URL" value={form.googleFormUrl} onChangeText={value => set("googleFormUrl", value)} keyboardType="url" />}
        <Field label="Thưởng mỗi phản hồi" value={form.rewardPerResponse} onChangeText={value => set("rewardPerResponse", value)} keyboardType="numeric" />
        <Field label="Mục tiêu phản hồi" value={form.targetResponses} onChangeText={value => set("targetResponses", value)} keyboardType="numeric" />
        <Field label="Hạn chót (YYYY-MM-DDTHH:mm)" value={form.deadline} onChangeText={value => set("deadline", value)} placeholder="2026-08-30T23:59" />
        <Field label="Danh mục" value={form.category} onChangeText={value => set("category", value)} />
      </Card>
      <Card tone="dark">
        <Title light>{money(total)}</Title>
        <Subtitle light>Tổng thanh toán dự kiến gồm ngân sách thưởng và 20% phí nền tảng.</Subtitle>
        <AppButton loading={submitting} onPress={submit} icon="checkmark-circle-outline">Tạo campaign</AppButton>
      </Card>
    </Screen>
  </ScrollView>;
}

export function CustomerCampaignDetailScreen({ campaignId, navigate }: { campaignId: number; navigate: (route: CustomerRoute) => void }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [campaignData, submissionsData] = await Promise.all([
        campaignApi.get(campaignId),
        campaignApi.submissions(campaignId)
      ]);
      setCampaign(campaignData);
      setSubmissions(submissionsData);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [campaignId]);

  useEffect(() => { void load(); }, [load]);

  const approve = async (submission: Submission) => {
    setBusyId(submission.id);
    try {
      const result = await submissionApi.approve(submission.id);
      Alert.alert("SureVey", result.message || "Đã duyệt submission");
      await load();
    } catch (err) {
      Alert.alert("SureVey", message(err));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!rejecting || !rejectReason.trim()) return;
    setBusyId(rejecting.id);
    try {
      const result = await submissionApi.reject(rejecting.id, rejectReason.trim());
      Alert.alert("SureVey", result.message || "Đã từ chối submission");
      setRejecting(null);
      setRejectReason("");
      await load();
    } catch (err) {
      Alert.alert("SureVey", message(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingState label="Đang tải chi tiết" />;
  if (!campaign) return <Screen><ErrorBanner messageText={error || "Không tìm thấy campaign"} /></Screen>;

  const progress = campaign.targetResponses ? Math.round(campaign.approvedResponses / campaign.targetResponses * 100) : 0;
  const pending = submissions.filter(submission => submission.status === "PENDING").length;
  const approved = submissions.filter(submission => submission.status === "APPROVED").length;
  const rejected = submissions.filter(submission => submission.status === "REJECTED").length;

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Screen>
      <AppButton variant="outline" onPress={() => navigate({ name: "customer.dashboard" })} icon="arrow-back-outline">Quay lại</AppButton>
      <ErrorBanner messageText={error} />
      <Card tone="dark">
        <Row wrap>
          <Badge tone={statusTone(campaign.status)}>{statusLabels[campaign.status] || campaign.status}</Badge>
          <Badge tone={statusTone(campaign.paymentStatus)}>{paymentLabels[campaign.paymentStatus] || campaign.paymentStatus}</Badge>
        </Row>
        <Title light>{campaign.title}</Title>
        <Subtitle light>{campaign.description || "Campaign chưa có mô tả."}</Subtitle>
        <ProgressBar value={progress} />
        <Subtitle light>{campaign.approvedResponses}/{campaign.targetResponses} response đã duyệt</Subtitle>
      </Card>

      <Row wrap>
        <Metric label="Submission" value={submissions.length} />
        <Metric label="Chờ duyệt" value={pending} tone="amber" />
        <Metric label="Đã duyệt" value={approved} tone="green" />
        <Metric label="Bị từ chối" value={rejected} />
      </Row>

      <Card>
        <Text style={styles.cardTitle}>Hướng dẫn cho collaborator</Text>
        <Text style={styles.description}>{campaign.instruction || "Chưa có hướng dẫn."}</Text>
        {campaign.googleFormUrl && <AppButton variant="outline" onPress={() => void Linking.openURL(campaign.googleFormUrl!)} icon="open-outline">Mở form</AppButton>}
      </Card>

      <Text style={styles.sectionTitle}>Submission cần kiểm tra</Text>
      {submissions.length === 0 ? <EmptyState title="Chưa có submission" description="Khi collaborator nộp kết quả, bạn sẽ duyệt hoặc từ chối tại đây." /> :
        submissions.map(submission => <Card key={submission.id}>
          <Row spread wrap>
            <Text style={styles.cardTitle}>Submission #{submission.id}</Text>
            <Badge tone={statusTone(submission.status)}>{submission.status}</Badge>
          </Row>
          <InfoLine label="Collaborator" value={`#${submission.collaboratorId}`} />
          <InfoLine label="Email đối chiếu" value={submission.contactEmail || "-"} />
          <InfoLine label="Số điện thoại" value={submission.contactPhone || "-"} />
          <InfoLine label="Cập nhật" value={dateTime(submission.updatedAt)} />
          {submission.note && <Text style={styles.description}>{submission.note}</Text>}
          {submission.proofImageUrl && <AppButton variant="outline" onPress={() => void Linking.openURL(submission.proofImageUrl!)} icon="image-outline">Mở bằng chứng</AppButton>}
          {submission.rejectReason && <Text style={styles.rejectText}>Lý do: {submission.rejectReason}</Text>}
          {submission.status === "PENDING" && <Row wrap>
            <AppButton loading={busyId === submission.id} onPress={() => void approve(submission)} icon="checkmark-outline">Duyệt</AppButton>
            <AppButton variant="danger" disabled={busyId === submission.id} onPress={() => setRejecting(submission)} icon="close-outline">Từ chối</AppButton>
          </Row>}
        </Card>)}

      <Modal transparent visible={!!rejecting} animationType="fade" onRequestClose={() => setRejecting(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Title>Từ chối submission</Title>
            <Subtitle>Nhập lý do để collaborator biết cần kiểm tra lại điểm nào.</Subtitle>
            <Field label="Lý do" value={rejectReason} onChangeText={setRejectReason} multiline />
            <Row>
              <AppButton variant="outline" onPress={() => setRejecting(null)}>Hủy</AppButton>
              <AppButton variant="danger" loading={busyId === rejecting?.id} onPress={() => void reject()}>Từ chối</AppButton>
            </Row>
          </View>
        </View>
      </Modal>
    </Screen>
  </ScrollView>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoLine}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: 13
  },
  strong: {
    color: colors.text,
    fontWeight: "800"
  },
  description: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21
  },
  linkText: {
    color: colors.primaryDark,
    fontWeight: "800"
  },
  progressTrack: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    height: 10,
    marginTop: 8,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%"
  },
  qr: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: 230,
    width: 230
  },
  infoLine: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900"
  },
  rejectText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700"
  },
  modalBackdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    gap: 12,
    padding: 16
  }
});
