'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
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
import { Award, TrendingUp, Users } from 'lucide-react';

export default function TopTrainingPlansPage() {
  const dispatch = useAppDispatch();
  const { trainingPlans, loading: plansLoading } = useAppSelector(state => state.trainingPlans);
  const { courses, loading: coursesLoading } = useAppSelector(state => state.courses);
  const { users, loading: usersLoading } = useAppSelector(state => state.users);
  const { t } = useTranslation();
  const adminT = t('admin', { returnObjects: true }) as any;

  useEffect(() => {
    if (trainingPlans.length === 0) dispatch(fetchTrainingPlansRequest());
    if (courses.length === 0) dispatch(fetchCoursesRequest());
    if (users.length === 0) dispatch(fetchUsersRequest());
  }, [dispatch, trainingPlans.length, courses.length, users.length]);

  const chartData = useMemo(() => {
    const planRevenue: Record<string, number> = {};
    const planCounts: Record<string, number> = {};
    
    // Only count assignments for students, not admins
    const learnerUsers = users.filter(u => u.role !== 'admin' && u.role !== 'staff');
    
    trainingPlans.forEach(tp => {
      const planValue = (tp.courseIds || []).reduce((sum, cId) => {
        const course = courses.find(c => c.id === cId);
        return sum + (course?.price || 0);
      }, 0);
      
      const count = learnerUsers.filter(u => u.assignedTrainingPlans?.includes(tp.id)).length;
      planRevenue[tp.id] = planValue * count;
      planCounts[tp.id] = count;
    });

    return [...trainingPlans]
      .sort((a, b) => (planRevenue[b.id] || 0) - (planRevenue[a.id] || 0))
      .slice(0, 5)
      .map(tp => ({
        name: tp.name.length > 15 ? tp.name.substring(0, 12) + '...' : tp.name,
        fullTitle: tp.name,
        revenue: planRevenue[tp.id] || 0,
        assignments: planCounts[tp.id] || 0,
        courses: tp.courseIds?.length || 0
      }));
  }, [trainingPlans, users, courses]);

  const isInitialLoading = (plansLoading || usersLoading || coursesLoading) && (trainingPlans.length === 0 || users.length === 0 || courses.length === 0);

  if (isInitialLoading) {
    return (
      <div className={UI_COMPONENTS.emptyStateCard}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <h3 className={TYPOGRAPHY.h3}>Loading analytics...</h3>
      </div>
    );
  }

  if (trainingPlans.length === 0) {
    return (
      <div className={UI_COMPONENTS.emptyStateCard}>
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100 shadow-sm text-slate-400">
          <Award size={32} />
        </div>
        <h2 className={TYPOGRAPHY.h2}>{adminT.noTrainingPathsAvailable}</h2>
        <p className={`${TYPOGRAPHY.body} mt-2 max-w-sm`}>
          {adminT.noTrainingPathsAvailableSubtitle}
        </p>
      </div>
    );
  }

  const colors = ['#8B5CF6', '#F43F5E', '#10B981', '#4F46E5', '#F59E0B'];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      <header>
        <div className="flex items-center gap-2 mb-3 text-primary-600 font-semibold text-xs uppercase tracking-widest">
            <Award size={16} />
            {adminT.trainingPaths}
        </div>
        <h1 className={TYPOGRAPHY.h1}>{adminT.topTrainingPlansTitle}</h1>
        <p className={`${TYPOGRAPHY.body} mt-1.5 max-w-2xl`}>{adminT.topTrainingPlansSubtitle}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`${UI_COMPONENTS.card} w-full lg:w-1/2 min-h-[350px]`}>
          <div 
            className="h-[320px] w-full transition-all duration-700 mx-auto"
            style={{ maxWidth: chartData.length === 1 ? '100px' : chartData.length === 2 ? '180px' : chartData.length === 3 ? '260px' : chartData.length === 4 ? '340px' : '420px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 40 }}
                barCategoryGap={10}
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
                  tickFormatter={(value) => `$${value}`}
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
                  itemStyle={{ color: '#8b5cf6', fontWeight: '600', fontSize: '12px' }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, adminT.totalRevenue || 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
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
        
        <div className="w-full lg:w-1/2 self-start">
            <div className={UI_COMPONENTS.card}>
                <h4 className={`${TYPOGRAPHY.label} mb-6 flex items-center gap-2`}>
                    <TrendingUp size={14} className="text-primary-500" />
                    {adminT.leaderboard}
                </h4>
                <div className="space-y-3">
                    {chartData.map((tp, i) => (
                        <div key={i} className="flex items-center justify-between group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                            <div className="flex items-center gap-4 overflow-hidden pr-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold text-white shadow-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }}>
                                    {i + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-primary-600 transition-colors">{tp.name}</p>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight whitespace-nowrap">{tp.courses} {adminT.tpCoursesCount}</p>
                                        <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block shrink-0"></span>
                                        <p className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">{tp.assignments} {adminT.enrolledLabel || 'Enrolled'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <span className="text-sm font-bold text-slate-900 block">${tp.revenue.toLocaleString()}</span>
                                <span className="text-[10px] font-semibold text-primary-500 uppercase tracking-widest">{adminT.revenueLabel || 'Revenue'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
