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
import { LANDING_UI } from '@/constants/ui';

export type Language = 'en' | 'de' | 'fr';

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string; short: string }[] = [
  { code: 'en', flag: 'https://flagcdn.com/w40/gb.png', label: 'English', short: 'EN' },
  { code: 'de', flag: 'https://flagcdn.com/w40/de.png', label: 'Deutsch', short: 'DE' },
  { code: 'fr', flag: 'https://flagcdn.com/w40/fr.png', label: 'Français', short: 'FR' },
];


export default function LandingPage() {
  const { t, i18n } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use fallback 'en' during SSR and first client render to prevent text hydration mismatch
  const landingT = t('landing', { 
    returnObjects: true, 
    lng: mounted ? i18n.language : 'en' 
  }) as any;

  // Same for the language switcher display
  const currentLang = mounted
    ? LANGUAGE_OPTIONS.find((l) => l.code === i18n.language) || LANGUAGE_OPTIONS[0]
    : LANGUAGE_OPTIONS[0];

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

  useEffect(() => {
    // Strictly prevent horizontal scrolling at the body level to eliminate any side gaps
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = '';
    };
  }, []);

  return (

    <div className={LANDING_UI.wrapper}>
      {/* Navbar - Vercel / Linear inspired floating header */}
      <nav className={LANDING_UI.navWrapper}>
        <div className={LANDING_UI.navContainer}>

          {/* Left: Logo + Language */}
          <div className="flex items-center gap-6 shrink-0">
            <Link
              href="/"
              className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 whitespace-nowrap"
            >
              {landingT.nav.mentora}
            </Link>

            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none"
              >
                <div className="w-4 h-3 relative flex-shrink-0 overflow-hidden rounded-[2px] shadow-sm">
                  <img
                    src={currentLang.flag}
                    alt={currentLang.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="uppercase tracking-wider">{currentLang.short}</span>
                <ChevronDown
                  size={12}
                  className={`text-zinc-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {langOpen && (
                <div className="absolute left-0 mt-1 w-32 bg-white border border-zinc-200/80 rounded-lg shadow-lg overflow-hidden z-[60] py-1">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => handleLanguageChange(opt.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${i18n.language === opt.code
                          ? 'bg-zinc-50 text-zinc-900 font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                        }`}
                    >
                      <span>{opt.short}</span>
                      <div className="w-4 h-3 relative flex-shrink-0 overflow-hidden rounded-[2px] shadow-sm">
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

          {/* Right: Login + Get Started */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors whitespace-nowrap hidden sm:block"
            >
              {landingT.nav.login}
            </Link>
            <Link
              href="/signup"
              className="bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              {landingT.nav.getStarted}
            </Link>
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className={LANDING_UI.heroSection}>
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={LANDING_UI.heroBadge}
          >
            <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
            {landingT.hero.badge}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={LANDING_UI.heroTitle}
          >
            {landingT.hero.title_1} <span className="text-zinc-400 italic font-medium">{landingT.hero.title_with}</span> <br className="hidden lg:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500">{landingT.hero.title_2}</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={LANDING_UI.heroSubtitle}
          >
            {landingT.hero.subtitle}
          </motion.p>
        </div>

        {/* Dashboard Preview - Linear Style */}
        <div className="flex-1 w-full relative group mt-8 lg:mt-0 px-2 sm:px-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-zinc-50 p-2 sm:p-3 shadow-2xl"
          >
            <div className="relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-zinc-100">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop" alt="Mentora Dashboard" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            </div>

            {/* Floating Metric Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="absolute -bottom-6 -left-4 sm:-bottom-8 sm:-left-8 bg-white border border-zinc-200/80 shadow-xl rounded-xl p-4 z-10 flex items-center gap-4 backdrop-blur-xl"
            >
              <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200/50">
                <BarChart3 className="w-5 h-5 text-zinc-900" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{landingT.hero.velocity}</div>
                <div className="text-lg font-bold tracking-tight text-zinc-900">{landingT.hero.accuracy}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - Clean Cards */}
      <section className={LANDING_UI.featuresSection}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 sm:mb-14 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 mb-6 max-w-3xl mx-auto leading-tight">
              {landingT.features.title}
            </h2>
            <p className="text-lg text-zinc-500 font-medium max-w-xl mx-auto leading-relaxed">
              {landingT.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: BarChart3, title: landingT.features.feature_1.title, desc: landingT.features.feature_1.desc },
              { icon: Play, title: landingT.features.feature_2.title, desc: landingT.features.feature_2.desc },
              { icon: FileText, title: landingT.features.feature_3.title, desc: landingT.features.feature_3.desc },
              { icon: ShieldCheck, title: landingT.features.feature_4.title, desc: landingT.features.feature_4.desc }
            ].map((feature, i) => (
              <div key={i} className={LANDING_UI.featureCard}>
                <div className={LANDING_UI.featureIconWrapper}>
                  <feature.icon className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Advantage - Minimal Map/Chips */}
      <section className={LANDING_UI.advantageSection}>
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm backdrop-blur-md">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">{landingT.advantage.title}</h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-12 leading-relaxed font-medium">
            {landingT.advantage.subtitle_1} <span className="text-white font-semibold">{landingT.advantage.subtitle_2}</span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            {landingT.advantage.langs.map((lang: string) => (
              <span key={lang} className={LANDING_UI.advantageChip}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section - Enterprise Dark Mode (Linear Vibe) */}
      <section className={LANDING_UI.securitySection}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium tracking-wide mb-8">
              <ShieldCheck size={14} className="text-zinc-400" /> 
              {landingT.security.badge}
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              {landingT.security.title}
            </h2>
            <p className="text-lg text-zinc-400 mb-10 leading-relaxed font-medium max-w-xl">
              {landingT.security.subtitle}
            </p>
            
            <ul className="space-y-5">
              {[
                { label: landingT.security.zeroTrust },
                { label: landingT.security.automatedScanning }
              ].map(item => (
                <li key={item.label} className="flex items-center gap-4 text-zinc-300 font-medium">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-zinc-300" />
                  </div>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className={LANDING_UI.securityCard}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6 relative z-10">
              <span className="text-white font-medium">{landingT.security.systemStatus}</span>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-2 tracking-wide uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                {landingT.security.secure}
              </span>
            </div>
            <div className="space-y-3 relative z-10">
              {[
                { icon: RefreshCcw, label: landingT.security.updates, status: landingT.security.live },
                { icon: Lock, label: landingT.security.encryption, status: landingT.security.active }
              ].map((row, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl gap-3 sm:gap-4 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                      <row.icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <span className="font-medium text-zinc-200 text-sm">{row.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-md text-center">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className={LANDING_UI.footer}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tight text-zinc-900">{landingT.nav.mentora}</span>
            <span className="text-sm font-medium border-l border-zinc-300 pl-4">{landingT.footer.copyright}</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            <a href="#" className="hover:text-zinc-900 transition-colors">{landingT.footer.terms}</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">{landingT.footer.privacy}</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">{landingT.footer.twitter}</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">{landingT.footer.linkedin}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
