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
    <div className="min-h-screen bg-slate-950 flex" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%), #020617' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/30">
              C
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Comms Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Enterprise Campaign Platform</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            The Ultimate<br />Campaign Planner
          </h2>
          <p className="text-lg text-slate-400 max-w-md">
            AI-powered campaign planning, stakeholder collaboration, and performance analytics — built for enterprise and public sector teams.
          </p>

          <div className="space-y-4">
            {[
              { icon: <Zap size={18} />, title: 'AI Brief Generator', desc: 'Generate complete campaign briefs from a simple prompt' },
              { icon: <Users size={18} />, title: 'Stakeholder Approvals', desc: 'Structured approval workflows with full audit trails' },
              { icon: <BarChart3 size={18} />, title: 'KPI Dashboards', desc: 'Real-time performance tracking with AI insights' },
              { icon: <Shield size={18} />, title: 'Enterprise Security', desc: 'UK GDPR compliant, ISO 27001 ready, role-based access' },
            ].map((feature, i) => (
              <div key={i} className="relative flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={60}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <div className="relative z-10 w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-[11px] text-slate-600">
            © 2025 Comms Dashboard · UK GDPR Compliant · ISO 27001 Ready · SOC 2 Type II
          </p>
        </div>
      </div>

      {/* Right Panel - Login/Create */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold shadow-lg shadow-brand-500/20">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold">Comms Dashboard</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enterprise</p>
            </div>
          </div>

          {mode === 'login' ? (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="text-sm text-slate-400 mt-2">Sign in to your Comms Dashboard workspace</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@organisation.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 animate-fade-in">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-wait rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
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
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-3 font-medium">Quick demo login:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Admin', email: 'admin@campaignos.com', pass: 'admin123', color: 'from-brand-600/20 to-brand-600/10 border-brand-700/30 text-brand-400' },
                    { label: 'Editor', email: 'editor@campaignos.com', pass: 'editor123', color: 'from-emerald-600/20 to-emerald-600/10 border-emerald-700/30 text-emerald-400' },
                    { label: 'Contributor', email: 'contributor@campaignos.com', pass: 'contributor123', color: 'from-amber-600/20 to-amber-600/10 border-amber-700/30 text-amber-400' },
                    { label: 'Viewer', email: 'viewer@campaignos.com', pass: 'viewer123', color: 'from-slate-600/20 to-slate-600/10 border-slate-600/30 text-slate-400' },
                  ].map(q => (
                    <button
                      key={q.label}
                      onClick={() => quickLogin(q.email, q.pass)}
                      className={`px-3 py-2.5 bg-gradient-to-r ${q.color} border rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]`}
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
                  <button onClick={() => { setMode('create'); setError(''); }} className="text-brand-400 hover:text-brand-300 font-semibold">
                    Create User Account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {createSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Account Created!</h3>
                  <p className="text-sm text-slate-400">Redirecting to login...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Create Account</h2>
                    <p className="text-sm text-slate-400 mt-2">Set up a new user for the workspace</p>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Full Name *</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g., Jane Smith"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Email Address *</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="e.g., jane.smith@nhs.net"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Password * (min 6 characters)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Choose a password"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium">Role *</label>
                        <select
                          value={newRole}
                          onChange={e => setNewRole(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="contributor">Contributor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium">Department</label>
                        <input
                          type="text"
                          value={newDept}
                          onChange={e => setNewDept(e.target.value)}
                          placeholder="e.g., Marketing"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Role descriptions */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Role Permissions</p>
                      <div className="space-y-2 text-xs text-slate-400">
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'admin' ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20' : ''}`}>
                          <span className="font-semibold text-brand-400">Admin:</span> Full access — create, edit, delete, approve, manage users & settings
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'editor' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : ''}`}>
                          <span className="font-semibold text-emerald-400">Editor:</span> Create, edit, approve — no delete or settings management
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'contributor' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : ''}`}>
                          <span className="font-semibold text-amber-400">Contributor:</span> Create and submit only — cannot approve, delete, or change settings
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${newRole === 'viewer' ? 'bg-slate-500/10 text-slate-300 border border-slate-600/20' : ''}`}>
                          <span className="font-semibold text-slate-400">Viewer:</span> Read-only — view dashboards and campaigns, nothing else
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 animate-fade-in">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(''); }}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
                      >
                        Back to Login
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all"
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
