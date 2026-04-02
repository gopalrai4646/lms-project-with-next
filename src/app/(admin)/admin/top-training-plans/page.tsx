'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchUsersRequest } from '@/store/slices/userSlice';
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
        <h2 className="text-2xl font-bold text-slate-400">No training plans available</h2>
        <p className="text-slate-400 mt-2 max-w-sm">
          Create curated learning paths to see performance analytics here.
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
            Training paths
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Top Training Plans</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">This chart summarizes the distribution of learners across your most curated training paths.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[450px]">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '16px'
                  }}
                  formatter={(value: any) => [`${value} assignments`, 'Engagement']}
                />
                <Bar 
                  dataKey="assignments" 
                  radius={[8, 8, 0, 0]} 
                  barSize={60}
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
            <div className="bg-violet-600 rounded-3xl p-6 text-white shadow-lg shadow-violet-100">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-white">
                    <TrendingUp size={20} />
                </div>
                <h3 className="text-lg font-bold mb-1">Growth Index</h3>
                <p className="text-violet-100 text-sm opacity-80 mb-4">Training plans drive 40% higher retention than single course enrollments.</p>
                <div className="text-3xl font-black">
                    {chartData[0]?.assignments || 0} <span className="text-sm font-bold opacity-60">ACTIVE USERS</span>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Leaderboard</h4>
                <div className="space-y-4">
                    {chartData.map((tp, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}>
                                    {i + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate max-w-[100px]">{tp.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{tp.courses} Courses</p>
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
