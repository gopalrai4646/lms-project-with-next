'use client';

import { useAppSelector } from '@/store/hooks';
import { translations } from '@/utils/translations';
import { LayoutDashboard, Users, BookOpen, PieChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAppSelector(state => state.auth);
  const { language } = useAppSelector(state => state.settings);
  const t = translations[language].admin;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 flex items-center gap-3">
            Welcome back, {user?.displayName || 'Admin'} 👋
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl max-w-2xl font-medium opacity-90">
            Welcome to your administrative command center. Manage your learners, courses, and track platform performance from one central place.
          </p>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl"></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickLink 
          href="/admin/report" 
          title="Admin Report" 
          description="Detailed platform analytics, DAU tracking, and course performance metrics."
          icon={<PieChart size={24} />}
          color="indigo"
        />
        <QuickLink 
          href="/admin/users" 
          title="Manage Users" 
          description="View, edit, and manage all learners and administrative accounts."
          icon={<Users size={24} />}
          color="emerald"
        />
        <QuickLink 
          href="/admin/courses" 
          title="Manage Courses" 
          description="Create and organize high-quality learning content for your students."
          icon={<BookOpen size={24} />}
          color="amber"
        />
      </div>
    </div>
  );
}

function QuickLink({ href, title, description, icon, color }: { href: string; title: string; description: string; icon: React.ReactNode; color: 'indigo' | 'emerald' | 'amber' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
  };

  return (
    <Link href={href} className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed mb-6 flex-1">
        {description}
      </p>
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
        Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
