'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { enrollCourseRequest } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { ClipboardList, BookOpen, Target, GraduationCap, Video, Play } from 'lucide-react';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';

export default function TrainingPlanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);

  const { user, role, loading: authLoading } = useAppSelector((state) => state.auth);
  const { trainingPlans, loading: planLoading } = useAppSelector((state) => state.trainingPlans);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  
  const { t: i18nT } = useTranslation();
  const t = i18nT('dashboard', { returnObjects: true }) as any;
  const adminT = i18nT('admin', { returnObjects: true }) as any;

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      if (trainingPlans.length === 0) dispatch(fetchTrainingPlansRequest());
      if (courses.length === 0) dispatch(fetchCoursesRequest());
      setInitialized(true);
    }
  }, [dispatch, trainingPlans.length, courses.length, initialized]);

  // Ensure user has access (Assigned to plan OR is Admin)
  const hasAccess = user?.assignedTrainingPlans?.includes(id) || role === 'admin';

  if (!hasAccess && initialized && !planLoading) {
    return (
      <div className={UI_COMPONENTS.pageContainer}>
        <div className={`${UI_COMPONENTS.emptyStateCard} max-w-2xl mx-auto mt-12 bg-rose-50/50 border-rose-100`}>
          <h2 className={TYPOGRAPHY.h2}>Access Denied</h2>
          <p className={`${TYPOGRAPHY.body} mb-8`}>You do not have access to this training plan.</p>
          <Link href="/training-plans" className={BUTTONS.secondary}>
            Return to Training Plans
          </Link>
        </div>
      </div>
    );
  }

  const plan = trainingPlans.find(tp => tp.id === id);
  
  // Maintain the exact order defined in plan.courseIds
  const planCourses = plan?.courseIds?.map(cId => courses.find(c => c.id === cId)).filter(Boolean) || [];

  const handleEnroll = (courseId: string) => {
    dispatch(enrollCourseRequest(courseId));
  };

  if ((planLoading || coursesLoading) && !plan) {
    return (
      <div className={UI_COMPONENTS.pageContainer}>
        <div className="max-w-5xl mx-auto py-8 space-y-8 animate-pulse">
          <div className="h-64 bg-slate-100 rounded-2xl w-full border border-slate-200/60"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded-lg w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded-lg w-2/3"></div>
          </div>
          <div className="space-y-4 pt-8">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100/50 rounded-2xl border border-slate-100"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={UI_COMPONENTS.pageContainer}>
        <div className={`${UI_COMPONENTS.emptyStateCard} max-w-2xl mx-auto mt-12 bg-slate-50 border-slate-200`}>
          <h2 className={TYPOGRAPHY.h2}>Plan Not Found</h2>
          <p className={`${TYPOGRAPHY.body} mb-8`}>The requested training plan could not be found.</p>
          <Link href="/training-plans" className={BUTTONS.secondary}>
             Return to Training Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${UI_COMPONENTS.pageContainer} max-w-5xl`}>

      <div className={`${UI_COMPONENTS.card} !p-0 overflow-hidden mb-12 border-slate-200/60 shadow-sm`}>
        <div className="relative h-64 md:h-[340px] w-full bg-slate-100">
          {plan.image ? (
             <img src={plan.image} alt={plan.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
               <ClipboardList size={80} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full z-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight drop-shadow-sm">{plan.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-white/90 font-medium">
              <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/20">
                <BookOpen size={14} /> {plan.courseIds.length} {adminT.courses || 'Courses'}
              </span>
              <span className="flex items-center gap-1.5 bg-primary-600/90 px-3 py-1.5 rounded-lg backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-primary-500/50 shadow-sm">
                <Target size={14} /> Assigned Plan
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-8 md:p-10 bg-white">
          <h2 className={`${TYPOGRAPHY.h2} mb-4 text-slate-900`}>{adminT.trainingPlanInfo || "About this path"}</h2>
          <p className={`${TYPOGRAPHY.body} text-base max-w-4xl`}>{plan.description}</p>
        </div>
      </div>

      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className={TYPOGRAPHY.h2}>
               {adminT.curriculum || "Curriculum"}
            </h2>
            <p className={`${TYPOGRAPHY.body} mt-1`}>{adminT.curriculumSubtitle || "Complete these courses in order to finish the training plan."}</p>
          </div>
        </div>

        <div className="space-y-4">
          {planCourses.length > 0 ? (
            planCourses.map((course: any, index) => {
              const isEnrolled = user?.enrolledCourses?.includes(course.id);
              
              return (
                <div key={course.id} className={UI_COMPONENTS.cardRowItem}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="hidden sm:flex w-10 h-10 rounded-lg bg-slate-50 items-center justify-center text-xs font-black text-slate-400 shrink-0 border border-slate-200/60 shadow-sm">
                      {index + 1}
                    </div>
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/60 group-hover:scale-105 transition-transform duration-500 shadow-sm">
                      {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <BookOpen size={24} className="text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <p className="font-bold text-slate-900 text-base tracking-tight truncate group-hover:text-primary-600 transition-colors">{course.title}</p>
                        <div className="flex items-center gap-1.5">
                          {course.visibility === 'private' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest shrink-0">Private</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest shrink-0">Public</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[13px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 min-w-0 max-w-[120px] sm:max-w-[200px]">
                          <GraduationCap size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{course.instructor}</span>
                        </span>
                        <span className="hidden xs:block text-slate-300 shrink-0">•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Video size={14} className="text-slate-400 shrink-0" /> {course.videos?.length || 0} Lessons
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex justify-end">
                    {isEnrolled ? (
                      <Link
                        href={`/dashboard/courses/${course.id}?planId=${plan.id}`}
                        className={`${BUTTONS.primary} !bg-emerald-600 hover:!bg-emerald-700 w-full sm:w-auto`}
                      >
                         <Play size={16} className="fill-current" /> {adminT.startCourse || t.viewCourse || "Start Course"}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={authLoading}
                        className={`${BUTTONS.primary} w-full sm:w-auto`}
                      >
                        {authLoading ? adminT.savingEllipsis || "..." : t.enroll || "Enroll"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={UI_COMPONENTS.emptyStateCard}>
              <p className={`${TYPOGRAPHY.body} font-medium italic`}>{t.noCoursesInPlan || "No courses available in this plan yet."}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
