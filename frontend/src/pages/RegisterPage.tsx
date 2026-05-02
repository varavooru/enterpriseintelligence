import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, fullName, password, tenantName || undefined);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stripe-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-stripe-purple flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-bold">P</span>
          </div>
          <h1 className="text-xl font-semibold text-stripe-slate-900">Create your account</h1>
          <p className="text-sm text-stripe-slate-500 mt-1">Start with Prime Enterprise Intelligence</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-md text-sm">{error}</div>
            )}
            <div>
              <label className="label">Organization name</label>
              <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="input-field" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="label">Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="Jane Doe" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@company.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Min. 8 characters" required minLength={8} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating account...' : 'Create account'}</button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-stripe-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-stripe-purple hover:text-stripe-purple-light font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
