'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import CourseCard from '@/components/common/CourseCard';
import ProgressRing from '@/components/charts/ProgressRing';
import {
  Search,
  LayoutGrid,
  List,
  BookOpen,
  CheckCircle2,
  RotateCw,
  PauseCircle,
  GraduationCap,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';

type TabFilter = 'all' | 'in-progress' | 'completed';

export default function MyCoursesPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  const { trainingPlans } = useAppSelector((state) => state.trainingPlans);
  const { progress } = useAppSelector((state) => state.progress);
  const { t: i18nT } = useTranslation();
  const t = i18nT('dashboard', { returnObjects: true }) as any;
  const adminT = i18nT('admin', { returnObjects: true }) as any;

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    dispatch(fetchCoursesRequest());
    if (user?.assignedTrainingPlans?.length) {
      dispatch(fetchTrainingPlansRequest());
    }
  }, [dispatch, user?.assignedTrainingPlans]);

  // Fetch progress for enrolled courses
  useEffect(() => {
    if (user?.uid && user?.enrolledCourses?.length) {
      user.enrolledCourses.forEach(courseId => {
        if (!progress[courseId]) {
          dispatch({ type: 'progress/fetchProgressRequest', payload: { userId: user.uid, courseId } });
        }
      });
    }
  }, [dispatch, user?.uid, user?.enrolledCourses, progress]);

  // Determine accessible private courses from training plans
  const assignedPlanIds = user?.assignedTrainingPlans || [];
  const assignedPlans = trainingPlans.filter(tp => assignedPlanIds.includes(tp.id));
  const planCourseIds = new Set(assignedPlans.flatMap(tp => tp.courseIds || []));

  const availableCourses = courses.filter(c =>
    c.visibility !== 'private' || planCourseIds.has(c.id) || user?.enrolledCourses?.includes(c.id)
  );

  const enrolledCourses = courses.filter(c => user?.enrolledCourses?.includes(c.id));

  const getCourseProgress = (course: any) => {
    const courseProgress = progress[course.id];
    const videoCount = course.videos?.length || 0;
    if (!courseProgress || videoCount === 0) return 0;

    const videoList = course.videos || [];
    let totalDuration = 0;
    let totalWatched = 0;

    videoList.forEach((video: any, index: number) => {
      const vidId = `video_${index}`;
      const duration = video.duration || 0;
      const watched = courseProgress.watchedDurations?.[vidId] || 0;
      const isCompleted = courseProgress.completedVideos?.includes(vidId);

      if (duration > 0) {
        totalDuration += duration;
        totalWatched += isCompleted ? duration : Math.min(watched, duration);
      } else {
        totalDuration += 100;
        totalWatched += isCompleted ? 100 : 0;
      }
    });

    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.round((totalWatched / totalDuration) * 100));
  };

  const filteredCourses = useMemo(() => {
    let filtered = enrolledCourses;

    // Tab filter
    if (activeTab === 'in-progress') {
      filtered = filtered.filter(c => {
        const p = getCourseProgress(c);
        return p > 0 && p < 100;
      });
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(c => getCourseProgress(c) >= 100);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.instructor.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [enrolledCourses, activeTab, searchQuery, progress]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemsPerPage]);

  // Pagination logic
  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  // Stat counts  
  const completedCount = enrolledCourses.filter(c => getCourseProgress(c) >= 100).length;
  const inProgressCount = enrolledCourses.filter(c => { const p = getCourseProgress(c); return p > 0 && p < 100; }).length;

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: t.allCourses || 'All Courses', count: enrolledCourses.length },
    { key: 'in-progress', label: t.inProgress || 'In Progress', count: inProgressCount },
    { key: 'completed', label: t.completedLabel || 'Completed', count: completedCount },
  ];

  return (
    <div className={UI_COMPONENTS.pageContainer}>
      {/* Header */}
      <header>
        <h1 className={TYPOGRAPHY.h1}>{t.myCourses || 'My Courses'}</h1>
        <p className={`${TYPOGRAPHY.body} mt-1`}>{t.myCoursesSubtitle || 'Track your learning progress and manage your enrolled courses.'}</p>
      </header>



      {/* Filters Bar */}
      <div className={`${UI_COMPONENTS.card} flex flex-col xl:flex-row gap-4 xl:items-center`}>

        {/* Tabs */}
        <div className="overflow-x-auto no-scrollbar w-full xl:flex-1">
          <div className="flex gap-2 bg-slate-100 rounded-2xl p-1 w-max min-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab.label}

                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-slate-200 text-slate-500'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full xl:w-72 shrink-0">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={18} />
          </span>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchCourses || 'Search your courses...'}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-slate-50 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto shrink-0">

          {/* Items Per Page */}
          <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 flex-1 sm:flex-none">
            <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">
              {t.itemsPerPage || 'Items'}:
            </span>

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-sm font-bold text-slate-700 cursor-pointer transition-all"
            >
              {[8, 12, 16, 20].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner flex-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 ${viewMode === 'grid'
                ? 'bg-white shadow-md text-primary-600'
                : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              title={adminT?.gridView || 'Grid View'}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 ${viewMode === 'list'
                ? 'bg-white shadow-md text-primary-600'
                : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              title={adminT?.listView || 'List View'}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Course Content */}
      {coursesLoading && enrolledCourses.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-50 rounded-3xl h-80 animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : paginatedCourses.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          /* List View */
          <div className={`${UI_COMPONENTS.card} !p-0 overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">{adminT?.courseInfo || 'Course'}</th>
                    <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">{adminT?.instructor || 'Instructor'}</th>
                    <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">{t.yourProgress || 'Progress'}</th>
                    <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.statusLabel || 'Status'}</th>
                    <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{adminT?.actions || 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCourses.map(course => {
                    const pct = getCourseProgress(course);
                    const status = pct >= 100 ? 'completed' : pct > 0 ? 'in-progress' : 'not-started';
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                              {course.thumbnail ? (
                                <img src={course.thumbnail} className="w-full h-full object-cover" />
                              ) : (
                                <BookOpen size={24} className="text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate group-hover:text-primary-600 transition-colors">{course.title}</p>
                              <p className="text-xs text-slate-400">{course.videos?.length || 0} lessons</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-sm font-medium text-slate-600">{course.instructor}</td>
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                            status === 'in-progress' ? 'bg-amber-100 text-amber-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                            {status === 'completed' ? (
                              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {t.completedLabel || 'Completed'}</span>
                            ) : status === 'in-progress' ? (
                              <span className="flex items-center gap-1.5"><RotateCw size={14} className="animate-spin-slow" /> {t.inProgress || 'In Progress'}</span>
                            ) : (
                              <span className="flex items-center gap-1.5"><PauseCircle size={14} /> {t.notStarted || 'Not Started'}</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-2 text-right">
                          <Link
                            href={`/dashboard/courses/${course.id}`}
                            className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-100 transition-all flex items-center justify-center gap-1"
                          >
                            {pct > 0 ? (t.continue || 'Continue') : (t.viewCourse || 'Start')} <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className={UI_COMPONENTS.emptyStateCard}>
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            {activeTab === 'completed' ? <GraduationCap size={48} /> : <BookOpen size={48} />}
          </div>
          <h3 className={TYPOGRAPHY.h3}>
            {activeTab === 'all' ? (t.noEnrolledCourses || 'No courses enrolled yet') :
              activeTab === 'in-progress' ? (t.noInProgress || 'No courses in progress') :
                (t.noCompleted || 'No completed courses yet')}
          </h3>
          <p className={`${TYPOGRAPHY.body} max-w-md mx-auto`}>
            {activeTab === 'all' ? (t.enrollToStart || 'Explore available courses from your dashboard and start learning today!') :
              activeTab === 'in-progress' ? (t.startACourse || 'Start any enrolled course to see your progress here.') :
                (t.finishACourse || 'Complete all videos in a course to mark it as done.')}
          </p>
          {activeTab === 'all' && (
            <Link href="/dashboard" className={`${BUTTONS.primary} mt-6`}>
              <Search size={18} /> {t.discover || 'Browse Courses'}
            </Link>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 sm:px-6 py-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            {t.showing || 'Showing'} <span className="font-bold text-slate-700">{startIndex + 1}</span> {t.to || 'to'} <span className="font-bold text-slate-700">{endIndex}</span> {t.of || 'of'} <span className="font-bold text-slate-700">{totalItems}</span>
          </p>
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} /> <span className="hidden sm:inline">{t.prev || 'Prev'}</span>
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
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg font-bold transition-all text-xs ${safeCurrentPage === page
                        ? 'bg-primary-600 text-white border border-primary-700'
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
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg font-bold transition-all text-xs ${safeCurrentPage === page
                        ? 'bg-primary-600 text-white border border-primary-700'
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
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <span className="hidden sm:inline">{t.next || 'Next'}</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
