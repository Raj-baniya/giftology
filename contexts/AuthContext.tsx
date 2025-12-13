import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { sendWelcomeEmail, sendOtpToUser } from '../services/emailService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (name: string, email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  loginWithOtp: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ data: any; error: any }>;
  changePassword: (password: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          joinDate: session.user.created_at,
          role: session.user.user_metadata?.role || 'user'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          joinDate: session.user.created_at,
          role: session.user.user_metadata?.role || 'user'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'user'
        }
      }
    });
    if (!error) {
      // Send welcome email
      console.log('Registration successful, sending welcome email...');
      sendWelcomeEmail(name, email).then(res => {
        console.log('Welcome email result:', res);
      });
    } else {
      console.error('Registration error:', error);
    }
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (name: string) => {
    if (user) {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      if (!error) {
        setUser(prev => prev ? { ...prev, displayName: name } : null);
      }
    }
  };

  const loginWithOtp = async (email: string) => {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in sessionStorage for verification (Client-side temporary storage)
      sessionStorage.setItem(`giftology_otp_${email}`, otp);

      // Send OTP via EmailJS
      // We use email as name since we might not have it for login
      console.log(`Generating OTP for ${email}...`);
      const { success, error } = await sendOtpToUser(email.split('@')[0], email, otp);

      if (!success) {
        throw new Error(error || 'Failed to send OTP');
      }

      return { error: null };
    } catch (error) {
      console.error('Login with OTP error:', error);
      return { error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const storedOtp = sessionStorage.getItem(`giftology_otp_${email}`);

      if (!storedOtp || storedOtp !== token) {
        return { data: { session: null }, error: { message: 'Invalid or expired OTP' } };
      }

      // OTP Verified
      sessionStorage.removeItem(`giftology_otp_${email}`);

      // --- Ephemeral Guest Auth Strategy ---
      // Goal: Obtain a REAL Supabase session to satisfy RLS policies, 
      // even if the user is a guest or has a password mismatch.

      let sessionUser: User | null = null;
      let realSupabaseUserId: string | null = null;

      try {
        const deterministicPassword = `Giftology@${email}`;

        // 1. Try to Sign In (Existing User with Standard Password)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: deterministicPassword
        });

        if (signInData.session) {
          console.log('✅ Auto-login successful (Existing OTP User).');
          realSupabaseUserId = signInData.session.user.id;
        } else {
          // 2. Login Failed (User doesn't exist OR has a different password)
          // Try to Sign Up as a NEW User
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: deterministicPassword,
            options: { data: { full_name: email.split('@')[0] } }
          });

          if (signUpData.session) {
            console.log('✅ Auto-registration successful (New OTP User).');
            realSupabaseUserId = signUpData.session.user.id;
          } else if (signUpError && signUpError.message.includes('already registered')) {
            // 3. User exists but password didn't match (Real user trying to use OTP)
            // CRITICAL: We cannot sign them in. We must create a TEMPORARY "Guest" account
            // just to get a session for RLS.
            console.log('⚠️ User exists with different password. Creating Ephemeral Guest Session...');

            const tempEmail = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}@giftology.temp`;
            const tempPassword = `Guest@${Date.now()}`;

            const { data: tempData, error: tempError } = await supabase.auth.signUp({
              email: tempEmail,
              password: tempPassword,
              options: { data: { is_ephemeral: true, real_email: email } }
            });

            if (tempData.session) {
              console.log('✅ Ephemeral Guest Session obtained.');
              realSupabaseUserId = tempData.session.user.id;
            } else {
              console.error('❌ Failed to create ephemeral guest:', tempError);
            }
          }
        }
      } catch (authErr) {
        console.error('Auto-auth attempt failed:', authErr);
      }

      // Construct the User Object for the Frontend
      // We use the REAL email/name for display, but the (potentially ephemeral) ID for the DB
      const finalUser: User = {
        id: realSupabaseUserId || `otp_${email}`, // Fallback to mock ID if absolutely everything fails
        email: email,
        displayName: email.split('@')[0],
        joinDate: new Date().toISOString(),
        role: 'user'
      };

      setUser(finalUser);
      return { data: { session: { user: finalUser } }, error: null };

    } catch (error) {
      return { data: { session: null }, error };
    }
  };

  const changePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loginWithOtp, verifyOtp, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};