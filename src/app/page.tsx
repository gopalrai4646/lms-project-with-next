'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  BarChart3, 
  Play, 
  FileText, 
  ShieldCheck, 
  Globe, 
  RefreshCcw, 
  Lock 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafbff] font-manrope">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
              Mentora
            </Link>
          </div>
          <Link href="/signup" className="bg-blue-700 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-800 transition-all shadow-md shadow-blue-200">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        <div className="flex-1 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-bold tracking-wide mb-6 shadow-sm border border-purple-100"
          >
            EVOLUTION OF LEARNING
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.15] mb-6"
          >
            Mentora: Master Your Craft <span className="text-blue-700 italic border-b-[6px] border-blue-200/50 pb-1 inline-block">with</span> <span className="text-purple-600">Precision</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-xl leading-relaxed"
          >
            The ultimate high-density platform for professionals. Strategic training meets immersive technology in a digital sanctuary for growth.
          </motion.p>
        </div>

        {/* Dashboard Preview */}
        <div className="flex-1 w-full mx-auto relative group mt-10 lg:mt-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -top-6 -left-6 sm:-top-10 sm:-left-10 bg-white shadow-2xl rounded-3xl p-4 z-10 flex items-center gap-4 animate-bounce-slow border border-slate-100"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current Velocity</div>
              <div className="text-lg font-black text-slate-900 drop-shadow-sm">+128% Accuracy</div>
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
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Precision Engineering for Growth</h2>
            <p className="text-slate-500 font-medium">Designed by scholars, built for performers. Every pixel serves a pedagogical purpose.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time telemetry of your progress. Visualize cognitive retention rates with millisecond precision.' },
              { icon: Play, title: 'Immersive Video Player', desc: 'Powered by Cloudinary for seamless 4K streaming. Adaptive bitrate focus.' },
              { icon: FileText, title: 'Strategic Training Plans', desc: 'AI-curated pathways that adjust to your pace. Evolution as you do.' },
              { icon: ShieldCheck, title: 'Admin Command Center', desc: 'Centralized control for teams. Manage licenses and monitor performance in real-time.' }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-slate-50 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-slate-100 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md shadow-slate-200/50 mb-6 group-hover:scale-110 group-hover:text-blue-600 transition-transform">
                  <feature.icon className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Advantage */}
      <section className="py-32 bg-gradient-to-b from-blue-50/50 to-white px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-20 h-20 bg-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-300">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">Global Advantage</h2>
          <p className="text-lg md:text-xl text-slate-600 mb-14 leading-relaxed max-w-3xl mx-auto font-medium">
            Breaking barriers through linguistic precision. Our platform delivers <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">EN/DE/FR Native Translations</span>, ensuring technical nuances are never lost.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['English (Global)', 'Deutsch (Native)', 'Français (Native)'].map(lang => (
              <span key={lang} className="px-6 py-3.5 bg-white border border-slate-100 rounded-full text-slate-700 font-bold shadow-xl shadow-slate-200/40 hover:scale-105 transition-transform cursor-default">
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
              <Lock size={14} className="text-blue-400" /> Enterprise Grade
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Security by Design</h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl">
              Experience a unified compact layout where performance meets protection. We prioritize your data integrity above all else.
            </p>
            <ul className="space-y-5">
              {['Zero-trust architecture', 'Automated vulnerability scanning'].map(item => (
                <li key={item} className="flex items-center gap-4 text-slate-200 font-semibold text-lg">
                  <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center p-1.5 shrink-0">
                    <ShieldCheck className="w-full h-full" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-700 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-[2.5rem] sm:rounded-[3rem] pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-700 relative z-10">
              <span className="text-white font-bold text-lg">System Status</span>
              <span className="px-4 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                Secure
              </span>
            </div>
            <div className="space-y-4 relative z-10">
              {[
                { icon: RefreshCcw, label: 'Frictionless Updates', status: 'Live' },
                { icon: Lock, label: '256-bit Encryption', status: 'Active' }
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
            <div className="text-2xl font-black bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">Mentora.</div>
          </div>
          <div className="text-sm text-slate-500 font-medium">© 2026 Mentora. The Luminous Scholar.</div>
        </div>
        <div className="flex justify-center gap-8 text-sm font-bold text-slate-400">
          <a href="#" className="hover:text-blue-700 transition-colors">Terms</a>
          <a href="#" className="hover:text-blue-700 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-700 transition-colors">Twitter</a>
          <a href="#" className="hover:text-blue-700 transition-colors">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
}
