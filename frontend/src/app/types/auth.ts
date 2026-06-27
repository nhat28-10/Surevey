// Model: Authentication Data Types

export type UserRole = 'owner' | 'helper' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  password?: string; // only stored for seeded accounts (e.g. admin)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}
