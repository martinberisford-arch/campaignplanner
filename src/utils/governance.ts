import { Campaign, ChecklistItem, ChecklistTemplate, CampaignType, GovernanceScore } from '../types';

// ===== CHECKLIST TEMPLATES =====

const socialMediaChecklist: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[] = [
  // Strategy & Planning
  { title: 'Define campaign objectives (SMART goals)', description: 'Set Specific, Measurable, Achievable, Relevant, Time-bound objectives', category: 'Strategy & Planning', mandatory: true, approvalRequired: false },
  { title: 'Identify target audience segments', description: 'Define demographics, psychographics, and behavioural segments', category: 'Strategy & Planning', mandatory: true, approvalRequired: false },
  { title: 'Select social media platforms', description: 'Choose platforms based on audience research and objectives', category: 'Strategy & Planning', mandatory: true, approvalRequired: false },
  { title: 'Develop messaging framework', description: 'Create key messages, tone of voice guidelines, and hashtag strategy', category: 'Strategy & Planning', mandatory: true, approvalRequired: false },
  { title: 'Set budget allocation per channel', description: 'Distribute budget across organic and paid activities', category: 'Strategy & Planning', mandatory: true, approvalRequired: true },
  // Content & Creative
  { title: 'Create content calendar', description: 'Plan posts, stories, and campaigns with scheduled dates', category: 'Content & Creative', mandatory: true, approvalRequired: false },
  { title: 'Design visual assets (images, graphics)', description: 'Create platform-specific assets meeting size/format requirements', category: 'Content & Creative', mandatory: true, approvalRequired: true },
  { title: 'Write post copy and captions', description: 'Draft all social media copy with CTAs', category: 'Content & Creative', mandatory: true, approvalRequired: true },
  { title: 'Produce video content (if applicable)', description: 'Script, film, edit video assets for platforms', category: 'Content & Creative', mandatory: false, approvalRequired: true },
  { title: 'Prepare alt text for all images', description: 'Write descriptive alt text for accessibility compliance', category: 'Content & Creative', mandatory: true, approvalRequired: false },
  // Compliance & Approvals
  { title: 'Review content for brand guidelines', description: 'Ensure all content aligns with brand standards', category: 'Compliance & Approvals', mandatory: true, approvalRequired: true },
  { title: 'Check GDPR/data compliance', description: 'Verify data handling, cookie consent, and privacy compliance', category: 'Compliance & Approvals', mandatory: true, approvalRequired: false },
  { title: 'Accessibility check (WCAG 2.1)', description: 'Verify colour contrast, alt text, caption availability', category: 'Compliance & Approvals', mandatory: true, approvalRequired: false },
  { title: 'Obtain stakeholder sign-off', description: 'Get formal approval from designated stakeholders', category: 'Compliance & Approvals', mandatory: true, approvalRequired: true },
  { title: 'Legal review of claims and disclaimers', description: 'Ensure no misleading claims, proper disclaimers in place', category: 'Compliance & Approvals', mandatory: false, approvalRequired: true },
  // Technical Setup
  { title: 'Set up UTM tracking parameters', description: 'Create UTM codes for all campaign links', category: 'Technical Setup', mandatory: true, approvalRequired: false },
  { title: 'Configure analytics tracking', description: 'Set up GA4 events, Meta Pixel, LinkedIn Insight Tag', category: 'Technical Setup', mandatory: true, approvalRequired: false },
  { title: 'Test landing pages', description: 'Verify all landing pages are live, mobile-responsive, and loading correctly', category: 'Technical Setup', mandatory: true, approvalRequired: false },
  // KPIs & Measurement
  { title: 'Define KPIs with targets', description: 'Set measurable KPIs aligned to campaign objectives', category: 'KPIs & Measurement', mandatory: true, approvalRequired: false },
  { title: 'Set up reporting dashboard', description: 'Configure real-time reporting for campaign metrics', category: 'KPIs & Measurement', mandatory: false, approvalRequired: false },
  // Risk & Contingency
  { title: 'Complete risk assessment', description: 'Identify potential risks and document mitigation strategies', category: 'Risk & Contingency', mandatory: true, approvalRequired: false },
  { title: 'Prepare crisis communications plan', description: 'Draft response templates for potential negative scenarios', category: 'Risk & Contingency', mandatory: false, approvalRequired: false },
];

const websiteUpdateChecklist: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[] = [
  // Planning
  { title: 'Define update scope and objectives', description: 'Clearly outline what pages/sections are being updated and why', category: 'Planning', mandatory: true, approvalRequired: false },
  { title: 'Create content brief for each page', description: 'Document required content, imagery, and CTAs per page', category: 'Planning', mandatory: true, approvalRequired: false },
  { title: 'Identify stakeholder reviewers', description: 'Assign content owners and approvers for each section', category: 'Planning', mandatory: true, approvalRequired: false },
  // Content
  { title: 'Write/update page content', description: 'Draft new content following brand and style guidelines', category: 'Content', mandatory: true, approvalRequired: true },
  { title: 'Source and optimise images', description: 'Select images, compress for web, add alt text', category: 'Content', mandatory: true, approvalRequired: false },
  { title: 'Update meta titles and descriptions', description: 'Write SEO-optimised meta content for all updated pages', category: 'Content', mandatory: true, approvalRequired: false },
  { title: 'Check internal and external links', description: 'Verify all links are working and pointing to correct destinations', category: 'Content', mandatory: true, approvalRequired: false },
  // Accessibility & Compliance
  { title: 'WCAG 2.1 AA accessibility audit', description: 'Run automated and manual accessibility checks', category: 'Accessibility & Compliance', mandatory: true, approvalRequired: false },
  { title: 'Mobile responsiveness check', description: 'Test on multiple devices and screen sizes', category: 'Accessibility & Compliance', mandatory: true, approvalRequired: false },
  { title: 'Cookie and privacy notice review', description: 'Ensure cookie banners and privacy notices are up to date', category: 'Accessibility & Compliance', mandatory: true, approvalRequired: false },
  { title: 'Content approved by stakeholders', description: 'Get written sign-off from all content owners', category: 'Accessibility & Compliance', mandatory: true, approvalRequired: true },
  // Technical
  { title: 'Test in staging environment', description: 'Deploy to staging and verify all changes before going live', category: 'Technical', mandatory: true, approvalRequired: false },
  { title: 'Performance check (page speed)', description: 'Run Lighthouse or similar tools to ensure performance targets met', category: 'Technical', mandatory: true, approvalRequired: false },
  { title: 'Set up redirects (if URLs changed)', description: 'Create 301 redirects for any changed URLs', category: 'Technical', mandatory: false, approvalRequired: false },
  { title: 'Configure analytics events', description: 'Ensure GA4/analytics tracking is working on updated pages', category: 'Technical', mandatory: true, approvalRequired: false },
  // Go-Live
  { title: 'Define go-live date and time', description: 'Schedule deployment with all stakeholders informed', category: 'Go-Live', mandatory: true, approvalRequired: true },
  { title: 'Post-launch monitoring plan', description: 'Assign responsibility for monitoring after deployment', category: 'Go-Live', mandatory: false, approvalRequired: false },
  { title: 'Rollback plan documented', description: 'Document steps to revert changes if issues arise', category: 'Go-Live', mandatory: true, approvalRequired: false },
];

const genericCampaignChecklist: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[] = [
  // Strategy
  { title: 'Define campaign objectives', description: 'Set clear, measurable objectives for the campaign', category: 'Strategy', mandatory: true, approvalRequired: false },
  { title: 'Identify target audiences', description: 'Define who the campaign is trying to reach', category: 'Strategy', mandatory: true, approvalRequired: false },
  { title: 'Develop key messages', description: 'Create messaging that resonates with target audiences', category: 'Strategy', mandatory: true, approvalRequired: false },
  { title: 'Select channels and tactics', description: 'Choose the most effective channels for reaching audiences', category: 'Strategy', mandatory: true, approvalRequired: true },
  { title: 'Set budget and resource plan', description: 'Allocate budget and identify resource requirements', category: 'Strategy', mandatory: true, approvalRequired: true },
  // Execution
  { title: 'Create campaign timeline', description: 'Develop detailed schedule with milestones and deadlines', category: 'Execution', mandatory: true, approvalRequired: false },
  { title: 'Assign task owners', description: 'Allocate responsibilities to team members', category: 'Execution', mandatory: true, approvalRequired: false },
  { title: 'Produce creative assets', description: 'Design and produce all campaign materials', category: 'Execution', mandatory: true, approvalRequired: true },
  { title: 'Write campaign copy', description: 'Draft all written content across channels', category: 'Execution', mandatory: true, approvalRequired: true },
  // Quality & Compliance
  { title: 'Brand guidelines review', description: 'Ensure all materials comply with brand standards', category: 'Quality & Compliance', mandatory: true, approvalRequired: true },
  { title: 'Accessibility check', description: 'Verify all content meets accessibility requirements', category: 'Quality & Compliance', mandatory: true, approvalRequired: false },
  { title: 'GDPR compliance check', description: 'Review data handling and privacy compliance', category: 'Quality & Compliance', mandatory: true, approvalRequired: false },
  { title: 'Stakeholder approval obtained', description: 'Get formal sign-off from all required stakeholders', category: 'Quality & Compliance', mandatory: true, approvalRequired: true },
  // Measurement
  { title: 'Define KPIs and targets', description: 'Set measurable KPIs with clear targets', category: 'Measurement', mandatory: true, approvalRequired: false },
  { title: 'Set up tracking and analytics', description: 'Configure measurement tools and tracking codes', category: 'Measurement', mandatory: true, approvalRequired: false },
  { title: 'Create reporting schedule', description: 'Plan when and how results will be reported', category: 'Measurement', mandatory: false, approvalRequired: false },
  // Risk
  { title: 'Risk assessment completed', description: 'Identify, assess, and plan mitigation for campaign risks', category: 'Risk', mandatory: true, approvalRequired: false },
  { title: 'Select risk level', description: 'Choose the overall risk level for this campaign (Green/Amber/Red)', category: 'Risk', mandatory: true, approvalRequired: false },
];

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'tmpl-social',
    name: 'Social Media Campaign',
    campaignType: 'social-media-campaign',
    version: 1,
    items: socialMediaChecklist,
    createdAt: '2024-06-01',
    updatedAt: '2025-01-15',
  },
  {
    id: 'tmpl-website',
    name: 'Website Update',
    campaignType: 'website-update',
    version: 1,
    items: websiteUpdateChecklist,
    createdAt: '2024-06-01',
    updatedAt: '2025-01-15',
  },
  {
    id: 'tmpl-generic',
    name: 'Generic Campaign',
    campaignType: 'generic-campaign',
    version: 1,
    items: genericCampaignChecklist,
    createdAt: '2024-06-01',
    updatedAt: '2025-01-15',
  },
];

// ===== GENERATE CHECKLIST =====

export function generateChecklist(campaignType: CampaignType): ChecklistItem[] {
  const template = checklistTemplates.find(t => t.campaignType === campaignType);
  if (!template) return [];
  return template.items.map((item, index) => ({
    ...item,
    id: `chk-${Date.now()}-${index}`,
    status: 'pending' as const,
  }));
}

// ===== CALCULATE GOVERNANCE SCORE =====

export function calculateGovernanceScore(campaign: Campaign): GovernanceScore {
  const checklist = campaign.checklist || [];
  const blockers: string[] = [];

  // Group by category
  const categories = new Map<string, { items: ChecklistItem[]; completed: number }>();
  checklist.forEach(item => {
    const cat = categories.get(item.category) || { items: [], completed: 0 };
    cat.items.push(item);
    if (item.status === 'complete') cat.completed++;
    categories.set(item.category, cat);
  });

  // Score calculation
  const mandatoryItems = checklist.filter(i => i.mandatory);
  const mandatoryComplete = mandatoryItems.filter(i => i.status === 'complete').length;
  const totalItems = checklist.length;
  const totalComplete = checklist.filter(i => i.status === 'complete').length;

  // Check blockers
  if (mandatoryComplete < mandatoryItems.length) {
    const remaining = mandatoryItems.length - mandatoryComplete;
    blockers.push(`${remaining} mandatory checklist item${remaining > 1 ? 's' : ''} incomplete`);
  }

  const hasKPIs = campaign.kpis && campaign.kpis.length > 0;
  if (!hasKPIs) blockers.push('No KPIs defined');

  const hasRiskLevel = campaign.riskLevel && campaign.riskLevel !== null;
  if (!hasRiskLevel) blockers.push('Risk level not selected');

  const hasOwner = !!campaign.owner;
  if (!hasOwner) blockers.push('No campaign owner assigned');

  const approvalRequired = checklist.filter(i => i.approvalRequired && i.mandatory);
  const approvalsMissing = approvalRequired.filter(i => i.status !== 'complete');
  if (approvalsMissing.length > 0) {
    blockers.push(`${approvalsMissing.length} approval${approvalsMissing.length > 1 ? 's' : ''} still required`);
  }

  // Calculate score (0-100)
  let score = 0;
  const maxScore = 100;

  // Mandatory completion: 50 points
  const mandatoryScore = mandatoryItems.length > 0 ? (mandatoryComplete / mandatoryItems.length) * 50 : 50;
  score += mandatoryScore;

  // Optional completion: 20 points
  const optionalItems = checklist.filter(i => !i.mandatory);
  const optionalComplete = optionalItems.filter(i => i.status === 'complete').length;
  const optionalScore = optionalItems.length > 0 ? (optionalComplete / optionalItems.length) * 20 : 20;
  score += optionalScore;

  // KPIs defined: 10 points
  if (hasKPIs) score += 10;

  // Risk level selected: 10 points
  if (hasRiskLevel) score += 10;

  // Owner assigned: 5 points
  if (hasOwner) score += 5;

  // Approvals logged: 5 points
  if (approvalsMissing.length === 0) score += 5;

  score = Math.round(score);

  // Risk flag
  let riskFlag: 'green' | 'amber' | 'red' = 'green';
  if (score < 50 || blockers.length > 3) riskFlag = 'red';
  else if (score < 80 || blockers.length > 0) riskFlag = 'amber';

  const breakdown = Array.from(categories.entries()).map(([category, data]) => ({
    category,
    score: data.completed,
    maxScore: data.items.length,
    items: data.items.length,
    completed: data.completed,
  }));

  return {
    score,
    maxScore,
    breakdown,
    riskFlag,
    launchReady: blockers.length === 0 && totalComplete === totalItems,
    blockers,
  };
}

// ===== AI GOVERNANCE SUGGESTIONS =====

export interface AISuggestion {
  type: 'missing-item' | 'vague-objective' | 'no-kpi' | 'risk-warning' | 'accessibility' | 'duplicate';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  suggestedAction?: string;
}

export function generateAISuggestions(campaign: Campaign): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const checklist = campaign.checklist || [];

  // 1. Objective Quality Validator
  const hasVagueGoals = campaign.goals.some(g =>
    g.length < 20 ||
    !(/\d/.test(g)) ||
    ['improve', 'increase', 'better', 'more', 'enhance'].some(w =>
      g.toLowerCase().startsWith(w) && !(/\d/.test(g))
    )
  );
  if (hasVagueGoals) {
    suggestions.push({
      type: 'vague-objective',
      severity: 'warning',
      title: 'Vague objectives detected',
      description: 'Some campaign objectives lack specificity or measurable targets. SMART objectives significantly improve campaign effectiveness.',
      suggestedAction: 'Revise objectives to include specific numbers, dates, and measurable outcomes (e.g., "Increase applications by 25% within 8 weeks")',
    });
  }

  // 2. KPI Sufficiency Checker
  if (!campaign.kpis || campaign.kpis.length === 0) {
    suggestions.push({
      type: 'no-kpi',
      severity: 'critical',
      title: 'No KPIs defined',
      description: 'This campaign has no Key Performance Indicators. Without measurable KPIs, you cannot assess campaign success or justify spend.',
      suggestedAction: 'Add at least 3 KPIs covering reach, engagement, and conversion metrics',
    });
  } else if (campaign.kpis.length < 3) {
    suggestions.push({
      type: 'no-kpi',
      severity: 'warning',
      title: 'Insufficient KPIs',
      description: `Only ${campaign.kpis.length} KPI${campaign.kpis.length === 1 ? '' : 's'} defined. Best practice is to have KPIs covering awareness, consideration, and conversion stages.`,
      suggestedAction: 'Add KPIs for each stage of the marketing funnel',
    });
  }

  // 3. Risk Suggestion Generator
  if (!campaign.riskLevel) {
    suggestions.push({
      type: 'risk-warning',
      severity: 'critical',
      title: 'No risk assessment',
      description: 'Campaign risk level has not been set. Risk assessment is mandatory for governance compliance.',
      suggestedAction: 'Complete the risk assessment and select Green/Amber/Red risk level',
    });
  }

  if (campaign.budget > 100000 && (!campaign.riskLevel || campaign.riskLevel === 'green')) {
    suggestions.push({
      type: 'risk-warning',
      severity: 'warning',
      title: 'High-budget campaign with low risk rating',
      description: `Campaign budget of £${(campaign.budget / 1000).toFixed(0)}k is significant. Consider whether a Green risk rating is appropriate for this level of investment.`,
      suggestedAction: 'Review risk assessment with senior stakeholders',
    });
  }

  // 4. Accessibility Compliance Reminder
  const hasAccessibilityCheck = checklist.some(i =>
    i.title.toLowerCase().includes('accessibility') && i.status === 'complete'
  );
  if (!hasAccessibilityCheck && checklist.length > 0) {
    suggestions.push({
      type: 'accessibility',
      severity: 'warning',
      title: 'Accessibility check not completed',
      description: 'Public sector campaigns must meet WCAG 2.1 AA standards. Ensure all content, including images and videos, is fully accessible.',
      suggestedAction: 'Run accessibility audit tools and complete manual checks before launch',
    });
  }

  // 5. Duplication Detector
  const titles = checklist.map(i => i.title.toLowerCase().trim());
  const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (duplicates.length > 0) {
    suggestions.push({
      type: 'duplicate',
      severity: 'info',
      title: 'Potential duplicate checklist items',
      description: `Found ${duplicates.length} checklist item${duplicates.length > 1 ? 's' : ''} that may be duplicated.`,
      suggestedAction: 'Review and remove any duplicate items to streamline your governance checklist',
    });
  }

  // 6. Missing items based on campaign content
  if (campaign.channels.includes('social-media') && !checklist.some(i => i.title.toLowerCase().includes('social'))) {
    suggestions.push({
      type: 'missing-item',
      severity: 'info',
      title: 'Social media checklist items recommended',
      description: 'This campaign uses social media channels but has no social-specific checklist items.',
      suggestedAction: 'Consider adding platform-specific review items for social media content',
    });
  }

  if (campaign.channels.includes('email') && !checklist.some(i => i.title.toLowerCase().includes('email') || i.title.toLowerCase().includes('gdpr'))) {
    suggestions.push({
      type: 'missing-item',
      severity: 'warning',
      title: 'Email compliance check missing',
      description: 'Campaign includes email channel. GDPR and PECR compliance checks are critical for email campaigns.',
      suggestedAction: 'Add email opt-in verification and unsubscribe mechanism checks',
    });
  }

  // 7. Timeline risk
  const daysRemaining = Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000);
  const completionPct = checklist.length > 0 ? (checklist.filter(i => i.status === 'complete').length / checklist.length) * 100 : 0;
  if (daysRemaining < 14 && completionPct < 70) {
    suggestions.push({
      type: 'risk-warning',
      severity: 'critical',
      title: 'Timeline at risk',
      description: `Only ${daysRemaining} days remaining but only ${Math.round(completionPct)}% of checklist is complete. Campaign may not be ready for launch.`,
      suggestedAction: 'Escalate to project lead and consider adjusting timeline or prioritising mandatory items',
    });
  }

  return suggestions;
}

// ===== GENERATE AUDIT TRAIL PDF =====

export function exportGovernanceAuditPDF(campaign: Campaign, governance: GovernanceScore) {
  const checklist = campaign.checklist || [];
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const categories = new Map<string, ChecklistItem[]>();
  checklist.forEach(item => {
    const cat = categories.get(item.category) || [];
    cat.push(item);
    categories.set(item.category, cat);
  });

  let checklistHtml = '';
  categories.forEach((items, category) => {
    const completed = items.filter(i => i.status === 'complete').length;
    checklistHtml += `
      <h3 style="margin-top:24px;font-size:14px;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
        ${category} (${completed}/${items.length})
      </h3>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <thead>
          <tr style="background:#f8fafc;font-size:10px;text-transform:uppercase;color:#64748b;">
            <th style="text-align:left;padding:8px;">Item</th>
            <th style="text-align:center;padding:8px;width:80px;">Mandatory</th>
            <th style="text-align:center;padding:8px;width:80px;">Status</th>
            <th style="text-align:left;padding:8px;width:140px;">Completed</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom:1px solid #f1f5f9;font-size:12px;">
              <td style="padding:8px;">${item.title}</td>
              <td style="text-align:center;padding:8px;">${item.mandatory ? '✅ Yes' : '—'}</td>
              <td style="text-align:center;padding:8px;color:${item.status === 'complete' ? '#10b981' : item.status === 'blocked' ? '#ef4444' : '#f59e0b'};font-weight:600;">
                ${item.status === 'complete' ? '✅ Complete' : item.status === 'blocked' ? '🚫 Blocked' : '⏳ Pending'}
              </td>
              <td style="padding:8px;font-size:11px;color:#64748b;">${item.completedAt ? `${item.completedAt}${item.completedBy ? ` by ${item.completedBy}` : ''}` : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });

  const riskColor = governance.riskFlag === 'green' ? '#10b981' : governance.riskFlag === 'amber' ? '#f59e0b' : '#ef4444';

  printWindow.document.write(`
    <html><head><title>Governance Audit Trail - ${campaign.title}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b;max-width:900px;margin:0 auto;font-size:13px}
      h1{font-size:22px;margin-bottom:4px}
      h2{font-size:16px;margin-top:32px;border-bottom:2px solid #1e293b;padding-bottom:6px}
      .subtitle{color:#64748b;font-size:13px;margin-bottom:24px}
      .score-box{display:flex;gap:20px;margin:16px 0}
      .score-card{flex:1;background:#f8fafc;border-radius:12px;padding:20px;text-align:center}
      .score-value{font-size:36px;font-weight:800}
      .score-label{font-size:11px;color:#64748b;margin-top:4px}
      .blocker{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin:6px 0;font-size:12px;color:#991b1b}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
      @media print{body{padding:20px}}
    </style></head><body>
    <h1>📋 Campaign Governance Audit Trail</h1>
    <p class="subtitle">
      <strong>${campaign.title}</strong> · Type: ${campaign.campaignType || 'Generic'} · 
      Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')} · 
      Report ID: GOV-${Date.now().toString(36).toUpperCase()}
    </p>

    <h2>Governance Summary</h2>
    <div class="score-box">
      <div class="score-card">
        <div class="score-value">${governance.score}<span style="font-size:16px;color:#64748b">/${governance.maxScore}</span></div>
        <div class="score-label">Governance Score</div>
      </div>
      <div class="score-card">
        <div class="score-value" style="color:${riskColor}">${governance.riskFlag.toUpperCase()}</div>
        <div class="score-label">Risk Flag</div>
      </div>
      <div class="score-card">
        <div class="score-value">${governance.launchReady ? '✅' : '🚫'}</div>
        <div class="score-label">${governance.launchReady ? 'Launch Ready' : 'Launch Blocked'}</div>
      </div>
    </div>

    ${governance.blockers.length > 0 ? `
      <h2>⚠️ Launch Blockers</h2>
      ${governance.blockers.map(b => `<div class="blocker">🚫 ${b}</div>`).join('')}
    ` : '<h2>✅ No Launch Blockers</h2><p>All mandatory requirements have been met.</p>'}

    <h2>Campaign Details</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${[
        ['Campaign', campaign.title],
        ['Status', campaign.status],
        ['Owner', campaign.owner?.name || 'Unassigned'],
        ['Start Date', campaign.startDate],
        ['End Date', campaign.endDate],
        ['Budget', `£${campaign.budget.toLocaleString()}`],
        ['Risk Level', campaign.riskLevel || 'Not set'],
        ['KPIs Defined', `${campaign.kpis?.length || 0}`],
      ].map(([k,v]) => `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px;font-weight:600;">${k}</td><td style="padding:8px;">${v}</td></tr>`).join('')}
    </table>

    <h2>Governance Checklist</h2>
    ${checklistHtml}

    <div class="footer">
      Generated by CampaignOS Governance Engine · campaignos.app · 
      This document is an official audit trail record. Retain for compliance purposes.
    </div>
    </body></html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}
