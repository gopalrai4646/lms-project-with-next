'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfileRequest, updatePasswordRequest, clearError } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { Camera, Phone, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { t: i18nT } = useTranslation();
  const t = i18nT('auth', { returnObjects: true }) as any;
  const adminT = i18nT('admin', { returnObjects: true }) as any;

  const [name, setName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);
  const ts = i18nT('settings', { returnObjects: true }) as any;

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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (newPassword !== confirmPassword) {
      setPassError(t.passwordMismatch);
      return;
    }

    if (newPassword.length < 6) {
      setPassError(t.passwordMinLength);
      return;
    }

    dispatch(updatePasswordRequest({ password: newPassword }));
  };

  useEffect(() => {
    if (!loading && !error && !passError && newPassword !== '') {
        setPassSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
    }
  }, [loading, error, passError]);

  return (
    <div className="max-w-4xl mx-auto py-0">
      <header className="mb-6 px-2">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{ts.accountSettings}</h1>
        <p className="text-sm text-slate-500">{ts.manageProfile}</p>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={async (e) => {
          e.preventDefault();
          setPassError(null);
          setPassSuccess(false);

          const hasProfileChanges = name !== user?.displayName || phoneNumber !== (user?.phoneNumber || '') || photoFile;
          const hasPasswordChanges = newPassword !== '' || confirmPassword !== '';

          // 1. Handle Profile Update
          if (hasProfileChanges) {
            handleProfileSubmit(e);
          }

          // 2. Handle Password Update
          if (hasPasswordChanges) {
            if (newPassword !== confirmPassword) {
              setPassError(t.passwordMismatch);
              return;
            }
            if (newPassword.length < 6) {
              setPassError(t.passwordMinLength);
              return;
            }
            dispatch(updatePasswordRequest({ password: newPassword }));
          }
        }} className="p-6 sm:p-8">
          
          {/* Profile Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserIcon size={16} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{ts.profileInfo}</h2>
            </div>
            
            {error && !passError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            {/* Row 1: Photo + Full Name side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50 transition-colors hover:bg-slate-50">
                <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById('settings-photo-upload')?.click()}>
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-100/50">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <UserIcon className="text-slate-300" size={32} />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-indigo-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[1px]">
                    <Camera className="text-white" size={18} />
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
                  <h3 className="text-sm font-bold text-slate-800 mb-0.5">{ts.profilePhoto || "Photo"}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Click to update your avatar. PNG or JPG supported.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">{t.fullName}</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-slate-900 placeholder:text-slate-400 font-medium text-sm"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Row 2: Phone + Email side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">{ts.phoneNumber || "Phone Number"}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-slate-900 placeholder:text-slate-400 font-medium text-sm"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">{t.email}</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none font-medium opacity-70 text-sm"
                />
                <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5 ml-1">
                  {ts.emailCannotChange}
                </p>
              </div>
            </div>
          </div>

          {/* Security Separator */}
          <div className="my-6 border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-slate-600 rounded-sm relative after:content-[''] after:absolute after:top-[-3px] after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:border-2 after:border-slate-600 after:rounded-t-full"></div>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{t.changePassword}</h2>
            </div>
            
            {(passError || (error && passError)) && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-300">
                {passError || error}
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-300">
                {t.passwordUpdated}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">{t.newPassword}</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-slate-900 font-medium text-sm"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">{t.confirmPassword}</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-slate-900 font-medium text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit"
              disabled={loading || uploading || (name === user?.displayName && phoneNumber === (user?.phoneNumber || '') && !photoFile && !newPassword && !confirmPassword)}
              className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-sm"
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
