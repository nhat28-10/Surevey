import { userApi, getGoogleLoginUrl } from '../api/userApi';
import { getToken, setToken, clearToken } from '../api/httpClient';
import type { User, SignupData, LoginCredentials, ApiUser, UserInfo } from '../types/auth';
import { ROLE_FROM_ID, ROLE_ID_MAP } from '../types/auth';

export { getGoogleLoginUrl };

const CURRENT_USER_KEY = 'sureVey_currentUser';

// --- Internal helpers ---

const extractToken = (data: unknown): string | null => {
  if (typeof data === 'string' && data.length > 10) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.token === 'string') return obj.token;
    if (typeof obj.accessToken === 'string') return obj.accessToken;
    if (typeof obj.jwt === 'string') return obj.jwt;
  }
  return null;
};

const extractError = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'Đã xảy ra lỗi';
  const err = error as { response?: { data?: unknown } };
  const data = err.response?.data;
  if (typeof data === 'string' && data.length > 0) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.title === 'string') return obj.title;
  }
  return 'Đã xảy ra lỗi';
};

const mapApiUser = (apiUser: ApiUser): User => ({
  id: String(apiUser.userId),
  email: apiUser.email,
  name: apiUser.fullName || apiUser.userName || apiUser.email,
  role: ROLE_FROM_ID[apiUser.roleId] ?? 'collaborator',
  createdAt: new Date().toISOString(),
  userName: apiUser.userName,
  fullName: apiUser.fullName ?? undefined,
  avatarUrl: apiUser.avatarUrl ?? undefined,
  phoneNumber: apiUser.phoneNumber ?? undefined,
  identityCard: apiUser.identityCard ?? undefined,
  sex: apiUser.sex ?? undefined,
  dateOfBirth: apiUser.dateOfBirth ?? undefined,
  address: apiUser.address ?? undefined,
});

const persistUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('storage'));
};

// --- Public API ---

/** Synchronous — reads from localStorage cache. Safe to call anywhere. */
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? (JSON.parse(stored) as User) : null;
};

/** True only when both a cached user and a JWT token exist. */
export const isAuthenticated = (): boolean =>
  getCurrentUser() !== null && getToken() !== null;

export const login = async (
  credentials: LoginCredentials
): Promise<{ success: boolean; requiresOtp?: boolean; error?: string; user?: User }> => {
  try {
    const response = await userApi.login(credentials);
    const token = extractToken(response.data);

    if (token) {
      setToken(token);
      const { data } = await userApi.getProfile();
      const user = mapApiUser(data);
      persistUser(user);
      return { success: true, user };
    }

    // No token → backend sent OTP, caller should show OTP step
    return { success: true, requiresOtp: true };
  } catch (error) {
    return { success: false, error: extractError(error) };
  }
};

export const verifyOtp = async (
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const response = await userApi.verifyOtp({ email, otp });
    const token = extractToken(response.data);
    if (token) setToken(token);

    const { data } = await userApi.getProfile();
    const user = mapApiUser(data);
    persistUser(user);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: extractError(error) };
  }
};

export const signup = async (
  data: SignupData
): Promise<{ success: boolean; error?: string }> => {
  try {
    await userApi.register({
      userId: 0,
      userName: data.name,
      email: data.email,
      password: data.password,
      confirmPassword: data.password,
      roleId: ROLE_ID_MAP[data.role],
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: extractError(error) };
  }
};

export const logout = (): void => {
  clearToken();
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const updateProfile = async (
  updates: Partial<UserInfo>
): Promise<{ success: boolean; error?: string; user?: User }> => {
  const currentUser = getCurrentUser();
  if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };

  try {
    await userApi.updateUser({
      userId: Number(currentUser.id),
      userName: updates.userName ?? currentUser.userName,
      email: updates.email ?? currentUser.email,
      fullName: updates.fullName ?? currentUser.fullName,
      phoneNumber: updates.phoneNumber ?? currentUser.phoneNumber,
      identityCard: updates.identityCard ?? currentUser.identityCard,
      sex: updates.sex ?? currentUser.sex,
      dateOfBirth: updates.dateOfBirth ?? currentUser.dateOfBirth,
      address: updates.address ?? currentUser.address,
    });
    const { data } = await userApi.getProfile();
    const user = mapApiUser(data);
    persistUser(user);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: extractError(error) };
  }
};

/** Client-side only role switch — used for demo/testing without a backend role change. */
export const switchUserRole = (role: 'customer' | 'collaborator'): User | null => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  const updatedUser = { ...currentUser, role };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};

export const refreshProfile = async (): Promise<User | null> => {
  try {
    const { data } = await userApi.getProfile();
    const user = mapApiUser(data);
    persistUser(user);
    return user;
  } catch {
    return null;
  }
};
