'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { forgotPasswordRequest, clearError } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';

import { AUTH_UI } from '@/constants/ui';
import { Key } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('auth', { returnObjects: true }) as any;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return null;
  }

  return (
    <div className={AUTH_UI.wrapper}>
      <div className={AUTH_UI.backgroundPattern}></div>
      <div className={AUTH_UI.card}>
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <div className={AUTH_UI.logoWrapper}>
              <Key className="w-6 h-6 text-zinc-900" />
            </div>
          </Link>
          <h1 className={AUTH_UI.title}>{t.resetPassword}</h1>
          <p className={AUTH_UI.subtitle}>{t.resetSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50/50 border border-rose-200 text-rose-600 text-[13px] font-medium rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {submitted && !error && !loading ? (
          <div className="text-center">
            <div className="mb-8 p-6 bg-emerald-50/50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium">{t.resetSuccess}</p>
            </div>
            <Link href="/login" className={AUTH_UI.buttonPrimary}>
              {t.returnToLogin}
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className={AUTH_UI.label}>{t.email}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={AUTH_UI.input}
                placeholder="name@gmail.com"
              />
            </div>
            <div className="pt-2">
              <button 
                disabled={loading}
                className={AUTH_UI.buttonPrimary}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : t.sendResetLink}
              </button>
            </div>
            <div className="text-center pt-2">
              <Link href="/login" className="text-[13px] text-zinc-500 hover:text-zinc-900 font-bold transition-colors">
                ← {t.backToSignIn}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
