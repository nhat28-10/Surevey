import axios from 'axios';

const TOKEN_KEY = 'sureVey_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_USER_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      localStorage.removeItem('sureVey_currentUser');
      window.dispatchEvent(new Event('storage'));
    }
    return Promise.reject(error);
  }
);
