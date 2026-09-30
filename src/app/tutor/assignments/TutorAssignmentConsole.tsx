'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import {
  Plus,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Send,
  Filter,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TutorAssignmentConsoleProps {
  assignedCourses: any[];
  assignedBatches: any[];
  initialAssignments: any[];
  initialSubmissions: any[];
}

export default function TutorAssignmentConsole({
  assignedCourses,
  assignedBatches,
  initialAssignments,
  initialSubmissions,
}: TutorAssignmentConsoleProps) {
  const router = useRouter();

  // Create Assignment Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [courseId, setCourseId] = useState(assignedCourses[0]?._id || '');
  const [scope, setScope] = useState<'COURSE_WIDE' | 'BATCH_SPECIFIC'>('COURSE_WIDE');
  const [batchId, setBatchId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rubric, setRubric] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [dueDate, setDueDate] = useState('');

  // Grade Submission Modal
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState('');

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNGRADED' | 'GRADED'>('UNGRADED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered submissions
  const filteredSubmissions = initialSubmissions.filter((s) => {
    if (activeFilter === 'UNGRADED') return s.status === 'SUBMITTED';
    if (activeFilter === 'GRADED') return s.status === 'GRADED';
    return true;
  });

  // 1. Create Assignment Handler
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          batchId: scope === 'BATCH_SPECIFIC' ? batchId : null,
          scope,
          title,
          description,
          rubricCriteria: rubric,
          totalPoints,
          dueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create assignment');

      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setNotice({ type: 'success', message: 'Assignment created and published to students.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Creation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Grade Handler
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: gradingSubmission._id,
          score: Number(gradeScore),
          feedback: gradeFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record grade');

      setGradingSubmission(null);
      setNotice({ type: 'success', message: 'Grade and feedback saved. Student notified.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Grading failed' });
    } finally {
      setIsSubmitting(false);
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('UNGRADED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'UNGRADED'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Ungraded Submissions ({initialSubmissions.filter((s) => s.status === 'SUBMITTED').length})
          </button>
          <button
            onClick={() => setActiveFilter('GRADED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'GRADED'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Graded History ({initialSubmissions.filter((s) => s.status === 'GRADED').length})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-navy-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Submissions ({initialSubmissions.length})
          </button>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Create New Assignment</span>
        </button>
      </div>

      {/* Submissions Inbox */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-navy-950">Student Submissions Inbox</h3>
          <span className="text-xs text-slate-500">{filteredSubmissions.length} Entries</span>
        </div>

        {filteredSubmissions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredSubmissions.map((sub) => {
              const isGraded = sub.status === 'GRADED';
              return (
                <div key={sub._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-950">{sub.studentId?.name || 'Student'}</span>
                      <span className="font-mono text-xs text-slate-400">({sub.studentId?.email})</span>
                      {sub.isLate && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                          Late
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-blue-600 font-semibold">
                      Assignment: {sub.assignmentId?.title} • Batch: {sub.batchId?.code || 'All Batches'}
                    </p>

                    <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                      {sub.submissionText}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Submitted on {formatDateTime(sub.submittedAt)} • Attempt #{sub.attemptNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isGraded ? (
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 block text-center">
                          Score: {sub.score} / {sub.assignmentId?.totalPoints}
                        </span>
                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeScore(sub.score || 0);
                            setGradeFeedback(sub.feedback || '');
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline mt-1 block"
                        >
                          Revise Grade
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setGradeScore(sub.assignmentId?.totalPoints || 100);
                          setGradeFeedback('');
                        }}
                        className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-sm whitespace-nowrap"
                      >
                        Evaluate & Grade
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No submissions matching this filter view.
          </div>
        )}
      </div>

      {/* Grade Submission Modal */}
      <Modal
        isOpen={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        title={gradingSubmission ? `Grade: ${gradingSubmission.assignmentId?.title}` : 'Evaluate Submission'}
        maxWidth="xl"
      >
        {gradingSubmission && (
          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-950">Student: {gradingSubmission.studentId?.name}</span>
                <span className="font-mono text-slate-500">{gradingSubmission.studentId?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Student Solution Text:</span>
                <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 font-mono whitespace-pre-line max-h-36 overflow-y-auto">
                  {gradingSubmission.submissionText}
                </p>
              </div>

              {gradingSubmission.fileUrls?.length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Submitted Repositories / Files:</span>
                  <div className="space-y-1">
                    {gradingSubmission.fileUrls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-mono"
                      >
                        <span>{url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">
                Awarded Score (Max {gradingSubmission.assignmentId?.totalPoints || 100}) *
              </label>
              <input
                type="number"
                min={0}
                max={gradingSubmission.assignmentId?.totalPoints || 100}
                required
                value={gradeScore}
                onChange={(e) => setGradeScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-navy-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Tutor Feedback & Suggestions *</label>
              <textarea
                required
                rows={4}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Explain the grade, identify strengths, and note areas of architectural improvement..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Grade & Notify Student'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Cohort Assignment"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Course *</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
            >
              {assignedCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Assignment Scope *</label>
              <select
                value={scope}
                onChange={(e: any) => setScope(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="COURSE_WIDE">Course-Wide (All Batches)</option>
                <option value="BATCH_SPECIFIC">Batch-Specific</option>
              </select>
            </div>

            {scope === 'BATCH_SPECIFIC' && (
              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">Target Batch *</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="">Select Batch</option>
                  {assignedBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Assignment Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Distributed Event Bus with Redis"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Total Points *</label>
              <input
                type="number"
                min={1}
                required
                value={totalPoints}
                onChange={(e) => setTotalPoints(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Due Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Instructions & Problem Statement *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students need to build, deliver, and test..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
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
              {isSubmitting ? 'Creating...' : 'Create & Publish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
