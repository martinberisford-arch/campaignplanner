import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { ViewType, Campaign, Task, ApprovalItem, ApprovalStatus, Asset, Role, AppNotification, ChecklistItem, Workspace, MarketingIdea, AnalyticsEvent, KPIChannelEntry, KPITimeSeriesEntry, KPISentimentEntry, Tool, EditableKPI, EditableAudience, PublishedContent, ContentPattern, BackupLog, MessageTemplate, DomainMapping, MessageLog } from '../types';
import { updateOrCreatePattern } from '../utils/adaptiveEngine';
import { campaigns as initialCampaigns, approvalItems as initialApprovals, assets as initialAssets, workspaces as initialWorkspaces } from '../data/mockData';
import { MARKETING_IDEAS } from '../data/marketingIdeas';
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

  // KPI manual data (legacy)
  manualKpiData: Record<string, number>;
  setManualKpiData: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  // KPI CRUD data with source tracking
  kpiChannelData: KPIChannelEntry[];
  setKpiChannelData: React.Dispatch<React.SetStateAction<KPIChannelEntry[]>>;
  addKpiChannel: (entry: KPIChannelEntry) => void;
  editKpiChannel: (id: string, updates: Partial<KPIChannelEntry>) => void;
  deleteKpiChannel: (id: string) => void;
  kpiTimeSeriesData: KPITimeSeriesEntry[];
  setKpiTimeSeriesData: React.Dispatch<React.SetStateAction<KPITimeSeriesEntry[]>>;
  addKpiTimeSeries: (entry: KPITimeSeriesEntry) => void;
  editKpiTimeSeries: (id: string, updates: Partial<KPITimeSeriesEntry>) => void;
  deleteKpiTimeSeries: (id: string) => void;
  kpiSentimentData: KPISentimentEntry[];
  setKpiSentimentData: React.Dispatch<React.SetStateAction<KPISentimentEntry[]>>;
  addKpiSentiment: (entry: KPISentimentEntry) => void;
  editKpiSentiment: (id: string, updates: Partial<KPISentimentEntry>) => void;
  deleteKpiSentiment: (id: string) => void;

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

  // Marketing Ideas
  marketingIdeas: MarketingIdea[];
  setMarketingIdeas: React.Dispatch<React.SetStateAction<MarketingIdea[]>>;
  updateMarketingIdea: (id: string, updates: Partial<MarketingIdea>) => void;
  activateIdea: (id: string, campaignId?: string) => void;
  analyticsEvents: AnalyticsEvent[];
  trackEvent: (event: string, ideaId?: string, campaignId?: string, metadata?: Record<string, string>) => void;

  // Sync
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  forcePush: () => void;
  forceRefresh: () => void;
  resetRemoteState: () => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Tool Registry
  tools: Tool[];
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>;
  addTool: (tool: Tool) => void;
  editTool: (id: string, updates: Partial<Tool>) => void;
  deleteTool: (id: string) => void;
  reorderTools: (tools: Tool[]) => void;

  // AI Command log
  aiCommandLog: string[];
  addAiCommand: (cmd: string) => void;

  // Adaptive Ideation Engine
  editableKpis: EditableKPI[];
  setEditableKpis: React.Dispatch<React.SetStateAction<EditableKPI[]>>;
  addEditableKpi: (kpi: EditableKPI) => void;
  updateEditableKpi: (id: string, updates: Partial<EditableKPI>) => void;
  archiveEditableKpi: (id: string) => void;
  restoreEditableKpi: (id: string) => void;

  editableAudiences: EditableAudience[];
  setEditableAudiences: React.Dispatch<React.SetStateAction<EditableAudience[]>>;
  addEditableAudience: (audience: EditableAudience) => void;
  updateEditableAudience: (id: string, updates: Partial<EditableAudience>) => void;
  archiveEditableAudience: (id: string) => void;
  restoreEditableAudience: (id: string) => void;

  publishedContent: PublishedContent[];
  setPublishedContent: React.Dispatch<React.SetStateAction<PublishedContent[]>>;
  addPublishedContent: (content: PublishedContent) => void;
  updatePublishedContent: (id: string, updates: Partial<PublishedContent>) => void;
  deletePublishedContent: (id: string) => void;

  contentPatterns: ContentPattern[];
  setContentPatterns: React.Dispatch<React.SetStateAction<ContentPattern[]>>;
  resetContentPatterns: () => void;

  // Backup & Restore
  backupLogs: BackupLog[];
  addBackupLog: (log: BackupLog) => void;
  getBackupData: (includeLearning: boolean) => Record<string, unknown[]>;
  restoreMerge: (data: Record<string, unknown[]>) => void;
  restoreFullReplace: (data: Record<string, unknown[]>) => void;

  // Messaging Engine
  messageTemplates: MessageTemplate[];
  addMessageTemplate: (t: MessageTemplate) => void;
  updateMessageTemplate: (id: string, updates: Partial<MessageTemplate>) => void;
  deleteMessageTemplate: (id: string) => void;
  duplicateMessageTemplate: (id: string) => void;
  domainMappings: DomainMapping[];
  addDomainMapping: (m: DomainMapping) => void;
  updateDomainMapping: (id: string, updates: Partial<DomainMapping>) => void;
  deleteDomainMapping: (id: string) => void;
  messageLogs: MessageLog[];
  addMessageLog: (log: MessageLog) => void;
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

const defaultTools: Tool[] = [
  { id: 't1', title: 'Campaign Manager', description: 'Create, manage and track campaigns across channels with Kanban boards, timelines and Gantt views.', icon: 'FolderKanban', route: 'campaigns', isExternal: false, isEnabled: true, displayOrder: 0, category: 'core', badge: undefined, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't2', title: 'AI Brief Generator', description: 'Generate complete campaign briefs from plain English prompts. No marketing jargon needed.', icon: 'Sparkles', route: 'ai-brief', isExternal: false, isEnabled: true, displayOrder: 1, category: 'core', badge: 'AI', badgeColor: 'violet', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't3', title: 'Campaign Calendar', description: 'Visual monthly calendar and timeline view of all campaigns with drag-and-drop scheduling.', icon: 'Calendar', route: 'calendar', isExternal: false, isEnabled: true, displayOrder: 2, category: 'core', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't4', title: 'Approval Workflows', description: 'Submit campaigns for review, track approvals, and maintain full audit trails for governance.', icon: 'CheckCircle2', route: 'approvals', isExternal: false, isEnabled: true, displayOrder: 3, category: 'core', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't5', title: 'KPI Dashboard', description: 'Track impressions, clicks, conversions and ROI across channels. Add data manually or via integrations.', icon: 'BarChart3', route: 'kpi', isExternal: false, isEnabled: true, displayOrder: 4, category: 'analytics', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't6', title: 'Asset Library', description: 'Central repository for campaign visuals, documents, guidelines and brand assets with AI tagging.', icon: 'ImageIcon', route: 'assets', isExternal: false, isEnabled: true, displayOrder: 5, category: 'core', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't7', title: 'Marketing Strategy', description: 'Growth coverage radar, strategic recommendations engine, and KPI alignment matrix.', icon: 'Target', route: 'mkt-strategy', isExternal: false, isEnabled: true, displayOrder: 6, category: 'marketing', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't8', title: 'Growth Ideas (139)', description: 'Browse 139 proven marketing ideas, filtered by budget, timeline and category. Activate directly into campaigns.', icon: 'Lightbulb', route: 'mkt-ideas', isExternal: false, isEnabled: true, displayOrder: 7, category: 'marketing', badge: '139', badgeColor: 'amber', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't9', title: 'Marketing Calendar', description: 'Awareness days, campaign scheduling and intelligence panel with past performance context.', icon: 'CalendarDays', route: 'mkt-calendar', isExternal: false, isEnabled: true, displayOrder: 8, category: 'marketing', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't10', title: 'Performance Review', description: 'KPI trends vs targets, idea effectiveness rankings, and campaign ROI proxy analysis.', icon: 'TrendingUp', route: 'mkt-performance', isExternal: false, isEnabled: true, displayOrder: 9, category: 'analytics', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't11', title: 'Settings & Admin', description: 'Workspace settings, team management, integrations, security and compliance configuration.', icon: 'Settings', route: 'settings', isExternal: false, isEnabled: true, displayOrder: 10, category: 'admin', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't12', title: 'NHS England Hub', description: 'Access the NHS England intranet for brand guidelines, policies and central communications.', icon: 'ExternalLink', externalUrl: 'https://www.england.nhs.uk', isExternal: true, isEnabled: true, displayOrder: 11, category: 'external', badge: 'External', badgeColor: 'blue', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't13', title: 'GCS Resources', description: 'Government Communication Service frameworks, templates and campaign planning toolkits.', icon: 'ExternalLink', externalUrl: 'https://gcs.civilservice.gov.uk', isExternal: true, isEnabled: true, displayOrder: 12, category: 'external', badge: 'External', badgeColor: 'blue', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 't14', title: 'Canva', description: 'Design social media graphics, presentations and campaign visuals with your brand kit.', icon: 'Palette', externalUrl: 'https://www.canva.com', isExternal: true, isEnabled: true, displayOrder: 13, category: 'external', badge: 'External', badgeColor: 'teal', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

const defaultMessageTemplates: MessageTemplate[] = [
  {
    id: 'mt1', name: 'Event Announcement', description: 'Announce an upcoming event with key details', type: 'whatsapp',
    baseStructure: '*{{title}}*\n\n📍 {{location}}\n📅 {{startDate}} at {{time}}\n\n{{description}}\n\nBook your place 👇\n{{url}}',
    charLimit: 500, isActive: true, domainPriority: '',
    placeholders: ['title', 'location', 'startDate', 'time', 'description', 'url'],
    variableSchema: {
      title: { label: 'Event Title', required: true, hint: 'The name of the event' },
      location: { label: 'Location', required: true, hint: 'Physical address or "Online"' },
      startDate: { label: 'Date', required: true, hint: 'e.g. 15 March 2025' },
      time: { label: 'Time', required: true, hint: 'e.g. 2:00 PM' },
      description: { label: 'Description', required: false, hint: 'Brief description of the event' },
      url: { label: 'Registration URL', required: true, hint: 'Full URL for booking' },
    },
    usageCount: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  {
    id: 'mt2', name: 'Staff Reminder', description: 'Quick reminder for internal staff', type: 'whatsapp',
    baseStructure: '📢 *Reminder: {{title}}*\n\n{{description}}\n\n⏰ Due: {{startDate}}\n\n{{url}}',
    charLimit: 500, isActive: true, domainPriority: '',
    placeholders: ['title', 'description', 'startDate', 'url'],
    variableSchema: {
      title: { label: 'Reminder Title', required: true },
      description: { label: 'Details', required: true },
      startDate: { label: 'Due Date / Date', required: true },
      url: { label: 'Link (optional)', required: false },
    },
    usageCount: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  {
    id: 'mt3', name: 'SMS Event Alert', description: 'Short SMS for event reminders', type: 'sms',
    baseStructure: '{{siteName}}: {{title}} - {{startDate}}. Info: {{url}}',
    charLimit: 160, isActive: true, domainPriority: '',
    placeholders: ['siteName', 'title', 'startDate', 'url'],
    variableSchema: {
      siteName: { label: 'Organisation Name', required: true },
      title: { label: 'Event / Update Title', required: true },
      startDate: { label: 'Date', required: true },
      url: { label: 'Short URL', required: true },
    },
    usageCount: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  {
    id: 'mt4', name: 'Campaign CTA', description: 'Drive action for a campaign', type: 'whatsapp',
    baseStructure: '🎯 *{{title}}*\n\n{{description}}\n\n✅ {{cta}}:\n{{url}}',
    charLimit: 500, isActive: true, domainPriority: '',
    placeholders: ['title', 'description', 'cta', 'url'],
    variableSchema: {
      title: { label: 'Campaign Title', required: true },
      description: { label: 'Benefit / Value', required: true },
      cta: { label: 'Call to Action', required: true, hint: 'e.g. "Sign up now"' },
      url: { label: 'Landing Page URL', required: true },
    },
    usageCount: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  {
    id: 'mt5', name: 'News Update', description: 'Share organisation news or updates', type: 'whatsapp',
    baseStructure: '📰 *{{title}}*\n\n{{description}}\n\n👉 Read more: {{url}}',
    charLimit: 500, isActive: true, domainPriority: '',
    placeholders: ['title', 'description', 'url'],
    variableSchema: {
      title: { label: 'News Headline', required: true },
      description: { label: 'Summary', required: true },
      url: { label: 'Article URL', required: true },
    },
    usageCount: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
];

const defaultDomainMappings: DomainMapping[] = [
  {
    id: 'dm1', domain: 'england.nhs.uk',
    fieldMap: { title: 'og:title', description: 'og:description', startDate: 'event:start_date', location: 'event:location', price: 'event:price' },
    createdAt: '2025-01-01',
  },
];

const defaultEditableKpis: EditableKPI[] = [
  { id: 'ek1', name: 'Website Traffic', description: 'Number of unique visitors to campaign landing pages', category: 'awareness', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek2', name: 'Social Reach', description: 'Total reach across all social media platforms', category: 'awareness', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek3', name: 'Email Open Rate', description: 'Percentage of recipients who opened campaign emails', category: 'engagement', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek4', name: 'Click-Through Rate', description: 'Percentage of viewers who clicked on campaign CTAs', category: 'engagement', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek5', name: 'Lead Generation', description: 'Number of new leads captured through campaigns', category: 'conversion', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek6', name: 'Application Submissions', description: 'Number of completed applications or sign-ups', category: 'conversion', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek7', name: 'Return Visitors', description: 'Percentage of visitors who return within 30 days', category: 'retention', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek8', name: 'Newsletter Retention', description: 'Percentage of subscribers who remain subscribed over 6 months', category: 'retention', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek9', name: 'Referral Rate', description: 'Percentage of users who refer others to the service', category: 'conversion', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ek10', name: 'Event Attendance', description: 'Number of attendees at campaign events', category: 'engagement', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

const defaultEditableAudiences: EditableAudience[] = [
  { id: 'ea1', name: 'Healthcare Professionals', description: 'Doctors, nurses, and clinical staff', type: 'clinical', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ea2', name: 'General Public', description: 'Members of the public and potential service users', type: 'public', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ea3', name: 'NHS Staff', description: 'Internal NHS employees across all departments', type: 'internal', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ea4', name: 'Partner Organisations', description: 'ICS partners, local authorities, and third sector', type: 'partner', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ea5', name: 'Care Providers', description: 'Social care providers and care home operators', type: 'provider', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ea6', name: 'Job Seekers', description: 'People looking for careers in healthcare', type: 'external', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ea7', name: 'Students', description: 'University and college students considering healthcare careers', type: 'external', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ea8', name: 'Volunteers', description: 'Current and potential NHS volunteers', type: 'external', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

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
  marketingIdeas?: MarketingIdea[];
  analyticsEvents?: AnalyticsEvent[];
  kpiChannelData?: KPIChannelEntry[];
  kpiTimeSeriesData?: KPITimeSeriesEntry[];
  kpiSentimentData?: KPISentimentEntry[];
  tools?: Tool[];
  editableKpis?: EditableKPI[];
  editableAudiences?: EditableAudience[];
  publishedContent?: PublishedContent[];
  contentPatterns?: ContentPattern[];
  backupLogs?: BackupLog[];
  messageTemplates?: MessageTemplate[];
  domainMappings?: DomainMapping[];
  messageLogs?: MessageLog[];
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
  const [currentView, setCurrentView] = useState<ViewType>(currentUser ? 'hub' : 'login');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- Theme (local only, persisted per-browser) ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('campaignos_theme');
      return stored === 'light' ? 'light' : 'dark';
    } catch { return 'dark'; }
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('campaignos_theme', next); } catch { /* noop */ }
      return next;
    });
  }, []);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

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

  // KPI CRUD data with source tracking
  const [kpiChannelData, setKpiChannelData] = useState<KPIChannelEntry[]>([
    { id: 'kc1', channel: 'Social Media', impressions: 4200000, clicks: 125000, conversions: 8400, spend: 42000, roi: 3.2, source: 'seed', sourceLabel: 'Demo seed data — replace with your actuals', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kc2', channel: 'Email', impressions: 890000, clicks: 78000, conversions: 5200, spend: 8500, roi: 6.1, source: 'seed', sourceLabel: 'Demo seed data — replace with your actuals', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kc3', channel: 'Paid Search', impressions: 1560000, clicks: 62000, conversions: 4100, spend: 28000, roi: 2.4, source: 'seed', sourceLabel: 'Demo seed data — replace with your actuals', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kc4', channel: 'Display', impressions: 3200000, clicks: 28000, conversions: 1200, spend: 18000, roi: 1.8, source: 'seed', sourceLabel: 'Demo seed data — replace with your actuals', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kc5', channel: 'Content', impressions: 680000, clicks: 42000, conversions: 3800, spend: 12000, roi: 4.5, source: 'seed', sourceLabel: 'Demo seed data — replace with your actuals', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kc6', channel: 'Events', impressions: 120000, clicks: 8500, conversions: 2100, spend: 35000, roi: 2.1, source: 'seed', sourceLabel: 'Demo seed data — replace with your actuals', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
  ]);

  const [kpiTimeSeriesData, setKpiTimeSeriesData] = useState<KPITimeSeriesEntry[]>([
    { id: 'kt1', week: 'W1', impressions: 450000, clicks: 12500, leads: 890, spend: 8200, applications: 1200, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kt2', week: 'W2', impressions: 620000, clicks: 18200, leads: 1340, spend: 11500, applications: 2800, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kt3', week: 'W3', impressions: 780000, clicks: 24800, leads: 1890, spend: 14200, applications: 4500, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kt4', week: 'W4', impressions: 920000, clicks: 31500, leads: 2450, spend: 16800, applications: 6200, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kt5', week: 'W5', impressions: 1050000, clicks: 36200, leads: 2980, spend: 18500, applications: 8100, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kt6', week: 'W6', impressions: 1180000, clicks: 42100, leads: 3520, spend: 21200, applications: 10400, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kt7', week: 'W7', impressions: 1320000, clicks: 48900, leads: 4100, spend: 23800, applications: 11800, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'kt8', week: 'W8', impressions: 1480000, clicks: 55200, leads: 4680, spend: 26500, applications: 12840, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
  ]);

  const [kpiSentimentData, setKpiSentimentData] = useState<KPISentimentEntry[]>([
    { id: 'ks1', date: 'Jan 6', positive: 72, neutral: 20, negative: 8, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'ks2', date: 'Jan 13', positive: 68, neutral: 22, negative: 10, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'ks3', date: 'Jan 20', positive: 75, neutral: 18, negative: 7, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'ks4', date: 'Jan 27', positive: 78, neutral: 16, negative: 6, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'ks5', date: 'Feb 3', positive: 82, neutral: 13, negative: 5, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
    { id: 'ks6', date: 'Feb 10', positive: 80, neutral: 15, negative: 5, source: 'seed', sourceLabel: 'Demo seed data', addedAt: '2025-01-01T00:00:00', addedBy: 'System' },
  ]);

  const [workspacesList, setWorkspacesList] = useState<Workspace[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceIdRaw] = useState<string | null>(null);
  const [marketingIdeas, setMarketingIdeas] = useState<MarketingIdea[]>(MARKETING_IDEAS);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [tools, setTools] = useState<Tool[]>(defaultTools);
  const [aiCommandLog, setAiCommandLog] = useState<string[]>([]);

  // Adaptive Ideation Engine state
  const [editableKpis, setEditableKpis] = useState<EditableKPI[]>(defaultEditableKpis);
  const [editableAudiences, setEditableAudiences] = useState<EditableAudience[]>(defaultEditableAudiences);
  const [publishedContent, setPublishedContent] = useState<PublishedContent[]>([]);
  const [contentPatterns, setContentPatterns] = useState<ContentPattern[]>([]);
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(defaultMessageTemplates);
  const [domainMappings, setDomainMappings] = useState<DomainMapping[]>(defaultDomainMappings);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);

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
    marketingIdeas,
    analyticsEvents,
    kpiChannelData,
    kpiTimeSeriesData,
    kpiSentimentData,
    tools,
    editableKpis,
    editableAudiences,
    publishedContent,
    contentPatterns,
    backupLogs,
    messageTemplates,
    domainMappings,
    messageLogs,
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
    if (state.marketingIdeas) setMarketingIdeas(state.marketingIdeas);
    if (state.analyticsEvents) setAnalyticsEvents(state.analyticsEvents);
    if (state.kpiChannelData) setKpiChannelData(state.kpiChannelData);
    if (state.kpiTimeSeriesData) setKpiTimeSeriesData(state.kpiTimeSeriesData);
    if (state.kpiSentimentData) setKpiSentimentData(state.kpiSentimentData);
    if (state.tools) setTools(state.tools);
    if (state.editableKpis) setEditableKpis(state.editableKpis);
    if (state.editableAudiences) setEditableAudiences(state.editableAudiences);
    if (state.publishedContent) setPublishedContent(state.publishedContent);
    if (state.contentPatterns) setContentPatterns(state.contentPatterns);
    if (state.backupLogs) setBackupLogs(state.backupLogs);
    if (state.messageTemplates) setMessageTemplates(state.messageTemplates);
    if (state.domainMappings) setDomainMappings(state.domainMappings);
    if (state.messageLogs) setMessageLogs(state.messageLogs);
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
              setCurrentView('hub');
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
  }, [campaigns, approvals, assets, appNotifications, teamMembers, workspaceSettings, notificationSettings, integrations, manualKpiData, workspacesList, activeWorkspaceId, marketingIdeas, analyticsEvents, kpiChannelData, kpiTimeSeriesData, kpiSentimentData, tools, editableKpis, editableAudiences, publishedContent, contentPatterns, backupLogs, messageTemplates, domainMappings, messageLogs, schedulePush]);

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
    setCurrentView('hub');
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

  // ==================== KPI CRUD ====================

  const addKpiChannel = useCallback((entry: KPIChannelEntry) => {
    setKpiChannelData(prev => [...prev, entry]);
  }, []);
  const editKpiChannel = useCallback((id: string, updates: Partial<KPIChannelEntry>) => {
    setKpiChannelData(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);
  const deleteKpiChannel = useCallback((id: string) => {
    setKpiChannelData(prev => prev.filter(e => e.id !== id));
  }, []);
  const addKpiTimeSeries = useCallback((entry: KPITimeSeriesEntry) => {
    setKpiTimeSeriesData(prev => [...prev, entry]);
  }, []);
  const editKpiTimeSeries = useCallback((id: string, updates: Partial<KPITimeSeriesEntry>) => {
    setKpiTimeSeriesData(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);
  const deleteKpiTimeSeries = useCallback((id: string) => {
    setKpiTimeSeriesData(prev => prev.filter(e => e.id !== id));
  }, []);
  const addKpiSentiment = useCallback((entry: KPISentimentEntry) => {
    setKpiSentimentData(prev => [...prev, entry]);
  }, []);
  const editKpiSentiment = useCallback((id: string, updates: Partial<KPISentimentEntry>) => {
    setKpiSentimentData(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);
  const deleteKpiSentiment = useCallback((id: string) => {
    setKpiSentimentData(prev => prev.filter(e => e.id !== id));
  }, []);

  // ==================== MARKETING IDEAS ====================

  const updateMarketingIdea = useCallback((id: string, updates: Partial<MarketingIdea>) => {
    setMarketingIdeas(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const activateIdea = useCallback((id: string, campaignId?: string) => {
    setMarketingIdeas(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'activated' as const, activatedAt: new Date().toISOString(), campaignId } : i
    ));
  }, []);

  const trackEvent = useCallback((event: string, ideaId?: string, campaignId?: string, metadata?: Record<string, string>) => {
    setAnalyticsEvents(prev => [...prev, {
      event, ideaId, campaignId,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    }]);
  }, []);

  // ==================== TOOL REGISTRY CRUD ====================

  const addTool = useCallback((tool: Tool) => {
    setTools(prev => [...prev, tool]);
  }, []);

  const editTool = useCallback((id: string, updates: Partial<Tool>) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  }, []);

  const deleteTool = useCallback((id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
  }, []);

  const reorderTools = useCallback((reorderedTools: Tool[]) => {
    setTools(reorderedTools.map((t, i) => ({ ...t, displayOrder: i })));
  }, []);

  const addAiCommand = useCallback((cmd: string) => {
    setAiCommandLog(prev => [cmd, ...prev].slice(0, 50));
  }, []);

  // ==================== ADAPTIVE IDEATION CRUD ====================

  const addEditableKpi = useCallback((kpi: EditableKPI) => {
    setEditableKpis(prev => [...prev, kpi]);
  }, []);

  const updateEditableKpi = useCallback((id: string, updates: Partial<EditableKPI>) => {
    setEditableKpis(prev => prev.map(k => k.id === id ? { ...k, ...updates, updatedAt: new Date().toISOString() } : k));
  }, []);

  const archiveEditableKpi = useCallback((id: string) => {
    setEditableKpis(prev => prev.map(k => k.id === id ? { ...k, isActive: false, updatedAt: new Date().toISOString() } : k));
  }, []);

  const restoreEditableKpi = useCallback((id: string) => {
    setEditableKpis(prev => prev.map(k => k.id === id ? { ...k, isActive: true, updatedAt: new Date().toISOString() } : k));
  }, []);

  const addEditableAudience = useCallback((audience: EditableAudience) => {
    setEditableAudiences(prev => [...prev, audience]);
  }, []);

  const updateEditableAudience = useCallback((id: string, updates: Partial<EditableAudience>) => {
    setEditableAudiences(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
  }, []);

  const archiveEditableAudience = useCallback((id: string) => {
    setEditableAudiences(prev => prev.map(a => a.id === id ? { ...a, isActive: false, updatedAt: new Date().toISOString() } : a));
  }, []);

  const restoreEditableAudience = useCallback((id: string) => {
    setEditableAudiences(prev => prev.map(a => a.id === id ? { ...a, isActive: true, updatedAt: new Date().toISOString() } : a));
  }, []);

  const addPublishedContent = useCallback((content: PublishedContent) => {
    setPublishedContent(prev => [content, ...prev]);
    // Trigger pattern recalculation
    if (content.theme) {
      setContentPatterns(prev => updateOrCreatePattern(prev, content, content.theme!));
    }
  }, []);

  const updatePublishedContent = useCallback((id: string, updates: Partial<PublishedContent>) => {
    setPublishedContent(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deletePublishedContent = useCallback((id: string) => {
    setPublishedContent(prev => prev.filter(c => c.id !== id));
  }, []);

  const resetContentPatterns = useCallback(() => {
    setContentPatterns([]);
  }, []);

  // ==================== MESSAGING ENGINE CRUD ====================

  const addMessageTemplate = useCallback((t: MessageTemplate) => {
    setMessageTemplates(prev => [...prev, t]);
  }, []);

  const updateMessageTemplate = useCallback((id: string, updates: Partial<MessageTemplate>) => {
    setMessageTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  }, []);

  const deleteMessageTemplate = useCallback((id: string) => {
    setMessageTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const duplicateMessageTemplate = useCallback((id: string) => {
    setMessageTemplates(prev => {
      const original = prev.find(t => t.id === id);
      if (!original) return prev;
      const copy: MessageTemplate = {
        ...original,
        id: `mt-${Date.now()}`,
        name: `${original.name} (Copy)`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [...prev, copy];
    });
  }, []);

  const addDomainMapping = useCallback((m: DomainMapping) => {
    setDomainMappings(prev => [...prev, m]);
  }, []);

  const updateDomainMapping = useCallback((id: string, updates: Partial<DomainMapping>) => {
    setDomainMappings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteDomainMapping = useCallback((id: string) => {
    setDomainMappings(prev => prev.filter(m => m.id !== id));
  }, []);

  const addMessageLog = useCallback((log: MessageLog) => {
    setMessageLogs(prev => [log, ...prev]);
    // Increment template usage count
    setMessageTemplates(prev => prev.map(t => t.id === log.templateId ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date().toISOString() } : t));
  }, []);

  // ==================== BACKUP & RESTORE ====================

  const addBackupLog = useCallback((log: BackupLog) => {
    setBackupLogs(prev => [log, ...prev]);
  }, []);

  const getBackupData = useCallback((includeLearning: boolean): Record<string, unknown[]> => {
    const data: Record<string, unknown[]> = {
      campaigns,
      approvals,
      assets,
      workspacesList,
      tools,
      editableKpis,
      editableAudiences,
      kpiChannelData,
      kpiTimeSeriesData,
      kpiSentimentData,
      marketingIdeas,
      publishedContent,
    };
    if (includeLearning) {
      data.contentPatterns = contentPatterns;
      data.analyticsEvents = analyticsEvents;
    }
    return data;
  }, [campaigns, approvals, assets, workspacesList, tools, editableKpis, editableAudiences, kpiChannelData, kpiTimeSeriesData, kpiSentimentData, marketingIdeas, publishedContent, contentPatterns, analyticsEvents]);

  const restoreMerge = useCallback((data: Record<string, unknown[]>) => {
    if (data.campaigns) {
      const incoming = data.campaigns as Campaign[];
      setCampaigns(prev => {
        const merged = [...prev];
        incoming.forEach(ic => {
          const idx = merged.findIndex(c => c.id === ic.id);
          if (idx >= 0) merged[idx] = ic;
          else merged.push(ic);
        });
        return merged;
      });
    }
    if (data.approvals) {
      const incoming = data.approvals as ApprovalItem[];
      setApprovals(prev => {
        const merged = [...prev];
        incoming.forEach(ia => {
          const idx = merged.findIndex(a => a.id === ia.id);
          if (idx >= 0) merged[idx] = ia;
          else merged.push(ia);
        });
        return merged;
      });
    }
    if (data.assets) {
      const incoming = data.assets as Asset[];
      setAssets(prev => {
        const merged = [...prev];
        incoming.forEach(ia => {
          const idx = merged.findIndex(a => a.id === ia.id);
          if (idx >= 0) merged[idx] = ia;
          else merged.push(ia);
        });
        return merged;
      });
    }
    if (data.workspacesList) {
      const incoming = data.workspacesList as Workspace[];
      setWorkspacesList(prev => {
        const merged = [...prev];
        incoming.forEach(iw => {
          const idx = merged.findIndex(w => w.id === iw.id);
          if (idx >= 0) merged[idx] = iw;
          else merged.push(iw);
        });
        return merged;
      });
    }
    if (data.tools) {
      const incoming = data.tools as Tool[];
      setTools(prev => {
        const merged = [...prev];
        incoming.forEach(it => {
          const idx = merged.findIndex(t => t.id === it.id);
          if (idx >= 0) merged[idx] = it;
          else merged.push(it);
        });
        return merged;
      });
    }
    if (data.editableKpis) {
      const incoming = data.editableKpis as EditableKPI[];
      setEditableKpis(prev => {
        const merged = [...prev];
        incoming.forEach(ik => {
          const idx = merged.findIndex(k => k.id === ik.id);
          if (idx >= 0) merged[idx] = ik;
          else merged.push(ik);
        });
        return merged;
      });
    }
    if (data.editableAudiences) {
      const incoming = data.editableAudiences as EditableAudience[];
      setEditableAudiences(prev => {
        const merged = [...prev];
        incoming.forEach(ia => {
          const idx = merged.findIndex(a => a.id === ia.id);
          if (idx >= 0) merged[idx] = ia;
          else merged.push(ia);
        });
        return merged;
      });
    }
    if (data.kpiChannelData) {
      const incoming = data.kpiChannelData as KPIChannelEntry[];
      setKpiChannelData(prev => {
        const merged = [...prev];
        incoming.forEach(ik => {
          const idx = merged.findIndex(k => k.id === ik.id);
          if (idx >= 0) merged[idx] = ik;
          else merged.push(ik);
        });
        return merged;
      });
    }
    if (data.kpiTimeSeriesData) {
      const incoming = data.kpiTimeSeriesData as KPITimeSeriesEntry[];
      setKpiTimeSeriesData(prev => {
        const merged = [...prev];
        incoming.forEach(ik => {
          const idx = merged.findIndex(k => k.id === ik.id);
          if (idx >= 0) merged[idx] = ik;
          else merged.push(ik);
        });
        return merged;
      });
    }
    if (data.kpiSentimentData) {
      const incoming = data.kpiSentimentData as KPISentimentEntry[];
      setKpiSentimentData(prev => {
        const merged = [...prev];
        incoming.forEach(ik => {
          const idx = merged.findIndex(k => k.id === ik.id);
          if (idx >= 0) merged[idx] = ik;
          else merged.push(ik);
        });
        return merged;
      });
    }
    if (data.marketingIdeas) {
      const incoming = data.marketingIdeas as MarketingIdea[];
      setMarketingIdeas(prev => {
        const merged = [...prev];
        incoming.forEach(im => {
          const idx = merged.findIndex(m => m.id === im.id);
          if (idx >= 0) merged[idx] = im;
          else merged.push(im);
        });
        return merged;
      });
    }
    if (data.publishedContent) {
      const incoming = data.publishedContent as PublishedContent[];
      setPublishedContent(prev => {
        const merged = [...prev];
        incoming.forEach(ip => {
          const idx = merged.findIndex(p => p.id === ip.id);
          if (idx >= 0) merged[idx] = ip;
          else merged.push(ip);
        });
        return merged;
      });
    }
    if (data.contentPatterns) {
      const incoming = data.contentPatterns as ContentPattern[];
      setContentPatterns(prev => {
        const merged = [...prev];
        incoming.forEach(ip => {
          const idx = merged.findIndex(p => p.id === ip.id);
          if (idx >= 0) merged[idx] = ip;
          else merged.push(ip);
        });
        return merged;
      });
    }
    if (data.analyticsEvents) {
      const incoming = data.analyticsEvents as AnalyticsEvent[];
      setAnalyticsEvents(prev => [...prev, ...incoming]);
    }
  }, []);

  const restoreFullReplace = useCallback((data: Record<string, unknown[]>) => {
    if (data.campaigns) setCampaigns(data.campaigns as Campaign[]);
    if (data.approvals) setApprovals(data.approvals as ApprovalItem[]);
    if (data.assets) setAssets(data.assets as Asset[]);
    if (data.workspacesList) setWorkspacesList(data.workspacesList as Workspace[]);
    if (data.tools) setTools(data.tools as Tool[]);
    if (data.editableKpis) setEditableKpis(data.editableKpis as EditableKPI[]);
    if (data.editableAudiences) setEditableAudiences(data.editableAudiences as EditableAudience[]);
    if (data.kpiChannelData) setKpiChannelData(data.kpiChannelData as KPIChannelEntry[]);
    if (data.kpiTimeSeriesData) setKpiTimeSeriesData(data.kpiTimeSeriesData as KPITimeSeriesEntry[]);
    if (data.kpiSentimentData) setKpiSentimentData(data.kpiSentimentData as KPISentimentEntry[]);
    if (data.marketingIdeas) setMarketingIdeas(data.marketingIdeas as MarketingIdea[]);
    if (data.publishedContent) setPublishedContent(data.publishedContent as PublishedContent[]);
    if (data.contentPatterns) setContentPatterns(data.contentPatterns as ContentPattern[]);
    if (data.analyticsEvents) setAnalyticsEvents(data.analyticsEvents as AnalyticsEvent[]);
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
      theme, toggleTheme,
      marketingIdeas, setMarketingIdeas, updateMarketingIdea, activateIdea,
      analyticsEvents, trackEvent,
      kpiChannelData, setKpiChannelData, addKpiChannel, editKpiChannel, deleteKpiChannel,
      kpiTimeSeriesData, setKpiTimeSeriesData, addKpiTimeSeries, editKpiTimeSeries, deleteKpiTimeSeries,
      kpiSentimentData, setKpiSentimentData, addKpiSentiment, editKpiSentiment, deleteKpiSentiment,
      tools, setTools, addTool, editTool, deleteTool, reorderTools,
      aiCommandLog, addAiCommand,
      editableKpis, setEditableKpis, addEditableKpi, updateEditableKpi, archiveEditableKpi, restoreEditableKpi,
      editableAudiences, setEditableAudiences, addEditableAudience, updateEditableAudience, archiveEditableAudience, restoreEditableAudience,
      publishedContent, setPublishedContent, addPublishedContent, updatePublishedContent, deletePublishedContent,
      contentPatterns, setContentPatterns, resetContentPatterns,
      backupLogs, addBackupLog, getBackupData, restoreMerge, restoreFullReplace,
      messageTemplates, addMessageTemplate, updateMessageTemplate, deleteMessageTemplate, duplicateMessageTemplate,
      domainMappings, addDomainMapping, updateDomainMapping, deleteDomainMapping,
      messageLogs, addMessageLog,
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
