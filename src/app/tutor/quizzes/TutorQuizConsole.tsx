'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { Plus, HelpCircle, Clock, Award, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TutorQuizConsoleProps {
  assignedCourses: any[];
  initialQuizzes: any[];
  totalAttemptsCount: number;
}

export default function TutorQuizConsole({
  assignedCourses,
  initialQuizzes,
  totalAttemptsCount,
}: TutorQuizConsoleProps) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form state
  const [courseId, setCourseId] = useState(assignedCourses[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [passingScorePercent, setPassingScorePercent] = useState(70);
  const [permitAnswerReview, setPermitAnswerReview] = useState<'ALWAYS' | 'AFTER_SUBMISSION' | 'NEVER'>('AFTER_SUBMISSION');

  // Dynamic questions state
  const [questions, setQuestions] = useState<any[]>([
    {
      questionId: 'q1',
      prompt: '',
      options: [
        { id: 'opt1', text: '' },
        { id: 'opt2', text: '' },
        { id: 'opt3', text: '' },
        { id: 'opt4', text: '' },
      ],
      correctOptionId: 'opt1',
      explanation: '',
      points: 1,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddQuestion = () => {
    const qNum = questions.length + 1;
    setQuestions([
      ...questions,
      {
        questionId: `q${Date.now()}_${qNum}`,
        prompt: '',
        options: [
          { id: 'opt1', text: '' },
          { id: 'opt2', text: '' },
          { id: 'opt3', text: '' },
          { id: 'opt4', text: '' },
        ],
        correctOptionId: 'opt1',
        explanation: '',
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    // Validate that prompts and options are not empty
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].prompt.trim()) {
        setNotice({ type: 'error', message: `Question #${i + 1} prompt cannot be empty.` });
        setIsSubmitting(false);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].text.trim()) {
          setNotice({ type: 'error', message: `Question #${i + 1} has an empty option text.` });
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const res = await fetch('/api/tutor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title,
          description,
          timeLimitMinutes,
          maxAttempts,
          passingScorePercent,
          permitAnswerReview,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create quiz');

      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setNotice({ type: 'success', message: 'Quiz created successfully and published for student attempts.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Creation failed' });
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

      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-navy-950">Published Quizzes ({initialQuizzes.length})</h2>
          <p className="text-xs text-slate-500">Total student attempts recorded: {totalAttemptsCount}</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {/* Quizzes Grid */}
      {initialQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialQuizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                  {quiz.courseId?.title}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">Active</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-950">{quiz.title}</h3>
                {quiz.description && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{quiz.description}</p>}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Questions Count:</span>
                  <span className="font-bold text-navy-950">{quiz.questions?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time Allowance:</span>
                  <span className="font-bold text-navy-950">{quiz.timeLimitMinutes} Mins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Passing Score:</span>
                  <span className="font-bold text-blue-600">{quiz.passingScorePercent}%</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-400">
                  <span>Max Attempts: {quiz.maxAttempts}</span>
                  <span>Review: {quiz.permitAnswerReview}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No quizzes created yet. Click &ldquo;Create New Quiz&rdquo; to build technical assessments.
        </div>
      )}

      {/* Create Quiz Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Cohort Technical Evaluation"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateQuiz} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Target Course *</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                {assignedCourses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Quiz Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus & Raft Architecture"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Time Limit (Mins) *</label>
              <input
                type="number"
                min={0}
                required
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Max Attempts *</label>
              <input
                type="number"
                min={1}
                required
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Passing % *</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={passingScorePercent}
                onChange={(e) => setPassingScorePercent(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Answer Review Policy</label>
            <select
              value={permitAnswerReview}
              onChange={(e: any) => setPermitAnswerReview(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs"
            >
              <option value="AFTER_SUBMISSION">Permit Review Immediately After Submission</option>
              <option value="ALWAYS">Always Permit Full Review</option>
              <option value="NEVER">Do Not Show Correct Answers</option>
            </select>
          </div>

          {/* Dynamic Questions Builder */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Questions ({questions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-950">Question #{qIdx + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-rose-600 hover:text-rose-700 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enter question prompt..."
                    value={q.prompt}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIdx].prompt = e.target.value;
                      setQuestions(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />

                  {/* 4 Options */}
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400">
                      Select radio button next to the correct answer (stored securely on the server):
                    </p>
                    {q.options.map((opt: any, optIdx: number) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={q.correctOptionId === opt.id}
                          onChange={() => {
                            const updated = [...questions];
                            updated[qIdx].correctOptionId = opt.id;
                            setQuestions(updated);
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIdx].options[optIdx].text = e.target.value;
                            setQuestions(updated);
                          }}
                          className="flex-1 px-3 py-1 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Optional explanation revealed during review..."
                    value={q.explanation}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIdx].explanation = e.target.value;
                      setQuestions(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-600"
                  />
                </div>
              ))}
            </div>
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
              {isSubmitting ? 'Publishing...' : 'Save & Publish Quiz'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
