import { PublishedContent, ContentPattern, ContentFormat, EditableKPI, EditableAudience } from '../types';

/**
 * Adaptive Engine
 * 
 * Calculates performance scores, updates patterns, and provides weight-based recommendations.
 * This is NOT ML training - it's controlled reinforcement weighting with explicit formulas.
 */

// ==================== PERFORMANCE SCORING ====================

export function calculatePerformanceScore(content: PublishedContent): number {
  const engagement = content.engagementScore ?? 0;
  const conversion = content.conversionRate ?? 0;
  const referral = content.referralImpact ?? 0;
  
  // Weighted composite: 40% engagement, 40% conversion, 20% referral
  return (engagement * 0.4) + (conversion * 0.4) + (referral * 0.2);
}

// ==================== WEIGHT SCORING ====================

export function calculateWeightScore(performanceScore: number, usageCount: number): number {
  // Weight = performance × log(usageCount + 1)
  // This prevents one-off spikes from dominating while rewarding consistent performance
  return performanceScore * Math.log(usageCount + 1);
}

// ==================== DECAY LOGIC ====================

export function applyDecay(pattern: ContentPattern, currentDate: Date = new Date()): ContentPattern {
  const lastUpdated = new Date(pattern.lastUpdated);
  const monthsSinceUpdate = (currentDate.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  // If pattern not used in 6+ months, reduce weight by 10%
  if (monthsSinceUpdate >= 6 && !pattern.decayApplied) {
    return {
      ...pattern,
      weightScore: pattern.weightScore * 0.9,
      decayApplied: true,
    };
  }
  
  return pattern;
}

// ==================== PATTERN MATCHING ====================

export function findMatchingPattern(
  patterns: ContentPattern[],
  theme: string,
  format: ContentFormat,
  audienceId?: string,
  kpiId?: string
): ContentPattern | undefined {
  // Find exact match first
  const exactMatch = patterns.find(p =>
    p.theme.toLowerCase() === theme.toLowerCase() &&
    p.format === format &&
    p.audienceId === audienceId &&
    p.kpiId === kpiId
  );
  
  if (exactMatch) return exactMatch;
  
  // Find partial match (theme + format)
  return patterns.find(p =>
    p.theme.toLowerCase() === theme.toLowerCase() &&
    p.format === format
  );
}

// ==================== PATTERN UPDATE ====================

export function updateOrCreatePattern(
  existingPatterns: ContentPattern[],
  content: PublishedContent,
  theme: string
): ContentPattern[] {
  const performanceScore = calculatePerformanceScore(content);
  const matchingPattern = findMatchingPattern(
    existingPatterns,
    theme,
    content.format,
    content.audienceId,
    content.kpiId
  );
  
  if (matchingPattern) {
    // Update existing pattern with running average
    const newUsageCount = matchingPattern.usageCount + 1;
    const newAvgEngagement = ((matchingPattern.avgEngagement * matchingPattern.usageCount) + (content.engagementScore ?? 0)) / newUsageCount;
    const newAvgConversion = ((matchingPattern.avgConversion * matchingPattern.usageCount) + (content.conversionRate ?? 0)) / newUsageCount;
    const newAvgReferral = ((matchingPattern.avgReferral * matchingPattern.usageCount) + (content.referralImpact ?? 0)) / newUsageCount;
    const newWeightScore = calculateWeightScore(
      (newAvgEngagement * 0.4) + (newAvgConversion * 0.4) + (newAvgReferral * 0.2),
      newUsageCount
    );
    
    return existingPatterns.map(p =>
      p.id === matchingPattern.id
        ? {
            ...p,
            avgEngagement: newAvgEngagement,
            avgConversion: newAvgConversion,
            avgReferral: newAvgReferral,
            usageCount: newUsageCount,
            weightScore: newWeightScore,
            lastUpdated: new Date().toISOString(),
            decayApplied: false,
          }
        : p
    );
  } else {
    // Create new pattern
    const newPattern: ContentPattern = {
      id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      theme,
      format: content.format,
      audienceId: content.audienceId,
      kpiId: content.kpiId,
      avgEngagement: content.engagementScore ?? 0,
      avgConversion: content.conversionRate ?? 0,
      avgReferral: content.referralImpact ?? 0,
      usageCount: 1,
      weightScore: calculateWeightScore(performanceScore, 1),
      lastUpdated: new Date().toISOString(),
      decayApplied: false,
    };
    
    return [...existingPatterns, newPattern];
  }
}

// ==================== IDEA RANKING BOOST ====================

export interface RankedIdea {
  ideaId: string;
  baseScore: number;
  patternBoost: number;
  finalScore: number;
  historicalStrength: 'strong' | 'moderate' | 'weak' | 'unknown';
  similarPostCount: number;
}

export function boostIdeaRanking(
  ideaId: string,
  baseScore: number,
  patterns: ContentPattern[],
  audienceId?: string,
  kpiId?: string,
  format?: ContentFormat
): RankedIdea {
  // Find relevant patterns
  const relevantPatterns = patterns.filter(p => {
    const audienceMatch = !audienceId || p.audienceId === audienceId;
    const kpiMatch = !kpiId || p.kpiId === kpiId;
    const formatMatch = !format || p.format === format;
    return audienceMatch && kpiMatch && formatMatch;
  });
  
  if (relevantPatterns.length === 0) {
    return {
      ideaId,
      baseScore,
      patternBoost: 0,
      finalScore: baseScore,
      historicalStrength: 'unknown',
      similarPostCount: 0,
    };
  }
  
  // Calculate average weight from relevant patterns
  const avgWeight = relevantPatterns.reduce((sum, p) => sum + p.weightScore, 0) / relevantPatterns.length;
  const totalUsage = relevantPatterns.reduce((sum, p) => sum + p.usageCount, 0);
  
  // Normalize boost to 0-1 range (assuming max weight ~100)
  const normalizedBoost = Math.min(avgWeight / 100, 1);
  
  // Apply boost: up to 50% increase for strong patterns
  const patternBoost = baseScore * normalizedBoost * 0.5;
  const finalScore = baseScore + patternBoost;
  
  // Determine historical strength
  let historicalStrength: 'strong' | 'moderate' | 'weak' | 'unknown';
  if (avgWeight > 50) historicalStrength = 'strong';
  else if (avgWeight > 25) historicalStrength = 'moderate';
  else if (avgWeight > 0) historicalStrength = 'weak';
  else historicalStrength = 'unknown';
  
  return {
    ideaId,
    baseScore,
    patternBoost,
    finalScore,
    historicalStrength,
    similarPostCount: totalUsage,
  };
}

// ==================== INSIGHTS GENERATION ====================

export interface LearningInsight {
  type: 'top-format' | 'best-pairing' | 'underperforming' | 'momentum';
  title: string;
  description: string;
  metric: number;
  trend?: 'up' | 'down' | 'stable';
}

export function generateLearningInsights(
  patterns: ContentPattern[],
  kpis: EditableKPI[],
  audiences: EditableAudience[]
): LearningInsight[] {
  const insights: LearningInsight[] = [];
  
  if (patterns.length === 0) return insights;
  
  // Top performing formats
  const formatPerformance: Record<string, { total: number; count: number }> = {};
  patterns.forEach(p => {
    if (!formatPerformance[p.format]) {
      formatPerformance[p.format] = { total: 0, count: 0 };
    }
    formatPerformance[p.format].total += p.avgEngagement;
    formatPerformance[p.format].count += 1;
  });
  
  const topFormat = Object.entries(formatPerformance)
    .map(([format, data]) => ({ format, avg: data.total / data.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  
  if (topFormat) {
    insights.push({
      type: 'top-format',
      title: 'Top Performing Format',
      description: `${topFormat.format.charAt(0).toUpperCase() + topFormat.format.slice(1)} content has the highest average engagement at ${topFormat.avg.toFixed(1)}%`,
      metric: topFormat.avg,
      trend: 'up',
    });
  }
  
  // Strongest audience-KPI pairings
  const pairings = patterns
    .filter(p => p.audienceId && p.kpiId)
    .sort((a, b) => b.weightScore - a.weightScore);
  
  if (pairings.length > 0) {
    const best = pairings[0];
    const audienceName = audiences.find(a => a.id === best.audienceId)?.name || 'Unknown';
    const kpiName = kpis.find(k => k.id === best.kpiId)?.name || 'Unknown';
    
    insights.push({
      type: 'best-pairing',
      title: 'Strongest Audience-KPI Pairing',
      description: `${audienceName} + ${kpiName} has the highest weight score (${best.weightScore.toFixed(1)}) based on ${best.usageCount} posts`,
      metric: best.weightScore,
      trend: 'stable',
    });
  }
  
  // Underperforming themes
  const lowPerformers = patterns
    .filter(p => p.avgEngagement < 30 && p.usageCount >= 2)
    .sort((a, b) => a.avgEngagement - b.avgEngagement);
  
  if (lowPerformers.length > 0) {
    const worst = lowPerformers[0];
    insights.push({
      type: 'underperforming',
      title: 'Underperforming Theme',
      description: `"${worst.theme}" theme averages only ${worst.avgEngagement.toFixed(1)}% engagement across ${worst.usageCount} posts. Consider adjusting approach.`,
      metric: worst.avgEngagement,
      trend: 'down',
    });
  }
  
  // Engagement momentum (recent vs older patterns)
  const sortedByDate = [...patterns].sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  
  if (sortedByDate.length >= 4) {
    const recentAvg = sortedByDate.slice(0, Math.ceil(sortedByDate.length / 2))
      .reduce((sum, p) => sum + p.avgEngagement, 0) / Math.ceil(sortedByDate.length / 2);
    const olderAvg = sortedByDate.slice(Math.ceil(sortedByDate.length / 2))
      .reduce((sum, p) => sum + p.avgEngagement, 0) / Math.floor(sortedByDate.length / 2);
    
    const trend = recentAvg > olderAvg * 1.1 ? 'up' : recentAvg < olderAvg * 0.9 ? 'down' : 'stable';
    const change = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1);
    
    insights.push({
      type: 'momentum',
      title: 'Engagement Momentum',
      description: `Recent content is ${trend === 'up' ? 'outperforming' : trend === 'down' ? 'underperforming' : 'matching'} older content by ${Math.abs(Number(change))}%`,
      metric: recentAvg,
      trend,
    });
  }
  
  return insights;
}

// ==================== COEFFICIENTS (Admin adjustable) ====================

export interface WeightingCoefficients {
  engagementWeight: number;
  conversionWeight: number;
  referralWeight: number;
  decayRate: number;
  decayThresholdMonths: number;
  maxBoostMultiplier: number;
}

export const DEFAULT_COEFFICIENTS: WeightingCoefficients = {
  engagementWeight: 0.4,
  conversionWeight: 0.4,
  referralWeight: 0.2,
  decayRate: 0.1, // 10% reduction
  decayThresholdMonths: 6,
  maxBoostMultiplier: 0.5, // Max 50% boost from patterns
};
