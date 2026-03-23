'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfileRequest, clearError } from '@/store/slices/authSlice';
import { translations } from '@/utils/translations';

export default function SettingsPage() {
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();
  const [name, setName] = useState(user?.displayName || '');
  const [success, setSuccess] = useState(false);

  const t = translations[language].auth;

  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    dispatch(updateProfileRequest({ displayName: name }));
  };

  useEffect(() => {
    if (!loading && !error && name === user?.displayName && name !== '') {
       // This is a naive check for success, ideally we'd have a success flag in state
       // but for now we'll just assume if loading finished and no error, it worked.
    }
  }, [loading, error, user, name]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Account Settings</h1>
        <p className="text-slate-500">Manage your profile and account preferences</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.fullName}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-slate-50"
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
              <p className="mt-2 text-xs text-slate-400 italic">Email cannot be changed for security reasons.</p>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading || name === user?.displayName}
                className={`px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
