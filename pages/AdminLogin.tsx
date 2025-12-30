import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/ui/Icons';
import { supabase } from '../services/supabaseClient';

export const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Email Normalization
    let finalEmail = email.trim();
    if (finalEmail && !finalEmail.includes('@')) {
      finalEmail += '@gmail.com';
      setEmail(finalEmail);
    }

    // 1. Try Supabase Auth FIRST (Preferred)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: password,
      });

      if (!authError && data.user) {
        console.log('✅ Supabase Admin Auth Success');
        navigate('/admin');
        return;
      }

      // If error is not "Invalid login credentials", it might be a connectivity issue
      if (authError && authError.message !== 'Invalid login credentials') {
        console.warn('⚠️ Supabase Auth Error:', authError.message);
      }
    } catch (err: any) {
      console.warn('⚠️ Supabase Auth exception:', err.message);
    }

    // 2. Fallback Mechanism (Only if Supabase fails or credentials match fallback)
    const ALLOWED_EMAILS = ['giftology.in01@gmail.com', 'giftology.in02@gmail.com', 'giftology.in14@gmail.com', 'rajbaniya81083@gmail.com'];
    const ADMIN_PASS = 'Giftology.in@giftstore';

    if (ALLOWED_EMAILS.includes(finalEmail) && password === ADMIN_PASS) {
      console.log('🛡️ Entering via Fallback Auth');
      sessionStorage.setItem('giftology_admin_auth', 'true');
      navigate('/admin');
      return;
    }

    setError('Invalid credentials. Please check your email and password.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-red-500">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-3 rounded-full">
            <Icons.Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h2 className="font-serif text-3xl font-bold text-center mb-2 text-gray-900">
          Admin Portal
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Restricted access. Authorized personnel only.
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none transition-all bg-white text-gray-900"
              required
              placeholder="giftology.in01@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none transition-all bg-white text-gray-900"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/30"
          >
            Access Dashboard
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/login')} className="text-sm text-gray-400 hover:text-gray-600">
            Back to Customer Login
          </button>
        </div>
      </div>
    </div>
  );
};