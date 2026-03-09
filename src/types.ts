export type ViewType = 'dashboard' | 'hub' | 'calendar' | 'campaigns' | 'ai-brief' | 'approvals' | 'kpi' | 'assets' | 'settings' | 'campaign-detail' | 'login' | 'user-management' | 'mkt-strategy' | 'mkt-calendar' | 'mkt-ideas' | 'mkt-performance' | 'admin-tools' | 'mkt-intelligence' | 'mkt-ideation' | 'mkt-brief' | 'mkt-messaging' | 'admin-kpis' | 'admin-audiences' | 'content-log' | 'backups';

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
  goalStatus?: Record<string, boolean>;
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
  type: 'image' | 'video' | 'document' | 'template' | 'guideline' | 'link';
  source: 'file' | 'link';
  url: string;
  linkUrl?: string;
  thumbnail: string;
  tags: string[];
  campaignId?: string;
  uploadedBy: User;
  createdAt: string;
  size: string;
  aiTags: string[];
  workspace?: string;
  description?: string;
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
  color: string;
  createdAt: string;
  createdBy: string;
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

// ===== MARKETING TOOLS =====

export type IdeaCategory = 'acquisition' | 'activation' | 'engagement' | 'retention' | 'referral' | 'authority' | 'community' | 'partnerships';

export type IdeaStage = 'early' | 'growth' | 'mature';

export type IdeaBudget = 'low' | 'medium' | 'high';

export type IdeaTimeline = 'quick-win' | '30-60-days' | 'long-term';

export type GovernanceRiskLevel = 'low' | 'medium' | 'high';

export type IdeaStatus = 'library' | 'shortlisted' | 'activated' | 'completed' | 'paused';

export interface MarketingIdea {
  id: string;
  name: string;
  description: string;
  category: IdeaCategory;
  stage: IdeaStage;
  budget: IdeaBudget;
  timeline: IdeaTimeline;
  primaryKPI: string;
  secondaryKPI: string;
  governanceRisk: GovernanceRiskLevel;
  requiredAssets: string[];
  requiredStakeholders: string[];
  executionChecklist: string[];
  expectedOutcome: string;
  measurementPlan: string;
  status: IdeaStatus;
  activatedAt?: string;
  completedAt?: string;
  performanceScore?: number;
  campaignId?: string;
  dpiaRequired: boolean;
  consentRequired: boolean;
  assetConsentRequired: boolean;
  retentionImplication: string;
  lawfulBasis: string;
  version: number;
  deletedAt?: string;
}

export interface GrowthCoverage {
  acquisition: number;
  activation: number;
  engagement: number;
  retention: number;
  referral: number;
  authority: number;
  community: number;
  partnerships: number;
}

export interface IdeaRecommendation {
  idea: MarketingIdea;
  score: number;
  reasons: string[];
  kpiGap: string;
}

export interface AnalyticsEvent {
  event: string;
  timestamp: string;
  ideaId?: string;
  campaignId?: string;
  metadata: Record<string, string>;
}

// ===== KPI DATA WITH SOURCE TRACKING =====

export type KPIDataSource = 'seed' | 'manual' | 'ga4' | 'meta' | 'linkedin' | 'hubspot' | 'import';

export interface KPIChannelEntry {
  id: string;
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  roi: number;
  source: KPIDataSource;
  sourceLabel: string;
  addedAt: string;
  addedBy: string;
  notes?: string;
}

export interface KPITimeSeriesEntry {
  id: string;
  week: string;
  impressions: number;
  clicks: number;
  leads: number;
  spend: number;
  applications: number;
  source: KPIDataSource;
  sourceLabel: string;
  addedAt: string;
  addedBy: string;
  notes?: string;
}

export interface KPISentimentEntry {
  id: string;
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  source: KPIDataSource;
  sourceLabel: string;
  addedAt: string;
  addedBy: string;
}

export interface KPIRecordEntry {
  id: string;
  kpiId: string;
  periodLabel: string;
  value: number;
  target?: number;
  unit: string;
  notes?: string;
  source: KPIDataSource;
  sourceLabel: string;
  addedAt: string;
  addedBy: string;
}


export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  type: 'internal' | 'campaign-support';
  color?: string;
  createdBy: string;
  createdAt: string;
}

// ===== TOOL REGISTRY =====

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: ViewType;
  externalUrl?: string;
  isExternal: boolean;
  isEnabled: boolean;
  displayOrder: number;
  badge?: string;
  badgeColor?: string;
  category: 'core' | 'marketing' | 'analytics' | 'admin' | 'external';
  toolMetrics?: {
    count?: number;
    trend?: number;
    lastUpdated?: string;
    label?: string;
  };
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

// ===== MARKETING INTELLIGENCE SYSTEM =====

export type InsightCategory = 'campaign' | 'referral' | 'engagement' | 'benchmark' | 'content' | 'audience';

export interface Insight {
  id: string;
  title: string;
  summary: string;
  category: InsightCategory;
  relatedIdeaId?: string;
  relatedKpi?: string;
  relatedCampaignId?: string;
  confidence: number; // 0-1
  mentalModel?: string;
  actionable: boolean;
  action?: string;
  createdAt: string;
}

export interface LearningLog {
  id: string;
  campaignId?: string;
  outcome: 'worked' | 'underperformed' | 'neutral';
  reasoning: string;
  behaviouralModel?: string;
  metrics?: { kpi: string; expected: number; actual: number }[];
  createdAt: string;
}

export type ContentFormat = 'blog' | 'email' | 'social' | 'carousel' | 'video' | 'newsletter' | 'press-release' | 'case-study';

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  format: ContentFormat;
  audience: string;
  kpiGoal: string;
  relatedIdeaId: string;
  mentalModel?: string;
  suggestedCTA: string;
  engagementScore: number; // 1-10
  awarenessEvent?: string;
  createdAt: string;
  status: 'draft' | 'selected' | 'briefed' | 'published';
}

export interface ContentBrief {
  id: string;
  ideaId: string;
  headline: string;
  outline: { section: string; content: string }[];
  keyTalkingPoints: string[];
  cta: string;
  assetsNeeded: string[];
  suggestedChannel: string;
  kpiTarget: string;
  croChecklist: { item: string; completed: boolean }[];
  createdAt: string;
  status: 'draft' | 'approved' | 'published';
}

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'sms' | 'whatsapp';
  baseStructure: string;
  charLimit: number;
  placeholders: string[];
  isActive: boolean;
  domainPriority?: string;
  variableSchema: Record<string, { label: string; required: boolean; hint?: string }>;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface DomainMapping {
  id: string;
  domain: string;
  fieldMap: Record<string, string>;
  createdAt: string;
}

export interface ExtractedPageData {
  title?: string;
  description?: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  time?: string;
  image?: string;
  url: string;
  siteName?: string;
  author?: string;
  [key: string]: string | undefined;
}

export interface MessageLog {
  id: string;
  templateId: string;
  templateName: string;
  url: string;
  extractedData: Record<string, string>;
  finalMessage: string;
  charCount: number;
  platform: 'sms' | 'whatsapp';
  audience: string;
  predictedEngagement: number;
  createdAt: string;
  createdBy: string;
}

export interface GeneratedMessage {
  id: string;
  templateId: string;
  urlSource: string;
  extractedData: Record<string, string>;
  finalMessage: string;
  charCount: number;
  predictedEngagement: number; // 1-100
  ctaStrength: 'weak' | 'medium' | 'strong';
  createdAt: string;
}

export interface AwarenessEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  category: string;
  description: string;
  suggestedIdeas: string[];
}

// ===== ADAPTIVE IDEATION ENGINE =====

export type KPICategory = 'awareness' | 'engagement' | 'conversion' | 'retention';
export type AudienceType = 'internal' | 'external' | 'clinical' | 'public' | 'provider' | 'partner';

export interface EditableKPI {
  id: string;
  name: string;
  description?: string;
  category: KPICategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EditableAudience {
  id: string;
  name: string;
  description?: string;
  type: AudienceType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedContent {
  id: string;
  title: string;
  format: ContentFormat;
  audienceId?: string;
  kpiId?: string;
  campaignId?: string;
  channel: 'email' | 'linkedin' | 'website' | 'whatsapp' | 'twitter' | 'facebook' | 'instagram' | 'newsletter' | 'other';
  publishDate: string;
  engagementScore?: number; // 0-100
  conversionRate?: number; // 0-100
  referralImpact?: number; // 0-100
  theme?: string;
  notes?: string;
  createdAt: string;
}

export interface ContentPattern {
  id: string;
  theme: string;
  format: ContentFormat;
  audienceId?: string;
  kpiId?: string;
  avgEngagement: number;
  avgConversion: number;
  avgReferral: number;
  usageCount: number;
  weightScore: number;
  lastUpdated: string;
  decayApplied?: boolean;
}

// ===== BACKUP & RESTORE =====

export type BackupRestoreMode = 'dry-run' | 'merge' | 'full-replace';

export interface BackupLog {
  id: string;
  type: 'export' | 'import';
  mode?: BackupRestoreMode;
  status: 'success' | 'failed' | 'dry-run';
  recordCounts?: Record<string, number>;
  performedBy: string;
  fileName?: string;
  checksum?: string;
  notes?: string;
  createdAt: string;
}

export interface BackupMetadata {
  version: string;
  appSchemaVersion: string;
  generatedAt: string;
  appVersion: string;
  checksum: string;
  recordCounts: Record<string, number>;
  includesLearningPatterns: boolean;
}

export interface BackupFile {
  metadata: BackupMetadata;
  data: Record<string, unknown[]>;
}
