'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  XCircle,
  Archive,
  UserCheck,
  ExternalLink,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AdminCourseListClientProps {
  initialCourses: any[];
  tutors: any[];
}

export default function AdminCourseListClient({
  initialCourses,
  tutors,
}: AdminCourseListClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rejectModalCourse, setRejectModalCourse] = useState<any | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [assignModalCourse, setAssignModalCourse] = useState<any | null>(null);
  const [selectedPrimaryTutorId, setSelectedPrimaryTutorId] = useState('');

  // Course Form
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cloud & DevOps');
  const [level, setLevel] = useState('INTERMEDIATE');
  const [deliveryMode, setDeliveryMode] = useState('HYBRID');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [estimatedHours, setEstimatedHours] = useState(40);
  const [primaryTutorId, setPrimaryTutorId] = useState('');
  const [outcomesText, setOutcomesText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredCourses = courses.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);
  };

  // 1. Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    const outcomes = outcomesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_COURSE',
          title,
          slug,
          summary,
          description,
          category,
          level,
          deliveryMode,
          durationWeeks,
          estimatedHours,
          learningOutcomes: outcomes,
          primaryTutorId: primaryTutorId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');

      setCourses([data.course, ...courses]);
      setCreateModalOpen(false);
      setTitle('');
      setSlug('');
      setSummary('');
      setDescription('');
      setOutcomesText('');
      setNotice({ type: 'success', message: 'Course created in Draft status.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Creation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Approve Publication
  const handleApprove = async (courseId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_PUBLICATION', courseId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      setCourses(courses.map((c) => (c._id === courseId ? { ...c, status: 'PUBLISHED' } : c)));
      setNotice({ type: 'success', message: 'Course published to public directory.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Approval failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Reject Course
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalCourse) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT_COURSE',
          courseId: rejectModalCourse._id,
          feedback: rejectFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');

      setCourses(courses.map((c) => (c._id === rejectModalCourse._id ? { ...c, status: 'DRAFT' } : c)));
      setRejectModalCourse(null);
      setRejectFeedback('');
      setNotice({ type: 'success', message: 'Revisions requested. Course returned to draft.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Action failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Archive Course
  const handleArchive = async (courseId: string) => {
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE_COURSE', courseId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Archival failed');

      setCourses(courses.map((c) => (c._id === courseId ? { ...c, status: 'ARCHIVED' } : c)));
      setNotice({ type: 'success', message: 'Course archived.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Action failed' });
    }
  };

  // 5. Assign Tutors
  const handleAssignTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalCourse) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN_TUTORS',
          courseId: assignModalCourse._id,
          primaryTutorId: selectedPrimaryTutorId || null,
          assignedTutorIds: selectedPrimaryTutorId ? [selectedPrimaryTutorId] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assignment failed');

      const tutorObj = tutors.find((t) => t._id === selectedPrimaryTutorId);
      setCourses(
        courses.map((c) =>
          c._id === assignModalCourse._id ? { ...c, primaryTutorId: tutorObj || null } : c
        )
      );
      setAssignModalCourse(null);
      setNotice({ type: 'success', message: 'Lead faculty assigned.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Action failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING_APPROVAL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((c) => {
          const isPending = c.status === 'PENDING_APPROVAL';
          const isPublished = c.status === 'PUBLISHED';
          const isArchived = c.status === 'ARCHIVED';

          return (
            <div
              key={c._id}
              className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between space-y-5 transition-all ${
                isPending ? 'border-amber-300 ring-2 ring-amber-300/30' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                    {c.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isPublished
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isPending
                        ? 'bg-amber-100 text-amber-900 animate-pulse'
                        : isArchived
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-navy-950">{c.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">{c.summary}</p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Lead Faculty:</span>
                    <span className="font-semibold text-navy-950">
                      {c.primaryTutorId?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duration:</span>
                    <span>{c.durationWeeks} Weeks ({c.estimatedHours}h)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Mode:</span>
                    <span className="capitalize">{c.deliveryMode.replace('_', ' ').toLowerCase()}</span>
                  </div>
                </div>

                {c.reviewFeedback && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    <span className="font-bold">Latest Feedback:</span> {c.reviewFeedback}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {isPending && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(c._id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalCourse(c);
                        setRejectFeedback('');
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/tutor/courses/${c._id}/builder`}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold text-center transition-colors"
                  >
                    Edit Curriculum
                  </Link>

                  <button
                    onClick={() => {
                      setAssignModalCourse(c);
                      setSelectedPrimaryTutorId(c.primaryTutorId?._id || '');
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                    title="Assign Faculty"
                  >
                    Assign Tutor
                  </button>

                  {!isArchived && (
                    <button
                      onClick={() => handleArchive(c._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      title="Archive Course"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Course Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Academic Program"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Course Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Applied Distributed Systems & Cloud Platforms"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="applied-distributed-systems"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Full-Stack Engineering">Full-Stack Engineering</option>
                <option value="Data & AI">Data & AI</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="Product & Architecture">Product & Architecture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="ALL_LEVELS">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Delivery Mode</label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="HYBRID">Hybrid</option>
                <option value="LIVE_ONLINE">Live Online</option>
                <option value="SELF_PACED">Self Paced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Estimated Hours</label>
              <input
                type="number"
                min={1}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Assign Lead Faculty</label>
              <select
                value={primaryTutorId}
                onChange={(e) => setPrimaryTutorId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="">Unassigned</option>
                {tutors.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Catalog Summary (Max 300 chars) *</label>
            <input
              type="text"
              required
              maxLength={300}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="High-impact summary for course catalog discovery cards..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Comprehensive Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed syllabus overview, cohort expectations, target architecture tools..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Learning Outcomes (One per line)</label>
            <textarea
              rows={3}
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
              placeholder="Design fault-tolerant Kubernetes deployments&#10;Implement distributed caching patterns with Redis"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Course Modal */}
      <Modal
        isOpen={!!rejectModalCourse}
        onClose={() => setRejectModalCourse(null)}
        title="Request Revisions from Tutor"
      >
        {rejectModalCourse && (
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-xs text-slate-600">
              Provide feedback for <span className="font-bold text-navy-950">{rejectModalCourse.title}</span>. The
              course will return to Draft status for the tutor to update.
            </p>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Revision Notes *</label>
              <textarea
                required
                rows={4}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Explain what modules need more depth or what resources need to be added..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalCourse(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Revisions'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Assign Tutor Modal */}
      <Modal
        isOpen={!!assignModalCourse}
        onClose={() => setAssignModalCourse(null)}
        title="Assign Faculty to Course"
      >
        {assignModalCourse && (
          <form onSubmit={handleAssignTutor} className="space-y-4">
            <p className="text-xs text-slate-600">
              Select the primary faculty member responsible for{' '}
              <span className="font-bold text-navy-950">{assignModalCourse.title}</span>:
            </p>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Lead Faculty</label>
              <select
                value={selectedPrimaryTutorId}
                onChange={(e) => setSelectedPrimaryTutorId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="">Unassigned</option>
                {tutors.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignModalCourse(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
              >
                Save Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
