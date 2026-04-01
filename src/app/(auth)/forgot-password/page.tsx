'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { forgotPasswordRequest, clearError } from '@/store/slices/authSlice';
import { translations } from '@/utils/translations';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language].auth;

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(forgotPasswordRequest({ email }));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <img 
              src="/logo.png" 
              alt="Mentora" 
              className="h-14 w-auto object-contain mx-auto" 
            />
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.resetPassword}</h1>
          <p className="text-slate-500">{t.resetSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl">
            {error}
          </div>
        )}

        {submitted && !error && !loading ? (
          <div className="text-center">
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-r-xl">
              {t.resetSuccess}
            </div>
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors underline-offset-4 hover:underline">
              {t.returnToLogin}
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.email}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-slate-50"
                placeholder="name@example.com"
              />
            </div>
            <button 
              disabled={loading}
              className={`w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : t.sendResetLink}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
                {t.backToSignIn}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
