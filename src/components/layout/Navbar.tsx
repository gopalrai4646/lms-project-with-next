'use client';

import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutRequest } from '@/store/slices/authSlice';
import { setLanguage, Language } from '@/store/slices/settingsSlice';
import { translations } from '@/utils/translations';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language].nav;

  const handleLogout = () => {
    dispatch(logoutRequest());
  };

  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6 shadow-sm backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl leading-none">L</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
            LMS Portal
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium text-sm">{t.dashboard}</Link>
          <Link href="/courses" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium text-sm">{t.courses}</Link>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
        
        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <select 
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-all"
          >
            <option value="en">🇺🇸 English</option>
            <option value="de">🇩🇪 German</option>
            <option value="fr">🇫🇷 French</option>
          </select>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-700 hidden lg:block">
              {user.displayName || user.email}
            </span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm"
            >
              {t.signOut}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-4 py-2 text-slate-600 hover:text-indigo-600 transition-all font-bold text-sm">{t.signIn}</Link>
            <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-md shadow-indigo-100">{t.getStarted}</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
