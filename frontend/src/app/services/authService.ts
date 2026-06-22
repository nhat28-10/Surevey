// Controller: Authentication Service for user management

import { User, LoginCredentials, SignupData } from '../types/auth';

const USERS_STORAGE_KEY = 'sureVey_users';
const CURRENT_USER_KEY = 'sureVey_currentUser';

// Get all registered users
const getAllUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save users to localStorage
const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Get current logged-in user
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Signup new user
export const signup = (data: SignupData): { success: boolean; error?: string; user?: User } => {
  const users = getAllUsers();
  
  // Check if email already exists
  if (users.some(u => u.email === data.email)) {
    return { success: false, error: 'Email đã được sử dụng' };
  }
  
  // Create new user
  const newUser: User = {
    id: `user_${Date.now()}`,
    email: data.email,
    name: data.name,
    role: data.role,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Auto login after signup
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  
  return { success: true, user: newUser };
};

// Login user
export const login = (credentials: LoginCredentials): { success: boolean; error?: string; user?: User } => {
  const users = getAllUsers();
  
  // Find user by email (simple check for MVP - no real password validation)
  const user = users.find(u => u.email === credentials.email);
  
  if (!user) {
    return { success: false, error: 'Email hoặc mật khẩu không đúng' };
  }
  
  // Set current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  
  return { success: true, user };
};

// Logout user
export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Switch user role (for demo purposes)
export const switchUserRole = (role: 'owner' | 'helper'): User | null => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  const updatedUser = { ...currentUser, role };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  
  // Update in users list
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === currentUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }
  
  return updatedUser;
};
