// Frontend app user (internal representation used across all components)
export type UserRole = 'customer' | 'collaborator' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  userName?: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  identityCard?: string;
  sex?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
}

// API schema types — match the UserService OpenAPI spec exactly
export interface ApiUser {
  userId?: number;
  userName: string;
  email: string;
  password?: string;
  identityCard?: string | null;
  sex?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  roleId: number;
  role?: ApiRole;
  fullName?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
  confirmPassword?: string;
}

export interface ApiRole {
  roleId: number;
  roleName: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface UserInfo {
  userId: number;
  userName?: string | null;
  email?: string | null;
  identityCard?: string | null;
  sex?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string;
  address?: string | null;
  fullName?: string | null;
}

export interface PaginationParams {
  PageIndex: number;
  PageSize: number;
}

// roleId mapping — 1=collaborator, 2=customer, 3=admin (matches backend seed data)
export const ROLE_ID_MAP: Record<UserRole, number> = {
  collaborator: 1,
  customer: 2,
  admin: 3,
};

export const ROLE_FROM_ID: Record<number, UserRole> = {
  1: 'collaborator',
  2: 'customer',
  3: 'admin',
};
