'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchUsersRequest } from '@/store/slices/userSlice';
import { fetchStaffRolesRequest } from '@/store/slices/staffRoleSlice';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { logoutSuccess } from '@/store/slices/authSlice';
import { hasModuleAccess } from '@/lib/permissions';

/**
 * DataSyncProvider is a non-visual component that ensures 
 * critical data (courses, training plans, and users for admins) 
 * is synchronized in real-time across the entire application.
 * 
 * It dispatches the initial fetch requests which trigger 
 * persistent Firestore listeners (onSnapshot) in the Redux Sagas.
 */
export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, role, permissions } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.uid) {
      // 1. Instant Logout Listener: Monitor own profile for deletion
      const profileRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(profileRef, (doc) => {
        if (!doc.exists()) {
          console.warn('Real-time logout: Profile no longer exists.');
          signOut(auth).then(() => {
            dispatch(logoutSuccess());
          });
        }
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.debug('Profile listener disconnected (permission-denied). This is normal during logout.');
        } else {
          console.error('Real-time logout listener error:', error);
        }
      });

      // 2. Always sync courses for any authenticated user
      dispatch(fetchCoursesRequest());
      
      // 3. Sync training plans for everyone
      dispatch(fetchTrainingPlansRequest());

      // 4. Sync users if the user is an admin OR a staff member with 'users' access OR a teacher
      if (role === 'admin' || role === 'teacher' || (role === 'staff' && hasModuleAccess(permissions as any, 'users'))) {
        dispatch(fetchUsersRequest());
      }

      // 5. Sync staff roles for admin (needed for staff management page)
      if (role === 'admin') {
        dispatch(fetchStaffRolesRequest());
      }

      return () => unsubscribe();
    }
  }, [dispatch, user?.uid, role, permissions.join(',')]);

  return <>{children}</>;
}
