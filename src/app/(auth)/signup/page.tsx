'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signupRequest, googleLoginRequest, clearError } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { Camera, Phone } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, role: authRole, loading, error } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('auth', { returnObjects: true }) as any;

  useEffect(() => {
    if (user) {
      if (authRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
    return () => {
      dispatch(clearError());
    };
  }, [user, authRole, router, dispatch]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let uploadedPhotoURL: string | undefined = undefined;
    
    if (profileFile) {
      try {
        setUploading(true);
        const url = await uploadToCloudinary(profileFile);
        uploadedPhotoURL = url;
      } catch (err: any) {
        // We'll show the error via the existing error handler or a local one
        return; 
      } finally {
        setUploading(false);
      }
    }

    dispatch(signupRequest({ 
      email, 
      pass: password, 
      name, 
      role, 
      phoneNumber, 
      photoURL: uploadedPhotoURL 
    }));
  };


  const handleGoogleLogin = () => {
    dispatch(googleLoginRequest());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-6 md:p-8">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <img 
              src="/logo.png" 
              alt="Mentora" 
              className="h-14 w-auto object-contain mx-auto" 
            />
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.createAccount}</h1>
          <p className="text-slate-500">{t.joinLearners}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl animate-pulse">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t.role}</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${
                  role === 'student' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                👤 {t.user}
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${
                  role === 'admin' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                🛠️ {t.admin}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 group-hover:bg-slate-50">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={32} />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold">{t.profilePhoto || "Photo"}</span>
              </div>
              <input 
                id="photo-upload"
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{t.profilePhoto || "Profile Photo"}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t.fullName}</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t.email}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
              placeholder="+1 234 567 890"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t.password}</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading || uploading}
            className={`w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] mt-2 flex items-center justify-center ${(loading || uploading) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {(loading || uploading) ? (
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{uploading ? "Uploading photo..." : t.createAccount}</span>
              </div>
            ) : t.createAccount}
          </button>
        </form>

        <div className="mt-6 text-center">
           <p className="text-slate-400 text-sm font-medium">{t.orContinueWith}</p>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mt-4 py-3.5 px-4 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-semibold text-slate-700 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t.google}
        </button>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500">
            {t.alreadyHaveAccount} 
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 transition-colors underline-offset-4 hover:underline">{t.signIn}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
