import { jwtDecode } from 'jwt-decode';
import { User } from '../types';

const TOKEN_KEY = 'admin_token';

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    removeToken();
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<{ user: User }>(token);
    return decoded.user;
  } catch (error) {
    return null;
  }
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};
