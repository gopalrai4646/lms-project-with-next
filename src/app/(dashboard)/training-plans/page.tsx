'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { useTranslation } from 'react-i18next';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';

export default function UserTrainingPlansPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { trainingPlans, loading } = useAppSelector((state) => state.trainingPlans);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any; // Reusing admin translations for plan names
  const coursePlayerT = i18nT('coursePlayer', { returnObjects: true }) as any;

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
    <div className={UI_COMPONENTS.pageContainer}>
      <header>
        <h1 className={TYPOGRAPHY.h1}>{t.trainingPlans || 'Training Plans'}</h1>
        <p className={`${TYPOGRAPHY.body} mt-1`}>View your assigned learning paths curated by administrators.</p>
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
              <div className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden h-full flex-col`}>
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  {plan.image ? (
                    <img src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                      <ClipboardList size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-bold rounded-full shadow-sm">
                      {plan.courseIds?.length || 0} {t.courses || 'Courses'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">{plan.name}</h3>
                  <p className={`${TYPOGRAPHY.body} mb-6 line-clamp-3 flex-1`}>{plan.description}</p>

                  <span className="text-sm font-bold text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all mt-auto capitalize">
                    View Plan <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={UI_COMPONENTS.emptyStateCard}>
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ClipboardList size={40} />
          </div>
          <h3 className={TYPOGRAPHY.h3}>{t.noTrainingPlansAssigned || 'No training plans assigned'}</h3>
          <p className={`${TYPOGRAPHY.body} max-w-md mx-auto`}>
            You don't have any training plans assigned yet. When an administrator assigns a learning path to you, it will appear here.
          </p>
          <div className="mt-8">
            <Link href="/dashboard" className={BUTTONS.secondary}>
              {coursePlayerT.backToDashboard || 'Back to Dashboard'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
