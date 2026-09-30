'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { ShieldCheck, AlertCircle, Info, Lock, ArrowRight, UserCheck, GraduationCap, Shield } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/student';

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [loadingDev, setLoadingDev] = useState(false);

  const handleGoogleSignIn = () => {
    setLoadingGoogle(true);
    signIn('google', { callbackUrl });
  };

  const handleDevSignIn = (emailToUse: string) => {
    setLoadingDev(true);
    signIn('dev-impersonation', { email: emailToUse, callbackUrl });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <BrandLogo />
          </div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Sign In to Company Academy</h1>
          <p className="text-xs text-slate-500">
            Official portal for students, tutors, and administrators
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authentication Notice</p>
              <p className="mt-0.5">
                {error === 'EmailNotVerified'
                  ? 'Your Google account does not have a verified email address. A verified Google email is required.'
                  : error === 'AccountSuspended'
                  ? 'Your account has been suspended by administration. Please contact academic support.'
                  : error === 'OAuthSignin' || error === 'OAuthCallback'
                  ? 'Google authentication was cancelled or could not be verified. Ensure Google Cloud OAuth credentials are configured.'
                  : `Sign in error: ${error}`}
              </p>
            </div>
          </div>
        )}

        {/* Primary OAuth Action: Google Sign In */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-60"
          >
            {/* Google G SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loadingGoogle ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            We request only OpenID profile & verified email. Passwords are never collected.
          </p>
        </div>

        {/* Security & Access Notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>
            New students are registered automatically upon first Google login. Course access is granted once your enrollment in an academy cohort is approved.
          </p>
        </div>

        {/* Optional Local Dev Switcher */}
        {process.env.NEXT_PUBLIC_ALLOW_DEV_IMPERSONATION === 'true' && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span>Development Role Switcher</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDevSignIn('student@companyacademy.com')}
                disabled={loadingDev}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDevSignIn('tutor@companyacademy.com')}
                disabled={loadingDev}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Tutor</span>
              </button>

              <button
                type="button"
                onClick={() => handleDevSignIn('admin@companyacademy.com')}
                disabled={loadingDev}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-900 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-navy-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
