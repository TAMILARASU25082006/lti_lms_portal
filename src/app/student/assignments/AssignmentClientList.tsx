'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import {
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AssignmentClientListProps {
  assignments: any[];
  timezone: string;
}

export default function AssignmentClientList({ assignments, timezone }: AssignmentClientListProps) {
  const router = useRouter();
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackViewAssignment, setFeedbackViewAssignment] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenSubmit = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubmissionText('');
    setFileUrls([]);
    setErrorMsg('');
  };

  const handleAddFileUrl = () => {
    if (fileUrlInput.trim()) {
      setFileUrls([...fileUrls, fileUrlInput.trim()]);
      setFileUrlInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment._id,
          submissionText,
          fileUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit assignment');
      }

      setSelectedAssignment(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a) => {
            const hasSubmission = !!a.submission;
            const isGraded = a.submission?.status === 'GRADED';
            const isPastDue = new Date() > new Date(a.dueDate);

            return (
              <div
                key={a._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                      {a.courseId?.title || 'Course'}
                    </span>

                    {/* Status Badge */}
                    {isGraded ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Graded: {a.submission.score}/{a.totalPoints}</span>
                      </span>
                    ) : hasSubmission ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Submitted (Pending Review)
                      </span>
                    ) : isPastDue ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Past Deadline
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        Action Required
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-navy-950">{a.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {a.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Due: {formatDate(a.dueDate, timezone)}</span>
                      </span>
                      <span className="font-semibold text-navy-950">{a.totalPoints} Maximum Points</span>
                    </div>
                    {a.allowLateSubmissions && (
                      <p className="text-[11px] text-amber-600">
                        * Late submissions allowed ({a.latePenaltyPercentPerDay}% penalty/day).
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center gap-2">
                  {isGraded ? (
                    <button
                      onClick={() => setFeedbackViewAssignment(a)}
                      className="flex-1 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>View Grade & Feedback</span>
                    </button>
                  ) : hasSubmission ? (
                    <button
                      onClick={() => handleOpenSubmit(a)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Resubmit Work
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenSubmit(a)}
                      className="flex-1 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Solution</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No assignments published for your enrolled courses yet.
        </div>
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment ? `Submit Work: ${selectedAssignment.title}` : 'Submit Assignment'}
        maxWidth="lg"
      >
        {selectedAssignment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">
                Solution Text / GitHub Repository / Implementation Notes *
              </label>
              <textarea
                required
                rows={6}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Provide your solution summary, code links, architecture description, and testing notes..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-navy-950 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">
                Supporting File / Cloudinary URLs (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={fileUrlInput}
                  onChange={(e) => setFileUrlInput(e.target.value)}
                  placeholder="https://... link to repository or PDF"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddFileUrl}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Add Link
                </button>
              </div>

              {fileUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {fileUrls.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <span className="truncate max-w-xs font-mono">{url}</span>
                      <button
                        type="button"
                        onClick={() => setFileUrls(fileUrls.filter((_, idx) => idx !== i))}
                        className="text-rose-600 text-xs font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-navy-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Uploading...' : 'Confirm Submission'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Grade and Feedback Modal */}
      <Modal
        isOpen={!!feedbackViewAssignment}
        onClose={() => setFeedbackViewAssignment(null)}
        title="Tutor Grading & Feedback"
      >
        {feedbackViewAssignment && feedbackViewAssignment.submission && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Awarded Score</p>
                <p className="text-2xl font-extrabold text-navy-950">
                  {feedbackViewAssignment.submission.score} / {feedbackViewAssignment.totalPoints}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Graded by: <span className="font-semibold text-navy-950">{feedbackViewAssignment.submission.gradedBy?.name || 'Assigned Tutor'}</span></p>
                <p>{formatDate(feedbackViewAssignment.submission.gradedAt, timezone)}</p>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tutor Feedback</h4>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {feedbackViewAssignment.submission.feedback || 'No written feedback provided.'}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setFeedbackViewAssignment(null)}
                className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
