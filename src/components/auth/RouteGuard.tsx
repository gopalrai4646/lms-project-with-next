'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { getPermissionForRoute, getFirstAllowedRoute, hasModuleAccess } from '@/lib/permissions';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'student' | 'staff' | 'admin_or_staff' | 'any';
}

export default function RouteGuard({ children, allowedRole = 'any' }: RouteGuardProps) {
  const { user, role, isImpersonating, loading, permissions } = useAppSelector((state) => state.auth);
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
      // Only admin and staff can access admin routes
      if (role !== 'admin' && role !== 'staff') {
        router.push('/dashboard');
        return;
      }

      // Admins who are impersonating should stay in the dashboard
      if (isImpersonating) {
        router.push('/dashboard');
        return;
      }

      // Staff-specific permission checks
      if (role === 'staff') {
        // Staff cannot access /admin/staff (staff management is admin-only)
        if (pathname === '/admin/staff' || pathname.startsWith('/admin/staff/')) {
          const firstAllowed = getFirstAllowedRoute(permissions);
          router.push(firstAllowed);
          return;
        }

        // Check if staff has permission for this specific route
        const requiredModule = getPermissionForRoute(pathname);
        if (requiredModule && !hasModuleAccess(permissions, requiredModule)) {
          // Redirect to first allowed route
          const firstAllowed = getFirstAllowedRoute(permissions);
          router.push(firstAllowed);
          return;
        }
      }
    }

    // 3. Logic for Dashboard Routes (/dashboard/**)
    if (pathname.startsWith('/dashboard')) {
      // If an Admin is NOT impersonating, they should be in /admin
      if (role === 'admin' && !isImpersonating) {
        router.push('/admin');
        return;
      }
      // Staff (not impersonating) should be in /admin
      if (role === 'staff' && !isImpersonating) {
        const firstAllowed = getFirstAllowedRoute(permissions);
        router.push(firstAllowed);
        return;
      }
      // Teacher should be in /teacher/dashboard or /teacher/pending
      if (role === 'teacher') {
        // Allow teachers to view course players and assigned courses
        if (pathname.startsWith('/dashboard/courses')) {
          return; // Let them stay
        }

        if (user.status === 'pending') {
          router.push('/teacher/pending');
        } else {
          router.push('/teacher/dashboard');
        }
        return;
      }
    }

    // 4. Logic for Teacher Routes (/teacher/**)
    if (pathname.startsWith('/teacher') && pathname !== '/teacher/pending') {
      if (role !== 'teacher') {
        router.push('/dashboard');
        return;
      }

      if (user.status === 'pending') {
        router.push('/teacher/pending');
        return;
      }
    }
  }, [user, role, isImpersonating, loading, router, pathname, permissions]);

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

  // If we're redirecting, don't render children to prevent flash of content
  if (
    (pathname.startsWith('/admin') && role !== 'admin' && role !== 'staff') ||
    (pathname.startsWith('/dashboard') && role === 'admin' && !isImpersonating) ||
    (pathname.startsWith('/dashboard') && role === 'staff' && !isImpersonating) ||
    (pathname.startsWith('/dashboard') && role === 'teacher' && !pathname.startsWith('/dashboard/courses')) ||
    (pathname.startsWith('/teacher') && role !== 'teacher') ||
    (pathname.startsWith('/teacher') && user.status === 'pending' && pathname !== '/teacher/pending') ||
    (pathname.startsWith('/dashboard') && role === 'teacher' && user.status === 'pending')
  ) {
    return null;
  }

  return <>{children}</>;
}
