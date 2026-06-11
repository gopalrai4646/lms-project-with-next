'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { useTranslation } from 'react-i18next';
import { Users, BookOpen, DollarSign, AlertTriangle, Hourglass, TrendingDown } from 'lucide-react';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import DonutChart from '@/components/charts/DonutChart';
import Link from 'next/link';

export default function TeacherDashboard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { courses, loading } = useAppSelector(state => state.courses);
  const { t: i18nT } = useTranslation();
  const t = i18nT('teacher', { returnObjects: true }) as any;

  const [isMounted, setIsMounted] = useState(false);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    if (courses.length === 0) dispatch(fetchCoursesRequest());

    const fetchGlobalProgress = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'userProgress'));
        const progressDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProgress(progressDocs);
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoadingProgress(false);
      }
    };
    
    fetchGlobalProgress();
  }, [dispatch, courses.length]);

  // Filter courses created by this teacher
  const myCourses = useMemo(() => courses.filter(c => c.createdBy === user?.uid), [courses, user?.uid]);
  
  const totalCourses = myCourses.length;
  const totalStudents = useMemo(() => {
    const uniqueUsers = new Set<string>();
    myCourses.forEach(course => {
      if (Array.isArray(course.enrolledUsers)) {
        course.enrolledUsers.forEach(userId => uniqueUsers.add(userId));
      }
    });
    return uniqueUsers.size;
  }, [myCourses]);
  // Calculate revenue
  const totalRevenue = useMemo(() => myCourses.reduce((acc, course) => {
    const students = course.enrolledUsers?.length || 0;
    return acc + (students * (course.price || 0));
  }, 0), [myCourses]);

  const reportStats = useMemo(() => {
    if (!user) return { popularity: [], attentionNeeded: [], stalledStats: { percent: 0, stalled: 0, active: 0 } };

    // Only analyze progress for my courses
    const myCourseIds = new Set(myCourses.map(c => c.id));
    const myProgress = allProgress.filter(p => myCourseIds.has(p.courseId));

    // Popularity Heatmap
    const sortedCourses = [...myCourses].sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0));
    const popularity = sortedCourses.slice(0, 4).map(c => {
       const enrolled = c.enrolledUsers?.length || 0;
       const percent = totalStudents > 0 ? Math.min(100, Math.round((enrolled / totalStudents) * 100)) : 0;
       return { id: c.id, title: c.title, percent };
    });

    // Attention Needed (Ratings below 3.5)
    const courseRatings: Record<string, { sum: number; count: number; title: string }> = {};
    myCourses.forEach(c => { courseRatings[c.id] = { sum: 0, count: 0, title: c.title }; });
    
    myProgress.forEach(p => {
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

    // Stalled Learners (Inactive for 7+ days)
    const now = new Date().getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    let stalledCount = 0;
    let activeCount = 0;

    // Group progress by user
    const userMap: Record<string, any[]> = {};
    myProgress.forEach(p => {
      const userId = p.id?.split('_')[0];
      if (!userId) return;
      if (!userMap[userId]) userMap[userId] = [];
      userMap[userId].push(p);
    });

    Object.keys(userMap).forEach(userId => {
      const userProgs = userMap[userId];
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

    return { popularity, attentionNeeded, stalledStats: { percent: stalledPercent, stalled: stalledCount, active: activeCount } };
  }, [myCourses, allProgress, totalStudents, user]);

  if (!isMounted || !user) return null;

  const stats = [
    {
      title: t?.dashboard?.totalStudents || 'Total Students',
      value: totalStudents.toString(),
      icon: <Users size={24} className="text-primary-600" />,
      trend: t?.dashboard?.studentsInYourCourses || 'Active learners',
      trendUp: true
    },
    {
      title: t?.dashboard?.totalCourses || 'Total Courses',
      value: totalCourses.toString(),
      icon: <BookOpen size={24} className="text-amber-600" />,
      trend: t?.dashboard?.coursesCreated || 'Published courses',
      trendUp: true
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: <DollarSign size={24} className="text-emerald-600" />,
      trend: 'Estimated earnings',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6 bg-background animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className={TYPOGRAPHY.h1}>{t?.dashboard?.welcomeTeacher?.replace('{{name}}', user.displayName || 'Teacher') || `Welcome, ${user.displayName || 'Teacher'}`}</h1>
          <p className={`${TYPOGRAPHY.body} mt-1`}>{t?.dashboard?.heresWhatHappening || "Here's what's happening with your courses today."}</p>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className={`${UI_COMPONENTS.card} animate-pulse h-32`} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className={`${UI_COMPONENTS.card} flex items-start justify-between group hover:shadow-md transition-shadow`}>
              <div>
                <p className={`${TYPOGRAPHY.label} text-slate-500`}>{stat.title}</p>
                <h3 className={`${TYPOGRAPHY.h2} mt-2`}>{stat.value}</h3>
                <p className={`text-xs mt-2 font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trend}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary-50 transition-colors">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Integrated Advanced Analytics ─── */}
      {!loading && !loadingProgress && myCourses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          
          {/* Popularity Heatmap */}
          <div className={`${UI_COMPONENTS.card}`}>
            <h2 className={`${UI_COMPONENTS.cardHeader} !mb-6 ${TYPOGRAPHY.h3}`}>{t?.dashboard?.coursePopularity || 'Course Popularity Heatmap'}</h2>
            <div className="space-y-5 flex-1">
              {reportStats.popularity.length === 0 ? (
                <div className={`py-4 text-center ${TYPOGRAPHY.body}`}>No enrollment data yet.</div>
              ) : (
                reportStats.popularity.map((course) => (
                  <div key={course.id}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[70%]">{course.title}</span>
                      <span className="text-xs font-semibold text-slate-900">{course.percent}%</span>
                    </div>
                    <div className={`${UI_COMPONENTS.progressTrack}`}>
                      <div className={`${UI_COMPONENTS.progressFill}`} style={{ width: `${course.percent}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attention Needed */}
          <div className={`${UI_COMPONENTS.card}`}>
            <div className={`${UI_COMPONENTS.cardHeader} !mb-4`}>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-md bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                    <AlertTriangle size={16} />
                 </div>
                 <div>
                   <h2 className={`${TYPOGRAPHY.h3}`}>Attention Needed</h2>
                   <p className={`${TYPOGRAPHY.body} text-xs mt-0.5`}>Courses with ratings below 3.5</p>
                 </div>
               </div>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 no-scrollbar">
              {reportStats.attentionNeeded.length === 0 ? (
                 <div className={`py-8 text-center ${TYPOGRAPHY.body}`}>All courses performing well.</div>
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
                      <Link href={`/teacher/courses`} className={`${BUTTONS.ghost} !border !border-slate-200 hover:!border-primary-200 hover:!bg-primary-50 bg-white`}>
                        Revise
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
                   <h2 className={`${TYPOGRAPHY.h3}`}>Stalled Learners</h2>
                   <p className={`${TYPOGRAPHY.body} text-xs mt-0.5`}>Inactive for 7+ days</p>
                 </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
               <div className="relative">
                 <DonutChart 
                   percentage={reportStats.stalledStats.percent} 
                   size={140} 
                   strokeWidth={12} 
                   color="#4F46E5"
                   sublabel="Avg"
                 />
               </div>
               
               <div className="space-y-4 flex-1 w-full">
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between gap-6 border-b border-slate-100 pb-2">
                       <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-sm bg-primary-600"></span>
                         <span className="text-slate-600">Stalled</span>
                       </div>
                       <span className={`${TYPOGRAPHY.metric} !text-lg`}>{reportStats.stalledStats.stalled.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                       <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>
                         <span className="text-slate-600">Active</span>
                       </div>
                       <span className={`${TYPOGRAPHY.metric} !text-lg`}>{reportStats.stalledStats.active.toLocaleString()}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Courses Preview */}
      <div className="mt-8">
        <h2 className={TYPOGRAPHY.h2}>{t?.dashboard?.recentCourses || 'Recent Courses'}</h2>
        <div className="mt-4">
          {myCourses.length === 0 ? (
            <div className={UI_COMPONENTS.emptyStateCard}>
              <BookOpen className="text-slate-300" size={48} />
              <p className={`${TYPOGRAPHY.h3} mt-4 text-slate-400`}>{t?.dashboard?.noRecentCourses || 'No courses yet'}</p>
              <p className={`${TYPOGRAPHY.body} mt-1 text-slate-400 max-w-xs`}>{t?.dashboard?.createYourFirstCourse || 'Create your first course to start earning.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...myCourses].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 3).map(course => (
                <div key={course.id} className={`${UI_COMPONENTS.card} !p-0 overflow-hidden hover:shadow-md transition-all`}>
                  <div className="h-32 bg-slate-100 relative">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <BookOpen size={32} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className={`${TYPOGRAPHY.h3} line-clamp-1`}>{course.title}</h3>
                    <div className="mt-4 flex justify-between items-center text-sm">
                      <span className="font-semibold text-emerald-600">${course.price}</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users size={14} /> {course.enrolledUsers?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
