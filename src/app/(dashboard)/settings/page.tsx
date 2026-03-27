'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfileRequest, updatePasswordRequest, clearError } from '@/store/slices/authSlice';
import { translations } from '@/utils/translations';

export default function SettingsPage() {
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();
  
  const [name, setName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const t = translations[language].auth;
  const ts = translations[language].settings;

  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateProfileRequest({ displayName: name }));
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
                disabled={loading || name === user?.displayName}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && name !== user?.displayName ? ts.saving : ts.saveChanges}
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
