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
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Star,
  AlertTriangle,
  Hourglass,
  PieChart
} from 'lucide-react';
import Link from 'next/link';

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
      // If we already have some progress data and we're just navigating back, 
      // we can skip the heavy fetch or do it silently
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
    // 1. Total Users (Excluding admins)
    const totalUsers = users.filter(u => u.role !== 'admin' && u.role !== 'staff').length;

    // 2. Total Courses
    const totalCourses = courses.length;

    // 3. Total Training Plans
    const totalPlans = trainingPlans.length;

    // Filtered learner IDs for accurate enrollment counts
    const learnerIds = new Set(users.filter(u => u.role !== 'admin' && u.role !== 'staff').map(u => u.id));

    // 4. Total Revenue (Sum of course.price * learner enrollment count)
    const totalRevenue = courses.reduce((sum, course) => {
      const enrollments = course.enrolledUsers?.filter(id => learnerIds.has(id)).length || 0;
      return sum + (course.price * enrollments);
    }, 0);

    // 5. Top Training Plans (By Revenue)
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

    // 6. Top Courses (Learner enrolled count only)
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

    return {
      totalUsers,
      totalCourses,
      totalPlans,
      totalRevenue,
      topPlanName,
      topCourseName,
      topPlansData,
      topCoursesData
    };
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
    courses.forEach(c => {
       totalEnrollments += c.enrolledUsers?.length || 0;
    });
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
          const lastUpdateDate = new Date(p.lastUpdated).getTime();
          if (now - lastUpdateDate < SEVEN_DAYS_MS) {
            isStalled = false;
          }
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

  // Optimization: Only show full-page loading if we have absolutely no data yet.
  // If we have courses/users/plans but progress is still loading, we can show the dashboard
  // with a small loading indicator for specific charts if needed.
  const isInitialLoading = users.length === 0 || courses.length === 0;

  if (isInitialLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">{t.loadingAnalytics}</p>
        </div>
      </div>
    );
  }

  if (isPlatformEmpty) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <header className="w-full max-w-4xl relative overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-10 md:p-16 text-white mb-12 shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl"></div>
          
          <div className="relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
              {t.welcomeEmpire}
            </h1>
            <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto opacity-90 leading-relaxed mb-10">
              {t.welcomeEmpireSub}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/admin/courses"
                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <BookOpen size={20} />
                {t.createFirstCourse}
              </Link>
              <Link 
                href="/admin/training-plans"
                className="w-full sm:w-auto px-8 py-4 bg-indigo-500/20 border border-white/30 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <Award size={20} />
                {t.setupTrainingPlan}
              </Link>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Zap size={32} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{t.interactiveDashboard}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.interactiveDashboardDesc}</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <BarChart2 size={32} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{t.trackProgress}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.trackProgressDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-5">
      {role === 'admin' && (
        <>
          <header className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-400 via-indigo-400 to-violet-700 p-8 md:p-10 text-white mb-6 shadow-xl shadow-indigo-100">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                {t.performanceOverview}
              </h1>
              <p className="text-indigo-100 text-lg max-w-2xl opacity-90">
                {i18nT('admin.welcomeAdmin', { name: user?.displayName || 'Admin' })}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnalyticsCard 
              href="/admin/users"
              title={t.totalUsers}
              value={dashboardStats.totalUsers.toLocaleString()}
              subtext={t.totalUsersSub}
              icon={<Users size={24} />}
              color="indigo"
            />
            <AnalyticsCard 
              href="/admin/courses"
              title={t.totalCourses}
              value={dashboardStats.totalCourses.toLocaleString()}
              subtext={t.activeLearningModules}
              icon={<BookOpen size={24} />}
              color="emerald"
            />
            <AnalyticsCard 
              href="/admin/training-plans"
              title={t.totalTrainingPlans}
              value={dashboardStats.totalPlans.toLocaleString()}
              subtext={t.curatedPaths}
              icon={<Award size={24} />}
              color="amber"
            />
            <AnalyticsCard 
              href={null}
              title={t.totalRevenue}
              value={`$${dashboardStats.totalRevenue.toLocaleString()}`}
              subtext={t.lifetimeRevenue}
              icon={<DollarSign size={24} />}
              color="rose"
            />
            <AnalyticsCard 
              href="/admin/top-training-plans"
              title={t.topTrainingPlansTitle}
              value={dashboardStats.topPlanName}
              subtext={t.mostAssignedPath}
              icon={<GraduationCap size={24} />}
              color="violet"
              chartData={dashboardStats.topPlansData}
            />
            <AnalyticsCard 
              href="/admin/top-courses"
              title={t.topCourses}
              value={dashboardStats.topCourseName}
              subtext={t.highestEnrollment}
              icon={<BarChart2 size={24} />}
              color="sky"
              chartData={dashboardStats.topCoursesData}
            />
          </div>
        </>
      )}

      {/* ─── Integrated Report Sections ─── */}
      <div className="space-y-8">
        {/* Charts & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.dauTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.dauSub}</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-full cursor-pointer transition-colors relative">
                <div 
                  className={`absolute top-1 bottom-1 w-[70px] bg-white rounded-full shadow-sm transition-all duration-300 ease-out z-0`}
                  style={{ left: dauTimeframe === 'week' ? '4px' : '76px' }}
                />
                <button 
                  onClick={() => setDauTimeframe('week')}
                  className={`w-[70px] py-1.5 text-xs font-bold relative z-10 transition-colors ${dauTimeframe === 'week' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.week}
                </button>
                <button 
                  onClick={() => setDauTimeframe('month')}
                  className={`w-[70px] py-1.5 text-xs font-bold relative z-10 transition-colors ${dauTimeframe === 'month' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.month}
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[180px] mt-4 flex items-end">
               <AreaChart data={reportStats.dauData} height={200} />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{t.popularityHeatmap}</h2>
            <div className="space-y-6 flex-1">
              {reportStats.popularity.map((course, i) => {
                const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-500'];
                const bgColors = ['bg-indigo-100', 'bg-emerald-100', 'bg-amber-100', 'bg-violet-100'];
                const color = colors[i % colors.length];
                const bgColor = bgColors[i % bgColors.length];
                
                return (
                  <div key={course.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-slate-700 truncate max-w-[70%]">{course.title}</span>
                      <span className="font-bold text-slate-900">{course.percent}% <span className="text-slate-400 font-normal text-xs ml-1">{t.assigned}</span></span>
                    </div>
                    <div className={`w-full h-2.5 ${bgColor} rounded-full overflow-hidden`}>
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${course.percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Attention & Stalled */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                  <AlertTriangle size={20} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-900">{t.attentionNeeded}</h2>
                 <p className="text-sm text-slate-500 mt-1">{t.attentionNeededSub}</p>
               </div>
            </div>

            <div className="space-y-4 max-h-[230px] overflow-y-auto pr-1 no-scrollbar">
              <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              {reportStats.attentionNeeded.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 italic">{t.allCoursesWell}</div>
              ) : (
                  reportStats.attentionNeeded.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase shrink-0">
                           {course.title.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                          <p className="text-xs text-rose-500 font-bold mt-1">
                            {course.avg.toFixed(1)} stars <span className="text-slate-400 font-normal ml-1">• {course.reviews} reviews</span>
                          </p>
                        </div>
                      </div>
                      <Link href={`/admin/courses`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-4 py-2 hover:bg-indigo-50 rounded-lg">
                        {t.revise}
                      </Link>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                  <Hourglass size={20} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-900">{t.stalledLearners}</h2>
                 <p className="text-sm text-slate-500 mt-1">{t.stalledLearnersSub}</p>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 py-6">
               <div className="relative">
                 <DonutChart 
                   percentage={reportStats.stalledStats.percent} 
                   size={160} 
                   strokeWidth={14} 
                   color="#A16207"
                   sublabel={t.cohortAverage}
                 />
               </div>
               
               <div className="space-y-4">
                  <div>
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex items-center gap-2">
                         <span className="w-3 h-3 rounded-full bg-amber-700"></span>
                         <span className="font-medium text-slate-700">{t.stalledLabel} ({reportStats.stalledStats.stalled.toLocaleString()})</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                         <span className="font-medium text-slate-500">{t.activeLabel} ({reportStats.stalledStats.active.toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                  {canManageUsers && (
                    <button className="w-full mt-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2.5 px-4 rounded-xl border border-amber-200 transition-colors shadow-sm text-sm">
                      {t.sendNudge}
                    </button>
                  )}
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
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';
  chartData?: { name: string, value: number }[];
}

function AnalyticsCard({ href, title, value, subtext, icon, color, chartData }: AnalyticsCardProps) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600'
  };

  const CardContent = (
    <>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${colorMap[color]}`}>
          {icon}
        </div>
        {href && (
          <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all text-slate-400">
            <ArrowUpRight size={20} />
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
        <div className="text-2xl font-black text-slate-900 truncate" title={String(value)}>
          {value}
        </div>
        
        {chartData && chartData.length > 0 && (
          <div className="mt-1">
             <MiniBarChart data={chartData} color={color === 'violet' ? '#8b5cf6' : color === 'sky' ? '#0ea5e9' : '#4f46e5'} />
          </div>
        )}
        
        <p className={`text-xs text-slate-400 font-medium flex items-center gap-1 ${chartData ? 'mt-3' : 'mt-2'}`}>
          {subtext}
        </p>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
        {CardContent}
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
    >
      {CardContent}
    </Link>
  );
}
