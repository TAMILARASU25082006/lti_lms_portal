'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import {
  ArrowLeft,
  Video,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Users,
  Bell,
  Send,
  UserCheck,
} from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface BatchDetailProps {
  batch: any;
  initialEnrollments: any[];
  initialLiveSessions: any[];
  initialAnnouncements: any[];
  initialAttendanceRecords: any[];
}

export default function BatchDetailClient({
  batch,
  initialEnrollments,
  initialLiveSessions,
  initialAnnouncements,
  initialAttendanceRecords,
}: BatchDetailProps) {
  const router = useRouter();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'sessions' | 'students' | 'announcements'>('sessions');

  // Modals state
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [announceModalOpen, setAnnounceModalOpen] = useState(false);
  const [attendanceModalSession, setAttendanceModalSession] = useState<any | null>(null);

  // Form states
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionPlatform, setSessionPlatform] = useState<'GOOGLE_MEET' | 'ZOOM' | 'OTHER'>('GOOGLE_MEET');
  const [sessionUrl, setSessionUrl] = useState('');
  const [sessionStart, setSessionStart] = useState('');
  const [sessionEnd, setSessionEnd] = useState('');

  const [enrollEmail, setEnrollEmail] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announcePriority, setAnnouncePriority] = useState('NORMAL');

  // Attendance marking state: studentId -> status
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: string; minutes: number }>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Schedule Session
  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCHEDULE_SESSION',
          batchId: batch._id,
          courseId: batch.courseId._id,
          title: sessionTitle,
          description: sessionDesc,
          meetingPlatform: sessionPlatform,
          meetingUrl: sessionUrl,
          scheduledStartTime: sessionStart,
          scheduledEndTime: sessionEnd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule session');

      setSessionModalOpen(false);
      setSessionTitle('');
      setSessionUrl('');
      setNotice({ type: 'success', message: 'Live class scheduled and published to student calendars.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Scheduling failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Open Attendance Modal
  const handleOpenAttendance = (session: any) => {
    setAttendanceModalSession(session);
    // Prefill with existing records if already marked
    const initialMap: Record<string, { status: string; minutes: number }> = {};
    initialEnrollments.forEach((e) => {
      const studentId = e.studentId?._id;
      if (!studentId) return;
      const existing = initialAttendanceRecords.find(
        (ar) => ar.liveSessionId === session._id && ar.studentId === studentId
      );
      initialMap[studentId] = {
        status: existing?.status || 'PRESENT',
        minutes: existing?.minutesAttended || 60,
      };
    });
    setAttendanceState(initialMap);
  };

  // 3. Save Attendance
  const handleSaveAttendance = async () => {
    if (!attendanceModalSession) return;
    setIsSubmitting(true);
    setNotice(null);

    try {
      const records = Object.entries(attendanceState).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        minutesAttended: data.minutes,
      }));

      const res = await fetch('/api/tutor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MARK_ATTENDANCE',
          liveSessionId: attendanceModalSession._id,
          records,
          markSessionCompleted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance');

      setAttendanceModalSession(null);
      setNotice({ type: 'success', message: 'Attendance records successfully logged into student profiles.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to record attendance' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Direct Student Enrolment
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch._id,
          studentEmail: enrollEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enrol student');

      setEnrollModalOpen(false);
      setEnrollEmail('');
      setNotice({ type: 'success', message: data.message });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Enrollment failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Post Cohort Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/tutor/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch._id,
          title: announceTitle,
          content: announceContent,
          priority: announcePriority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post announcement');

      setAnnounceModalOpen(false);
      setAnnounceTitle('');
      setAnnounceContent('');
      setNotice({ type: 'success', message: 'Cohort announcement broadcast to all students.' });
      router.refresh();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Announcement failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/tutor/batches"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {batch.code}
              </span>
              <h1 className="text-lg font-bold text-navy-950">{batch.name}</h1>
            </div>
            <p className="text-xs text-slate-500">
              Course: <span className="font-semibold text-navy-950">{batch.courseId?.title}</span> • Schedule: {batch.scheduleDescription || 'Flexible'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnrollModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Enrol Student</span>
          </button>

          <button
            onClick={() => setSessionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Video className="w-3.5 h-3.5 text-blue-400" />
            <span>Schedule Live Class</span>
          </button>

          <button
            onClick={() => setAnnounceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Broadcast Notice</span>
          </button>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-navy-950'
            }`}
          >
            Live Sessions ({initialLiveSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-navy-950'
            }`}
          >
            Enrolled Students ({initialEnrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === 'announcements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-navy-950'
            }`}
          >
            Announcements ({initialAnnouncements.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
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

        {/* Tab 1: Live Sessions */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {initialLiveSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {initialLiveSessions.map((session) => (
                  <div
                    key={session._id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-600 uppercase">
                          Platform: {session.meetingPlatform.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            session.status === 'LIVE'
                              ? 'bg-emerald-50 text-emerald-700 animate-pulse'
                              : session.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-navy-950">{session.title}</h3>
                      {session.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{session.description}</p>
                      )}

                      <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{formatDateTime(session.scheduledStartTime)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Instructor: {session.tutorId?.name || 'Assigned Tutor'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Meeting</span>
                      </a>

                      <button
                        onClick={() => handleOpenAttendance(session)}
                        className="flex-1 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Mark Attendance</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
                <Video className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No live classes scheduled for this cohort yet. Click &ldquo;Schedule Live Class&rdquo; to set a date.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Enrolled Students */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-navy-950">Cohort Student Roster</h3>
              <span className="text-xs text-slate-500">{initialEnrollments.length} Active Students</span>
            </div>

            {initialEnrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Google Email</th>
                      <th className="px-6 py-3.5">Enrolled Date</th>
                      <th className="px-6 py-3.5">Headline / Info</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {initialEnrollments.map((enr) => (
                      <tr key={enr._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-navy-950 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-navy-900 flex items-center justify-center font-bold text-xs overflow-hidden">
                            {enr.studentId?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={enr.studentId.image} alt={enr.studentId.name} className="w-full h-full object-cover" />
                            ) : (
                              enr.studentId?.name?.[0] || 'S'
                            )}
                          </div>
                          <span>{enr.studentId?.name}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">{enr.studentId?.email}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(enr.enrolledAt)}</td>
                        <td className="px-6 py-4 text-slate-500 truncate max-w-xs">
                          {enr.studentId?.headline || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                            {enr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No students enrolled in this batch yet. Click &ldquo;Enrol Student&rdquo; above.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {initialAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {initialAnnouncements.map((ann) => (
                  <div key={ann._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {ann.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(ann.createdAt)}</span>
                    </div>
                    <h3 className="text-base font-bold text-navy-950">{ann.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                No announcements broadcast for this batch yet.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Schedule Live Class Modal */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title="Schedule Cohort Live Class"
        maxWidth="lg"
      >
        <form onSubmit={handleScheduleSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Session Title *</label>
            <input
              type="text"
              required
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Masterclass: Microservices Orchestration"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Platform *</label>
              <select
                value={sessionPlatform}
                onChange={(e: any) => setSessionPlatform(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="ZOOM">Zoom</option>
                <option value="OTHER">Other Meeting Link</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">External Meeting URL *</label>
              <input
                type="url"
                required
                value={sessionUrl}
                onChange={(e) => setSessionUrl(e.target.value)}
                placeholder="https://meet.google.com/xyz or Zoom URL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Scheduled Start Time *</label>
              <input
                type="datetime-local"
                required
                value={sessionStart}
                onChange={(e) => setSessionStart(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Scheduled End Time *</label>
              <input
                type="datetime-local"
                required
                value={sessionEnd}
                onChange={(e) => setSessionEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Agenda / Description</label>
            <textarea
              rows={3}
              value={sessionDesc}
              onChange={(e) => setSessionDesc(e.target.value)}
              placeholder="What topics or live labs will be covered in this session?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSessionModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Direct Student Enrolment Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={`Enrol Verified Student into Cohort ${batch.code}`}
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-bold">Google Authentication Policy:</p>
            <p>
              Students must possess a verified Google account in the academy database. Enter their exact Google email
              address below to add them to this cohort.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Student Google Email Address *</label>
            <input
              type="email"
              required
              value={enrollEmail}
              onChange={(e) => setEnrollEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Enrolling...' : 'Enrol Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={announceModalOpen}
        onClose={() => setAnnounceModalOpen(false)}
        title="Broadcast Cohort Announcement"
      >
        <form onSubmit={handlePostAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Announcement Subject *</label>
            <input
              type="text"
              required
              value={announceTitle}
              onChange={(e) => setAnnounceTitle(e.target.value)}
              placeholder="e.g. Schedule Update for Lab 3"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Priority</label>
            <select
              value={announcePriority}
              onChange={(e) => setAnnouncePriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Alert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">Notice Content *</label>
            <textarea
              required
              rows={4}
              value={announceContent}
              onChange={(e) => setAnnounceContent(e.target.value)}
              placeholder="Write message to all cohort students..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAnnounceModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Broadcasting...' : 'Send to Cohort'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Attendance Marking Modal */}
      <Modal
        isOpen={!!attendanceModalSession}
        onClose={() => setAttendanceModalSession(null)}
        title={attendanceModalSession ? `Log Attendance: ${attendanceModalSession.title}` : 'Mark Attendance'}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Mark attendance for students enrolled in this batch. Attendance percentages directly gate certificate eligibility.
          </p>

          <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {initialEnrollments.map((enr) => {
              const studentId = enr.studentId?._id;
              if (!studentId) return null;
              const current = attendanceState[studentId] || { status: 'PRESENT', minutes: 60 };

              return (
                <div key={studentId} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-navy-950">{enr.studentId.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{enr.studentId.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            setAttendanceState((prev) => ({
                              ...prev,
                              [studentId]: { ...prev[studentId], status: st },
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                            current.status === st
                              ? st === 'PRESENT'
                                ? 'bg-emerald-600 text-white'
                                : st === 'LATE'
                                ? 'bg-amber-600 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      min={0}
                      value={current.minutes}
                      onChange={(e) =>
                        setAttendanceState((prev) => ({
                          ...prev,
                          [studentId]: { ...prev[studentId], minutes: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-xs text-center"
                      title="Minutes attended"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAttendanceModalSession(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Save & Mark Session Completed'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
