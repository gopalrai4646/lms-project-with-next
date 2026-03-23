import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Language = 'en' | 'de' | 'fr';

interface SettingsState {
  language: Language;
}

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app_language') as Language;
    if (['en', 'de', 'fr'].includes(saved)) return saved;
  }
  return 'en';
};

const initialState: SettingsState = {
  language: getInitialLanguage(),
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
  },
});

export const { setLanguage } = settingsSlice.actions;
export default settingsSlice.reducer;
