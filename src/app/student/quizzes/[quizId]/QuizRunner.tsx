'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';

interface QuizRunnerProps {
  quizId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  maxAttempts: number;
}

export default function QuizRunner({
  quizId,
  title,
  description,
  timeLimitMinutes,
  passingScorePercent,
  maxAttempts,
}: QuizRunnerProps) {
  const [started, setStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [questions, setQuestions] = useState<any[]>([]);
  const [serverDeadline, setServerDeadline] = useState<Date | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Start attempt
  const handleStartQuiz = async () => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/student/quizzes/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start quiz');
      }

      setAttemptId(data.attemptId);
      setAttemptNumber(data.attemptNumber);
      setQuestions(data.questions);
      if (data.deadline) {
        const dl = new Date(data.deadline);
        setServerDeadline(dl);
        const diff = Math.max(0, Math.floor((dl.getTime() - Date.now()) / 1000));
        setTimeLeftSeconds(diff);
      }
      setStarted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (!started || !serverDeadline || result) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((serverDeadline.getTime() - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);

      // Auto submit when time runs out
      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [started, serverDeadline, result]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitAnswers();
  };

  const handleSubmitAnswers = async () => {
    if (!attemptId || isSubmitting || result) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payloadAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }));

      const res = await fetch('/api/student/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers: payloadAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error grading quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Results Screen
  if (result) {
    return (
      <div className="p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            {result.isPassed ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                result.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {result.isPassed ? 'Assessment Passed' : 'Assessment Not Passed'}
            </span>
            <h2 className="text-3xl font-extrabold text-navy-950 mt-2">{title}</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500">Your Score</p>
              <p className="text-2xl font-bold text-navy-950 mt-1">
                {result.score} / {result.totalPointsPossible}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500">Percentage</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{result.percentage}%</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500">Passing Req</p>
              <p className="text-2xl font-bold text-slate-700 mt-1">{result.passingScorePercent}%</p>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/student/quizzes"
              className="px-6 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors"
            >
              Back to Quizzes
            </Link>
          </div>
        </div>

        {/* Answer Review Section (if permitted) */}
        {result.reviewPermitted && result.reviewDetails && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-navy-950">Detailed Answer Review</h3>
            </div>

            <div className="space-y-6">
              {result.reviewDetails.map((rev: any, qIdx: number) => {
                const originalQ = questions.find((q) => q.questionId === rev.questionId);
                return (
                  <div
                    key={rev.questionId}
                    className={`p-5 rounded-2xl border ${
                      rev.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                    } space-y-3`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-bold text-navy-950">
                        {qIdx + 1}. {rev.prompt}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          rev.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rev.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                      </span>
                    </div>

                    {originalQ && (
                      <div className="space-y-1.5 pl-2 text-xs">
                        {originalQ.options.map((opt: any) => {
                          const isStudentPick = opt.id === rev.studentSelectedOptionId;
                          const isCorrectPick = opt.id === rev.correctOptionId;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border ${
                                isCorrectPick
                                  ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-900'
                                  : isStudentPick
                                  ? 'bg-rose-100/70 border-rose-300 font-medium text-rose-900'
                                  : 'border-transparent text-slate-600'
                              }`}
                            >
                              <span>{opt.text}</span>
                              {isCorrectPick && <span className="ml-2 text-[10px] text-emerald-700">(Correct Answer)</span>}
                              {isStudentPick && !isCorrectPick && (
                                <span className="ml-2 text-[10px] text-rose-700">(Your Selection)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {rev.explanation && (
                      <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-700 border border-slate-200">
                        <span className="font-bold text-navy-950">Explanation: </span>
                        {rev.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-test Instructions Screen
  if (!started) {
    return (
      <div className="p-6 sm:p-10 max-w-2xl mx-auto w-full">
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-950 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg space-y-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
              Official Assessment
            </span>
            <h1 className="text-2xl font-extrabold text-navy-950">{title}</h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{description}</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700">
            <h3 className="font-bold text-navy-950 uppercase tracking-wider text-[11px]">Assessment Protocol</h3>
            <ul className="space-y-2 pl-4 list-disc text-slate-600">
              <li>
                <span className="font-semibold text-navy-950">Server-Side Timer: </span>
                {timeLimitMinutes > 0
                  ? `${timeLimitMinutes} minutes. The countdown is enforced on the server and will not reset upon page refresh.`
                  : 'Untimed.'}
              </li>
              <li>
                <span className="font-semibold text-navy-950">Passing Score: </span>
                Requires a minimum of <span className="font-bold text-blue-600">{passingScorePercent}%</span> to satisfy certificate criteria.
              </li>
              <li>
                <span className="font-semibold text-navy-950">Attempt Allowance: </span>
                Up to {maxAttempts} attempts total.
              </li>
            </ul>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full py-3.5 rounded-xl bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>Begin Assessment Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz Runner
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Attempt {attemptNumber} of {maxAttempts}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-navy-950 truncate max-w-xs sm:max-w-md">{title}</h2>
        </div>

        {timeLeftSeconds !== null && (
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold ${
              timeLeftSeconds < 120
                ? 'bg-rose-100 text-rose-700 animate-pulse'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, index) => {
          const selectedOption = answers[q.questionId];
          return (
            <div
              key={q.questionId}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm sm:text-base font-bold text-navy-950">
                  {index + 1}. {q.prompt}
                </h3>
                <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                  {q.points} {q.points === 1 ? 'Point' : 'Points'}
                </span>
              </div>

              <div className="space-y-2.5">
                {q.options.map((opt: any) => {
                  const isChecked = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(q.questionId, opt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center gap-3 ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-semibold ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isChecked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          Answered {Object.keys(answers).length} of {questions.length} questions.
        </p>

        <button
          onClick={handleSubmitAnswers}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-md disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Grading On Server...' : 'Submit Answers'}</span>
        </button>
      </div>
    </div>
  );
}
