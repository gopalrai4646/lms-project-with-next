'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest, deleteTrainingPlanRequest } from '@/store/slices/trainingPlanSlice';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, Search, List, LayoutGrid, Users, BookOpen, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';

export default function AdminTrainingPlansPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { trainingPlans, loading, error } = useAppSelector((state) => state.trainingPlans);
  const { user, role, permissions } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [isMounted, setIsMounted] = useState(false);

  const canCreate = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'training_plans_create'));
  const canEdit = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'training_plans_edit'));
  const canDelete = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'training_plans_delete'));

  useEffect(() => {
    setIsMounted(true);
    const savedView = localStorage.getItem('adminTrainingPlanViewMode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
  }, [dispatch]);

  const handleViewToggle = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('adminTrainingPlanViewMode', mode);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteTrainingPlanConfirm)) {
      dispatch(deleteTrainingPlanRequest(id));
    }
  };

  // 1. Filter training plans
  const filteredPlans = useMemo(() => {
    let result = trainingPlans;

    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      result = result.filter((plan) => 
        plan.name.toLowerCase().includes(lowerQuery) ||
        (plan.description && plan.description.toLowerCase().includes(lowerQuery))
      );
    }

    return result;
  }, [trainingPlans, debouncedSearchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, itemsPerPage]);

  // 2. Pagination logic
  const totalItems = filteredPlans.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

  if (!isMounted) return null; // Avoid hydration mismatch for localStorage view

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t.manageTrainingPlans}</h1>
          <p className="text-slate-500 mt-1">{t.manageTrainingPlansSubtitle}</p>
        </div>
        {canCreate && (
          <Link 
            href="/admin/training-plans/new" 
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> {t.newTrainingPlan}
          </Link>
        )}
      </header>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          {error}
        </div>
      )}

      {/* Toolbar: Search, Items Per Page, and View toggle */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white py-2.5 px-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative w-full lg:flex-1 lg:max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t.searchTrainingPlans}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 text-sm"
          />
        </div>
        
        <div className="flex flex-row items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 whitespace-nowrap bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0 shadow-sm justify-center flex-1 sm:flex-none">
            <span className="text-sm font-semibold text-slate-500 pl-2">{t.itemsPerPage}:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-bold text-slate-700 cursor-pointer"
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0 shadow-inner justify-center flex-1 sm:flex-none">
            <button
              onClick={() => handleViewToggle('list')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title={t.listView}
            >
              <List size={20} /> <span className="hidden sm:inline text-sm">{t.listView}</span>
            </button>
            <button
              onClick={() => handleViewToggle('grid')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title={t.gridView}
            >
              <LayoutGrid size={20} /> <span className="hidden sm:inline text-sm">{t.gridView}</span>
            </button>
          </div>
        </div>
      </div>

      {loading && trainingPlans.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-medium italic bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          {t.loadingTrainingPlans}
        </div>
      ) : paginatedPlans.length === 0 ? (
        <div className="py-16 text-center text-slate-400 font-medium italic bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
          <Search className="opacity-50 grayscale" size={48} />
          <p className="text-lg text-slate-500 font-semibold">{t.noTrainingPlansFound}</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-wrap">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">{t.trainingPlanInfo}</th>
                  <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.courses}</th>
                  {(canEdit || canDelete) && <th className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPlans.map((plan) => (
                  <tr 
                    key={plan.id} 
                    className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${!canEdit ? 'cursor-default' : ''}`}
                    onClick={() => canEdit && router.push(`/admin/training-plans/edit/${plan.id}`)}
                  >
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/50 flex items-center justify-center">
                          {plan.image ? (
                            <img src={plan.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <List size={24} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{plan.name}</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-md truncate">{plan.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50 shadow-sm inline-flex items-center gap-1.5">
                         <BookOpen size={14} className="opacity-60" /> {plan.courseIds?.length || 0}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {canEdit && (
                            <Link 
                              href={`/admin/training-plans/edit/${plan.id}`}
                              className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100 flex items-center gap-1"
                              title={t.editTrainingPlan}
                            >
                              <Pencil size={18} />
                            </Link>
                          )}
                          {canDelete && (
                            <button 
                              onClick={() => handleDelete(plan.id)}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 flex items-center gap-1"
                              title={t.deleteTrainingPlan}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedPlans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => canEdit && router.push(`/admin/training-plans/edit/${plan.id}`)}
            >
              <div className="aspect-video bg-slate-50 relative overflow-hidden flex items-center justify-center text-5xl">
                {plan.image ? (
                  <img src={plan.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <List size={48} className="text-slate-300 transform group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-3 right-3 shadow-sm">
                  <span className="text-xs font-bold px-3 py-1 bg-white/90 backdrop-blur-md text-indigo-700 rounded-full border border-indigo-100/50 flex items-center gap-1.5">
                    <BookOpen size={14} /> {plan.courseIds?.length || 0}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-xl text-slate-900 line-clamp-1 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{plan.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">{plan.description}</p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <Link 
                        href={`/admin/training-plans/edit/${plan.id}`}
                        className="text-sm font-bold text-slate-600 bg-slate-50 hover:bg-amber-50 hover:text-amber-600 px-4 py-2 rounded-xl transition-all border border-slate-200 hover:border-amber-100 flex items-center gap-2"
                      >
                        <Pencil size={16} /> {t.editTrainingPlan}
                      </Link>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 flex items-center justify-center"
                        title={t.deleteTrainingPlan}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 sm:px-6 py-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            {t.showing} <span className="font-bold text-slate-700">{totalItems === 0 ? 0 : startIndex + 1}</span> {t.to} <span className="font-bold text-slate-700">{endIndex}</span> {t.of} <span className="font-bold text-slate-700">{totalItems}</span>
          </p>
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} /> <span className="hidden sm:inline">{t.prev}</span>
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <div key={`ellipsis-${page}`} className="flex items-center gap-1">
                        <span className="w-4 text-center text-slate-400 text-xs">…</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[28px] h-7 px-1.5 rounded-lg font-bold transition-all text-xs ${
                            safeCurrentPage === page 
                              ? 'bg-indigo-600 text-white border border-indigo-700' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg font-bold transition-all text-xs ${
                        safeCurrentPage === page 
                          ? 'bg-indigo-600 text-white border border-indigo-700' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
               <span className="hidden sm:inline">{t.next}</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
