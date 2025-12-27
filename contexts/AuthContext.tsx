import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, AuthState } from '../types';
import { LOCAL_STORAGE_KEYS, MAX_GUEST_ATTEMPTS } from '../constants';
import { supabase } from '../services/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string; session?: any }>;
  logout: () => void;
  incrementGuestUsage: () => void;
  hasAttemptsRemaining: boolean;
  updateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestUsageCount, setGuestUsageCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const fetchUser = async (sessionUser: any) => {
    try {
      if (!sessionUser) {
        if (mounted.current) setUser(null);
        return;
      }

      // Default basic info
      let userData: User = {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.name || 'User',
        avatar_url: sessionUser.user_metadata?.avatar_url
      };

      // Try fetching from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle(); // Use maybeSingle to avoid errors if row doesn't exist

      if (data) {
        userData.name = data.full_name || userData.name;
        userData.avatar_url = data.avatar_url || userData.avatar_url;
      }

      if (mounted.current) setUser(userData);
    } catch (err) {
      console.error("Error fetching user details:", err);
      // Fallback to basic session info if profile fetch fails
      if (mounted.current && sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: sessionUser.user_metadata?.name || 'User',
        });
      }
    }
  };

  useEffect(() => {
    mounted.current = true;

    // 1. Initialize Guest Count
    try {
      const count = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.GUEST_COUNT) || '0', 10);
      setGuestUsageCount(isNaN(count) ? 0 : count);
    } catch (e) {
      console.warn("Could not access local storage");
    }

    // 2. Setup Auth Listener
    // This handles both initial session and future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
         await fetchUser(session.user);
      } else {
        if (mounted.current) setUser(null);
      }
      if (mounted.current) setLoading(false);
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
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
            name: name,
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
    if (mounted.current) setUser(null);
  };

  const incrementGuestUsage = () => {
    if (!user) {
      const newCount = guestUsageCount + 1;
      setGuestUsageCount(newCount);
      localStorage.setItem(LOCAL_STORAGE_KEYS.GUEST_COUNT, newCount.toString());
    }
  };

  const updateUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUser(session.user);
      }
    } catch (e) {
      console.error("Failed to update user context", e);
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
      hasAttemptsRemaining,
      updateUser
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