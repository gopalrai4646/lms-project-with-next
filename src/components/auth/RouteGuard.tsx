'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'student' | 'any';
}

export default function RouteGuard({ children, allowedRole = 'any' }: RouteGuardProps) {
  const { user, role, isImpersonating, loading } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // 1. If NOT logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // 2. Logic for Admin Routes (/admin/**)
    if (pathname.startsWith('/admin')) {
      // Students cannot access admin routes
      if (role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      // Admins who are impersonating should stay in the dashboard
      if (isImpersonating) {
        router.push('/dashboard');
        return;
      }
    }

    // 3. Logic for Dashboard Routes (/dashboard/**)
    if (pathname.startsWith('/dashboard')) {
      // If an Admin is NOT impersonating, they should be in /admin (per "vice-versa" requirement)
      if (role === 'admin' && !isImpersonating) {
        router.push('/admin');
        return;
      }
    }
  }, [user, role, isImpersonating, loading, router, pathname]);

  // Show a loading state while checking auth
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of content if user is logged in but role is wrong (useEffect will handle redirect)
  if (pathname.startsWith('/admin') && (role !== 'admin' || isImpersonating)) return null;
  if (pathname.startsWith('/dashboard') && role === 'admin' && !isImpersonating) return null;

  return <>{children}</>;
}
