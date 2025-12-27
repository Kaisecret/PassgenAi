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

  // Helper to fetch extra profile data without blocking the UI
  const fetchProfileAndMerge = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && mounted.current) {
        setUser((prev) => {
          if (!prev || prev.id !== userId) return prev;
          return {
            ...prev,
            name: data.full_name || prev.name,
            avatar_url: data.avatar_url || prev.avatar_url
          };
        });
      }
    } catch (err) {
      console.warn("Background profile fetch failed", err);
    }
  };

  useEffect(() => {
    mounted.current = true;

    // Safety fallback: Force app to load after 2.5 seconds even if Auth hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth initialization timed out - forcing app render");
        setLoading(false);
      }
    }, 2500);

    // Initialize Guest Count
    try {
      const count = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.GUEST_COUNT) || '0', 10);
      setGuestUsageCount(isNaN(count) ? 0 : count);
    } catch (e) {
      console.warn("Could not access local storage");
    }

    // Main Initialization Logic
    const initializeAuth = async () => {
      try {
        // 1. Get Session directly
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          // 2. Construct User immediately from Session Data
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
            avatar_url: session.user.user_metadata?.avatar_url
          };

          if (mounted.current) {
            setUser(basicUser);
            // UNBLOCK UI IMMEDIATELY to prevent blue screen
            setLoading(false);
          }

          // 3. Fetch full profile details in the background
          fetchProfileAndMerge(session.user.id);

        } else {
          // No user session
          if (mounted.current) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted.current) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
            avatar_url: session.user.user_metadata?.avatar_url
          };
          setUser(basicUser);
          setLoading(false);
          // Fetch updates in background
          fetchProfileAndMerge(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(safetyTimeout);
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
         fetchProfileAndMerge(session.user.id);
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
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
           <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
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