import { useApp } from '../store/AppContext';
import { ViewType, AppNotification, Workspace } from '../types';
import {
  LayoutDashboard, Calendar, FolderKanban, Sparkles, CheckCircle2,
  BarChart3, ImageIcon, Settings, ChevronLeft, ChevronRight,
  Bell, Search, Menu, LogOut, Shield, Zap, Lock, X, Check, Clock,
  Cloud, CloudOff, RefreshCw, Wifi, WifiOff, Plus, Pencil, Trash2, ChevronDown
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const WORKSPACE_ICONS = ['🏥','🌍','👥','🎯','📊','🏛️','🎓','💼','🚀','🔬','📱','🏢','⚡','🌐','📋'];
const WORKSPACE_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444','#84cc16','#f97316'];

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
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [wsModal, setWsModal] = useState<'create' | 'edit' | null>(null);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [deleteConfirmWs, setDeleteConfirmWs] = useState<string | null>(null);
  const [wsForm, setWsForm] = useState({ name: '', description: '', icon: '🎯', color: '#6366f1' });
  const [wsSuccess, setWsSuccess] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<HTMLDivElement>(null);

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

  // Live counts
  const getWsCampaignCount = (wsId: string) => campaigns.filter(c => c.workspace === wsId).length;
  const getWsAssetCount = (wsId: string) => assets.filter(a => a.workspace === wsId).length;

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: number; permitted: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, permitted: permissions.canViewDashboard },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} />, permitted: permissions.canViewCalendar },
    { id: 'campaigns', label: 'Campaigns', icon: <FolderKanban size={20} />, permitted: permissions.canViewCampaigns },
    { id: 'ai-brief', label: 'AI Brief Generator', icon: <Sparkles size={20} />, permitted: permissions.canUseAIBrief },
    { id: 'approvals', label: 'Approvals', icon: <CheckCircle2 size={20} />, badge: 2, permitted: permissions.canViewApprovals },
    { id: 'kpi', label: 'KPI Dashboard', icon: <BarChart3 size={20} />, permitted: permissions.canViewKPI },
    { id: 'assets', label: 'Assets', icon: <ImageIcon size={20} />, permitted: permissions.canViewAssets },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, permitted: permissions.canViewSettings },
  ];

  const handleLogout = () => { setShowLogoutConfirm(false); logout(); };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.campaignId) setSelectedCampaignId(notif.campaignId);
    if (notif.link) setView(notif.link);
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

  // === Workspace modal handlers ===
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
        id: `ws-${Date.now()}`,
        name: wsForm.name.trim(),
        description: wsForm.description.trim(),
        icon: wsForm.icon,
        color: wsForm.color,
        campaigns: 0,
        members: 1,
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: currentUser?.id || 'u1',
      };
      addWorkspace(newWs);
      setActiveWorkspaceId(newWs.id);
      setWsSuccess(`Workspace "${newWs.name}" created and activated!`);
    } else if (wsModal === 'edit' && editingWs) {
      editWorkspace(editingWs.id, { name: wsForm.name.trim(), description: wsForm.description.trim(), icon: wsForm.icon, color: wsForm.color });
      setWsSuccess(`Workspace "${wsForm.name.trim()}" updated!`);
    }
    setWsModal(null);
    setEditingWs(null);
    setTimeout(() => setWsSuccess(''), 3000);
  };
  const handleDeleteWs = (id: string) => {
    const ws = workspacesList.find(w => w.id === id);
    deleteWorkspace(id);
    setDeleteConfirmWs(null);
    setWsSuccess(`Workspace "${ws?.name}" deleted.`);
    setTimeout(() => setWsSuccess(''), 3000);
  };

  return (
    <div className="h-screen flex bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-50 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300`}>
        <div className={`flex items-center ${sidebarOpen ? 'px-6' : 'px-4 justify-center'} h-16 border-b border-slate-800`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-500/20">C</div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-base leading-tight">CampaignOS</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Enterprise</p>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Picker */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-slate-800 relative" ref={wsRef}>
            <button
              onClick={() => setShowWorkspacePicker(!showWorkspacePicker)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-lg">{wsIcon}</span>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold truncate">{wsLabel}</p>
                <p className="text-[10px] text-slate-500">
                  {activeWorkspaceId ? `${getWsCampaignCount(activeWorkspaceId)} campaigns` : 'All workspaces'}
                </p>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${showWorkspacePicker ? 'rotate-180' : ''}`} />
            </button>

            {showWorkspacePicker && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                {/* All workspaces option */}
                <button
                  onClick={() => { setActiveWorkspaceId(null); setShowWorkspacePicker(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors ${!activeWorkspaceId ? 'bg-brand-600/10 border-l-2 border-brand-500' : 'border-l-2 border-transparent'}`}
                >
                  <span className="text-base">🌐</span>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold">All Workspaces</p>
                    <p className="text-[10px] text-slate-500">{campaigns.length} campaigns · {assets.length} assets</p>
                  </div>
                  {!activeWorkspaceId && <Check size={14} className="text-brand-400" />}
                </button>

                <div className="border-t border-slate-700/50" />

                {workspacesList.map(ws => (
                  <div
                    key={ws.id}
                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors group ${activeWorkspaceId === ws.id ? 'bg-brand-600/10 border-l-2 border-brand-500' : 'border-l-2 border-transparent'}`}
                  >
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => { setActiveWorkspaceId(ws.id); setShowWorkspacePicker(false); }}
                    >
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
                    <div className="border-t border-slate-700/50" />
                    <button
                      onClick={openCreateWs}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-brand-400 hover:bg-brand-600/10 transition-colors"
                    >
                      <Plus size={14} />
                      <span className="text-xs font-semibold">Create Workspace</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {sidebarOpen && <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Main Menu</p>}
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { if (item.permitted) { setView(item.id); setMobileMenuOpen(false); } }}
              className={`w-full flex items-center gap-3 ${sidebarOpen ? 'px-3' : 'justify-center px-2'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                !item.permitted ? 'text-slate-700 cursor-not-allowed' :
                currentView === item.id ? 'bg-brand-600/20 text-brand-400 shadow-sm' :
                'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!item.permitted ? `Your role (${currentUser?.role}) does not have access` : item.label}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              {sidebarOpen && !item.permitted && <Lock size={12} className="text-slate-700" />}
              {sidebarOpen && item.badge && item.permitted && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-danger-500 text-white rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-brand-900/50 to-brand-800/30 border border-brand-700/30">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-300">AI Engine Active</span>
            </div>
            <p className="text-[10px] text-slate-400">GPT-4 powered insights, briefs, and forecasting enabled.</p>
          </div>
        )}

        <div className={`border-t border-slate-800 p-3 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <div className={`flex items-center gap-3 ${sidebarOpen ? 'px-2' : ''}`}>
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
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
              <button onClick={() => setShowLogoutConfirm(true)}
                className="text-slate-500 cursor-pointer hover:text-red-400 transition-colors flex-shrink-0" title="Sign out">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-4 md:px-6 gap-4 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(true)}><Menu size={22} /></button>

          <div className={`${searchOpen ? 'w-80' : 'w-64'} transition-all hidden md:block`}>
            <div className="relative" onClick={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Search campaigns, assets, people..."
                className="w-full bg-slate-800/70 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all" />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>
          </div>

          <div className="flex-1" />

          {/* Active workspace badge */}
          {activeWs && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-slate-800/50 border-slate-700/50 text-xs font-medium">
              <span>{activeWs.icon}</span>
              <span className="text-slate-300">{activeWs.name}</span>
            </div>
          )}

          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold capitalize ${
            currentUser?.role === 'admin' ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' :
            currentUser?.role === 'editor' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            currentUser?.role === 'contributor' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-slate-500/10 border-slate-600/20 text-slate-400'
          }`}>
            <Shield size={12} />
            {currentUser?.role}
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Status */}
            <div className="hidden md:flex items-center gap-2 relative group">
              <button
                onClick={() => { if (syncStatus === 'offline') forceRefresh(); else forcePush(); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                  syncStatus === 'synced' ? 'bg-success-500/10 border-success-500/20' :
                  syncStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/20' :
                  syncStatus === 'offline' ? 'bg-red-500/10 border-red-500/20 cursor-pointer' :
                  syncStatus === 'local' ? 'bg-amber-500/10 border-amber-500/20' :
                  'bg-slate-500/10 border-slate-600/20'
                }`}
              >
                {syncStatus === 'synced' && <><Cloud size={14} className="text-success-500" /><span className="text-xs font-medium text-success-500">Synced</span><div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" /></>}
                {syncStatus === 'syncing' && <><RefreshCw size={14} className="text-blue-400 animate-spin" /><span className="text-xs font-medium text-blue-400">Syncing...</span></>}
                {syncStatus === 'offline' && <><WifiOff size={14} className="text-red-400" /><span className="text-xs font-medium text-red-400">Offline</span></>}
                {syncStatus === 'local' && <><CloudOff size={14} className="text-amber-400" /><span className="text-xs font-medium text-amber-400">Local Only</span></>}
                {syncStatus === 'loading' && <><Wifi size={14} className="text-slate-400 animate-pulse" /><span className="text-xs font-medium text-slate-400">Connecting...</span></>}
              </button>
              <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <p className="font-semibold mb-1 text-white">
                  {syncStatus === 'synced' && '🟢 Real-Time Sync Active'}
                  {syncStatus === 'syncing' && '🔵 Saving Changes...'}
                  {syncStatus === 'offline' && '🔴 Connection Lost'}
                  {syncStatus === 'local' && '🟡 Local Mode (No Upstash)'}
                  {syncStatus === 'loading' && '⚪ Connecting...'}
                </p>
                <p className="text-slate-400">
                  {syncStatus === 'synced' && 'All changes are saved and visible to other users in real-time.'}
                  {syncStatus === 'syncing' && 'Your changes are being pushed to the server...'}
                  {syncStatus === 'offline' && 'Cannot reach the sync server. Click to retry.'}
                  {syncStatus === 'local' && 'Set environment variables in Vercel to enable sync.'}
                  {syncStatus === 'loading' && 'Establishing connection...'}
                </p>
                {lastSyncedAt && <p className="text-slate-500 mt-1 pt-1 border-t border-slate-800">Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}</p>}
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative z-[200]" ref={notifRef}>
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Bell size={20} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="fixed right-4 top-14 w-96 max-h-[520px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-fade-in" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{unreadNotificationCount} unread</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotificationCount > 0 && (
                        <button onClick={markAllNotificationsRead}
                          className="text-[10px] font-medium text-brand-400 hover:text-brand-300 px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors">
                          Mark all read
                        </button>
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
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${notifTypeColor(notif.type)}`}>{notif.icon || '📌'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-semibold ${!notif.read ? 'text-white' : 'text-slate-400'}`}>{notif.title}</p>
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
                              className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Mark as read">
                              <Check size={12} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Dismiss">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-800 text-center">
                    <button onClick={() => { setView('settings'); setShowNotifications(false); }}
                      className="text-[10px] text-slate-500 hover:text-brand-400 font-medium transition-colors">
                      Notification settings →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace filter banner */}
        {activeWs && (
          <div className="px-4 md:px-6 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-3">
            <span className="text-sm">{activeWs.icon}</span>
            <p className="text-xs text-slate-400">
              Viewing <span className="text-white font-semibold">{activeWs.name}</span> workspace · {getWsCampaignCount(activeWs.id)} campaigns · {getWsAssetCount(activeWs.id)} assets
            </p>
            <button onClick={() => setActiveWorkspaceId(null)} className="text-[10px] text-brand-400 hover:text-brand-300 ml-auto font-medium">Show all →</button>
          </div>
        )}

        {/* Success banner */}
        {wsSuccess && (
          <div className="px-4 md:px-6 py-2 bg-emerald-600/10 border-b border-emerald-600/20 flex items-center gap-2 animate-fade-in">
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
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4"><LogOut size={24} className="text-red-400" /></div>
            <h3 className="text-lg font-bold mb-2">Sign Out?</h3>
            <p className="text-sm text-slate-400 mb-6">You'll need to log in again to access your workspace.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors">Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Create/Edit Modal */}
      {wsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setWsModal(null); setEditingWs(null); }} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold">{wsModal === 'create' ? 'Create New Workspace' : 'Edit Workspace'}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {wsModal === 'create' ? 'Workspaces help organise campaigns by team or department.' : 'Update workspace details.'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Workspace Name *</label>
                <input type="text" value={wsForm.name} onChange={e => setWsForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Marketing Team, Regional Comms"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description</label>
                <textarea value={wsForm.description} onChange={e => setWsForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What is this workspace for?"
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
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button onClick={() => { setWsModal(null); setEditingWs(null); }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSaveWs} disabled={!wsForm.name.trim()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
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
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-400" /></div>
            <h3 className="text-lg font-bold mb-2">Delete Workspace?</h3>
            <p className="text-sm text-slate-400 mb-2">
              <span className="text-white font-semibold">"{workspacesList.find(w => w.id === deleteConfirmWs)?.name}"</span>
            </p>
            <p className="text-xs text-slate-500 mb-6">Campaigns and assets in this workspace will still exist but won't be grouped.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmWs(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDeleteWs(deleteConfirmWs)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
