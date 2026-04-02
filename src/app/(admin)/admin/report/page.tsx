'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsersRequest } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { translations } from '@/utils/translations';
import AreaChart from '@/components/charts/AreaChart';
import DonutChart from '@/components/charts/DonutChart';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { Users, CheckCircle2, Zap, Star, AlertTriangle, Hourglass } from 'lucide-react';

export default function AdminReport() {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);
  const { language } = useAppSelector(state => state.settings);
  const t = translations[language].admin;

  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [dauTimeframe, setDauTimeframe] = useState<'week' | 'month'>('week');

  useEffect(() => {
    dispatch(fetchUsersRequest());
    dispatch(fetchCoursesRequest());
    
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
  }, [dispatch]);

  const {
    totalLearners,
    completionRate,
    velocity,
    satisfaction,
    dauData,
    popularity,
    attentionNeeded,
    stalledStats
  } = useMemo(() => {
    const learners = users.filter(u => u.role !== 'admin');
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
      .slice(0, 3);

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

  if (loadingProgress || courses.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Report</h1>
        <p className="text-slate-500 mt-1">Platform analytics and engagement performance</p>
      </header>

      {/* ─── Top 4 Metric Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Learners</h3>
            <span className="text-indigo-500 bg-indigo-50 p-2 rounded-xl"><Users size={18} /></span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">{totalLearners.toLocaleString()}</p>
              <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                ↗ +12% <span className="text-slate-400 font-medium">this month</span>
              </p>
            </div>
            <div className="flex items-end gap-1 h-8 opacity-60">
              <div className="w-2 h-3 bg-indigo-200 rounded-sm"></div>
              <div className="w-2 h-4 bg-indigo-300 rounded-sm"></div>
              <div className="w-2 h-5 bg-indigo-400 rounded-sm"></div>
              <div className="w-3 h-8 bg-indigo-600 rounded-sm"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform-wide Completion</h3>
            <span className="text-emerald-500 bg-emerald-50 p-2 rounded-xl"><CheckCircle2 size={18} /></span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">{completionRate}%</p>
              <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                ^ Above target
              </p>
            </div>
            <div className="flex items-end gap-1 h-8 opacity-60">
              <div className="w-2 h-3 bg-emerald-200 rounded-sm"></div>
              <div className="w-2 h-4 bg-emerald-300 rounded-sm"></div>
              <div className="w-3 h-8 bg-emerald-600 rounded-sm"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enrollment Velocity</h3>
            <span className="text-amber-600 bg-amber-50 p-2 rounded-xl"><Zap size={18} /></span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">{velocity}</p>
              <p className="text-xs font-bold text-amber-600 mt-2 flex items-center gap-1">
                ⚡ Daily avg
              </p>
            </div>
            <div className="flex items-end gap-1 h-8 opacity-60">
               <div className="w-3 h-6 bg-amber-600 rounded-sm"></div>
               <div className="w-2 h-3 bg-amber-200 rounded-sm"></div>
               <div className="w-2 h-4 bg-amber-300 rounded-sm"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Satisfaction</h3>
            <span className="text-violet-500 bg-violet-50 p-2 rounded-xl"><Star size={18} /></span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">{satisfaction}</p>
              <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                👍 Top 1% EdTech
              </p>
            </div>
            <div className="flex items-end gap-1 h-8 opacity-60">
               <div className="w-2 h-4 bg-violet-300 rounded-sm"></div>
               <div className="w-3 h-8 bg-violet-600 rounded-sm"></div>
               <div className="w-2 h-6 bg-violet-400 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Middle Section: DAU Chart & Heatmap ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daily Active Users (DAU)</h2>
              <p className="text-sm text-slate-500 mt-1">Weekly engagement performance across all regions</p>
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
                Week
              </button>
              <button 
                onClick={() => setDauTimeframe('month')}
                className={`w-[70px] py-1.5 text-xs font-bold relative z-10 transition-colors ${dauTimeframe === 'month' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Month
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-[240px] mt-4 flex items-end">
             <AreaChart data={dauData} height={260} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Popularity Heatmap</h2>
          <div className="space-y-6 flex-1">
            {popularity.map((course, i) => {
              const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-500'];
              const bgColors = ['bg-indigo-100', 'bg-emerald-100', 'bg-amber-100', 'bg-violet-100'];
              const color = colors[i % colors.length];
              const bgColor = bgColors[i % bgColors.length];
              
              return (
                <div key={course.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-700 truncate max-w-[70%]">{course.title}</span>
                    <span className="font-bold text-slate-900">{course.percent}% <span className="text-slate-400 font-medium font-normal text-xs">Assigned</span></span>
                  </div>
                  <div className={`w-full h-2.5 ${bgColor} rounded-full overflow-hidden`}>
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${course.percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
             <p className="text-sm text-indigo-800">
               <span className="font-bold text-indigo-600">Insight:</span> "{popularity[0]?.title}" enrollment is up by 15% following the Q3 update.
             </p>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Attention Needed & Stalled Learners ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                <AlertTriangle size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900">Attention Needed</h2>
               <p className="text-sm text-slate-500 mt-1">Courses with ratings below 3.5</p>
             </div>
          </div>

          <div className="space-y-4">
            {attentionNeeded.length === 0 ? (
               <div className="p-8 text-center text-slate-400 italic">All courses are performing well!</div>
            ) : (
                attentionNeeded.map((course) => (
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
                      Revise
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
               <h2 className="text-xl font-bold text-slate-900">Stalled Learners</h2>
               <p className="text-sm text-slate-500 mt-1">Inactive for 7+ days</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 py-6">
             <div className="relative">
               <DonutChart 
                 percentage={stalledStats.percent} 
                 size={160} 
                 strokeWidth={14} 
                 color="#A16207"
                 label={`${stalledStats.percent}%`}
                 sublabel="COHORT AVERAGE"
               />
             </div>
             
             <div className="space-y-4">
                <div>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-amber-700"></span>
                       <span className="font-medium text-slate-700">Stalled ({stalledStats.stalled.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                       <span className="font-medium text-slate-500">Active ({stalledStats.active.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2.5 px-4 rounded-xl border border-amber-200 transition-colors shadow-sm text-sm">
                  Send Nudge
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
