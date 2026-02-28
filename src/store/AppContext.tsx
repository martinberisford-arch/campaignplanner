import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { ViewType, Campaign, Task, ApprovalItem, Asset, Role } from '../types';
import { campaigns as initialCampaigns, approvalItems as initialApprovals, assets as initialAssets } from '../data/mockData';
import { getPermissions, Permissions } from '../utils/permissions';

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
  
  // Actions
  updateTaskStatus: (campaignId: string, taskId: string, status: Task['status']) => void;
  updateApprovalStatus: (approvalId: string, reviewerUserId: string, status: ApprovalItem['status'], comment?: string) => void;
  addCampaign: (campaign: Campaign) => void;
  deleteCampaign: (campaignId: string) => void;
  addApproval: (approval: ApprovalItem) => void;
  addApprovalComment: (approvalId: string, comment: string, author: string) => void;
  notifications: number;
  
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
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEY_USERS = 'campaignos_users';
const STORAGE_KEY_AUTH = 'campaignos_auth';

const defaultIntegrations: IntegrationSetting[] = [
  { name: 'Google Analytics 4', status: 'connected', icon: '📊', desc: 'Campaign performance tracking' },
  { name: 'Meta Business Suite', status: 'connected', icon: '📘', desc: 'Social media ad management' },
  { name: 'Microsoft 365', status: 'connected', icon: '📧', desc: 'Calendar & email integration' },
  { name: 'Slack', status: 'available', icon: '💬', desc: 'Team notifications & alerts' },
  { name: 'Salesforce', status: 'available', icon: '☁️', desc: 'CRM data sync' },
  { name: 'HubSpot', status: 'available', icon: '🟠', desc: 'Marketing automation' },
  { name: 'Jira', status: 'available', icon: '📋', desc: 'Project management sync' },
  { name: 'WordPress', status: 'available', icon: '📝', desc: 'CMS content publishing' },
  { name: 'Adobe Workfront', status: 'available', icon: '🎨', desc: 'Creative workflow management' },
];

const defaultNotifications: NotificationSetting[] = [
  { label: 'Email notifications for approvals', enabled: true },
  { label: 'Slack alerts for campaign updates', enabled: true },
  { label: 'Weekly performance digest', enabled: true },
  { label: 'Real-time comment mentions', enabled: false },
  { label: 'Budget threshold alerts', enabled: true },
];

const defaultTeamMembers: TeamMember[] = [
  { id: 'u1', name: 'Sarah Mitchell', email: 'admin@campaignos.com', role: 'admin', avatar: 'SM', department: 'Communications', password: 'admin123', createdAt: '2024-06-01', lastLogin: '2025-01-22', active: true },
  { id: 'u2', name: 'James Richardson', email: 'editor@campaignos.com', role: 'editor', avatar: 'JR', department: 'Marketing', password: 'editor123', createdAt: '2024-06-15', lastLogin: '2025-01-21', active: true },
  { id: 'u3', name: 'Priya Sharma', email: 'contributor@campaignos.com', role: 'contributor', avatar: 'PS', department: 'Digital', password: 'contributor123', createdAt: '2024-07-01', lastLogin: '2025-01-20', active: true },
  { id: 'u4', name: 'Marcus Johnson', email: 'marcus.j@nhs.net', role: 'editor', avatar: 'MJ', department: 'Strategy', password: 'pass123', createdAt: '2024-07-15', active: true },
  { id: 'u5', name: 'Emma Williams', email: 'viewer@campaignos.com', role: 'viewer', avatar: 'EW', department: 'Finance', password: 'viewer123', createdAt: '2024-08-01', active: true },
  { id: 'u6', name: 'David Chen', email: 'david.c@nhs.net', role: 'contributor', avatar: 'DC', department: 'HR', password: 'pass123', createdAt: '2024-08-15', active: true },
];

function loadUsers(): TeamMember[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultTeamMembers;
}

function saveUsers(users: TeamMember[]) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {}
}

function loadAuth(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTH);
  } catch {}
  return null;
}

function saveAuth(userId: string | null) {
  try {
    if (userId) {
      localStorage.setItem(STORAGE_KEY_AUTH, userId);
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch {}
}

const viewerPermissions = getPermissions('viewer');

export function AppProvider({ children }: { children: ReactNode }) {
  const [teamMembers, setTeamMembersState] = useState<TeamMember[]>(loadUsers);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    const authId = loadAuth();
    if (authId) {
      const users = loadUsers();
      return users.find(u => u.id === authId && u.active) || null;
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);

  const [currentView, setCurrentView] = useState<ViewType>(currentUser ? 'dashboard' : 'login');
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>({
    name: 'NHS England Comms',
    organisation: 'NHS England',
    sector: 'Public Sector - Healthcare',
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(defaultNotifications);
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>(defaultIntegrations);
  const [manualKpiData, setManualKpiData] = useState<Record<string, number>>({});

  const permissions = currentUser ? getPermissions(currentUser.role) : viewerPermissions;

  // Persist users whenever they change
  useEffect(() => {
    saveUsers(teamMembers);
  }, [teamMembers]);

  const setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>> = (action) => {
    setTeamMembersState(action);
  };

  const login = useCallback((email: string, password: string) => {
    const user = teamMembers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { success: false, error: 'Invalid email or password. Please try again.' };
    if (!user.active) return { success: false, error: 'This account has been deactivated. Contact your administrator.' };
    
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    setTeamMembersState(prev => prev.map(u => u.id === user.id ? updatedUser : u));
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

  const setView = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  const updateTaskStatus = useCallback((campaignId: string, taskId: string, status: Task['status']) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? {
        ...c,
        tasks: c.tasks.map(t => t.id === taskId ? { ...t, status } : t)
      } : c
    ));
  }, []);

  const updateApprovalStatus = useCallback((approvalId: string, reviewerUserId: string, status: ApprovalItem['status'], comment?: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === approvalId ? {
        ...a,
        status,
        updatedAt: new Date().toISOString(),
        reviewers: a.reviewers.map(r =>
          r.user.id === reviewerUserId ? { ...r, status: status as any, comment, date: new Date().toISOString().split('T')[0] } : r
        )
      } : a
    ));
  }, []);

  const addCampaign = useCallback((campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  }, []);

  const deleteCampaign = useCallback((campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  }, []);

  const addApproval = useCallback((approval: ApprovalItem) => {
    setApprovals(prev => [approval, ...prev]);
  }, []);

  const addApprovalComment = useCallback((approvalId: string, comment: string, _author: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === approvalId ? {
        ...a,
        updatedAt: new Date().toISOString(),
        reviewers: a.reviewers.map((r, i) =>
          i === 0 ? { ...r, comment: comment } : r
        )
      } : a
    ));
  }, []);

  const createUser = useCallback((userData: Omit<TeamMember, 'id' | 'createdAt' | 'active'> & { password: string }) => {
    const existingEmail = teamMembers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingEmail) return { success: false, error: 'A user with this email already exists.' };
    
    const newUser: TeamMember = {
      ...userData,
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      active: true,
    };
    setTeamMembersState(prev => [...prev, newUser]);
    return { success: true };
  }, [teamMembers]);

  const updateUser = useCallback((id: string, updates: Partial<TeamMember>) => {
    setTeamMembersState(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const deactivateUser = useCallback((id: string) => {
    setTeamMembersState(prev => prev.map(u => u.id === id ? { ...u, active: false } : u));
  }, []);

  const reactivateUser = useCallback((id: string) => {
    setTeamMembersState(prev => prev.map(u => u.id === id ? { ...u, active: true } : u));
  }, []);

  const notifications = approvals.filter(a => a.status === 'pending').length + 3;

  return (
    <AppContext.Provider value={{
      isAuthenticated, currentUser, permissions, login, logout,
      currentView, setView, campaigns, setCampaigns,
      approvals, setApprovals, assets, setAssets,
      selectedCampaignId, setSelectedCampaignId,
      sidebarOpen, setSidebarOpen,
      updateTaskStatus, updateApprovalStatus,
      addCampaign, deleteCampaign, addApproval, addApprovalComment,
      notifications,
      workspaceSettings, setWorkspaceSettings,
      notificationSettings, setNotificationSettings,
      integrations, setIntegrations,
      teamMembers, setTeamMembers,
      createUser, updateUser, deactivateUser, reactivateUser,
      manualKpiData, setManualKpiData,
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
