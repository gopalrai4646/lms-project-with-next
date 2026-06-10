'use client';

import { User } from '@/store/slices/userSlice';
import { Course } from '@/store/slices/courseSlice';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { assignTrainingPlanRequest, unassignTrainingPlanRequest, enrollUserRequest, unenrollUserRequest } from '@/store/slices/userSlice';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ClipboardList, BookOpen, Heart, Plus, Phone, Calendar, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { hasPermission } from '@/lib/permissions';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import CustomSelect from '@/components/common/CustomSelect';

interface Props {
  user: User;
  courses: Course[];
  onClose: () => void;
}

export default function UserDetailsModal({ user, courses, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { trainingPlans } = useAppSelector(state => state.trainingPlans);
  const { t: i18nT, i18n } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;
  const language = i18n.language;
  const { user: currentUser, role, permissions } = useAppSelector(state => state.auth);

  const canAssignPlans = role === 'admin' || role === 'teacher' || (role === 'staff' && hasPermission(permissions as any, 'training_plans_assign'));
  const canEnrollCourses = role === 'admin';

  const [isAssigning, setIsAssigning] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    if (trainingPlans.length === 0) {
      dispatch(fetchTrainingPlansRequest());
    }
  }, [dispatch, trainingPlans.length]);

  const validAssignedPlans = user.assignedTrainingPlans?.filter(id => trainingPlans.some(tp => tp.id === id)) || [];
  const validEnrolledCourses = user.enrolledCourses?.filter(id => courses.some(c => c.id === id)) || [];
  const validSavedCourses = user.savedCourses?.filter(id => courses.some(c => c.id === id)) || [];

  const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || t.unknownCourse;
  const getPlanName = (id: string) => trainingPlans.find(tp => tp.id === id)?.name || t.unknownPlan;

  const handleAssignPlan = () => {
    if (!selectedPlanId) return;
    
    if (!canAssignPlans) {
      alert(t.staff.noPermissionToAssign || "You don't have permission to assign the training plan");
      return;
    }

    dispatch(assignTrainingPlanRequest({
      userId: user.id,
      trainingPlanIds: [selectedPlanId]
    }));
    setIsAssigning(false);
    setSelectedPlanId('');
  };

  const handleUnassignPlan = (planId: string) => {
    dispatch(unassignTrainingPlanRequest({
      userId: user.id,
      trainingPlanId: planId
    }));
  };

  const handleEnrollCourse = () => {
    if (!selectedCourseId) return;
    
    if (!canEnrollCourses) {
      alert(t.staff.noPermissionToEnroll || "You don't have permission to enroll the user in courses");
      return;
    }

    dispatch(enrollUserRequest({
      userId: user.id,
      courseId: selectedCourseId
    }));
    setIsEnrolling(false);
    setSelectedCourseId('');
  };

  const handleUnenrollCourse = (courseId: string) => {
    if (!canEnrollCourses) return;
    if (window.confirm(t.unenrollConfirm || "Are you sure you want to unenroll this user?")) {
      dispatch(unenrollUserRequest({
        userId: user.id,
        courseId
      }));
    }
  };

  return (
    <div className={UI_COMPONENTS.modalBackdrop}>
      <div className="absolute inset-0 transition-opacity" onClick={onClose} />
      <div className={`${UI_COMPONENTS.modalContent} relative flex flex-col max-h-[90vh]`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className={TYPOGRAPHY.h2}>{t.userDetails}</h2>
          <button onClick={onClose} className={`${BUTTONS.ghost} !p-2`}>
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-6 overflow-y-auto no-scrollbar flex-1">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-3xl font-semibold shrink-0 border border-primary-100 overflow-hidden shadow-sm">
              <img 
                src={user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                alt={user.name || "User"} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1">
              <h3 className={TYPOGRAPHY.h3}>{user.name || t.noNameProvided}</h3>
              <p className={`${TYPOGRAPHY.body} text-xs mt-0.5`}>{user.email}</p>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${user.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {user.role}
                </span>
                
                {user.phoneNumber && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Phone size={14} className="text-slate-400" />
                    {user.phoneNumber}
                  </div>
                )}
                
                {user.createdAt && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{t.joinDate}:</span>
                    <span className="font-semibold text-slate-700">
                      {formatDate(user.createdAt, i18n.language, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className={`${TYPOGRAPHY.h3} text-sm flex items-center gap-2`}>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ClipboardList size={14} />
                </div>
                {t.assignedTrainingPlans} <span className="text-slate-400 font-normal">({validAssignedPlans.length})</span>
              </h4>
              <button 
                onClick={() => setIsAssigning(!isAssigning)}
                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                  !canAssignPlans 
                    ? 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-60' 
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50'
                }`}
                disabled={!canAssignPlans && !isAssigning}
                title={!canAssignPlans ? (t.staff.noPermissionToAssign || "No permission to assign") : (t.assignTrainingPlan)}
              >
                {isAssigning ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>
            
            {isAssigning && (
              <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <CustomSelect 
                  value={selectedPlanId}
                  onChange={(val) => setSelectedPlanId(val)}
                  options={[
                    { value: '', label: t.selectTrainingPlan || 'Select Training Plan' },
                    ...trainingPlans
                      .filter(tp => role === 'teacher' ? tp.createdBy === currentUser?.uid : true)
                      .filter(tp => !validAssignedPlans.includes(tp.id))
                      .map(plan => ({
                      value: plan.id,
                      label: plan.name
                    }))
                  ]}
                />
                <button 
                  onClick={handleAssignPlan}
                  disabled={!selectedPlanId}
                  className={`${BUTTONS.primary} !bg-indigo-600 hover:!bg-indigo-700 !ring-indigo-600/20`}
                >
                  {t.assignTrainingPlan}
                </button>
              </div>
            )}

            {validAssignedPlans.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {validAssignedPlans.map(id => (
                  <li key={id} className={UI_COMPONENTS.listRow}>
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span> 
                      <span className="truncate text-sm font-medium text-slate-700">{getPlanName(id)}</span>
                    </div>
                    {canAssignPlans && (role !== 'teacher' || trainingPlans.find(tp => tp.id === id)?.createdBy === currentUser?.uid) && (
                      <button
                        onClick={() => handleUnassignPlan(id)}
                        className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0`}
                        title={t.remove || "Remove"}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${TYPOGRAPHY.body} text-xs italic p-3 bg-white rounded-xl border border-slate-200 border-dashed text-center`}>{t.noTrainingPlansAssigned}</p>
            )}
          </div>
          
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className={`${TYPOGRAPHY.h3} text-sm flex items-center gap-2`}>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <BookOpen size={14} />
                </div>
                {t.enrolledCourses} <span className="text-slate-400 font-normal">({validEnrolledCourses.length})</span>
              </h4>
              <button 
                onClick={() => setIsEnrolling(!isEnrolling)}
                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                  !canEnrollCourses 
                    ? 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-60' 
                    : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50'
                }`}
                disabled={!canEnrollCourses && !isEnrolling}
                title={!canEnrollCourses ? (t.staff.noPermissionToEnroll || "No permission to enroll") : (t.enrollInCourse)}
              >
                {isEnrolling ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>

            {isEnrolling && (
              <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <CustomSelect 
                  value={selectedCourseId}
                  onChange={(val) => setSelectedCourseId(val)}
                  options={[
                    { value: '', label: t.selectCourse || 'Select Course' },
                    ...courses.filter(c => !validEnrolledCourses.includes(c.id)).map(course => ({
                      value: course.id,
                      label: course.title
                    }))
                  ]}
                />
                <button 
                  onClick={handleEnrollCourse}
                  disabled={!selectedCourseId}
                  className={`${BUTTONS.primary} !bg-emerald-600 hover:!bg-emerald-700 !ring-emerald-600/20`}
                >
                  {t.enrollBtn || "Enroll"}
                </button>
              </div>
            )}

            {validEnrolledCourses.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {validEnrolledCourses.map(id => (
                  <li key={id} className={UI_COMPONENTS.listRow}>
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span> 
                      <span className="truncate text-sm font-medium text-slate-700">{getCourseTitle(id)}</span>
                    </div>
                    {canEnrollCourses && (
                      <button
                        onClick={() => handleUnenrollCourse(id)}
                        className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0`}
                        title={t.unenroll || "Unenroll"}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${TYPOGRAPHY.body} text-xs italic p-3 bg-white rounded-xl border border-slate-200 border-dashed text-center`}>{t.noCoursesEnrolled}</p>
            )}
          </div>

          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
            <h4 className={`${TYPOGRAPHY.h3} text-sm mb-4 flex items-center gap-2`}>
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
                <Heart size={14} className="fill-rose-500/20" />
              </div>
              {t.savedCourses} <span className="text-slate-400 font-normal">({validSavedCourses.length})</span>
            </h4>
            {validSavedCourses.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {validSavedCourses.map(id => (
                  <li key={id} className={`${UI_COMPONENTS.listRow} !justify-start gap-2.5`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span> 
                    <span className="truncate text-sm font-medium text-slate-700">{getCourseTitle(id)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${TYPOGRAPHY.body} text-xs italic p-3 bg-white rounded-xl border border-slate-200 border-dashed text-center`}>{t.noCoursesSaved}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
