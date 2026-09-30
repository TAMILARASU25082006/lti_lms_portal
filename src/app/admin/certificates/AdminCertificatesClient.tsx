'use client';

import React, { useState } from 'react';
import { Award, ShieldAlert, CheckCircle, Search, ExternalLink, Download, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Modal from '@/components/Modal';

interface CertificateItem {
  _id: string;
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  batchName?: string;
  status: 'ACTIVE' | 'REVOKED';
  issuedAt: string;
  attendancePercent: number;
  quizzesAveragePercent: number;
  assignmentsCompletedCount: number;
  revocationReason?: string;
  revokedAt?: string;
}

export default function AdminCertificatesClient({ initialCertificates }: { initialCertificates: CertificateItem[] }) {
  const [certs, setCerts] = useState<CertificateItem[]>(initialCertificates);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = certs.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      search === '' ||
      c.certificateCode.toLowerCase().includes(search.toLowerCase()) ||
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.courseTitle.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAction = async (certId: string, action: 'REVOKE' | 'REINSTATE') => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: certId,
          action,
          revocationReason: action === 'REVOKE' ? revokeReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update certificate');

      setCerts(prev =>
        prev.map(c =>
          c._id === certId
            ? {
                ...c,
                status: action === 'REVOKE' ? 'REVOKED' : 'ACTIVE',
                revocationReason: action === 'REVOKE' ? revokeReason : undefined,
                revokedAt: action === 'REVOKE' ? new Date().toISOString() : undefined,
              }
            : c
        )
      );
      setSelectedCert(null);
      setRevokeReason('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code (e.g. CA-2026), student or course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['ALL', 'ACTIVE', 'REVOKED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th className="py-3.5 px-4">Certificate ID</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Course & Batch</th>
                <th className="py-3.5 px-4">Requirements Met</th>
                <th className="py-3.5 px-4">Issued Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No certificates found.
                  </td>
                </tr>
              ) : (
                filtered.map(cert => (
                  <tr key={cert._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      {cert.certificateCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {cert.studentName}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{cert.courseTitle}</p>
                      {cert.batchName && <span className="text-xs text-slate-400">{cert.batchName}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div>Attendance: <strong className="text-slate-800">{cert.attendancePercent}%</strong></div>
                      <div>Quiz Avg: <strong className="text-slate-800">{cert.quizzesAveragePercent}%</strong></div>
                      <div>Assignments: <strong className="text-slate-800">{cert.assignmentsCompletedCount} completed</strong></div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(cert.issuedAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {cert.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <ShieldAlert className="w-3 h-3" /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/verify/${cert.certificateCode}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Verify in public lookup"
                          className="p-1.5 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {cert.status === 'ACTIVE' ? (
                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setRevokeReason('');
                              setErrorMsg('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(cert._id, 'REINSTATE')}
                            disabled={submitting}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                          >
                            Reinstate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Modal */}
      {selectedCert && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCert(null)}
          title={`Revoke Certificate ${selectedCert.certificateCode}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Revoking this credential will immediately mark it as invalid on the public verification page.
              Enter an administrative reason for auditing.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <p><strong>Student:</strong> {selectedCert.studentName}</p>
              <p><strong>Course:</strong> {selectedCert.courseTitle}</p>
              <p><strong>Issued:</strong> {formatDate(selectedCert.issuedAt)}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for Revocation *
              </label>
              <textarea
                rows={3}
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                placeholder="e.g. Plagiarism confirmed upon post-completion audit; academic integrity violation..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedCert._id, 'REVOKE')}
                disabled={submitting || !revokeReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
