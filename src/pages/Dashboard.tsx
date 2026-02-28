import { useApp } from '../store/AppContext';
import { activityLog } from '../data/mockData';
import {
  TrendingUp, Users, FolderKanban, CheckCircle2,
  Clock, ArrowRight, Sparkles, Target, DollarSign, Eye, AlertTriangle
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
  const { campaigns, approvals, setView, setSelectedCampaignId, currentUser } = useApp();

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'planning' || c.status === 'in-review');
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
  const totalTasks = campaigns.reduce((s, c) => s + c.tasks.length, 0);
  const completedTasks = campaigns.reduce((s, c) => s + c.tasks.filter(t => t.status === 'done').length, 0);

  const stats = [
    { label: 'Active Campaigns', value: activeCampaigns.length, icon: <FolderKanban size={20} />, trend: '+2', trendUp: true, color: 'from-brand-500 to-violet-600' },
    { label: 'Total Budget', value: `£${(totalBudget / 1000).toFixed(0)}k`, icon: <DollarSign size={20} />, trend: '£770k', trendUp: true, color: 'from-emerald-500 to-teal-600' },
    { label: 'Budget Utilised', value: `${((totalSpent / totalBudget) * 100).toFixed(0)}%`, icon: <Target size={20} />, trend: `£${(totalSpent / 1000).toFixed(0)}k spent`, trendUp: true, color: 'from-amber-500 to-orange-600' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: <CheckCircle2 size={20} />, trend: 'Needs action', trendUp: false, color: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser?.name.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's your campaign overview for today</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView('ai-brief')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all"
          >
            <Sparkles size={16} />
            AI Brief Generator
          </button>
          <button
            onClick={() => setView('campaigns')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors group">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.trendUp ? 'bg-success-500/10 text-success-500' : 'bg-warning-500/10 text-warning-500'}`}>
                {stat.trendUp ? <TrendingUp size={12} /> : <AlertTriangle size={12} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Pipeline */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div>
              <h2 className="font-semibold text-lg">Campaign Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">{campaigns.length} campaigns across all workspaces</p>
            </div>
            <button onClick={() => setView('campaigns')} className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {campaigns.map((campaign, i) => (
              <div
                key={campaign.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-transparent hover:border-slate-700 cursor-pointer transition-all group"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => { setSelectedCampaignId(campaign.id); setView('campaign-detail'); }}
              >
                <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: campaign.color }} />
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
                {/* Budget bar */}
                <div className="hidden md:block w-32">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Budget</span>
                    <span>{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%`,
                        backgroundColor: campaign.color,
                      }}
                    />
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Task Progress */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Task Progress</h2>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3"
                  strokeDasharray={`${(completedTasks / totalTasks) * 100} ${100 - (completedTasks / totalTasks) * 100}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{((completedTasks / totalTasks) * 100).toFixed(0)}%</span>
                <span className="text-[10px] text-slate-500">Complete</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-lg font-bold text-brand-400">{completedTasks}</p>
                <p className="text-[10px] text-slate-500">Done</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-lg font-bold text-amber-400">{totalTasks - completedTasks}</p>
                <p className="text-[10px] text-slate-500">Remaining</p>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-brand-900/30 to-violet-900/20 border border-brand-700/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-400" />
              <h2 className="font-semibold text-sm">AI Insights</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp size={14} className="text-success-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-300">Primary Care Coach campaign is <span className="text-success-500 font-medium">outperforming</span> by 23% vs. benchmark. Consider increasing paid search allocation.</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-warning-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-300">Vaccination campaign creative assets need <span className="text-warning-500 font-medium">approval by Friday</span> to stay on timeline.</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Eye size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-300">Social sentiment for recruitment is <span className="text-brand-400 font-medium">82% positive</span>. Highest score this quarter.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
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
                      <span className="font-medium text-white">{log.user.name}</span> {log.action.toLowerCase()}
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
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-sm">You have {pendingApprovals} pending approvals</p>
              <p className="text-xs text-slate-400 mt-0.5">Review and approve campaign materials to keep projects on track</p>
            </div>
          </div>
          <button onClick={() => setView('approvals')} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-colors">
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
