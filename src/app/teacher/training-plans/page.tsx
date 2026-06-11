'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTrainingPlansRequest, deleteTrainingPlanRequest } from '@/store/slices/trainingPlanSlice';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, Search, List, LayoutGrid, BookOpen, Pencil, Trash2, ChevronLeft, ChevronRight, Hash, ClipboardList } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import CustomSelect from '@/components/common/CustomSelect';

export default function TeacherTrainingPlansPage() {
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

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  useEffect(() => {
    setIsMounted(true);
    const savedView = localStorage.getItem('adminTrainingPlanViewMode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
  }, [dispatch]);

  const handleViewToggle = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('teacherTrainingPlanViewMode', mode);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteTrainingPlanConfirm)) {
      dispatch(deleteTrainingPlanRequest(id));
    }
  };

  // 1. Filter training plans
  const filteredPlans = useMemo(() => {
    let result = trainingPlans;
    if (role === 'teacher') {
      result = result.filter(tp => tp.createdBy === user?.uid);
    }

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
    <div className="space-y-6 bg-background min-h-screen p-0 animate-in fade-in duration-700">
      {/* ─── Page Header ─── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={TYPOGRAPHY.h1}>{t.manageTrainingPlans}</h1>
          <p className={`${TYPOGRAPHY.body} mt-1`}>{t.manageTrainingPlansSubtitle}</p>
        </div>
        {canCreate && (
          <Link href="/teacher/training-plans/new" className={BUTTONS.primary}>
            <Plus size={16} /> {t.newTrainingPlan}
          </Link>
        )}
      </header>

      {/* ─── Error Banner ─── */}
      {error && (
        <div
          className="p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium animate-in slide-in-from-left duration-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ─── Toolbar: 2 rows (mobile) → 1 row (lg) ─── */}
      <div className={`${UI_COMPONENTS.card} !p-2 w-full min-w-0`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3 w-full">
          <div className="relative w-full min-w-0 lg:flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
              aria-hidden
            />
            <input
              type="search"
              placeholder={t.searchTrainingPlans}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${UI_COMPONENTS.input} pl-10 w-full`}
              aria-label={t.searchTrainingPlans}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:shrink-0">
            <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2 w-full min-w-0">
              <span className={`${TYPOGRAPHY.label} text-xs lg:whitespace-nowrap shrink-0`}>
                {t.itemsPerPage}
              </span>
              <CustomSelect
                value={itemsPerPage}
                onChange={(val) => setItemsPerPage(Number(val))}
                icon={<Hash size={14} />}
                size="sm"
                className="w-full lg:w-[5.5rem] lg:shrink-0"
                options={[
                  { value: 8, label: '8' },
                  { value: 12, label: '12' },
                  { value: 24, label: '24' },
                  { value: 48, label: '48' },
                ]}
              />
            </div>
            <div
              className={`${UI_COMPONENTS.segmentedControl} w-full min-w-0 p-1 lg:p-0.5`}
              role="group"
              aria-label={`${t.listView} / ${t.gridView}`}
            >
              <button
                type="button"
                onClick={() => handleViewToggle('list')}
                className={`flex flex-1 items-center justify-center gap-2 min-h-10 lg:min-h-0 px-3 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={t.listView}
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-5 h-5 lg:w-4 lg:h-4" aria-hidden />
                <span className="hidden lg:inline">{t.listView}</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewToggle('grid')}
                className={`flex flex-1 items-center justify-center gap-2 min-h-10 lg:min-h-0 px-3 py-2 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-medium rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={t.gridView}
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-5 h-5 lg:w-4 lg:h-4" aria-hidden />
                <span className="hidden lg:inline">{t.gridView}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content Area ─── */}
      {loading && trainingPlans.length === 0 ? (
        <div className={`${UI_COMPONENTS.emptyStateCard} py-12`}>
          <div
            className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"
            role="status"
            aria-label={t.loadingTrainingPlans}
          />
          <p className={`${TYPOGRAPHY.body} mt-3 animate-pulse`}>{t.loadingTrainingPlans}</p>
        </div>
      ) : paginatedPlans.length === 0 ? (
        <div className={UI_COMPONENTS.emptyStateCard}>
          <Search className="text-slate-300" size={48} aria-hidden />
          <p className={`${TYPOGRAPHY.h3} mt-4 text-slate-400`}>{t.noTrainingPlansFound}</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── List View ─── */
        <div className={UI_COMPONENTS.tableWrapper}>
          <div className={UI_COMPONENTS.tableContainer}>
            <table className={UI_COMPONENTS.table}>
              <thead className={UI_COMPONENTS.tableHeader}>
                <tr>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>{t.trainingPlanInfo}</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-center`}>{t.courses}</th>
                  {(canEdit || canDelete) && (
                    <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-right`}>{t.actions}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className={`hover:bg-slate-50/50 transition-colors group ${
                      canEdit ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    onClick={() => canEdit && router.push(`/teacher/training-plans/edit/${plan.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/50 group-hover:scale-105 transition-transform duration-300">
                          {plan.image ? (
                            <img src={plan.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ClipboardList size={22} className="text-slate-300" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`${TYPOGRAPHY.h3} group-hover:text-primary-600 transition-colors line-clamp-1`}
                          >
                            {plan.name}
                          </p>
                          <p className={`${TYPOGRAPHY.body} text-xs mt-0.5 line-clamp-1 max-w-md`}>
                            {plan.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`${UI_COMPONENTS.badge} inline-flex`}>
                        <BookOpen size={12} className="opacity-60" aria-hidden />
                        {plan.courseIds?.length || 0}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {canEdit && (
                            <Link
                              href={`/teacher/training-plans/edit/${plan.id}`}
                              className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-primary-600`}
                              title={t.editTrainingPlan}
                              aria-label={t.editTrainingPlan}
                            >
                              <Pencil size={16} aria-hidden />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(plan.id)}
                              className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                              title={t.deleteTrainingPlan}
                              aria-label={t.deleteTrainingPlan}
                            >
                              <Trash2 size={16} aria-hidden />
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
        /* ─── Grid View ─── */
        <div className={UI_COMPONENTS.gridContainer}>
          {paginatedPlans.map((plan) => (
            <div
              key={plan.id}
              className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden group ${
                !canEdit ? '!cursor-default' : ''
              }`}
              onClick={() => canEdit && router.push(`/teacher/training-plans/edit/${plan.id}`)}
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {plan.image ? (
                  <img
                    src={plan.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ClipboardList
                    size={48}
                    className="text-slate-300 group-hover:scale-110 transition-transform duration-500"
                    aria-hidden
                  />
                )}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border backdrop-blur-sm bg-white/90 text-primary-700 border-primary-200/50">
                    <BookOpen size={11} aria-hidden />
                    {plan.courseIds?.length || 0} {t.courses}
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3
                  className={`${TYPOGRAPHY.h3} line-clamp-2 leading-snug mb-2 group-hover:text-primary-600 transition-colors`}
                >
                  {plan.name}
                </h3>
                <p className={`${TYPOGRAPHY.body} text-xs line-clamp-2 mb-4 flex-grow`}>{plan.description}</p>

                {(canEdit || canDelete) && (
                  <div
                    className="mt-auto flex items-center justify-end gap-0.5 pt-3 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEdit && (
                      <Link
                        href={`/teacher/training-plans/edit/${plan.id}`}
                        className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-primary-600`}
                        title={t.editTrainingPlan}
                        aria-label={t.editTrainingPlan}
                      >
                        <Pencil size={14} aria-hidden />
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id)}
                        className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                        title={t.deleteTrainingPlan}
                        aria-label={t.deleteTrainingPlan}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 0 && totalItems > 0 && (
        <div className={`${UI_COMPONENTS.pagination} mt-2`}>
          <p className={TYPOGRAPHY.body}>
            {t.showing}{' '}
            <span className="font-semibold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</span> {t.to}{' '}
            <span className="font-semibold text-slate-900">{endIndex}</span> {t.of}{' '}
            <span className="font-semibold text-slate-900">{totalItems}</span>
          </p>
          <nav className="flex items-center gap-1" aria-label="Pagination">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              className={`${BUTTONS.ghost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ChevronLeft size={14} aria-hidden />
              <span className="hidden sm:inline">{t.prev}</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    totalPages <= 5 ||
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safeCurrentPage) <= 1
                )
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <div key={`ellipsis-${page}`} className="flex items-center gap-1">
                        <span className="w-4 text-center text-slate-400 text-xs" aria-hidden>
                          …
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[28px] h-7 px-1.5 rounded-lg font-medium transition-all text-xs ${
                            safeCurrentPage === page
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                          aria-current={safeCurrentPage === page ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg font-medium transition-all text-xs ${
                        safeCurrentPage === page
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      aria-current={safeCurrentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages || totalPages === 0}
              className={`${BUTTONS.ghost} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="hidden sm:inline">{t.next}</span>
              <ChevronRight size={14} aria-hidden />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
