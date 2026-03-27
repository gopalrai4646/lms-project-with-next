'use client';

import { User } from '@/store/slices/userSlice';
import { Course } from '@/store/slices/courseSlice';
import { useAppSelector } from '@/store/hooks';
import { translations } from '@/utils/translations';

interface Props {
  user: User;
  courses: Course[];
  onClose: () => void;
}

export default function UserDetailsModal({ user, courses, onClose }: Props) {
  const { language } = useAppSelector(state => state.settings);
  const t = translations[language].admin;

  const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || t.unknownCourse;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">{t.userDetails}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">✕</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user.name || t.noNameProvided}</h3>
              <p className="text-slate-500 font-medium">{user.email}</p>
              <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full ${user.role === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>📚</span> {t.enrolledCourses} ({user.enrolledCourses?.length || 0})
            </h4>
            {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {user.enrolledCourses.map(id => (
                  <li key={id} className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-indigo-700 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 
                    {getCourseTitle(id)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic p-2 bg-white rounded-xl border border-slate-100 border-dashed text-center">{t.noCoursesEnrolled}</p>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>❤️</span> {t.savedCourses} ({user.savedCourses?.length || 0})
            </h4>
            {user.savedCourses && user.savedCourses.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {user.savedCourses.map(id => (
                  <li key={id} className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-rose-600 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span> 
                    {getCourseTitle(id)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic p-2 bg-white rounded-xl border border-slate-100 border-dashed text-center">{t.noCoursesSaved}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
