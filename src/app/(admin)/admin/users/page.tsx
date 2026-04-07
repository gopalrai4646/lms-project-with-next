'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsersRequest, User, deleteUserRequest } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { impersonateUserRequest } from '@/store/slices/authSlice';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import { useTranslation } from 'react-i18next';
import { Search, List, LayoutGrid, Users, Trash2, ChevronLeft, ChevronRight, Eye, UserSquare2 } from 'lucide-react';

export default function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { users, loading, error } = useAppSelector(state => state.users);
  const { isImpersonating } = useAppSelector(state => state.auth);
  const { courses } = useAppSelector(state => state.courses);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  useEffect(() => {
    if (isImpersonating) {
      router.push('/dashboard');
    }
  }, [isImpersonating, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
    const savedView = localStorage.getItem('adminUserViewMode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
  }, [dispatch, courses.length]);

  const handleViewToggle = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('adminUserViewMode', mode);
  };

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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 rotate-90" size={16} />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 whitespace-nowrap bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0 shadow-sm w-full sm:w-auto justify-center">
            <span className="text-sm font-semibold text-slate-500 pl-2">{t.itemsPerPage}:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-bold text-slate-700 cursor-pointer transition-all"
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0 shadow-inner w-full sm:w-auto justify-center">
            <button
              onClick={() => handleViewToggle('list')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all duration-300 flex-1 sm:flex-none justify-center ${viewMode === 'list' ? 'bg-white shadow-md text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title={t.listView}
            >
              <List size={20} /> <span className="hidden xl:inline text-sm">{t.listView}</span>
            </button>
            <button
              onClick={() => handleViewToggle('grid')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all duration-300 flex-1 sm:flex-none justify-center ${viewMode === 'grid' ? 'bg-white shadow-md text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title={t.gridView}
            >
              <LayoutGrid size={20} /> <span className="hidden xl:inline text-sm">{t.gridView}</span>
            </button>
          </div>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-medium italic bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          {t.loadingUsers}
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="py-24 text-center text-slate-400 font-medium italic bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
             <Search size={40} />
          </div>
          <div>
            <p className="text-xl text-slate-500 font-bold">{t.noUsersFound}</p>
            <p className="text-slate-400 mt-1 max-w-xs mx-auto">{t.tryAdjustingFilters}</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{t.userProfile}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{t.role}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{t.enrolledCourses}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user: User) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-xl flex items-center justify-center shrink-0 border border-indigo-100/50 shadow-sm group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{user.name || t.noName}</p>
                          <p className="text-sm text-slate-500 font-medium mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-500 border border-slate-200/50'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {user.enrolledCourses.slice(0, 2).map((courseId: string) => (
                            <span key={courseId} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase tracking-wider rounded-md truncate max-w-[150px] border border-indigo-100/50 shadow-sm">
                              {getCourseTitle(courseId)}
                            </span>
                          ))}
                          {user.enrolledCourses.length > 2 && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] font-bold rounded-md cursor-help border border-slate-200/50 shadow-sm" title={user.enrolledCourses.slice(2).map(getCourseTitle).join(', ')}>
                              +{user.enrolledCourses.length - 2} {t.more}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{t.noEnrollments}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <button 
                          onClick={() => setSelectedUserId(user.id)}
                          className="px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
                        >
                          <Eye size={14} className="opacity-70" /> {t.viewDetails}
                        </button>
                        <button 
                          onClick={() => dispatch(impersonateUserRequest(user.id))}
                          className="px-4 py-2.5 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                        >
                          <UserSquare2 size={14} /> {t.impersonate}
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm hover:shadow-rose-50"
                          title={t.deleteUser}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
          {paginatedUsers.map((user: User) => (
            <div key={user.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1 p-6 relative">
              <div className="absolute top-4 right-4">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500 border border-slate-200/50'}`}>
                  {user.role}
                </span>
              </div>
              <div className="flex flex-col items-center text-center mt-4 mb-6 relative">
                <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 text-indigo-600 font-bold text-3xl flex items-center justify-center border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-500 mb-4 z-10 relative overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute top-8 w-full h-8 bg-gradient-to-b from-indigo-50/50 to-transparent blur-xl"></div>
                
                <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 w-full">{user.name || t.noName}</h3>
                <p className="text-sm text-slate-500 mt-1 truncate w-full font-medium">{user.email}</p>
              </div>
              
              <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">{t.enrolledCourses}</p>
                  {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {user.enrolledCourses.slice(0, 3).map((courseId: string) => (
                        <span key={courseId} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-md truncate max-w-full border border-indigo-100/50 shadow-sm">
                          {getCourseTitle(courseId)}
                        </span>
                      ))}
                      {user.enrolledCourses.length > 3 && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-md border border-slate-200/50 shadow-sm" title={user.enrolledCourses.slice(3).map(getCourseTitle).join(', ')}>
                          +{user.enrolledCourses.length - 3} {t.more}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded-md block w-fit">{t.noEnrollments}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 mt-1">
                  <button 
                    onClick={() => setSelectedUserId(user.id)}
                    className="flex-1 py-2.5 bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                  >
                    {t.viewDetails}
                  </button>
                  <button 
                    onClick={() => dispatch(impersonateUserRequest(user.id))}
                    className="flex-1 py-2.5 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                  >
                    <UserSquare2 size={14} /> {t.impersonate}
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 flex-shrink-0 shadow-sm hover:shadow-rose-50"
                    title={t.deleteUser}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-5 sm:px-8 rounded-[32px] shadow-sm border border-slate-100 mt-10 animate-in slide-in-from-bottom duration-500">
          <p className="text-sm text-slate-500 font-bold">
            {t.showing} <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-xs mx-1">{totalItems === 0 ? 0 : startIndex + 1}</span> {t.to} <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-xs mx-1">{endIndex}</span> {t.of} <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-xs mx-1">{totalItems}</span>
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className="px-4 sm:px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <ChevronLeft size={18} /> <span className="hidden sm:inline">{t.prev}</span>
            </button>
            
            <div className="flex items-center gap-1.5 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <div key={`ellipsis-${page}`} className="flex items-center gap-1.5">
                        <span className="w-6 text-center text-slate-400 font-black tracking-widest text-xs">...</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[44px] h-11 px-2 rounded-2xl font-black transition-all active:scale-95 text-sm ${
                            safeCurrentPage === page 
                              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border border-indigo-700' 
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
                      className={`min-w-[44px] h-11 px-2 rounded-2xl font-black transition-all active:scale-95 text-sm ${
                        safeCurrentPage === page 
                          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border border-indigo-700' 
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
              className="px-4 sm:px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
               <span className="hidden sm:inline">{t.next}</span> <ChevronRight size={18} />
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
