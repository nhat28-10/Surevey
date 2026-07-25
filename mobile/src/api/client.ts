import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const TOKEN_KEY = "surevey_access_token";

const trimTrailingSlash = (value?: string | null) => (value || "").replace(/\/$/, "");

const extra = Constants.expoConfig?.extra || {};

const API_GATEWAY_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_API_GATEWAY_URL || extra.apiGatewayUrl as string);
const USER_API_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_USER_API_URL || extra.userApiUrl as string || "https://suresurvey-user-service.onrender.com");
const SURVEY_API_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_SURVEY_API_URL || extra.surveyApiUrl as string || "https://suresurvey-survey-service.onrender.com");
const WALLET_API_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_WALLET_API_URL || extra.walletApiUrl as string || "https://suresurvey-wallet-service.onrender.com");

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export const tokenStorage = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  clear: () => AsyncStorage.removeItem(TOKEN_KEY)
};

function resolveRequestUrl(path: string): string {
  if (API_GATEWAY_URL) return `${API_GATEWAY_URL}${path}`;
  if (path === "/user" || path.startsWith("/user/")) return `${USER_API_URL}${path.slice("/user".length) || "/"}`;
  if (path === "/survey" || path.startsWith("/survey/")) return `${SURVEY_API_URL}${path.slice("/survey".length) || "/"}`;
  if (path === "/wallet" || path.startsWith("/wallet/")) return `${WALLET_API_URL}${path.slice("/wallet".length) || "/"}`;
  throw new Error(`Khong xac dinh duoc backend service cho API path: ${path}`);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const data = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.title === "string" && data.title) ||
      (typeof payload === "string" && payload) ||
      "Yeu cau khong thanh cong";

    if (response.status === 401) await tokenStorage.clear();

    throw new ApiError(
      message,
      response.status,
      typeof data.code === "string" ? data.code : undefined,
      typeof data.errors === "object" && data.errors !== null ? data.errors as Record<string, string[]> : undefined
    );
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { bodyJson?: unknown; skipAuth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.bodyJson !== undefined) headers.set("Content-Type", "application/json");

  const token = await tokenStorage.get();
  if (token && !options.skipAuth) headers.set("Authorization", `Bearer ${token}`);

  return fetch(resolveRequestUrl(path), {
    ...options,
    headers,
    body: options.bodyJson === undefined ? options.body : JSON.stringify(options.bodyJson)
  }).then(parseResponse<T>);
}
