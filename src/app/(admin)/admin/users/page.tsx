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
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const selectedUser = useMemo(() => {
    return selectedUserId ? users.find(u => u.id === selectedUserId) || null : null;
  }, [users, selectedUserId]);

  const handleDelete = (userId: string) => {
    if (window.confirm(t.deleteUserConfirm)) {
      dispatch(deleteUserRequest(userId));
    }
  };

  useEffect(() => {
    setIsMounted(true);
    dispatch(fetchUsersRequest());
    if (courses.length === 0) {
      dispatch(fetchCoursesRequest());
    }
  }, [dispatch, courses.length]);

  const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || t.unknownCourse;

  // 1. Filter users
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, courseFilter, itemsPerPage]);

  // 2. Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (!isMounted) return null;

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

      {/* Toolbar: Search, Course Filter, and Items Per Page */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:flex-1">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="w-full md:w-64 relative">
            <select 
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 text-sm font-bold text-slate-700 bg-white cursor-pointer appearance-none"
            >
              <option value="">{t.allCourses}</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 whitespace-nowrap bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0 w-full lg:w-auto overflow-x-auto">
          <span className="text-sm font-semibold text-slate-500 pl-2">{t.itemsPerPage || "Items per page"}:</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-bold text-slate-700 cursor-pointer"
          >
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
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
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic bg-white flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mx-auto"></div>
                    {t.loadingUsers}
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium italic bg-white">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <span className="text-5xl opacity-50 grayscale">🔍</span>
                      <p className="text-lg text-slate-500 font-semibold">{t.noUsersFound}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user: User) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 border border-indigo-100/50">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name || t.noName}</p>
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
                          {user.enrolledCourses.slice(0, 2).map((courseId: string) => (
                            <span key={courseId} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md truncate max-w-[150px] border border-indigo-100/50">
                              {getCourseTitle(courseId)}
                            </span>
                          ))}
                          {user.enrolledCourses.length > 2 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-md cursor-help border border-slate-200/50" title={user.enrolledCourses.slice(2).map(getCourseTitle).join(', ')}>
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
                          className="px-4 py-2 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-sm font-bold rounded-xl transition-all shadow-sm"
                        >
                          {t.viewDetails}
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
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
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 sm:px-6 rounded-3xl shadow-sm border border-slate-100 mt-6">
          <p className="text-sm text-slate-500 font-medium">
            {t.showing} <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{totalItems === 0 ? 0 : startIndex + 1}</span> {t.to} <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{endIndex}</span> {t.of} <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{totalItems}</span>
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className="px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              ⬅️ <span className="hidden sm:inline">{t.prev}</span>
            </button>
            
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <div key={`ellipsis-${page}`} className="flex items-center gap-1.5">
                        <span className="w-8 text-center text-slate-400 tracking-widest">...</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[40px] h-10 px-2 rounded-xl font-bold transition-all active:scale-95 ${
                            safeCurrentPage === page 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 border border-indigo-700' 
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] h-10 px-2 rounded-xl font-bold transition-all active:scale-95 ${
                        safeCurrentPage === page 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 border border-indigo-700' 
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages || totalPages === 0}
              className="px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
               <span className="hidden sm:inline">{t.next}</span> ➡️
            </button>
          </div>
        </div>
      )}

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
