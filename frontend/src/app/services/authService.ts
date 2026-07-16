import { authApi } from "../../api/authApi";
import { ApiError, tokenStorage } from "../../api/httpClient";
import type { LoginCredentials, SignupData, User, UserRole } from "../types/auth";

interface JwtPayload {
  sub?: string;
  email?: string;
  userId?: string;
  userName?: string;
  fullName?: string;
  role?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  exp?: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(decodeURIComponent(atob(padded).split("").map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`).join(""))) as JwtPayload;
  } catch {
    return null;
  }
}

function normalizeRole(value?: string): UserRole | null {
  if (!value) return null;
  const role = value.toLowerCase();
  if (role === "customer") return "Customer";
  if (role === "collaborator") return "Collaborator";
  if (role === "admin") return "Admin";
  return null;
}

function userFromToken(token: string): User | null {
  const payload = decodeJwt(token);
  if (!payload || (payload.exp && payload.exp * 1000 <= Date.now())) return null;
  const role = normalizeRole(payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]);
  const id = payload.userId || payload.sub;
  if (!id || !role) return null;
  return {
    id,
    email: payload.email || "",
    name: payload.fullName || payload.userName || payload.email || "Người dùng",
    role,
  };
}

function finishAuthentication(token: string): User | null {
  tokenStorage.set(token);
  const user = userFromToken(token);
  if (!user) {
    tokenStorage.clear();
    return null;
  }
  window.dispatchEvent(new Event("auth-changed"));
  return user;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Không thể kết nối đến máy chủ";
}

export const getCurrentUser = (): User | null => {
  const token = tokenStorage.get();
  if (!token) return null;
  const user = userFromToken(token);
  if (!user) tokenStorage.clear();
  return user;
};

export const isAuthenticated = (): boolean => getCurrentUser() !== null;

export const signup = async (data: SignupData): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    await authApi.register({
      userName: data.userName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      fullName: data.name.trim(),
      roleId: data.role === "Collaborator" ? 1 : 2,
    });

    // Backend gốc chỉ trả message khi đăng ký, nên frontend đăng nhập ngay sau đó.
    const response = await authApi.login({ email: data.email.trim().toLowerCase(), password: data.password });
    const user = finishAuthentication(response.token);
    return user ? { success: true, user } : { success: false, error: "JWT backend trả về không hợp lệ" };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
};

export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const response = await authApi.login({ email: credentials.email.trim().toLowerCase(), password: credentials.password });
    const user = finishAuthentication(response.token);
    return user ? { success: true, user } : { success: false, error: "JWT backend trả về không hợp lệ" };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
};

export const logout = (): void => {
  tokenStorage.clear();
  window.dispatchEvent(new Event("auth-changed"));
};
