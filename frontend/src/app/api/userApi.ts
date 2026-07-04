import { httpClient } from './httpClient';
import type { ApiUser, LoginRequest, VerifyOtpRequest, UserInfo, PaginationParams } from '../types/auth';

export const userApi = {
  register: (data: ApiUser) =>
    httpClient.post<unknown>('/api/user/register', data),

  login: (data: LoginRequest) =>
    httpClient.post<unknown>('/api/user/login', data),

  verifyOtp: (data: VerifyOtpRequest) =>
    httpClient.post<unknown>('/api/user/verify-otp', data),

  getProfile: () =>
    httpClient.get<ApiUser>('/api/user/profile'),

  getUserById: (id: number) =>
    httpClient.get<ApiUser>(`/api/user/getUser/${id}`),

  updateUser: (data: UserInfo) =>
    httpClient.put<unknown>('/api/user/update', data),

  getMembers: () =>
    httpClient.get<ApiUser[]>('/api/user/members'),

  getUsersPaged: (params: PaginationParams) =>
    httpClient.get<ApiUser[]>('/api/user/paging', { params }),
};

export const getGoogleLoginUrl = (): string =>
  `${import.meta.env.VITE_USER_API_URL as string}/api/user/login-google`;
