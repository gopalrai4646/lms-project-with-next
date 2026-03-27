import { call, put, takeLatest, all } from 'redux-saga/effects';
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
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
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
  saveCourseSuccess
} from '../slices/authSlice';
import { enrollUserInCourseSuccess } from '../slices/courseSlice';

function* handleLogin(action: ReturnType<typeof loginRequest>): any {
  try {
    const { email, pass } = action.payload;
    const userCredential: UserCredential = yield call(signInWithEmailAndPassword, auth, email, pass);
    const { uid, email: userEmail, displayName } = userCredential.user;
    
    // Fetch role and course data from Firestore
    const userDoc: any = yield call(getDoc, doc(db, 'users', uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const role = userData.role || null;
    const enrolledCourses = userData.enrolledCourses || [];
    const savedCourses = userData.savedCourses || [];
    
    yield put(authSuccess({ 
      user: { uid, email: userEmail, displayName, enrolledCourses, savedCourses }, 
      role, 
      isNewUser: false 
    }));
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
    const { email, pass, name, role } = action.payload;
    const userCredential: UserCredential = yield call(createUserWithEmailAndPassword, auth, email, pass);
    yield call(updateProfile, userCredential.user, { displayName: name });
    const { uid, email: userEmail } = userCredential.user;
    
    // Save user profile to Firestore
    yield call(setDoc as any, doc(db, 'users', uid), {
      uid,
      email: userEmail,
      displayName: name,
      role,
      createdAt: serverTimestamp(),
    });

    yield put(authSuccess({ 
      user: { uid, email: userEmail, displayName: name, enrolledCourses: [], savedCourses: [] }, 
      role, 
      isNewUser: true 
    }));
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
    
    let role = 'student';
    let enrolledCourses: string[] = [];
    let savedCourses: string[] = [];

    if (isNew) {
      yield call(setDoc as any, doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        role,
        createdAt: serverTimestamp(),
      });
    } else {
      const userDoc: any = yield call(getDoc, doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        role = userData.role || 'student';
        enrolledCourses = userData.enrolledCourses || [];
        savedCourses = userData.savedCourses || [];
      }
    }

    yield put(authSuccess({ 
      user: { uid, email, displayName, enrolledCourses, savedCourses }, 
      role: role as any, 
      isNewUser: isNew 
    }));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleUpdatePassword(action: ReturnType<typeof updatePasswordRequest>): any {
  try {
    const { password } = action.payload;
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
    const { displayName } = action.payload;
    const currentUser: User = auth.currentUser!;
    
    // Update Firebase Auth profile
    yield call(updateProfile, currentUser, { displayName });
    
    // Update Firestore user document
    yield call(setDoc as any, doc(db, 'users', currentUser.uid), { displayName }, { merge: true });
    
    yield put(updateProfileSuccess({ displayName }));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleEnrollCourse(action: ReturnType<typeof enrollCourseRequest>): any {
  try {
    const courseId = action.payload;
    console.log('Saga: Handling enroll course request for:', courseId);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('Saga: No current user found for enrollment');
      yield put(authFailure('You must be logged in to enroll in a course.'));
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    yield call(setDoc as any, userRef, {
      enrolledCourses: arrayUnion(courseId)
    }, { merge: true });
    
    const courseRef = doc(db, 'courses', courseId);
    yield call(setDoc as any, courseRef, {
      enrolledUsers: arrayUnion(currentUser.uid)
    }, { merge: true });
    
    yield put(enrollUserInCourseSuccess({ courseId, userId: currentUser.uid }));
    
    console.log('Saga: Successfully enrolled in course:', courseId);
    yield put(enrollCourseSuccess(courseId));
  } catch (error: any) {
    console.error('Saga: Error enrolling in course:', error.message);
    yield put(authFailure(error.message));
  }
}

function* handleSaveCourse(action: ReturnType<typeof saveCourseRequest>): any {
  try {
    const courseId = action.payload;
    console.log('Saga: Handling save course request for:', courseId);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('Saga: No current user found for saving');
      yield put(authFailure('You must be logged in to save a course.'));
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc: any = yield call(getDoc, userRef);
    const savedCourses = userDoc.exists() ? userDoc.data().savedCourses || [] : [];
    
    const isSaved = savedCourses.includes(courseId);
    
    yield call(setDoc as any, userRef, {
      savedCourses: isSaved ? arrayRemove(courseId) : arrayUnion(courseId)
    }, { merge: true });
    
    console.log('Saga: Successfully toggled save for course:', courseId);
    yield put(saveCourseSuccess(courseId));
  } catch (error: any) {
    console.error('Saga: Error saving course:', error.message);
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
}

export function* authSaga() {
  yield all([watchAuth()]);
}
