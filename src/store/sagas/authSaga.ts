import { call, put, takeLatest, all, take, fork, cancel, select } from 'redux-saga/effects';
import { ALL_PERMISSIONS, Permission } from '@/lib/permissions';
import { VALIDATION_LIMITS } from '@/constants/validation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail, 
  signOut,
  updateProfile,
  updatePassword,
  User,
  UserCredential,
  getAuth,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { eventChannel } from 'redux-saga';
import { auth, db } from '@/lib/firebase/config';
import { 
  loginRequest, 
  signupRequest,
  googleLoginRequest,
  updateProfileRequest,
  updateProfileSuccess,
  updatePasswordRequest,
  updatePasswordSuccess,
  forgotPasswordRequest, 
  authSuccess, 
  authFailure, 
  logoutRequest, 
  logoutSuccess,
  enrollCourseRequest,
  enrollCourseSuccess,
  saveCourseRequest,
  saveCourseSuccess,
  updateUserData,
  impersonateUserRequest,
  impersonateUserSuccess,
  stopImpersonationRequest,
  stopImpersonationSuccess,
} from '../slices/authSlice';
import { enrollUserInCourseSuccess } from '../slices/courseSlice';
import { clearProgress } from '../slices/progressSlice';
import { clearUsers } from '../slices/userSlice';
import i18n from '@/i18n';

// Helper: Resolve permissions for a user based on their role
function* resolvePermissions(role: string, staffRoleId?: string): any {
  if (role === 'admin') {
    return { permissions: [...ALL_PERMISSIONS] as Permission[], staffRoleName: null };
  }
  if (role === 'staff' && staffRoleId) {
    try {
      const response = yield call(fetch, `/api/admin/roles/get?id=${staffRoleId}`);
      const data = yield call([response, 'json']);
      if (response.ok && data.success) {
        return {
          permissions: (data.role.permissions || []) as Permission[],
          staffRoleName: data.role.name || 'Staff',
        };
      }
    } catch (err) {
      console.error('Error fetching staff role:', err);
    }
  }
  return { permissions: [] as Permission[], staffRoleName: null };
}

// Helper: Create a Firestore listener channel for user data
function createUserChannel(uid: string) {
  return eventChannel(emit => {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const role = data.role || 'student';

        // Resolve permissions for staff users
        let permissions: string[] = [];
        let staffRoleName: string | null = null;

        if (role === 'admin') {
          permissions = [...ALL_PERMISSIONS];
        } else if (role === 'staff' && data.staffRoleId) {
          try {
            const response = await fetch(`/api/admin/roles/get?id=${data.staffRoleId}`);
            const resData = await response.json();
            if (response.ok && resData.success) {
              permissions = resData.role.permissions || [];
              staffRoleName = resData.role.name || 'Staff';
            }
          } catch (err) {
            console.error('Error fetching staff role in sync:', err);
          }
        }

        emit({
          user: {
            uid: uid,
            email: data.email || null,
            displayName: data.displayName || null,
            enrolledCourses: data.enrolledCourses || [],
            savedCourses: data.savedCourses || [],
            assignedTrainingPlans: data.assignedTrainingPlans || [],
            photoURL: data.photoURL || null,
            phoneNumber: data.phoneNumber || null
          },
          role,
          staffRoleId: data.staffRoleId || null,
          staffRoleName,
          permissions,
        });
      }
    }, (error: any) => {
      if (error.code === 'permission-denied') {
        console.debug("Firestore listener disconnected (permission-denied). Normal during logout.");
      } else {
        console.error("Firestore listener error:", error);
      }
    });
  });
}

// Saga: Listen for changes to the user's document
function* syncUserSession(uid: string): any {
  const channel = yield call(createUserChannel, uid);
  try {
    while (true) {
      const data = yield take(channel);
      yield put(updateUserData(data));
    }
  } finally {
    channel.close();
  }
}

// Global variable to track the current sync task so we can cancel it on logout
let userSyncTask: any = null;

function* handleLogin(action: ReturnType<typeof loginRequest>): any {
  try {
    const { email, pass } = action.payload;
    const normalizedEmail = email.toLowerCase();

    // Check if email is banned
    const bannedDoc = yield call(getDoc, doc(db, 'bannedEmails', normalizedEmail));
    if (bannedDoc.exists()) {
      throw new Error('This account has been permanently disabled by an administrator.');
    }

    const userCredential: UserCredential = yield call(signInWithEmailAndPassword, auth, normalizedEmail, pass);
    const { uid, email: userEmail, displayName } = userCredential.user;
    
    // Initial fetch to establish roles and profile
    const userDoc: any = yield call(getDoc, doc(db, 'users', uid));
    if (!userDoc.exists()) {
      yield call(signOut, auth);
      throw new Error('Your account has been deleted by an administrator.');
    }

    const userData = userDoc.data();
    const role = userData.role || 'student';
    const { permissions, staffRoleName }: { permissions: Permission[]; staffRoleName: string | null } = yield call(resolvePermissions, role, userData.staffRoleId);

    yield put(authSuccess({ 
      user: { 
        uid, 
        email: userEmail, 
        displayName, 
        enrolledCourses: userData.enrolledCourses || [], 
        savedCourses: userData.savedCourses || [], 
        assignedTrainingPlans: userData.assignedTrainingPlans || [],
        photoURL: userData.photoURL || null,
        phoneNumber: userData.phoneNumber || null
      }, 
      role, 
      staffRoleId: userData.staffRoleId || null,
      staffRoleName,
      permissions,
      isNewUser: false 
    }));

    // Start real-time sync
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, uid);

  } catch (error: any) {
    let message = 'An unexpected error occurred. Please try again.';
    const errorCode = error?.code || error?.message || 'unknown';
    
    // List of "expected" errors that we don't want to clutter the console with
    const isKnownError = [
      'auth/user-not-found', 
      'auth/wrong-password', 
      'auth/invalid-credential',
      'auth/too-many-requests',
      'auth/user-disabled',
      'auth/email-already-in-use'
    ].includes(errorCode);

    if (!isKnownError) {
      console.error('Unexpected Login Error:', error);
    }
    
    if (errorCode === 'auth/invalid-email') {
      message = 'No email found.';
    } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      message = 'Invalid email or password.';
    } else if (errorCode === 'auth/network-request-failed' || error?.message?.includes('offline')) {
      message = 'Please check your internet connection.';
    } else if (errorCode === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later.';
    } else if (errorCode === 'permission-denied') {
      message = 'Database access denied. Please check your Firestore Security Rules.';
    } else if (error?.message) {
      message = error.message;
    }
    yield put(authFailure(message));
  }
}

function* handleSignup(action: ReturnType<typeof signupRequest>): any {
  try {
    const { email, pass, name, role, photoURL, phoneNumber } = action.payload;
    const normalizedEmail = email.toLowerCase();

    // Backend validation
    const nameLength = name.trim().length;
    if (nameLength < VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH || nameLength > VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH) {
      throw new Error(`Full name must be between ${VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH} and ${VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH} characters.`);
    }
    if (!normalizedEmail.endsWith('@gmail.com')) {
      throw new Error('Email must end with @gmail.com.');
    }
    if (phoneNumber) {
      if (!/^\d{10}$/.test(phoneNumber)) {
        throw new Error(`Phone number must be exactly ${VALIDATION_LIMITS.AUTH.PHONE_LENGTH} digits only.`);
      }
    }

    // Check if email is banned
    const bannedDoc = yield call(getDoc, doc(db, 'bannedEmails', normalizedEmail));
    if (bannedDoc.exists()) {
      throw new Error('This email is banned and cannot be used to create an account.');
    }

    // Security check: Block forced admin signups if one already exists
    if (role === 'admin') {
      const res = yield call(fetch, '/api/auth/check-admin');
      const data = yield call([res, res.json]);
      if (data.adminExists) {
        throw new Error('An admin account already exists. You can only sign up as a student.');
      }
    }

    const userCredential: UserCredential = yield call(createUserWithEmailAndPassword, auth, normalizedEmail, pass);
    yield call(updateProfile, userCredential.user, { displayName: name, photoURL });
    const { uid, email: userEmail } = userCredential.user;
    
    // Save user profile to Firestore
    yield call(setDoc as any, doc(db, 'users', uid), {
      uid,
      email: userEmail,
      displayName: name,
      role,
      photoURL: photoURL || null,
      phoneNumber: phoneNumber || null,
      createdAt: serverTimestamp(),
    });

    yield put(authSuccess({ 
      user: { 
        uid, 
        email: userEmail, 
        displayName: name, 
        enrolledCourses: [], 
        savedCourses: [], 
        assignedTrainingPlans: [],
        photoURL: photoURL || null,
        phoneNumber: phoneNumber || null
      }, 
      role, 
      isNewUser: true 
    }));

    // Start real-time sync
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, uid);

  } catch (error: any) {
    let message = 'Failed to create account. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'This email is already registered.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/network-request-failed' || error.message.includes('offline')) {
      message = 'Please check your internet connection.';
    }
    yield put(authFailure(message));
  }
}

function* handleLogout(): any {
  try {
    yield call(signOut, auth);
    if (userSyncTask) yield cancel(userSyncTask);
    yield put(clearProgress());
    yield put(clearUsers());
    yield put(logoutSuccess());
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleGoogleLogin(): any {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = yield call(signInWithPopup, auth, provider);
    const { uid, email, displayName, photoURL, phoneNumber } = userCredential.user;
    
    // 1. Reliable new user detection
    const additionalInfo = getAdditionalUserInfo(userCredential);
    const isNew = additionalInfo?.isNewUser ?? false;

    // Check if email is banned
    if (email) {
      const normalizedEmail = email.toLowerCase();
      const bannedDoc = yield call(getDoc, doc(db, 'bannedEmails', normalizedEmail));
      if (bannedDoc.exists()) {
        yield call(signOut, auth);
        throw new Error('This Google account has been permanently disabled on this platform.');
      }
    }
    
    // 2. Add full profile data on creation
    if (isNew) {
      yield call(setDoc as any, doc(db, 'users', uid), {
        uid, email, displayName, role: 'student', createdAt: serverTimestamp(),
        photoURL: photoURL || null,
        phoneNumber: phoneNumber || null
      });
    }

    let userDoc: any = yield call(getDoc, doc(db, 'users', uid));
    
    // 3. Fallback if document still doesn't exist
    if (!userDoc.exists()) {
      yield call(setDoc as any, doc(db, 'users', uid), {
        uid, email, displayName, role: 'student', createdAt: serverTimestamp(),
        photoURL: photoURL || null,
        phoneNumber: phoneNumber || null
      });
      userDoc = yield call(getDoc, doc(db, 'users', uid));
    }

    const userData = userDoc.data();
    const role = userData.role || 'student';
    const { permissions, staffRoleName }: { permissions: Permission[]; staffRoleName: string | null } = yield call(resolvePermissions, role, userData.staffRoleId);

    yield put(authSuccess({ 
      user: { 
        uid, email, displayName, 
        enrolledCourses: userData.enrolledCourses || [], 
        savedCourses: userData.savedCourses || [], 
        assignedTrainingPlans: userData.assignedTrainingPlans || [],
        photoURL: userData.photoURL || null,
        phoneNumber: userData.phoneNumber || null
      }, 
      role, 
      staffRoleId: userData.staffRoleId || null,
      staffRoleName,
      permissions,
      isNewUser: isNew 
    }));

    // Start real-time sync
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, uid);

  } catch (error: any) {
    let message = error.message;
    
    // 4. User friendly messages for blocked/closed popups
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Google Login was cancelled. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
      message = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      message = 'Only one login popup is allowed at a time.';
    } else if (error.code === 'auth/unauthorized-domain') {
      message = 'This domain is not authorized for Google Login. Please add it to your Firebase Console settings.';
    } else if (error.code === 'auth/network-request-failed' || error?.message?.includes('offline')) {
      message = 'Please check your internet connection.';
    }

    yield put(authFailure(message));
  }
}

function* handleUpdatePassword(action: ReturnType<typeof updatePasswordRequest>): any {
  try {
    const { password } = action.payload;
    const state: any = yield select();
    if (state.auth.isImpersonating) {
      throw new Error('Password updates are disabled while impersonating for security reasons.');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    
    const currentUser: User = auth.currentUser!;
    yield call(updatePassword, currentUser, password);
    yield put(updatePasswordSuccess());
  } catch (error: any) {
    let message = error.message;
    if (error.code === 'auth/requires-recent-login') {
      message = 'For security reasons, please log out and log back in before changing your password.';
    }
    yield put(authFailure(message));
  }
}

function* handleUpdateProfile(action: ReturnType<typeof updateProfileRequest>): any {
  try {
    const { displayName, photoURL, phoneNumber } = action.payload;
    const state: any = yield select();
    const targetUid = state.auth.user?.uid;
    const isImpersonating = state.auth.isImpersonating;
    
    if (!targetUid) throw new Error('User context not found.');

    // Backend validation
    if (displayName !== undefined) {
      const nameLength = displayName.trim().length;
      if (nameLength < VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH || nameLength > VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH) {
        throw new Error(`Full name must be between ${VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH} and ${VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH} characters.`);
      }
    }
    
    if (phoneNumber) {
      if (!/^\d{10}$/.test(phoneNumber)) {
        throw new Error(`Phone number must be exactly ${VALIDATION_LIMITS.AUTH.PHONE_LENGTH} digits only.`);
      }
    }

    const currentUser: User = auth.currentUser!;
    
    // 1. Update Firebase Auth profile (ONLY if NOT impersonating)
    // We don't want to change the Admin's identity while they are acting as a student
    if (!isImpersonating) {
      const authUpdates: any = { displayName };
      if (photoURL !== undefined) authUpdates.photoURL = photoURL;
      yield call(updateProfile, currentUser, authUpdates);
    }
    
    // 2. Update Firestore user document
    if (isImpersonating) {
      // Use secure API for impersonated users (bypasses direct write restrictions)
      const token = yield call([currentUser, currentUser.getIdToken]);
      const response = yield call(fetch, '/api/admin/users/update-profile', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUid, displayName, photoURL, phoneNumber }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = yield call([response, response.json]);
        throw new Error(errorData.error || 'Failed to update user profile');
      }
    } else {
      // Direct Firestore update for normal students
      const userRef = doc(db, 'users', targetUid);
      const firestoreUpdates: any = { 
        displayName,
        updatedAt: serverTimestamp() 
      };
      if (photoURL !== undefined) firestoreUpdates.photoURL = photoURL;
      if (phoneNumber !== undefined) firestoreUpdates.phoneNumber = phoneNumber;
      yield call(() => updateDoc(userRef, firestoreUpdates));
    }

    yield put(updateProfileSuccess({ 
      displayName, 
      photoURL: photoURL !== undefined ? photoURL : state.auth.user?.photoURL, 
      phoneNumber: phoneNumber !== undefined ? phoneNumber : state.auth.user?.phoneNumber 
    }));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleEnrollCourse(action: ReturnType<typeof enrollCourseRequest>): any {
  try {
    const courseId = action.payload;
    const state: any = yield select();
    const targetUid = state.auth.user?.uid;
    const isImpersonating = state.auth.isImpersonating;

    if (!targetUid) throw new Error('User context not found.');

    if (isImpersonating) {
      // 1. Use secure server-side API if impersonating
      const auth = getAuth();
      const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);
      
      const response = yield call(fetch, '/api/admin/users/enroll-course', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUid, courseId, action: 'enroll' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = yield call([response, response.json]);
        throw new Error(errorData.error || 'Failed to enroll user');
      }
    } else {
      // 2. Direct Firestore update for normal students
      const userRef = doc(db, 'users', targetUid);
      yield call(setDoc as any, userRef, {
        enrolledCourses: arrayUnion(courseId)
      }, { merge: true });
      
      const courseRef = doc(db, 'courses', courseId);
      yield call(setDoc as any, courseRef, {
        enrolledUsers: arrayUnion(targetUid)
      }, { merge: true });
    }
    
    yield put(enrollUserInCourseSuccess({ courseId, userId: targetUid }));
    yield put(enrollCourseSuccess(courseId));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleSaveCourse(action: ReturnType<typeof saveCourseRequest>): any {
  try {
    const courseId = action.payload;
    const state: any = yield select();
    const targetUid = state.auth.user?.uid;
    const isImpersonating = state.auth.isImpersonating;

    if (!targetUid) throw new Error('User context not found.');

    const userRef = doc(db, 'users', targetUid);
    const userDoc: any = yield call(getDoc, userRef);
    const savedCourses = userDoc.exists() ? userDoc.data().savedCourses || [] : [];
    const isSaved = savedCourses.includes(courseId);
    const apiAction = isSaved ? 'unsave' : 'save';

    if (isImpersonating) {
      // 1. Use secure server-side API if impersonating
      const auth = getAuth();
      const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);
      
      const response = yield call(fetch, '/api/admin/users/save-course', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUid, courseId, action: apiAction }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = yield call([response, response.json]);
        throw new Error(errorData.error || 'Failed to update saved courses');
      }
    } else {
      // 2. Direct Firestore update for normal students
      yield call(setDoc as any, userRef, {
        savedCourses: isSaved ? arrayRemove(courseId) : arrayUnion(courseId)
      }, { merge: true });
    }
    
    yield put(saveCourseSuccess(courseId));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}
 
function* handleImpersonateUser(action: ReturnType<typeof impersonateUserRequest>): any {
  try {
    const targetUid = action.payload;
    const auth = getAuth();
    const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);

    if (!token) throw new Error('Not authenticated');

    const response = yield call(fetch, `/api/admin/users/impersonate?uid=${targetUid}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
    });

    const data = yield call([response, response.json]);
    if (!response.ok) {
      throw new Error(data.error || 'Failed to impersonate user');
    }

    yield put(impersonateUserSuccess({ user: data.user, role: data.role }));
    
    // Stop the original user's sync and start sync for the impersonated user
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, targetUid);

  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}
 
function* handleStopImpersonation(): any {
  try {
    // 1. Stop the student's sync task IMMEDIATELY before state changes
    if (userSyncTask) yield cancel(userSyncTask);

    // 2. Dispatch success to restore the admin user state
    yield put(stopImpersonationSuccess());
    
    // 3. Restart sync for the original admin (using auth.currentUser which is still the admin)
    const adminUser = auth.currentUser;
    if (adminUser) {
      userSyncTask = yield fork(syncUserSession, adminUser.uid);
    }
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}
 
function* handleForgotPassword(action: ReturnType<typeof forgotPasswordRequest>): any {
  try {
    const { email } = action.payload;
    auth.languageCode = i18n.language;
    yield call(sendPasswordResetEmail, auth, email);
    yield put(authSuccess({ user: null })); // Clear loading
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

export function* watchAuth() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(signupRequest.type, handleSignup);
  yield takeLatest(logoutRequest.type, handleLogout);
  yield takeLatest(googleLoginRequest.type, handleGoogleLogin);
  yield takeLatest(updateProfileRequest.type, handleUpdateProfile);
  yield takeLatest(updatePasswordRequest.type, handleUpdatePassword);
  yield takeLatest(forgotPasswordRequest.type, handleForgotPassword);
  yield takeLatest(enrollCourseRequest.type, handleEnrollCourse);
  yield takeLatest(saveCourseRequest.type, handleSaveCourse);
  yield takeLatest(impersonateUserRequest.type, handleImpersonateUser);
  yield takeLatest(stopImpersonationRequest.type, handleStopImpersonation);
}

export function* authSaga() {
  yield all([watchAuth()]);
}
