'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import {
  Plus,
  Layers,
  Users,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Video,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AdminBatchConsoleProps {
  initialBatches: any[];
  courses: any[];
  tutors: any[];
  initialEnrollments: any[];
}

export default function AdminBatchConsole({
  initialBatches,
  courses,
  tutors,
  initialEnrollments,
}: AdminBatchConsoleProps) {
  const router = useRouter();
  const [batches, setBatches] = useState(initialBatches);
  const [enrollments, setEnrollments] = useState(initialEnrollments);

  // Modals
  const [createBatchModalOpen, setCreateBatchModalOpen] = useState(false);
  const [enrollStudentModalBatch, setEnrollStudentModalBatch] = useState<any | null>(null);
  const [transferEnrollment, setTransferEnrollment] = useState<any | null>(null);

  // Create Batch Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [assignedTutorIds, setAssignedTutorIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('Mon & Wed 18:00 - 20:00 UTC');
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [meetingPlatform, setMeetingPlatform] = useState('GOOGLE_MEET');
  const [defaultMeetingUrl, setDefaultMeetingUrl] = useState('');

  // Enroll Student Form
  const [studentEmail, setStudentEmail] = useState('');

  // Transfer Student Form
  const [toBatchId, setToBatchId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Create Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_BATCH',
          name,
          code,
          courseId,
          assignedTutorIds,
          startDate,
          endDate,
          scheduleDescription,
          maxCapacity,
          meetingPlatform,
          defaultMeetingUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create batch');

      setBatches([data.batch, ...batches]);
      setCreateBatchModalOpen(false);
      setName('');
      setCode('');
      setNotice({ type: 'success', message: 'Cohort batch created successfully.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Creation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Enrol Student
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentModalBatch) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ENROLL_STUDENT',
          batchId: enrollStudentModalBatch._id,
          studentEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enrol student');

      setEnrollStudentModalBatch(null);
      setStudentEmail('');
      setNotice({ type: 'success', message: data.message });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Enrollment failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Transfer Student
  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEnrollment || !toBatchId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSFER_STUDENT',
          enrollmentId: transferEnrollment._id,
          toBatchId,
          reason: transferReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transfer failed');

      setTransferEnrollment(null);
      setToBatchId('');
      setTransferReason('');
      setNotice({ type: 'success', message: 'Student successfully transferred to new cohort batch.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Transfer failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Remove Student Access
  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the cohort batch?')) return;

    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REMOVE_STUDENT', enrollmentId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove');

      setEnrollments(enrollments.filter((e) => e._id !== enrollmentId));
      setNotice({ type: 'success', message: 'Student access removed.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Removal failed' });
    }
  };

  return (
    <div className="space-y-10">
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

      {/* Batches Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-navy-950">Active Cohort Batches ({batches.length})</h2>
          <p className="text-xs text-slate-500">Each cohort carries a unique schedule and assigned instructors.</p>
        </div>

        <button
          onClick={() => setCreateBatchModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Create New Cohort Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((b) => (
          <div
            key={b._id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                  {b.code}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase">{b.status}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-950">{b.name}</h3>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{b.courseId?.title}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Start / End:</span>
                  <span>
                    {formatDate(b.startDate)} - {formatDate(b.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Capacity:</span>
                  <span>Max {b.maxCapacity} Students</span>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block">Schedule:</span>
                  <span className="font-semibold text-navy-950">{b.scheduleDescription || 'Flexible schedule'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setEnrollStudentModalBatch(b);
                  setStudentEmail('');
                }}
                className="flex-1 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enrol Student</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Active Enrollments Table */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <h2 className="text-base font-bold text-navy-950">Active Student Enrollments & Transfers</h2>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Course</th>
                  <th className="px-6 py-3.5">Assigned Cohort</th>
                  <th className="px-6 py-3.5">Enrolled Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enrollments.map((enr) => (
                  <tr key={enr._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy-950">
                      <p>{enr.studentId?.name || 'Student'}</p>
                      <p className="font-mono text-slate-400 font-normal text-[11px]">{enr.studentId?.email}</p>
                    </td>

                    <td className="px-6 py-4 font-medium text-navy-950">{enr.courseId?.title}</td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                        {enr.batchId?.code}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500">{formatDate(enr.enrolledAt)}</td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setTransferEnrollment(enr);
                          setToBatchId('');
                          setTransferReason('');
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1"
                        title="Transfer to another Batch"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                        <span>Transfer</span>
                      </button>

                      <button
                        onClick={() => handleRemoveStudent(enr._id)}
                        className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold"
                        title="Remove Access"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Batch Modal */}
      <Modal
        isOpen={createBatchModalOpen}
        onClose={() => setCreateBatchModalOpen(false)}
        title="Create Cohort Batch"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Batch Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer 2026 Cloud Cohort Alpha"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Unique Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CC-2026-ALPHA"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Course *</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Max Capacity</label>
              <input
                type="number"
                min={1}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Cohort Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Cohort End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Schedule Description *</label>
            <input
              type="text"
              required
              value={scheduleDescription}
              onChange={(e) => setScheduleDescription(e.target.value)}
              placeholder="e.g. Mon & Wed 18:00 - 20:00 UTC"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Assign Instructors (Tutors)</label>
            <select
              multiple
              value={assignedTutorIds}
              onChange={(e) =>
                setAssignedTutorIds(Array.from(e.target.selectedOptions, (option) => option.value))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs h-24 bg-white"
            >
              {tutors.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl (or Cmd) to select multiple tutors.</p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateBatchModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Save Cohort Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrol Student Modal */}
      <Modal
        isOpen={!!enrollStudentModalBatch}
        onClose={() => setEnrollStudentModalBatch(null)}
        title={enrollStudentModalBatch ? `Enrol Student into ${enrollStudentModalBatch.code}` : 'Enrol Student'}
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          <p className="text-xs text-slate-600">
            Enter the verified Google email of the student. They will immediately gain access to the course classroom
            and live cohort schedule.
          </p>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Student Google Email *</label>
            <input
              type="email"
              required
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEnrollStudentModalBatch(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Enrolling...' : 'Enrol into Cohort'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Student Modal */}
      <Modal
        isOpen={!!transferEnrollment}
        onClose={() => setTransferEnrollment(null)}
        title="Transfer Student to Another Cohort Batch"
      >
        {transferEnrollment && (
          <form onSubmit={handleTransferStudent} className="space-y-4">
            <p className="text-xs text-slate-600">
              Transferring <span className="font-bold text-navy-950">{transferEnrollment.studentId?.name}</span> from{' '}
              <span className="font-mono text-blue-600">{transferEnrollment.batchId?.code}</span>:
            </p>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Destination Batch *</label>
              <select
                required
                value={toBatchId}
                onChange={(e) => setToBatchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="">Select Destination Batch</option>
                {batches
                  .filter((b) => b._id !== transferEnrollment.batchId?._id)
                  .map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Reason for Transfer</label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Schedule conflict, moved to evening cohort"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferEnrollment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 disabled:opacity-50"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
