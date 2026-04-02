'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfileRequest, updatePasswordRequest, clearError } from '@/store/slices/authSlice';
import { translations } from '@/utils/translations';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { Camera, Phone, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();
  
  const [name, setName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const t = translations[language].auth;
  const ts = translations[language].settings;

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
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{ts.accountSettings}</h1>
        <p className="text-slate-500">{ts.manageProfile}</p>
      </header>

      {/* Profile Information */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{ts.profileInfo}</h2>
          
          {error && !passError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Photo Upload Area */}
            <div className="flex flex-col items-center sm:flex-row sm:gap-8 mb-8">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('settings-photo-upload')?.click()}>
                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 group-hover:bg-slate-50">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="text-slate-400" size={32} />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
                <input 
                  id="settings-photo-upload"
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="text-center sm:text-left mt-4 sm:mt-0">
                <h3 className="text-sm font-bold text-slate-800">{ts.profilePhoto || "Profile Photo"}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click to upload a new profile picture.<br />
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.fullName}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{ts.phoneNumber || "Phone Number"}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.email}</label>
              <input 
                type="email" 
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none"
              />
              <p className="mt-2 text-xs text-slate-400 italic">{ts.emailCannotChange}</p>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading || uploading || (name === user?.displayName && phoneNumber === (user?.phoneNumber || '') && !photoFile)}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (ts.uploadingPhoto || "Uploading photo...") : (loading ? ts.saving : ts.saveChanges)}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{t.changePassword}</h2>
          
          {(passError || (error && passError)) && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl">
              {passError || error}
            </div>
          )}

          {passSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-r-xl">
              {t.passwordUpdated}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.newPassword}</label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.confirmPassword}</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-100 hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && newPassword ? ts.updating : t.changePassword}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
