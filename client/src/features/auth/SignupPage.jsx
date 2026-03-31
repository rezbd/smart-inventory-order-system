import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import api from '../../api/axios';

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/signup', form);
      setAuth(data.token, data.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4">
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative w-full max-w-md animate-fade-up">
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
        </div>

        <div className="bg-panel border border-border shadow-panel rounded-lg p-8">
          <h1 className="font-display text-xl font-600 text-bright mb-1">Create your account</h1>
          <p className="text-dim text-sm font-mono mb-7">Get started in under a minute</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-rose-dim border border-rose/30 rounded text-rose text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { name: 'name',     label: 'Full Name',      type: 'text',     placeholder: 'John Doe' },
              { name: 'email',    label: 'Email Address',  type: 'email',    placeholder: 'you@company.com' },
              { name: 'password', label: 'Password',       type: 'password', placeholder: '6+ characters' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-soft text-xs font-mono uppercase tracking-widest mb-2">
                  {field.label}
                </label>
                <input
                  name={field.name}
                  type={field.type}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full bg-surface border border-border rounded px-4 py-3 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber focus:shadow-amber-glow transition-all duration-200"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber hover:bg-amber-glow text-void font-display font-700 py-3 rounded transition-all duration-200 disabled:opacity-50 text-sm uppercase tracking-wider"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-dim text-xs font-mono">
            Already have an account?{' '}
            <Link to="/login" className="text-amber hover:text-amber-glow transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}