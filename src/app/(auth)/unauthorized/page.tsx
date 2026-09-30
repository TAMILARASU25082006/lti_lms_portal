import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-navy-950">Access Restricted</h1>

        <p className="text-sm text-slate-600 leading-relaxed">
          You do not have the required administrative or instructor permissions to access this workspace.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link
            href="/student"
            className="flex-1 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-xs hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Student Portal</span>
          </Link>
          <Link
            href="/"
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Academy Home
          </Link>
        </div>
      </div>
    </div>
  );
}
