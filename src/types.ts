export type ViewType = 'dashboard' | 'calendar' | 'campaigns' | 'ai-brief' | 'approvals' | 'kpi' | 'assets' | 'settings' | 'campaign-detail' | 'login' | 'user-management';

export type BoardView = 'kanban' | 'list' | 'table' | 'timeline';

export type CampaignStatus = 'draft' | 'planning' | 'in-review' | 'approved' | 'active' | 'completed' | 'paused';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes-requested';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Role = 'admin' | 'editor' | 'contributor' | 'viewer';

export type Channel = 'social-media' | 'email' | 'paid-search' | 'display' | 'content' | 'events' | 'pr' | 'direct-mail' | 'video' | 'partnerships';

export type CampaignType = 'social-media-campaign' | 'website-update' | 'generic-campaign';

export type RiskLevel = 'green' | 'amber' | 'red' | null;

export type ChecklistItemStatus = 'pending' | 'complete' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  department: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  priority: Priority;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  owner: User;
  team: User[];
  channels: Channel[];
  goals: string[];
  audiences: string[];
  tasks: Task[];
  kpis: KPI[];
  workspace: string;
  createdAt: string;
  updatedAt: string;
  color: string;
  campaignType?: CampaignType;
  riskLevel?: RiskLevel;
  checklist?: ChecklistItem[];
  governanceScore?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: User;
  dueDate: string;
  priority: Priority;
  campaignId: string;
  tags: string[];
}

export interface ApprovalItem {
  id: string;
  title: string;
  type: 'brief' | 'asset' | 'copy' | 'strategy' | 'budget';
  status: ApprovalStatus;
  submittedBy: User;
  reviewers: { user: User; status: ApprovalStatus; comment?: string; date?: string }[];
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  document?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  category: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'template' | 'guideline';
  url: string;
  thumbnail: string;
  tags: string[];
  campaignId?: string;
  uploadedBy: User;
  createdAt: string;
  size: string;
  aiTags: string[];
}

export interface ActivityLog {
  id: string;
  action: string;
  user: User;
  timestamp: string;
  details: string;
  type: 'create' | 'update' | 'delete' | 'approve' | 'comment' | 'upload';
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  campaigns: number;
  members: number;
  icon: string;
}

export interface AIBrief {
  title: string;
  objective: string;
  audiences: string[];
  channels: { name: string; allocation: number; rationale: string }[];
  timeline: { phase: string; weeks: string; activities: string[] }[];
  budget: { category: string; amount: number; percentage: number }[];
  risks: { risk: string; impact: string; mitigation: string }[];
  kpis: { metric: string; target: string; measurement: string }[];
  messaging: { audience: string; keyMessage: string; tone: string }[];
  totalBudget: number;
  duration: string;
}

// ===== GOVERNANCE & QUALITY ENGINE =====

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ChecklistItemStatus;
  mandatory: boolean;
  approvalRequired: boolean;
  ownerId?: string;
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  aiSuggested?: boolean;
}

export interface GovernanceScore {
  score: number;
  maxScore: number;
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    items: number;
    completed: number;
  }[];
  riskFlag: 'green' | 'amber' | 'red';
  launchReady: boolean;
  blockers: string[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  campaignType: CampaignType;
  version: number;
  items: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  createdAt: string;
  updatedAt: string;
}

// ===== NOTIFICATIONS =====

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'task' | 'campaign' | 'system' | 'ai' | 'governance';
  read: boolean;
  timestamp: string;
  link?: ViewType;
  campaignId?: string;
  icon?: string;
}
