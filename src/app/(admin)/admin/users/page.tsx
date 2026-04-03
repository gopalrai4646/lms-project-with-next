'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsersRequest, User, deleteUserRequest } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import { translations } from '@/utils/translations';

export default function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);
  const { language } = useAppSelector(state => state.settings);
  const t = translations[language].admin;

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = useMemo(() => {
    return selectedUserId ? users.find(u => u.id === selectedUserId) || null : null;
  }, [users, selectedUserId]);

  const itemsPerPage = 8;

  const handleDelete = (userId: string) => {
    if (window.confirm(t.deleteUserConfirm)) {
      dispatch(deleteUserRequest(userId));
    }
  };

  useEffect(() => {
    dispatch(fetchUsersRequest());
    if (courses.length === 0) {
      dispatch(fetchCoursesRequest());
    }
  }, [dispatch, courses.length]);

  const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || t.unknownCourse;

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Exclude admin users from the user management list
      if (user.role === 'admin') return false;

      const matchesSearch = 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCourse = courseFilter === '' || user.enrolledCourses?.includes(courseFilter);

      return matchesSearch && matchesCourse;
    });
  }, [users, searchTerm, courseFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, courseFilter]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t.manageUsers}</h1>
          <p className="text-slate-500 mt-1">{t.manageUsersSubtitle}</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium placeholder:text-slate-400"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
        </div>
        <div className="w-full md:w-64">
          <select 
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-bold text-slate-700 bg-white"
          >
            <option value="">{t.allCourses}</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.userProfile}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.role}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.enrolledCourses}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">{t.loadingUsers}</td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">{t.noUsersFound}</td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name || t.noName}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${user.role === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {user.enrolledCourses.slice(0, 2).map(courseId => (
                            <span key={courseId} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md truncate max-w-[150px] border border-indigo-100/50">
                              {getCourseTitle(courseId)}
                            </span>
                          ))}
                          {user.enrolledCourses.length > 2 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-md cursor-help" title={user.enrolledCourses.slice(2).map(getCourseTitle).join(', ')}>
                              +{user.enrolledCourses.length - 2} {t.more}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">{t.noEnrollments}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedUserId(user.id)}
                          className="px-4 py-2 bg-slate-50/50 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-sm font-bold rounded-xl transition-all shadow-sm"
                        >
                          {t.viewDetails}
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title={t.deleteUser}
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
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500">
            {t.showing} <span className="font-bold text-slate-900">{filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> {t.to} <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> {t.of} <span className="font-bold text-slate-900">{filteredUsers.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              {t.prev}
            </button>
            <div className="flex items-center justify-center min-w-[40px] text-sm font-bold text-slate-900">
              {currentPage} / {totalPages}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              {t.next}
            </button>
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          courses={courses} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  );
}
