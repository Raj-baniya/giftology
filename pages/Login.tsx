
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/ui/Icons';
import { sendWelcomeEmail } from '../services/emailService';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpLogin, setIsOtpLogin] = useState(false); // New state for OTP Login mode
  const [otpSent, setOtpSent] = useState(false); // New state for OTP sent status
  const [isSignupFlow, setIsSignupFlow] = useState(false); // Validates if we are in signup path to send email

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(''); // New state for OTP input
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { alertState, showAlert, closeAlert } = useCustomAlert();

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  useEffect(() => {
    if (mode === 'signup') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [mode]);

  const { user, login, register, loginWithOtp, verifyOtp, checkUserExists } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [pendingSignup, setPendingSignup] = useState<{ name: string, email: string, password: string } | null>(null);

  const handleVerify = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await verifyOtp(cleanEmail, otp);
      if (error) throw error;

      if (data.session) {
        sessionStorage.setItem('showSignupBonus', 'true');

        // Send Welcome Email if this was a fresh signup
        if (isSignupFlow) {
          console.log('Sending welcome email to new user:', cleanEmail);
          sendWelcomeEmail(cleanEmail, name || cleanEmail.split('@')[0]);
        }

        window.location.href = '/';
      } else {
        throw new Error('Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setMessage('');

    // 1. Sanitize Email immediately
    let rawEmail = email.trim();
    if (!rawEmail) {
      setError('Email is required.');
      return;
    }

    if (!rawEmail.includes('@')) {
      rawEmail += '@gmail.com';
    }
    const cleanEmail = rawEmail.toLowerCase();
    setEmail(cleanEmail);

    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      if (isOtpLogin) {
        // --- OTP FLOW ---
        if (otpSent) {
          await handleVerify();
          return;
        }

        // Optimistic Existence Check
        try {
          const exists = await Promise.race([
            checkUserExists(cleanEmail),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(isLogin), 5000))
          ]);

          if (isLogin && !exists) {
            throw new Error('No account found with this email. Please Sign Up first.');
          }
          if (!isLogin && exists) {
            throw new Error('An account with this email already exists. Please Sign In.');
          }
        } catch (e: any) {
          console.warn('[Login] Existence check slow, proceeding...', e);
        }

        const { error } = await loginWithOtp(cleanEmail);
        if (error) throw error;

        setOtpSent(true);
        setMessage(`Success! OTP sent to ${cleanEmail}.`);
      } else {
        // --- PASSWORD FLOW (Sign In Only) ---
        if (isLogin) {
          const { error } = await login(cleanEmail, password);
          if (error) throw error;
          window.location.href = '/';
        } else {
          // --- FORCED OTP SIGNUP FLOW ---
          // 1. Check if user already exists
          try {
            const exists = await Promise.race([
              checkUserExists(cleanEmail),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
            ]);
            if (exists) throw new Error('Email already registered. Please Sign In.');
          } catch (e: any) {
            if (e.message.includes('already registered')) throw e;
            console.warn('[Login] Registration check slow, proceeding...', e);
          }

          // 2. Initiate OTP Flow Instead of Password Register
          const { error } = await loginWithOtp(cleanEmail);
          if (error) throw error;

          setIsOtpLogin(true); // Switch UI to OTP mode
          setIsSignupFlow(true); // Mark as signup for welcome email
          setOtpSent(true);
          setMessage(`Verification code sent to ${cleanEmail}.`);
        }
      }
    } catch (err: any) {
      console.error('[Login] Submit Error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError('');
    setMessage('');
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative z-50">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-charcoal/5 relative overflow-hidden group z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-black text-charcoal mb-2 uppercase tracking-widest">
            {isOtpLogin ? 'Verify OTP' : (isLogin ? 'Login' : 'Sign Up')}
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-tighter text-xs italic">
            {isOtpLogin
              ? (otpSent ? 'Enter verification code' : 'Login securely with your email')
              : (isLogin ? 'Sign in to your account' : 'Create your account')}
          </p>
        </div>

        {/* Main Toggle (Sign In / Sign Up) - Hide in OTP mode */}
        {!isOtpLogin && (
          <div className="flex justify-center mb-8">
            <div className="bg-gray-50 p-1 rounded-2xl inline-flex w-full border border-charcoal/5">
              <button
                onClick={() => { setIsLogin(true); resetState(); }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-charcoal'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); resetState(); }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-charcoal'}`}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 flex items-center gap-2 border border-red-100">
            <Icons.X className="w-4 h-4" />
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-6 flex items-center gap-2 border border-green-100">
            <Icons.CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Only for Registration) */}
          {!isLogin && !isOtpLogin && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name <span className="text-primary">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-charcoal/5 rounded-2xl p-4 text-charcoal focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300 font-bold"
                placeholder="Enter your name"
                required={!isLogin}
              />
            </div>
          )}

          {/* Email Field (Always visible unless OTP sent) */}
          {(!isOtpLogin || !otpSent) && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address <span className="text-primary">*</span></label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-gray-50 border border-charcoal/5 rounded-2xl p-4 text-charcoal focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300 font-bold ${!email.includes('@') && !otpSent ? 'pr-28' : ''}`}
                  placeholder="email"
                  required
                  disabled={otpSent}
                />
                {!email.includes('@') && !otpSent && (
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 font-black text-xs pointer-events-none select-none italic">
                    @gmail.com
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Password Field (Only for Password Login/Register) */}
          {!isOtpLogin && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Password <span className="text-primary">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-charcoal/5 rounded-2xl p-4 pr-12 text-charcoal focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300 font-bold"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary focus:outline-none transition-colors"
                >
                  {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* OTP Input (Only if OTP sent) */}
          {isOtpLogin && otpSent && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Verification Code <span className="text-primary">*</span></label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-gray-50 border border-primary/20 rounded-2xl p-5 text-charcoal focus:ring-2 focus:ring-primary outline-none text-center tracking-[1em] text-2xl font-black shadow-inner"
                placeholder="000000"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-[10px] font-black text-primary hover:underline mt-2 uppercase tracking-widest"
              >
                Change Email / Resend OTP
              </button>
            </div>
          )}

          <button
            type={isOtpLogin && otpSent ? "button" : "submit"}
            onClick={isOtpLogin && otpSent ? handleVerify : undefined}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                {isOtpLogin
                  ? (otpSent ? 'Verify OTP' : 'Request OTP')
                  : (isLogin ? 'Sign In' : 'Create Account')}
                <Icons.ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* OTP Toggle Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsOtpLogin(!isOtpLogin); resetState(); }}
            className="text-[10px] font-black text-gray-400 hover:text-primary underline transition-colors uppercase tracking-widest"
          >
            {isOtpLogin ? 'Back to password login' : 'Login with OTP'}
          </button>
        </div>

        <CustomAlert
          isOpen={alertState.isOpen}
          onClose={closeAlert}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          confirmText={alertState.confirmText}
          onConfirm={alertState.onConfirm}
          cancelText={alertState.cancelText}
        />
      </div>
    </div>
  );
};