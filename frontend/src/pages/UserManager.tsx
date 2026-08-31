import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, UserCheck, UserX, Trash2, RefreshCw, X, Server } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'USER'>('USER');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err: any) {
      console.error('Failed to load users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.post('/users', {
        email: newEmail.trim(),
        username: newUsername.trim(),
        password: newPassword,
        role: newRole
      });
      setShowCreateModal(false);
      setNewEmail('');
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      loadUsers();
    } catch (err: any) {
      alert(`Update failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleRoleChange = async (user: User, newRole: 'ADMIN' | 'USER') => {
    if (user.id === currentUser?.id) {
      alert('You cannot change your own role.');
      return;
    }
    try {
      await api.put(`/users/${user.id}`, { role: newRole });
      loadUsers();
    } catch (err: any) {
      alert(`Role change failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user '${user.username}'?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      loadUsers();
    } catch (err: any) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
        <div>
          <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase flex items-center gap-2">
            [ TENANT ACCESS CONTROL ]
          </h1>
          <p className="text-trace-dim text-xs mt-0.5">
            ROLE-BASED AUTHORIZATION AND ISOLATED WORKSPACE ASSIGNMENTS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-rack btn-rack-primary flex items-center gap-1.5 shadow-hard"
          >
            <Plus className="h-4 w-4" />
            <span>CREATE USER</span>
          </button>

          <button
            onClick={loadUsers}
            className="btn-rack p-2"
            title="Refresh"
            aria-label="Refresh Users List"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rack-blade border-rack-border bg-rack-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rack-border bg-rack-bg text-[10px] font-bold uppercase tracking-wider text-trace-dim">
              <tr>
                <th className="px-4 py-2.5">IDENTIFIER</th>
                <th className="px-4 py-2.5">ROLE ACCESS</th>
                <th className="px-4 py-2.5">STATUS</th>
                <th className="px-4 py-2.5">BOUND UNITS</th>
                <th className="px-4 py-2.5">REGISTERED</th>
                <th className="px-4 py-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rack-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-trace-dim">
                    <RefreshCw className="inline h-5 w-5 animate-spin text-signal-amber mr-2" />
                    QUERYING ACCESS LOGS...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-rack-subtle transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-trace-silver">{u.username}</div>
                      <div className="text-trace-dim text-[11px]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={u.id === currentUser?.id}
                        onChange={(e) => handleRoleChange(u, e.target.value as any)}
                        className={`border px-2 py-0.5 text-xs font-bold font-mono bg-rack-bg ${
                          u.role === 'ADMIN'
                            ? 'border-signal-amber text-signal-amber'
                            : 'border-rack-border text-trace-dim'
                        }`}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.id === currentUser?.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border ${
                          u.isActive
                            ? 'bg-signal-amber/10 text-signal-amber border-signal-amber/30'
                            : 'bg-breaker-red/10 text-breaker-red border-breaker-red/30'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserCheck className="h-3 w-3" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" /> LOCKED
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-bold text-trace-silver">
                      {u.projectCount || 0}
                    </td>
                    <td className="px-4 py-3 text-trace-dim text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn-rack btn-rack-danger p-1"
                          title="Delete User"
                          aria-label="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-4 pt-10 sm:pt-14 backdrop-blur-sm select-none font-mono text-xs">
          <div className="relative w-full max-w-md border-2 border-signal-amber bg-rack-panel shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-rack-border px-5 py-3.5 bg-rack-bg">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-signal-amber filament-amber"></div>
                <div>
                  <h2 className="font-display font-black text-sm text-trace-silver uppercase tracking-wider">
                    [ PROVISION USER ACCOUNT ]
                  </h2>
                  <p className="text-[10px] text-trace-dim">CREATE ROLE-SCOPED TENANT</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 border border-rack-border text-trace-dim hover:text-trace-silver"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="m-4 border border-breaker-red bg-breaker-red/10 p-2.5 text-breaker-red font-bold text-xs">
                FAULT: {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="developer@node.lan"
                  className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver focus:border-signal-amber focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="dev_user"
                  className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver focus:border-signal-amber focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver focus:border-signal-amber focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">Role Level</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver focus:border-signal-amber focus:outline-none font-mono"
                >
                  <option value="USER">USER — Scoped Project Access</option>
                  <option value="ADMIN">ADMIN — Full Infrastructure Control</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rack-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-rack"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-rack btn-rack-primary"
                >
                  <span>{creating ? 'COMMITTING...' : 'CREATE ACCOUNT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
