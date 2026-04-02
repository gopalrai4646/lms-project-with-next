'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsersRequest } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { translations } from '@/utils/translations';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  DollarSign, 
  BarChart2, 
  Award,
  ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);
  const { trainingPlans } = useAppSelector(state => state.trainingPlans);
  const { user } = useAppSelector(state => state.auth);
  const { language } = useAppSelector(state => state.settings);
  const t = translations[language].admin;

  useEffect(() => {
    dispatch(fetchUsersRequest());
    dispatch(fetchCoursesRequest());
    dispatch(fetchTrainingPlansRequest());
  }, [dispatch]);

  const stats = useMemo(() => {
    // 1. Total Users
    const totalUsers = users.length;

    // 2. Total Courses
    const totalCourses = courses.length;

    // 3. Total Training Plans
    const totalPlans = trainingPlans.length;

    // 4. Total Revenue (Sum of course.price * enrollment count)
    const totalRevenue = courses.reduce((sum, course) => {
      const enrollments = course.enrolledUsers?.length || 0;
      return sum + (course.price * enrollments);
    }, 0);

    // 5. Top Training Plans (Count assignments in users)
    const planCounts: Record<string, number> = {};
    trainingPlans.forEach(tp => { planCounts[tp.id] = 0; });
    users.forEach(u => {
      u.assignedTrainingPlans?.forEach(tpId => {
        if (planCounts[tpId] !== undefined) planCounts[tpId]++;
      });
    });
    const sortedPlans = [...trainingPlans].sort((a, b) => (planCounts[b.id] || 0) - (planCounts[a.id] || 0));
    const topPlanName = sortedPlans[0]?.name || 'None';

    // 6. Top Courses (Enrolled count)
    const sortedCourses = [...courses].sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0));
    const topCourseName = sortedCourses[0]?.title || 'None';

    return {
      totalUsers,
      totalCourses,
      totalPlans,
      totalRevenue,
      topPlanName,
      topCourseName
    };
  }, [users, courses, trainingPlans]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            Admin Performance Overview
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl opacity-90">
            Welcome back, {user?.displayName || 'Admin'}. Here is how your platform is performing today.
          </p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnalyticsCard 
          href="/admin/users"
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          subtext="+5.2% from last month"
          icon={<Users size={24} />}
          color="indigo"
        />
        <AnalyticsCard 
          href="/admin/courses"
          title="Total Courses"
          value={stats.totalCourses.toLocaleString()}
          subtext="Active learning modules"
          icon={<BookOpen size={24} />}
          color="emerald"
        />
        <AnalyticsCard 
          href="/admin/training-plans"
          title="Total Training Plans"
          value={stats.totalPlans.toLocaleString()}
          subtext="Curated paths"
          icon={<Award size={24} />}
          color="amber"
        />
        <AnalyticsCard 
          href="/admin/report"
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtext="Lifetime platform income"
          icon={<DollarSign size={24} />}
          color="rose"
        />
        <AnalyticsCard 
          href="/admin/top-training-plans"
          title="Top Training Plans"
          value={stats.topPlanName}
          subtext="Most assigned path"
          icon={<GraduationCap size={24} />}
          color="violet"
        />
        <AnalyticsCard 
          href="/admin/top-courses"
          title="Top Courses"
          value={stats.topCourseName}
          subtext="Highest enrollment"
          icon={<BarChart2 size={24} />}
          color="sky"
        />
      </div>
    </div>
  );
}

interface AnalyticsCardProps {
  href: string;
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';
}

function AnalyticsCard({ href, title, value, subtext, icon, color }: AnalyticsCardProps) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600'
  };

  return (
    <Link 
      href={href} 
      className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all text-slate-400">
          <ArrowUpRight size={20} />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
        <div className="text-2xl font-black text-slate-900 truncate" title={String(value)}>
          {value}
        </div>
        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
          {subtext}
        </p>
      </div>
    </Link>
  );
}
