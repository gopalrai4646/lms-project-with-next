'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutRequest } from '@/store/slices/authSlice';
import { AUTH_UI } from '@/constants/ui';
import { CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TeacherPendingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, role, loading } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('auth', { returnObjects: true }) as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && (!user || role !== 'teacher')) {
      router.push('/login');
    }
  }, [user, role, loading, router]);

  if (!mounted || loading || !user) {
    return null;
  }

  const isApproved = user.status === 'approved';

  return (
    <div className={AUTH_UI.wrapper}>
      <div className={AUTH_UI.backgroundPattern}></div>
      <div className={AUTH_UI.card}>
        <div className="text-center mb-5">
          <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform">
            <div className={AUTH_UI.logoWrapper}>
              <img 
                src="/logo.png" 
                alt="Mentora" 
                className="h-6 w-auto object-contain" 
              />
            </div>
          </Link>
          
          <div className="flex justify-center mb-6">
            {isApproved ? (
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            )}
          </div>

          <h1 className={AUTH_UI.title}>
            {isApproved ? t?.pending?.accountApproved || "Account Approved!" : t?.pending?.applicationUnderReview || "Application Under Review"}
          </h1>
          
          <p className="text-[14px] text-zinc-500 leading-relaxed mt-4 px-4">
            {isApproved 
              ? t?.pending?.accountApprovedDesc || "Your account has been approved! You are ready to join and start creating courses."
              : t?.pending?.applicationUnderReviewDesc || "Your information has been forwarded to the admin. You will be able to use the platform once your account is approved."}
          </p>
        </div>

        {isApproved && (
          <div className="pt-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className={AUTH_UI.buttonPrimary}
            >
              {t?.pending?.goToDashboard || "Go to Dashboard"}
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <p className={AUTH_UI.footerText}>
            {t?.pending?.wantToUseDifferentAccount || "Want to use a different account?"}
            <button onClick={() => dispatch(logoutRequest())} className={`ml-1.5 bg-transparent border-0 cursor-pointer p-0 ${AUTH_UI.link}`}>{t?.pending?.signOut || "Sign out"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
