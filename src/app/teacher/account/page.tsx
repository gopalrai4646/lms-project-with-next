'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfileRequest, updatePasswordRequest } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { Camera, Phone, User as UserIcon, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import { VALIDATION_LIMITS } from '@/constants/validation';

export default function TeacherAccountPage() {
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { t: i18nT } = useTranslation();
  const t = i18nT('auth', { returnObjects: true }) as any;
  const ts = i18nT('settings', { returnObjects: true }) as any;
  const tTeacher = i18nT('teacher', { returnObjects: true }) as any;

  const [name, setName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{name?: string; phoneNumber?: string; newPassword?: string; confirmPassword?: string}>({});

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      setPhotoPreview(user.photoURL || null);
      setPhotoFile(null);
    }
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let currentPhotoURL = user?.photoURL || null;
    
    if (photoFile) {
      try {
        setUploading(true);
        currentPhotoURL = await uploadToCloudinary(photoFile);
      } catch (err: any) {
        return; 
      } finally {
        setUploading(false);
      }
    }

    dispatch(updateProfileRequest({ 
      displayName: name, 
      photoURL: currentPhotoURL || undefined,
      phoneNumber: phoneNumber 
    }));
  };

  useEffect(() => {
    if (!loading && !error && !passError && newPassword !== '') {
        setPassSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
    }
  }, [loading, error, passError]);

  if (!user) return null;

  return (
    <div className={`${UI_COMPONENTS.pageContainer} animate-in fade-in duration-700`}>
      {/* ─── Page Header ─── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 w-full">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
             <UserIcon size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={`${TYPOGRAPHY.h1} truncate`}>{tTeacher?.account?.accountSettings || 'Account Settings'}</h1>
            <p className={`${TYPOGRAPHY.body} mt-1 truncate`}>{tTeacher?.account?.manageProfile || 'Manage your teacher profile and preferences'}</p>
          </div>
        </div>
      </header>

      {/* ─── Settings Form ─── */}
      <div className={UI_COMPONENTS.card}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setPassError(null);
          setPassSuccess(false);
          setFormErrors({});

          const hasProfileChanges = name !== user?.displayName || phoneNumber !== (user?.phoneNumber || '') || photoFile;
          const hasPasswordChanges = newPassword !== '' || confirmPassword !== '';

          // 1. Handle Profile Update
          if (hasProfileChanges) {
            let hasProfileError = false;
            const pErrors: {name?: string; phoneNumber?: string} = {};
            
            const nameLength = name.trim().length;
            if (nameLength < VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH || nameLength > VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH) {
              pErrors.name = `Full name must be between ${VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH} and ${VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH} characters.`;
              hasProfileError = true;
            }
            
            if (phoneNumber) {
              if (!/^\d{10}$/.test(phoneNumber)) {
                pErrors.phoneNumber = `Phone number must be exactly ${VALIDATION_LIMITS.AUTH.PHONE_LENGTH} digits only.`;
                hasProfileError = true;
              }
            }

            if (hasProfileError) {
              setFormErrors(pErrors);
              return;
            }

            handleProfileSubmit(e);
          }

          // 2. Handle Password Update
          if (hasPasswordChanges) {
            let hasPassError = false;
            const pwErrors: {newPassword?: string; confirmPassword?: string} = {};

            if (newPassword.length < 6) {
              pwErrors.newPassword = t.passwordMinLength;
              hasPassError = true;
            }
            if (newPassword !== confirmPassword) {
              pwErrors.confirmPassword = t.passwordMismatch;
              hasPassError = true;
            }

            if (hasPassError) {
              setFormErrors(prev => ({ ...prev, ...pwErrors }));
              return;
            }
            
            dispatch(updatePasswordRequest({ password: newPassword }));
          }
        }} className="space-y-8">
          
          {/* Profile & Security Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className={TYPOGRAPHY.h2}>{ts.profileInfo}</h2>
            </div>
            
            {error && !passError && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium animate-in slide-in-from-top-4 duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {(passError || (error && passError)) && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium animate-in slide-in-from-top-4 duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{passError || error}</span>
              </div>
            )}

            {passSuccess && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-700 rounded-lg text-sm font-medium animate-in slide-in-from-top-4 duration-300">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{t.passwordUpdated}</span>
              </div>
            )}

            {/* Row 1: Photo, Full Name, Phone side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100/50 h-full">
                <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById('settings-photo-upload')?.click()}>
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary-400 group-hover:shadow-lg group-hover:shadow-primary-100/50">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                        alt="Profile" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <UserIcon className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-primary-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[1px]">
                    <Camera className="text-white" size={16} />
                  </div>
                  <input 
                    id="settings-photo-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <h3 className={`${TYPOGRAPHY.h3} mb-1 leading-tight`}>{ts.profilePhoto || "Photo"}</h3>
                  <p className={`${TYPOGRAPHY.body} text-[11px] leading-tight`}>
                    {tTeacher?.account?.clickToUpdateAvatar || 'Click to update avatar.'}
                  </p>
                </div>
              </div>

              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.fullName}</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  className={`${UI_COMPONENTS.input} ${formErrors.name ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
                  placeholder={ts.namePlaceholder || "Your name"}
                />
                {formErrors.name && (
                  <p className="text-rose-500 text-xs mt-1.5 font-medium">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{ts.phoneNumber || "Phone Number"}</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (formErrors.phoneNumber) setFormErrors(prev => ({ ...prev, phoneNumber: undefined }));
                    }}
                    className={`${UI_COMPONENTS.input} !pl-10 ${formErrors.phoneNumber ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
                    placeholder={ts.phonePlaceholder || "+1 234 567 890"}
                  />
                </div>
                {formErrors.phoneNumber && (
                  <p className="text-rose-500 text-xs mt-1.5 font-medium">
                    {formErrors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Email, Passwords */}
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.email}</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className={`${UI_COMPONENTS.input} bg-slate-50 text-slate-500 cursor-not-allowed opacity-80`}
                />
                <p className="mt-2 text-[11px] text-slate-400 font-medium flex items-start gap-1.5">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{ts.emailCannotChange}</span>
                </p>
              </div>

              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.newPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (formErrors.newPassword) setFormErrors(prev => ({ ...prev, newPassword: undefined }));
                    }}
                    className={`${UI_COMPONENTS.input} !pl-10 ${formErrors.newPassword ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
                    placeholder={ts.newPasswordPlaceholder || "Leave blank to keep current"}
                  />
                </div>
                {formErrors.newPassword && (
                  <p className="text-rose-500 text-xs mt-1.5 font-medium">
                    {formErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.confirmPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className={`${UI_COMPONENTS.input} !pl-10 ${formErrors.confirmPassword ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
                    placeholder={ts.confirmPasswordPlaceholder || "Confirm new password"}
                  />
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-rose-500 text-xs mt-1.5 font-medium">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </section>

          {user.teacherProfile && (
            <div className="pt-6 mt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">{tTeacher?.account?.teachingProfileReadOnly || 'Teaching Profile (Read Only)'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{tTeacher?.account?.teachingExperience || 'Teaching Experience'}</p>
                  <p className="text-sm text-slate-800 font-medium">{t?.teacherSignup?.experienceOptions?.[user.teacherProfile.experience] || user.teacherProfile.experience}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{tTeacher?.account?.videoProficiency || 'Video Proficiency'}</p>
                  <p className="text-sm text-slate-800 font-medium">{t?.teacherSignup?.videoOptions?.[user.teacherProfile.videoPro] || user.teacherProfile.videoPro}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{tTeacher?.account?.audienceSize || 'Audience Size'}</p>
                  <p className="text-sm text-slate-800 font-medium">{t?.teacherSignup?.audienceOptions?.[user.teacherProfile.audience] || user.teacherProfile.audience}</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              disabled={loading || uploading || (name === user?.displayName && phoneNumber === (user?.phoneNumber || '') && !photoFile && !newPassword && !confirmPassword)}
              className={BUTTONS.primary}
            >
              {(loading || uploading) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {uploading ? "Uploading..." : ts.saving}
                </>
              ) : ts.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
