'use client';

import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Calendar, Terminal, ChevronDown, ChevronRight, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AuditItem {
  _id: string;
  action: string;
  performerName: string;
  performerEmail: string;
  targetType: string;
  targetId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditClient({ initialLogs }: { initialLogs: AuditItem[] }) {
  const [logs, setLogs] = useState<AuditItem[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const actionTypes = Array.from(new Set(initialLogs.map(l => l.action)));

  const filtered = logs.filter(log => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesSearch =
      search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.performerName.toLowerCase().includes(search.toLowerCase()) ||
      log.performerEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.targetType.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionColor = (action: string) => {
    if (action.includes('REVOKE') || action.includes('SUSPEND') || action.includes('DELETE')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('APPROVE') || action.includes('PUBLISH') || action.includes('REINSTATE') || action.includes('ENROLL')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('INVITE') || action.includes('ASSIGN') || action.includes('UPDATE')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, administrator email, details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-navy-600"
          >
            <option value="ALL">All Actions ({initialLogs.length})</option>
            {actionTypes.map(at => (
              <option key={at} value={at}>
                {at}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map(log => {
                  const isExpanded = expandedId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        onClick={() => toggleExpand(log._id)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{log.performerName}</div>
                          <div className="text-xs text-slate-400 font-mono">{log.performerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {log.targetType}
                          </span>
                          {log.targetId && (
                            <span className="ml-1 text-[11px] font-mono text-slate-400">
                              #{log.targetId.slice(-6)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                          {log.ipAddress || 'Internal'}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={6} className="p-4 pl-12 border-b border-slate-100">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <Terminal className="w-3.5 h-3.5 text-navy-800" />
                                <span>Action Details & Payload</span>
                              </div>
                              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
