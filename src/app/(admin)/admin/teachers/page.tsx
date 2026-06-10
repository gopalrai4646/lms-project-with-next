'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { approveTeacherRequest, User } from '@/store/slices/userSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { useTranslation } from 'react-i18next';
import { Search, CheckCircle, Clock, Eye, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import { formatDate } from '@/utils/dateUtils';

export default function AdminTeachersPage() {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector(state => state.users);
  const { t: i18nT, i18n } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleApprove = (userId: string) => {
    if (window.confirm("Are you sure you want to approve this teacher?")) {
      dispatch(approveTeacherRequest(userId));
    }
  };

  const pendingTeachers = useMemo(() => {
    return users.filter(u => u.role === 'teacher' && u.status === 'pending' && 
      (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.email?.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [users, searchTerm]);

  const approvedTeachers = useMemo(() => {
    return users.filter(u => u.role === 'teacher' && u.status === 'approved' && 
      (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.email?.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [users, searchTerm]);

  if (!isMounted) return null;

  return (
    <div className="space-y-6 bg-background min-h-screen p-0 animate-in fade-in duration-700">
      <header>
        <h1 className={TYPOGRAPHY.h1}>Manage Teachers</h1>
        <p className={`${TYPOGRAPHY.body} mt-1`}>Review and approve teacher applications</p>
      </header>

      <div className={`${UI_COMPONENTS.card} !p-2 w-full min-w-0 flex flex-col sm:flex-row gap-4 sm:items-center justify-between`}>
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={16} />
            Pending ({users.filter(u => u.role === 'teacher' && u.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'approved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle size={16} />
            Approved ({users.filter(u => u.role === 'teacher' && u.status === 'approved').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input
            type="search"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${UI_COMPONENTS.input} pl-10 w-full`}
          />
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className={`${UI_COMPONENTS.emptyStateCard} py-12`}>
          <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
          <p className={`${TYPOGRAPHY.body} mt-3 animate-pulse`}>Loading teachers...</p>
        </div>
      ) : activeTab === 'pending' ? (
        pendingTeachers.length === 0 ? (
          <div className={UI_COMPONENTS.emptyStateCard}>
            <ShieldCheck className="text-slate-300" size={48} />
            <p className={`${TYPOGRAPHY.h3} mt-4 text-slate-400`}>No Pending Applications</p>
            <p className={`${TYPOGRAPHY.body} mt-1 text-slate-400 max-w-xs`}>All caught up! There are no teachers waiting for approval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingTeachers.map(teacher => (
              <div key={teacher.id} className={`${UI_COMPONENTS.card} hover:shadow-md transition-shadow`}>
                <div className="flex items-start gap-4">
                  <img 
                    src={teacher.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                    alt="" 
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={TYPOGRAPHY.h3}>{teacher.name || 'Unnamed Teacher'}</h3>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail size={14} /> <span className="truncate">{teacher.email}</span>
                      </div>
                      {teacher.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Phone size={14} /> <span>{teacher.phoneNumber}</span>
                        </div>
                      )}
                      {teacher.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar size={14} /> <span>Applied: {formatDate(teacher.createdAt, i18n.language)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleApprove(teacher.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors shrink-0 flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
                
                {teacher.teacherProfile && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Questionnaire Answers</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Teaching Experience</p>
                        <p className="text-sm text-slate-800 font-medium">{teacher.teacherProfile.experience}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Video Proficiency</p>
                        <p className="text-sm text-slate-800 font-medium">{teacher.teacherProfile.videoPro}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Audience Size</p>
                        <p className="text-sm text-slate-800 font-medium">{teacher.teacherProfile.audience}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        approvedTeachers.length === 0 ? (
          <div className={UI_COMPONENTS.emptyStateCard}>
            <Search className="text-slate-300" size={48} />
            <p className={`${TYPOGRAPHY.h3} mt-4 text-slate-400`}>No Approved Teachers Found</p>
          </div>
        ) : (
          <div className={UI_COMPONENTS.tableWrapper}>
            <div className={UI_COMPONENTS.tableContainer}>
              <table className={UI_COMPONENTS.table}>
                <thead className={UI_COMPONENTS.tableHeader}>
                  <tr>
                    <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>Teacher Profile</th>
                    <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>Contact</th>
                    <th className={`px-5 py-3.5 ${TYPOGRAPHY.label}`}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedTeachers.map((teacher: User) => (
                    <tr key={teacher.id} className={UI_COMPONENTS.tableRow}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={teacher.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200" 
                          />
                          <div>
                            <p className={`${TYPOGRAPHY.h3} font-medium`}>{teacher.name || 'Unknown'}</p>
                            {teacher.createdAt && (
                              <p className="text-xs text-slate-500">Joined {formatDate(teacher.createdAt, i18n.language)}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <p className={`${TYPOGRAPHY.body} text-sm flex items-center gap-2`}><Mail size={12} className="text-slate-400" /> {teacher.email}</p>
                          {teacher.phoneNumber && (
                            <p className={`${TYPOGRAPHY.body} text-sm flex items-center gap-2`}><Phone size={12} className="text-slate-400" /> {teacher.phoneNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-200">
                          {teacher.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
