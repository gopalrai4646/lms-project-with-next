'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
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
import { BarChart2, BookOpen, Users } from 'lucide-react';

export default function TopCoursesPage() {
  const dispatch = useAppDispatch();
  const { courses, loading: coursesLoading } = useAppSelector(state => state.courses);
  const { users, loading: usersLoading } = useAppSelector(state => state.users);

  useEffect(() => {
    dispatch(fetchCoursesRequest());
    dispatch(fetchUsersRequest());
  }, [dispatch]);

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

  if (coursesLoading || usersLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
          <BookOpen size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-400">No courses available</h2>
        <p className="text-slate-400 mt-2 max-w-sm">
          Once you create courses and learners enroll, analytic data will appear here.
        </p>
      </div>
    );
  }

  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header>
        <div className="flex items-center gap-3 mb-2 text-indigo-600 font-bold text-sm uppercase tracking-widest">
            <BarChart2 size={20} />
            Analytics
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Top Performing Courses</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">This chart displays the top 5 most popular courses based on total user enrollments across the entire platform.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[350px]">
          <div className="h-[300px] w-full">
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
                    padding: '12px 16px'
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '4px', fontSize: '14px' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: '600', fontSize: '12px' }}
                  formatter={(value: any) => [
                    `${value} students`, 
                    'Enrollments'
                  ]}
                />
                <Bar 
                  dataKey="enrollments" 
                  radius={[8, 8, 0, 0]} 
                  barSize={45}
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
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Top 5</h4>
                <div className="space-y-4">
                    {chartData.map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}>
                                    {i + 1}
                                </div>
                                <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{c.name}</span>
                            </div>
                            <span className="text-sm font-black text-slate-900">{c.enrollments}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
