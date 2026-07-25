import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Card({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "dark" | "green" | "blue" | "amber" | "danger" }) {
  return <View style={[styles.card, tone === "dark" && styles.cardDark, tone === "green" && styles.cardGreen, tone === "blue" && styles.cardBlue, tone === "amber" && styles.cardAmber, tone === "danger" && styles.cardDanger]}>{children}</View>;
}

export function Row({ children, spread = false, wrap = false }: { children: ReactNode; spread?: boolean; wrap?: boolean }) {
  return <View style={[styles.row, spread && styles.rowSpread, wrap && styles.rowWrap]}>{children}</View>;
}

export function Title({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <Text style={[styles.title, light && styles.lightText]}>{children}</Text>;
}

export function Subtitle({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <Text style={[styles.subtitle, light && styles.lightMuted]}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  return <View style={[styles.badge, tone === "green" && styles.badgeGreen, tone === "amber" && styles.badgeAmber, tone === "red" && styles.badgeRed, tone === "blue" && styles.badgeBlue]}>
    <Text style={[styles.badgeText, tone === "green" && styles.badgeTextGreen, tone === "amber" && styles.badgeTextAmber, tone === "red" && styles.badgeTextRed, tone === "blue" && styles.badgeTextBlue]}>{children}</Text>
  </View>;
}

export function AppButton({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: "primary" | "dark" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const darkText = variant === "outline" || variant === "ghost";
  return <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.button,
      variant === "dark" && styles.buttonDark,
      variant === "outline" && styles.buttonOutline,
      variant === "danger" && styles.buttonDanger,
      variant === "ghost" && styles.buttonGhost,
      (disabled || loading) && styles.buttonDisabled,
      pressed && !disabled && !loading && styles.pressed
    ]}
  >
    {loading ? <ActivityIndicator size="small" color={darkText ? colors.text : "#fff"} /> : icon ? <Ionicons name={icon} size={17} color={darkText ? colors.text : "#fff"} /> : null}
    <Text style={[styles.buttonText, darkText && styles.buttonTextDark]}>{children}</Text>
  </Pressable>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  secureTextEntry = false,
  editable = true
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  secureTextEntry?: boolean;
  editable?: boolean;
}) {
  return <View style={styles.field}>
    <Label>{label}</Label>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      multiline={multiline}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      editable={editable}
      autoCapitalize={keyboardType === "email-address" || keyboardType === "url" ? "none" : "sentences"}
      style={[styles.input, multiline && styles.textarea, !editable && styles.inputDisabled]}
    />
  </View>;
}

export function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "dark" | "green" | "amber" | "blue" }) {
  return <View style={[styles.metric, tone === "dark" && styles.metricDark, tone === "green" && styles.metricGreen, tone === "amber" && styles.metricAmber, tone === "blue" && styles.metricBlue]}>
    <Text style={[styles.metricLabel, tone === "dark" && styles.lightMuted]}>{label}</Text>
    <Text style={[styles.metricValue, tone === "dark" && styles.lightText]}>{value}</Text>
  </View>;
}

export function EmptyState({ title, description, icon = "file-tray-outline" }: { title: string; description: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return <Card>
    <View style={styles.empty}>
      <Ionicons name={icon} size={28} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  </Card>;
}

export function ErrorBanner({ messageText }: { messageText: string }) {
  if (!messageText) return null;
  return <View style={styles.errorBanner}><Text style={styles.errorText}>{messageText}</Text></View>;
}

export function LoadingState({ label = "Đang tải dữ liệu" }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.subtitle}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    padding: 16
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  cardDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  cardGreen: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0"
  },
  cardBlue: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe"
  },
  cardAmber: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a"
  },
  cardDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  rowSpread: {
    justifyContent: "space-between"
  },
  rowWrap: {
    flexWrap: "wrap"
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  lightText: {
    color: "#ffffff"
  },
  lightMuted: {
    color: "#cbd5e1"
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700"
  },
  badgeGreen: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0"
  },
  badgeAmber: {
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a"
  },
  badgeRed: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca"
  },
  badgeBlue: {
    backgroundColor: "#dbeafe",
    borderColor: "#bfdbfe"
  },
  badgeTextGreen: {
    color: "#166534"
  },
  badgeTextAmber: {
    color: "#92400e"
  },
  badgeTextRed: {
    color: "#991b1b"
  },
  badgeTextBlue: {
    color: "#1e40af"
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  buttonDark: {
    backgroundColor: colors.ink
  },
  buttonOutline: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderWidth: 1
  },
  buttonDanger: {
    backgroundColor: colors.danger
  },
  buttonGhost: {
    backgroundColor: "transparent"
  },
  buttonDisabled: {
    opacity: 0.55
  },
  pressed: {
    opacity: 0.82
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  buttonTextDark: {
    color: colors.text
  },
  field: {
    gap: 6
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inputDisabled: {
    backgroundColor: colors.surfaceMuted,
    color: colors.muted
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 132,
    padding: 14
  },
  metricDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  metricGreen: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0"
  },
  metricAmber: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a"
  },
  metricBlue: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe"
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 18
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center"
  },
  emptyDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12
  },
  errorText: {
    color: "#991b1b",
    fontSize: 14,
    lineHeight: 20
  },
  loading: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    padding: 32
  }
});
