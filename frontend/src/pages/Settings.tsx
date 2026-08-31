import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Check } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<{ key: string; value: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();

  const loadSettings = async () => {
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
  }, []);

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

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
        <div>
          <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase flex items-center gap-2">
            [ NODE CONFIGURATION MATRIX ]
          </h1>
          <p className="text-trace-dim text-xs mt-0.5">
            GLOBAL SOCKET BUS LIMITS, INTERFACE BINDINGS, AND CONTAINER POLICIES
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="btn-rack p-2"
          title="Refresh"
          aria-label="Refresh Settings"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="rack-blade p-5 sm:p-6 border-rack-border bg-rack-panel space-y-4">
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
    </div>
  );
};
