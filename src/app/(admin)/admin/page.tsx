'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsersRequest } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { useTranslation } from 'react-i18next';
import { hasPermission } from '@/lib/permissions';
import AreaChart from '@/components/charts/AreaChart';
import DonutChart from '@/components/charts/DonutChart';
import MiniBarChart from '@/components/charts/MiniBarChart';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  DollarSign, 
  BarChart2, 
  Award,
  AlertTriangle,
  Hourglass,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);
  const { trainingPlans } = useAppSelector(state => state.trainingPlans);
  const { user, role, permissions } = useAppSelector(state => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const canManageUsers = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'users_read'));

  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [dauTimeframe, setDauTimeframe] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (users.length === 0) dispatch(fetchUsersRequest());
    if (courses.length === 0) dispatch(fetchCoursesRequest());
    if (trainingPlans.length === 0) dispatch(fetchTrainingPlansRequest());

    const fetchGlobalProgress = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'userProgress'));
        const progressDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProgress(progressDocs);
      } catch (error) {
        console.error("Error fetching global progress:", error);
      } finally {
        setLoadingProgress(false);
      }
    };
    
    fetchGlobalProgress();
  }, [dispatch, users.length, courses.length, trainingPlans.length]);

  const dashboardStats = useMemo(() => {
    const totalUsers = users.filter(u => u.role !== 'admin' && u.role !== 'staff').length;
    const totalCourses = courses.length;
    const totalPlans = trainingPlans.length;

    const learnerIds = new Set(users.filter(u => u.role !== 'admin' && u.role !== 'staff').map(u => u.id));

    const totalRevenue = courses.reduce((sum, course) => {
      const enrollments = course.enrolledUsers?.filter(id => learnerIds.has(id)).length || 0;
      return sum + (course.price * enrollments);
    }, 0);

    const planRevenue: Record<string, number> = {};
    trainingPlans.forEach(tp => { 
      const planValue = (tp.courseIds || []).reduce((sum, cId) => {
        const course = courses.find(c => c.id === cId);
        return sum + (course?.price || 0);
      }, 0);
      
      const learners = users.filter(u => u.role !== 'admin' && u.role !== 'staff');
      const assignments = learners.filter(u => u.assignedTrainingPlans?.includes(tp.id)).length;
      planRevenue[tp.id] = planValue * assignments;
    });
    
    const sortedPlans = [...trainingPlans].sort((a, b) => (planRevenue[b.id] || 0) - (planRevenue[a.id] || 0));
    const topPlanName = sortedPlans[0] ? `${sortedPlans[0].name} ($${planRevenue[sortedPlans[0].id].toLocaleString()})` : 'None';
    const topPlansData = sortedPlans.slice(0, 5).map(p => ({
      name: p.name,
      value: planRevenue[p.id] || 0
    }));

    const sortedCourses = [...courses].sort((a, b) => {
        const countA = a.enrolledUsers?.filter(id => learnerIds.has(id)).length || 0;
        const countB = b.enrolledUsers?.filter(id => learnerIds.has(id)).length || 0;
        return countB - countA;
    });
    const topCourseName = sortedCourses[0]?.title || 'None';
    const topCoursesData = sortedCourses.slice(0, 5).map(c => ({
      name: c.title,
      value: c.enrolledUsers?.filter(id => learnerIds.has(id)).length || 0
    }));

    return { totalUsers, totalCourses, totalPlans, totalRevenue, topPlanName, topCourseName, topPlansData, topCoursesData };
  }, [users, courses, trainingPlans]);

  const reportStats = useMemo(() => {
    const learners = users.filter(u => u.role !== 'admin' && u.role !== 'staff');
    const totalLearners = learners.length;

    let totalCompletionSum = 0;
    let completionCount = 0;
    
    allProgress.forEach(progress => {
      const course = courses.find(c => c.id === progress.courseId);
      if (course && course.videos && course.videos.length > 0) {
        let totalWatched = 0;
        let totalDuration = 0;
        
        course.videos.forEach((video: any, idx: number) => {
          const vidId = `video_${idx}`;
          const duration = video.duration || 100;
          const watched = progress.watchedDurations?.[vidId] || 0;
          const isCompleted = progress.completedVideos?.includes(vidId);
          
          totalDuration += duration;
          totalWatched += isCompleted ? duration : Math.min(watched, duration);
        });
        
        if (totalDuration > 0) {
          totalCompletionSum += (totalWatched / totalDuration) * 100;
          completionCount++;
        }
      }
    });
    
    const completionRate = completionCount > 0 ? Math.round(totalCompletionSum / completionCount) : 0;

    let totalEnrollments = 0;
    courses.forEach(c => { totalEnrollments += c.enrolledUsers?.length || 0; });
    const velocity = Math.ceil(totalEnrollments / 30);

    let ratingSum = 0;
    let ratingCount = 0;
    allProgress.forEach(p => {
      if (p.isRated && p.rating) {
        ratingSum += p.rating;
        ratingCount++;
      }
    });
    const satisfaction = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : '0.0';

    const dauData = [];
    const daysToLookBack = dauTimeframe === 'week' ? 6 : 29;
    
    for (let i = daysToLookBack; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const ds = d.toISOString().split('T')[0];
      
      const labelDate = new Date();
      labelDate.setDate(labelDate.getDate() - i);
      let label = labelDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      if (dauTimeframe === 'month') {
        const dd = String(labelDate.getDate()).padStart(2, '0');
        const mm = String(labelDate.getMonth() + 1).padStart(2, '0');
        label = `${mm}/${dd}`;
      }
      
      const activeUserIdsThisDay = new Set();
      allProgress.forEach(p => {
        if (p.dailyActivity && p.dailyActivity[ds]) {
          const userId = p.id?.split('_')[0];
          if (userId) activeUserIdsThisDay.add(userId);
        }
      });
      
      dauData.push({ label, value: activeUserIdsThisDay.size });
    }

    const sortedCourses = [...courses].sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0));
    const popularity = sortedCourses.slice(0, 4).map(c => {
       const enrolled = c.enrolledUsers?.length || 0;
       const percent = totalLearners > 0 ? Math.min(100, Math.round((enrolled / totalLearners) * 100)) : 0;
       return { id: c.id, title: c.title, percent };
    });

    const courseRatings: Record<string, { sum: number; count: number; title: string }> = {};
    courses.forEach(c => { courseRatings[c.id] = { sum: 0, count: 0, title: c.title }; });
    
    allProgress.forEach(p => {
      if (p.isRated && p.rating && courseRatings[p.courseId]) {
        courseRatings[p.courseId].sum += p.rating;
        courseRatings[p.courseId].count++;
      }
    });
    
    const attentionNeeded = Object.keys(courseRatings)
      .map(id => {
         const { sum, count, title } = courseRatings[id];
         const avg = count > 0 ? sum / count : 5;
         return { id, title, avg, reviews: count };
      })
      .filter(c => c.avg > 0 && c.avg < 3.5)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 10);

    const now = new Date().getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    let stalledCount = 0;
    let activeCount = 0;
    
    learners.forEach(learner => {
      if (!learner.enrolledCourses || learner.enrolledCourses.length === 0) return;
      const userProgs = allProgress.filter(p => p.id?.startsWith(learner.id + '_'));
      let isStalled = true;
      userProgs.forEach(p => {
        if (p.lastUpdated) {
          if (now - new Date(p.lastUpdated).getTime() < SEVEN_DAYS_MS) isStalled = false;
        }
      });
      if (isStalled) stalledCount++;
      else activeCount++;
    });
    
    const totalAssigned = stalledCount + activeCount;
    const stalledPercent = totalAssigned > 0 ? Math.round((stalledCount / totalAssigned) * 100) : 0;

    return { totalLearners, completionRate, velocity, satisfaction, dauData, popularity, attentionNeeded, stalledStats: { percent: stalledPercent, stalled: stalledCount, active: activeCount } };
  }, [users, courses, allProgress, dauTimeframe]);

  const isPlatformEmpty = !loadingProgress && courses.length === 0 && trainingPlans.length === 0;
  const isInitialLoading = users.length === 0 || courses.length === 0;

  if (isInitialLoading) {
    return (
      <div className={`${UI_COMPONENTS.pageContainer} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className={`${TYPOGRAPHY.body} animate-pulse`}>{t.loadingAnalytics || 'Loading analytics...'}</p>
        </div>
      </div>
    );
  }

  if (isPlatformEmpty) {
    return (
      <div className={`${UI_COMPONENTS.pageContainer} flex flex-col items-center justify-center`}>
        <div className={`${UI_COMPONENTS.card} max-w-md w-full text-center space-y-6`}>
          <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-primary-600">
            <Zap size={24} />
          </div>
          <div>
            <h1 className={`${TYPOGRAPHY.h1} mb-2`}>
              {t.welcomeEmpire || 'Welcome to your Workspace'}
            </h1>
            <p className={`${TYPOGRAPHY.body}`}>
              {t.welcomeEmpireSub || 'Your platform is currently empty. Start by creating your first course or setting up a training plan to begin tracking engagement.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <Link href="/admin/courses" className={`${BUTTONS.primary} w-full sm:w-auto`}>
              <BookOpen size={16} />
              {t.createFirstCourse || 'Create Course'}
            </Link>
            <Link href="/admin/training-plans" className={`${BUTTONS.secondary} w-full sm:w-auto`}>
              <Award size={16} />
              {t.setupTrainingPlan || 'Setup Training Plan'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${UI_COMPONENTS.pageContainer}`}>
      {role === 'admin' && (
        <>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className={`${TYPOGRAPHY.h1} mb-1`}>
                {t.performanceOverview || 'Performance Overview'}
              </h1>
              <p className={`${TYPOGRAPHY.body}`}>
                {i18nT('admin.welcomeAdmin', { name: user?.displayName || 'Admin' }) || `Welcome back, ${user?.displayName || 'Admin'}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${UI_COMPONENTS.badge}`}>
                <TrendingUp size={14} className="text-emerald-500" />
                System Healthy
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnalyticsCard 
              href="/admin/users"
              title={t.totalUsers || 'Total Users'}
              value={dashboardStats.totalUsers.toLocaleString()}
              subtext={t.totalUsersSub || 'Active enrolled learners'}
              icon={<Users size={18} />}
            />
            <AnalyticsCard 
              href="/admin/courses"
              title={t.totalCourses || 'Total Courses'}
              value={dashboardStats.totalCourses.toLocaleString()}
              subtext={t.activeLearningModules || 'Published modules'}
              icon={<BookOpen size={18} />}
            />
            <AnalyticsCard 
              href="/admin/training-plans"
              title={t.totalTrainingPlans || 'Training Plans'}
              value={dashboardStats.totalPlans.toLocaleString()}
              subtext={t.curatedPaths || 'Curated paths'}
              icon={<Award size={18} />}
            />
            <AnalyticsCard 
              href={null}
              title={t.totalRevenue || 'Total Revenue'}
              value={`$${dashboardStats.totalRevenue.toLocaleString()}`}
              subtext={t.lifetimeRevenue || 'Lifetime revenue'}
              icon={<DollarSign size={18} />}
            />
            <AnalyticsCard 
              href="/admin/top-training-plans"
              title={t.topTrainingPlansTitle || 'Top Plan'}
              value={dashboardStats.topPlanName}
              subtext={t.mostAssignedPath || 'Highest revenue generator'}
              icon={<GraduationCap size={18} />}
              chartData={dashboardStats.topPlansData}
            />
            <AnalyticsCard 
              href="/admin/top-courses"
              title={t.topCourses || 'Top Course'}
              value={dashboardStats.topCourseName}
              subtext={t.highestEnrollment || 'Most enrolled'}
              icon={<BarChart2 size={18} />}
              chartData={dashboardStats.topCoursesData}
            />
          </div>
        </>
      )}

      {/* ─── Integrated Report Sections ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAU Chart */}
        <div className={`${UI_COMPONENTS.card} lg:col-span-2`}>
          <div className={`${UI_COMPONENTS.cardHeader}`}>
            <div>
              <h2 className={`${TYPOGRAPHY.h3}`}>{t.dauTitle || 'Daily Active Users'}</h2>
              <p className={`${TYPOGRAPHY.body} text-xs mt-1`}>{t.dauSub || 'Engagement over time'}</p>
            </div>
            <div className={`${UI_COMPONENTS.segmentedControl}`}>
              <button 
                onClick={() => setDauTimeframe('week')}
                className={dauTimeframe === 'week' ? 'segmented-item-active' : 'segmented-item'}
              >
                {t.week || 'Week'}
              </button>
              <button 
                onClick={() => setDauTimeframe('month')}
                className={dauTimeframe === 'month' ? 'segmented-item-active' : 'segmented-item'}
              >
                {t.month || 'Month'}
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-[220px] flex items-end">
             <AreaChart data={reportStats.dauData} height={220} />
          </div>
        </div>

        {/* Popularity Heatmap */}
        <div className={`${UI_COMPONENTS.card}`}>
          <h2 className={`${UI_COMPONENTS.cardHeader} !mb-6 ${TYPOGRAPHY.h3}`}>{t.popularityHeatmap || 'Course Popularity'}</h2>
          <div className="space-y-5 flex-1">
            {reportStats.popularity.map((course) => (
              <div key={course.id}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[70%]">{course.title}</span>
                  <span className="text-xs font-semibold text-slate-900">{course.percent}% <span className="text-slate-400 font-normal">assigned</span></span>
                </div>
                <div className={`${UI_COMPONENTS.progressTrack}`}>
                  <div className={`${UI_COMPONENTS.progressFill}`} style={{ width: `${course.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attention Needed */}
        <div className={`${UI_COMPONENTS.card}`}>
          <div className={`${UI_COMPONENTS.cardHeader} !mb-4`}>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-md bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                  <AlertTriangle size={16} />
               </div>
               <div>
                 <h2 className={`${TYPOGRAPHY.h3}`}>{t.attentionNeeded || 'Attention Needed'}</h2>
                 <p className={`${TYPOGRAPHY.body} text-xs mt-0.5`}>{t.attentionNeededSub || 'Courses with low satisfaction'}</p>
               </div>
             </div>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 no-scrollbar">
            {reportStats.attentionNeeded.length === 0 ? (
               <div className={`py-8 text-center ${TYPOGRAPHY.body}`}>{t.allCoursesWell || 'All courses performing well.'}</div>
            ) : (
                reportStats.attentionNeeded.map((course) => (
                  <div key={course.id} className={`${UI_COMPONENTS.listRow} group`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold uppercase shrink-0 border border-slate-200">
                         {course.title.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{course.title}</h4>
                        <p className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                          <TrendingDown size={12} /> {course.avg.toFixed(1)} stars <span className="text-slate-400 font-normal">({course.reviews} reviews)</span>
                        </p>
                      </div>
                    </div>
                    <Link href={`/admin/courses`} className={`${BUTTONS.ghost} !border !border-slate-200 hover:!border-primary-200 hover:!bg-primary-50 bg-white`}>
                      {t.revise || 'Revise'}
                    </Link>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Stalled Learners */}
        <div className={`${UI_COMPONENTS.card}`}>
          <div className={`${UI_COMPONENTS.cardHeader} !mb-4`}>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                  <Hourglass size={16} />
               </div>
               <div>
                 <h2 className={`${TYPOGRAPHY.h3}`}>{t.stalledLearners || 'Stalled Learners'}</h2>
                 <p className={`${TYPOGRAPHY.body} text-xs mt-0.5`}>{t.stalledLearnersSub || 'No activity in 7 days'}</p>
               </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 py-4">
             <div className="relative">
               <DonutChart 
                 percentage={reportStats.stalledStats.percent} 
                 size={140} 
                 strokeWidth={12} 
                 color="#4F46E5"
                 sublabel={t.cohortAverage || 'Cohort Avg'}
               />
             </div>
             
             <div className="space-y-4">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between gap-6 border-b border-slate-100 pb-2">
                     <div className="flex items-center gap-2">
                       <span className="w-2.5 h-2.5 rounded-sm bg-primary-600"></span>
                       <span className="text-slate-600">{t.stalledLabel || 'Stalled'}</span>
                     </div>
                     <span className={`${TYPOGRAPHY.metric} !text-lg`}>{reportStats.stalledStats.stalled.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                     <div className="flex items-center gap-2">
                       <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>
                       <span className="text-slate-600">{t.activeLabel || 'Active'}</span>
                     </div>
                     <span className={`${TYPOGRAPHY.metric} !text-lg`}>{reportStats.stalledStats.active.toLocaleString()}</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsCardProps {
  href: string | null;
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  chartData?: { name: string, value: number }[];
}

function AnalyticsCard({ href, title, value, subtext, icon, chartData }: AnalyticsCardProps) {
  const CardContent = (
    <>
      <div className="flex justify-between items-start mb-3">
        <h3 className={`${TYPOGRAPHY.label}`}>{title}</h3>
        <div className="text-slate-400">
          {icon}
        </div>
      </div>
      
      <div>
        <div className={`${TYPOGRAPHY.metric} truncate`} title={String(value)}>
          {value}
        </div>
        
        {chartData && chartData.length > 0 && (
          <div className="mt-3 opacity-80 mix-blend-multiply">
             <MiniBarChart data={chartData} color="#4F46E5" />
          </div>
        )}
        
        <p className={`${TYPOGRAPHY.body} !text-xs flex items-center gap-1 ${chartData ? 'mt-3' : 'mt-2'}`}>
          {subtext}
        </p>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className={`${UI_COMPONENTS.card}`}>
        {CardContent}
      </div>
    );
  }

  return (
    <Link href={href} className={`${UI_COMPONENTS.cardInteractive}`}>
      {CardContent}
    </Link>
  );
}
