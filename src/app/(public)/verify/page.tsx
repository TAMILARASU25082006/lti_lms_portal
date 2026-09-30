'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Award, Search, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VerifySearchPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/verify/${encodeURIComponent(code.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <section className="bg-navy-950 text-white py-16 border-b border-navy-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Award className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Verify Academy Certificate</h1>
          <p className="text-slate-300 text-sm mt-2">
            Verify the authenticity of an official completion certificate issued by Company Academy.
          </p>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Certificate Verification Code
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="e.g. CA-2026-8F29A"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase font-mono text-sm tracking-wide"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                The code is located at the bottom-left of every official Company Academy completion PDF.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verify Authenticity
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
