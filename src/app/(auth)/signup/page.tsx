'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signupRequest, googleLoginRequest, clearError } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { Camera, AlertCircle } from 'lucide-react';

import { AUTH_UI } from '@/constants/ui';
import { VALIDATION_LIMITS } from '@/constants/validation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{name?: string; email?: string; password?: string; phoneNumber?: string; general?: string}>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, role: authRole, loading, error } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('auth', { returnObjects: true }) as any;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/check-admin');
        const data = await res.json();
        if (data.success) {
          setAdminExists(data.adminExists);
        } else {
          setAdminExists(true); // default to restricting on error
        }
      } catch (err) {
        console.error('Failed to check admin status:', err);
        setAdminExists(true);
      }
    };
    checkAdmin();
  }, []);

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
    setFormErrors({});
    
    let hasError = false;
    const errors: {name?: string; email?: string; password?: string; phoneNumber?: string; general?: string} = {};

    if (!name.trim()) {
      errors.name = t.fullName + " is required.";
      hasError = true;
    } else {
      const nameLength = name.trim().length;
      if (nameLength < VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH || nameLength > VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH) {
        errors.name = `Full name must be between ${VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH} and ${VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH} characters.`;
        hasError = true;
      }
    }

    if (!email.trim()) {
      errors.email = t.email + " is required.";
      hasError = true;
    } else if (!email.toLowerCase().endsWith('@gmail.com')) {
      errors.email = 'Email must end with @gmail.com.';
      hasError = true;
    }

    if (!password.trim()) {
      errors.password = t.password + " is required.";
      hasError = true;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
      hasError = true;
    }

    if (phoneNumber) {
      if (!/^\d{10}$/.test(phoneNumber)) {
        errors.phoneNumber = `Phone number must be exactly ${VALIDATION_LIMITS.AUTH.PHONE_LENGTH} digits only.`;
        hasError = true;
      }
    }

    if (hasError) {
      setFormErrors(errors);
      return;
    }
    
    let uploadedPhotoURL: string | undefined = undefined;
    
    if (profileFile) {
      try {
        setUploading(true);
        const url = await uploadToCloudinary(profileFile);
        uploadedPhotoURL = url;
      } catch (err: any) {
        setFormErrors({ general: "Failed to upload profile photo." });
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

  if (!mounted) {
    return null;
  }

  return (
    <div className={AUTH_UI.wrapper}>
      <div className={AUTH_UI.backgroundPattern}></div>
      <div className={AUTH_UI.card}>
        <div className="text-center mb-5">
          <Link href="/" className="inline-block mb-3 hover:scale-105 transition-transform">
            <div className={AUTH_UI.logoWrapper}>
              <img 
                src="/logo.png" 
                alt="Mentora" 
                className="h-6 w-auto object-contain" 
              />
            </div>
          </Link>
          <h1 className={AUTH_UI.title}>{t.createAccount}</h1>
          <p className={AUTH_UI.subtitle}>{t.joinLearners}</p>
        </div>

        {(formErrors.general || error) && (
          <div className="mb-4 p-3 bg-rose-50/50 border border-rose-200 text-rose-600 text-[13px] font-medium rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{formErrors.general || error}</p>
          </div>
        )}

        <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
          {adminExists === false && (
            <div>
              <label className={AUTH_UI.label}>{t.role}</label>
              <div className="grid grid-cols-2 gap-3 bg-zinc-50/50 p-1.5 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-1.5 px-4 rounded-lg text-[13px] transition-all font-semibold ${
                    role === 'student' 
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' 
                      : 'text-zinc-500 hover:text-zinc-900 transparent'
                  }`}
                >
                  {t.user}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-1.5 px-4 rounded-lg text-[13px] transition-all font-semibold ${
                    role === 'admin' 
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' 
                      : 'text-zinc-500 hover:text-zinc-900 transparent'
                  }`}
                >
                  {t.admin}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center mb-4 mt-2">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
              <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-zinc-400 group-hover:bg-white shadow-sm">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-zinc-400 group-hover:text-zinc-600 transition-colors" size={20} />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-bold">{t.profilePhoto || "Photo"}</span>
              </div>
              <input 
                id="photo-upload"
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          <div>
            <label className={AUTH_UI.label}>{t.fullName}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={`${AUTH_UI.input} ${formErrors.name ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
              placeholder={t.namePlaceholder || "John Doe"}
            />
            {formErrors.name && (
              <p className="text-rose-500 text-xs mt-1.5 font-medium">
                {formErrors.name}
              </p>
            )}
          </div>
          <div>
            <label className={AUTH_UI.label}>{t.email}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
              }}
              className={`${AUTH_UI.input} ${formErrors.email ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
              placeholder="name@gmail.com"
            />
            {formErrors.email && (
              <p className="text-rose-500 text-xs mt-1.5 font-medium">
                {formErrors.email}
              </p>
            )}
          </div>
          <div>
            <label className={AUTH_UI.label}>Phone Number</label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (formErrors.phoneNumber) setFormErrors(prev => ({ ...prev, phoneNumber: undefined }));
              }}
              className={`${AUTH_UI.input} ${formErrors.phoneNumber ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
              placeholder={t.phonePlaceholder || "+1 234 567 890"}
            />
            {formErrors.phoneNumber && (
              <p className="text-rose-500 text-xs mt-1.5 font-medium">
                {formErrors.phoneNumber}
              </p>
            )}
          </div>
          <div>
            <label className={AUTH_UI.label}>{t.password}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formErrors.password) setFormErrors(prev => ({ ...prev, password: undefined }));
              }}
              className={`${AUTH_UI.input} ${formErrors.password ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
              placeholder={t.passwordPlaceholder || "••••••••"}
            />
            {formErrors.password && (
              <p className="text-rose-500 text-xs mt-1.5 font-medium">
                {formErrors.password}
              </p>
            )}
          </div>
          
          <div className="pt-2">
            <button 
              disabled={loading || uploading}
              className={AUTH_UI.buttonPrimary}
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
          </div>
        </form>

        <div className={AUTH_UI.dividerWrapper}>
          <div className={AUTH_UI.dividerLine}>
            <div className={AUTH_UI.dividerLineInner}></div>
          </div>
          <div className={AUTH_UI.dividerText}>
            <span className={AUTH_UI.dividerTextInner}>{t.orContinueWith}</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || uploading}
          className={AUTH_UI.buttonGoogle}
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t.google || t.signInWithGoogle}
        </button>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <p className={AUTH_UI.footerText}>
            Already have an account? 
            <Link href="/login" className={`ml-1.5 ${AUTH_UI.link}`}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
