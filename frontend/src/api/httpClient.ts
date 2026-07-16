const TOKEN_KEY = "surevey_access_token";

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

const API_GATEWAY_URL = trimTrailingSlash(
  import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL || "",
);

const USER_API_URL = trimTrailingSlash(
  import.meta.env.VITE_USER_API_URL || "https://suresurvey-user-service.onrender.com",
);
const SURVEY_API_URL = trimTrailingSlash(
  import.meta.env.VITE_SURVEY_API_URL || "https://suresurvey-survey-service.onrender.com",
);
const WALLET_API_URL = trimTrailingSlash(
  import.meta.env.VITE_WALLET_API_URL || "https://suresurvey-wallet-service.onrender.com",
);

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
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const inFlightMutations = new Map<string, Promise<unknown>>();

function mutationKey(method: string, path: string, body?: unknown): string {
  return `${method}:${path}:${body === undefined ? "" : JSON.stringify(body)}`;
}

function resolveRequestUrl(path: string): string {
  // When an API Gateway URL is configured, keep the /user, /survey and
  // /wallet prefixes because the gateway uses them for routing.
  if (API_GATEWAY_URL) {
    return `${API_GATEWAY_URL}${path}`;
  }

  // Direct-service mode: remove the gateway-only prefix before calling
  // the corresponding deployed service.
  if (path === "/user" || path.startsWith("/user/")) {
    return `${USER_API_URL}${path.slice("/user".length) || "/"}`;
  }
  if (path === "/survey" || path.startsWith("/survey/")) {
    return `${SURVEY_API_URL}${path.slice("/survey".length) || "/"}`;
  }
  if (path === "/wallet" || path.startsWith("/wallet/")) {
    return `${WALLET_API_URL}${path.slice("/wallet".length) || "/"}`;
  }

  throw new Error(`Không xác định được backend service cho API path: ${path}`);
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
      "Yêu cầu không thành công";

    if (response.status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth-changed"));
    }

    throw new ApiError(
      message,
      response.status,
      typeof data.code === "string" ? data.code : undefined,
      typeof data.errors === "object" && data.errors !== null
        ? data.errors as Record<string, string[]>
        : undefined,
    );
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { bodyJson?: unknown; skipAuth?: boolean } = {},
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.bodyJson !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const token = tokenStorage.get();
  if (token && !options.skipAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestUrl = resolveRequestUrl(path);
  const execute = () => fetch(requestUrl, {
    ...options,
    headers,
    body: options.bodyJson === undefined ? options.body : JSON.stringify(options.bodyJson),
  }).then(parseResponse<T>);

  if (method === "GET" || method === "HEAD") return execute();

  const key = mutationKey(method, path, options.bodyJson);
  const existing = inFlightMutations.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const requestPromise = execute();
  inFlightMutations.set(key, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inFlightMutations.delete(key);
  }
}
