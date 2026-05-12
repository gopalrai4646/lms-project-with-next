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
  const { role, permissions } = useAppSelector(state => state.auth);

  const canAssignPlans = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'training_plans_assign'));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">{t.userDetails}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0 shadow-sm border border-indigo-100/50 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{user.name || t.noNameProvided}</h3>
              <p className="text-slate-500 font-medium text-sm mt-0.5">{user.email}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                <span className={`px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase rounded-md border ${user.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {user.role}
                </span>
                
                {user.phoneNumber && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                    <Phone size={12} className="text-slate-400" />
                    {user.phoneNumber}
                  </div>
                )}
                
                {user.createdAt && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-slate-400 font-medium mr-0.5">{t.joinDate}:</span>
                    {formatDate(user.createdAt, i18n.language, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList size={16} className="text-slate-400" /> {t.assignedTrainingPlans} ({user.assignedTrainingPlans?.length || 0})
              </h4>
              <button 
                onClick={() => setIsAssigning(!isAssigning)}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  !canAssignPlans 
                    ? 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-60' 
                    : 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
                disabled={!canAssignPlans && !isAssigning} // Allow closing if already open
                title={!canAssignPlans ? (t.staff.noPermissionToAssign || "No permission to assign") : ""}
              >
                {isAssigning ? t.cancel : <><Plus size={12} /> {t.assignTrainingPlan}</>}
              </button>
            </div>
            
            {isAssigning && (
              <div className="mb-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <select 
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white text-slate-900"
                >
                  <option value="">{t.selectTrainingPlan}</option>
                  {trainingPlans.filter(tp => !user.assignedTrainingPlans?.includes(tp.id)).map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAssignPlan}
                  disabled={!selectedPlanId}
                  className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {t.assignTrainingPlan}
                </button>
              </div>
            )}

            {user.assignedTrainingPlans && user.assignedTrainingPlans.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {user.assignedTrainingPlans.map(id => (
                  <li key={id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-700 shadow-sm group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span> 
                      <span className="truncate">{getPlanName(id)}</span>
                    </div>
                    {canAssignPlans && (
                      <button
                        onClick={() => handleUnassignPlan(id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50"
                        title={t.remove || "Remove"}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic p-2 bg-white rounded-xl border border-slate-100 border-dashed text-center">{t.noTrainingPlansAssigned}</p>
            )}
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={16} className="text-slate-400" /> {t.enrolledCourses} ({user.enrolledCourses?.length || 0})
              </h4>
              <button 
                onClick={() => setIsEnrolling(!isEnrolling)}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  !canEnrollCourses 
                    ? 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-60' 
                    : 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
                disabled={!canEnrollCourses && !isEnrolling}
                title={!canEnrollCourses ? (t.staff.noPermissionToEnroll || "No permission to enroll") : ""}
              >
                {isEnrolling ? t.cancel : <><Plus size={12} /> {t.enrollInCourse || "Enroll in Course"}</>}
              </button>
            </div>

            {isEnrolling && (
              <div className="mb-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white text-slate-900"
                >
                  <option value="">{t.selectCourse || "Select Course"}</option>
                  {courses.filter(c => !user.enrolledCourses?.includes(c.id)).map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                <button 
                  onClick={handleEnrollCourse}
                  disabled={!selectedCourseId}
                  className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {t.enrollBtn || "Enroll"}
                </button>
              </div>
            )}

            {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {user.enrolledCourses.map(id => (
                  <li key={id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-indigo-700 shadow-sm group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span> 
                      <span className="truncate">{getCourseTitle(id)}</span>
                    </div>
                    {canEnrollCourses && (
                      <button
                        onClick={() => handleUnenrollCourse(id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50"
                        title={t.unenroll || "Unenroll"}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic p-2 bg-white rounded-xl border border-slate-100 border-dashed text-center">{t.noCoursesEnrolled}</p>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Heart size={16} className="text-rose-400 fill-rose-400" /> {t.savedCourses} ({user.savedCourses?.length || 0})
            </h4>
            {user.savedCourses && user.savedCourses.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {user.savedCourses.map(id => (
                  <li key={id} className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-rose-600 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span> 
                    {getCourseTitle(id)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic p-2 bg-white rounded-xl border border-slate-100 border-dashed text-center">{t.noCoursesSaved}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
