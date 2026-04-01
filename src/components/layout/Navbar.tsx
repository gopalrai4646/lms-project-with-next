'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutRequest } from '@/store/slices/authSlice';
import { setLanguage, Language, toggleMobileMenu } from '@/store/slices/settingsSlice';
import { translations } from '@/utils/translations';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language].nav;
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && ['en', 'de', 'fr'].includes(savedLang) && savedLang !== language) {
      dispatch(setLanguage(savedLang));
    }
  }, [dispatch, language]);

  const handleLogout = () => {
    dispatch(logoutRequest());
    router.push('/login');
  };

  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        {user && (
          <button 
            onClick={() => dispatch(toggleMobileMenu())}
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 group">
          <img 
            src="/logo.png" 
            alt="Mentora" 
            className="h-14 w-auto object-contain group-hover:scale-105 transition-transform" 
          />
        </Link>
       
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        
        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <select 
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-4 py-2 outline-none cursor-pointer hover:bg-slate-100 transition-all"
          >
            <option value="en">🇺🇸 English</option>
            <option value="de">🇩🇪 German</option>
            <option value="fr">🇫🇷 French</option>
          </select>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-700 hidden lg:block">
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
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login" className="px-4 py-2 text-slate-600 hover:text-indigo-600 transition-all font-bold text-sm">{t.signIn}</Link>
            <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-md shadow-indigo-100">{t.getStarted}</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
