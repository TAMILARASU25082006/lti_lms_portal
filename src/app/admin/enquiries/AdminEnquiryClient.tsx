'use client';

import React, { useState } from 'react';
import { Mail, Clock, CheckCircle2, MessageSquare, Search, Filter, AlertCircle, Save } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  courseInterest?: string;
  message: string;
  status: 'NEW' | 'IN_REVIEW' | 'RESPONDED' | 'ARCHIVED';
  adminNotes?: string;
  createdAt: string;
}

export default function AdminEnquiryClient({ initialEnquiries }: { initialEnquiries: Enquiry[] }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(initialEnquiries[0] || null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'NEW' | 'IN_REVIEW' | 'RESPONDED' | 'ARCHIVED'>('NEW');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSelect = (e: Enquiry) => {
    setSelectedEnquiry(e);
    setNotes(e.adminNotes || '');
    setStatus(e.status);
    setMsg(null);
  };

  const handleUpdate = async () => {
    if (!selectedEnquiry) return;
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryId: selectedEnquiry._id,
          status,
          adminNotes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update enquiry');

      setEnquiries(prev =>
        prev.map(item => (item._id === selectedEnquiry._id ? { ...item, status, adminNotes: notes } : item))
      );
      setSelectedEnquiry(prev => (prev ? { ...prev, status, adminNotes: notes } : null));
      setMsg({ type: 'success', text: 'Enquiry updated successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filtered = enquiries.filter(item => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.courseInterest && item.courseInterest.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">New</span>;
      case 'IN_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">In Review</span>;
      case 'RESPONDED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Responded</span>;
      case 'ARCHIVED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Archived</span>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* List Column */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search enquiries by name, email, topic..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {['ALL', 'NEW', 'IN_REVIEW', 'RESPONDED', 'ARCHIVED'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filterStatus === tab
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
              No admissions enquiries found matching your query.
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item._id}
                onClick={() => handleSelect(item)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedEnquiry?._id === item._id
                    ? 'bg-blue-50/50 border-blue-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
                  {getStatusBadge(item.status)}
                </div>
                <p className="text-xs font-medium text-navy-800 line-clamp-1 mb-1">{item.subject}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.message}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.email}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Column */}
      <div className="lg:col-span-7">
        {selectedEnquiry ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedEnquiry.subject}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                  <span>From: <strong className="text-slate-800">{selectedEnquiry.name}</strong></span>
                  <span>•</span>
                  <span>Email: <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-600 hover:underline">{selectedEnquiry.email}</a></span>
                  {selectedEnquiry.phone && (
                    <>
                      <span>•</span>
                      <span>Phone: <a href={`tel:${selectedEnquiry.phone}`} className="text-blue-600 hover:underline">{selectedEnquiry.phone}</a></span>
                    </>
                  )}
                  <span>•</span>
                  <span>Date: {formatDate(selectedEnquiry.createdAt)}</span>
                </div>
                {selectedEnquiry.courseInterest && (
                  <div className="mt-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                      Course of interest: {selectedEnquiry.courseInterest}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedEnquiry.message}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admissions Review & Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    <option value="NEW">NEW (Unreviewed)</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="RESPONDED">RESPONDED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record follow-up calls, enrollment batch arrangements, or counselor notes..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
              </div>

              {msg && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {msg.text}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Updating...' : 'Save Updates'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Mail className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
            <p className="text-sm font-medium">Select an enquiry to review details and manage enrollment interest</p>
          </div>
        )}
      </div>
    </div>
  );
}
