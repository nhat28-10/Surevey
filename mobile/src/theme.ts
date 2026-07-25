export const colors = {
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  primary: "#16a34a",
  primaryDark: "#15803d",
  ink: "#111827",
  danger: "#dc2626",
  amber: "#d97706",
  blue: "#2563eb"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24
};

export function money(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

export function date(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("vi-VN");
}

export function dateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("vi-VN");
}

export function message(error: unknown) {
  return error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
}
