'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { translations } from '@/utils/translations';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import CourseCard from '@/components/common/CourseCard';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user, isNewUser } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  const t = translations[language].dashboard;

  useEffect(() => {
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  const firstName = user?.displayName?.split(' ')[0] || 'Learner';

  const enrolledCourses = courses.filter(c => user?.enrolledCourses?.includes(c.id));
  const savedCourses = courses.filter(c => user?.savedCourses?.includes(c.id));
  const discoverCourses = courses.filter(c => !user?.enrolledCourses?.includes(c.id));

  return (
    <div className="space-y-12 pb-12">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isNewUser ? `${t.hello}, ${firstName}! 👋` : `${t.welcome}, ${firstName}! 👋`}
        </h1>
        <p className="text-slate-500 mt-1">{t.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t.stats.inProgress, value: enrolledCourses.length.toString(), icon: '📚', color: 'bg-blue-500' },
          { label: t.savedCourses, value: savedCourses.length.toString(), icon: '❤️', color: 'bg-rose-500' },
          { label: t.stats.hours, value: '24', icon: '⏱️', color: 'bg-amber-500' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
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

      {/* Enrolled Courses */}
      {enrolledCourses.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{t.myCourses}</h2>
            <button className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">{t.viewAll}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Discover Courses */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{t.discover}</h2>
          <button className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">{t.viewAll}</button>
        </div>
        {coursesLoading && courses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 rounded-3xl h-80 animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : discoverCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discoverCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">{t.noNewCourses}</p>
          </div>
        )}
      </section>

      {/* Saved Courses */}
      {savedCourses.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{t.savedCourses}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
