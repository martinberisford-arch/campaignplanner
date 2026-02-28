import { useApp } from '../store/AppContext';
import { campaigns as allCampaigns } from '../data/mockData';
import { Task } from '../types';
import {
  ArrowLeft, Clock, Users, DollarSign, Target, CheckCircle2,
  AlertTriangle, Sparkles, TrendingUp, Calendar, Tag, MessageSquare
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

const taskStatusLabels: Record<Task['status'], { label: string; color: string }> = {
  'todo': { label: 'To Do', color: 'bg-slate-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
  'review': { label: 'Review', color: 'bg-amber-500' },
  'done': { label: 'Done', color: 'bg-emerald-500' },
};

const channelLabels: Record<string, string> = {
  'social-media': '📱 Social Media',
  'email': '📧 Email',
  'paid-search': '🔍 Paid Search',
  'display': '🖥️ Display',
  'content': '📝 Content',
  'events': '🎪 Events',
  'pr': '📰 PR',
  'direct-mail': '📬 Direct Mail',
  'video': '🎬 Video',
  'partnerships': '🤝 Partnerships',
};

export default function CampaignDetail() {
  const { selectedCampaignId, setView, campaigns, updateTaskStatus } = useApp();
  const campaign = campaigns.find(c => c.id === selectedCampaignId) ||
                   allCampaigns.find(c => c.id === selectedCampaignId);

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Campaign not found</p>
        <button onClick={() => setView('campaigns')} className="mt-4 text-brand-400 hover:text-brand-300 text-sm">
          ← Back to Campaigns
        </button>
      </div>
    );
  }

  const completedTasks = campaign.tasks.filter(t => t.status === 'done').length;
  const totalTasks = campaign.tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const budgetPct = Math.round((campaign.spent / campaign.budget) * 100);
  const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
      {/* Back Button */}
      <button onClick={() => setView('campaigns')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Campaigns
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-3 h-16 rounded-full flex-shrink-0" style={{ backgroundColor: campaign.color }} />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{campaign.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[campaign.status]}`}>
                {campaign.status.replace('-', ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">{campaign.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1"><Calendar size={12} /> {campaign.startDate} → {campaign.endDate}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {daysRemaining} days remaining</span>
              <span className="flex items-center gap-1"><Users size={12} /> {campaign.team.length} team members</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('kpi')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">
            View KPIs
          </button>
          <button className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
            Edit Campaign
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-500">Budget</span>
          </div>
          <p className="text-xl font-bold">£{(campaign.budget / 1000).toFixed(0)}k</p>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>£{(campaign.spent / 1000).toFixed(1)}k spent</span>
              <span>{budgetPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-brand-400" />
            <span className="text-xs text-slate-500">Task Progress</span>
          </div>
          <p className="text-xl font-bold">{progressPct}%</p>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>{completedTasks}/{totalTasks} tasks</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-amber-400" />
            <span className="text-xs text-slate-500">KPIs on Track</span>
          </div>
          <p className="text-xl font-bold">{campaign.kpis.filter(k => k.value >= k.target * 0.5).length}/{campaign.kpis.length}</p>
          <p className="text-[10px] text-slate-500 mt-2">
            {campaign.kpis.filter(k => k.value >= k.target).length} exceeded target
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-pink-400" />
            <span className="text-xs text-slate-500">Timeline</span>
          </div>
          <p className="text-xl font-bold">{daysRemaining}d</p>
          <p className="text-[10px] text-slate-500 mt-2">remaining of campaign</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tasks & Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goals */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target size={16} className="text-brand-400" /> Campaign Goals
            </h3>
            <div className="space-y-2">
              {campaign.goals.map((goal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                  <CheckCircle2 size={16} className="text-slate-600 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{goal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold">Tasks ({campaign.tasks.length})</h3>
              <div className="flex gap-2">
                {(['todo', 'in-progress', 'review', 'done'] as const).map(s => (
                  <span key={s} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${taskStatusLabels[s].color}`} />
                    {campaign.tasks.filter(t => t.status === s).length}
                  </span>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-800/50">
              {campaign.tasks.map(task => (
                <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/20 transition-colors">
                  <select
                    value={task.status}
                    onChange={e => updateTaskStatus(campaign.id, task.id, e.target.value as Task['status'])}
                    className="bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                  {task.assignee && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      title={task.assignee.name}>
                      {task.assignee.avatar}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                    <Clock size={10} /> {task.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          {campaign.kpis.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> Key Performance Indicators
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.kpis.map(kpi => {
                  const pct = Math.min(Math.round((kpi.value / kpi.target) * 100), 100);
                  const onTrack = kpi.value >= kpi.target * 0.5;
                  return (
                    <div key={kpi.id} className="bg-slate-800/40 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{kpi.name}</span>
                        <span className={`text-xs font-semibold ${onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                        </span>
                      </div>
                      <div className="flex items-end gap-1 mb-2">
                        <span className="text-lg font-bold">
                          {kpi.unit === 'GBP' ? '£' : ''}{kpi.value.toLocaleString()}{kpi.unit === '%' ? '%' : ''}
                        </span>
                        <span className="text-xs text-slate-500 mb-0.5">/ {kpi.target.toLocaleString()}{kpi.unit === '%' ? '%' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-brand-400" /> Team
            </h3>
            <div className="space-y-3">
              {campaign.team.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{member.role} · {member.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Tag size={16} className="text-emerald-400" /> Channels
            </h3>
            <div className="flex flex-wrap gap-2">
              {campaign.channels.map(ch => (
                <span key={ch} className="px-3 py-1.5 bg-slate-800 rounded-xl text-xs text-slate-300">
                  {channelLabels[ch] || ch}
                </span>
              ))}
            </div>
          </div>

          {/* Audiences */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-pink-400" /> Target Audiences
            </h3>
            <div className="space-y-2">
              {campaign.audiences.map((aud, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                  {aud}
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-brand-900/30 to-violet-900/20 border border-brand-700/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-brand-400" />
              <h3 className="text-sm font-semibold">AI Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-3 flex items-start gap-2">
                <TrendingUp size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">Campaign is tracking <span className="text-emerald-400 font-medium">{budgetPct < 60 ? 'under budget' : 'on budget'}</span>. Progress is at {progressPct}% with {daysRemaining} days remaining.</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">{campaign.tasks.filter(t => t.status === 'todo').length} tasks still in backlog. Consider reassigning to meet deadline.</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 flex items-start gap-2">
                <MessageSquare size={12} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">Recommend scheduling a stakeholder review within the next 5 days.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
