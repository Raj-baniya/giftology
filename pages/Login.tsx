import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/ui/Icons';
import { sendWelcomeEmail } from '../services/emailService';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpLogin, setIsOtpLogin] = useState(false); // New state for OTP Login mode
  const [otpSent, setOtpSent] = useState(false); // New state for OTP sent status

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(''); // New state for OTP input

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, login, register, loginWithOtp, verifyOtp } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [pendingSignup, setPendingSignup] = useState<{ name: string, email: string, password: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isOtpLogin) {
        // OTP Flow (Login or Signup Verification)
        if (!otpSent) {
          // Send OTP
          const { error } = await loginWithOtp(email);
          if (error) {
            console.error('OTP Send Error:', error);
            throw new Error(typeof error === 'string' ? error : (error.message || JSON.stringify(error)));
          }
          setOtpSent(true);
          setMessage(`OTP sent to ${email}. Please check your inbox.`);
        } else {
          // Verify OTP
          const { error } = await verifyOtp(email, otp);
          if (error) throw error;

          // If this was a signup verification
          if (pendingSignup) {
            const { error: regError } = await register(pendingSignup.name, pendingSignup.email, pendingSignup.password);
            if (regError) {
              console.error("Registration error after OTP:", regError);
              // If registration failed but we verified OTP, we might still want to send the welcome email
              // if it was a "User already registered" error, maybe not?
              // But if the user THINKS they are signing up, getting a welcome email is nice.
              // Let's force send it here just in case register() didn't do it because of the error.
              sendWelcomeEmail(pendingSignup.name, pendingSignup.email);
            }
          }

          // Success handled by AuthContext updating user
        }
      } else if (isLogin) {
        // Password Login
        const { error } = await login(email, password);
        if (error) throw error;
      } else {
        // Registration - Initiate OTP Verification
        setPendingSignup({ name, email, password });

        // Send OTP first
        const { error } = await loginWithOtp(email);
        if (error) throw error;

        // Switch to OTP mode
        setIsOtpLogin(true);
        setOtpSent(true);
        setMessage(`OTP sent to ${email}. Please verify your email to complete registration.`);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
      // Reset pending signup on error if needed
      if (!isOtpLogin) setPendingSignup(null);
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
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-textMain mb-2">
            {isOtpLogin ? 'Login with OTP' : (isLogin ? 'Welcome Back' : 'Join Giftology')}
          </h1>
          <p className="text-textMuted">
            {isOtpLogin
              ? (otpSent ? 'Enter the code sent to your email' : 'Sign in without a password')
              : (isLogin ? 'Sign in to access your account' : 'Create an account to start gifting')}
          </p>
        </div>

        {/* Main Toggle (Sign In / Sign Up) - Hide in OTP mode */}
        {!isOtpLogin && (
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex w-full">
              <button
                onClick={() => { setIsLogin(true); resetState(); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${isLogin ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); resetState(); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isLogin ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <Icons.X className="w-4 h-4" />
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <Icons.CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Only for Registration) */}
          {!isLogin && !isOtpLogin && (
            <div>
              <label className="block text-sm font-bold mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="John Doe"
                required={!isLogin}
              />
            </div>
          )}

          {/* Email Field (Always visible unless OTP sent) */}
          {(!isOtpLogin || !otpSent) && (
            <div>
              <label className="block text-sm font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="you@example.com"
                required
                disabled={otpSent}
              />
            </div>
          )}

          {/* Password Field (Only for Password Login/Register) */}
          {!isOtpLogin && (
            <div>
              <label className="block text-sm font-bold mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          {/* OTP Input (Only if OTP sent) */}
          {isOtpLogin && otpSent && (
            <div>
              <label className="block text-sm font-bold mb-1">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none text-center tracking-widest text-lg"
                placeholder="123456"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-xs text-primary hover:underline mt-2"
              >
                Change Email / Resend
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                {isOtpLogin
                  ? (otpSent ? 'Verify & Login' : 'Send OTP')
                  : (isLogin ? 'Sign In' : 'Create Account')}
                <Icons.ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* OTP Toggle Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsOtpLogin(!isOtpLogin); resetState(); }}
            className="text-sm font-medium text-gray-600 hover:text-black underline transition-colors"
          >
            {isOtpLogin ? 'Back to Password Login' : 'Login with OTP'}
          </button>
        </div>

      </div>
    </div>
  );
};