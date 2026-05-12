'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutRequest, stopImpersonationRequest } from '@/store/slices/authSlice';
import { toggleMobileMenu } from '@/store/slices/settingsSlice';
import { useTranslation } from 'react-i18next';

import { Menu, LogOut, ChevronDown, Shield, User, UserSquare2, XCircle } from 'lucide-react';

type Language = 'en' | 'de' | 'fr';

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string; short: string }[] = [
  { code: 'en', flag: 'https://flagcdn.com/w40/gb.png', label: 'English', short: 'EN' },
  { code: 'de', flag: 'https://flagcdn.com/w40/de.png', label: 'Deutsch', short: 'DE' },
  { code: 'fr', flag: 'https://flagcdn.com/w40/fr.png', label: 'Français', short: 'FR' },
];

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user, role, isImpersonating, staffRoleName } = useAppSelector((state) => state.auth);
  const { t, i18n } = useTranslation();
  
  const navT = t('nav', { returnObjects: true }) as any;
  const adminT = t('admin', { returnObjects: true }) as any;
  const router = useRouter();

  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutRequest());
    router.push('/login');
  };

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === i18n.language) || LANGUAGE_OPTIONS[0];

  const handleStopImpersonation = () => {
    dispatch(stopImpersonationRequest());
    router.push('/admin/users');
  };

  return (
    <>
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 h-10 bg-indigo-600 text-white z-[60] flex items-center justify-center px-4 shadow-md">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-black uppercase tracking-widest">
            <UserSquare2 size={16} className="animate-pulse" />
            <span>{adminT.impersonating}: <span className="underline decoration-2 underline-offset-4">{user?.displayName || user?.email}</span></span>
            <button 
              onClick={handleStopImpersonation}
              className="ml-4 px-3 py-1 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <XCircle size={14} />
              <span className="hidden sm:inline">{adminT.stopImpersonation}</span>
            </button>
          </div>
        </div>
      )}
      <nav className={`fixed ${isImpersonating ? 'top-10' : 'top-0'} left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-2 sm:px-4 md:px-6 shadow-sm transition-all duration-300`}>
      <div className="flex items-center gap-1 sm:gap-4">
        {user && (
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu size={22} />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="Mentora"
            className="h-10 sm:h-12 md:h-14 w-auto object-contain group-hover:scale-105 transition-transform"
          />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">

        {/* Custom Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            id="language-switcher-btn"
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <span className="hidden xs:inline text-[10px] sm:text-xs font-extrabold tracking-widest text-slate-500 uppercase">{currentLang.short}</span>
            <div className="w-5 h-3.5 relative flex-shrink-0 overflow-hidden rounded-sm shadow-sm border border-slate-100">
              <img
                src={currentLang.flag}
                alt={currentLang.label}
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {langOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-[60] py-1">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  id={`lang-option-${opt.code}`}
                  onClick={() => handleLanguageChange(opt.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs tracking-widest uppercase transition-all ${i18n.language === opt.code
                      ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                      : 'text-slate-500 hover:bg-slate-50 font-bold'
                    }`}
                >
                  <span>{opt.short}</span>
                  <div className="w-5 h-3.5 relative flex-shrink-0 overflow-hidden rounded-sm shadow-sm border border-slate-100">
                    <img
                      src={opt.flag}
                      alt={opt.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Name */}
            <span className="hidden lg:block text-sm font-bold text-slate-700 max-w-[120px] truncate">
              {user.displayName || "User"}
            </span>

            {/* Profile Avatar (clickable - replaces gear icon) */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen(!userOpen)}
                className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 transition-all duration-300 focus:outline-none ${userOpen
                    ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg shadow-indigo-100'
                    : 'ring-1 ring-slate-200 hover:ring-2 hover:ring-indigo-300 hover:ring-offset-1'
                  }`}
                title="Account settings"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold text-sm">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>

              {/* User Settings Dropdown */}
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden z-[60] py-1">
                  {/* User Email */}
                  <div className="px-3.5 py-1.5 border-b border-slate-50">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Signed in as</p>
                    <p className="text-xs font-medium text-slate-600 truncate">{user.email}</p>
                  </div>

                  {/* Role Display */}
                  <div className="px-3.5 py-1 flex items-center gap-2.5 text-slate-600">
                    <div className="w-8 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Shield size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Current Role</p>
                      <p className="text-xs font-bold text-slate-700 capitalize">{role === 'staff' && staffRoleName ? staffRoleName : role}</p>
                    </div>
                  </div>

                  {/* Profile Link */}
                  <Link
                    href="/settings"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <div className="w-8 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                      <User size={14} />
                    </div>
                    <span>Profile Section</span>
                  </Link>

                  <div className="px-2 border-t border-slate-50 pt-0.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <div className="w-8 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                        <LogOut size={14} />
                      </div>
                      <span>{navT.signOut}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <Link href="/login" className="px-2 sm:px-4 py-2 text-slate-600 hover:text-indigo-600 transition-all font-bold text-xs sm:text-sm whitespace-nowrap">{navT.signIn}</Link>
            <Link href="/signup" className="hidden sm:block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-md shadow-indigo-100 whitespace-nowrap">{navT.getStarted}</Link>
            <Link href="/signup" className="sm:hidden px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-xs shadow-md shadow-indigo-100 whitespace-nowrap">{navT.join || "Join"}</Link>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}

