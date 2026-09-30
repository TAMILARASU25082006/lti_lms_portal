'use client';

import React from 'react';
import { Clock, Bell } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  title?: string;
  heading?: string;
  subtitle?: string;
  subheading?: string;
  actions?: React.ReactNode;
  userTimezone?: string;
  notificationHref?: string;
  unreadCount?: number;
}

export function DashboardHeader({
  title,
  heading,
  subtitle,
  subheading,
  actions,
  userTimezone = 'UTC',
  notificationHref = '/student/notifications',
  unreadCount = 0,
}: DashboardHeaderProps) {
  const displayTitle = title || heading || '';
  const displaySubtitle = subtitle || subheading;

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight">{displayTitle}</h1>
          {displaySubtitle && <p className="text-sm text-slate-500 mt-1">{displaySubtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Timezone badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Timezone: {userTimezone}</span>
          </div>

          {/* Notifications bell */}
          <Link
            href={notificationHref}
            className="relative p-2 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            title="View Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </Link>

          {/* Action buttons */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;
