import React from 'react';
import Link from 'next/link';
import { Ban, Mail } from 'lucide-react';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Ban className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-navy-950">Account Suspended</h1>

        <p className="text-sm text-slate-600 leading-relaxed">
          Your access to the Company Academy learning portal has been suspended by administration.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
          If you believe this is in error, please contact the academy registrar or your assigned cohort supervisor.
        </div>

        <div className="pt-2">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-xs hover:bg-navy-800 transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Academic Office</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
