import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { GlowingEffect } from '../components/ui/GlowingEffect';
import { Shield, Eye, EyeOff, Zap, Lock, Users, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, createUser } = useApp();
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Create user fields
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor' | 'contributor' | 'viewer'>('contributor');
  const [newDept, setNewDept] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      setLoading(false);
    }, 800);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError('All required fields must be filled.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const result = createUser({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      avatar: initials,
      department: newDept || 'General',
    });

    if (!result.success) {
      setError(result.error || 'Failed to create user');
    } else {
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setMode('login');
        setEmail(newEmail);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('contributor');
        setNewDept('');
      }, 2000);
    }
  };

  const quickLogin = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(email, pass);
      if (!result.success) setError(result.error || 'Login failed');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Left Panel - CWTH Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #003087 0%, #005EB8 60%, #0072CE 100%)' }}>
        {/* Background effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(0, 164, 153, 0.15)' }} />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(0, 164, 153, 0.08)' }} />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg text-white" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
              C
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CWTH Comms</h1>
              <p className="text-xs font-medium tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.6)' }}>Training Hub Campaign Platform</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Built for<br />Training Hubs
          </h2>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Campaign planning, stakeholder workflows, and performance analytics — designed for NHS and health education teams across Coventry and Warwickshire.
          </p>

          <div className="space-y-4">
            {[
              { icon: <Zap size={18} />, title: 'AI Brief Generator', desc: 'Generate complete campaign briefs from a simple prompt' },
              { icon: <Users size={18} />, title: 'Stakeholder Approvals', desc: 'Structured approval workflows with full audit trails' },
              { icon: <BarChart3 size={18} />, title: 'KPI Dashboards', desc: 'Real-time performance tracking with actionable insights' },
              { icon: <Shield size={18} />, title: 'NHS-Ready Compliance', desc: 'UK GDPR compliant, ISO 27001 ready, role-based access' },
            ].map((feature, i) => (
              <div key={i} className="relative flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={60}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <div className="relative z-10 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white" style={{ background: 'rgba(0,164,153,0.4)' }}>
                  {feature.icon}
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © 2025 Coventry and Warwickshire Training Hub · UK GDPR Compliant · ISO 27001 Ready
          </p>
        </div>
      </div>

      {/* Right Panel - Login/Create */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #005EB8, #0072CE)' }}>
              C
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">CWTH Comms</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Training Hub</p>
            </div>
          </div>

          {mode === 'login' ? (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-2">Sign in to your CWTH Comms workspace</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-xs text-slate-600 mb-1.5 block font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@nhs.net"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-brand-500 transition-all shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 mb-1.5 block font-semibold">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-brand-500 transition-all shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fade-in">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-white disabled:opacity-50 disabled:cursor-wait rounded-xl text-sm font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ background: loading ? '#005EB8' : 'linear-gradient(135deg, #005EB8, #003087)', boxShadow: '0 4px 16px rgba(0, 94, 184, 0.3)' }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Quick Login Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-slate-500 mb-3 font-medium">Quick demo login:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Admin', email: 'admin@campaignos.com', pass: 'admin123', bg: 'rgba(0,94,184,0.08)', border: 'rgba(0,94,184,0.2)', color: '#005EB8' },
                    { label: 'Editor', email: 'editor@campaignos.com', pass: 'editor123', bg: 'rgba(0,164,153,0.08)', border: 'rgba(0,164,153,0.25)', color: '#00A499' },
                    { label: 'Contributor', email: 'contributor@campaignos.com', pass: 'contributor123', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#d97706' },
                    { label: 'Viewer', email: 'viewer@campaignos.com', pass: 'viewer123', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', color: '#64748b' },
                  ].map(q => (
                    <button
                      key={q.label}
                      onClick={() => quickLogin(q.email, q.pass)}
                      className="px-3 py-2.5 border rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
                      style={{ background: q.bg, borderColor: q.border, color: q.color }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Account Link */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  Need an account?{' '}
                  <button onClick={() => { setMode('create'); setError(''); }} className="text-brand-600 hover:text-brand-700 font-semibold">
                    Create User Account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {createSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Account Created!</h3>
                  <p className="text-sm text-slate-500">Redirecting to login...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-sm text-slate-500 mt-2">Set up a new user for the CWTH workspace</p>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block font-semibold">Full Name *</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g., Jane Smith"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-brand-500 transition-all shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block font-semibold">Email Address *</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="e.g., jane.smith@nhs.net"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-brand-500 transition-all shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block font-semibold">Password * (min 6 characters)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Choose a password"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-brand-500 transition-all shadow-sm"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 block font-semibold">Role *</label>
                        <select
                          value={newRole}
                          onChange={e => setNewRole(e.target.value as any)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-brand-500 transition-all shadow-sm"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="contributor">Contributor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 block font-semibold">Department</label>
                        <input
                          type="text"
                          value={newDept}
                          onChange={e => setNewDept(e.target.value)}
                          placeholder="e.g., Workforce"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-brand-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Role descriptions */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Role Permissions</p>
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'admin' ? 'bg-brand-50 text-brand-700 border border-brand-200' : ''}`}>
                          <span className="font-semibold text-brand-600">Admin:</span> Full access — create, edit, delete, approve, manage users & settings
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'editor' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}`}>
                          <span className="font-semibold text-emerald-600">Editor:</span> Create, edit, approve — no delete or settings management
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'contributor' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}`}>
                          <span className="font-semibold text-amber-600">Contributor:</span> Create and submit only — cannot approve, delete, or change settings
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'viewer' ? 'bg-slate-100 text-slate-700 border border-slate-200' : ''}`}>
                          <span className="font-semibold text-slate-500">Viewer:</span> Read-only — view dashboards and campaigns, nothing else
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fade-in">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(''); }}
                        className="flex-1 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-slate-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
                      >
                        Back to Login
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #005EB8, #003087)', boxShadow: '0 4px 16px rgba(0, 94, 184, 0.3)' }}
                      >
                        Create Account
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
