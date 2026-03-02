import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { activityLog } from '../data/mockData';
import { GlowingEffect } from '../components/ui/GlowingEffect';
import {
  TrendingUp, Users, FolderKanban, CheckCircle2,
  Clock, ArrowRight, Sparkles, Target, DollarSign, Eye, AlertTriangle,
  Plus, FileText, BarChart3, Calendar, Lightbulb, X, Rocket
} from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400',
  planning: 'bg-blue-500/20 text-blue-400',
  'in-review': 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  active: 'bg-brand-500/20 text-brand-400',
  completed: 'bg-green-500/20 text-green-400',
  paused: 'bg-red-500/20 text-red-400',
};

const activityIcons: Record<string, string> = {
  create: '🆕', update: '📝', delete: '🗑️', approve: '✅', comment: '💬', upload: '📁',
};

export default function Dashboard() {
  const { campaigns, approvals, setView, setSelectedCampaignId, currentUser, theme } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulate initial data loading for premium feel
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Show onboarding if fewer than 2 campaigns exist (new user)
  useEffect(() => {
    const dismissed = localStorage.getItem('campaignos_onboarding_dismissed');
    if (!dismissed && campaigns.length <= 5) {
      setShowOnboarding(true);
    }
  }, [campaigns.length]);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('campaignos_onboarding_dismissed', 'true');
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'planning' || c.status === 'in-review');
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
  const totalTasks = campaigns.reduce((s, c) => s + c.tasks.length, 0);
  const completedTasks = campaigns.reduce((s, c) => s + c.tasks.filter(t => t.status === 'done').length, 0);

  const stats = [
    { label: 'Active Campaigns', value: activeCampaigns.length, icon: <FolderKanban size={20} />, trend: `${campaigns.length} total`, trendUp: true, color: 'from-brand-500 to-violet-600' },
    { label: 'Total Budget', value: `£${(totalBudget / 1000).toFixed(0)}k`, icon: <DollarSign size={20} />, trend: `£${(totalSpent / 1000).toFixed(0)}k spent`, trendUp: true, color: 'from-emerald-500 to-teal-600' },
    { label: 'Budget Utilised', value: `${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%`, icon: <Target size={20} />, trend: `${Math.round(totalBudget > 0 ? 100 - (totalSpent / totalBudget) * 100 : 100)}% remaining`, trendUp: totalSpent / totalBudget < 0.8, color: 'from-amber-500 to-orange-600' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: <CheckCircle2 size={20} />, trend: pendingApprovals > 0 ? 'Needs action' : 'All clear', trendUp: pendingApprovals === 0, color: 'from-rose-500 to-pink-600' },
  ];

  const quickActions = [
    { label: 'New Campaign', icon: <Plus size={18} />, action: () => setView('campaigns'), color: 'from-brand-600 to-violet-600', desc: 'Create a campaign' },
    { label: 'AI Brief', icon: <Sparkles size={18} />, action: () => setView('ai-brief'), color: 'from-violet-600 to-purple-600', desc: 'Generate with AI' },
    { label: 'View Calendar', icon: <Calendar size={18} />, action: () => setView('calendar'), color: 'from-blue-600 to-cyan-600', desc: 'Campaign timeline' },
    { label: 'KPI Dashboard', icon: <BarChart3 size={18} />, action: () => setView('kpi'), color: 'from-emerald-600 to-teal-600', desc: 'View metrics' },
    { label: 'Growth Ideas', icon: <Lightbulb size={18} />, action: () => setView('mkt-ideas'), color: 'from-amber-500 to-orange-600', desc: '139 Framework' },
    { label: 'Approvals', icon: <FileText size={18} />, action: () => setView('approvals'), color: 'from-pink-600 to-rose-600', desc: `${pendingApprovals} pending` },
  ];

  // Skeleton component
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`skeleton ${className}`} />
  );

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" /></div>
          <div className="flex gap-3"><Skeleton className="h-10 w-40" /><Skeleton className="h-10 w-36" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className={`rounded-2xl p-5 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'}`}>
              <div className="flex justify-between mb-4"><Skeleton className="h-11 w-11" /><Skeleton className="h-6 w-16" /></div>
              <Skeleton className="h-8 w-20 mb-2" /><Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-2xl p-5 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'}`}>
            <Skeleton className="h-6 w-40 mb-4" />
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full mb-3" />)}
          </div>
          <div className="space-y-6">
            <div className={`rounded-2xl p-5 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'}`}>
              <Skeleton className="h-32 w-32 mx-auto rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 page-enter">
      {/* Onboarding Banner */}
      {showOnboarding && (
        <div className={`relative overflow-hidden rounded-2xl p-6 animate-slide-up ${
          theme === 'light'
            ? 'bg-gradient-to-r from-brand-50 via-violet-50 to-purple-50 border border-brand-200'
            : 'bg-gradient-to-r from-brand-900/40 via-violet-900/30 to-purple-900/20 border border-brand-700/30'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <button onClick={dismissOnboarding} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
            <X size={16} />
          </button>
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0">
              <Rocket size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">Welcome to Comms Dashboard 🎉</h2>
              <p className="text-sm text-slate-400 max-w-xl">
                Your enterprise campaign planning platform. Start by creating your first campaign, generating an AI brief, or exploring the 139 Growth Ideas framework.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => { setView('campaigns'); dismissOnboarding(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold text-white transition-colors btn-press shadow-lg shadow-brand-500/20">
                  <Plus size={16} /> Create Campaign
                </button>
                <button onClick={() => { setView('ai-brief'); dismissOnboarding(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors btn-press ${
                    theme === 'light' ? 'bg-white border border-gray-200 hover:bg-gray-50' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                  }`}>
                  <Sparkles size={16} className="text-violet-400" /> Try AI Brief
                </button>
                <button onClick={() => { setView('mkt-ideas'); dismissOnboarding(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors btn-press ${
                    theme === 'light' ? 'bg-white border border-gray-200 hover:bg-gray-50' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                  }`}>
                  <Lightbulb size={16} className="text-amber-400" /> 139 Ideas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser?.name.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Here's your campaign overview for {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('ai-brief')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all text-white btn-press">
            <Sparkles size={16} /> AI Brief
          </button>
          <button onClick={() => setView('campaigns')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors btn-press ${
              theme === 'light' ? 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            }`}>
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map((stat, i) => (
          <div key={i} className={`relative card-premium rounded-2xl p-5 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'}`}>
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={50}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="flex items-start justify-between relative z-10">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg text-white`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.trendUp ? 'bg-success-500/10 text-success-500' : 'bg-warning-500/10 text-warning-500'}`}>
                {stat.trendUp ? <TrendingUp size={12} /> : <AlertTriangle size={12} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((action, i) => (
            <button key={i} onClick={action.action}
              className={`group relative card-premium flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all btn-press ${
                theme === 'light' ? 'bg-white border border-gray-200 hover:border-brand-300' : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
              }`}>
              <GlowingEffect
                spread={35}
                glow={true}
                disabled={false}
                proximity={45}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <div className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="relative z-10">
                <p className="text-xs font-semibold">{action.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Pipeline */}
        <div className={`lg:col-span-2 rounded-2xl ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'}`}>
          <div className={`flex items-center justify-between p-5 ${theme === 'light' ? 'border-b border-gray-200' : 'border-b border-slate-800'}`}>
            <div>
              <h2 className="font-semibold text-lg">Campaign Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">{campaigns.length} campaigns across all workspaces</p>
            </div>
            <button onClick={() => setView('campaigns')} className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 btn-press">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {campaigns.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">No campaigns yet</p>
                <p className="text-xs text-slate-600 mt-1">Create your first campaign to get started</p>
                <button onClick={() => setView('campaigns')} className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold text-white transition-colors btn-press">
                  <Plus size={14} className="inline mr-1.5" /> Create Campaign
                </button>
              </div>
            ) : campaigns.slice(0, 6).map((campaign, i) => (
              <div key={campaign.id}
                className={`card-premium flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all group ${
                  theme === 'light' ? 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200' : 'bg-slate-800/40 hover:bg-slate-800/70 border border-transparent hover:border-slate-700'
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => { setSelectedCampaignId(campaign.id); setView('campaign-detail'); }}>
                <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: campaign.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{campaign.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColors[campaign.status]}`}>
                      {campaign.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {campaign.team.length}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {campaign.endDate}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> £{(campaign.budget / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div className="hidden md:block w-28">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Budget</span>
                    <span className="tabular-nums">{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-gray-200' : 'bg-slate-700'}`}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%`, backgroundColor: campaign.color }} />
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Task Progress */}
          <div className={`rounded-2xl p-5 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'}`}>
            <h2 className="font-semibold mb-4">Task Progress</h2>
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3"
                  strokeDasharray={`${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} ${totalTasks > 0 ? 100 - (completedTasks / totalTasks) * 100 : 100}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0}%</span>
                <span className="text-[10px] text-slate-500">Complete</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className={`rounded-lg p-2 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
                <p className="text-lg font-bold text-brand-400 tabular-nums">{completedTasks}</p>
                <p className="text-[10px] text-slate-500">Done</p>
              </div>
              <div className={`rounded-lg p-2 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
                <p className="text-lg font-bold text-amber-400 tabular-nums">{totalTasks - completedTasks}</p>
                <p className="text-[10px] text-slate-500">Remaining</p>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className={`rounded-2xl p-5 ${theme === 'light'
            ? 'bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-200'
            : 'bg-gradient-to-br from-brand-900/30 to-violet-900/20 border border-brand-700/30'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-400" />
              <h2 className="font-semibold text-sm">AI Insights</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: <TrendingUp size={14} className="text-success-500" />, text: `${activeCampaigns.length} campaigns active. Task completion at ${totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0}%.`, highlight: 'text-success-500' },
                { icon: <AlertTriangle size={14} className="text-warning-500" />, text: pendingApprovals > 0 ? `${pendingApprovals} approval(s) pending — review to keep projects on track.` : 'All approvals are up to date.', highlight: pendingApprovals > 0 ? 'text-warning-500' : 'text-success-500' },
                { icon: <Eye size={14} className="text-brand-400" />, text: `Budget utilisation at ${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%. ${totalSpent / totalBudget > 0.8 ? 'Monitor spending.' : 'Healthy spend rate.'}`, highlight: 'text-brand-400' },
              ].map((insight, i) => (
                <div key={i} className={`rounded-lg p-3 flex items-start gap-2 ${theme === 'light' ? 'bg-white/80' : 'bg-slate-900/50'}`}>
                  <span className="mt-0.5 flex-shrink-0">{insight.icon}</span>
                  <p className="text-xs text-slate-300">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`rounded-2xl p-5 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Recent Activity</h2>
              <span className="text-[10px] text-slate-500">Last 24h</span>
            </div>
            <div className="space-y-3">
              {activityLog.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-sm mt-0.5">{activityIcons[log.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-medium">{log.user.name}</span> {log.action.toLowerCase()}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Bar */}
      {pendingApprovals > 0 && (
        <div className={`rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up ${
          theme === 'light'
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
            : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-sm">You have {pendingApprovals} pending approval{pendingApprovals > 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-400 mt-0.5">Review and approve campaign materials to keep projects on track</p>
            </div>
          </div>
          <button onClick={() => setView('approvals')} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-colors btn-press">
            Review Now
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600">CampaignOS Enterprise v1.0 — UK GDPR Compliant · ISO 27001 Ready · SOC 2 Type II</p>
      </div>
    </div>
  );
}
