'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest, deleteCourseRequest } from '@/store/slices/courseSlice';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, Search, Eye, List, LayoutGrid, BookOpen, GraduationCap, Users, Pencil, Trash2, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/dateUtils';
import { hasPermission } from '@/lib/permissions';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import CustomSelect from '@/components/common/CustomSelect';

export default function AdminCoursesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { courses, loading, error } = useAppSelector((state) => state.courses);
  const { user, role, permissions } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [isMounted, setIsMounted] = useState(false);

  const canCreate = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'courses_create'));
  const canEdit = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'courses_edit'));
  const canDeleteCourse = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'courses_delete'));

  useEffect(() => {
    setIsMounted(true);
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
    <div className="space-y-6 bg-background min-h-screen p-0 animate-in fade-in duration-700">
      {/* ─── Page Header ─── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={TYPOGRAPHY.h1}>{t.manageCoursesTitle}</h1>
          <p className={`${TYPOGRAPHY.body} mt-1`}>{t.manageCoursesSubtitle}</p>
        </div>
        {canCreate && (
          <Link href="/admin/courses/new" className={BUTTONS.primary}>
            <Plus size={16} /> {t.newCourse}
          </Link>
        )}
      </header>

      {/* ─── Error Banner ─── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium animate-in slide-in-from-left duration-300">
          {error}
        </div>
      )}

      {/* ─── Toolbar: 3 rows (mobile) → 2 rows (md) → 1 row (lg) ─── */}
      <div className={`${UI_COMPONENTS.card} !p-2 w-full min-w-0`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3 w-full">
          {/* Row 1–2: Search + visibility */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center w-full min-w-0 lg:flex-1 lg:min-w-0">
            <div className="relative w-full min-w-0 md:flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
                aria-hidden
              />
              <input
                type="search"
                placeholder={t.searchCourses}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${UI_COMPONENTS.input} pl-10 w-full`}
                aria-label={t.searchCourses}
              />
            </div>
            <CustomSelect
              value={visibilityFilter}
              onChange={(val) => setVisibilityFilter(val as any)}
              icon={<Eye size={16} />}
              className="w-full md:w-[11.5rem] md:shrink-0"
              options={[
                { value: 'all', label: t.allCourses || 'All Courses' },
                { value: 'public', label: t.public?.split(' ')[0] || 'Public' },
                { value: 'private', label: t.private?.split(' ')[0] || 'Private' },
              ]}
            />
          </div>

          {/* Row 3: Items per page + view (2 equal columns, full-width row) */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:shrink-0">
            <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2 w-full min-w-0">
              <span className={`${TYPOGRAPHY.label} text-xs lg:whitespace-nowrap shrink-0`}>
                {t.itemsPerPage}
              </span>
              <CustomSelect
                value={itemsPerPage}
                onChange={(val) => setItemsPerPage(Number(val))}
                icon={<Hash size={14} />}
                size="sm"
                className="w-full lg:w-[5.5rem] lg:shrink-0"
                options={[
                  { value: 8, label: '8' },
                  { value: 12, label: '12' },
                  { value: 24, label: '24' },
                  { value: 48, label: '48' },
                ]}
              />
            </div>
            <div
              className={`${UI_COMPONENTS.segmentedControl} w-full min-w-0 p-1 lg:p-0.5`}
              role="group"
              aria-label={`${t.listView} / ${t.gridView}`}
            >
              <button
                type="button"
                onClick={() => handleViewToggle('list')}
                className={`flex flex-1 items-center justify-center gap-2 min-h-10 lg:min-h-0 px-3 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={t.listView}
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-5 h-5 lg:w-4 lg:h-4" aria-hidden />
                <span className="hidden lg:inline">{t.listView}</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewToggle('grid')}
                className={`flex flex-1 items-center justify-center gap-2 min-h-10 lg:min-h-0 px-3 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={t.gridView}
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-5 h-5 lg:w-4 lg:h-4" aria-hidden />
                <span className="hidden lg:inline">{t.gridView}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content Area ─── */}
      {loading && courses.length === 0 ? (
        <div className={`${UI_COMPONENTS.emptyStateCard} py-12`}>
          <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div>
          <p className={`${TYPOGRAPHY.body} mt-3 animate-pulse`}>{t.loadingCourses}</p>
        </div>
      ) : paginatedCourses.length === 0 ? (
        <div className={UI_COMPONENTS.emptyStateCard}>
          <Search className="text-slate-300" size={48} />
          <p className={`${TYPOGRAPHY.h3} mt-4 text-slate-400`}>{t.noCoursesFound}</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── List View ─── */
        <div className={UI_COMPONENTS.tableWrapper}>
          <div className={UI_COMPONENTS.tableContainer}>
            <table className={UI_COMPONENTS.table}>
              <thead className={UI_COMPONENTS.tableHeader}>
                <tr>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>{t.courseInfo}</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>{t.instructor}</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-center`}>{t.visibility}</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>{t.created_at}</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-center`}>{t.user}</th>
                  {(canEdit || canDeleteCourse) && <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-right`}>{t.actions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCourses.map((course) => (
                  <tr key={course.id} className={UI_COMPONENTS.tableRow}>
                    <td className="px-5 py-3 w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/50 group-hover:scale-105 transition-transform duration-300">
                          {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <BookOpen size={24} className="text-slate-300" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`${TYPOGRAPHY.h3} group-hover:text-primary-600 transition-colors line-clamp-1`}>{course.title}</p>
                          <p className={`${TYPOGRAPHY.body} text-xs mt-0.5 line-clamp-1 max-w-[250px]`}>{course.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 text-primary-600">
                          <GraduationCap size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{course.instructor}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                        course.visibility === 'private'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {course.visibility === 'private' ? (t.private?.split(' ')[0] || 'Private') : (t.public?.split(' ')[0] || 'Public')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {formatDate(course.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`${UI_COMPONENTS.badge} inline-flex`}>
                        <Users size={12} className="opacity-60" /> {course.enrolledUsers?.length || 0}
                      </span>
                    </td>
                    {(canEdit || canDeleteCourse) && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <Link
                              href={`/admin/courses/edit/${course.id}`}
                              className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-primary-600`}
                              title={t.editCourse}
                            >
                              <Pencil size={16} />
                            </Link>
                          )}
                          {canDeleteCourse && (
                            <button
                              onClick={() => handleDelete(course.id)}
                              className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                              title={t.deleteCourse}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── Grid View ─── */
        <div className={UI_COMPONENTS.gridContainer}>
          {paginatedCourses.map((course) => (
            <div
              key={course.id}
              className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden group`}
              onClick={() => canEdit && router.push(`/admin/courses/edit/${course.id}`)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <BookOpen size={48} className="text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border backdrop-blur-sm ${
                    course.visibility === 'private'
                      ? 'bg-white/90 text-amber-600 border-amber-200/50'
                      : 'bg-white/90 text-emerald-600 border-emerald-200/50'
                  }`}>
                    {course.visibility === 'private' ? (t.private?.split(' ')[0] || 'Private') : (t.public?.split(' ')[0] || 'Public')}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="bg-slate-900/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[10px] font-semibold flex items-center gap-1.5">
                    <Users size={11} /> {course.enrolledUsers?.length || 0} {t.learners}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className={`${TYPOGRAPHY.h3} line-clamp-2 leading-snug mb-2 group-hover:text-primary-600 transition-colors`}>{course.title}</h3>
                <p className={`${TYPOGRAPHY.body} text-xs line-clamp-2 mb-4 flex-grow`}>{course.description}</p>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0 border border-primary-100">
                      <GraduationCap size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.instructor}</p>
                      <p className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{course.instructor}</p>
                    </div>
                  </div>

                  {(canEdit || canDeleteCourse) && (
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <Link
                          href={`/admin/courses/edit/${course.id}`}
                          className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-primary-600`}
                          title={t.editCourse}
                        >
                          <Pencil size={14} />
                        </Link>
                      )}
                      {canDeleteCourse && (
                        <button
                          onClick={() => handleDelete(course.id)}
                          className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                          title={t.deleteCourse}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 0 && totalItems > 0 && (
        <div className={`${UI_COMPONENTS.pagination} mt-2`}>
          <p className={TYPOGRAPHY.body}>
            {t.showing} <span className="font-semibold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</span> {t.to} <span className="font-semibold text-slate-900">{endIndex}</span> {t.of} <span className="font-semibold text-slate-900">{totalItems}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className={`${BUTTONS.ghost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ChevronLeft size={14} /> <span className="hidden sm:inline">{t.prev}</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <div key={`ellipsis-${page}`} className="flex items-center gap-1">
                        <span className="w-4 text-center text-slate-400 text-xs">…</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[28px] h-7 px-1.5 rounded-lg font-medium transition-all text-xs ${
                            safeCurrentPage === page
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg font-medium transition-all text-xs ${
                        safeCurrentPage === page
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
              className={`${BUTTONS.ghost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="hidden sm:inline">{t.next}</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
