/**
 * Admin Dashboard — User management, role assignment, and platform statistics.
 * Only accessible to users with admin role.
 */

import Navigation from '@/components/Navigation';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, UserCheck, Crown, Search, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  advisor: '#F59E0B',
  user: '#3B82F6',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  advisor: 'Advisor',
  user: 'User',
};

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] || '#6B7280';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
      style={{ background: `${color}20`, color }}
    >
      {role === 'admin' && <Crown className="w-3 h-3" />}
      {role === 'advisor' && <UserCheck className="w-3 h-3" />}
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{value}</span>
      </div>
      <p className="text-xs text-muted-foreground font-mono tracking-wider uppercase">{label}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const stableInput = useMemo(() => ({
    limit: pageSize,
    offset: page * pageSize,
    search: search || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
  }), [page, search, roleFilter]);

  const statsQuery = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const usersQuery = trpc.admin.listUsers.useQuery(stableInput, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateRole = trpc.admin.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated successfully');
      usersQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update role');
    },
  });

  // Access check
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Navigation>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Access Denied</h1>
            <p className="text-sm text-muted-foreground">You need admin privileges to access this page.</p>
          </div>
        </div>
      </Navigation>
    );
  }

  const stats = statsQuery.data;
  const userList = usersQuery.data?.users ?? [];
  const totalUsers = usersQuery.data?.total ?? 0;
  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <Navigation>
      <div className="min-h-screen px-6 lg:px-10 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/20">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">Manage users, roles, and platform settings</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Users" value={stats.total} icon={Users} color="#3B82F6" />
            <StatCard label="Admins" value={stats.admins} icon={Crown} color="#EF4444" />
            <StatCard label="Advisors" value={stats.advisors} icon={UserCheck} color="#F59E0B" />
            <StatCard label="Standard Users" value={stats.users} icon={Users} color="#10B981" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="advisor">Advisor</option>
            <option value="user">User</option>
          </select>
          <button
            onClick={() => usersQuery.refetch()}
            className="p-2.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            aria-label="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${usersQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* User Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left text-[10px] font-mono tracking-wider uppercase text-muted-foreground px-4 py-3">User</th>
                  <th className="text-left text-[10px] font-mono tracking-wider uppercase text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-left text-[10px] font-mono tracking-wider uppercase text-muted-foreground px-4 py-3">Role</th>
                  <th className="text-left text-[10px] font-mono tracking-wider uppercase text-muted-foreground px-4 py-3">Last Active</th>
                  <th className="text-left text-[10px] font-mono tracking-wider uppercase text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : userList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {userList.map((u: any) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: `${ROLE_COLORS[u.role] || '#6B7280'}20`, color: ROLE_COLORS[u.role] || '#6B7280' }}>
                              {(u.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.name || 'Unnamed'}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{u.email || '—'}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                          {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {u.id !== user?.id ? (
                            <select
                              value={u.role}
                              onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as any })}
                              disabled={updateRole.isPending}
                              className="text-xs px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                            >
                              <option value="user">User</option>
                              <option value="advisor">Advisor</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">You</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalUsers)} of {totalUsers}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
