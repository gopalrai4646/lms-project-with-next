'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { translations } from '@/utils/translations';
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

type TabFilter = 'all' | 'in-progress' | 'completed';

export default function MyCoursesPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  const { trainingPlans } = useAppSelector((state) => state.trainingPlans);
  const { progress } = useAppSelector((state) => state.progress);
  const t = translations[language].dashboard;
  const adminT = translations[language].admin;

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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">{t.myCourses || 'My Courses'}</h1>
        <p className="text-slate-500 mt-1">{t.myCoursesSubtitle || 'Track your learning progress and manage your enrolled courses.'}</p>
      </header>



      {/* Filters Bar */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-3 md:p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Tabs - Scrollable on mobile */}
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1 shrink-0 lg:w-auto">
          <div className="flex justify-between gap-1 bg-slate-100 rounded-2xl p-1 w-max min-w-full">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Global Controls Wrapper - Search and View Toggle share a row on tablet */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchCourses || 'Search your courses...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all bg-slate-50/30"
            />
          </div>

          {/* View Toggle - Professional Layout */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl gap-2 items-center sm:shrink-0">
            <div className="flex items-center grow sm:grow-0 gap-2 whitespace-nowrap bg-white/50 px-2 h-10 rounded-lg border border-slate-200/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.itemsPerPage || 'Items'}:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-indigo-600 cursor-pointer outline-none grow"
              >
                {[8, 12, 16, 20].map(val => <option key={val} value={val}>{val}</option>)}
              </select>
            </div>

            <div className="flex bg-slate-200/50 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                title={adminT?.gridView || 'Grid View'}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                title={adminT?.listView || 'List View'}
              >
                <List size={18} />
              </button>
            </div>
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
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{adminT?.courseInfo || 'Course'}</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{adminT?.instructor || 'Instructor'}</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.yourProgress || 'Progress'}</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.statusLabel || 'Status'}</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{adminT?.actions || 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCourses.map(course => {
                    const pct = getCourseProgress(course);
                    const status = pct >= 100 ? 'completed' : pct > 0 ? 'in-progress' : 'not-started';
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                              {course.thumbnail ? (
                                <img src={course.thumbnail} className="w-full h-full object-cover" />
                              ) : (
                                <BookOpen size={24} className="text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{course.title}</p>
                              <p className="text-xs text-slate-400">{course.videos?.length || 0} lessons</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{course.instructor}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                            status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
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
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/courses/${course.id}`}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-1"
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
        <div className="text-center py-16 bg-white rounded-[28px] border border-dashed border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
             {activeTab === 'completed' ? <GraduationCap size={48} /> : <BookOpen size={48} />}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {activeTab === 'all' ? (t.noEnrolledCourses || 'No courses enrolled yet') :
             activeTab === 'in-progress' ? (t.noInProgress || 'No courses in progress') :
             (t.noCompleted || 'No completed courses yet')}
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {activeTab === 'all' ? (t.enrollToStart || 'Explore available courses from your dashboard and start learning today!') :
             activeTab === 'in-progress' ? (t.startACourse || 'Start any enrolled course to see your progress here.') :
             (t.finishACourse || 'Complete all videos in a course to mark it as done.')}
          </p>
          {activeTab === 'all' && (
            <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 inline-flex items-center gap-2">
              <Search size={18} /> {t.discover || 'Browse Courses'}
            </Link>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mt-12 animate-in slide-in-from-bottom duration-500">
          <p className="text-sm text-slate-500 font-medium">
            {t.showing || 'Showing'} <span className="font-bold text-slate-900 mx-1">{startIndex + 1}</span> {t.to || 'to'} <span className="font-bold text-slate-900 mx-1">{endIndex}</span> {t.of || 'of'} <span className="font-bold text-slate-900 mx-1">{totalItems}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm flex items-center gap-2"
            >
              <ChevronLeft size={16} /> {t.prev || 'Prev'}
            </button>
            
            <div className="flex items-center gap-1.5 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <div key={`ellipsis-${page}`} className="flex items-center gap-1">
                        <span className="w-6 text-center text-slate-400 font-bold tracking-widest text-xs">...</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl font-bold transition-all text-sm ${
                            safeCurrentPage === page 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                              : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
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
                      className={`w-10 h-10 rounded-xl font-bold transition-all text-sm ${
                        safeCurrentPage === page 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm flex items-center gap-2"
            >
              {t.next || 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
