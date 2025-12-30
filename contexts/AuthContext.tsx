import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { sendWelcomeEmail, sendOtpToUser } from '../services/emailService';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (name: string, email: string, password: string) => Promise<{ session?: any; error: any }>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  loginWithOtp: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string, options?: { skipAutoAuth?: boolean }) => Promise<{ data: any; error: any }>;
  changePassword: (password: string) => Promise<{ error: any }>;
  checkUserExists: (email: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch and sync profile
  const fetchProfile = async (userId: string) => {
    try {
      console.log(`[AuthContext] Fetching profile for ${userId}...`);

      const fetchProcess = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([
        fetchProcess,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timed out')), 10000))
      ]);

      if (error) {
        console.warn('[AuthContext] Profile fetch error:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[AuthContext] Unexpected profile sync error:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id);
      if (p) setProfile(p);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          // Set basic user info immediately (Non-Blocking)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            joinDate: session.user.created_at,
            role: session.user.user_metadata?.role || 'user'
          });
          setLoading(false);

          // Fetch profile in background
          fetchProfile(session.user.id).then(pd => {
            if (pd && mounted) {
              setProfile(pd);
              setUser(prev => prev ? {
                ...prev,
                displayName: pd.full_name || prev.displayName,
                role: pd.role || prev.role
              } : null);
            }
          });
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        // Only clear user if it's definitely an auth error (like invalid token), not network error
        if (mounted && error?.message?.includes('invalid_grant')) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthContext] Auth state change: ${event}`);

      if (session?.user && mounted) {
        // SET USER IMMEDIATELY (NON-BLOCKING)
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          joinDate: session.user.created_at,
          role: session.user.user_metadata?.role || 'user'
        });
        setLoading(false);

        // FETCH PROFILE IN BACKGROUND
        fetchProfile(session.user.id).then(pd => {
          if (pd && mounted) {
            setProfile(pd);
            setUser(prev => prev ? {
              ...prev,
              displayName: pd.full_name || prev.displayName,
              role: pd.role || prev.role
            } : null);
          }
        });
      } else if (mounted) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // --- REALTIME DELETION LISTENER ---
    // If the Admin deletes the user record, we want to logout immediately.
    let profileChannel: any = null;

    const setupDeletionListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      console.log(`[AuthContext] Setting up deletion listener for ${userId}`);

      profileChannel = supabase
        .channel(`public:profiles:delete:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            console.warn('[AuthContext] User profile deleted! Logging out...', payload);
            alert('Your account has been deleted by an administrator. Please create a new account.');
            logout();
            window.location.href = '/login?mode=signup'; // Redirect to Signup
          }
        )
        .subscribe();
    };

    // Call listener setup
    setupDeletionListener();

    // --- POLL & FOCUS CHECK ---
    // Double-check session validity periodically and when window gains focus
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AuthContext] Window focused, validating session...');
        checkSession();
      }
    };

    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Poll every 10 seconds just to be safe
    const poller = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      clearInterval(poller);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const attemptLogin = async () => {
      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Login is taking longer than usual. This is normal for a secure system. Please wait or try one more time.')), 60000))
      ]);
      return { error };
    };

    try {
      // Try first attempt
      let res = await attemptLogin();
      if (res.error && (res.error.message?.includes('timeout') || res.error.message?.includes('FetchError'))) {
        console.log('[AuthContext] Login timed out or network error, retrying once...');
        return await attemptLogin(); // Retry once
      }
      return res;
    } catch (err: any) {
      return { error: err };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data: signUpData, error } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, role: 'user' } }
        }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Registration is taking a while as we set up your secure account. Please stay on this page.')), 60000))
      ]);

      if (error) return { error };
      return { session: signUpData.session, error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (name: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id);

    if (error) throw error;

    setUser(prev => prev ? { ...prev, displayName: name } : null);
    setProfile(prev => prev ? { ...prev, full_name: name } : null);

    await supabase.auth.updateUser({
      data: { full_name: name }
    });
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const checkProcess = async () => {
        // 1. Try Secure RPC (checks auth.users + profiles)
        const { data: rpcData, error: rpcError } = await supabase.rpc('check_email_exists', {
          email_input: normalizedEmail
        });

        if (!rpcError) return !!rpcData;

        // 2. Fallback to Profile check
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();

        return !!profileData;
      };

      return await Promise.race([
        checkProcess(),
        new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('User check timed out')), 30000))
      ]);
    } catch (err) {
      console.error('[AuthContext] checkUserExists failed:', err);
      return false;
    }
  };

  const loginWithOtp = async (email: string) => {
    try {
      // 30-second timeout protection for OTP
      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('OTP request timed out. Please check your internet connection and try again.')), 30000)
      );

      const sendProcess = async () => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        sessionStorage.setItem(`giftology_otp_${email}`, otp);
        console.log(`Generating OTP for ${email}...`);
        const { success, error } = await sendOtpToUser(email.split('@')[0], email, otp);
        if (!success) {
          throw new Error(error || 'Failed to send OTP');
        }
        return { error: null };
      };

      return await Promise.race([sendProcess(), timeoutPromise]);
    } catch (error) {
      console.error('Login with OTP error:', error);
      return { error };
    }
  };

  const verifyOtp = async (email: string, token: string, options: { skipAutoAuth?: boolean } = {}) => {
    try {
      const verifyProcess = async () => {
        const storedOtp = sessionStorage.getItem(`giftology_otp_${email}`);

        if (!storedOtp || storedOtp !== token) {
          return { data: { session: null }, error: { message: 'Invalid or expired OTP' } };
        }

        if (options.skipAutoAuth) {
          return { data: { verified: true }, error: null };
        }

        sessionStorage.removeItem(`giftology_otp_${email}`);

        let realSupabaseUserId: string | null = null;
        let sessionData: any = null;
        const deterministicPassword = `Giftology@${email}`;

        console.log(`[AuthContext] Post-OTP: Attempting atomic authentication for ${email}...`);

        // 1. Try to Sign In (Primary Path for both Login and 'Recovering' from failed signup)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: deterministicPassword
        });

        if (signInData.session) {
          console.log('✅ Auth successful via Sign In.');
          sessionData = signInData.session;
          realSupabaseUserId = signInData.session.user.id;
        } else {
          // 2. Not found or password mismatch. Try Sign Up (New User Path)
          console.log('User not found or password mismatch, trying Sign Up...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: deterministicPassword,
            options: {
              data: { full_name: email.split('@')[0] },
              emailRedirectTo: window.location.origin
            }
          });

          if (signUpData.session) {
            console.log('✅ Auth successful via Sign Up.');
            sessionData = signUpData.session;
            realSupabaseUserId = signUpData.session.user.id;
          } else if (signUpData.user && !signUpData.session) {
            // Case: User created but email confirmation might be required by Supabase settings.
            // OR: Magic Link flow interference.
            console.warn('⚠️ User created but no session returned. Attempting immediate sign-in...');

            // Retry Sign In immediately (sometimes needed if auto-confirm is fast)
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: deterministicPassword
            });

            if (retryData.session) {
              console.log('✅ Auth successful via Retry Sign In.');
              sessionData = retryData.session;
              realSupabaseUserId = retryData.session.user.id;
            } else {
              console.error('❌ Retry failed:', retryError?.message);
              // CRITICAL FALLBACK: If we created the user but can't get a session,
              // it likely means "Confirm Email" is ON in Supabase.
              // We return a specific error guiding the developer/user.
              return {
                data: { session: null },
                error: { message: 'Account created! If you are not redirected, please check your email for a confirmation link, or try logging in.' }
              };
            }

          } else if (signUpError) {
            console.error('❌ Sign Up failed:', signUpError.message);
            // Handle "already registered" if signIn failed above (means password changed)
            if (signUpError.message?.includes('already registered')) {
              return { data: { session: null }, error: { message: 'Account exists. Please use password login or reset password.' } };
            }
            throw signUpError;
          }
        }

        if (realSupabaseUserId) {
          // Sync profile in background
          fetchProfile(realSupabaseUserId).then(p => {
            if (p) setProfile(p);
          });

          const finalUser: User = {
            id: realSupabaseUserId,
            email: email,
            displayName: email.split('@')[0],
            joinDate: sessionData?.user?.created_at || new Date().toISOString(),
            role: 'user'
          };

          setUser(finalUser);
          return { data: { session: { user: finalUser } }, error: null };
        }

        throw new Error('Could not establish a valid session.');
      };

      // Increased timeout to 60s for registration stability
      return await Promise.race([
        verifyProcess(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('The database is taking a moment to wake up. This is normal for a secure system. Please wait about 30 seconds and try clicking Verify again.')), 60000))
      ]);
    } catch (error: any) {
      console.error('[AuthContext] Verification Fatality:', error);
      return { data: { session: null }, error: { message: error.message || 'Verification failed' } };
    }
  };

  const changePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      login,
      register,
      logout,
      updateProfile,
      loginWithOtp,
      verifyOtp,
      changePassword,
      checkUserExists,
      refreshProfile,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};