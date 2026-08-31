import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Check, Lock, Key, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<{ key: string; value: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const loadSettings = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/system/settings');
      setSettings(res.data.settings);
    } catch (err: any) {
      console.error('Failed to load settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [isAdmin]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.put('/system/settings', { settings });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (newPassword.length < 8) {
      setPassError('New passkey must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passkey and confirmation do not match.');
      return;
    }

    setPassLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 4000);
    } catch (err: any) {
      setPassError(err.response?.data?.error || err.message || 'Failed to change passkey.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
        <div>
          <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase flex items-center gap-2">
            [ OPERATOR PREFERENCES & CONFIGURATION ]
          </h1>
          <p className="text-trace-dim text-xs mt-0.5">
            SECURITY CREDENTIALS, GLOBAL SOCKET LIMITS, AND CONTAINER POLICIES
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={loadSettings}
            className="btn-rack p-2"
            title="Refresh"
            aria-label="Refresh Settings"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Operator Passkey Management Card */}
      <div className="rack-blade p-5 sm:p-6 border-rack-border bg-rack-panel space-y-4">
        <div className="border-b border-rack-border pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-signal-amber filament-amber"></div>
            <div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase tracking-wider">
                [ OPERATOR PASSKEY MANAGEMENT ]
              </h3>
              <p className="text-[10px] text-trace-dim">
                AUTHENTICATED OPERATOR: <strong className="text-signal-amber">{user?.username}</strong> ({user?.email})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="btn-rack text-[10px]"
          >
            [{showPasswords ? 'CONCEAL PASSKEYS' : 'REVEAL PASSKEYS'}]
          </button>
        </div>

        {passSuccess && (
          <div className="border border-signal-amber bg-signal-amber/10 p-3 text-signal-amber font-bold flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>OPERATOR PASSKEY RE-ENCRYPTED AND COMMITTED SUCCESSFULLY.</span>
          </div>
        )}

        {passError && (
          <div className="border border-breaker-red bg-breaker-red/10 p-3 text-breaker-red font-bold flex items-center gap-2">
            <span>FAULT: {passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-lg">
          <div>
            <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">
              Current Passkey
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter active passkey"
              className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver font-mono focus:border-signal-amber focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">
              New Passkey (Min 8 Characters)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new passkey"
              className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver font-mono focus:border-signal-amber focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">
              Confirm New Passkey
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new passkey"
              className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver font-mono focus:border-signal-amber focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passLoading}
              className="btn-rack btn-rack-primary flex items-center gap-1.5 shadow-hard"
            >
              <Key className="h-3.5 w-3.5" />
              <span>{passLoading ? 'ENCRYPTING...' : 'UPDATE OPERATOR PASSKEY'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Global Node Configuration (Admin Only) */}
      {isAdmin && (
        <div className="rack-blade p-5 sm:p-6 border-rack-border bg-rack-panel space-y-4">
          <div className="border-b border-rack-border pb-3">
            <h3 className="font-display font-bold text-sm text-trace-silver uppercase tracking-wider">
              [ NODE SYSTEM PARAMETERS ]
            </h3>
            <p className="text-[10px] text-trace-dim">
              INFRASTRUCTURE AND HOST DAEMON LEVEL CONFIGURATIONS
            </p>
          </div>

          {success && (
            <div className="border border-signal-amber bg-signal-amber/10 p-3 text-signal-amber font-bold flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>NODE CONFIGURATION COMMITTED SUCCESSFULLY.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            {settings.map((setting) => (
              <div key={setting.key} className="space-y-1">
                <label className="block text-[11px] font-bold text-trace-silver uppercase tracking-wider">
                  {setting.description || setting.key}
                </label>
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver font-mono focus:border-signal-amber focus:outline-none"
                />
                <span className="text-[10px] text-trace-dim font-mono block">
                  PARAM KEY: <code className="text-signal-amber">{setting.key}</code>
                </span>
              </div>
            ))}

            <div className="pt-2 border-t border-rack-border">
              <button
                type="submit"
                disabled={saving}
                className="btn-rack btn-rack-primary flex items-center gap-1.5 shadow-hard"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'COMMITTING...' : 'COMMIT NODE CONFIGURATION'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
