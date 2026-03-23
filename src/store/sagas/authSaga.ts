import { call, put, takeLatest, all } from 'redux-saga/effects';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail, 
  signOut,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { 
  loginRequest, 
  signupRequest,
  googleLoginRequest,
  forgotPasswordRequest, 
  authSuccess, 
  authFailure, 
  logoutRequest, 
  logoutSuccess 
} from '../slices/authSlice';

function* handleLogin(action: ReturnType<typeof loginRequest>): any {
  try {
    const { email, pass } = action.payload;
    const userCredential: UserCredential = yield call(signInWithEmailAndPassword, auth, email, pass);
    const { uid, email: userEmail, displayName } = userCredential.user;
    
    // Fetch role from Firestore
    const userDoc: any = yield call(getDoc, doc(db, 'users', uid));
    const role = userDoc.exists() ? userDoc.data().role : null;
    
    yield put(authSuccess({ user: { uid, email: userEmail, displayName }, role, isNewUser: false }));
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
    yield call(setDoc, doc(db, 'users', uid), {
      uid,
      email: userEmail,
      displayName: name,
      role,
      createdAt: serverTimestamp(),
    });

    yield put(authSuccess({ user: { uid, email: userEmail, displayName: name }, role, isNewUser: true }));
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
    
    let role = null;
    if (isNew) {
      // Default role for Google users is student
      role = 'student';
      yield call(setDoc, doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        role,
        createdAt: serverTimestamp(),
      });
    } else {
      const userDoc: any = yield call(getDoc, doc(db, 'users', uid));
      role = userDoc.exists() ? userDoc.data().role : 'student';
    }

    yield put(authSuccess({ user: { uid, email, displayName }, role, isNewUser: isNew }));
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
  yield takeLatest(forgotPasswordRequest.type, handleForgotPassword);
}

export function* authSaga() {
  yield all([watchAuth()]);
}
