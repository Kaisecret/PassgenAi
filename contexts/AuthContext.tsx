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

  // Helper to safely construct user object
  const constructUser = async (sessionUser: any): Promise<User | null> => {
    if (!sessionUser) return null;

    // 1. Basic info from session
    let userData: User = {
      id: sessionUser.id,
      email: sessionUser.email || '',
      // Safe access to metadata, fallback to 'User'
      name: sessionUser.user_metadata?.name || 'User',
      avatar_url: sessionUser.user_metadata?.avatar_url
    };

    // 2. Fetch profile details from database
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (data) {
        userData.name = data.full_name || userData.name;
        userData.avatar_url = data.avatar_url || userData.avatar_url;
      }
    } catch (err) {
      console.warn("Profile fetch failed, using session data only", err);
    }

    return userData;
  };

  useEffect(() => {
    mounted.current = true;

    // Initialize Guest Count from LocalStorage
    try {
      const count = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.GUEST_COUNT) || '0', 10);
      setGuestUsageCount(isNaN(count) ? 0 : count);
    } catch (e) {
      console.warn("Could not access local storage");
    }

    // Initialization Logic
    const initializeAuth = async () => {
      try {
        // 1. Get initial session explicitly
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userDetails = await constructUser(session.user);
          if (mounted.current) setUser(userDetails);
        } else {
          if (mounted.current) setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted.current) setUser(null);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      // Only handle updates if we aren't loading (initial load handled by getSession)
      // Or if the event explicitly indicates a change that requires re-fetching
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const userDetails = await constructUser(session.user);
          if (mounted.current) setUser(userDetails);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted.current) setUser(null);
      }
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
        const updatedUser = await constructUser(session.user);
        if (mounted.current) setUser(updatedUser);
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