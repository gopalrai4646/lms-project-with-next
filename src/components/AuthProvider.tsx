'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { useAppDispatch } from '@/store/hooks';
import { authSuccess, logoutSuccess } from '@/store/slices/authSlice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch role from Firestore
          const { doc, getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          const role = userData.role as 'student' | 'admin' || null;

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
            },
            role,
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
