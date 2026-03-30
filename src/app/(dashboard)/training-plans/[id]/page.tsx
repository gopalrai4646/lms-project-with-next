'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import CourseCard from '@/components/common/CourseCard';
import { translations } from '@/utils/translations';

export default function TrainingPlanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);

  const { user } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const { trainingPlans, loading: planLoading } = useAppSelector((state) => state.trainingPlans);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  
  const dashboardT = translations[language].dashboard;
  const adminT = translations[language].admin;

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      if (trainingPlans.length === 0) dispatch(fetchTrainingPlansRequest());
      if (courses.length === 0) dispatch(fetchCoursesRequest());
      setInitialized(true);
    }
  }, [dispatch, trainingPlans.length, courses.length, initialized]);

  // Ensure user has access
  const hasAccess = user?.assignedTrainingPlans?.includes(id);

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
  const planCourses = courses.filter(c => plan?.courseIds?.includes(c.id));

  if ((planLoading || coursesLoading) && !plan) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-8 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-3xl w-full"></div>
        <div className="space-y-4">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-100 rounded-3xl"></div>)}
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
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      <Link href="/training-plans" className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-6 w-fit transition-colors">
        <span>←</span> Back to Training Plans
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="relative h-64 md:h-80 lg:h-96 w-full bg-slate-100">
          {plan.image ? (
             <img src={plan.image} alt={plan.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📋</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{plan.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90 font-medium">
              <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                📚 {plan.courseIds.length} {adminT.courses || 'Courses'}
              </span>
              <span className="flex items-center gap-2 bg-indigo-600/80 px-3 py-1 rounded-full backdrop-blur-md">
                🎯 Assigned Plan
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-8 md:p-12 bg-white">
          <h2 className="text-xl font-bold text-slate-900 mb-4">About this path</h2>
          <p className="text-slate-600 leading-relaxed text-lg max-w-4xl">{plan.description}</p>
        </div>
      </div>

      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
             Curriculum <span className="text-sm px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">{planCourses.length}</span>
          </h2>
          <p className="text-slate-500 mt-2">Complete these courses in order to finish the training plan.</p>
        </div>

        {planCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-slate-500">No courses available in this plan yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
