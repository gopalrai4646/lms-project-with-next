'use client';

import { useAppSelector } from '@/store/hooks';
import { translations } from '@/utils/translations';

export default function DashboardPage() {
  const { user, isNewUser } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language].dashboard;

  const firstName = user?.displayName?.split(' ')[0] || 'Learner';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isNewUser ? `${t.hello}, ${firstName}! 👋` : `${t.welcome}, ${firstName}! 👋`}
        </h1>
        <p className="text-slate-500 mt-1">{t.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t.stats.inProgress, value: '4', icon: '📚', color: 'bg-blue-500' },
          { label: t.stats.completed, value: '12', icon: '✅', color: 'bg-emerald-500' },
          { label: t.stats.hours, value: '24', icon: '⏱️', color: 'bg-amber-500' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-slate-100`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{t.continue}</h2>
          <button className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">{t.viewAll}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Advanced React Patterns', progress: 65, image: '⚛️', category: 'Development' },
            { title: 'UI/UX Design Essentials', progress: 40, image: '🎨', category: 'Design' }
          ].map((course) => (
            <div key={course.title} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-md transition-all">
              <div className="h-48 bg-slate-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                {course.image}
              </div>
              <div className="p-6">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">{course.category}</span>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{course.title}</h3>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${course.progress}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-slate-600">{course.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
