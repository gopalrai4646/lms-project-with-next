'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsersRequest } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);

  useEffect(() => {
    dispatch(fetchUsersRequest());
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeCourses = courses.length;
    const totalRevenue = courses.reduce((sum, course) => {
      return sum + (course.price * (course.enrolledUsers?.length || 0));
    }, 0);

    const formattedRevenue = totalRevenue >= 1000 
      ? `$${(totalRevenue / 1000).toFixed(1)}k` 
      : `$${totalRevenue}`;

    return [
      { label: 'Total Users', value: totalUsers.toString(), icon: '👥', color: 'bg-indigo-500' },
      { label: 'Active Courses', value: activeCourses.toString(), icon: '📚', color: 'bg-emerald-500' },
      { label: 'Total Revenue', value: formattedRevenue, icon: '💰', color: 'bg-amber-500' }
    ];
  }, [users, courses]);

  const recentEnrollments = useMemo(() => {
    const all: Array<{ user: string; course: string; date: string; status: string; id: string }> = [];
    users.forEach(user => {
      if (user.enrolledCourses) {
        user.enrolledCourses.forEach(courseId => {
          const course = courses.find(c => c.id === courseId);
          if (course) {
            all.push({
              id: `${user.id}-${courseId}`, // unique composite key for mapping
              user: user.name || user.email,
              course: course.title,
              date: 'Recently', 
              status: 'Success'
            });
          }
        });
      }
    });
    // Reverse to show the most newly processed ones (proxies recent enrollments since we don't store enrollment dates)
    return all.reverse().slice(0, 5);
  }, [users, courses]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Console</h1>
        <p className="text-slate-500 mt-1">Manage users, courses, and system settings.</p>
      </header>

      {/* Grid columns adjusted to 3 since Support Tickets is removed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-slate-100 mb-4`}>
              {stat.icon}
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Recent Enrollments</h2>
            {/* Kept export functionality placeholder */}
            <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-all">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No recent enrollments.</td>
                </tr>
              ) : (
                recentEnrollments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.user}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.course}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
