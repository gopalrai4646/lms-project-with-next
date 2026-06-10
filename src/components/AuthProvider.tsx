'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { useAppDispatch } from '@/store/hooks';
import { authSuccess, logoutSuccess } from '@/store/slices/authSlice';
import { doc, getDoc } from 'firebase/firestore';
import { ALL_PERMISSIONS } from '@/lib/permissions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch role from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          const role = userData.role as 'student' | 'admin' | 'staff' | 'teacher' || null;

          // If staff, resolve permissions from the staffRoles collection
          let permissions: string[] = [];
          let staffRoleId: string | null = null;
          let staffRoleName: string | null = null;

          if (role === 'admin') {
            // Admin has all permissions
            permissions = [...ALL_PERMISSIONS];
          } else if (role === 'staff' && userData.staffRoleId) {
            staffRoleId = userData.staffRoleId;
            try {
              const response = await fetch(`/api/admin/roles/get?id=${userData.staffRoleId}`);
              const resData = await response.json();
              if (response.ok && resData.success) {
                permissions = resData.role.permissions || [];
                staffRoleName = resData.role.name || 'Staff';
              }
            } catch (err) {
              console.error("Error fetching staff role:", err);
            }
          }

          dispatch(authSuccess({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: userData.photoURL || user.photoURL || null,
              phoneNumber: userData.phoneNumber || null,
              enrolledCourses: userData.enrolledCourses || [],
              savedCourses: userData.savedCourses || [],
              assignedTrainingPlans: userData.assignedTrainingPlans || [],
              status: userData.status,
              teacherProfile: userData.teacherProfile,
            },
            role,
            staffRoleId,
            staffRoleName,
            permissions: permissions as any,
            isNewUser: false,
          }));
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Still sign in the user but without a role for now
          dispatch(authSuccess({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL || null,
              phoneNumber: null,
            },
            role: null,
            isNewUser: false,
          }));
        }
      } else {
        dispatch(logoutSuccess());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}
