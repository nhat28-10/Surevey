export type UserRole = "Customer" | "Collaborator" | "Admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: Exclude<UserRole, "Admin">;
}
