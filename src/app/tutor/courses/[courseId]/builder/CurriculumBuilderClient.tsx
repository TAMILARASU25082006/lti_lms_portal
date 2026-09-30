'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import {
  ArrowLeft,
  Plus,
  Video,
  FileText,
  Layers,
  Send,
  CheckCircle2,
  AlertCircle,
  Download,
  Shield,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CurriculumBuilderProps {
  course: any;
  initialModules: any[];
  initialLessons: any[];
}

export default function CurriculumBuilderClient({
  course,
  initialModules,
  initialLessons,
}: CurriculumBuilderProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [lessons, setLessons] = useState(initialLessons);
  const [courseStatus, setCourseStatus] = useState(course.status);

  // Modals state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleSummary, setModuleSummary] = useState('');

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContentType, setLessonContentType] = useState<'TEXT' | 'VIDEO' | 'HYBRID'>('HYBRID');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resources, setResources] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Group lessons by module
  const lessonsByModule: Record<string, any[]> = {};
  lessons.forEach((l) => {
    if (!lessonsByModule[l.moduleId]) lessonsByModule[l.moduleId] = [];
    lessonsByModule[l.moduleId].push(l);
  });

  // 1. Handle Add Module
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MODULE',
          courseId: course._id,
          title: moduleTitle,
          summary: moduleSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add module');

      setModules([...modules, data.module]);
      setModuleModalOpen(false);
      setModuleTitle('');
      setModuleSummary('');
      setNotice({ type: 'success', message: 'Module created successfully.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Error creating module' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Add Lesson
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_LESSON',
          courseId: course._id,
          moduleId: targetModuleId,
          title: lessonTitle,
          contentType: lessonContentType,
          videoUrl: lessonVideoUrl,
          contentHtml: lessonNotes,
          resources,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add lesson');

      setLessons([...lessons, data.lesson]);
      setLessonModalOpen(false);
      setLessonTitle('');
      setLessonVideoUrl('');
      setLessonNotes('');
      setResources([]);
      setNotice({ type: 'success', message: 'Lesson added to curriculum.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Error creating lesson' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Resource Helper
  const handleAddResource = () => {
    if (resourceTitle.trim() && resourceUrl.trim()) {
      setResources([
        ...resources,
        {
          title: resourceTitle.trim(),
          url: resourceUrl.trim(),
          fileType: 'pdf',
          isProtected: true,
        },
      ]);
      setResourceTitle('');
      setResourceUrl('');
    }
  };

  // 3. Handle Submit for Approval
  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_APPROVAL',
          courseId: course._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit course');

      setCourseStatus('PENDING_APPROVAL');
      setNotice({
        type: 'success',
        message: 'Curriculum has been submitted to academy administration for publication approval.',
      });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/tutor/courses"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-navy-950 truncate max-w-sm sm:max-w-md">{course.title}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  courseStatus === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : courseStatus === 'PENDING_APPROVAL'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {courseStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {modules.length} Modules • {lessons.length} Lessons • Category: {course.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModuleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Module</span>
          </button>

          {courseStatus === 'DRAFT' && (
            <button
              onClick={handleSubmitForApproval}
              disabled={isSubmitting || lessons.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>Submit for Publication Approval</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Notice alert */}
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

        {/* Modules Accordion Tree */}
        <div className="space-y-6">
          {modules.map((mod, modIdx) => {
            const modLessons = lessonsByModule[mod._id] || [];
            return (
              <div
                key={mod._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Module Header */}
                <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      Module {modIdx + 1}
                    </span>
                    <h3 className="text-base font-bold text-navy-950 mt-0.5">{mod.title}</h3>
                    {mod.summary && <p className="text-xs text-slate-500 mt-0.5">{mod.summary}</p>}
                  </div>

                  <button
                    onClick={() => {
                      setTargetModuleId(mod._id);
                      setLessonModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-navy-900 font-semibold text-xs transition-colors self-start sm:self-auto shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Add Lesson</span>
                  </button>
                </div>

                {/* Lessons in this Module */}
                {modLessons.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {modLessons.map((l, lIdx) => (
                      <div
                        key={l._id}
                        className="p-4 sm:px-6 flex items-start justify-between hover:bg-slate-50/50 transition-colors gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {l.contentType === 'VIDEO' ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-navy-950">
                              {lIdx + 1}. {l.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="uppercase font-bold text-slate-400">{l.contentType}</span>
                              {l.videoUrl && <span>• Video Attached</span>}
                              {l.resources?.length > 0 && (
                                <span>• {l.resources.length} Protected Resources</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Order #{l.orderIndex}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No lessons in this module yet. Click &ldquo;Add Lesson&rdquo; to create lecture content.
                  </div>
                )}
              </div>
            );
          })}

          {modules.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <p>No modules created yet. Start structuring this course curriculum by adding your first module.</p>
              <button
                onClick={() => setModuleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Module</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Module Modal */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title="Add Curriculum Module"
      >
        <form onSubmit={handleAddModule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Module Title *</label>
            <input
              type="text"
              required
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g. Module 1: Cloud Architecture Fundamentals"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Summary / Objective</label>
            <textarea
              rows={3}
              value={moduleSummary}
              onChange={(e) => setModuleSummary(e.target.value)}
              placeholder="What will students learn in this module?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModuleModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Save Module'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title="Add Lesson to Module"
        maxWidth="xl"
      >
        <form onSubmit={handleAddLesson} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Lesson Title *</label>
            <input
              type="text"
              required
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g. Setting Up Virtual Private Clouds & Subnets"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Content Delivery Mode</label>
              <select
                value={lessonContentType}
                onChange={(e: any) => setLessonContentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="HYBRID">Hybrid (Video & Notes)</option>
                <option value="VIDEO">Recorded Video Only</option>
                <option value="TEXT">Text & Labs Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Recorded Video Stream URL</label>
              <input
                type="url"
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                placeholder="https://... video stream or YouTube embed"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Lesson Content / Notes (Markdown/HTML)</label>
            <textarea
              rows={5}
              value={lessonNotes}
              onChange={(e) => setLessonNotes(e.target.value)}
              placeholder="Lecture documentation, code examples, architectural diagrams, commands..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
            />
          </div>

          {/* Protected Resources */}
          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Protected Downloadable Resources</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Resource Title (e.g. Lab Exercise Guide)"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="url"
                placeholder="URL / Cloudinary Asset"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="button"
                onClick={handleAddResource}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Add
              </button>
            </div>

            {resources.length > 0 && (
              <div className="mt-2 space-y-1">
                {resources.map((res, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
                  >
                    <span>{res.title}</span>
                    <button
                      type="button"
                      onClick={() => setResources(resources.filter((_, idx) => idx !== i))}
                      className="text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLessonModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Lesson'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
