import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import api from '../../api/axios';

const DEMO_EMAIL    = 'demo@stockcommand.io';
const DEMO_PASSWORD = 'demo123456';

export default function LoginPage() {
  const navigate       = useNavigate();
  const setAuth        = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter both email and password.');
      return;
    }
    submit(form.email, form.password);
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4">
      {/* Background grid texture */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo mark */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <rect x="2" y="3" width="9" height="9" rx="1" fill="#0a0a0c" />
                <rect x="13" y="3" width="9" height="9" rx="1" fill="#0a0a0c" opacity="0.6" />
                <rect x="2" y="14" width="9" height="7" rx="1" fill="#0a0a0c" opacity="0.6" />
                <rect x="13" y="14" width="9" height="7" rx="1" fill="#0a0a0c" />
              </svg>
            </div>
            <span className="font-display font-800 text-2xl tracking-tight text-bright">
              StockCommand
            </span>
          </div>
          <p className="text-dim font-mono text-sm">Inventory & Order Management System</p>
        </div>

        {/* Card */}
        <div className="bg-panel border border-border shadow-panel rounded-lg p-8">
          <h1 className="font-display text-xl font-600 text-bright mb-1">
            Sign in to your workspace
          </h1>
          <p className="text-dim text-sm font-mono mb-7">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-rose-dim border border-rose/30 rounded text-rose text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-soft text-xs font-mono uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full bg-surface border border-border rounded px-4 py-3 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber focus:shadow-amber-glow transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-soft text-xs font-mono uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-surface border border-border rounded px-4 py-3 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber focus:shadow-amber-glow transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber hover:bg-amber-glow text-void font-display font-700 py-3 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted text-xs font-mono">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              onClick={() => submit(DEMO_EMAIL, DEMO_PASSWORD)}
              disabled={loading}
              className="w-full bg-surface hover:bg-panel border border-border hover:border-amber/40 text-soft hover:text-bright font-mono text-sm py-3 rounded transition-all duration-200 disabled:opacity-50"
            >
              ⚡ Demo Login — Instant Access
            </button>
          </form>

          <p className="mt-6 text-center text-dim text-xs font-mono">
            No account?{' '}
            <Link to="/signup" className="text-amber hover:text-amber-glow transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}