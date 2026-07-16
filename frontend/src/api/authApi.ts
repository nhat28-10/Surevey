import { apiRequest } from "./httpClient";
import type { BackendRole, UserProfile } from "./types";

export interface AuthUserResponse {
  userId: number;
  userName: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: BackendRole;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUserResponse;
}

export interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  roleId: 1 | 2;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiRequest<{ message: string }>("/user/api/user/register", {
      method: "POST",
      bodyJson: data,
      skipAuth: true,
    }),
  login: (data: { email: string; password: string }) =>
    apiRequest<AuthResponse>("/user/api/user/login", {
      method: "POST",
      bodyJson: data,
      skipAuth: true,
    }),
  profile: () => apiRequest<UserProfile>("/user/api/user/profile"),
  updateProfile: (data: UserProfile) =>
    apiRequest<{ message: string }>("/user/api/user/update", { method: "PUT", bodyJson: data }),
};
