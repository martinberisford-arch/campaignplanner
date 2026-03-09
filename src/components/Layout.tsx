import { useApp } from '../store/AppContext';
import { ViewType, AppNotification, Workspace } from '../types';
import CommandPalette from './CommandPalette';
import {
  LayoutDashboard, Calendar, FolderKanban, Sparkles, CheckCircle2,
  BarChart3, ImageIcon, Settings, ChevronLeft, ChevronRight,
  Bell, Search, Menu, LogOut, Shield, Zap, Lock, X, Check, Clock,
  Cloud, CloudOff, RefreshCw, Wifi, WifiOff, Plus, Pencil, Trash2, ChevronDown,
  Sun, Moon, Target, Lightbulb, TrendingUp, Command, ArrowLeft, Database, Users
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const WORKSPACE_ICONS = ['🏥','🌍','👥','🎯','📊','🏛️','🎓','💼','🚀','🔬','📱','🏢','⚡','🌐','📋'];
const WORKSPACE_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444','#84cc16','#f97316'];

const viewLabels: Record<string, string> = {
  hub: 'Home',
  dashboard: 'Dashboard',
  calendar: 'Calendar',
  campaigns: 'Campaigns',
  'ai-brief': 'AI Brief Generator',
  approvals: 'Approvals',
  kpi: 'KPI Dashboard',
  assets: 'Assets',
  settings: 'Settings',
  'campaign-detail': 'Campaign Detail',
  'mkt-strategy': 'Strategy',
  'mkt-calendar': 'Marketing Calendar',
  'mkt-ideas': 'Growth Ideas',
  'mkt-performance': 'Performance Review',
  'mkt-intelligence': 'Marketing Intelligence',
  'mkt-ideation': 'Content Ideation',
  'mkt-brief': 'Brief Builder',
  'mkt-messaging': 'Messaging',
  'content-log': 'Content Log',
  'admin-kpis': 'Manage KPIs',
  'admin-audiences': 'Manage Audiences',
  'backups': 'Backup & Restore',
};

const viewCategories: Record<string, string> = {
  'mkt-strategy': 'Marketing Tools',
  'mkt-calendar': 'Marketing Tools',
  'mkt-ideas': 'Marketing Tools',
  'mkt-performance': 'Marketing Tools',
  'mkt-intelligence': 'Marketing Tools',
  'mkt-ideation': 'Marketing Tools',
  'mkt-brief': 'Marketing Tools',
  'mkt-messaging': 'Marketing Tools',
  'content-log': 'Marketing Tools',
  'admin-kpis': 'Admin',
  'admin-audiences': 'Admin',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const {
    currentView, setView, sidebarOpen, setSidebarOpen,
    workspaceSettings, currentUser, permissions, logout,
    notifications, unreadNotificationCount,
    markNotificationRead, markAllNotificationsRead, dismissNotification,
    setSelectedCampaignId,
    syncStatus, lastSyncedAt, forcePush, forceRefresh,
    workspacesList, activeWorkspaceId, setActiveWorkspaceId,
    addWorkspace, editWorkspace, deleteWorkspace, campaigns, assets,
    theme, toggleTheme,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [wsModal, setWsModal] = useState<'create' | 'edit' | null>(null);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [deleteConfirmWs, setDeleteConfirmWs] = useState<string | null>(null);
  const [wsForm, setWsForm] = useState({ name: '', description: '', icon: '🎯', color: '#6366f1' });
  const [wsSuccess, setWsSuccess] = useState('');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setShowWorkspacePicker(false);
    }
    if (showNotifications || showWorkspacePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications, showWorkspacePicker]);

  const activeWs = workspacesList.find(w => w.id === activeWorkspaceId);
  const wsLabel = activeWs?.name || workspaceSettings.name;
  const wsIcon = activeWs?.icon || '🏥';

  const getWsCampaignCount = (wsId: string) => campaigns.filter(c => c.workspace === wsId).length;
  const getWsAssetCount = (wsId: string) => assets.filter(a => a.workspace === wsId).length;

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: number; permitted: boolean }[] = [
    { id: 'hub', label: 'Home', icon: <LayoutDashboard size={19} />, permitted: permissions.canViewDashboard },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={19} />, permitted: permissions.canViewDashboard },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={19} />, permitted: permissions.canViewCalendar },
    { id: 'campaigns', label: 'Campaigns', icon: <FolderKanban size={19} />, permitted: permissions.canViewCampaigns },
    { id: 'ai-brief', label: 'AI Brief Generator', icon: <Sparkles size={19} />, permitted: permissions.canUseAIBrief },
    { id: 'approvals', label: 'Approvals', icon: <CheckCircle2 size={19} />, badge: notifications.filter(n => !n.read && n.type === 'approval').length || undefined, permitted: permissions.canViewApprovals },
    { id: 'kpi', label: 'KPI Dashboard', icon: <BarChart3 size={19} />, permitted: permissions.canViewKPI },
    { id: 'assets', label: 'Assets', icon: <ImageIcon size={19} />, permitted: permissions.canViewAssets },
    { id: 'settings', label: 'Settings', icon: <Settings size={19} />, permitted: permissions.canViewSettings },
  ];

  const marketingNavItems: { id: ViewType; label: string; icon: React.ReactNode; permitted: boolean }[] = [
    { id: 'mkt-strategy', label: 'Strategy', icon: <Target size={19} />, permitted: permissions.canViewDashboard },
    { id: 'mkt-calendar', label: 'Calendar & Campaigns', icon: <Calendar size={19} />, permitted: permissions.canViewCalendar },
    { id: 'mkt-ideas', label: 'Growth Ideas (139)', icon: <Lightbulb size={19} />, permitted: permissions.canViewDashboard },
    { id: 'mkt-performance', label: 'Performance Review', icon: <TrendingUp size={19} />, permitted: permissions.canViewKPI },
    { id: 'mkt-intelligence', label: 'Intelligence', icon: <BarChart3 size={19} />, permitted: permissions.canViewKPI },
    { id: 'mkt-ideation', label: 'Ideation Engine', icon: <Lightbulb size={19} />, permitted: permissions.canViewDashboard },
    { id: 'mkt-brief', label: 'Brief Builder', icon: <FolderKanban size={19} />, permitted: permissions.canViewDashboard },
    { id: 'mkt-messaging', label: 'Messaging', icon: <CheckCircle2 size={19} />, permitted: permissions.canViewDashboard },
    { id: 'content-log', label: 'Content Log', icon: <Database size={19} />, permitted: permissions.canViewDashboard },
  ];

  const handleLogout = () => { setShowLogoutConfirm(false); logout(); };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.campaignId) setSelectedCampaignId(notif.campaignId);

    const fallbackByType: Partial<Record<AppNotification['type'], ViewType>> = {
      campaign: notif.campaignId ? 'campaign-detail' : 'campaigns',
      approval: 'approvals',
      task: notif.campaignId ? 'campaign-detail' : 'campaigns',
      governance: notif.campaignId ? 'campaign-detail' : 'campaigns',
      ai: 'kpi',
      system: 'dashboard',
    };

    setView(notif.link || fallbackByType[notif.type] || 'dashboard');
    setShowNotifications(false);
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const notifTypeColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'approval': return 'bg-amber-500/20 text-amber-400';
      case 'task': return 'bg-blue-500/20 text-blue-400';
      case 'campaign': return 'bg-brand-500/20 text-brand-400';
      case 'ai': return 'bg-violet-500/20 text-violet-400';
      case 'governance': return 'bg-red-500/20 text-red-400';
      case 'system': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const roleGradient = currentUser?.role === 'admin' ? 'from-brand-400 to-violet-500' :
    currentUser?.role === 'editor' ? 'from-emerald-400 to-teal-600' :
    currentUser?.role === 'contributor' ? 'from-amber-400 to-orange-500' : 'from-slate-400 to-slate-600';

  const roleColor = currentUser?.role === 'admin' ? 'text-brand-400' :
    currentUser?.role === 'editor' ? 'text-emerald-400' :
    currentUser?.role === 'contributor' ? 'text-amber-400' : 'text-slate-400';

  // Workspace modal handlers
  const openCreateWs = () => {
    setWsForm({ name: '', description: '', icon: '🎯', color: '#6366f1' });
    setWsModal('create');
    setShowWorkspacePicker(false);
  };
  const openEditWs = (ws: Workspace) => {
    setEditingWs(ws);
    setWsForm({ name: ws.name, description: ws.description, icon: ws.icon, color: ws.color });
    setWsModal('edit');
    setShowWorkspacePicker(false);
  };
  const handleSaveWs = () => {
    if (!wsForm.name.trim()) return;
    if (wsModal === 'create') {
      const newWs: Workspace = {
        id: `ws-${Date.now()}`, name: wsForm.name.trim(), description: wsForm.description.trim(),
        icon: wsForm.icon, color: wsForm.color, campaigns: 0, members: 1,
        createdAt: new Date().toISOString().split('T')[0], createdBy: currentUser?.id || 'u1',
      };
      addWorkspace(newWs);
      setActiveWorkspaceId(newWs.id);
      setWsSuccess(`Workspace "${newWs.name}" created!`);
    } else if (wsModal === 'edit' && editingWs) {
      editWorkspace(editingWs.id, { name: wsForm.name.trim(), description: wsForm.description.trim(), icon: wsForm.icon, color: wsForm.color });
      setWsSuccess(`Workspace "${wsForm.name.trim()}" updated!`);
    }
    setWsModal(null); setEditingWs(null);
    setTimeout(() => setWsSuccess(''), 3000);
  };
  const handleDeleteWs = (id: string) => {
    const ws = workspacesList.find(w => w.id === id);
    deleteWorkspace(id); setDeleteConfirmWs(null);
    setWsSuccess(`Workspace "${ws?.name}" deleted.`);
    setTimeout(() => setWsSuccess(''), 3000);
  };

  // Breadcrumb
  const breadcrumbCategory = viewCategories[currentView];
  const breadcrumbLabel = viewLabels[currentView] || currentView;

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-white'}`}>
      {/* Command Palette */}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[68px]'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-50 h-full ${theme === 'light' ? 'bg-white border-r border-gray-200' : 'bg-slate-900 border-r border-slate-800'} flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className={`flex items-center ${sidebarOpen ? 'px-5' : 'px-3 justify-center'} h-16 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-500/20 text-white">C</div>
            {sidebarOpen && (
              <div className="animate-fade-in-fast">
                <h1 className="font-bold text-base leading-tight">Comms Dashboard</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Enterprise</p>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Picker */}
        {sidebarOpen && (
          <div className={`px-3 py-2.5 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-800'} relative`} ref={wsRef}>
            <button onClick={() => setShowWorkspacePicker(!showWorkspacePicker)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition-colors ${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-800/50 hover:bg-slate-800'}`}>
              <span className="text-lg">{wsIcon}</span>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold truncate">{wsLabel}</p>
                <p className="text-[10px] text-slate-500">{activeWorkspaceId ? `${getWsCampaignCount(activeWorkspaceId)} campaigns` : 'All workspaces'}</p>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${showWorkspacePicker ? 'rotate-180' : ''}`} />
            </button>

            {showWorkspacePicker && (
              <div className={`absolute left-3 right-3 top-full mt-1 rounded-xl shadow-2xl z-[100] overflow-hidden animate-scale-in ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800 border border-slate-700'}`}>
                <button onClick={() => { setActiveWorkspaceId(null); setShowWorkspacePicker(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors ${!activeWorkspaceId ? 'bg-brand-600/10 border-l-2 border-brand-500' : 'border-l-2 border-transparent'}`}>
                  <span className="text-base">🌐</span>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold">All Workspaces</p>
                    <p className="text-[10px] text-slate-500">{campaigns.length} campaigns · {assets.length} assets</p>
                  </div>
                  {!activeWorkspaceId && <Check size={14} className="text-brand-400" />}
                </button>
                <div className={`border-t ${theme === 'light' ? 'border-gray-100' : 'border-slate-700/50'}`} />
                {workspacesList.map(ws => (
                  <div key={ws.id} className={`flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors group ${activeWorkspaceId === ws.id ? 'bg-brand-600/10 border-l-2 border-brand-500' : 'border-l-2 border-transparent'}`}>
                    <button className="flex items-center gap-3 flex-1 min-w-0" onClick={() => { setActiveWorkspaceId(ws.id); setShowWorkspacePicker(false); }}>
                      <span className="text-base">{ws.icon}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-semibold truncate">{ws.name}</p>
                        <p className="text-[10px] text-slate-500">{getWsCampaignCount(ws.id)} campaigns · {getWsAssetCount(ws.id)} assets</p>
                      </div>
                      {activeWorkspaceId === ws.id && <Check size={14} className="text-brand-400" />}
                    </button>
                    {permissions.canEditCampaign && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEditWs(ws); }} className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white"><Pencil size={11} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmWs(ws.id); setShowWorkspacePicker(false); }} className="p-1 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400"><Trash2 size={11} /></button>
                      </div>
                    )}
                  </div>
                ))}
                {permissions.canCreateCampaign && (
                  <>
                    <div className={`border-t ${theme === 'light' ? 'border-gray-100' : 'border-slate-700/50'}`} />
                    <button onClick={openCreateWs} className="w-full flex items-center gap-2 px-3 py-2.5 text-brand-400 hover:bg-brand-600/10 transition-colors">
                      <Plus size={14} /><span className="text-xs font-semibold">Create Workspace</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {sidebarOpen && <p className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${theme === 'light' ? 'text-gray-400' : 'text-slate-600'}`}>Main Menu</p>}
          {navItems.map(item => (
            <button key={item.id} onClick={() => { if (item.permitted) { setView(item.id); setMobileMenuOpen(false); } }}
              className={`w-full flex items-center gap-3 ${sidebarOpen ? 'px-3' : 'justify-center px-2'} py-2 rounded-xl text-sm font-medium transition-all duration-150 btn-press ${
                !item.permitted ? 'text-slate-700 cursor-not-allowed' :
                currentView === item.id
                  ? theme === 'light' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'bg-brand-600/15 text-brand-400 shadow-sm'
                  : theme === 'light' ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!item.permitted ? `Your role (${currentUser?.role}) does not have access` : item.label}>
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              {sidebarOpen && !item.permitted && <Lock size={12} className="text-slate-700" />}
              {sidebarOpen && item.badge && item.badge > 0 && item.permitted && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-danger-500 text-white rounded-full min-w-[20px] text-center">{item.badge}</span>
              )}
            </button>
          ))}

          {/* Marketing Tools Section */}
          <div className="pt-2">
            {sidebarOpen && <p className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${theme === 'light' ? 'text-gray-400' : 'text-slate-600'}`}>Marketing Tools</p>}
            {!sidebarOpen && <div className={`border-t my-2 ${theme === 'light' ? 'border-gray-200' : 'border-slate-800'}`} />}
            {marketingNavItems.map(item => (
              <button key={item.id} onClick={() => { if (item.permitted) { setView(item.id); setMobileMenuOpen(false); } }}
                className={`w-full flex items-center gap-3 ${sidebarOpen ? 'px-3' : 'justify-center px-2'} py-2 rounded-xl text-sm font-medium transition-all duration-150 btn-press ${
                  !item.permitted ? 'text-slate-700 cursor-not-allowed' :
                  currentView === item.id
                    ? theme === 'light' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'bg-emerald-600/15 text-emerald-400 shadow-sm'
                    : theme === 'light' ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={!item.permitted ? `Your role (${currentUser?.role}) does not have access` : item.label}>
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
                {sidebarOpen && !item.permitted && <Lock size={12} className="text-slate-700" />}
              </button>
            ))}
          </div>

          {/* Admin Section - Only visible to admins */}
          {currentUser?.role === 'admin' && (
            <div className="pt-2">
              {sidebarOpen && <p className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${theme === 'light' ? 'text-gray-400' : 'text-slate-600'}`}>Admin</p>}
              {!sidebarOpen && <div className={`border-t my-2 ${theme === 'light' ? 'border-gray-200' : 'border-slate-800'}`} />}
              <button onClick={() => { setView('admin-kpis'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 ${sidebarOpen ? 'px-3' : 'justify-center px-2'} py-2 rounded-xl text-sm font-medium transition-all duration-150 btn-press ${
                  currentView === 'admin-kpis'
                    ? theme === 'light' ? 'bg-violet-50 text-violet-600 shadow-sm' : 'bg-violet-600/15 text-violet-400 shadow-sm'
                    : theme === 'light' ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}>
                <span className="flex-shrink-0"><BarChart3 size={19} /></span>
                {sidebarOpen && <span className="flex-1 text-left">Manage KPIs</span>}
              </button>
              <button onClick={() => { setView('admin-audiences'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 ${sidebarOpen ? 'px-3' : 'justify-center px-2'} py-2 rounded-xl text-sm font-medium transition-all duration-150 btn-press ${
                  currentView === 'admin-audiences'
                    ? theme === 'light' ? 'bg-violet-50 text-violet-600 shadow-sm' : 'bg-violet-600/15 text-violet-400 shadow-sm'
                    : theme === 'light' ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}>
                <span className="flex-shrink-0"><Users size={19} /></span>
                {sidebarOpen && <span className="flex-1 text-left">Manage Audiences</span>}
              </button>
            </div>
          )}
        </nav>

        {/* AI Engine card */}
        {sidebarOpen && (
          <div className="mx-2 mb-2 p-3 rounded-xl bg-gradient-to-br from-brand-900/50 to-brand-800/30 border border-brand-700/30">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-300">AI Engine Active</span>
            </div>
            <p className="text-[10px] text-slate-400">GPT-4 powered insights, briefs, and forecasting.</p>
          </div>
        )}

        {/* User profile */}
        <div className={`border-t p-2.5 ${theme === 'light' ? 'border-gray-200' : 'border-slate-800'} ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <div className={`flex items-center gap-3 ${sidebarOpen ? 'px-2' : ''}`}>
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-xs font-bold flex-shrink-0 text-white`}>
              {currentUser?.avatar || '??'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser?.name || 'Unknown'}</p>
                <div className="flex items-center gap-1">
                  <Shield size={10} className={roleColor} />
                  <p className={`text-[10px] capitalize ${roleColor}`}>{currentUser?.role}</p>
                </div>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={() => setShowLogoutConfirm(true)} className="text-slate-500 cursor-pointer hover:text-red-400 transition-colors flex-shrink-0" title="Sign out">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center transition-colors ${
            theme === 'light' ? 'bg-white border border-gray-300 text-gray-400 hover:text-gray-700 hover:bg-gray-50 shadow-sm' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}>
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`h-14 flex items-center px-4 md:px-6 gap-3 flex-shrink-0 glass ${theme === 'light' ? 'border-b border-gray-200 bg-white/90' : 'border-b border-slate-800 bg-slate-900/80'}`}>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(true)}><Menu size={22} /></button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs min-w-0">
            {currentView !== 'hub' && (
              <button onClick={() => setView('hub')} className="text-slate-500 hover:text-brand-400 transition-colors flex-shrink-0">
                <ArrowLeft size={14} />
              </button>
            )}
            <span className="text-slate-600 flex-shrink-0">Comms Dashboard</span>
            <span className="text-slate-700 flex-shrink-0">/</span>
            {breadcrumbCategory && (
              <>
                <span className="text-slate-500 flex-shrink-0">{breadcrumbCategory}</span>
                <span className="text-slate-700 flex-shrink-0">/</span>
              </>
            )}
            <span className="font-semibold truncate">{breadcrumbLabel}</span>
          </div>

          <div className="flex-1" />

          {/* Command Palette Trigger */}
          <button onClick={() => setCmdPaletteOpen(true)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
              theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-100' : 'bg-slate-800/70 border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-300'
            }`}>
            <Search size={14} />
            <span>Search...</span>
            <kbd className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono ${theme === 'light' ? 'bg-gray-200 text-gray-500' : 'bg-slate-700/50 text-slate-600'}`}>
              <Command size={10} />K
            </kbd>
          </button>

          {/* Active workspace badge */}
          {activeWs && (
            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-slate-800/50 border-slate-700/50 text-slate-300'}`}>
              <span>{activeWs.icon}</span>
              <span className="truncate max-w-[120px]">{activeWs.name}</span>
            </div>
          )}

          {/* Role badge */}
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold capitalize ${
            currentUser?.role === 'admin' ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' :
            currentUser?.role === 'editor' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            currentUser?.role === 'contributor' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-slate-500/10 border-slate-600/20 text-slate-400'
          }`}>
            <Shield size={12} />
            {currentUser?.role}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-200 btn-press ${
                theme === 'light' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-800 text-slate-400 hover:text-yellow-400 hover:bg-slate-700'
              }`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Sync Status */}
            <div className="hidden md:flex items-center gap-2 relative group">
              <button onClick={() => { if (syncStatus === 'offline') forceRefresh(); else forcePush(); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-colors ${
                  syncStatus === 'synced' ? 'bg-success-500/10 border-success-500/20' :
                  syncStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/20' :
                  syncStatus === 'offline' ? 'bg-red-500/10 border-red-500/20 cursor-pointer' :
                  syncStatus === 'local' ? 'bg-amber-500/10 border-amber-500/20' :
                  'bg-slate-500/10 border-slate-600/20'
                }`}>
                {syncStatus === 'synced' && <><Cloud size={13} className="text-success-500" /><div className="w-1.5 h-1.5 rounded-full bg-success-500" /></>}
                {syncStatus === 'syncing' && <RefreshCw size={13} className="text-blue-400 animate-spin" />}
                {syncStatus === 'offline' && <WifiOff size={13} className="text-red-400" />}
                {syncStatus === 'local' && <CloudOff size={13} className="text-amber-400" />}
                {syncStatus === 'loading' && <Wifi size={13} className="text-slate-400 animate-pulse" />}
              </button>
              <div className={`absolute top-full right-0 mt-2 w-56 p-3 rounded-xl shadow-xl text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-700'}`}>
                <p className="font-semibold mb-1">
                  {syncStatus === 'synced' && '🟢 Synced'}
                  {syncStatus === 'syncing' && '🔵 Saving...'}
                  {syncStatus === 'offline' && '🔴 Offline'}
                  {syncStatus === 'local' && '🟡 Local Only'}
                  {syncStatus === 'loading' && '⚪ Connecting...'}
                </p>
                <p className="text-slate-500">
                  {syncStatus === 'synced' && 'Real-time sync active.'}
                  {syncStatus === 'syncing' && 'Pushing changes...'}
                  {syncStatus === 'offline' && 'Click to retry.'}
                  {syncStatus === 'local' && 'Configure Upstash to enable.'}
                  {syncStatus === 'loading' && 'Connecting...'}
                </p>
                {lastSyncedAt && <p className={`mt-1 pt-1 border-t ${theme === 'light' ? 'text-gray-400 border-gray-100' : 'text-slate-600 border-slate-800'}`}>Last: {new Date(lastSyncedAt).toLocaleTimeString()}</p>}
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative z-[200]" ref={notifRef}>
              <button onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition-colors btn-press ${theme === 'light' ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Bell size={19} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`fixed right-4 top-14 w-96 max-h-[520px] rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-scale-in ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-700'}`}
                  style={{ boxShadow: theme === 'light' ? '0 25px 50px -12px rgba(0,0,0,0.15)' : '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
                  <div className={`p-4 flex items-center justify-between ${theme === 'light' ? 'border-b border-gray-200' : 'border-b border-slate-800'}`}>
                    <div>
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{unreadNotificationCount} unread</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotificationCount > 0 && (
                        <button onClick={markAllNotificationsRead} className="text-[10px] font-medium text-brand-400 hover:text-brand-300 px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors">Mark all read</button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[420px] divide-y divide-slate-800/50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell size={24} className="text-slate-700 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No notifications</p>
                      </div>
                    ) : notifications.map(notif => (
                      <div key={notif.id}
                        className={`flex items-start gap-3 p-3 hover:bg-slate-800/40 transition-colors cursor-pointer group ${!notif.read ? 'bg-slate-800/20' : ''}`}
                        onClick={() => handleNotificationClick(notif)}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${notifTypeColor(notif.type)}`}>{notif.icon || '📌'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-semibold ${!notif.read ? '' : 'text-slate-400'}`}>{notif.title}</p>
                            {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={9} className="text-slate-600" />
                            <span className="text-[9px] text-slate-600">{formatTimeAgo(notif.timestamp)}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${notifTypeColor(notif.type)}`}>{notif.type}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {!notif.read && (
                            <button onClick={(e) => { e.stopPropagation(); markNotificationRead(notif.id); }}
                              className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Mark as read"><Check size={12} /></button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Dismiss"><X size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`p-3 text-center ${theme === 'light' ? 'border-t border-gray-200' : 'border-t border-slate-800'}`}>
                    <button onClick={() => { setView('settings'); setShowNotifications(false); }}
                      className="text-[10px] text-slate-500 hover:text-brand-400 font-medium transition-colors">Notification settings →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace filter banner */}
        {activeWs && (
          <div className={`px-4 md:px-6 py-1.5 flex items-center gap-3 ${theme === 'light' ? 'bg-gray-50 border-b border-gray-200' : 'bg-slate-900/80 border-b border-slate-800'}`}>
            <span className="text-sm">{activeWs.icon}</span>
            <p className="text-xs text-slate-400">
              Viewing <span className="font-semibold">{activeWs.name}</span> · {getWsCampaignCount(activeWs.id)} campaigns
            </p>
            <button onClick={() => setActiveWorkspaceId(null)} className="text-[10px] text-brand-400 hover:text-brand-300 ml-auto font-medium">Show all →</button>
          </div>
        )}

        {/* Success banner */}
        {wsSuccess && (
          <div className="px-4 md:px-6 py-2 bg-emerald-600/10 border-b border-emerald-600/20 flex items-center gap-2 animate-slide-down">
            <Check size={14} className="text-emerald-400" />
            <p className="text-xs text-emerald-400 font-medium">{wsSuccess}</p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className={`relative rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6 text-center ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-700'}`}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4"><LogOut size={24} className="text-red-400" /></div>
            <h3 className="text-lg font-bold mb-2">Sign Out?</h3>
            <p className="text-sm text-slate-400 mb-6">You'll need to log in again to access your workspace.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors btn-press ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 border border-gray-200' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'}`}>Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors text-white btn-press">Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Create/Edit Modal */}
      {wsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setWsModal(null); setEditingWs(null); }} />
          <div className={`relative rounded-2xl w-full max-w-md shadow-2xl animate-scale-in ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-700'}`}>
            <div className={`p-6 ${theme === 'light' ? 'border-b border-gray-200' : 'border-b border-slate-800'}`}>
              <h3 className="text-lg font-bold">{wsModal === 'create' ? 'Create New Workspace' : 'Edit Workspace'}</h3>
              <p className="text-sm text-slate-400 mt-1">{wsModal === 'create' ? 'Organise campaigns by team or department.' : 'Update workspace details.'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Workspace Name *</label>
                <input type="text" value={wsForm.name} onChange={e => setWsForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Marketing Team"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description</label>
                <textarea value={wsForm.description} onChange={e => setWsForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this workspace for?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 h-20 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {WORKSPACE_ICONS.map(icon => (
                    <button key={icon} onClick={() => setWsForm(p => ({ ...p, icon }))}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${wsForm.icon === icon ? 'bg-brand-600/20 ring-2 ring-brand-500 scale-110' : 'bg-slate-800 hover:bg-slate-700'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Colour</label>
                <div className="flex flex-wrap gap-2">
                  {WORKSPACE_COLORS.map(color => (
                    <button key={color} onClick={() => setWsForm(p => ({ ...p, color }))}
                      className={`w-8 h-8 rounded-full transition-all ${wsForm.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
            <div className={`p-6 flex gap-3 ${theme === 'light' ? 'border-t border-gray-200' : 'border-t border-slate-800'}`}>
              <button onClick={() => { setWsModal(null); setEditingWs(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors btn-press ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'}`}>Cancel</button>
              <button onClick={handleSaveWs} disabled={!wsForm.name.trim()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors text-white btn-press">
                {wsModal === 'create' ? 'Create Workspace' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirm */}
      {deleteConfirmWs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmWs(null)} />
          <div className={`relative rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6 text-center ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-700'}`}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-400" /></div>
            <h3 className="text-lg font-bold mb-2">Delete Workspace?</h3>
            <p className="text-sm text-slate-400 mb-1"><span className="font-semibold">"{workspacesList.find(w => w.id === deleteConfirmWs)?.name}"</span></p>
            <p className="text-xs text-slate-500 mb-6">Campaigns will still exist but won't be grouped.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmWs(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors btn-press">Cancel</button>
              <button onClick={() => handleDeleteWs(deleteConfirmWs)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors text-white btn-press">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
