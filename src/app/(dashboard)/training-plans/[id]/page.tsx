'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { enrollCourseRequest } from '@/store/slices/authSlice';
import { translations } from '@/utils/translations';

export default function TrainingPlanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);

  const { user, role, loading: authLoading } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const { trainingPlans, loading: planLoading } = useAppSelector((state) => state.trainingPlans);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  
  const t = translations[language].dashboard;
  const adminT = translations[language].admin;

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
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-6">You do not have access to this training plan.</p>
        <Link href="/training-plans" className="text-indigo-600 font-bold hover:underline">
          Return to Training Plans
        </Link>
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
      <div className="max-w-5xl mx-auto py-8 space-y-8 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-3xl w-full"></div>
        <div className="space-y-4">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-2/3"></div>
        </div>
        <div className="space-y-4 pt-8">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Plan Not Found</h2>
        <p className="text-slate-500 mb-6">The requested training plan could not be found.</p>
        <Link href="/training-plans" className="text-indigo-600 font-bold hover:underline">
           Return to Training Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      <Link href="/training-plans" className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-6 w-fit transition-colors">
        <span>←</span> Back to Training Plans
      </Link>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="relative h-64 md:h-80 w-full bg-slate-100">
          {plan.image ? (
             <img src={plan.image} alt={plan.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📋</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">{plan.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90 font-medium">
              <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md text-xs">
                📚 {plan.courseIds.length} {adminT.courses || 'Courses'}
              </span>
              <span className="flex items-center gap-2 bg-indigo-600/80 px-3 py-1 rounded-full backdrop-blur-md text-xs">
                🎯 Assigned Plan
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-8 md:p-10 bg-white">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{adminT.trainingPlanInfo || "About this path"}</h2>
          <p className="text-slate-600 leading-relaxed text-lg max-w-4xl">{plan.description}</p>
        </div>
      </div>

      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
             {adminT.curriculum || "Curriculum"}
              {/* <span className="text-sm px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">{planCourses.length}</span> */}
          </h2>
          <p className="text-slate-500 mt-2">{adminT.curriculumSubtitle || "Complete these courses in order to finish the training plan."}</p>
        </div>

        <div className="space-y-4">
          {planCourses.length > 0 ? (
            planCourses.map((course: any, index) => {
              const isEnrolled = user?.enrolledCourses?.includes(course.id);
              
              return (
                <div key={course.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-white border border-slate-100 rounded-[28px] hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 border border-slate-200/50">
                      {index + 1}
                    </div>
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/50">
                      {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : '📚'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors">{course.title}</p>
                        {course.visibility === 'private' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 uppercase tracking-wide shrink-0">Private</span>
                        )}
                        {course.visibility !== 'private' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wide shrink-0">Public</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="font-medium">🧑‍🏫 {course.instructor}</span>
                        <span>•</span>
                        <span>🎬 {course.videos?.length || 0} Lessons</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full sm:w-auto">
                    {isEnrolled ? (
                      <Link
                        href={`/dashboard/courses/${course.id}?planId=${plan.id}`}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold transition-all hover:bg-emerald-700 shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                      >
                         <span>▶️</span> {adminT.startCourse || t.viewCourse || "Start Course"}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={authLoading}
                        className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {authLoading ? adminT.savingEllipsis || "..." : t.enroll || "Enroll"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">No courses available in this plan yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
