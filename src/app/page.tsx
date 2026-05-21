'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Play,
  FileText,
  ShieldCheck,
  Globe,
  RefreshCcw,
  Lock,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'de' | 'fr';

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string; short: string }[] = [
  { code: 'en', flag: 'https://flagcdn.com/w40/gb.png', label: 'English', short: 'EN' },
  { code: 'de', flag: 'https://flagcdn.com/w40/de.png', label: 'Deutsch', short: 'DE' },
  { code: 'fr', flag: 'https://flagcdn.com/w40/fr.png', label: 'Français', short: 'FR' },
];


export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const landingT = t('landing', { returnObjects: true }) as any;
  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === i18n.language) || LANGUAGE_OPTIONS[0];

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  return (

    <div className="min-h-screen bg-[#fafbff] font-manrope">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-1.5 xxs:px-4 sm:px-6 h-16 sm:h-20 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-6">
            <Link href="/" className="text-xl sm:text-2xl font-black text-purple-500 hover:scale-105 transition-transform whitespace-nowrap">
              {landingT.nav.mentora}
            </Link>

            {/* Custom Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 bg-white/80 border border-slate-200 rounded-full px-3 py-1.5 hover:bg-slate-50 transition-all cursor-pointer focus:outline-none"
              >
                <div className="w-5 h-5 relative flex-shrink-0 overflow-hidden rounded-full border border-slate-100">
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
                <div className="absolute left-0 mt-2 w-28 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[60] py-1 animate-in fade-in zoom-in duration-200">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => handleLanguageChange(opt.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[10px] tracking-widest uppercase transition-all ${i18n.language === opt.code
                        ? 'bg-blue-50 text-blue-700 font-extrabold'
                        : 'text-slate-500 hover:bg-slate-50 font-bold'
                        }`}
                    >
                      <span>{opt.short}</span>
                      <div className="w-4 h-3 relative flex-shrink-0 overflow-hidden rounded-sm border border-slate-100">
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
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="text-[10px] xxs:text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-700 transition-colors">
              {landingT.nav.login}
            </Link>
            <Link href="/signup" className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-blue-700 transition-all shrink-0 whitespace-nowrap">
              {landingT.nav.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-8 overflow-x-hidden">
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-5 py-2 rounded-full bg-purple-50 text-purple-600 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-8 border border-purple-100"
          >
            {landingT.hero.badge}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[2.5rem] sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] sm:leading-[1.1] lg:leading-[1.1] mb-6 tracking-tight"
          >
            {landingT.hero.title_1} <span className="text-blue-600 italic border-b-[4px] sm:border-b-[6px] border-blue-100 pb-1 inline-block pr-1">{landingT.hero.title_with}</span> <span className="text-purple-500 block sm:inline mt-2 sm:mt-0">{landingT.hero.title_2}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg lg:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            {landingT.hero.subtitle}
          </motion.p>
        </div>

        {/* Dashboard Preview */}
        <div className="flex-1 w-full relative group mt-8 lg:mt-0 px-2 sm:px-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -top-4 -left-2 sm:-top-10 sm:-left-10 bg-white shadow-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 z-10 flex items-center gap-3 sm:gap-4 animate-bounce-slow border border-slate-100"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{landingT.hero.velocity}</div>
              <div className="text-sm sm:text-lg font-black text-slate-900 drop-shadow-sm">{landingT.hero.accuracy}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-15px_rgba(48,41,80,0.25)] bg-gradient-to-br from-slate-900 to-indigo-950 p-4 sm:p-8 relative"
          >
            {/* Using Unsplash mockup image as replacement for local asset */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 mix-blend-overlay z-10 pointer-events-none" />
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop" alt="Mentora Dashboard" className="object-cover w-full h-full opacity-90 transition-transform duration-700 group-hover:scale-105" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-24 bg-white px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20 px-2">
            <h2
              className="font-black text-slate-900 mb-6 tracking-tight leading-[1.15]"
              style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}
            >
              {landingT.features.title}
            </h2>
            <p className="text-slate-500 font-medium text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">{landingT.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {[
              { icon: BarChart3, title: landingT.features.feature_1.title, desc: landingT.features.feature_1.desc },
              { icon: Play, title: landingT.features.feature_2.title, desc: landingT.features.feature_2.desc },
              { icon: FileText, title: landingT.features.feature_3.title, desc: landingT.features.feature_3.desc },
              { icon: ShieldCheck, title: landingT.features.feature_4.title, desc: landingT.features.feature_4.desc }
            ].map((feature, i) => (
              <div key={i} className="p-8 sm:p-10 rounded-[2.5rem] bg-[#f8fafc] hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-slate-100 group">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100 mb-8 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-slate-700 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-[1.35rem] font-bold text-slate-900 mb-4 leading-tight">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-[15px] font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Advantage */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-blue-50/50 to-white px-4 sm:px-6 relative overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-8 sm:mb-10 shadow-2xl shadow-blue-300">
            <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 sm:mb-8 tracking-tight">{landingT.advantage.title}</h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-10 sm:mb-14 leading-relaxed max-w-3xl mx-auto font-medium">
            {landingT.advantage.subtitle_1} <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">{landingT.advantage.subtitle_2}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {landingT.advantage.langs.map((lang: string) => (
              <span key={lang} className="px-5 py-3 sm:px-6 sm:py-3.5 bg-white border border-slate-100 rounded-full text-slate-700 text-sm sm:text-base font-bold shadow-xl shadow-slate-200/40 hover:scale-105 transition-transform cursor-default">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest mb-6">
              <Lock size={14} className="text-blue-400" /> {landingT.security.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">{landingT.security.title}</h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl">
              {landingT.security.subtitle}
            </p>
            <ul className="space-y-5">
              {[
                { label: landingT.security.zeroTrust },
                { label: landingT.security.automatedScanning }
              ].map(item => (
                <li key={item.label} className="flex items-center gap-4 text-slate-200 font-semibold text-lg">
                  <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center p-1.5 shrink-0">
                    <ShieldCheck className="w-full h-full" />
                  </div>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-700 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-[2.5rem] sm:rounded-[3rem] pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-700 relative z-10">
              <span className="text-white font-bold text-lg">{landingT.security.systemStatus}</span>
              <span className="px-4 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                {landingT.security.secure}
              </span>
            </div>
            <div className="space-y-4 relative z-10">
              {[
                { icon: RefreshCcw, label: landingT.security.updates, status: landingT.security.live },
                { icon: Lock, label: landingT.security.encryption, status: landingT.security.active }
              ].map((row, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-800/80 rounded-2xl border border-slate-700 hover:bg-slate-700/50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <row.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="font-bold text-white tracking-wide text-sm sm:text-base">{row.label}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-full">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#fafbff] border-t border-slate-200 px-6 text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform mb-3">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">{landingT.nav.mentora}.</div>
          </div>
          <div className="text-sm text-slate-500 font-medium">{landingT.footer.copyright}</div>
        </div>
        <div className="flex justify-center gap-8 text-sm font-bold text-slate-400">
          <a href="#" className="hover:text-blue-700 transition-colors">{landingT.footer.terms}</a>
          <a href="#" className="hover:text-blue-700 transition-colors">{landingT.footer.privacy}</a>
          <a href="#" className="hover:text-blue-700 transition-colors">{landingT.footer.twitter}</a>
          <a href="#" className="hover:text-blue-700 transition-colors">{landingT.footer.linkedin}</a>
        </div>
      </footer>
    </div>
  );
}
