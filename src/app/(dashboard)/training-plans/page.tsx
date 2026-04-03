'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { translations } from '@/utils/translations';
import { ClipboardList, ArrowRight } from 'lucide-react';

export default function UserTrainingPlansPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const { trainingPlans, loading } = useAppSelector((state) => state.trainingPlans);
  const t = translations[language].admin; // Reusing admin translations for plan names
  const coursePlayerT = translations[language].coursePlayer;

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user?.assignedTrainingPlans?.length && !initialized) {
      dispatch(fetchTrainingPlansRequest());
      setInitialized(true);
    }
  }, [dispatch, user?.assignedTrainingPlans, initialized]);

  const assignedPlanIds = user?.assignedTrainingPlans || [];
  const assignedPlans = trainingPlans.filter(tp => assignedPlanIds.includes(tp.id));

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">{t.trainingPlans || 'Training Plans'}</h1>
        <p className="text-slate-500 mt-1">View your assigned learning paths curated by administrators.</p>
      </header>

      {loading && trainingPlans.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-50 rounded-3xl h-80 animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : assignedPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedPlans.map((plan) => (
            <Link href={`/training-plans/${plan.id}`} key={plan.id} className="block group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group-hover:shadow-xl transition-all h-full flex flex-col">
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  {plan.image ? (
                    <img src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                      <ClipboardList size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold rounded-full shadow-sm">
                      {plan.courseIds?.length || 0} {t.courses || 'Courses'}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1">{plan.description}</p>
                  
                  <span className="text-sm font-bold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all mt-auto lowercase">
                    view plan <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
             <ClipboardList size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t.noTrainingPlansAssigned || 'No training plans assigned'}</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            You don't have any training plans assigned yet. When an administrator assigns a learning path to you, it will appear here.
          </p>
          <div className="mt-8">
            <Link href="/dashboard" className="px-6 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
              {coursePlayerT.backToDashboard || 'Back to Dashboard'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
