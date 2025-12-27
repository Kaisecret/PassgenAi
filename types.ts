export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  avatar_url?: string;
}

export interface GeneratedPassword {
  password: string;
  strength: 'Weak' | 'Medium' | 'Strong';
  explanation: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  guestUsageCount: number;
}

export type PasswordComplexity = 'easy' | 'cool' | 'hard';

export enum AppRoutes {
  HOME = '/',
  LOGIN = '/login',
  REGISTER = '/register',
  GENERATOR = '/app',
  SETTINGS = '/settings'
}