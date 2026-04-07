'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchUsersRequest } from '@/store/slices/userSlice';
import { translations } from '@/utils/translations';
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
  const { users, loading: usersLoading } = useAppSelector(state => state.users);
  const { language } = useAppSelector(state => state.settings);
  const adminT = translations[language].admin;

  useEffect(() => {
    dispatch(fetchTrainingPlansRequest());
    dispatch(fetchUsersRequest());
  }, [dispatch]);

  const chartData = useMemo(() => {
    const planCounts: Record<string, number> = {};
    trainingPlans.forEach(tp => { planCounts[tp.id] = 0; });
    
    // Only count assignments for students, not admins
    const learnerUsers = users.filter(u => u.role !== 'admin');
    
    learnerUsers.forEach(u => {
      u.assignedTrainingPlans?.forEach(tpId => {
        if (planCounts[tpId] !== undefined) planCounts[tpId]++;
      });
    });

    return [...trainingPlans]
      .sort((a, b) => (planCounts[b.id] || 0) - (planCounts[a.id] || 0))
      .slice(0, 5)
      .map(tp => ({
        name: tp.name.length > 20 ? tp.name.substring(0, 17) + '...' : tp.name,
        fullTitle: tp.name,
        assignments: planCounts[tp.id] || 0,
        courses: tp.courseIds?.length || 0
      }));
  }, [trainingPlans, users]);

  if (plansLoading || usersLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (trainingPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
          <Award size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-400">{adminT.noTrainingPathsAvailable}</h2>
        <p className="text-slate-400 mt-2 max-w-sm">
          {adminT.noTrainingPathsAvailableSubtitle}
        </p>
      </div>
    );
  }

  const colors = ['#8B5CF6', '#F43F5E', '#10B981', '#4F46E5', '#F59E0B'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header>
        <div className="flex items-center gap-3 mb-2 text-violet-600 font-bold text-sm uppercase tracking-widest">
            <Award size={20} />
            {adminT.trainingPaths}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">{adminT.topTrainingPlansTitle}</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">{adminT.topTrainingPlansSubtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[350px]">
          <div 
            className="h-[250px] w-full transition-all duration-700 mx-auto"
            style={{ maxWidth: chartData.length === 1 ? '100px' : chartData.length === 2 ? '180px' : chartData.length === 3 ? '260px' : chartData.length === 4 ? '340px' : '420px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                barCategoryGap={10}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                  padding={{ left: 12, right: 12 }}
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
                  itemStyle={{ color: '#8b5cf6', fontWeight: '600', fontSize: '12px' }}
                  formatter={(value: any) => [`${value} ${adminT.assignmentsCount}`, adminT.engagement]}
                />
                <Bar 
                  dataKey="assignments" 
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
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{adminT.leaderboard}</h4>
                <div className="space-y-4">
                    {chartData.map((tp, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}>
                                    {i + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate max-w-[100px]">{tp.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{tp.courses} {adminT.tpCoursesCount}</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-900">{tp.assignments}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
