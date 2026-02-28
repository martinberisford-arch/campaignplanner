import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { campaigns as allCampaigns } from '../data/mockData';
import { Task, Priority, RiskLevel, CampaignType, ChecklistItem } from '../types';
import { calculateGovernanceScore, generateAISuggestions, generateChecklist, exportGovernanceAuditPDF, AISuggestion } from '../utils/governance';
import {
  ArrowLeft, Clock, Users, DollarSign, Target, CheckCircle2,
  AlertTriangle, Sparkles, TrendingUp, Calendar, Tag, MessageSquare,
  Plus, X, Edit3, Trash2, Save, Shield, FileText, ChevronDown, ChevronRight,
  AlertCircle, Lock, Download
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

const riskColors = {
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Green - Low Risk' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Amber - Medium Risk' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Red - High Risk' },
};

export default function CampaignDetail() {
  const {
    selectedCampaignId, setView, campaigns,
    updateTaskStatus, addTask, editTask, deleteTask,
    updateCampaign, updateChecklistItem, addChecklistItem, removeChecklistItem,
    permissions, currentUser, addNotification
  } = useApp();

  const campaign = campaigns.find(c => c.id === selectedCampaignId) ||
                   allCampaigns.find(c => c.id === selectedCampaignId);

  // Task management state
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' as Priority, dueDate: '', status: 'todo' as Task['status'] });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Governance state
  const [showGovernancePanel, setShowGovernancePanel] = useState(true);
  const [showLaunchBlocker, setShowLaunchBlocker] = useState(false);
  const [showSetupGov, setShowSetupGov] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType>('generic-campaign');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState({ title: '', description: '', category: '', mandatory: false, approvalRequired: false });
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Campaign not found</p>
        <button onClick={() => setView('campaigns')} className="mt-4 text-brand-400 hover:text-brand-300 text-sm">← Back to Campaigns</button>
      </div>
    );
  }

  const completedTasks = campaign.tasks.filter(t => t.status === 'done').length;
  const totalTasks = campaign.tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const budgetPct = Math.round((campaign.spent / campaign.budget) * 100);
  const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000));

  // Governance calculations
  const governance = calculateGovernanceScore(campaign);
  const hasChecklist = campaign.checklist && campaign.checklist.length > 0;
  const checklistCategories = new Map<string, ChecklistItem[]>();
  (campaign.checklist || []).forEach(item => {
    const cat = checklistCategories.get(item.category) || [];
    cat.push(item);
    checklistCategories.set(item.category, cat);
  });

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCategories(next);
  };

  // Task handlers
  const handleAddTask = () => {
    if (!taskForm.title.trim()) return;
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: taskForm.title,
      description: taskForm.description,
      status: taskForm.status,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate || campaign.endDate,
      campaignId: campaign.id,
      tags: [],
      assignee: currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role, avatar: currentUser.avatar, department: currentUser.department } : undefined,
    };
    addTask(campaign.id, newTask);
    setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo' });
    setShowAddTask(false);
    addNotification({ title: 'Task Added', message: `"${newTask.title}" added to ${campaign.title}`, type: 'task', icon: '✅' });
  };

  const handleEditTask = (taskId: string) => {
    if (!taskForm.title.trim()) return;
    editTask(campaign.id, taskId, {
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate,
      status: taskForm.status,
    });
    setEditingTaskId(null);
    setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo' });
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskForm({ title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate, status: task.status });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(campaign.id, taskId);
    setDeleteConfirm(null);
  };

  // Governance handlers
  const handleSetupGovernance = () => {
    const checklist = generateChecklist(selectedCampaignType);
    updateCampaign(campaign.id, { campaignType: selectedCampaignType, checklist });
    setShowSetupGov(false);
    setExpandedCategories(new Set());
    addNotification({ title: 'Governance Enabled', message: `Governance checklist applied to ${campaign.title}`, type: 'governance', icon: '🛡️' });
  };

  const handleToggleChecklistItem = (itemId: string, currentStatus: ChecklistItem['status']) => {
    const newStatus = currentStatus === 'complete' ? 'pending' : 'complete';
    updateChecklistItem(campaign.id, itemId, {
      status: newStatus,
      completedAt: newStatus === 'complete' ? new Date().toLocaleDateString('en-GB') : undefined,
      completedBy: newStatus === 'complete' ? currentUser?.name : undefined,
    });
  };

  const handleSetRiskLevel = (level: RiskLevel) => {
    updateCampaign(campaign.id, { riskLevel: level });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.title.trim()) return;
    const item: ChecklistItem = {
      id: `chk-custom-${Date.now()}`,
      title: newChecklistItem.title,
      description: newChecklistItem.description,
      category: newChecklistItem.category || 'Custom',
      status: 'pending',
      mandatory: newChecklistItem.mandatory,
      approvalRequired: newChecklistItem.approvalRequired,
    };
    addChecklistItem(campaign.id, item);
    setNewChecklistItem({ title: '', description: '', category: '', mandatory: false, approvalRequired: false });
    setShowAddChecklist(false);
  };

  const handleRunAIScan = () => {
    const suggestions = generateAISuggestions(campaign);
    setAiSuggestions(suggestions);
    setShowAiSuggestions(true);
  };

  const handleAttemptLaunch = () => {
    if (!governance.launchReady) {
      setShowLaunchBlocker(true);
    } else {
      updateCampaign(campaign.id, { status: 'active' });
      addNotification({ title: 'Campaign Launched! 🚀', message: `${campaign.title} is now live. Governance Score: ${governance.score}/100`, type: 'campaign', icon: '🚀' });
    }
  };

  const handleExportAudit = () => {
    exportGovernanceAuditPDF(campaign, governance);
  };

  const govScoreColor = governance.score >= 80 ? 'text-emerald-400' : governance.score >= 50 ? 'text-amber-400' : 'text-red-400';
  const govScoreBg = governance.score >= 80 ? 'from-emerald-500' : governance.score >= 50 ? 'from-amber-500' : 'from-red-500';

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Back Button */}
      <button onClick={() => setView('campaigns')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Campaigns
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-3 h-16 rounded-full flex-shrink-0" style={{ backgroundColor: campaign.color }} />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{campaign.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[campaign.status]}`}>
                {campaign.status.replace('-', ' ')}
              </span>
              {/* Governance Badge */}
              {hasChecklist && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  governance.riskFlag === 'green' ? 'bg-emerald-500/20 text-emerald-400' :
                  governance.riskFlag === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  <Shield size={12} />
                  Gov: {governance.score}/100
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">{campaign.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1"><Calendar size={12} /> {campaign.startDate} → {campaign.endDate}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {daysRemaining} days remaining</span>
              <span className="flex items-center gap-1"><Users size={12} /> {campaign.team.length} team members</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasChecklist && (
            <>
              <button onClick={handleExportAudit} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium transition-colors">
                <Download size={14} /> Export Audit
              </button>
              <button onClick={handleRunAIScan} className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-xl text-xs font-medium text-violet-300 transition-colors">
                <Sparkles size={14} /> AI Scan
              </button>
              {campaign.status !== 'active' && campaign.status !== 'completed' && (
                <button onClick={handleAttemptLaunch}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    governance.launchReady
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300'
                  }`}>
                  {governance.launchReady ? '🚀 Launch Campaign' : <><Lock size={14} /> Launch Blocked</>}
                </button>
              )}
            </>
          )}
          {!hasChecklist && permissions.canEditCampaign && (
            <button onClick={() => setShowSetupGov(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold transition-colors">
              <Shield size={14} /> Enable Governance
            </button>
          )}
        </div>
      </div>

      {/* Governance Progress Bar */}
      {hasChecklist && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield size={16} className={govScoreColor} />
              <span className="text-sm font-semibold">Governance Score</span>
              <span className={`text-xl font-bold ${govScoreColor}`}>{governance.score}/100</span>
            </div>
            <div className="flex items-center gap-3">
              {campaign.riskLevel && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${riskColors[campaign.riskLevel].bg} ${riskColors[campaign.riskLevel].text} border ${riskColors[campaign.riskLevel].border}`}>
                  {riskColors[campaign.riskLevel].label}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${governance.launchReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {governance.launchReady ? '✅ Launch Ready' : '🚫 Launch Blocked'}
              </span>
              <button onClick={() => setShowGovernancePanel(!showGovernancePanel)} className="text-slate-500 hover:text-white">
                {showGovernancePanel ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${govScoreBg} to-transparent transition-all duration-500`} style={{ width: `${governance.score}%` }} />
          </div>
          {governance.blockers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {governance.blockers.map((b, i) => (
                <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
                  <AlertCircle size={10} /> {b}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><DollarSign size={16} className="text-emerald-400" /><span className="text-xs text-slate-500">Budget</span></div>
          <p className="text-xl font-bold">£{(campaign.budget / 1000).toFixed(0)}k</p>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>£{(campaign.spent / 1000).toFixed(1)}k spent</span><span>{budgetPct}%</span></div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${budgetPct}%` }} /></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Target size={16} className="text-brand-400" /><span className="text-xs text-slate-500">Task Progress</span></div>
          <p className="text-xl font-bold">{progressPct}%</p>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>{completedTasks}/{totalTasks} tasks</span><span>{progressPct}%</span></div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} /></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-amber-400" /><span className="text-xs text-slate-500">KPIs on Track</span></div>
          <p className="text-xl font-bold">{campaign.kpis.filter(k => k.value >= k.target * 0.5).length}/{campaign.kpis.length}</p>
          <p className="text-[10px] text-slate-500 mt-2">{campaign.kpis.filter(k => k.value >= k.target).length} exceeded target</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Clock size={16} className="text-pink-400" /><span className="text-xs text-slate-500">Timeline</span></div>
          <p className="text-xl font-bold">{daysRemaining}d</p>
          <p className="text-[10px] text-slate-500 mt-2">remaining of campaign</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tasks, Goals, KPIs */}
        <div className={`${hasChecklist && showGovernancePanel ? 'lg:col-span-2' : 'lg:col-span-2'} space-y-6`}>
          {/* Goals */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Target size={16} className="text-brand-400" /> Campaign Goals</h3>
            <div className="space-y-2">
              {campaign.goals.map((goal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                  <CheckCircle2 size={16} className="text-slate-600 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{goal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks with CRUD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
              {(permissions.canCreateCampaign) && (
                <button onClick={() => { setShowAddTask(true); setEditingTaskId(null); setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo' }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold transition-colors">
                  <Plus size={14} /> Add Task
                </button>
              )}
            </div>

            {/* Add/Edit Task Form */}
            {(showAddTask || editingTaskId) && (
              <div className="p-4 bg-slate-800/30 border-b border-slate-800 animate-fade-in">
                <h4 className="text-sm font-semibold mb-3">{editingTaskId ? 'Edit Task' : 'New Task'}</h4>
                <div className="space-y-3">
                  <input type="text" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Task title *" className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                  <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description (optional)" rows={2} className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none" />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Priority</label>
                      <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as Priority }))}
                        className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none">
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Status</label>
                      <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
                        className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none">
                        <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Due Date</label>
                      <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editingTaskId ? handleEditTask(editingTaskId) : handleAddTask()}
                      disabled={!taskForm.title.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-lg text-xs font-semibold transition-colors">
                      <Save size={14} /> {editingTaskId ? 'Save Changes' : 'Add Task'}
                    </button>
                    <button onClick={() => { setShowAddTask(false); setEditingTaskId(null); }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="divide-y divide-slate-800/50">
              {campaign.tasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No tasks yet. Click "Add Task" to get started.</div>
              ) : campaign.tasks.map(task => (
                <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/20 transition-colors group">
                  <select value={task.status} onChange={e => updateTaskStatus(campaign.id, task.id, e.target.value as Task['status'])}
                    className="bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none cursor-pointer">
                    <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                  </select>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${
                        task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                        task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>{task.priority}</span>
                    </div>
                    {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                  </div>
                  {task.assignee && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[9px] font-bold flex-shrink-0" title={task.assignee.name}>
                      {task.assignee.avatar}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-shrink-0"><Clock size={10} /> {task.dueDate}</span>
                  {/* Edit/Delete buttons */}
                  {permissions.canEditCampaign && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(task)} className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors" title="Edit">
                        <Edit3 size={13} />
                      </button>
                      {permissions.canDeleteCampaign && (
                        <button onClick={() => setDeleteConfirm(task.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          {campaign.kpis.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" /> Key Performance Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.kpis.map(kpi => {
                  const pct = Math.min(Math.round((kpi.value / kpi.target) * 100), 100);
                  const onTrack = kpi.value >= kpi.target * 0.5;
                  return (
                    <div key={kpi.id} className="bg-slate-800/40 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{kpi.name}</span>
                        <span className={`text-xs font-semibold ${onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>{kpi.trend > 0 ? '+' : ''}{kpi.trend}%</span>
                      </div>
                      <div className="flex items-end gap-1 mb-2">
                        <span className="text-lg font-bold">{kpi.unit === 'GBP' ? '£' : ''}{kpi.value.toLocaleString()}{kpi.unit === '%' ? '%' : ''}</span>
                        <span className="text-xs text-slate-500 mb-0.5">/ {kpi.target.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team, Channels, Audiences */}
          {(!hasChecklist || !showGovernancePanel) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Users size={16} className="text-brand-400" /> Team</h3>
                <div className="space-y-3">
                  {campaign.team.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{member.avatar}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{member.name}</p><p className="text-[10px] text-slate-500 capitalize">{member.role}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Tag size={16} className="text-emerald-400" /> Channels</h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.channels.map(ch => (<span key={ch} className="px-3 py-1.5 bg-slate-800 rounded-xl text-xs text-slate-300">{channelLabels[ch] || ch}</span>))}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Users size={16} className="text-pink-400" /> Audiences</h3>
                <div className="space-y-2">
                  {campaign.audiences.map((aud, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />{aud}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Governance Panel OR Team/Channel/AI */}
        <div className="space-y-6">
          {/* Governance Checklist Panel */}
          {hasChecklist && showGovernancePanel && (
            <>
              {/* Risk Level Selector */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-400" /> Risk Level</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['green', 'amber', 'red'] as const).map(level => (
                    <button key={level} onClick={() => handleSetRiskLevel(level)}
                      className={`p-3 rounded-xl text-center text-xs font-semibold border transition-all ${
                        campaign.riskLevel === level
                          ? `${riskColors[level].bg} ${riskColors[level].text} ${riskColors[level].border} ring-2 ring-offset-1 ring-offset-slate-900 ${level === 'green' ? 'ring-emerald-500/50' : level === 'amber' ? 'ring-amber-500/50' : 'ring-red-500/50'}`
                          : 'border-slate-700 text-slate-500 hover:bg-slate-800'
                      }`}>
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1.5 ${level === 'green' ? 'bg-emerald-500' : level === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2"><FileText size={14} className="text-brand-400" /> Governance Checklist</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {campaign.checklist?.filter(i => i.status === 'complete').length}/{campaign.checklist?.length} items complete
                    </p>
                  </div>
                  {permissions.canEditCampaign && (
                    <button onClick={() => setShowAddChecklist(!showAddChecklist)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                      <Plus size={16} />
                    </button>
                  )}
                </div>

                {/* Add custom checklist item */}
                {showAddChecklist && (
                  <div className="p-3 bg-slate-800/30 border-b border-slate-800 space-y-2 animate-fade-in">
                    <input type="text" value={newChecklistItem.title} onChange={e => setNewChecklistItem(f => ({ ...f, title: e.target.value }))}
                      placeholder="Checklist item title *" className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none" />
                    <input type="text" value={newChecklistItem.description} onChange={e => setNewChecklistItem(f => ({ ...f, description: e.target.value }))}
                      placeholder="Description" className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none" />
                    <input type="text" value={newChecklistItem.category} onChange={e => setNewChecklistItem(f => ({ ...f, category: e.target.value }))}
                      placeholder="Category (e.g. Compliance)" className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none" />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={newChecklistItem.mandatory} onChange={e => setNewChecklistItem(f => ({ ...f, mandatory: e.target.checked }))} className="rounded" /> Mandatory
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={newChecklistItem.approvalRequired} onChange={e => setNewChecklistItem(f => ({ ...f, approvalRequired: e.target.checked }))} className="rounded" /> Approval Required
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddChecklistItem} disabled={!newChecklistItem.title.trim()} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-lg text-xs font-semibold transition-colors">Add</button>
                      <button onClick={() => setShowAddChecklist(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Checklist items grouped by category */}
                <div className="max-h-[500px] overflow-y-auto">
                  {Array.from(checklistCategories.entries()).map(([category, items]) => {
                    const completed = items.filter(i => i.status === 'complete').length;
                    const isExpanded = expandedCategories.has(category);
                    const catPct = Math.round((completed / items.length) * 100);
                    return (
                      <div key={category}>
                        <button onClick={() => toggleCategory(category)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-800/30 border-b border-slate-800 hover:bg-slate-800/50 transition-colors text-left">
                          {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                          <span className="text-xs font-semibold flex-1">{category}</span>
                          <span className="text-[10px] text-slate-500">{completed}/{items.length}</span>
                          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${catPct === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${catPct}%` }} />
                          </div>
                        </button>
                        {isExpanded && items.map(item => (
                          <div key={item.id} className="flex items-start gap-2 px-4 py-2 border-b border-slate-800/30 hover:bg-slate-800/10 transition-colors group">
                            <button onClick={() => handleToggleChecklistItem(item.id, item.status)}
                              disabled={!permissions.canEditCampaign && !permissions.canCreateCampaign}
                              className={`w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                                item.status === 'complete' ? 'bg-emerald-500 border-emerald-500 text-white' :
                                item.status === 'blocked' ? 'bg-red-500/20 border-red-500/50' :
                                'border-slate-600 hover:border-brand-500'
                              }`}>
                              {item.status === 'complete' && <CheckCircle2 size={12} />}
                              {item.status === 'blocked' && <X size={12} className="text-red-400" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs ${item.status === 'complete' ? 'line-through text-slate-500' : 'text-slate-300'}`}>{item.title}</span>
                                {item.mandatory && <span className="text-[8px] px-1 py-0.5 bg-red-500/20 text-red-400 rounded font-bold">MANDATORY</span>}
                                {item.approvalRequired && <span className="text-[8px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded font-bold">APPROVAL</span>}
                                {item.aiSuggested && <span className="text-[8px] px-1 py-0.5 bg-violet-500/20 text-violet-400 rounded font-bold">AI</span>}
                              </div>
                              {item.completedAt && (
                                <p className="text-[9px] text-slate-600 mt-0.5">Completed {item.completedAt}{item.completedBy ? ` by ${item.completedBy}` : ''}</p>
                              )}
                            </div>
                            {permissions.canDeleteCampaign && !item.mandatory && (
                              <button onClick={() => removeChecklistItem(campaign.id, item.id)}
                                className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Remove">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team & Channels compact */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users size={14} className="text-brand-400" /> Team</h3>
                <div className="flex flex-wrap gap-1.5">
                  {campaign.team.map(m => (
                    <div key={m.id} className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[9px] font-bold" title={m.name}>{m.avatar}</div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AI Insights - always shown */}
          <div className="bg-gradient-to-br from-brand-900/30 to-violet-900/20 border border-brand-700/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-brand-400" />
              <h3 className="text-sm font-semibold">AI Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-3 flex items-start gap-2">
                <TrendingUp size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">Campaign is tracking <span className="text-emerald-400 font-medium">{budgetPct < 60 ? 'under budget' : 'on budget'}</span>. Progress at {progressPct}% with {daysRemaining} days remaining.</p>
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

      {/* ===== MODALS ===== */}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-400" /></div>
            <h3 className="text-lg font-bold mb-2">Delete Task?</h3>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDeleteTask(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Governance Modal */}
      {showSetupGov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSetupGov(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6">
              <h2 className="text-lg font-bold flex items-center gap-2"><Shield size={20} className="text-brand-400" /> Enable Campaign Governance</h2>
              <p className="text-xs text-slate-400 mt-1">Select your campaign type to auto-generate a structured governance checklist</p>
            </div>
            <div className="p-6 space-y-4">
              {([
                { type: 'social-media-campaign' as CampaignType, label: 'Social Media Campaign', desc: '22 items covering strategy, content, compliance, technical setup, measurement & risk', icon: '📱' },
                { type: 'website-update' as CampaignType, label: 'Website Update', desc: '18 items covering planning, content, accessibility, technical deployment & go-live', icon: '🌐' },
                { type: 'generic-campaign' as CampaignType, label: 'Generic Campaign', desc: '18 items covering strategy, execution, quality, measurement & risk assessment', icon: '📋' },
              ]).map(opt => (
                <button key={opt.type} onClick={() => setSelectedCampaignType(opt.type)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                    selectedCampaignType === opt.type
                      ? 'bg-brand-600/10 border-brand-500/30 ring-2 ring-brand-500/20'
                      : 'border-slate-700 hover:bg-slate-800'
                  }`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSetupGov(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSetupGovernance} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <Shield size={16} /> Apply Governance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch Blocker Modal */}
      {showLaunchBlocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLaunchBlocker(false)} />
          <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6 bg-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center"><Lock size={24} className="text-red-400" /></div>
                <div>
                  <h2 className="text-lg font-bold text-red-400">Campaign Launch Blocked</h2>
                  <p className="text-xs text-slate-400 mt-0.5">The following requirements must be met before this campaign can go live</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {governance.blockers.map((blocker, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{blocker}</span>
                </div>
              ))}
              <div className="bg-slate-800/40 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-brand-400" />
                  <span className="text-xs font-semibold">Current Governance Score</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${govScoreColor}`}>{governance.score}/100</span>
                  <span className="text-xs text-slate-500">Required: 100% mandatory items + all conditions met</span>
                </div>
              </div>
              <button onClick={() => setShowLaunchBlocker(false)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors mt-4">
                Close & Resolve Issues
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Modal */}
      {showAiSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAiSuggestions(false)} />
          <div className="relative bg-slate-900 border border-violet-500/30 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in max-h-[80vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-800 p-6 bg-violet-500/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><Sparkles size={20} className="text-violet-400" /></div>
                <div>
                  <h2 className="text-lg font-bold">AI Governance Scan Results</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{aiSuggestions.length} suggestion{aiSuggestions.length !== 1 ? 's' : ''} for improving campaign quality</p>
                </div>
              </div>
              <button onClick={() => setShowAiSuggestions(false)} className="p-2 hover:bg-slate-800 rounded-xl"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {aiSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-emerald-400">All Clear!</h3>
                  <p className="text-sm text-slate-400 mt-1">No issues detected. Your campaign meets quality standards.</p>
                </div>
              ) : aiSuggestions.map((suggestion, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  suggestion.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                  suggestion.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-blue-500/5 border-blue-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      suggestion.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      suggestion.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{suggestion.severity}</span>
                    <span className="text-sm font-semibold">{suggestion.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{suggestion.description}</p>
                  {suggestion.suggestedAction && (
                    <div className="flex items-start gap-2 p-2 bg-slate-800/40 rounded-lg">
                      <Sparkles size={12} className="text-violet-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-violet-300">{suggestion.suggestedAction}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
