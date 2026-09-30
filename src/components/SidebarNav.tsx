'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import BrandLogo from './BrandLogo';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  FileCheck2,
  HelpCircle,
  Award,
  Bell,
  UserCheck,
  Users,
  Settings,
  Shield,
  Layers,
  BarChart3,
  MailQuestion,
  FileSpreadsheet,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface SidebarNavProps {
  portal: 'student' | 'tutor' | 'admin';
}

export function SidebarNav({ portal }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const studentLinks = [
    { label: 'Dashboard', href: '/student', icon: GraduationCap },
    { label: 'My Courses', href: '/student/courses', icon: BookOpen },
    { label: 'Live Schedule', href: '/student/schedule', icon: Calendar },
    { label: 'Assignments', href: '/student/assignments', icon: FileCheck2 },
    { label: 'Quizzes', href: '/student/quizzes', icon: HelpCircle },
    { label: 'Attendance', href: '/student/attendance', icon: UserCheck },
    { label: 'Certificates', href: '/student/certificates', icon: Award },
    { label: 'Notifications', href: '/student/notifications', icon: Bell },
  ];

  const tutorLinks = [
    { label: 'Tutor Dashboard', href: '/tutor', icon: BookOpen },
    { label: 'Assigned Courses', href: '/tutor/courses', icon: Layers },
    { label: 'Cohort Batches', href: '/tutor/batches', icon: Users },
    { label: 'Assignments & Grading', href: '/tutor/assignments', icon: FileCheck2 },
    { label: 'Quiz Management', href: '/tutor/quizzes', icon: HelpCircle },
    { label: 'Student Progress', href: '/tutor/students', icon: BarChart3 },
  ];

  const adminLinks = [
    { label: 'Admin Overview', href: '/admin', icon: Shield },
    { label: 'Student Management', href: '/admin/users', icon: Users },
    { label: 'Tutor Invitations', href: '/admin/tutors', icon: UserCheck },
    { label: 'Course Directory', href: '/admin/courses', icon: BookOpen },
    { label: 'Batches & Cohorts', href: '/admin/batches', icon: Layers },
    { label: 'Academic Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Contact Enquiries', href: '/admin/enquiries', icon: MailQuestion },
    { label: 'Certificates Admin', href: '/admin/certificates', icon: Award },
    { label: 'Audit History', href: '/admin/audit', icon: FileSpreadsheet },
    { label: 'Academy Settings', href: '/admin/settings', icon: Settings },
  ];

  const navItems =
    portal === 'student' ? studentLinks : portal === 'tutor' ? tutorLinks : adminLinks;

  const roleBadgeColor =
    portal === 'admin'
      ? 'bg-purple-900/60 text-purple-300 border-purple-500/30'
      : portal === 'tutor'
      ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
      : 'bg-blue-900/60 text-blue-300 border-blue-500/30';

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col min-h-screen border-r border-navy-900 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-900/80">
        <BrandLogo lightMode={true} />
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${roleBadgeColor}`}
          >
            {portal.toUpperCase()} PORTAL
          </span>
          <Link
            href="/"
            target="_blank"
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            Public Site <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-navy-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-navy-900 bg-navy-950/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-navy-800 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-white overflow-hidden">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              session?.user?.name?.[0] || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{session?.user?.name || 'Authorized User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors border border-rose-900/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default SidebarNav;
