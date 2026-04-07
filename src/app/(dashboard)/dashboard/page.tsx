'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import CourseCard from '@/components/common/CourseCard';
import DonutChart from '@/components/charts/DonutChart';
import BarChart from '@/components/charts/BarChart';
import ProgressRing from '@/components/charts/ProgressRing';
import { ArrowRight, BookOpen, ClipboardList } from 'lucide-react';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user, isNewUser } = useAppSelector((state) => state.auth);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  const { trainingPlans, loading: trainingPlansLoading } = useAppSelector((state) => state.trainingPlans);
  const { progress } = useAppSelector((state) => state.progress);
  const { t: i18nT, i18n } = useTranslation();
  const t = i18nT('dashboard', { returnObjects: true }) as any;
  const adminT = i18nT('admin', { returnObjects: true }) as any;
  const language = i18n.language;

  const [showAllEnrolled, setShowAllEnrolled] = useState(false);
  const [showAllDiscover, setShowAllDiscover] = useState(false);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);

  useEffect(() => {
    dispatch(fetchCoursesRequest());
    if (user?.assignedTrainingPlans?.length) {
      dispatch(fetchTrainingPlansRequest());
    }
  }, [dispatch, user?.assignedTrainingPlans]);

  // Fetch progress for all enrolled courses
  useEffect(() => {
    if (user?.uid && user?.enrolledCourses?.length) {
      user.enrolledCourses.forEach(courseId => {
        if (!progress[courseId]) {
          dispatch({ type: 'progress/fetchProgressRequest', payload: { userId: user.uid, courseId } });
        }
      });
    }
  }, [dispatch, user?.uid, user?.enrolledCourses, progress]);

  const firstName = user?.displayName?.split(' ')[0] || 'Learner';

  // Training plan data
  const assignedPlanIds = user?.assignedTrainingPlans || [];
  const assignedPlans = trainingPlans.filter(tp => assignedPlanIds.includes(tp.id));
  const planCourseIds = new Set(assignedPlans.flatMap(tp => tp.courseIds || []));

  // Course categories
  const availableCourses = courses.filter(c => 
    c.visibility !== 'private' || planCourseIds.has(c.id) || user?.enrolledCourses?.includes(c.id)
  );
  const enrolledCourses = courses.filter(c => user?.enrolledCourses?.includes(c.id));
  const savedCourses = availableCourses.filter(c => user?.savedCourses?.includes(c.id));
  const discoverCourses = availableCourses.filter(c => !user?.enrolledCourses?.includes(c.id));

  // Calculate progress for a course
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

  // Computed stats
  const stats = useMemo(() => {
    const completedCourses = enrolledCourses.filter(c => getCourseProgress(c) >= 100);
    const inProgressCourses = enrolledCourses.filter(c => {
      const p = getCourseProgress(c);
      return p > 0 && p < 100;
    });
    
    // Real platform-wide learning time (Actual sum of watched durations)
    let totalSecondsWatched = 0;
    enrolledCourses.forEach(c => {
      const courseProgress = progress[c.id];
      if (courseProgress && courseProgress.watchedDurations) {
        Object.values(courseProgress.watchedDurations).forEach(duration => {
          totalSecondsWatched += duration;
        });
      }
    });

    const hours = Math.floor(totalSecondsWatched / 3600);
    const minutes = Math.floor((totalSecondsWatched % 3600) / 60);
    const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const completionRate = enrolledCourses.length > 0
      ? Math.round((completedCourses.length / enrolledCourses.length) * 100)
      : 0;

    return {
      enrolled: enrolledCourses.length,
      completed: completedCourses.length,
      inProgress: inProgressCourses.length,
      timeFormatted,
      completionRate,
    };
  }, [enrolledCourses, progress]);

  // Weekly activity data (Derived from real progress data)
  const weeklyData = useMemo(() => {
    const result: { dateStr: string; label: string; value: number }[] = [];
    const now = new Date();
    
    // Create buckets for the last 7 days ending today (UTC-based to match activity logs)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const ds = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const labelDate = new Date();
      labelDate.setDate(labelDate.getDate() - i);
      const label = labelDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      result.push({
        dateStr: ds,
        label,
        value: 0
      });
    }

    // Tally activity from persistent daily logs (Only for enrolled courses)
    const enrolledIds = new Set(user?.enrolledCourses || []);
    
    Object.values(progress).forEach((courseProgress) => {
      if (!courseProgress.dailyActivity || !enrolledIds.has(courseProgress.courseId)) return;
      
      Object.entries(courseProgress.dailyActivity).forEach(([dateStr, videoIds]) => {
        // Find bucket matching the YYYY-MM-DD dateStr
        const dayBucket = result.find(r => r.dateStr === dateStr);
        if (dayBucket) {
          dayBucket.value += (videoIds as string[]).length;
        }
      });
    });

    return result.map(r => ({ label: r.label, value: r.value }));
  }, [progress, user?.enrolledCourses]);

  // Continue learning - courses in progress (Sorted by last accessed time)
  const continueLearning = enrolledCourses
    .map(c => ({ 
      ...c, 
      progress: getCourseProgress(c),
      lastUpdated: progress[c.id]?.lastUpdated || '1970-01-01T00:00:00.000Z'
    }))
    .filter(c => c.progress > 0 && c.progress < 100)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return (
    <div className="space-y-10 pb-16">
      {/* ─── Welcome Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-400 via-indigo-400 to-violet-700 p-8 md:p-10 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1">
                {new Date().toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-IN', 
                  { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">
                {isNewUser ? `${t.hello}, ${firstName}!` : `${t.welcome}, ${firstName}!`}
              </h1>
              <p className="text-indigo-200 text-lg max-w-lg">{t.subtitle}</p>
            </div>
            {continueLearning.length > 0 && (
              <Link
                href={`/dashboard/courses/${continueLearning[0].id}`}
                className="flex items-center gap-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/25 transition-all group shrink-0"
              >
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <ProgressRing percentage={continueLearning[0].progress} size={48} strokeWidth={4} showLabel={false} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">{t.continue || 'Continue Learning'}</p>
                  <p className="font-bold text-white truncate max-w-[180px]">{continueLearning[0].title}</p>
                  <p className="text-xs text-indigo-200">{continueLearning[0].progress}% complete</p>
                </div>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
              </Link>
            )}
          </div>
        </div>
      </div>



      {/* ─── Charts Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Completion Overview */}
        <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">{t.completionOverview || 'Completion Overview'}</h3>
          <p className="text-sm text-slate-400 mb-6">{t.completionOverviewSub || 'Your overall course completion rate'}</p>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <DonutChart
              percentage={stats.completionRate}
              size={180}
              strokeWidth={16}
              label={t.completionRate || "Completed"}
              sublabel={`${stats.completed} of ${stats.enrolled}`}
            />
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></div>
                <span className="text-sm font-medium text-slate-700 flex-1">{t.stats?.completed || 'Completed'}</span>
                <span className="text-sm font-bold text-emerald-600">{stats.completed}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0"></div>
                <span className="text-sm font-medium text-slate-700 flex-1">{t.stats?.inProgress || 'In Progress'}</span>
                <span className="text-sm font-bold text-indigo-600">{stats.inProgress}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0"></div>
                <span className="text-sm font-medium text-slate-700 flex-1">{t.notStarted || 'Not Started'}</span>
                <span className="text-sm font-bold text-slate-500">{stats.enrolled - stats.completed - stats.inProgress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart - Weekly Activity (Only if real data exists) */}
        {!weeklyData.every(d => d.value === 0) && (
          <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.weeklyActivity || 'Weekly Activity'}</h3>
            <p className="text-sm text-slate-400 mb-6">{t.weeklyActivitySub || 'Videos watched per day this week'}</p>
            <BarChart
              data={weeklyData}
              height={180}
              emptyLabel={t.noActivityYet || 'Enroll in a course to start tracking!'}
            />
          </div>
        )}
      </div>

      {/* ─── Continue Learning ─── */}
      {continueLearning.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{t.continue || 'Continue Learning'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.continueSub || 'Pick up where you left off'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {continueLearning.slice(0, 3).map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all group flex"
              >
                <div className="w-28 shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <BookOpen size={32} className="text-slate-300" />
                  )}
                </div>
                <div className="p-5 flex-1 flex items-center gap-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{course.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{course.instructor}</p>
                    <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <ProgressRing percentage={course.progress} size={48} strokeWidth={4} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Assigned Training Plans ─── */}
      {assignedPlans.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{adminT?.assignedTrainingPlans || 'Assigned Training Plans'}</h2>
            {assignedPlans.length > 3 && (
              <button 
                onClick={() => setShowAllPlans(!showAllPlans)}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                {showAllPlans ? 'Show Less' : t.viewAll}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllPlans ? assignedPlans : assignedPlans.slice(0, 3)).map((plan) => (
              <Link href={`/training-plans/${plan.id}`} key={plan.id} className="block group">
                <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-slate-100 group-hover:shadow-xl transition-all h-full flex flex-col">
                  <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                    {plan.image ? (
                      <img src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ClipboardList size={48} className="text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold rounded-full shadow-sm">
                        {plan.courseIds?.length || 0} {adminT?.courses || 'Courses'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{plan.name}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{plan.description}</p>
                    <span className="text-sm font-bold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all mt-auto">
                      View Plan <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── My Courses ─── */}
      {enrolledCourses.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{t.myCourses}</h2>
            {enrolledCourses.length > 3 && (
              <button 
                onClick={() => setShowAllEnrolled(!showAllEnrolled)}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                {showAllEnrolled ? 'Show Less' : t.viewAll}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllEnrolled ? enrolledCourses : enrolledCourses.slice(0, 3)).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Discover Courses ─── */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{t.discover}</h2>
          {discoverCourses.length > 3 && (
            <button 
              onClick={() => setShowAllDiscover(!showAllDiscover)}
              className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              {showAllDiscover ? 'Show Less' : t.viewAll}
            </button>
          )}
        </div>
        {coursesLoading && courses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 rounded-3xl h-80 animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : discoverCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllDiscover ? discoverCourses : discoverCourses.slice(0, 3)).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">{t.noNewCourses}</p>
          </div>
        )}
      </section>

      {/* ─── Saved Courses ─── */}
      {savedCourses.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{t.savedCourses}</h2>
            {savedCourses.length > 3 && (
              <button 
                onClick={() => setShowAllSaved(!showAllSaved)}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                {showAllSaved ? 'Show Less' : t.viewAll}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllSaved ? savedCourses : savedCourses.slice(0, 3)).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
