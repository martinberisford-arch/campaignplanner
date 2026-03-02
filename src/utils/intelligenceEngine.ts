import { Campaign, Insight, KPIChannelEntry, KPITimeSeriesEntry, MarketingIdea, ApprovalItem } from '../types';
import { MENTAL_MODELS } from '../data/mentalModels';

interface IntelligenceInput {
  campaigns: Campaign[];
  kpiChannelData: KPIChannelEntry[];
  kpiTimeSeriesData: KPITimeSeriesEntry[];
  marketingIdeas: MarketingIdea[];
  approvals: ApprovalItem[];
}

// Generate insights from campaign and KPI data
export function generateInsights(input: IntelligenceInput): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  // 1. Analyse channel performance
  const channelInsights = analyseChannelPerformance(input.kpiChannelData);
  insights.push(...channelInsights.map((i, idx) => ({ ...i, id: `insight-ch-${idx}`, createdAt: now })));

  // 2. Analyse campaign engagement patterns
  const campaignInsights = analyseCampaignPatterns(input.campaigns);
  insights.push(...campaignInsights.map((i, idx) => ({ ...i, id: `insight-cp-${idx}`, createdAt: now })));

  // 3. Analyse time series trends
  const trendInsights = analyseTimeSeriesTrends(input.kpiTimeSeriesData);
  insights.push(...trendInsights.map((i, idx) => ({ ...i, id: `insight-ts-${idx}`, createdAt: now })));

  // 4. Detect patterns from marketing ideas
  const ideaInsights = analyseIdeaEffectiveness(input.marketingIdeas);
  insights.push(...ideaInsights.map((i, idx) => ({ ...i, id: `insight-id-${idx}`, createdAt: now })));

  // 5. Approval workflow insights
  const approvalInsights = analyseApprovalPatterns(input.approvals);
  insights.push(...approvalInsights.map((i, idx) => ({ ...i, id: `insight-ap-${idx}`, createdAt: now })));

  // Sort by confidence descending
  return insights.sort((a, b) => b.confidence - a.confidence);
}

function analyseChannelPerformance(data: KPIChannelEntry[]): Omit<Insight, 'id' | 'createdAt'>[] {
  const insights: Omit<Insight, 'id' | 'createdAt'>[] = [];

  if (data.length === 0) return insights;

  // Find best performing channel by ROI
  const sortedByROI = [...data].sort((a, b) => b.roi - a.roi);
  const topChannel = sortedByROI[0];
  const bottomChannel = sortedByROI[sortedByROI.length - 1];

  if (topChannel && topChannel.roi > 3) {
    insights.push({
      title: `${topChannel.channel} delivering exceptional ROI`,
      summary: `${topChannel.channel} is achieving ${topChannel.roi.toFixed(1)}x ROI, significantly outperforming other channels. Consider reallocating budget from underperforming channels.`,
      category: 'engagement',
      relatedKpi: 'ROI',
      confidence: 0.92,
      mentalModel: 'anchoring',
      actionable: true,
      action: `Increase ${topChannel.channel} budget by 15-20% by reallocating from lower ROI channels.`,
    });
  }

  if (bottomChannel && bottomChannel.roi < 1.5 && data.length > 2) {
    insights.push({
      title: `${bottomChannel.channel} underperforming relative to investment`,
      summary: `${bottomChannel.channel} has the lowest ROI at ${bottomChannel.roi.toFixed(1)}x. Review targeting, creative, or consider reallocating spend.`,
      category: 'campaign',
      relatedKpi: 'ROI',
      confidence: 0.85,
      actionable: true,
      action: `Audit ${bottomChannel.channel} campaign targeting and creative. Consider A/B testing or reducing spend.`,
    });
  }

  // Conversion rate analysis
  const avgConversionRate = data.reduce((sum, d) => sum + (d.conversions / d.clicks) * 100, 0) / data.length;
  const highConverters = data.filter(d => (d.conversions / d.clicks) * 100 > avgConversionRate * 1.3);

  if (highConverters.length > 0) {
    insights.push({
      title: `High conversion rates detected in ${highConverters.length} channel(s)`,
      summary: `${highConverters.map(c => c.channel).join(', ')} are converting ${(avgConversionRate * 0.3).toFixed(1)}% above average. These audiences are highly engaged.`,
      category: 'engagement',
      relatedKpi: 'Conversion Rate',
      confidence: 0.88,
      mentalModel: 'commitment-bias',
      actionable: true,
      action: 'Scale successful campaigns and replicate targeting strategies across other channels.',
    });
  }

  return insights;
}

function analyseCampaignPatterns(campaigns: Campaign[]): Omit<Insight, 'id' | 'createdAt'>[] {
  const insights: Omit<Insight, 'id' | 'createdAt'>[] = [];

  if (campaigns.length === 0) return insights;

  // Active campaign analysis
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'planning');

  // Budget utilisation
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const utilisation = (totalSpent / totalBudget) * 100;

  if (utilisation < 50 && activeCampaigns.length > 0) {
    insights.push({
      title: 'Budget underutilisation detected',
      summary: `Only ${utilisation.toFixed(0)}% of allocated campaign budgets have been spent. This may indicate delayed activities or over-allocation.`,
      category: 'campaign',
      relatedKpi: 'Budget Efficiency',
      confidence: 0.78,
      actionable: true,
      action: 'Review campaign timelines and consider accelerating activities or reallocating unused budget.',
    });
  }

  // Channel diversity
  const channelCounts: Record<string, number> = {};
  campaigns.forEach(c => c.channels.forEach(ch => { channelCounts[ch] = (channelCounts[ch] || 0) + 1; }));
  const topChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0];

  if (topChannel && topChannel[1] / campaigns.length > 0.7) {
    insights.push({
      title: `Over-reliance on ${topChannel[0]} channel`,
      summary: `${Math.round((topChannel[1] / campaigns.length) * 100)}% of campaigns use ${topChannel[0]}. Diversifying channels can reduce risk and reach new audiences.`,
      category: 'benchmark',
      confidence: 0.72,
      mentalModel: 'mere-exposure',
      actionable: true,
      action: 'Consider piloting alternative channels in upcoming campaigns to diversify reach.',
    });
  }

  // Task completion patterns
  const incompleteTasks = activeCampaigns.flatMap(c => c.tasks.filter(t => t.status !== 'done'));
  const overdueCount = incompleteTasks.filter(t => new Date(t.dueDate) < new Date()).length;

  if (overdueCount > 3) {
    insights.push({
      title: `${overdueCount} tasks are overdue across active campaigns`,
      summary: 'Multiple overdue tasks may indicate resource constraints or unrealistic timelines. Consider reprioritising or extending deadlines.',
      category: 'campaign',
      confidence: 0.95,
      actionable: true,
      action: 'Review task assignments and deadlines. Consider redistributing workload or adjusting timeline expectations.',
    });
  }

  return insights;
}

function analyseTimeSeriesTrends(data: KPITimeSeriesEntry[]): Omit<Insight, 'id' | 'createdAt'>[] {
  const insights: Omit<Insight, 'id' | 'createdAt'>[] = [];

  if (data.length < 3) return insights;

  const sorted = [...data].sort((a, b) => a.week.localeCompare(b.week));
  const recent = sorted.slice(-3);
  const earlier = sorted.slice(-6, -3);

  if (recent.length >= 3 && earlier.length >= 3) {
    const recentAvgLeads = recent.reduce((s, d) => s + d.leads, 0) / recent.length;
    const earlierAvgLeads = earlier.reduce((s, d) => s + d.leads, 0) / earlier.length;
    const leadGrowth = ((recentAvgLeads - earlierAvgLeads) / earlierAvgLeads) * 100;

    if (leadGrowth > 20) {
      insights.push({
        title: 'Strong lead generation momentum',
        summary: `Lead generation has increased ${leadGrowth.toFixed(0)}% over the past 3 weeks compared to prior period. Current strategies are working effectively.`,
        category: 'engagement',
        relatedKpi: 'Leads',
        confidence: 0.9,
        mentalModel: 'social-proof',
        actionable: true,
        action: 'Double down on successful lead generation tactics. Document and replicate winning approaches.',
      });
    } else if (leadGrowth < -15) {
      insights.push({
        title: 'Lead generation declining',
        summary: `Leads have dropped ${Math.abs(leadGrowth).toFixed(0)}% over the past 3 weeks. Review recent campaign changes and audience targeting.`,
        category: 'engagement',
        relatedKpi: 'Leads',
        confidence: 0.88,
        actionable: true,
        action: 'Investigate cause of decline. Check for creative fatigue, audience saturation, or external factors.',
      });
    }

    // Click-through rate trend
    const recentCTR = recent.reduce((s, d) => s + (d.clicks / d.impressions) * 100, 0) / recent.length;
    const earlierCTR = earlier.reduce((s, d) => s + (d.clicks / d.impressions) * 100, 0) / earlier.length;

    if (recentCTR > earlierCTR * 1.2) {
      insights.push({
        title: 'Click-through rates improving',
        summary: `CTR has improved from ${earlierCTR.toFixed(2)}% to ${recentCTR.toFixed(2)}%. Creative or targeting optimisations are working.`,
        category: 'engagement',
        relatedKpi: 'CTR',
        confidence: 0.85,
        actionable: false,
      });
    }
  }

  return insights;
}

function analyseIdeaEffectiveness(ideas: MarketingIdea[]): Omit<Insight, 'id' | 'createdAt'>[] {
  const insights: Omit<Insight, 'id' | 'createdAt'>[] = [];

  const activated = ideas.filter(i => i.status === 'activated' || i.status === 'completed');
  const highPerformers = activated.filter(i => (i.performanceScore || 0) > 75);

  if (highPerformers.length > 0) {
    const topCategories = [...new Set(highPerformers.map(i => i.category))];
    insights.push({
      title: `Strong performance in ${topCategories.join(', ')} tactics`,
      summary: `${highPerformers.length} activated ideas are performing above target. Categories: ${topCategories.join(', ')}. These tactical approaches resonate with your audiences.`,
      category: 'benchmark',
      confidence: 0.82,
      mentalModel: highPerformers[0]?.primaryKPI?.toLowerCase().includes('referral') ? 'reciprocity' : 'social-proof',
      actionable: true,
      action: 'Prioritise similar ideas from the 139 framework in future planning.',
    });
  }

  // Category coverage analysis
  const categories = ['acquisition', 'activation', 'engagement', 'retention', 'referral', 'authority', 'community', 'partnerships'];
  const activatedCategories = new Set(activated.map(i => i.category));
  const missingCategories = categories.filter(c => !activatedCategories.has(c as any));

  if (missingCategories.length > 3) {
    insights.push({
      title: `Growth pillars underrepresented: ${missingCategories.slice(0, 2).join(', ')}`,
      summary: `Your activated marketing ideas don't cover ${missingCategories.length} growth pillars. Consider activating ideas in ${missingCategories.slice(0, 2).join(' and ')} for balanced growth.`,
      category: 'benchmark',
      confidence: 0.75,
      actionable: true,
      action: `Browse 139 Ideas and filter by ${missingCategories[0]} to find suitable tactics.`,
    });
  }

  return insights;
}

function analyseApprovalPatterns(approvals: ApprovalItem[]): Omit<Insight, 'id' | 'createdAt'>[] {
  const insights: Omit<Insight, 'id' | 'createdAt'>[] = [];

  const pending = approvals.filter(a => a.status === 'pending');
  const changesRequested = approvals.filter(a => a.status === 'changes-requested');

  if (pending.length > 5) {
    insights.push({
      title: `Approval bottleneck: ${pending.length} items pending`,
      summary: 'Multiple pending approvals may delay campaign launches. Consider prioritising reviews or delegating approval authority.',
      category: 'campaign',
      confidence: 0.9,
      actionable: true,
      action: 'Schedule a review session to clear the approval queue. Consider adding additional reviewers.',
    });
  }

  if (changesRequested.length > 2) {
    insights.push({
      title: 'Recurring revision requests detected',
      summary: `${changesRequested.length} items have requested changes. Review feedback patterns to improve first-submission quality.`,
      category: 'campaign',
      confidence: 0.78,
      actionable: true,
      action: 'Document common feedback themes and create a pre-submission checklist.',
    });
  }

  return insights;
}

// Get mental model suggestion based on KPI goal
export function suggestMentalModel(kpiGoal: string, format?: string): string | undefined {
  const goal = kpiGoal.toLowerCase();
  
  if (goal.includes('conversion') || goal.includes('signup') || goal.includes('booking')) {
    return 'scarcity';
  }
  if (goal.includes('trust') || goal.includes('credibility') || goal.includes('engagement')) {
    return 'social-proof';
  }
  if (goal.includes('lead') || goal.includes('download') || goal.includes('subscribe')) {
    return 'reciprocity';
  }
  if (goal.includes('retention') || goal.includes('loyalty') || goal.includes('return')) {
    return 'commitment-bias';
  }
  if (goal.includes('awareness') || goal.includes('reach') || goal.includes('impression')) {
    return 'narrative-transport';
  }
  
  // Format-based fallback
  if (format === 'video' || format === 'case-study') return 'narrative-transport';
  if (format === 'email') return 'loss-aversion';
  
  return 'social-proof'; // Default
}

export { MENTAL_MODELS };
