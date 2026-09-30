'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Video,
  FileText,
  Download,
  Shield,
  Layers,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface ClassroomPlayerProps {
  course: any;
  modules: any[];
  lessons: any[];
  initialProgressMap: Record<string, { isCompleted: boolean; videoPlaybackPositionSeconds: number }>;
  initialLessonId: string;
  batchInfo: any;
}

export default function ClassroomPlayer({
  course,
  modules,
  lessons,
  initialProgressMap,
  initialLessonId,
  batchInfo,
}: ClassroomPlayerProps) {
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId);
  const [progressMap, setProgressMap] = useState(initialProgressMap);
  const [isUpdating, setIsUpdating] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentLesson = lessons.find((l) => l._id === selectedLessonId) || lessons[0];
  const currentProgress = progressMap[currentLesson._id] || { isCompleted: false, videoPlaybackPositionSeconds: 0 };

  // Calculate overall course completion %
  const completedCount = lessons.filter((l) => progressMap[l._id]?.isCompleted).length;
  const completionPercent = Math.round((completedCount / lessons.length) * 100);

  // Group lessons by module
  const lessonsByModule: Record<string, any[]> = {};
  lessons.forEach((l) => {
    if (!lessonsByModule[l.moduleId]) lessonsByModule[l.moduleId] = [];
    lessonsByModule[l.moduleId].push(l);
  });

  // Handle Mark as Completed
  const toggleComplete = async () => {
    const nextState = !currentProgress.isCompleted;
    setIsUpdating(true);

    try {
      const res = await fetch('/api/student/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course._id,
          lessonId: currentLesson._id,
          isCompleted: nextState,
          videoPlaybackPositionSeconds: videoRef.current?.currentTime || currentProgress.videoPlaybackPositionSeconds,
        }),
      });

      if (res.ok) {
        setProgressMap((prev) => ({
          ...prev,
          [currentLesson._id]: {
            ...prev[currentLesson._id],
            isCompleted: nextState,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to update lesson completion:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Video position tracking: periodically save playback position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Restore saved playback position
    if (currentProgress.videoPlaybackPositionSeconds > 0) {
      video.currentTime = currentProgress.videoPlaybackPositionSeconds;
    }

    const handleTimeUpdate = () => {
      // Save progress occasionally if user paused or video progresses
    };

    const handlePause = () => {
      if (video.currentTime > 0) {
        fetch('/api/student/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course._id,
            lessonId: currentLesson._id,
            videoPlaybackPositionSeconds: Math.floor(video.currentTime),
          }),
        }).catch(() => {});
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
    };
  }, [selectedLessonId]);

  // Index of current lesson for next/prev
  const currentIndex = lessons.findIndex((l) => l._id === selectedLessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh)] overflow-hidden bg-slate-100">
      {/* Top Classroom Bar */}
      <header className="h-14 bg-navy-950 text-white px-4 sm:px-6 flex items-center justify-between border-b border-navy-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/student/courses"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Courses</span>
          </Link>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">{course.title}</h1>
            {batchInfo?.code && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900/80 text-blue-300 border border-blue-600/40">
                {batchInfo.code}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-400">Course Progress:</span>
            <span className="font-bold text-blue-400">{completionPercent}%</span>
            <div className="w-24 h-1.5 rounded-full bg-navy-900 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Classroom Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Lesson Viewer */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col space-y-6">
          {/* Video Player or Header */}
          {currentLesson.contentType === 'VIDEO' || currentLesson.contentType === 'HYBRID' ? (
            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800 aspect-video flex items-center justify-center relative">
              {currentLesson.videoUrl ? (
                currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                    title={currentLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full object-contain"
                    src={currentLesson.videoUrl}
                  />
                )
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-40 text-white" />
                  <p className="text-sm font-semibold text-white">Recorded Lesson Archive</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Lesson stream available for cohort review.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Lesson Metadata & Complete Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">
                <span>Lesson {currentIndex + 1} of {lessons.length}</span>
                <span>•</span>
                <span className="text-blue-600 font-bold">{currentLesson.contentType}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">{currentLesson.title}</h2>
            </div>

            <button
              onClick={toggleComplete}
              disabled={isUpdating}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                currentProgress.isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {currentProgress.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Completed ✓</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  <span>Mark as Completed</span>
                </>
              )}
            </button>
          </div>

          {/* Text Content / Notes */}
          {currentLesson.contentHtml && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-navy-950 border-b border-slate-100 pb-3">
                Lesson Notes & Architecture Breakdown
              </h3>
              <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {currentLesson.contentHtml}
              </div>
            </div>
          )}

          {/* Protected Resources & Attachments */}
          {currentLesson.resources?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-navy-950 font-bold text-sm">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Protected Course Materials & Labs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLesson.resources.map((res: any, idx: number) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 truncate">{res.title}</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Next / Prev Navigation */}
          <div className="flex items-center justify-between pt-4 pb-8">
            {prevLesson ? (
              <button
                onClick={() => setSelectedLessonId(prevLesson._id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Lesson</span>
              </button>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <button
                onClick={() => setSelectedLessonId(nextLesson._id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/student/quizzes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Take Cohort Quiz</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Curriculum Navigation Drawer */}
        <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-auto lg:h-full overflow-y-auto">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Modules & Lessons</h3>
            <span className="text-[11px] font-semibold text-blue-600">
              {completedCount}/{lessons.length} Done
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {modules.map((mod, modIdx) => {
              const modLessons = lessonsByModule[mod._id] || [];
              return (
                <div key={mod._id} className="p-3">
                  <div className="px-2 py-1.5 flex items-center justify-between text-xs font-bold text-navy-950">
                    <span className="truncate">
                      {modIdx + 1}. {mod.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {modLessons.length}
                    </span>
                  </div>

                  <div className="space-y-1 mt-1">
                    {modLessons.map((lesson) => {
                      const isSelected = lesson._id === selectedLessonId;
                      const isComplete = progressMap[lesson._id]?.isCompleted;
                      return (
                        <button
                          key={lesson._id}
                          onClick={() => setSelectedLessonId(lesson._id)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-navy-950'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            {isComplete ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          {lesson.contentType === 'VIDEO' ? (
                            <Video className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
