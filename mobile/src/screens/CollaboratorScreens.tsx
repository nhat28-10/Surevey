import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { campaignApi } from "../api/campaignApi";
import { participationApi } from "../api/participationApi";
import { walletApi } from "../api/walletApi";
import type { AvailableCampaign, Participation, Wallet, WalletTransaction, Withdrawal } from "../api/types";
import { AppButton, Badge, Card, EmptyState, ErrorBanner, Field, LoadingState, Metric, Row, Screen, Subtitle, Title } from "../components/ui";
import { colors, date, dateTime, message, money } from "../theme";

type CollaboratorRoute =
  | { name: "collaborator.marketplace" }
  | { name: "collaborator.activities" }
  | { name: "collaborator.participation"; participationId: number };

function workStatusText(status: string) {
  if (status === "ACCEPTED") return "Đã nhận";
  if (status === "IN_PROGRESS") return "Đang làm";
  if (status === "SUBMITTED") return "Chờ duyệt";
  if (status === "APPROVED") return "Đã duyệt";
  if (status === "REJECTED") return "Bị từ chối";
  return status;
}

function statusTone(status: string): "green" | "amber" | "red" | "slate" {
  if (status === "APPROVED" || status === "PAID") return "green";
  if (status === "REJECTED" || status === "CANCELLED") return "red";
  if (status === "SUBMITTED" || status === "PENDING" || status === "ACCEPTED" || status === "IN_PROGRESS") return "amber";
  return "slate";
}

function questionsFromInstruction(instruction: string) {
  return instruction.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

export function CollaboratorMarketplaceScreen({ navigate }: { navigate: (route: CollaboratorRoute) => void }) {
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setCampaigns(await campaignApi.available());
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return campaigns
      .filter(campaign => `${campaign.title} ${campaign.description} ${campaign.category}`.toLowerCase().includes(normalized))
      .sort((left, right) => new Date(left.deadline).getTime() - new Date(right.deadline).getTime());
  }, [campaigns, query]);

  const accept = async (campaign: AvailableCampaign) => {
    setBusyId(campaign.id);
    try {
      const participation = await campaignApi.accept(campaign.id);
      Alert.alert("SureVey", "Đã nhận campaign. Hãy hoàn thành khảo sát rồi nộp kết quả.");
      navigate({ name: "collaborator.participation", participationId: participation.id });
    } catch (err) {
      Alert.alert("SureVey", message(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingState label="Đang tải marketplace" />;

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Screen>
      <View>
        <Title>Marketplace khảo sát</Title>
        <Subtitle>Campaign đã thanh toán, còn hạn và còn lượt nhận.</Subtitle>
      </View>
      <ErrorBanner messageText={error} />
      <Row wrap>
        <Metric label="Campaign" value={campaigns.length} />
        <Metric label="Slot còn lại" value={campaigns.reduce((sum, item) => sum + item.remainingSlots, 0)} tone="blue" />
        <Metric label="Thưởng cao nhất" value={money(campaigns.reduce((max, item) => Math.max(max, item.rewardPerResponse), 0))} tone="green" />
      </Row>
      <Field label="Tìm campaign" value={query} onChangeText={setQuery} placeholder="Tiêu đề, mô tả hoặc danh mục" />

      {filtered.length === 0 ? <EmptyState title="Chưa có campaign phù hợp" description="Bạn có thể đổi từ khóa hoặc tải lại marketplace." icon="search-outline" /> :
        filtered.map(campaign => <Card key={campaign.id}>
          <Row spread wrap>
            <Text style={styles.cardTitle}>{campaign.title}</Text>
            <Badge tone="green">{campaign.category}</Badge>
          </Row>
          <Text style={styles.description} numberOfLines={4}>{campaign.description}</Text>
          <Row wrap>
            <Metric label="Thưởng" value={money(campaign.rewardPerResponse)} tone="green" />
            <Metric label="Còn slot" value={campaign.remainingSlots} tone="amber" />
            <Metric label="Hạn" value={date(campaign.deadline)} />
          </Row>
          <Text style={styles.instruction} numberOfLines={4}>{campaign.instruction}</Text>
          <AppButton loading={busyId === campaign.id} onPress={() => void accept(campaign)} icon="hand-left-outline">Nhận campaign</AppButton>
        </Card>)}
    </Screen>
  </ScrollView>;
}

export function CollaboratorActivitiesScreen({ navigate }: { navigate: (route: CollaboratorRoute) => void }) {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tab, setTab] = useState<"work" | "transactions" | "withdraw">("work");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ amount: "", bankName: "", bankAccountName: "", bankAccountNumber: "" });

  const load = useCallback(async () => {
    setError("");
    try {
      const [p, w, t, wd] = await Promise.all([
        participationApi.mine(),
        walletApi.get(),
        walletApi.transactions(),
        walletApi.withdrawals()
      ]);
      setParticipations(p);
      setWallet(w);
      setTransactions(t);
      setWithdrawals(wd);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalEarned = transactions.filter(item => item.type === "REWARD_PAID" || item.type === "REWARD").reduce((sum, item) => sum + Math.max(0, item.amount), 0);

  const withdraw = async () => {
    const amount = Number(form.amount);
    if (!wallet || amount <= 0 || amount > wallet.availableBalance) {
      Alert.alert("SureVey", "Số tiền rút không hợp lệ hoặc vượt số dư");
      return;
    }
    setSubmitting(true);
    try {
      await walletApi.createWithdrawal({
        amount,
        bankName: form.bankName.trim(),
        bankAccountName: form.bankAccountName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim()
      });
      Alert.alert("SureVey", "Đã gửi yêu cầu rút tiền");
      setForm({ amount: "", bankName: "", bankAccountName: "", bankAccountNumber: "" });
      await load();
    } catch (err) {
      Alert.alert("SureVey", message(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải công việc và ví" />;

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Screen>
      <View>
        <Title>Công việc và ví</Title>
        <Subtitle>Theo dõi submission, số dư và yêu cầu rút tiền.</Subtitle>
      </View>
      <ErrorBanner messageText={error} />
      <Row wrap>
        <Metric label="Số dư khả dụng" value={money(wallet?.availableBalance || 0)} tone="dark" />
        <Metric label="Đang xử lý" value={money(wallet?.pendingBalance || 0)} tone="amber" />
        <Metric label="Tổng đã kiếm" value={money(totalEarned)} tone="green" />
      </Row>
      <Row>
        <AppButton variant={tab === "work" ? "dark" : "outline"} onPress={() => setTab("work")}>Việc</AppButton>
        <AppButton variant={tab === "transactions" ? "dark" : "outline"} onPress={() => setTab("transactions")}>Giao dịch</AppButton>
        <AppButton variant={tab === "withdraw" ? "dark" : "outline"} onPress={() => setTab("withdraw")}>Rút tiền</AppButton>
      </Row>

      {tab === "work" && <>
        {participations.length === 0 ? <EmptyState title="Bạn chưa nhận campaign nào" description="Vào marketplace để chọn campaign phù hợp và nhận thưởng." /> :
          participations.map(item => <Card key={item.id}>
            <Row spread wrap>
              <Text style={styles.cardTitle}>{item.campaign?.title || `Campaign #${item.campaignId}`}</Text>
              <Badge tone={statusTone(item.status)}>{workStatusText(item.status)}</Badge>
            </Row>
            <InfoLine label="Nhận lúc" value={dateTime(item.acceptedAt)} />
            <InfoLine label="Cập nhật" value={dateTime(item.updatedAt)} />
            {["ACCEPTED", "IN_PROGRESS"].includes(item.status) && <AppButton variant="dark" onPress={() => navigate({ name: "collaborator.participation", participationId: item.id })} icon="open-outline">Mở campaign</AppButton>}
          </Card>)}
      </>}

      {tab === "transactions" && <>
        {transactions.length === 0 ? <EmptyState title="Chưa có giao dịch" description="Khi submission được duyệt hoặc bạn rút tiền, lịch sử ví sẽ xuất hiện ở đây." icon="receipt-outline" /> :
          transactions.map(item => <Card key={item.id}>
            <Row spread>
              <Text style={styles.cardTitle}>{item.type}</Text>
              <Text style={[styles.amount, item.amount >= 0 ? styles.amountPositive : styles.amountNegative]}>{money(item.amount)}</Text>
            </Row>
            <Text style={styles.description}>{item.description || "-"}</Text>
            <InfoLine label="Số dư sau" value={money(item.balanceAfter)} />
            <InfoLine label="Thời gian" value={dateTime(item.createdAt)} />
          </Card>)}
      </>}

      {tab === "withdraw" && <>
        <Card>
          <Text style={styles.cardTitle}>Tạo yêu cầu rút tiền</Text>
          <Field label="Số tiền" value={form.amount} onChangeText={amount => setForm(prev => ({ ...prev, amount }))} keyboardType="numeric" />
          <Field label="Ngân hàng" value={form.bankName} onChangeText={bankName => setForm(prev => ({ ...prev, bankName }))} />
          <Field label="Tên chủ tài khoản" value={form.bankAccountName} onChangeText={bankAccountName => setForm(prev => ({ ...prev, bankAccountName }))} />
          <Field label="Số tài khoản" value={form.bankAccountNumber} onChangeText={bankAccountNumber => setForm(prev => ({ ...prev, bankAccountNumber }))} keyboardType="numeric" />
          <AppButton loading={submitting} onPress={() => void withdraw()} icon="send-outline">Gửi yêu cầu</AppButton>
        </Card>
        {withdrawals.length === 0 ? <EmptyState title="Chưa có yêu cầu rút tiền" description="Sau khi có số dư khả dụng, bạn có thể tạo yêu cầu rút tiền tại đây." icon="wallet-outline" /> :
          withdrawals.map(item => <Card key={item.id}>
            <Row spread wrap>
              <Text style={styles.cardTitle}>{money(item.amount)}</Text>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            </Row>
            <InfoLine label="Ngân hàng" value={item.bankName} />
            <InfoLine label="Số tài khoản" value={item.bankAccountNumber} />
            <InfoLine label="Ngày yêu cầu" value={dateTime(item.requestedAt)} />
            {item.rejectReason && <Text style={styles.rejectText}>{item.rejectReason}</Text>}
          </Card>)}
      </>}
    </Screen>
  </ScrollView>;
}

export function CollaboratorParticipationScreen({ participationId, navigate }: { participationId: number; navigate: (route: CollaboratorRoute) => void }) {
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
        setParticipation(found);
        if (!found?.campaign) setError("Không tìm thấy participation hoặc campaign.");
        else if (found.campaign.campaignType === "INTERNAL_FORM") {
          setAnswers(questionsFromInstruction(found.campaign.instruction).map(() => ""));
        }
      } catch (err) {
        setError(message(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [participationId]);

  const campaign = participation?.campaign || null;
  const isInternal = campaign?.campaignType === "INTERNAL_FORM";
  const questions = questionsFromInstruction(campaign?.instruction || "");
  const alreadySubmitted = participation ? ["SUBMITTED", "APPROVED"].includes(participation.status) : false;

  const submit = async () => {
    if (!participation || !campaign) return;
    setError("");
    if (campaign.campaignType === "GOOGLE_FORM" && !form.contactEmail.trim()) {
      setError("Vui lòng nhập email đã dùng trong Google Form để Customer đối chiếu.");
      return;
    }

    let note = form.note.trim();
    if (campaign.campaignType === "INTERNAL_FORM") {
      if (answers.length === 0 || answers.some(answer => !answer.trim())) {
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
        note: note || undefined
      });
      Alert.alert("SureVey", "Đã nộp kết quả. Customer sẽ kiểm tra và duyệt thưởng.");
      navigate({ name: "collaborator.activities" });
    } catch (err) {
      setError(message(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải campaign" />;
  if (!participation || !campaign) return <Screen><AppButton variant="outline" onPress={() => navigate({ name: "collaborator.activities" })}>Quay lại</AppButton><ErrorBanner messageText={error || "Không tìm thấy dữ liệu"} /></Screen>;

  return <ScrollView>
    <Screen>
      <AppButton variant="outline" onPress={() => navigate({ name: "collaborator.activities" })} icon="arrow-back-outline">Quay lại</AppButton>
      <ErrorBanner messageText={error} />
      <Card tone="dark">
        <Row wrap>
          <Badge tone={statusTone(participation.status)}>{workStatusText(participation.status)}</Badge>
          <Badge tone="blue">{isInternal ? "Form nội bộ" : "Google Form"}</Badge>
        </Row>
        <Title light>{campaign.title}</Title>
        <Subtitle light>{campaign.description}</Subtitle>
        <Row wrap>
          <Metric label="Thưởng" value={money(campaign.rewardPerResponse)} tone="green" />
          <Metric label="Hạn chót" value={date(campaign.deadline)} />
        </Row>
        {!isInternal && campaign.googleFormUrl && <AppButton variant="outline" onPress={() => void Linking.openURL(campaign.googleFormUrl!)} icon="open-outline">Mở Google Form</AppButton>}
      </Card>

      {alreadySubmitted ? <Card tone="amber"><Subtitle>Participation đã ở trạng thái {workStatusText(participation.status)}; backend không cho tạo thêm submission pending/approved.</Subtitle></Card> :
        <Card>
          <Text style={styles.cardTitle}>{isInternal ? "Trả lời form nội bộ" : "Nộp kết quả Google Form"}</Text>
          {isInternal ? <>
            {questions.length === 0 && <ErrorBanner messageText="Campaign này chưa có câu hỏi nội bộ." />}
            {questions.map((question, index) => <View key={`${question}-${index}`} style={styles.questionBox}>
              <Text style={styles.questionText}>{index + 1}. {question}</Text>
              <Field label="Câu trả lời" value={answers[index] || ""} onChangeText={value => setAnswers(prev => prev.map((item, answerIndex) => answerIndex === index ? value : item))} multiline />
            </View>)}
            <Field label="Email liên hệ" value={form.contactEmail} onChangeText={contactEmail => setForm(prev => ({ ...prev, contactEmail }))} keyboardType="email-address" />
          </> : <>
            <Field label="Email đã dùng trong Google Form" value={form.contactEmail} onChangeText={contactEmail => setForm(prev => ({ ...prev, contactEmail }))} keyboardType="email-address" />
            <Field label="Mã xác nhận nếu có" value={form.confirmationCode} onChangeText={confirmationCode => setForm(prev => ({ ...prev, confirmationCode }))} />
            <Field label="URL bằng chứng nếu có" value={form.proofImageUrl} onChangeText={proofImageUrl => setForm(prev => ({ ...prev, proofImageUrl }))} keyboardType="url" />
            <Field label="Ghi chú" value={form.note} onChangeText={note => setForm(prev => ({ ...prev, note }))} multiline />
          </>}
          <Field label="Số điện thoại" value={form.contactPhone} onChangeText={contactPhone => setForm(prev => ({ ...prev, contactPhone }))} keyboardType="phone-pad" />
          <AppButton loading={submitting} disabled={isInternal && questions.length === 0} onPress={() => void submit()} icon="checkmark-circle-outline">Nộp kết quả</AppButton>
        </Card>}
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
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "800"
  },
  description: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21
  },
  instruction: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    padding: 12
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
  amount: {
    fontSize: 16,
    fontWeight: "900"
  },
  amountPositive: {
    color: "#166534"
  },
  amountNegative: {
    color: colors.danger
  },
  rejectText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700"
  },
  questionBox: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  questionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  }
});
