import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, Card, ErrorBanner, Field, Row, Subtitle, Title } from "../components/ui";
import { login, signup, type User } from "../services/authService";
import { colors } from "../theme";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"Customer" | "Collaborator">("Customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    userName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const set = (name: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [name]: value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const user = mode === "login"
        ? await login(form.email, form.password)
        : await signup({
          userName: form.userName,
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          role
        });
      onAuthenticated(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể đăng nhập";
      setError(message);
      Alert.alert("SureVey", message);
    } finally {
      setLoading(false);
    }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}>
        <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
        <Title>SureVey Mobile</Title>
        <Subtitle>Ứng dụng dành cho Customer và Collaborator.</Subtitle>
      </View>

      <Card>
        <Row>
          <AppButton variant={mode === "login" ? "dark" : "outline"} onPress={() => setMode("login")}>Đăng nhập</AppButton>
          <AppButton variant={mode === "signup" ? "dark" : "outline"} onPress={() => setMode("signup")}>Đăng ký</AppButton>
        </Row>

        <ErrorBanner messageText={error} />

        {mode === "signup" && <>
          <Row>
            <AppButton variant={role === "Customer" ? "primary" : "outline"} onPress={() => setRole("Customer")} icon="briefcase-outline">Customer</AppButton>
            <AppButton variant={role === "Collaborator" ? "primary" : "outline"} onPress={() => setRole("Collaborator")} icon="people-outline">Collaborator</AppButton>
          </Row>
          <Field label="Tên đăng nhập" value={form.userName} onChangeText={value => set("userName", value)} placeholder="surevey_user" />
          <Field label="Họ và tên" value={form.name} onChangeText={value => set("name", value)} placeholder="Nguyễn Văn A" />
        </>}

        <Field label="Email" value={form.email} onChangeText={value => set("email", value)} keyboardType="email-address" placeholder="email@example.com" />
        <Field label="Mật khẩu" value={form.password} onChangeText={value => set("password", value)} secureTextEntry />
        {mode === "signup" && <Field label="Nhập lại mật khẩu" value={form.confirmPassword} onChangeText={value => set("confirmPassword", value)} secureTextEntry />}

        <AppButton loading={loading} onPress={submit} icon={mode === "login" ? "log-in-outline" : "person-add-outline"}>
          {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </AppButton>
      </Card>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: 20,
    padding: 18,
    paddingTop: 56
  },
  brand: {
    alignItems: "center",
    gap: 8
  },
  logo: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  logoText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900"
  }
});
