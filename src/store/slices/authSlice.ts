import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  role: 'student' | 'admin' | null;
  loading: boolean;
  error: string | null;
  isNewUser: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  loading: false,
  error: null,
  isNewUser: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state, _action: PayloadAction<{ email: string; pass: string }>) => {
      state.loading = true;
      state.error = null;
    },
    signupRequest: (state, _action: PayloadAction<{ email: string; pass: string; name: string; role: 'student' | 'admin' }>) => {
      state.loading = true;
      state.error = null;
    },
    googleLoginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateProfileRequest: (state, _action: PayloadAction<{ displayName: string }>) => {
      state.loading = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action: PayloadAction<{ displayName: string }>) => {
      if (state.user) {
        state.user.displayName = action.payload.displayName;
      }
      state.loading = false;
      state.error = null;
    },
    forgotPasswordRequest: (state, _action: PayloadAction<{ email: string }>) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action: PayloadAction<{ user: AuthState['user']; role?: 'student' | 'admin' | null; isNewUser?: boolean }>) => {
      state.user = action.payload.user;
      state.role = action.payload.role ?? null;
      state.isNewUser = action.payload.isNewUser ?? false;
      state.loading = false;
      state.error = null;
    },
    authFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logoutRequest: (state) => {
      state.loading = true;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
});

export const { 
  loginRequest, 
  signupRequest,
  googleLoginRequest,
  updateProfileRequest,
  updateProfileSuccess,
  forgotPasswordRequest, 
  authSuccess, 
  authFailure, 
  logoutRequest, 
  logoutSuccess,
  clearError
} = authSlice.actions;

export default authSlice.reducer;
