import { call, put, takeLatest, all, take, fork, cancel, select } from 'redux-saga/effects';
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
  UserCredential
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

// Helper: Create a Firestore listener channel for user data
function createUserChannel(uid: string) {
  return eventChannel(emit => {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
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
          role: data.role || 'student'
        });
      }
    }, (error) => {
      console.error("Firestore listener error:", error);
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
    const userCredential: UserCredential = yield call(signInWithEmailAndPassword, auth, email, pass);
    const { uid, email: userEmail, displayName } = userCredential.user;
    
    // Initial fetch to establish roles and profile
    const userDoc: any = yield call(getDoc, doc(db, 'users', uid));
    if (!userDoc.exists()) {
      yield call(signOut, auth);
      throw new Error('Your account has been deleted by an administrator.');
    }

    const userData = userDoc.data();
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
      role: userData.role || 'student', 
      isNewUser: false 
    }));

    // Start real-time sync
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, uid);

  } catch (error: any) {
    let message = 'An unexpected error occurred. Please try again.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Invalid email or password.';
    } else if (error.code === 'auth/network-request-failed' || error.message.includes('offline')) {
      message = 'Please check your internet connection.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later.';
    }
    yield put(authFailure(message));
  }
}

function* handleSignup(action: ReturnType<typeof signupRequest>): any {
  try {
    const { email, pass, name, role, photoURL, phoneNumber } = action.payload;
    const userCredential: UserCredential = yield call(createUserWithEmailAndPassword, auth, email, pass);
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
    const { uid, email, displayName, metadata } = userCredential.user;
    const isNew = metadata.creationTime === metadata.lastSignInTime;
    
    if (isNew) {
      yield call(setDoc as any, doc(db, 'users', uid), {
        uid, email, displayName, role: 'student', createdAt: serverTimestamp(),
      });
    }

    const userDoc: any = yield call(getDoc, doc(db, 'users', uid));
    const userData = userDoc.data();

    yield put(authSuccess({ 
      user: { 
        uid, email, displayName, 
        enrolledCourses: userData.enrolledCourses || [], 
        savedCourses: userData.savedCourses || [], 
        assignedTrainingPlans: userData.assignedTrainingPlans || [],
        photoURL: userData.photoURL || null,
        phoneNumber: userData.phoneNumber || null
      }, 
      role: userData.role || 'student', 
      isNewUser: isNew 
    }));

    // Start real-time sync
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, uid);

  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleUpdatePassword(action: ReturnType<typeof updatePasswordRequest>): any {
  try {
    const { password } = action.payload;
    const state: any = yield select();
    if (state.auth.isImpersonating) {
      throw new Error('Password updates are disabled while impersonating for security reasons.');
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

    const currentUser: User = auth.currentUser!;
    
    // 1. Update Firebase Auth profile (ONLY if NOT impersonating)
    // We don't want to change the Admin's identity while they are acting as a student
    if (!isImpersonating) {
      const authUpdates: any = { displayName };
      if (photoURL !== undefined) authUpdates.photoURL = photoURL;
      yield call(updateProfile, currentUser, authUpdates);
    }
    
    // 2. Update Firestore user document (Target the user currently in state)
    const firestoreUpdates: any = { displayName };
    if (photoURL !== undefined) firestoreUpdates.photoURL = photoURL;
    if (phoneNumber !== undefined) firestoreUpdates.phoneNumber = phoneNumber;
    
    yield call(setDoc as any, doc(db, 'users', targetUid), firestoreUpdates, { merge: true });
    
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
    if (!targetUid) {
      yield put(authFailure('User context not found.'));
      return;
    }

    const userRef = doc(db, 'users', targetUid);
    yield call(setDoc as any, userRef, {
      enrolledCourses: arrayUnion(courseId)
    }, { merge: true });
    
    const courseRef = doc(db, 'courses', courseId);
    yield call(setDoc as any, courseRef, {
      enrolledUsers: arrayUnion(targetUid)
    }, { merge: true });
    
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
    if (!targetUid) {
      yield put(authFailure('User context not found.'));
      return;
    }

    const userRef = doc(db, 'users', targetUid);
    const userDoc: any = yield call(getDoc, userRef);
    const savedCourses = userDoc.exists() ? userDoc.data().savedCourses || [] : [];
    
    const isSaved = savedCourses.includes(courseId);
    
    yield call(setDoc as any, userRef, {
      savedCourses: isSaved ? arrayRemove(courseId) : arrayUnion(courseId)
    }, { merge: true });
    
    yield put(saveCourseSuccess(courseId));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}
 
function* handleImpersonateUser(action: ReturnType<typeof impersonateUserRequest>): any {
  try {
    const targetUid = action.payload;
    const userDoc: any = yield call(getDoc, doc(db, 'users', targetUid));
    
    if (!userDoc.exists()) {
      throw new Error('User not found in Firestore.');
    }
 
    const userData = userDoc.data();
    const user = {
      uid: targetUid,
      email: userData.email || null,
      displayName: userData.displayName || null,
      enrolledCourses: userData.enrolledCourses || [],
      savedCourses: userData.savedCourses || [],
      assignedTrainingPlans: userData.assignedTrainingPlans || [],
      photoURL: userData.photoURL || null,
      phoneNumber: userData.phoneNumber || null,
    };
 
    yield put(impersonateUserSuccess({ user, role: userData.role || 'student' }));
    
    // Stop the original user's sync and start sync for the impersonated user
    // (This ensures UI updates if someone else modifies the impersonated user's data)
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
