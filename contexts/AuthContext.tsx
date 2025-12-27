import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { LOCAL_STORAGE_KEYS, MAX_GUEST_ATTEMPTS } from '../constants';
import { supabase } from '../services/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string; session?: any }>;
  logout: () => void;
  incrementGuestUsage: () => void;
  hasAttemptsRemaining: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestUsageCount, setGuestUsageCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initialize Guest Count from LocalStorage
    try {
      const count = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.GUEST_COUNT) || '0', 10);
      setGuestUsageCount(count);
    } catch (e) {
      console.warn("Could not access local storage");
    }

    // 2. Check Active Session from Supabase
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
          });
        }
      } catch (error) {
        console.warn('Supabase auth unavailable or not configured:', error);
        // Do not block app loading on auth error
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 3. Listen for Auth Changes (Login, Logout, etc.)
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.warn('Could not subscribe to auth changes:', error);
      setLoading(false);
      return () => {};
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!password) return { success: false, error: "Password is required" };
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password?: string): Promise<{ success: boolean; error?: string; session?: any }> => {
    if (!password) return { success: false, error: "Password is required" };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // Save name in user_metadata
          },
        },
      });

      if (error) throw error;
      return { success: true, session: data.session };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  const incrementGuestUsage = () => {
    if (!user) {
      const newCount = guestUsageCount + 1;
      setGuestUsageCount(newCount);
      localStorage.setItem(LOCAL_STORAGE_KEYS.GUEST_COUNT, newCount.toString());
    }
  };

  const hasAttemptsRemaining = user !== null || guestUsageCount < MAX_GUEST_ATTEMPTS;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      guestUsageCount,
      login,
      register,
      logout,
      incrementGuestUsage,
      hasAttemptsRemaining
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};