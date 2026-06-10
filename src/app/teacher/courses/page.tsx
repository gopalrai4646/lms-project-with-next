'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest, deleteCourseRequest } from '@/store/slices/courseSlice';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Eye, List, LayoutGrid, BookOpen, Users, Pencil, Trash2, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/dateUtils';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import CustomSelect from '@/components/common/CustomSelect';

export default function TeacherCoursesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { courses, loading, error } = useAppSelector((state) => state.courses);
  const { user } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    dispatch(fetchCoursesRequest());
    const savedView = localStorage.getItem('teacherCourseViewMode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
  }, [dispatch]);

  const handleViewToggle = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('teacherCourseViewMode', mode);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      dispatch(deleteCourseRequest(id));
    }
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!user) return [];
    
    // Only show courses created by this teacher
    let result = courses.filter(c => c.createdBy === user.uid);

    if (visibilityFilter !== 'all') {
      result = result.filter(c => (c.visibility || 'public') === visibilityFilter);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((course) =>
        course.title.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [courses, searchQuery, visibilityFilter, user]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage, visibilityFilter]);

  // Pagination logic
  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  if (!isMounted || !user) return null;

  return (
    <div className="space-y-6 bg-background min-h-screen p-0 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={TYPOGRAPHY.h1}>Manage Your Courses</h1>
          <p className={`${TYPOGRAPHY.body} mt-1`}>Create, edit, and manage your online courses</p>
        </div>
        <Link href="/teacher/courses/new" className={BUTTONS.primary}>
          <Plus size={16} /> New Course
        </Link>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className={`${UI_COMPONENTS.card} !p-2 w-full min-w-0`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3 w-full">
          <div className="flex flex-col gap-3 md:flex-row md:items-center w-full min-w-0 lg:flex-1 lg:min-w-0">
            <div className="relative w-full min-w-0 md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input
                type="search"
                placeholder="Search your courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${UI_COMPONENTS.input} pl-10 w-full`}
              />
            </div>
            <CustomSelect
              value={visibilityFilter}
              onChange={(val) => setVisibilityFilter(val as any)}
              icon={<Eye size={16} />}
              className="w-full md:w-[11.5rem] md:shrink-0"
              options={[
                { value: 'all', label: 'All Courses' },
                { value: 'public', label: 'Public' },
                { value: 'private', label: 'Private' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:shrink-0">
            <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2 w-full min-w-0">
              <span className={`${TYPOGRAPHY.label} text-xs lg:whitespace-nowrap shrink-0`}>
                Items per page
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
                ]}
              />
            </div>
            <div className={`${UI_COMPONENTS.segmentedControl} w-full min-w-0 p-1 lg:p-0.5`}>
              <button
                type="button"
                onClick={() => handleViewToggle('list')}
                className={`flex flex-1 items-center justify-center gap-2 min-h-10 lg:min-h-0 px-3 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-5 h-5 lg:w-4 lg:h-4" />
                <span className="hidden lg:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewToggle('grid')}
                className={`flex flex-1 items-center justify-center gap-2 min-h-10 lg:min-h-0 px-3 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-5 h-5 lg:w-4 lg:h-4" />
                <span className="hidden lg:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && courses.length === 0 ? (
        <div className={`${UI_COMPONENTS.emptyStateCard} py-12`}>
          <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div>
          <p className={`${TYPOGRAPHY.body} mt-3 animate-pulse`}>Loading your courses...</p>
        </div>
      ) : paginatedCourses.length === 0 ? (
        <div className={UI_COMPONENTS.emptyStateCard}>
          <BookOpen className="text-slate-300" size={48} />
          <p className={`${TYPOGRAPHY.h3} mt-4 text-slate-400`}>No courses found</p>
          <p className={`${TYPOGRAPHY.body} mt-1 text-slate-400 max-w-xs`}>You haven't created any courses matching your criteria.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className={UI_COMPONENTS.tableWrapper}>
          <div className={UI_COMPONENTS.tableContainer}>
            <table className={UI_COMPONENTS.table}>
              <thead className={UI_COMPONENTS.tableHeader}>
                <tr>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>Course Info</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-center`}>Visibility</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>Created On</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-center`}>Students</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCourses.map((course) => (
                  <tr key={course.id} className={UI_COMPONENTS.tableRow}>
                    <td className="px-5 py-3 w-1/2">
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
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                        course.visibility === 'private'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {course.visibility === 'private' ? 'Private' : 'Public'}
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
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/teacher/courses/edit/${course.id}`}
                          className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-primary-600`}
                          title="Edit Course"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                          title="Delete Course"
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
        <div className={UI_COMPONENTS.gridContainer}>
          {paginatedCourses.map((course) => (
            <div
              key={course.id}
              className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden group`}
              onClick={() => router.push(`/teacher/courses/edit/${course.id}`)}
            >
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
                    {course.visibility === 'private' ? 'Private' : 'Public'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="bg-slate-900/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[10px] font-semibold flex items-center gap-1.5">
                    <Users size={11} /> {course.enrolledUsers?.length || 0} Learners
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className={`${TYPOGRAPHY.h3} line-clamp-2 leading-snug mb-2 group-hover:text-primary-600 transition-colors`}>{course.title}</h3>
                <p className={`${TYPOGRAPHY.body} text-xs line-clamp-2 mb-4 flex-grow`}>{course.description}</p>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="font-semibold text-emerald-600">${course.price}</span>
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/teacher/courses/edit/${course.id}`}
                      className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-primary-600`}
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 0 && totalItems > 0 && (
        <div className={`${UI_COMPONENTS.pagination} mt-2`}>
          <p className={TYPOGRAPHY.body}>
            Showing <span className="font-semibold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</span> to <span className="font-semibold text-slate-900">{endIndex}</span> of <span className="font-semibold text-slate-900">{totalItems}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className={`${BUTTONS.ghost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ChevronLeft size={14} /> <span className="hidden sm:inline">Prev</span>
            </button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-slate-700">Page {safeCurrentPage} of {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages || totalPages === 0}
              className={`${BUTTONS.ghost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="hidden sm:inline">Next</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
