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
  const [itemsPerPage, setItemsPerPage] = useState(6);
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
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t.manageCoursesTitle}</h1>
          <p className="text-slate-500 mt-1">{t.manageCoursesSubtitle}</p>
        </div>
        <Link 
          href="/admin/courses/new" 
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center gap-2 shrink-0"
        >
          <span>➕</span> {t.newCourse}
        </Link>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          {error}
        </div>
      )}

      {/* Toolbar: Search, Filters, View toggle */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative w-full xl:max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text"
            placeholder={t.searchCourses}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full xl:w-auto overflow-hidden">
          {/* Visibility Filter Dropdown */}
          <div className="flex items-center gap-2 whitespace-nowrap bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0">
            <span className="text-sm font-semibold text-slate-500 pl-2">👁️ {t.visibility || 'Visibility'}:</span>
            <select 
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-bold text-slate-700 cursor-pointer"
            >
              <option value="all">{t.allCourses}</option>
              <option value="public">{t.public?.split(' ')[0] || 'Public'}</option>
              <option value="private">{t.private?.split(' ')[0] || 'Private'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0">
            <span className="text-sm font-semibold text-slate-500 pl-2">{t.itemsPerPage}:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-bold text-slate-700 cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
            <button
              onClick={() => handleViewToggle('list')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title={t.listView}
            >
              <span className="text-xl">📋</span> <span className="hidden lg:inline text-sm">{t.listView}</span>
            </button>
            <button
              onClick={() => handleViewToggle('grid')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
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
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[950px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.courseInfo}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.instructor}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.visibility || 'VISIBILITY'}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.createdAt || 'CREATED AT'}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.user}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 w-1/3">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-xl relative border border-slate-200/50">
                          {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : '📚'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{course.title}</p>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-[250px]">{course.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] shrink-0">🧑‍🏫</div>
                         <span className="text-sm font-semibold text-slate-700">{course.instructor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${course.visibility === 'private' ? 'bg-amber-100 text-amber-700 border border-amber-200/50' : 'bg-emerald-100 text-emerald-700 border border-emerald-200/50'}`}>
                        {course.visibility === 'private' ? (t.private?.split(' ')[0] || 'Private') : (t.public?.split(' ')[0] || 'Public')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {formatIndianDate(course.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center justify-center gap-1.5 w-fit mx-auto border border-slate-200/50">
                        <span className="text-[10px]">👥</span> {course.enrolledUsers?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/admin/courses/edit/${course.id}`}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 flex items-center gap-1 shrink-0"
                          title={t.editCourse}
                        >
                          ✏️
                        </Link>
                        <button 
                          onClick={() => handleDelete(course.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 flex items-center gap-1 shrink-0"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
              <div className="aspect-video bg-slate-50 relative overflow-hidden flex items-center justify-center text-6xl">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="transform group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">📚</span>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md ${course.visibility === 'private' ? 'bg-amber-100/90 text-amber-800 border border-amber-200/50' : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/50'}`}>
                    {course.visibility === 'private' ? (t.private?.split(' ')[0] || 'Private') : (t.public?.split(' ')[0] || 'Public')}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-xl text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">{course.description}</p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                      🧑‍🏫
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.instructor}</p>
                      <p className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">{course.instructor}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 shrink-0">
                    <Link 
                      href={`/admin/courses/edit/${course.id}`}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center"
                      title={t.editCourse}
                    >
                      ✏️
                    </Link>
                    <button 
                      onClick={() => handleDelete(course.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 flex items-center justify-center"
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
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 sm:px-6 rounded-3xl shadow-sm border border-slate-100 mt-6">
          <p className="text-sm text-slate-500 font-medium">
            {t.showing} <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{totalItems === 0 ? 0 : startIndex + 1}</span> {t.to} <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{endIndex}</span> {t.of} <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{totalItems}</span>
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className="px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95"
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
              className="px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95"
            >
               <span className="hidden sm:inline">{t.next}</span> ➡️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
