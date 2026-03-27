'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest, deleteCourseRequest } from '@/store/slices/courseSlice';
import { translations } from '@/utils/translations';

export default function AdminCoursesPage() {
  const dispatch = useAppDispatch();
  const { courses, loading, error } = useAppSelector((state) => state.courses);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language].admin;

  useEffect(() => {
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      dispatch(deleteCourseRequest(id));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t.manageCoursesTitle}</h1>
          <p className="text-slate-500 mt-1">{t.manageCoursesSubtitle}</p>
        </div>
        <Link 
          href="/admin/courses/new" 
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center gap-2"
        >
          <span>➕</span> {t.newCourse}
        </Link>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.courseInfo}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.instructor}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.price}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.user}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                  {t.loadingCourses}
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                  {t.noCoursesFound}
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-xl">
                        {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : '📚'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{course.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{course.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{course.instructor}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-indigo-600">${course.price}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{course.enrolledUsers?.length || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/courses/edit/${course.id}`}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title={t.editCourse}
                      >
                        ✏️
                      </Link>
                      <button 
                        onClick={() => handleDelete(course.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title={t.deleteCourse}
                      >
                        🗑️
                      </button>
                    </div>
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
