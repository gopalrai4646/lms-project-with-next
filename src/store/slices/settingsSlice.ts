import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Language = 'en' | 'de' | 'fr';

interface SettingsState {
  language: Language;
  isMobileMenuOpen: boolean;
}

const getInitialLanguage = (): Language => {
  // Always return 'en' initially to prevent SSR hydration mismatches.
  // The saved language is restored via a client-side useEffect.
  return 'en';
};

const initialState: SettingsState = {
  language: getInitialLanguage(),
  isMobileMenuOpen: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_language', action.payload);
      }
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },
  },
});

export const { setLanguage, toggleMobileMenu, setMobileMenuOpen } = settingsSlice.actions;
export default settingsSlice.reducer;
