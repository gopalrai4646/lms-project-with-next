'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchUsersRequest } from '@/store/slices/userSlice';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, UI_COMPONENTS } from '@/constants/ui';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BarChart2, BookOpen, Users } from 'lucide-react';

export default function TopCoursesPage() {
  const dispatch = useAppDispatch();
  const { courses, loading: coursesLoading } = useAppSelector(state => state.courses);
  const { users, loading: usersLoading } = useAppSelector(state => state.users);
  const { t } = useTranslation();
  const adminT = t('admin', { returnObjects: true }) as any;

  useEffect(() => {
    if (courses.length === 0) dispatch(fetchCoursesRequest());
    if (users.length === 0) dispatch(fetchUsersRequest());
  }, [dispatch, courses.length, users.length]);

  const chartData = useMemo(() => {
    const learnerIds = new Set(users.filter(u => u.role !== 'admin').map(u => u.id));

    return [...courses]
      .map(c => ({
        ...c,
        learnerEnrollmentCount: c.enrolledUsers?.filter(id => learnerIds.has(id)).length || 0
      }))
      .sort((a, b) => b.learnerEnrollmentCount - a.learnerEnrollmentCount)
      .slice(0, 5)
      .map(c => ({
        name: c.title.length > 20 ? c.title.substring(0, 17) + '...' : c.title,
        fullTitle: c.title,
        enrollments: c.learnerEnrollmentCount,
        price: c.price
      }));
  }, [courses, users]);

  const isInitialLoading = (coursesLoading || usersLoading) && (courses.length === 0 || users.length === 0);

  if (isInitialLoading) {
    return (
      <div className={UI_COMPONENTS.emptyStateCard}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <h3 className={TYPOGRAPHY.h3}>Loading analytics...</h3>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={UI_COMPONENTS.emptyStateCard}>
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100 shadow-sm text-slate-400">
          <BookOpen size={32} />
        </div>
        <h2 className={TYPOGRAPHY.h2}>{adminT.noCoursesAvailable}</h2>
        <p className={`${TYPOGRAPHY.body} mt-2 max-w-sm`}>
          {adminT.noCoursesAvailableSubtitle}
        </p>
      </div>
    );
  }

  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      <header>
        <div className="flex items-center gap-2 mb-3 text-primary-600 font-semibold text-xs uppercase tracking-widest">
            <BarChart2 size={16} />
            {adminT.analytics}
        </div>
        <h1 className={TYPOGRAPHY.h1}>{adminT.topPerformingCourses}</h1>
        <p className={`${TYPOGRAPHY.body} mt-1.5 max-w-2xl`}>{adminT.topCoursesSubtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`${UI_COMPONENTS.card} lg:col-span-3 min-h-[350px]`}>
          <div 
            className="h-[320px] w-full transition-all duration-700 mx-auto"
            style={{ maxWidth: chartData.length === 1 ? '100px' : chartData.length === 2 ? '180px' : chartData.length === 3 ? '260px' : chartData.length === 4 ? '340px' : '420px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                barCategoryGap={16}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={90}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '4px', fontSize: '14px' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: '600', fontSize: '12px' }}
                  formatter={(value: any) => [
                    `${value} ${adminT.studentsCount}`, 
                    adminT.enrollments
                  ]}
                />
                <Bar 
                  dataKey="enrollments" 
                  radius={[5, 5, 0, 0]} 
                  barSize={24}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
            <div className={UI_COMPONENTS.card}>
                <h4 className={`${TYPOGRAPHY.label} mb-5`}>{adminT.currentTop5}</h4>
                <div className="space-y-3">
                    {chartData.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden pr-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }}>
                                    {i + 1}
                                </div>
                                <span className="text-sm font-semibold text-slate-700 truncate">{c.name}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 shrink-0 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{c.enrollments}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
