'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsersRequest, User, deleteUserRequest } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { impersonateUserRequest } from '@/store/slices/authSlice';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import { useTranslation } from 'react-i18next';
import { Search, List, LayoutGrid, BookOpen, Trash2, ChevronLeft, ChevronRight, Eye, UserSquare2, Hash } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import CustomSelect from '@/components/common/CustomSelect';

export default function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { users, loading } = useAppSelector(state => state.users);
  const { isImpersonating, role, permissions } = useAppSelector(state => state.auth);
  const { courses } = useAppSelector(state => state.courses);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  useEffect(() => {
    if (isImpersonating) {
      router.push('/dashboard');
    }
  }, [isImpersonating, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const canRead = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'users_read'));
  const canImpersonate = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'users_impersonate'));
  const canDeleteUser = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'users_delete'));

  const selectedUser = useMemo(() => {
    return selectedUserId ? users.find(u => u.id === selectedUserId) || null : null;
  }, [users, selectedUserId]);

  const handleDelete = (userId: string) => {
    if (window.confirm(t.deleteUserConfirm)) {
      dispatch(deleteUserRequest(userId));
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const savedView = localStorage.getItem('adminUserViewMode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
  }, [dispatch, courses.length]);

  const handleViewToggle = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('adminUserViewMode', mode);
  };

  const getValidEnrolledCourses = (userCourses?: string[]) => {
    return userCourses?.filter(id => courses.some(c => c.id === id)) || [];
  };

  const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || t.unknownCourse;

  // 1. Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Exclude admin and staff users from the user management list
      if (user.role === 'admin' || user.role === 'staff') return false;

      const matchesSearch =
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCourse = courseFilter === '' || user.enrolledCourses?.includes(courseFilter);

      return matchesSearch && matchesCourse;
    });
  }, [users, searchTerm, courseFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, courseFilter, itemsPerPage]);

  // 2. Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const courseFilterOptions = useMemo(
    () => [
      { value: '', label: t.allCourses },
      ...courses.map((course) => ({ value: course.id, label: course.title })),
    ],
    [courses, t.allCourses]
  );

  if (!isMounted) return null;

  return (
    <div className="space-y-6 bg-background min-h-screen p-0 animate-in fade-in duration-700">
      {/* ─── Page Header ─── */}
      <header>
        <h1 className={TYPOGRAPHY.h1}>{t.manageUsers}</h1>
        <p className={`${TYPOGRAPHY.body} mt-1`}>{t.manageUsersSubtitle}</p>
      </header>

      {/* ─── Toolbar ─── */}
      <div className={`${UI_COMPONENTS.card} !p-2 w-full min-w-0`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3 w-full">
          <div className="flex flex-col gap-3 md:flex-row md:items-center w-full min-w-0 lg:flex-1 lg:min-w-0">
            <div className="relative w-full min-w-0 md:flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
                aria-hidden
              />
              <input
                type="search"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${UI_COMPONENTS.input} pl-10 w-full`}
                aria-label={t.searchPlaceholder}
              />
            </div>
            <CustomSelect
              value={courseFilter}
              onChange={(val) => setCourseFilter(String(val))}
              icon={<BookOpen size={16} />}
              className="w-full md:w-[11.5rem] md:shrink-0"
              options={courseFilterOptions}
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

      {loading && users.length === 0 ? (
        <div className={`${UI_COMPONENTS.emptyStateCard} py-12`}>
          <div
            className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"
            role="status"
            aria-label={t.loadingUsers}
          />
          <p className={`${TYPOGRAPHY.body} mt-3 animate-pulse`}>{t.loadingUsers}</p>
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className={UI_COMPONENTS.emptyStateCard}>
          <Search className="text-slate-300" size={48} aria-hidden />
          <p className={`${TYPOGRAPHY.h3} mt-4 text-slate-400`}>{t.noUsersFound}</p>
          <p className={`${TYPOGRAPHY.body} mt-1 text-slate-400 max-w-xs`}>{t.tryAdjustingFilters}</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── List View ─── */
        <div className={UI_COMPONENTS.tableWrapper}>
          <div className={UI_COMPONENTS.tableContainer}>
            <table className={UI_COMPONENTS.table}>
              <thead className={UI_COMPONENTS.tableHeader}>
                <tr>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>{t.userProfile}</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>{t.role}</th>
                  <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>{t.enrolledCourses}</th>
                  {(canRead || canImpersonate || canDeleteUser) && (
                    <th className={`px-5 py-3.5 ${TYPOGRAPHY.label} text-right`}>{t.actions}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user: User) => (
                  <tr key={user.id} className={UI_COMPONENTS.tableRow}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 font-semibold text-lg flex items-center justify-center shrink-0 border border-primary-100 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`${TYPOGRAPHY.h3} group-hover:text-primary-600 transition-colors line-clamp-1`}>
                            {user.name || t.noName}
                          </p>
                          <p className={`${TYPOGRAPHY.body} text-xs mt-0.5 line-clamp-1`}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                          user.role === 'admin'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const validUserCourses = getValidEnrolledCourses(user.enrolledCourses);
                        if (validUserCourses.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {validUserCourses.slice(0, 2).map((courseId: string) => (
                                <span
                                  key={courseId}
                                  className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-medium rounded-md truncate max-w-[150px] border border-primary-100"
                                >
                                  {getCourseTitle(courseId)}
                                </span>
                              ))}
                              {validUserCourses.length > 2 && (
                                <span
                                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md border border-slate-200 cursor-help"
                                  title={validUserCourses.slice(2).map(getCourseTitle).join(', ')}
                                >
                                  +{validUserCourses.length - 2} {t.more}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <span className={`${TYPOGRAPHY.body} text-xs italic text-slate-400`}>{t.noEnrollments}</span>
                        );
                      })()}
                    </td>
                    {(canRead || canImpersonate || canDeleteUser) && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-primary-600`}
                            title={t.viewDetails}
                            aria-label={t.viewDetails}
                          >
                            <Eye size={16} aria-hidden />
                          </button>
                          {canImpersonate && (
                            <button
                              type="button"
                              onClick={() => dispatch(impersonateUserRequest(user.id))}
                              className={`${BUTTONS.primary} !px-3 !py-2 !text-xs`}
                            >
                              <UserSquare2 size={14} aria-hidden /> {t.impersonate}
                            </button>
                          )}
                          {canDeleteUser && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                              title={t.deleteUser}
                              aria-label={t.deleteUser}
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
          {paginatedUsers.map((user: User) => (
            <div
              key={user.id}
              className={`${UI_COMPONENTS.card} relative group hover:shadow-md hover:border-slate-300 transition-all`}
            >
              <div className="absolute top-4 right-4 z-10">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                    user.role === 'admin'
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div className="flex flex-col items-center text-center pt-2 pb-4">
                <div className="w-16 h-16 rounded-xl bg-primary-50 text-primary-600 font-semibold text-2xl flex items-center justify-center border border-primary-100 overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className={`${TYPOGRAPHY.h3} group-hover:text-primary-600 transition-colors line-clamp-1 w-full`}>
                  {user.name || t.noName}
                </h3>
                <p className={`${TYPOGRAPHY.body} text-xs mt-0.5 truncate w-full`}>{user.email}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                <div>
                  <p className={`${TYPOGRAPHY.label} mb-2`}>{t.enrolledCourses}</p>
                  {(() => {
                    const validUserCourses = getValidEnrolledCourses(user.enrolledCourses);
                    if (validUserCourses.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {validUserCourses.slice(0, 3).map((courseId: string) => (
                            <span
                              key={courseId}
                              className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-medium rounded-md truncate max-w-full border border-primary-100"
                            >
                              {getCourseTitle(courseId)}
                            </span>
                          ))}
                          {validUserCourses.length > 3 && (
                            <span
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md border border-slate-200 cursor-help"
                              title={validUserCourses.slice(3).map(getCourseTitle).join(', ')}
                            >
                              +{validUserCourses.length - 3} {t.more}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return <p className={`${TYPOGRAPHY.body} text-xs italic text-slate-400`}>{t.noEnrollments}</p>;
                  })()}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`${BUTTONS.ghost} flex-1 !py-2 text-slate-500 hover:text-primary-600`}
                    title={t.viewDetails}
                    aria-label={t.viewDetails}
                  >
                    <Eye size={16} aria-hidden />
                  </button>
                  {canImpersonate && (
                    <button
                      type="button"
                      onClick={() => dispatch(impersonateUserRequest(user.id))}
                      className={`${BUTTONS.primary} flex-1 !px-2 !py-2 !text-xs`}
                    >
                      <UserSquare2 size={14} aria-hidden /> {t.impersonate}
                    </button>
                  )}
                  {canDeleteUser && (
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
                      className={`${BUTTONS.ghost} !p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0`}
                      title={t.deleteUser}
                      aria-label={t.deleteUser}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 0 && totalItems > 0 && (
        <div className={UI_COMPONENTS.pagination}>
          <p className={TYPOGRAPHY.body}>
            {t.showing} <span className="font-semibold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</span> {t.to}{' '}
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

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          courses={courses}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
