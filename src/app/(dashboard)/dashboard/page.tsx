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
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';

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
    // We only fetch progress here. 
    // Courses and Training Plans are now handled globally by DataSyncProvider.
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
  const discoverPlans = trainingPlans.filter(tp => !assignedPlanIds.includes(tp.id));
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
    <div className={UI_COMPONENTS.pageContainer}>
      {/* ─── Welcome Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-[24px] bg-slate-900 p-8 md:p-10 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/40 via-slate-900/0 to-transparent -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-hidden">
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2 truncate">
                {new Date().toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-IN', 
                  { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white truncate">
                {isNewUser ? `${t.hello}, ${firstName}!` : `${t.welcome}, ${firstName}!`}
              </h1>
              <p className="text-slate-400 text-lg max-w-lg truncate">{t.subtitle}</p>
            </div>
            {continueLearning.length > 0 && (
              <Link
                href={`/dashboard/courses/${continueLearning[0].id}`}
                className="flex items-center gap-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/25 transition-all group shrink-0 max-w-full overflow-hidden"
              >
                <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                  <ProgressRing percentage={continueLearning[0].progress} size={48} strokeWidth={4} showLabel={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate">{t.continue || 'Continue Learning'}</p>
                  <p className="font-bold text-white truncate md:max-w-[180px] lg:max-w-[200px]">{continueLearning[0].title}</p>
                  <p className="text-xs text-slate-400 truncate">{continueLearning[0].progress}% complete</p>
                </div>
                <ArrowRight className="shrink-0 group-hover:translate-x-1 transition-transform" size={24} />
              </Link>
            )}
          </div>
        </div>
      </div>



      {/* ─── Charts Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Completion Overview */}
        <div className={UI_COMPONENTS.card}>
          <h3 className={TYPOGRAPHY.h2}>{t.completionOverview || 'Completion Overview'}</h3>
          <p className={`${TYPOGRAPHY.body} mb-6`}>{t.completionOverviewSub || 'Your overall course completion rate'}</p>
          <div className="flex flex-col sm:flex-row items-center gap-6 xl:gap-8">
            <div className="shrink-0">
              <DonutChart
                percentage={stats.completionRate}
                size={160}
                strokeWidth={14}
                label={t.completionRate || "Completed"}
                sublabel={`${stats.completed} of ${stats.enrolled}`}
              />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3 w-full min-w-0">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <span className="text-sm font-medium text-slate-600 truncate" title={t.stats?.completed || 'Completed'}>
                    {t.stats?.completed || 'Completed'}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 pl-2">{stats.completed}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0"></div>
                  <span className="text-sm font-medium text-slate-600 truncate" title={t.stats?.inProgress || 'In Progress'}>
                    {t.stats?.inProgress || 'In Progress'}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 pl-2">{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></div>
                  <span className="text-sm font-medium text-slate-600 truncate" title={t.notStarted || 'Not Started'}>
                    {t.notStarted || 'Not Started'}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 pl-2">{stats.enrolled - stats.completed - stats.inProgress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart - Weekly Activity (Only if real data exists) */}
        {!weeklyData.every(d => d.value === 0) && (
          <div className={UI_COMPONENTS.card}>
            <h3 className={TYPOGRAPHY.h2}>{t.weeklyActivity || 'Weekly Activity'}</h3>
            <p className={`${TYPOGRAPHY.body} mb-6`}>{t.weeklyActivitySub || 'Videos watched per day this week'}</p>
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
              <h2 className={TYPOGRAPHY.h1}>{t.continue || 'Continue Learning'}</h2>
              <p className={`${TYPOGRAPHY.body} mt-1`}>{t.continueSub || 'Pick up where you left off'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {continueLearning.slice(0, 3).map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden group flex-row hover:border-primary-300`}
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
                    <p className="font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{course.title}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{course.instructor}</p>
                    <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ProgressRing percentage={course.progress} size={48} strokeWidth={4} />
                  </div>
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
            <h2 className={TYPOGRAPHY.h1}>{adminT?.assignedTrainingPlans || 'Assigned Training Plans'}</h2>
            {assignedPlans.length > 3 && (
              <button 
                onClick={() => setShowAllPlans(!showAllPlans)}
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
              >
                {showAllPlans ? 'Show Less' : t.viewAll}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllPlans ? assignedPlans : assignedPlans.slice(0, 3)).map((plan) => (
              <Link href={`/training-plans/${plan.id}`} key={plan.id} className="block group h-full">
                <div className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden h-full flex-col`}>
                  <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                    {plan.image ? (
                      <img src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ClipboardList size={48} className="text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-bold rounded-full shadow-sm">
                        {plan.courseIds?.length || 0} {adminT?.courses || 'Courses'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">{plan.name}</h3>
                    <p className={`${TYPOGRAPHY.body} mb-4 line-clamp-2 flex-1`}>{plan.description}</p>
                    <span className="text-sm font-bold text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all mt-auto">
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
            <h2 className={TYPOGRAPHY.h1}>{t.myCourses}</h2>
            {enrolledCourses.length > 3 && (
              <button 
                onClick={() => setShowAllEnrolled(!showAllEnrolled)}
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
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
          <h2 className={TYPOGRAPHY.h1}>{t.discover}</h2>
          {discoverCourses.length > 3 && (
            <button 
              onClick={() => setShowAllDiscover(!showAllDiscover)}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
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
          <div className={UI_COMPONENTS.emptyStateCard}>
            <p className={`${TYPOGRAPHY.body} font-medium`}>{t.noNewCourses}</p>
          </div>
        )}
      </section>

      {/* ─── Saved Courses ─── */}
      {savedCourses.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className={TYPOGRAPHY.h1}>{t.savedCourses}</h2>
            {savedCourses.length > 3 && (
              <button 
                onClick={() => setShowAllSaved(!showAllSaved)}
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
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
