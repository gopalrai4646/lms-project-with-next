'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest, deleteTrainingPlanRequest } from '@/store/slices/trainingPlanSlice';
import { translations } from '@/utils/translations';

export default function AdminTrainingPlansPage() {
  const dispatch = useAppDispatch();
  const { trainingPlans, loading, error } = useAppSelector((state) => state.trainingPlans);
  const { language } = useAppSelector((state) => state.settings);
  // Fallback to "en" if translations for trainingPlans are missing during dev
  const t = translations[language]?.admin || translations['en'].admin;

  useEffect(() => {
    dispatch(fetchTrainingPlansRequest());
  }, [dispatch]);

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteTrainingPlanConfirm || "Are you sure you want to delete this training plan?")) {
      dispatch(deleteTrainingPlanRequest(id));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t.manageTrainingPlans || "Manage Training Plans"}</h1>
          <p className="text-slate-500 mt-1">{t.manageTrainingPlansSubtitle || "Create and manage curated learning paths"}</p>
        </div>
        <Link 
          href="/admin/training-plans/new" 
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <span>➕</span> {t.newTrainingPlan || "New Training Plan"}
        </Link>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.trainingPlanInfo || "Training Plan Info"}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.courses || "Courses"}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && trainingPlans.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    {t.loadingTrainingPlans || "Loading training plans..."}
                  </td>
                </tr>
              ) : trainingPlans.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    {t.noTrainingPlansFound || "No training plans found. Create one!"}
                  </td>
                </tr>
              ) : (
                trainingPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                          {plan.image ? (
                            <img src={plan.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">📋</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{plan.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">{plan.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                        {plan.courseIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/training-plans/edit/${plan.id}`}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={t.editTrainingPlan || "Edit"}
                        >
                          ✏️
                        </Link>
                        <button 
                          onClick={() => handleDelete(plan.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title={t.deleteTrainingPlan || "Delete"}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
