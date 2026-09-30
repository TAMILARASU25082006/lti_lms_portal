'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { UserPlus, Mail, ShieldCheck, CheckCircle2, AlertCircle, Clock, XCircle, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TutorManagementProps {
  initialTutors: any[];
  initialInvitations: any[];
  courses: any[];
}

export default function TutorManagementClient({
  initialTutors,
  initialInvitations,
  courses,
}: TutorManagementProps) {
  const router = useRouter();

  const [tutors, setTutors] = useState(initialTutors);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Send Invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          assignedCourses: assignedCourseIds,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation');

      setInvitations([data.invitation, ...invitations]);
      setInviteModalOpen(false);
      setEmail('');
      setAssignedCourseIds([]);
      setNotes('');
      setNotice({ type: 'success', message: data.message });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Invitation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Revoke Invitation
  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const res = await fetch('/api/admin/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVOKE',
          invitationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke');

      setInvitations(
        invitations.map((inv) => (inv._id === invitationId ? { ...inv, status: 'REVOKED' } : inv))
      );
      setNotice({ type: 'success', message: 'Invitation has been revoked.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Revocation failed' });
    }
  };

  return (
    <div className="space-y-8">
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Tutors must redeem invitations via their matching verified Google account.</span>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5 text-blue-400" />
          <span>Invite New Tutor</span>
        </button>
      </div>

      {/* Active Faculty Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-navy-950">Active Faculty Members</h3>
          <span className="text-xs text-slate-500">{tutors.length} Tutors</span>
        </div>

        {tutors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Tutor Name</th>
                  <th className="px-6 py-3.5">Verified Google Email</th>
                  <th className="px-6 py-3.5">Headline</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tutors.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy-950 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                        {t.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          t.name?.[0] || 'T'
                        )}
                      </div>
                      <span>{t.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{t.email}</td>
                    <td className="px-6 py-4 text-slate-500">{t.headline || 'Faculty Instructor'}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(t.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">No active tutors in database yet.</div>
        )}
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-navy-950">Tutor Invitations History</h3>
          <span className="text-xs text-slate-500">{invitations.length} Total</span>
        </div>

        {invitations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Invited Email</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Invited By</th>
                  <th className="px-6 py-3.5">Expires</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invitations.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-navy-950">{inv.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{inv.invitedBy?.name || 'Administrator'}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(inv.expiresAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'PENDING' && (
                        <button
                          onClick={() => handleRevokeInvite(inv._id)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">No invitations issued yet.</div>
        )}
      </div>

      {/* Invite Tutor Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Faculty Instructor"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-bold">Security Standard:</p>
            <p>
              Entering an email address creates a pending cryptographic invitation. The recipient will only receive
              Tutor privileges when they complete Google OAuth with this exact verified email.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">
              Tutor Verified Google Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">
              Pre-Assign to Programs (Optional)
            </label>
            <select
              multiple
              value={assignedCourseIds}
              onChange={(e) =>
                setAssignedCourseIds(Array.from(e.target.selectedOptions, (option) => option.value))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs h-24 bg-white"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl (or Cmd) to select multiple courses.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Administrative Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lead Instructor for Summer Cloud cohort"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : 'Issue Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
