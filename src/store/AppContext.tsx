import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { ViewType, Campaign, Task, ApprovalItem, ApprovalStatus, Asset, Role, AppNotification, ChecklistItem, Workspace } from '../types';
import { campaigns as initialCampaigns, approvalItems as initialApprovals, assets as initialAssets, workspaces as initialWorkspaces } from '../data/mockData';
import { getPermissions, Permissions } from '../utils/permissions';

// ==================== TYPE DEFINITIONS ====================

export type SyncStatus = 'loading' | 'synced' | 'syncing' | 'offline' | 'local';

interface WorkspaceSettings {
  name: string;
  organisation: string;
  sector: string;
}

interface NotificationSetting {
  label: string;
  enabled: boolean;
}

interface IntegrationSetting {
  name: string;
  status: 'connected' | 'available';
  icon: string;
  desc: string;
  authType: 'oauth' | 'api-key' | 'webhook';
  apiKey?: string;
  webhookUrl?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  department: string;
  password?: string;
  createdAt: string;
  lastLogin?: string;
  active: boolean;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  currentUser: TeamMember | null;
  permissions: Permissions;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // Navigation
  currentView: ViewType;
  setView: (view: ViewType) => void;

  // Data
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  approvals: ApprovalItem[];
  setApprovals: React.Dispatch<React.SetStateAction<ApprovalItem[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Task CRUD
  updateTaskStatus: (campaignId: string, taskId: string, status: Task['status']) => void;
  addTask: (campaignId: string, task: Task) => void;
  editTask: (campaignId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (campaignId: string, taskId: string) => void;

  // Approval actions
  updateApprovalStatus: (approvalId: string, reviewerUserId: string, status: ApprovalItem['status'], comment?: string) => void;
  addCampaign: (campaign: Campaign) => void;
  deleteCampaign: (campaignId: string) => void;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  addApproval: (approval: ApprovalItem) => void;
  addApprovalComment: (approvalId: string, comment: string, author: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  // Checklist / Governance
  updateChecklistItem: (campaignId: string, itemId: string, updates: Partial<ChecklistItem>) => void;
  addChecklistItem: (campaignId: string, item: ChecklistItem) => void;
  removeChecklistItem: (campaignId: string, itemId: string) => void;

  // Settings state
  workspaceSettings: WorkspaceSettings;
  setWorkspaceSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
  notificationSettings: NotificationSetting[];
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSetting[]>>;
  integrations: IntegrationSetting[];
  setIntegrations: React.Dispatch<React.SetStateAction<IntegrationSetting[]>>;
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;

  // User management
  createUser: (user: Omit<TeamMember, 'id' | 'createdAt' | 'active'> & { password: string }) => { success: boolean; error?: string };
  updateUser: (id: string, updates: Partial<TeamMember>) => void;
  deactivateUser: (id: string) => void;
  reactivateUser: (id: string) => void;

  // KPI manual data
  manualKpiData: Record<string, number>;
  setManualKpiData: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  // Workspaces
  workspacesList: Workspace[];
  setWorkspacesList: React.Dispatch<React.SetStateAction<Workspace[]>>;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  addWorkspace: (ws: Workspace) => void;
  editWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;

  // Asset CRUD
  addAsset: (asset: Asset) => void;
  editAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Sync
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  forcePush: () => void;
  forceRefresh: () => void;
  resetRemoteState: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// ==================== DEFAULTS ====================

const STORAGE_KEY_AUTH = 'campaignos_auth';
const SYNC_POLL_INTERVAL = 3000;
const SYNC_PUSH_DEBOUNCE = 1500;

const defaultIntegrations: IntegrationSetting[] = [
  { name: 'Google Analytics 4', status: 'connected', icon: '📊', desc: 'Campaign performance tracking', authType: 'oauth', apiKey: 'GA4-XXXX-XXXX' },
  { name: 'Meta Business Suite', status: 'connected', icon: '📘', desc: 'Social media ad management', authType: 'oauth' },
  { name: 'Microsoft 365', status: 'connected', icon: '📧', desc: 'Calendar & email integration', authType: 'oauth' },
  { name: 'Slack', status: 'available', icon: '💬', desc: 'Team notifications & alerts', authType: 'webhook' },
  { name: 'Salesforce', status: 'available', icon: '☁️', desc: 'CRM data sync', authType: 'oauth' },
  { name: 'HubSpot', status: 'available', icon: '🟠', desc: 'Marketing automation', authType: 'api-key' },
  { name: 'Jira', status: 'available', icon: '📋', desc: 'Project management sync', authType: 'api-key' },
  { name: 'WordPress', status: 'available', icon: '📝', desc: 'CMS content publishing', authType: 'api-key' },
  { name: 'Adobe Workfront', status: 'available', icon: '🎨', desc: 'Creative workflow management', authType: 'oauth' },
];

const defaultNotifSettings: NotificationSetting[] = [
  { label: 'Email notifications for approvals', enabled: true },
  { label: 'Slack alerts for campaign updates', enabled: true },
  { label: 'Weekly performance digest', enabled: true },
  { label: 'Real-time comment mentions', enabled: false },
  { label: 'Budget threshold alerts', enabled: true },
];

const defaultTeamMembers: TeamMember[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@campaignos.com', role: 'admin', avatar: 'AU', department: 'Communications', password: 'admin123', createdAt: '2024-06-01', lastLogin: '2025-01-22', active: true },
  { id: 'u2', name: 'James Richardson', email: 'editor@campaignos.com', role: 'editor', avatar: 'JR', department: 'Marketing', password: 'editor123', createdAt: '2024-06-15', lastLogin: '2025-01-21', active: true },
  { id: 'u3', name: 'Priya Sharma', email: 'contributor@campaignos.com', role: 'contributor', avatar: 'PS', department: 'Digital', password: 'contributor123', createdAt: '2024-07-01', lastLogin: '2025-01-20', active: true },
  { id: 'u4', name: 'Marcus Johnson', email: 'marcus.j@nhs.net', role: 'editor', avatar: 'MJ', department: 'Strategy', password: 'pass123', createdAt: '2024-07-15', active: true },
  { id: 'u5', name: 'Emma Williams', email: 'viewer@campaignos.com', role: 'viewer', avatar: 'EW', department: 'Finance', password: 'viewer123', createdAt: '2024-08-01', active: true },
  { id: 'u6', name: 'David Chen', email: 'david.c@nhs.net', role: 'contributor', avatar: 'DC', department: 'HR', password: 'pass123', createdAt: '2024-08-15', active: true },
];

const defaultAppNotifications: AppNotification[] = [
  { id: 'n1', title: 'Approval Required', message: 'NHS Recruitment Campaign brief is waiting for your review', type: 'approval', read: false, timestamp: new Date(Date.now() - 1800000).toISOString(), link: 'approvals', icon: '📋' },
  { id: 'n2', title: 'Campaign Update', message: 'Winter Vaccination Drive status changed to "In Review"', type: 'campaign', read: false, timestamp: new Date(Date.now() - 3600000).toISOString(), link: 'campaigns', campaignId: 'c2', icon: '🔄' },
  { id: 'n3', title: 'AI Insight', message: 'LinkedIn ads are delivering 3.2x ROI — consider increasing budget by 15%', type: 'ai', read: false, timestamp: new Date(Date.now() - 7200000).toISOString(), link: 'kpi', icon: '🤖' },
  { id: 'n4', title: 'Task Due Tomorrow', message: '"Design social media assets" for Primary Care Coaches campaign is due tomorrow', type: 'task', read: false, timestamp: new Date(Date.now() - 14400000).toISOString(), link: 'campaign-detail', campaignId: 'c1', icon: '⏰' },
  { id: 'n5', title: 'Governance Alert', message: 'Digital Transformation campaign has 3 mandatory checklist items incomplete', type: 'governance', read: false, timestamp: new Date(Date.now() - 28800000).toISOString(), link: 'campaign-detail', campaignId: 'c3', icon: '🛡️' },
  { id: 'n6', title: 'New Team Member', message: 'David Chen has joined the workspace as a Contributor', type: 'system', read: true, timestamp: new Date(Date.now() - 86400000).toISOString(), icon: '👋' },
  { id: 'n7', title: 'Weekly Digest', message: 'Your weekly performance summary is ready — 3 campaigns on track, 1 needs attention', type: 'system', read: true, timestamp: new Date(Date.now() - 172800000).toISOString(), link: 'kpi', icon: '📊' },
];

const defaultWorkspaceSettings: WorkspaceSettings = {
  name: 'NHS England Comms',
  organisation: 'NHS England',
  sector: 'Public Sector - Healthcare',
};

// ==================== HELPERS ====================

function loadAuth(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_AUTH); } catch { return null; }
}
function saveAuth(userId: string | null) {
  try {
    if (userId) localStorage.setItem(STORAGE_KEY_AUTH, userId);
    else localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch { /* noop */ }
}

const viewerPermissions = getPermissions('viewer');

// ==================== SHARED STATE SHAPE ====================
// This is what gets persisted to Upstash Redis and synced across browsers.

interface SharedState {
  campaigns: Campaign[];
  approvals: ApprovalItem[];
  assets: Asset[];
  notifications: AppNotification[];
  teamMembers: TeamMember[];
  workspaceSettings: WorkspaceSettings;
  notificationSettings: NotificationSetting[];
  integrations: IntegrationSetting[];
  manualKpiData: Record<string, number>;
  workspacesList: Workspace[];
  activeWorkspaceId: string | null;
}

// ==================== PROVIDER ====================

export function AppProvider({ children }: { children: ReactNode }) {
  // --- Auth state (local only, not synced) ---
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    const authId = loadAuth();
    if (authId) {
      const u = defaultTeamMembers.find(u => u.id === authId && u.active);
      return u || null;
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);
  const [currentView, setCurrentView] = useState<ViewType>(currentUser ? 'dashboard' : 'login');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- Shared state (synced to Upstash Redis) ---
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(defaultAppNotifications);
  const [teamMembers, setTeamMembersRaw] = useState<TeamMember[]>(defaultTeamMembers);
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>(defaultWorkspaceSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(defaultNotifSettings);
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>(defaultIntegrations);
  const [manualKpiData, setManualKpiData] = useState<Record<string, number>>({});
  const [workspacesList, setWorkspacesList] = useState<Workspace[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceIdRaw] = useState<string | null>(null);

  // --- Sync state ---
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const versionRef = useRef(0);
  const skipNextPushRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocalModeRef = useRef(false);
  const isMountedRef = useRef(true);

  // Keep a ref to the latest shared state so we can read it in async callbacks
  const sharedStateRef = useRef<SharedState>({
    campaigns: initialCampaigns,
    approvals: initialApprovals,
    assets: initialAssets,
    notifications: defaultAppNotifications,
    teamMembers: defaultTeamMembers,
    workspaceSettings: defaultWorkspaceSettings,
    notificationSettings: defaultNotifSettings,
    integrations: defaultIntegrations,
    manualKpiData: {},
    workspacesList: initialWorkspaces,
    activeWorkspaceId: null,
  });

  // Sync the ref on every render
  sharedStateRef.current = {
    campaigns,
    approvals,
    assets,
    notifications: appNotifications,
    teamMembers,
    workspaceSettings,
    notificationSettings,
    integrations,
    manualKpiData,
    workspacesList,
    activeWorkspaceId: activeWorkspaceId,
  };

  const permissions = currentUser ? getPermissions(currentUser.role) : viewerPermissions;

  // Wrapper that doesn't break the exposed API
  const setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>> = (action) => {
    setTeamMembersRaw(action);
  };

  // ==================== SYNC ENGINE ====================

  const applyRemoteState = useCallback((state: SharedState) => {
    skipNextPushRef.current = true;
    if (state.campaigns) setCampaigns(state.campaigns);
    if (state.approvals) setApprovals(state.approvals);
    if (state.assets) setAssets(state.assets);
    if (state.notifications) setAppNotifications(state.notifications);
    if (state.teamMembers) setTeamMembersRaw(state.teamMembers);
    if (state.workspaceSettings) setWorkspaceSettings(state.workspaceSettings);
    if (state.notificationSettings) setNotificationSettings(state.notificationSettings);
    if (state.integrations) setIntegrations(state.integrations);
    if (state.manualKpiData !== undefined) setManualKpiData(state.manualKpiData);
    if (state.workspacesList) setWorkspacesList(state.workspacesList);
    if (state.activeWorkspaceId !== undefined) setActiveWorkspaceIdRaw(state.activeWorkspaceId);
  }, []);

  const pushToServer = useCallback(async () => {
    if (isLocalModeRef.current) return;
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: sharedStateRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          versionRef.current = data.version;
          if (isMountedRef.current) {
            setSyncStatus('synced');
            setLastSyncedAt(new Date().toISOString());
          }
        } else if (data.localOnly) {
          isLocalModeRef.current = true;
          if (isMountedRef.current) setSyncStatus('local');
        }
      } else {
        if (isMountedRef.current) setSyncStatus('offline');
      }
    } catch {
      if (isMountedRef.current) setSyncStatus('offline');
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (isLocalModeRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => pushToServer(), SYNC_PUSH_DEBOUNCE);
  }, [pushToServer]);

  // --- Initial load from server ---
  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      try {
        const res = await fetch('/api/state?version=0');
        if (!res.ok) {
          setSyncStatus('offline');
          hasInitializedRef.current = true;
          return;
        }
        const data = await res.json();

        if (data.localOnly) {
          isLocalModeRef.current = true;
          setSyncStatus('local');
        } else if (data.changed && data.state) {
          applyRemoteState(data.state);
          versionRef.current = data.version;
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toISOString());

          // Re-resolve auth user from synced team members
          const authId = loadAuth();
          if (authId && data.state.teamMembers) {
            const syncedUser = data.state.teamMembers.find((u: TeamMember) => u.id === authId && u.active);
            if (syncedUser) {
              setCurrentUser(syncedUser);
              setIsAuthenticated(true);
              setCurrentView('dashboard');
            }
          }
        } else if (data.empty) {
          // No state on server yet - push our defaults
          setSyncStatus('synced');
          await pushToServer();
        } else {
          setSyncStatus('synced');
        }
      } catch {
        setSyncStatus('offline');
      }
      hasInitializedRef.current = true;
    };

    init();

    return () => { isMountedRef.current = false; };
  }, [applyRemoteState, pushToServer]);

  // --- Push on shared state changes ---
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    schedulePush();
  }, [campaigns, approvals, assets, appNotifications, teamMembers, workspaceSettings, notificationSettings, integrations, manualKpiData, workspacesList, activeWorkspaceId, schedulePush]);

  // --- Poll for remote changes ---
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    const poll = async () => {
      if (isLocalModeRef.current) return;
      try {
        const res = await fetch(`/api/state?version=${versionRef.current}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.localOnly) {
          isLocalModeRef.current = true;
          if (isMountedRef.current) setSyncStatus('local');
          return;
        }

        if (data.changed && data.state) {
          applyRemoteState(data.state);
          versionRef.current = data.version;
          if (isMountedRef.current) {
            setSyncStatus('synced');
            setLastSyncedAt(new Date().toISOString());
          }
        }
      } catch {
        // Silent fail — will retry on next tick
      }
    };

    const interval = setInterval(poll, SYNC_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [applyRemoteState]);

  // ==================== AUTH ====================

  const login = useCallback((email: string, password: string) => {
    const user = teamMembers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { success: false, error: 'Invalid email or password. Please try again.' };
    if (!user.active) return { success: false, error: 'This account has been deactivated. Contact your administrator.' };

    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    setTeamMembersRaw(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    saveAuth(user.id);
    return { success: true };
  }, [teamMembers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('login');
    saveAuth(null);
  }, []);

  const setView = useCallback((view: ViewType) => setCurrentView(view), []);

  // ==================== TASK CRUD ====================

  const updateTaskStatus = useCallback((campaignId: string, taskId: string, status: Task['status']) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, status } : t) } : c
    ));
  }, []);

  const addTask = useCallback((campaignId: string, task: Task) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, tasks: [...c.tasks, task] } : c
    ));
  }, []);

  const editTask = useCallback((campaignId: string, taskId: string, updates: Partial<Task>) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) } : c
    ));
  }, []);

  const deleteTask = useCallback((campaignId: string, taskId: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
    ));
  }, []);

  // ==================== CAMPAIGN CRUD ====================

  const addCampaign = useCallback((campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  }, []);

  const deleteCampaign = useCallback((campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  }, []);

  const updateCampaign = useCallback((campaignId: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    ));
  }, []);

  // ==================== CHECKLIST ====================

  const updateChecklistItem = useCallback((campaignId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId && c.checklist ? { ...c, checklist: c.checklist.map(i => i.id === itemId ? { ...i, ...updates } : i) } : c
    ));
  }, []);

  const addChecklistItem = useCallback((campaignId: string, item: ChecklistItem) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, checklist: [...(c.checklist || []), item] } : c
    ));
  }, []);

  const removeChecklistItem = useCallback((campaignId: string, itemId: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId && c.checklist ? { ...c, checklist: c.checklist.filter(i => i.id !== itemId) } : c
    ));
  }, []);

  // ==================== APPROVALS ====================

  const updateApprovalStatus = useCallback((approvalId: string, reviewerUserId: string, status: ApprovalItem['status'], comment?: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === approvalId ? {
        ...a, status, updatedAt: new Date().toISOString(),
        reviewers: a.reviewers.map(r =>
          r.user.id === reviewerUserId ? { ...r, status: status as ApprovalStatus, comment, date: new Date().toISOString().split('T')[0] } : r
        )
      } : a
    ));
  }, []);

  const addApproval = useCallback((approval: ApprovalItem) => {
    setApprovals(prev => [approval, ...prev]);
  }, []);

  const addApprovalComment = useCallback((approvalId: string, comment: string, _author: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === approvalId ? {
        ...a, updatedAt: new Date().toISOString(),
        reviewers: a.reviewers.map((r, i) => i === 0 ? { ...r, comment } : r)
      } : a
    ));
  }, []);

  // ==================== NOTIFICATIONS ====================

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notification,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setAppNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setAppNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setAppNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadNotificationCount = appNotifications.filter(n => !n.read).length;

  // ==================== USER MANAGEMENT ====================

  const createUser = useCallback((userData: Omit<TeamMember, 'id' | 'createdAt' | 'active'> & { password: string }) => {
    const existingEmail = teamMembers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingEmail) return { success: false, error: 'A user with this email already exists.' };

    const newUser: TeamMember = {
      ...userData,
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      active: true,
    };
    setTeamMembersRaw(prev => [...prev, newUser]);
    return { success: true };
  }, [teamMembers]);

  const updateUser = useCallback((id: string, updates: Partial<TeamMember>) => {
    setTeamMembersRaw(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const deactivateUser = useCallback((id: string) => {
    setTeamMembersRaw(prev => prev.map(u => u.id === id ? { ...u, active: false } : u));
  }, []);

  const reactivateUser = useCallback((id: string) => {
    setTeamMembersRaw(prev => prev.map(u => u.id === id ? { ...u, active: true } : u));
  }, []);

  // ==================== WORKSPACES ====================

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdRaw(id);
  }, []);

  const addWorkspace = useCallback((ws: Workspace) => {
    setWorkspacesList(prev => [...prev, ws]);
  }, []);

  const editWorkspace = useCallback((id: string, updates: Partial<Workspace>) => {
    setWorkspacesList(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspacesList(prev => prev.filter(w => w.id !== id));
    setActiveWorkspaceIdRaw(prev => prev === id ? null : prev);
  }, []);

  // ==================== ASSET CRUD ====================

  const addAsset = useCallback((asset: Asset) => {
    setAssets(prev => [asset, ...prev]);
  }, []);

  const editAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  // ==================== SYNC CONTROLS (exposed) ====================

  const forcePush = useCallback(() => {
    pushToServer();
  }, [pushToServer]);

  const forceRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state?version=0');
      if (res.ok) {
        const data = await res.json();
        if (data.changed && data.state) {
          applyRemoteState(data.state);
          versionRef.current = data.version;
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toISOString());
        }
      }
    } catch { /* noop */ }
  }, [applyRemoteState]);

  const resetRemoteState = useCallback(async () => {
    try {
      await fetch('/api/state', { method: 'DELETE' });
      versionRef.current = 0;
      await pushToServer();
    } catch { /* noop */ }
  }, [pushToServer]);

  // ==================== CONTEXT VALUE ====================

  return (
    <AppContext.Provider value={{
      isAuthenticated, currentUser, permissions, login, logout,
      currentView, setView, campaigns, setCampaigns,
      approvals, setApprovals, assets, setAssets,
      selectedCampaignId, setSelectedCampaignId,
      sidebarOpen, setSidebarOpen,
      updateTaskStatus, addTask, editTask, deleteTask,
      updateApprovalStatus,
      addCampaign, deleteCampaign, updateCampaign, addApproval, addApprovalComment,
      notifications: appNotifications,
      unreadNotificationCount,
      addNotification, markNotificationRead, markAllNotificationsRead, dismissNotification,
      updateChecklistItem, addChecklistItem, removeChecklistItem,
      workspaceSettings, setWorkspaceSettings,
      notificationSettings, setNotificationSettings,
      integrations, setIntegrations,
      teamMembers, setTeamMembers,
      createUser, updateUser, deactivateUser, reactivateUser,
      manualKpiData, setManualKpiData,
      workspacesList, setWorkspacesList, activeWorkspaceId, setActiveWorkspaceId,
      addWorkspace, editWorkspace, deleteWorkspace,
      addAsset, editAsset, deleteAsset,
      syncStatus, lastSyncedAt, forcePush, forceRefresh, resetRemoteState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
