'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { translations } from '@/utils/translations';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import CourseCard from '@/components/common/CourseCard';
import ProgressRing from '@/components/charts/ProgressRing';

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
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
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

        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchCourses || 'Search your courses...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            🧩
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            📋
          </button>
        </div>
      </div>

      {/* Course Content */}
      {coursesLoading && enrolledCourses.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-50 rounded-3xl h-80 animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
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
                  {filteredCourses.map(course => {
                    const pct = getCourseProgress(course);
                    const status = pct >= 100 ? 'completed' : pct > 0 ? 'in-progress' : 'not-started';
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                              {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : '📚'}
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
                            {status === 'completed' ? '✅ Completed' : status === 'in-progress' ? '🔄 In Progress' : '⏸️ Not Started'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/courses/${course.id}`}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                          >
                            {pct > 0 ? (t.continue || 'Continue') : (t.viewCourse || 'Start')} →
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
          <div className="text-5xl mb-4">{activeTab === 'completed' ? '🎓' : activeTab === 'in-progress' ? '📖' : '📚'}</div>
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
              <span>🔍</span> {t.discover || 'Browse Courses'}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
