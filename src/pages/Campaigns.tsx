import { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { BoardView, CampaignStatus, Campaign, Task, Priority, Channel } from '../types';
import { users } from '../data/mockData';
import {
  LayoutList, Kanban, Table2, GanttChart, Filter, Plus, Search,
  Clock, Users, DollarSign, ArrowRight, GripVertical, ChevronDown,
  X, Calendar, Target, Megaphone, Trash2
} from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'in-review': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  active: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const taskStatusLabels: Record<Task['status'], { label: string; color: string }> = {
  'todo': { label: 'To Do', color: 'bg-slate-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
  'review': { label: 'Review', color: 'bg-amber-500' },
  'done': { label: 'Done', color: 'bg-emerald-500' },
};

const priorityColors: Record<string, string> = {
  low: 'text-slate-400', medium: 'text-blue-400', high: 'text-amber-400', critical: 'text-red-400',
};

const CAMPAIGN_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];

export default function Campaigns() {
  const { campaigns, setView, setSelectedCampaignId, updateTaskStatus, addCampaign, deleteCampaign, addNotification, permissions } = useApp();
  const [boardView, setBoardView] = useState<BoardView>('kanban');
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null);
  const dragTaskRef = useRef<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New campaign form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus, setNewStatus] = useState<CampaignStatus>('draft');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newChannels, setNewChannels] = useState<Channel[]>([]);
  const [newGoals, setNewGoals] = useState('');
  const [newAudiences, setNewAudiences] = useState('');
  const [formStep, setFormStep] = useState(1);

  const campaign = campaigns.find(c => c.id === selectedCampaign);
  const tasks = campaign?.tasks || [];
  const filteredCampaigns = campaigns.filter(c =>
    (filterStatus === 'all' || c.status === filterStatus) &&
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const taskColumns: Task['status'][] = ['todo', 'in-progress', 'review', 'done'];

  const views: { id: BoardView; icon: React.ReactNode; label: string }[] = [
    { id: 'kanban', icon: <Kanban size={16} />, label: 'Kanban' },
    { id: 'list', icon: <LayoutList size={16} />, label: 'List' },
    { id: 'table', icon: <Table2 size={16} />, label: 'Table' },
    { id: 'timeline', icon: <GanttChart size={16} />, label: 'Timeline' },
  ];

  const availableChannels: { id: Channel; label: string }[] = [
    { id: 'social-media', label: 'Social Media' },
    { id: 'email', label: 'Email' },
    { id: 'paid-search', label: 'Paid Search' },
    { id: 'display', label: 'Display' },
    { id: 'content', label: 'Content' },
    { id: 'events', label: 'Events' },
    { id: 'pr', label: 'PR' },
    { id: 'direct-mail', label: 'Direct Mail' },
    { id: 'video', label: 'Video' },
    { id: 'partnerships', label: 'Partnerships' },
  ];

  const handleCreateCampaign = () => {
    if (!newTitle.trim()) return;
    const campaignId = `c${Date.now()}`;
    const parsedBudget = newBudget.trim() === '' ? 50000 : Number(newBudget);
    const safeBudget = Number.isFinite(parsedBudget) && parsedBudget >= 0 ? parsedBudget : 50000;
    const newCampaign: Campaign = {
      id: campaignId,
      title: newTitle,
      description: newDesc || 'New campaign',
      status: newStatus,
      priority: newPriority,
      startDate: newStartDate || new Date().toISOString().split('T')[0],
      endDate: newEndDate || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      budget: safeBudget,
      spent: 0,
      owner: users[0],
      team: [users[0]],
      channels: newChannels.length > 0 ? newChannels : ['social-media', 'email'],
      goals: newGoals ? newGoals.split('\n').filter(g => g.trim()) : ['Define campaign goals'],
      audiences: newAudiences ? newAudiences.split('\n').filter(a => a.trim()) : ['Define target audiences'],
      tasks: [
        { id: `t${Date.now()}-1`, title: 'Draft campaign brief', description: 'Create initial campaign brief', status: 'todo', assignee: users[0], dueDate: newStartDate || new Date().toISOString().split('T')[0], priority: 'high', campaignId: campaignId, tags: ['brief'] },
        { id: `t${Date.now()}-2`, title: 'Audience research', description: 'Research target audiences', status: 'todo', dueDate: newStartDate || new Date().toISOString().split('T')[0], priority: 'medium', campaignId: campaignId, tags: ['research'] },
        { id: `t${Date.now()}-3`, title: 'Channel strategy', description: 'Define channel plan', status: 'todo', dueDate: newStartDate || new Date().toISOString().split('T')[0], priority: 'medium', campaignId: campaignId, tags: ['channels'] },
      ],
      kpis: [],
      workspace: 'ws1',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      color: CAMPAIGN_COLORS[Math.floor(Math.random() * CAMPAIGN_COLORS.length)],
    };
    addCampaign(newCampaign);
    addNotification({
      title: 'New campaign added',
      message: `${newCampaign.title} has been created successfully.`,
      type: 'campaign',
      link: 'campaign-detail',
      campaignId: newCampaign.id,
      icon: '🚀',
    });
    setShowNewCampaign(false);
    setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewStatus('draft');
    setNewStartDate(''); setNewEndDate(''); setNewBudget('');
    setNewChannels([]); setNewGoals(''); setNewAudiences(''); setFormStep(1);
    setSelectedCampaign(newCampaign.id);
  };

  const toggleChannel = (ch: Channel) => {
    setNewChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const openCampaignDetail = (id: string) => {
    setSelectedCampaignId(id);
    setView('campaign-detail');
  };

  const handleDeleteCampaign = (id: string) => {
    deleteCampaign(id);
    setDeleteConfirmId(null);
    // If the deleted campaign was selected, switch to first remaining
    if (selectedCampaign === id) {
      const remaining = campaigns.filter(c => c.id !== id);
      if (remaining.length > 0) setSelectedCampaign(remaining[0].id);
    }
  };

  const DeleteButton = ({ campaignId, size = 'sm' }: { campaignId: string; size?: 'sm' | 'md' }) => {
    if (!permissions.canDeleteCampaign) return null;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(campaignId); }}
        className={`${size === 'sm' ? 'p-1.5' : 'p-2'} rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors`}
        title="Delete campaign"
      >
        <Trash2 size={size === 'sm' ? 14 : 16} />
      </button>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your campaigns with flexible board views</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-xl p-1">
            {views.map(v => (
              <button key={v.id} onClick={() => setBoardView(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${boardView === v.id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >{v.icon} <span className="hidden md:inline">{v.label}</span></button>
            ))}
          </div>
          <button onClick={() => setShowNewCampaign(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as CampaignStatus | 'all')}
            className="bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none pr-8">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="planning">Planning</option>
            <option value="in-review">In Review</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {(boardView === 'kanban' || boardView === 'timeline') && (
          <div className="flex items-center gap-2">
            <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
              className="bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Kanban View */}
      {boardView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {taskColumns.map(status => (
            <div key={status}
              className={`bg-slate-900/50 border rounded-2xl transition-colors ${dragOverColumn === status ? 'border-brand-500/50 bg-brand-500/5' : 'border-slate-800'}`}
              onDragOver={e => { e.preventDefault(); setDragOverColumn(status); }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={e => {
                e.preventDefault();
                setDragOverColumn(null);
                const tid = dragTaskRef.current || e.dataTransfer.getData('taskId');
                if (tid && campaign) {
                  updateTaskStatus(campaign.id, tid, status);
                }
              }}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${taskStatusLabels[status].color}`} />
                  <span className="text-sm font-semibold">{taskStatusLabels[status].label}</span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2 min-h-[200px]">
                {tasks.filter(t => t.status === status).map(task => (
                  <div key={task.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('taskId', task.id);
                      e.dataTransfer.effectAllowed = 'move';
                      dragTaskRef.current = task.id;
                    }}
                    onDragEnd={() => { dragTaskRef.current = null; }}
                    onClick={() => openCampaignDetail(campaign!.id)}
                    className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-3 cursor-pointer hover:border-brand-500/40 hover:bg-slate-800 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <GripVertical size={14} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
                      <span className={`text-[10px] font-semibold uppercase ${priorityColors[task.priority]}`}>{task.priority}</span>
                    </div>
                    <h4 className="text-sm font-medium mb-2 group-hover:text-brand-300 transition-colors">{task.title}</h4>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                    <div className="flex items-center justify-between">
                      {task.assignee && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[9px] font-bold" title={task.assignee.name}>
                          {task.assignee.avatar}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={10} />
                        {task.dueDate}
                      </div>
                    </div>
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded-md">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {tasks.filter(t => t.status === status).length === 0 && (
                  <div className="flex items-center justify-center h-32 text-xs text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {boardView === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
          {filteredCampaigns.map(c => (
            <div key={c.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center gap-4 group">
              <div className="w-1.5 h-10 rounded-full cursor-pointer" style={{ backgroundColor: c.color }} onClick={() => openCampaignDetail(c.id)} />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openCampaignDetail(c.id)}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{c.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${statusColors[c.status]}`}>
                    {c.status.replace('-', ' ')}
                  </span>
                  <span className={`text-[10px] font-semibold ${priorityColors[c.priority]}`}>{c.priority}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{c.description}</p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users size={12} />{c.team.length}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{c.endDate}</span>
                <span className="flex items-center gap-1"><DollarSign size={12} />£{(c.budget/1000).toFixed(0)}k</span>
              </div>
              <div className="w-24 hidden md:block">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.spent/c.budget)*100}%`, backgroundColor: c.color }} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteButton campaignId={c.id} />
                </div>
                <ArrowRight size={16} className="text-slate-600 flex-shrink-0 cursor-pointer" onClick={() => openCampaignDetail(c.id)} />
              </div>
            </div>
          ))}
          {filteredCampaigns.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Megaphone size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="font-medium">No campaigns found</p>
              <p className="text-xs mt-1">Try adjusting your filters or create a new campaign</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {boardView === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-semibold"><button className="flex items-center gap-1">Campaign <ChevronDown size={12} /></button></th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Priority</th>
                <th className="text-left p-4 font-semibold">Owner</th>
                <th className="text-left p-4 font-semibold">Budget</th>
                <th className="text-left p-4 font-semibold">Dates</th>
                <th className="text-left p-4 font-semibold">Progress</th>
                <th className="text-center p-4 font-semibold w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCampaigns.map(c => {
                const done = c.tasks.filter(t => t.status === 'done').length;
                const total = c.tasks.length;
                return (
                  <tr key={c.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4 cursor-pointer" onClick={() => openCampaignDetail(c.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-6 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-medium">{c.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold capitalize ${statusColors[c.status]}`}>
                        {c.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-4"><span className={`text-xs font-semibold capitalize ${priorityColors[c.priority]}`}>{c.priority}</span></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-[9px] font-bold">{c.owner.avatar}</div>
                        <span className="text-xs">{c.owner.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs">£{(c.budget/1000).toFixed(0)}k</td>
                    <td className="p-4 text-xs text-slate-400">{c.startDate} → {c.endDate}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500">{total > 0 ? Math.round((done/total)*100) : 0}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex">
                        <DeleteButton campaignId={c.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline View */}
      {boardView === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="space-y-4">
            {tasks.map((task, i) => (
              <div key={task.id} className="flex items-center gap-4 animate-slide-in cursor-pointer hover:bg-slate-800/30 rounded-xl p-2 -m-2 transition-colors"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => campaign && openCampaignDetail(campaign.id)}>
                <div className="w-48 flex-shrink-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-[10px] text-slate-500">{task.dueDate}</p>
                </div>
                <div className="flex-1 h-8 bg-slate-800 rounded-lg relative overflow-hidden">
                  <div className={`h-full rounded-lg flex items-center px-3 text-[10px] font-medium text-white ${taskStatusLabels[task.status].color}`}
                    style={{ width: task.status === 'done' ? '100%' : task.status === 'review' ? '75%' : task.status === 'in-progress' ? '50%' : '15%' }}>
                    {task.status === 'done' ? '✓ Complete' : taskStatusLabels[task.status].label}
                  </div>
                </div>
                {task.assignee && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                    {task.assignee.avatar}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Campaign Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Campaign?</h3>
            <p className="text-sm text-slate-400 mb-1">
              "{campaigns.find(c => c.id === deleteConfirmId)?.title}"
            </p>
            <p className="text-xs text-red-400/70 mb-6">This will permanently delete the campaign, all its tasks, and governance data. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDeleteCampaign(deleteConfirmId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors">
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 md:pt-20">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewCampaign(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold">Create New Campaign</h2>
                <p className="text-xs text-slate-400 mt-1">Step {formStep} of 3</p>
              </div>
              <button onClick={() => setShowNewCampaign(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="px-6 pt-4">
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-800">
                    <div className={`h-full rounded-full transition-all duration-300 ${formStep >= step ? 'bg-brand-500 w-full' : 'w-0'}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 pt-0">
              {formStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center"><Megaphone size={20} className="text-brand-400" /></div>
                    <div><h3 className="font-semibold">Campaign Details</h3><p className="text-xs text-slate-400">Name, description, and priorities</p></div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Campaign Title *</label>
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Staff Recruitment Drive Q2 2025"
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Description</label>
                    <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." rows={3}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Priority</label>
                      <select value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)} className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Initial Status</label>
                      <select value={newStatus} onChange={e => setNewStatus(e.target.value as CampaignStatus)} className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                        <option value="draft">Draft</option><option value="planning">Planning</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 mb-1.5 block font-medium">Start Date</label><input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" /></div>
                    <div><label className="text-xs text-slate-400 mb-1.5 block font-medium">End Date</label><input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" /></div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Target size={20} className="text-emerald-400" /></div>
                    <div><h3 className="font-semibold">Strategy & Targeting</h3><p className="text-xs text-slate-400">Goals, audiences, and budget</p></div>
                  </div>
                  <div><label className="text-xs text-slate-400 mb-1.5 block font-medium">Campaign Goals (one per line)</label><textarea value={newGoals} onChange={e => setNewGoals(e.target.value)} placeholder={"Recruit 200 primary care coaches\nAchieve 50,000 applications"} rows={3} className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none" /></div>
                  <div><label className="text-xs text-slate-400 mb-1.5 block font-medium">Target Audiences (one per line)</label><textarea value={newAudiences} onChange={e => setNewAudiences(e.target.value)} placeholder={"Healthcare professionals\nCareer changers"} rows={3} className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none" /></div>
                  <div><label className="text-xs text-slate-400 mb-1.5 block font-medium">Budget (£)</label><input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="150000" className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" /></div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><Calendar size={20} className="text-amber-400" /></div>
                    <div><h3 className="font-semibold">Channels & Launch</h3><p className="text-xs text-slate-400">Select channels and review</p></div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block font-medium">Campaign Channels</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableChannels.map(ch => (
                        <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                          className={`p-3 rounded-xl text-sm font-medium text-left transition-all border ${newChannels.includes(ch.id) ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}>
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Campaign Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Title</span><span className="font-medium">{newTitle || 'Untitled'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Priority</span><span className={`font-semibold capitalize ${priorityColors[newPriority]}`}>{newPriority}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Budget</span><span className="font-medium">£{parseInt(newBudget || '0').toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Channels</span><span className="font-medium">{newChannels.length} selected</span></div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-800">
                {formStep > 1 ? (
                  <button onClick={() => setFormStep(s => s - 1)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">Back</button>
                ) : (
                  <button onClick={() => setShowNewCampaign(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                )}
                {formStep < 3 ? (
                  <button onClick={() => setFormStep(s => s + 1)} disabled={formStep === 1 && !newTitle.trim()} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">Continue</button>
                ) : (
                  <button onClick={handleCreateCampaign} disabled={!newTitle.trim()} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                    <Plus size={16} /> Create Campaign
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
