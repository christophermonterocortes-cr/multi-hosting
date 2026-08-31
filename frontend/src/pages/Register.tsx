import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', {
        email: email.trim(),
        username: username.trim(),
        password
      });

      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-rack-bg p-4 font-mono text-xs select-none relative">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-signal-amber bg-rack-panel text-signal-amber font-display font-black text-lg shadow-amber-edge">
            MH
          </div>
          <h2 className="font-display font-black text-2xl tracking-wider text-trace-silver uppercase">
            MULTI<span className="text-signal-amber">HOSTING</span>
          </h2>
          <p className="text-[10px] text-trace-dim tracking-widest uppercase">
            REGISTER OPERATOR TENANT
          </p>
        </div>

        <div className="rack-blade p-6 sm:p-7 border-2 border-rack-border bg-rack-panel space-y-4 shadow-rack-panel">
          <div className="border-b border-rack-border pb-2.5">
            <h3 className="font-display font-bold text-sm text-trace-silver uppercase tracking-wider">
              [ PROVISION OPERATOR ACCOUNT ]
            </h3>
            <p className="text-[10px] text-trace-dim">GRANTS CONTAINER & DATABASE PROVISIONING ACCESS</p>
          </div>

          {error && (
            <div className="border border-breaker-red bg-breaker-red/10 p-2.5 text-breaker-red font-bold text-xs">
              FAULT: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-trace-silver uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="developer@domain.lan"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver placeholder-trace-subtle font-mono focus:border-signal-amber focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-trace-silver uppercase mb-1">
                Operator Username
              </label>
              <input
                type="text"
                required
                placeholder="dev_operator"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-xs text-trace-silver placeholder-trace-subtle font-mono focus:border-signal-amber focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-trace-silver uppercase mb-1">
                Master Passkey (Min 8 Chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-rack-border bg-rack-bg pl-3 pr-10 py-2 text-xs text-trace-silver placeholder-trace-subtle font-mono focus:border-signal-amber focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-trace-dim hover:text-signal-amber text-[10px]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  [{showPassword ? 'HIDE' : 'SHOW'}]
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-rack btn-rack-primary w-full flex items-center justify-center gap-2 py-2.5 shadow-hard"
            >
              {loading ? (
                <span>REGISTERING...</span>
              ) : (
                <>
                  <span>REGISTER OPERATOR</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-rack-border pt-3 text-center text-[10px] text-trace-dim">
            <span>ALREADY HAVE ACCESS? </span>
            <Link to="/login" className="font-bold text-signal-amber hover:underline">
              AUTHENTICATE HERE
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 text-[10px] text-trace-dim">
          <span>SECURED WITH BCRYPT & AES-256 ENCRYPTION</span>
          <span className="font-mono">© {currentYear} MULTI HOSTING BARE-METAL NODE</span>
        </div>
      </div>
    </div>
  );
};
