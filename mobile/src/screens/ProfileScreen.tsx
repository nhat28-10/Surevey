import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { authApi } from "../api/authApi";
import type { UserProfile } from "../api/types";
import { AppButton, Card, ErrorBanner, Field, LoadingState, Screen, Subtitle, Title } from "../components/ui";
import { message } from "../theme";

function toDateInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() <= 1901) return "";
  return parsed.toISOString().slice(0, 10);
}

export function ProfileScreen() {
  const [form, setForm] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const profile = await authApi.profile();
      setForm({ ...profile, dateOfBirth: toDateInput(profile.dateOfBirth) });
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const set = (name: keyof UserProfile, value: string) => setForm(prev => prev ? { ...prev, [name]: value } : prev);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      await authApi.updateProfile({
        ...form,
        userName: form.userName.trim(),
        email: form.email.trim(),
        fullName: form.fullName?.trim() || null,
        identityCard: form.identityCard?.trim() || null,
        sex: form.sex?.trim() || null,
        phoneNumber: form.phoneNumber?.trim() || null,
        dateOfBirth: form.dateOfBirth ? `${form.dateOfBirth}T00:00:00.000Z` : null,
        address: form.address?.trim() || null
      });
      Alert.alert("SureVey", "Đã cập nhật hồ sơ");
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải hồ sơ" />;

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Screen>
      <View>
        <Title>Hồ sơ cá nhân</Title>
        <Subtitle>Cập nhật thông tin tài khoản từ UserService.</Subtitle>
      </View>
      <ErrorBanner messageText={error} />
      {form && <Card>
        <Field label="Tên đăng nhập" value={form.userName || ""} editable={false} />
        <Field label="Email" value={form.email || ""} editable={false} />
        <Field label="Vai trò" value={String(form.roleName || "")} editable={false} />
        <Field label="Họ và tên" value={form.fullName || ""} onChangeText={value => set("fullName", value)} />
        <Field label="CCCD/CMND" value={form.identityCard || ""} onChangeText={value => set("identityCard", value)} keyboardType="numeric" />
        <Field label="Giới tính" value={form.sex || ""} onChangeText={value => set("sex", value)} />
        <Field label="Số điện thoại" value={form.phoneNumber || ""} onChangeText={value => set("phoneNumber", value)} keyboardType="phone-pad" />
        <Field label="Ngày sinh (YYYY-MM-DD)" value={form.dateOfBirth || ""} onChangeText={value => set("dateOfBirth", value)} />
        <Field label="Địa chỉ" value={form.address || ""} onChangeText={value => set("address", value)} />
        <AppButton onPress={save} loading={saving} icon="save-outline">Lưu hồ sơ</AppButton>
      </Card>}
    </Screen>
  </ScrollView>;
}
