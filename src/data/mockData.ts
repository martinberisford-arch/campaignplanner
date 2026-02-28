import { User, Campaign, Task, ApprovalItem, Asset, ActivityLog, Workspace } from '../types';

export const currentUser: User = {
  id: 'u1', name: 'Sarah Mitchell', email: 'sarah.mitchell@nhs.net',
  role: 'admin', avatar: 'SM', department: 'Communications'
};

export const users: User[] = [
  currentUser,
  { id: 'u2', name: 'James Richardson', email: 'james.r@nhs.net', role: 'editor', avatar: 'JR', department: 'Marketing' },
  { id: 'u3', name: 'Priya Sharma', email: 'priya.s@nhs.net', role: 'contributor', avatar: 'PS', department: 'Digital' },
  { id: 'u4', name: 'Marcus Johnson', email: 'marcus.j@nhs.net', role: 'editor', avatar: 'MJ', department: 'Strategy' },
  { id: 'u5', name: 'Emma Williams', email: 'emma.w@nhs.net', role: 'viewer', avatar: 'EW', department: 'Finance' },
  { id: 'u6', name: 'David Chen', email: 'david.c@nhs.net', role: 'contributor', avatar: 'DC', department: 'HR' },
];

export const workspaces: Workspace[] = [
  { id: 'ws1', name: 'NHS England Comms', description: 'National communications campaigns', campaigns: 12, members: 24, icon: '🏥' },
  { id: 'ws2', name: 'Public Health', description: 'Public health awareness programmes', campaigns: 8, members: 16, icon: '🌍' },
  { id: 'ws3', name: 'Workforce & HR', description: 'Recruitment and retention campaigns', campaigns: 5, members: 10, icon: '👥' },
];

const makeTasks = (campaignId: string): Task[] => [
  { id: `t${campaignId}-1`, title: 'Draft campaign brief', description: 'Create initial campaign brief document', status: 'done', assignee: users[0], dueDate: '2025-01-15', priority: 'high', campaignId, tags: ['brief', 'strategy'] },
  { id: `t${campaignId}-2`, title: 'Audience research', description: 'Conduct audience segmentation analysis', status: 'done', assignee: users[2], dueDate: '2025-01-20', priority: 'high', campaignId, tags: ['research', 'audience'] },
  { id: `t${campaignId}-3`, title: 'Channel strategy', description: 'Define channel mix and allocation', status: 'in-progress', assignee: users[3], dueDate: '2025-01-25', priority: 'medium', campaignId, tags: ['channels', 'strategy'] },
  { id: `t${campaignId}-4`, title: 'Creative brief', description: 'Develop creative direction and assets', status: 'in-progress', assignee: users[1], dueDate: '2025-02-01', priority: 'high', campaignId, tags: ['creative', 'design'] },
  { id: `t${campaignId}-5`, title: 'Budget approval', description: 'Get budget sign-off from finance', status: 'review', assignee: users[4], dueDate: '2025-02-05', priority: 'critical', campaignId, tags: ['budget', 'approval'] },
  { id: `t${campaignId}-6`, title: 'Media buying plan', description: 'Negotiate and plan media purchases', status: 'todo', assignee: users[1], dueDate: '2025-02-10', priority: 'medium', campaignId, tags: ['media', 'planning'] },
  { id: `t${campaignId}-7`, title: 'Launch assets', description: 'Prepare all launch day materials', status: 'todo', assignee: users[2], dueDate: '2025-02-15', priority: 'high', campaignId, tags: ['launch', 'assets'] },
  { id: `t${campaignId}-8`, title: 'Stakeholder review', description: 'Final review with all stakeholders', status: 'todo', assignee: users[0], dueDate: '2025-02-18', priority: 'critical', campaignId, tags: ['review', 'stakeholder'] },
];

export const campaigns: Campaign[] = [
  {
    id: 'c1', title: 'Primary Care Coach Recruitment', description: 'Nation-wide recruitment campaign for primary care coaches across NHS England trusts.',
    status: 'active', priority: 'critical', startDate: '2025-01-06', endDate: '2025-03-02',
    budget: 150000, spent: 67500, owner: users[0], team: [users[0], users[1], users[2], users[3]],
    channels: ['social-media', 'email', 'paid-search', 'events', 'content'],
    goals: ['Recruit 200 primary care coaches', 'Achieve 50,000 applications', 'Build employer brand awareness'],
    audiences: ['Healthcare professionals', 'Career changers', 'Recent graduates', 'Allied health workers'],
    tasks: makeTasks('c1'),
    kpis: [
      { id: 'k1', name: 'Applications', value: 12840, target: 50000, unit: 'count', trend: 12.5, category: 'conversion' },
      { id: 'k2', name: 'Website Visits', value: 234500, target: 500000, unit: 'count', trend: 8.3, category: 'traffic' },
      { id: 'k3', name: 'Social Engagement', value: 45200, target: 100000, unit: 'count', trend: 15.7, category: 'engagement' },
      { id: 'k4', name: 'Cost per Application', value: 5.26, target: 3.00, unit: 'GBP', trend: -4.2, category: 'efficiency' },
    ],
    workspace: 'ws3', createdAt: '2024-12-15', updatedAt: '2025-01-22', color: '#6366f1'
  },
  {
    id: 'c2', title: 'Winter Vaccination Programme', description: 'National winter vaccination awareness and uptake campaign.',
    status: 'planning', priority: 'high', startDate: '2025-02-01', endDate: '2025-04-30',
    budget: 280000, spent: 12000, owner: users[3], team: [users[0], users[2], users[3], users[5]],
    channels: ['social-media', 'email', 'display', 'pr', 'direct-mail', 'video'],
    goals: ['Increase vaccination uptake by 15%', 'Reach 10M adults', 'Reduce hesitancy in under-30s'],
    audiences: ['Over 65s', 'Parents', 'Healthcare workers', 'Immunocompromised'],
    tasks: makeTasks('c2'),
    kpis: [
      { id: 'k5', name: 'Reach', value: 2100000, target: 10000000, unit: 'count', trend: 22.1, category: 'reach' },
      { id: 'k6', name: 'Booking Rate', value: 8.4, target: 15, unit: '%', trend: 3.2, category: 'conversion' },
    ],
    workspace: 'ws2', createdAt: '2025-01-05', updatedAt: '2025-01-20', color: '#10b981'
  },
  {
    id: 'c3', title: 'Mental Health Awareness Week', description: 'Annual mental health awareness campaign with focus on workplace wellbeing.',
    status: 'draft', priority: 'medium', startDate: '2025-05-12', endDate: '2025-05-18',
    budget: 85000, spent: 0, owner: users[1], team: [users[1], users[2], users[4]],
    channels: ['social-media', 'content', 'partnerships', 'events', 'video'],
    goals: ['Generate 5M social impressions', 'Partner with 50 organisations', 'Create toolkit downloads > 10,000'],
    audiences: ['Employers', 'Young adults 18-25', 'Public sector workers', 'Educators'],
    tasks: makeTasks('c3'),
    kpis: [
      { id: 'k7', name: 'Impressions', value: 0, target: 5000000, unit: 'count', trend: 0, category: 'reach' },
    ],
    workspace: 'ws2', createdAt: '2025-01-10', updatedAt: '2025-01-18', color: '#f59e0b'
  },
  {
    id: 'c4', title: 'Digital Transformation Roadshow', description: 'Series of regional events promoting NHS digital transformation initiatives.',
    status: 'in-review', priority: 'high', startDate: '2025-03-01', endDate: '2025-06-30',
    budget: 200000, spent: 35000, owner: users[0], team: users,
    channels: ['events', 'email', 'social-media', 'content', 'partnerships'],
    goals: ['Host 12 regional events', 'Engage 3,000 attendees', 'Drive 500 digital adoption pledges'],
    audiences: ['NHS Trust CIOs', 'Clinical staff', 'IT managers', 'Practice managers'],
    tasks: makeTasks('c4'),
    kpis: [
      { id: 'k8', name: 'Registrations', value: 890, target: 3000, unit: 'count', trend: 18.4, category: 'conversion' },
      { id: 'k9', name: 'Event NPS', value: 72, target: 80, unit: 'score', trend: 5.0, category: 'satisfaction' },
    ],
    workspace: 'ws1', createdAt: '2025-01-02', updatedAt: '2025-01-21', color: '#ec4899'
  },
  {
    id: 'c5', title: 'Staff Wellbeing Programme', description: 'Internal campaign promoting NHS staff wellbeing resources and support.',
    status: 'completed', priority: 'medium', startDate: '2024-10-01', endDate: '2024-12-31',
    budget: 55000, spent: 52300, owner: users[5], team: [users[0], users[5]],
    channels: ['email', 'content', 'events'],
    goals: ['Increase resource page visits by 40%', 'Achieve 80% awareness', 'Reduce staff burnout indicators'],
    audiences: ['All NHS staff', 'Managers', 'New starters'],
    tasks: makeTasks('c5'),
    kpis: [
      { id: 'k10', name: 'Page Visits', value: 48200, target: 42000, unit: 'count', trend: 14.8, category: 'traffic' },
      { id: 'k11', name: 'Awareness', value: 84, target: 80, unit: '%', trend: 12.0, category: 'reach' },
    ],
    workspace: 'ws1', createdAt: '2024-09-15', updatedAt: '2024-12-31', color: '#8b5cf6'
  },
];

export const approvalItems: ApprovalItem[] = [
  {
    id: 'a1', title: 'Primary Care Coach - Campaign Brief v3', type: 'brief', status: 'pending',
    submittedBy: users[0], campaignId: 'c1', createdAt: '2025-01-20', updatedAt: '2025-01-22', version: 3,
    reviewers: [
      { user: users[3], status: 'approved', comment: 'Excellent strategy. Channel mix looks strong.', date: '2025-01-21' },
      { user: users[4], status: 'pending' },
      { user: users[1], status: 'pending' },
    ],
    document: 'Campaign brief for nationwide recruitment of 200 primary care coaches...',
  },
  {
    id: 'a2', title: 'Vaccination Campaign - Creative Assets Pack', type: 'asset', status: 'changes-requested',
    submittedBy: users[2], campaignId: 'c2', createdAt: '2025-01-18', updatedAt: '2025-01-21', version: 2,
    reviewers: [
      { user: users[0], status: 'changes-requested', comment: 'Please update the imagery to be more inclusive. Add BSL considerations.', date: '2025-01-20' },
      { user: users[3], status: 'pending' },
    ],
  },
  {
    id: 'a3', title: 'Digital Roadshow - Budget Allocation', type: 'budget', status: 'approved',
    submittedBy: users[0], campaignId: 'c4', createdAt: '2025-01-15', updatedAt: '2025-01-19', version: 1,
    reviewers: [
      { user: users[4], status: 'approved', comment: 'Budget approved. Ensure quarterly reporting.', date: '2025-01-18' },
      { user: users[3], status: 'approved', comment: 'Aligned with strategic priorities.', date: '2025-01-19' },
    ],
  },
  {
    id: 'a4', title: 'Mental Health Week - Messaging Framework', type: 'copy', status: 'pending',
    submittedBy: users[1], campaignId: 'c3', createdAt: '2025-01-22', updatedAt: '2025-01-22', version: 1,
    reviewers: [
      { user: users[0], status: 'pending' },
      { user: users[5], status: 'pending' },
    ],
  },
  {
    id: 'a5', title: 'Recruitment - Social Media Copy Deck', type: 'copy', status: 'approved',
    submittedBy: users[1], campaignId: 'c1', createdAt: '2025-01-12', updatedAt: '2025-01-16', version: 2,
    reviewers: [
      { user: users[0], status: 'approved', comment: 'Great tone of voice. Proceed with scheduling.', date: '2025-01-15' },
      { user: users[2], status: 'approved', date: '2025-01-16' },
    ],
  },
];

export const assets: Asset[] = [
  { id: 'as1', name: 'Primary Care Coach - Hero Banner.png', type: 'image', url: '#', thumbnail: '', tags: ['hero', 'recruitment', 'banner'], campaignId: 'c1', uploadedBy: users[1], createdAt: '2025-01-18', size: '2.4 MB', aiTags: ['healthcare', 'professional', 'diverse', 'workplace', 'NHS branding'] },
  { id: 'as2', name: 'Vaccination Awareness - Video Script.docx', type: 'document', url: '#', thumbnail: '', tags: ['script', 'video', 'vaccination'], campaignId: 'c2', uploadedBy: users[2], createdAt: '2025-01-20', size: '156 KB', aiTags: ['medical', 'awareness', 'script', 'public health'] },
  { id: 'as3', name: 'Brand Guidelines 2025.pdf', type: 'guideline', url: '#', thumbnail: '', tags: ['brand', 'guidelines', 'identity'], uploadedBy: users[0], createdAt: '2025-01-05', size: '8.7 MB', aiTags: ['brand standards', 'typography', 'colour palette', 'logo usage'] },
  { id: 'as4', name: 'Social Media Templates Pack.zip', type: 'template', url: '#', thumbnail: '', tags: ['social', 'template', 'design'], uploadedBy: users[1], createdAt: '2025-01-15', size: '45.2 MB', aiTags: ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'stories', 'posts'] },
  { id: 'as5', name: 'Recruitment Video - 30s Cut.mp4', type: 'video', url: '#', thumbnail: '', tags: ['video', 'recruitment', 'ad'], campaignId: 'c1', uploadedBy: users[2], createdAt: '2025-01-19', size: '128 MB', aiTags: ['testimonial', 'NHS staff', 'career', 'primary care'] },
  { id: 'as6', name: 'Q4 Performance Report.pptx', type: 'document', url: '#', thumbnail: '', tags: ['report', 'performance', 'Q4'], uploadedBy: users[0], createdAt: '2025-01-10', size: '3.1 MB', aiTags: ['analytics', 'KPIs', 'quarterly', 'metrics'] },
  { id: 'as7', name: 'Event Photography Set.zip', type: 'image', url: '#', thumbnail: '', tags: ['photos', 'events', 'roadshow'], campaignId: 'c4', uploadedBy: users[5], createdAt: '2025-01-21', size: '234 MB', aiTags: ['conference', 'speakers', 'audience', 'networking'] },
  { id: 'as8', name: 'Mental Health Toolkit.pdf', type: 'document', url: '#', thumbnail: '', tags: ['toolkit', 'mental health', 'resources'], campaignId: 'c3', uploadedBy: users[1], createdAt: '2025-01-22', size: '5.6 MB', aiTags: ['wellbeing', 'support', 'employer toolkit', 'guidance'] },
];

export const activityLog: ActivityLog[] = [
  { id: 'al1', action: 'Campaign brief updated', user: users[0], timestamp: '2025-01-22T14:30:00', details: 'Updated channel strategy and budget allocation for Primary Care Coach campaign', type: 'update' },
  { id: 'al2', action: 'Asset uploaded', user: users[1], timestamp: '2025-01-22T13:15:00', details: 'Uploaded hero banner for recruitment campaign', type: 'upload' },
  { id: 'al3', action: 'Approval granted', user: users[3], timestamp: '2025-01-21T16:45:00', details: 'Approved campaign brief v3 for Primary Care Coach', type: 'approve' },
  { id: 'al4', action: 'Comment added', user: users[0], timestamp: '2025-01-21T11:20:00', details: '@PriyaSharma please update vaccination creative assets for inclusivity', type: 'comment' },
  { id: 'al5', action: 'Campaign created', user: users[1], timestamp: '2025-01-20T09:00:00', details: 'Created Mental Health Awareness Week campaign draft', type: 'create' },
  { id: 'al6', action: 'Task completed', user: users[2], timestamp: '2025-01-19T17:30:00', details: 'Audience research completed for recruitment campaign', type: 'update' },
  { id: 'al7', action: 'Budget approved', user: users[4], timestamp: '2025-01-18T14:00:00', details: 'Approved £200k budget for Digital Transformation Roadshow', type: 'approve' },
  { id: 'al8', action: 'Asset deleted', user: users[0], timestamp: '2025-01-17T10:30:00', details: 'Removed outdated vaccination campaign imagery', type: 'delete' },
];

export const kpiTimeSeriesData = [
  { week: 'W1', impressions: 450000, clicks: 12500, leads: 890, spend: 8200, applications: 1200 },
  { week: 'W2', impressions: 620000, clicks: 18200, leads: 1340, spend: 11500, applications: 2800 },
  { week: 'W3', impressions: 780000, clicks: 24800, leads: 1890, spend: 14200, applications: 4500 },
  { week: 'W4', impressions: 920000, clicks: 31500, leads: 2450, spend: 16800, applications: 6200 },
  { week: 'W5', impressions: 1050000, clicks: 36200, leads: 2980, spend: 18500, applications: 8100 },
  { week: 'W6', impressions: 1180000, clicks: 42100, leads: 3520, spend: 21200, applications: 10400 },
  { week: 'W7', impressions: 1320000, clicks: 48900, leads: 4100, spend: 23800, applications: 11800 },
  { week: 'W8', impressions: 1480000, clicks: 55200, leads: 4680, spend: 26500, applications: 12840 },
];

export const channelPerformance = [
  { channel: 'Social Media', impressions: 4200000, clicks: 125000, conversions: 8400, spend: 42000, roi: 3.2 },
  { channel: 'Email', impressions: 890000, clicks: 78000, conversions: 5200, spend: 8500, roi: 6.1 },
  { channel: 'Paid Search', impressions: 1560000, clicks: 62000, conversions: 4100, spend: 28000, roi: 2.4 },
  { channel: 'Display', impressions: 3200000, clicks: 28000, conversions: 1200, spend: 18000, roi: 1.8 },
  { channel: 'Content', impressions: 680000, clicks: 42000, conversions: 3800, spend: 12000, roi: 4.5 },
  { channel: 'Events', impressions: 120000, clicks: 8500, conversions: 2100, spend: 35000, roi: 2.1 },
];

export const sentimentData = [
  { date: 'Jan 6', positive: 72, neutral: 20, negative: 8 },
  { date: 'Jan 13', positive: 68, neutral: 22, negative: 10 },
  { date: 'Jan 20', positive: 75, neutral: 18, negative: 7 },
  { date: 'Jan 27', positive: 78, neutral: 16, negative: 6 },
  { date: 'Feb 3', positive: 82, neutral: 13, negative: 5 },
  { date: 'Feb 10', positive: 80, neutral: 15, negative: 5 },
];
