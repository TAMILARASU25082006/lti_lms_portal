'use client';

import React, { useState } from 'react';
import { Search, Ban, CheckCircle2, Shield, User, Filter, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AdminUserListClientProps {
  initialUsers: any[];
}

export default function AdminUserListClient({ initialUsers }: AdminUserListClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    setIsUpdating(userId);
    setMsg(null);

    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_SUSPEND',
          userId,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setUsers(
        users.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
      );
      setMsg({ type: 'success', text: `Account status updated to ${nextStatus}.` });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students by name or Google email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
        >
          <option value="ALL">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="TUTOR">Tutors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Google Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Enrolled Courses</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => {
                const isSuspended = u.status === 'SUSPENDED';
                return (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy-950 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-navy-900 flex items-center justify-center font-bold text-xs overflow-hidden">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <p>{u.name}</p>
                        {u.googleProviderId && (
                          <span className="text-[10px] text-blue-600 font-normal">Google Linked</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-600">{u.email}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'TUTOR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-navy-950">
                      {u.activeEnrollments || 0} Batches
                    </td>

                    <td className="px-6 py-4 text-slate-500">{formatDate(u.createdAt)}</td>

                    <td className="px-6 py-4">
                      {isSuspended ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleSuspend(u._id, u.status)}
                          disabled={isUpdating === u._id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            isSuspended
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isUpdating === u._id
                            ? 'Updating...'
                            : isSuspended
                            ? 'Reactivate Access'
                            : 'Suspend Account'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
