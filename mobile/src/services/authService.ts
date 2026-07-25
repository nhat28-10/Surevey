import { authApi } from "../api/authApi";
import { tokenStorage } from "../api/client";
import type { BackendRole } from "../api/types";

export type UserRole = BackendRole;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

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

const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function decodeBase64(input: string) {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";

  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of str) {
    if (char === "=") break;
    const value = base64Chars.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return decodeURIComponent(output.split("").map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`).join(""));
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64(payload)) as JwtPayload;
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
    role
  };
}

export async function getCurrentUser() {
  const token = await tokenStorage.get();
  if (!token) return null;
  const user = userFromToken(token);
  if (!user) await tokenStorage.clear();
  return user;
}

export async function login(email: string, password: string) {
  const response = await authApi.login({ email: email.trim().toLowerCase(), password });
  await tokenStorage.set(response.token);
  const user = userFromToken(response.token);
  if (!user) {
    await tokenStorage.clear();
    throw new Error("JWT backend trả về không hợp lệ");
  }
  return user;
}

export async function signup(data: {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: Exclude<UserRole, "Admin">;
}) {
  await authApi.register({
    userName: data.userName.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    confirmPassword: data.confirmPassword,
    fullName: data.name.trim(),
    roleId: data.role === "Collaborator" ? 1 : 2
  });
  return login(data.email, data.password);
}

export async function logout() {
  await tokenStorage.clear();
}
