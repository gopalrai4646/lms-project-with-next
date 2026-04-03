'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest, deleteCourseRequest } from '@/store/slices/courseSlice';
import { translations } from '@/utils/translations';
import { useDebounce } from '@/hooks/useDebounce';

const formatIndianDate = (dateVal: any) => {
  if (!dateVal) return 'N/A';
  try {
    let d: Date;
    if (typeof dateVal === 'object' && dateVal.seconds) {
      d = new Date(dateVal.seconds * 1000);
    } else if (typeof dateVal === 'number') {
      d = new Date(dateVal < 10000000000 ? dateVal * 1000 : dateVal);
    } else {
      d = new Date(dateVal);
    }
    
    // Check for invalid date
    if (isNaN(d.getTime())) return 'N/A';
    
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (e) {
    return 'N/A';
  }
};

export default function AdminCoursesPage() {
  const dispatch = useAppDispatch();
  const { courses, loading, error } = useAppSelector((state) => state.courses);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language].admin;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    dispatch(fetchCoursesRequest());
    const savedView = localStorage.getItem('adminCourseViewMode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
  }, [dispatch]);

  const handleViewToggle = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('adminCourseViewMode', mode);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      dispatch(deleteCourseRequest(id));
    }
  };

  // 1. Filter courses
  const filteredCourses = useMemo(() => {
    let result = courses;

    if (visibilityFilter !== 'all') {
      result = result.filter(c => (c.visibility || 'public') === visibilityFilter);
    }

    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      result = result.filter((course) => 
        course.title.toLowerCase().includes(lowerQuery) ||
        course.instructor.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [courses, debouncedSearchQuery, visibilityFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, itemsPerPage, visibilityFilter]);

  // 2. Pagination logic
  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  if (!isMounted) return null; // Avoid hydration mismatch for localStorage view

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t.manageCoursesTitle}</h1>
          <p className="text-slate-500 mt-1">{t.manageCoursesSubtitle}</p>
        </div>
        <Link 
          href="/admin/courses/new" 
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center gap-2 shrink-0 group"
        >
          <span className="group-hover:rotate-90 transition-transform duration-300">➕</span> {t.newCourse}
        </Link>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-xl font-medium animate-in slide-in-from-left duration-300">
          {error}
        </div>
      )}

      {/* Toolbar: Search, Filters, and Items Per Page */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-4 w-full xl:flex-1">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text"
              placeholder={t.searchCourses}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          
          <div className="w-full lg:w-64 relative">
            <select 
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 text-sm font-bold text-slate-700 bg-white cursor-pointer appearance-none shadow-sm transition-all"
            >
              <option value="all">{t.allCourses}</option>
              <option value="public">{t.public?.split(' ')[0] || 'Public'}</option>
              <option value="private">{t.private?.split(' ')[0] || 'Private'}</option>
            </select>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">👁️</span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs text-slate-300">▼</span>
          </div>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-2 whitespace-nowrap bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0 shadow-sm">
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

          <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0 shadow-inner">
            <button
              onClick={() => handleViewToggle('list')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${viewMode === 'list' ? 'bg-white shadow-md text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title={t.listView}
            >
              <span className="text-xl">📋</span> <span className="hidden lg:inline text-sm">{t.listView}</span>
            </button>
            <button
              onClick={() => handleViewToggle('grid')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${viewMode === 'grid' ? 'bg-white shadow-md text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title={t.gridView}
            >
              <span className="text-xl">🧩</span> <span className="hidden lg:inline text-sm">{t.gridView}</span>
            </button>
          </div>
        </div>
      </div>

      {loading && courses.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-medium italic bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          {t.loadingCourses}
        </div>
      ) : paginatedCourses.length === 0 ? (
        <div className="py-16 text-center text-slate-400 font-medium italic bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
          <span className="text-5xl opacity-50 grayscale">🔍</span>
          <p className="text-lg text-slate-500 font-semibold">{t.noCoursesFound}</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[950px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{t.courseInfo}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{t.instructor}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.courseVisibility || 'VISIBILITY'}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{t.createdAt || 'CREATED AT'}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.user}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4 w-1/3">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl relative border border-slate-200/50 shadow-sm group-hover:scale-105 transition-transform duration-300">
                          {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : '📚'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1 text-base">{course.title}</p>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-[250px] font-medium">{course.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                         <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs shrink-0 shadow-sm">🧑‍🏫</div>
                         <span className="text-sm font-bold text-slate-700">{course.instructor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap border ${course.visibility === 'private' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {course.visibility === 'private' ? (t.private?.split(' ')[0] || 'Private') : (t.public?.split(' ')[0] || 'Public')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500 font-mono bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                        {formatIndianDate(course.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-full inline-flex items-center justify-center gap-1.5 w-fit border border-slate-200/50 shadow-sm">
                        <span className="opacity-60">👥</span> {course.enrolledUsers?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/admin/courses/edit/${course.id}`}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100 flex items-center gap-1 shrink-0 shadow-sm hover:shadow-indigo-50"
                          title={t.editCourse}
                        >
                          ✏️
                        </Link>
                        <button 
                          onClick={() => handleDelete(course.id)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 flex items-center gap-1 shrink-0 shadow-sm hover:shadow-rose-50"
                          title={t.deleteCourse}
                        >
                          🗑️
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-500">
          {paginatedCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="aspect-video bg-slate-50 relative overflow-hidden flex items-center justify-center text-6xl">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <span className="transform group-hover:scale-125 transition-transform duration-700 drop-shadow-xl">📚</span>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full shadow-lg backdrop-blur-xl border ${course.visibility === 'private' ? 'bg-white/90 text-amber-700 border-amber-200/30' : 'bg-white/90 text-emerald-700 border-emerald-200/30'}`}>
                    {course.visibility === 'private' ? (t.private?.split(' ')[0] || 'Private') : (t.public?.split(' ')[0] || 'Public')}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                   <div className="bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[10px] font-black flex items-center gap-1.5 shadow-lg">
                      <span className="opacity-80">👥</span> {course.enrolledUsers?.length || 0} Learners
                   </div>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="font-bold text-2xl text-slate-900 line-clamp-2 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-8 flex-grow font-medium leading-relaxed">{course.description}</p>
                
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-sm shrink-0 border border-indigo-100 shadow-sm group-hover:bg-indigo-100 transition-colors duration-300">
                      🧑‍🏫
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.instructor}</p>
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{course.instructor}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 shrink-0">
                    <Link 
                      href={`/admin/courses/edit/${course.id}`}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center shadow-sm"
                      title={t.editCourse}
                    >
                      ✏️
                    </Link>
                    <button 
                      onClick={() => handleDelete(course.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 flex items-center justify-center shadow-sm"
                      title={t.deleteCourse}
                    >
                      🗑️
                    </button>
                  </div>
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
              ⬅️ <span className="hidden sm:inline">{t.prev}</span>
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
               <span className="hidden sm:inline">{t.next}</span> ➡️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
