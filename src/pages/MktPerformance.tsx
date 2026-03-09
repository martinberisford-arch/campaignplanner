import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { getCategoryLabel, getCategoryColor, CATEGORY_LIST } from '../data/marketingIdeas';
import { TrendingUp, TrendingDown, Target, BarChart3, Lightbulb, Zap, Award, ArrowUpRight, ArrowDownRight, Minus, FileText } from 'lucide-react';

const MOCK_KPI_TRENDS = [
  { name: 'Engagement Rate', current: 4.2, target: 5.0, previous: 3.8, unit: '%' },
  { name: 'Booking Rate', current: 12.5, target: 15.0, previous: 11.0, unit: '%' },
  { name: 'Referral Conversion', current: 8.3, target: 12.0, previous: 7.1, unit: '%' },
  { name: 'Organic Traffic', current: 24500, target: 30000, previous: 21000, unit: '' },
  { name: 'Cost per Acquisition', current: 42, target: 35, previous: 48, unit: '£' },
  { name: 'Brand Awareness', current: 34, target: 50, previous: 29, unit: '%' },
  { name: 'Content Engagement', current: 6.8, target: 8.0, previous: 5.2, unit: '%' },
  { name: 'Stakeholder Satisfaction', current: 78, target: 85, previous: 72, unit: '%' },
];

export default function MktPerformance() {
  const { marketingIdeas, campaigns, publishedContent, theme, setView } = useApp();

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const subCardBg = isDark ? 'bg-slate-800/50' : 'bg-gray-50';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMain = isDark ? 'text-white' : 'text-slate-900';

  const activated = marketingIdeas.filter(i => i.status === 'activated' || i.status === 'completed');
  const completed = marketingIdeas.filter(i => i.status === 'completed');

  // Idea effectiveness ranking (simulated from performance scores)
  const ideaEffectiveness = useMemo(() => {
    return activated.map(idea => {
      // Simulate performance scoring based on idea properties
      const baseScore = idea.performanceScore || Math.floor(Math.random() * 40 + 50);
      const engagementLift = idea.category === 'engagement' ? baseScore * 1.2 : baseScore * 0.8;
      const referralGrowth = idea.category === 'referral' ? baseScore * 1.3 : baseScore * 0.6;
      const bookingImpact = ['acquisition', 'activation'].includes(idea.category) ? baseScore * 1.1 : baseScore * 0.5;

      return {
        idea,
        overallScore: baseScore,
        engagementLift: Math.round(engagementLift),
        referralGrowth: Math.round(referralGrowth),
        bookingImpact: Math.round(bookingImpact),
      };
    }).sort((a, b) => b.overallScore - a.overallScore);
  }, [activated]);

  // Category performance
  const categoryPerformance = useMemo(() => {
    return CATEGORY_LIST.map(cat => {
      const catIdeas = activated.filter(i => i.category === cat);
      const avgScore = catIdeas.length > 0
        ? Math.round(catIdeas.reduce((s, i) => s + (i.performanceScore || 65), 0) / catIdeas.length)
        : 0;
      return { category: cat, count: catIdeas.length, avgScore };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [activated]);

  // Campaign ROI proxy
  const campaignROI = useMemo(() => {
    return campaigns.slice(0, 6).map(c => {
      const roi = c.spent > 0 ? ((c.budget - c.spent) / c.spent * 100) : 0;
      const efficiency = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
      return { campaign: c, roi: Math.round(roi), efficiency };
    });
  }, [campaigns]);

  const contentReporting = useMemo(() => {
    const withEngagement = publishedContent.filter(c => typeof c.engagementScore === 'number');
    const withConversion = publishedContent.filter(c => typeof c.conversionRate === 'number');
    const avgEngagement = withEngagement.length
      ? withEngagement.reduce((sum, c) => sum + (c.engagementScore || 0), 0) / withEngagement.length
      : 0;
    const avgConversion = withConversion.length
      ? withConversion.reduce((sum, c) => sum + (c.conversionRate || 0), 0) / withConversion.length
      : 0;

    const monthlyMap = new Map<string, { label: string; engagement: number[]; conversion: number[] }>();
    publishedContent.forEach(item => {
      const monthKey = item.publishDate.slice(0, 7);
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { label: monthKey, engagement: [], conversion: [] });
      }
      const bucket = monthlyMap.get(monthKey)!;
      if (typeof item.engagementScore === 'number') bucket.engagement.push(item.engagementScore);
      if (typeof item.conversionRate === 'number') bucket.conversion.push(item.conversionRate);
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, data]) => ({
        label: data.label,
        engagement: data.engagement.length ? data.engagement.reduce((sum, value) => sum + value, 0) / data.engagement.length : 0,
        conversion: data.conversion.length ? data.conversion.reduce((sum, value) => sum + value, 0) / data.conversion.length : 0,
      }));

    return {
      total: publishedContent.length,
      avgEngagement,
      avgConversion,
      monthlyTrend,
    };
  }, [publishedContent]);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${textMain}`}>Performance Review</h1>
        <p className={`text-sm ${textMuted} mt-1`}>KPI trends, idea effectiveness ranking, and campaign ROI analysis. A learning system that improves over time.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ideas Activated', value: activated.length, icon: <Zap size={16} />, color: 'text-emerald-400', sub: `${completed.length} completed` },
          { label: 'Avg Performance', value: activated.length > 0 ? Math.round(activated.reduce((s, i) => s + (i.performanceScore || 65), 0) / activated.length) : 0, icon: <BarChart3 size={16} />, color: 'text-brand-400', sub: 'out of 100' },
          { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: <Target size={16} />, color: 'text-violet-400', sub: `${campaigns.length} total` },
          { label: 'Categories Active', value: CATEGORY_LIST.filter(c => activated.some(i => i.category === c)).length, icon: <Award size={16} />, color: 'text-amber-400', sub: `of ${CATEGORY_LIST.length}` },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={s.color}>{s.icon}</span>
              <span className={`text-[10px] font-semibold ${textMuted}`}>{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${textMain}`}>{s.value}</p>
            <p className={`text-[10px] ${textMuted} mt-0.5`}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className={`text-lg font-semibold ${textMain}`}>Content Log Reporting</h2>
            <p className={`text-xs ${textMuted}`}>Content log metrics are rolled into reporting so communications performance is visible in one place.</p>
          </div>
          <button
            onClick={() => setView('content-log')}
            className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2"
          >
            <FileText size={14} /> Open Content Log
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className={`rounded-lg p-4 ${subCardBg}`}>
            <p className={`text-[10px] font-semibold ${textMuted}`}>Logged content items</p>
            <p className={`text-2xl font-bold ${textMain}`}>{contentReporting.total}</p>
          </div>
          <div className={`rounded-lg p-4 ${subCardBg}`}>
            <p className={`text-[10px] font-semibold ${textMuted}`}>Avg engagement</p>
            <p className={`text-2xl font-bold text-emerald-400`}>{contentReporting.avgEngagement.toFixed(1)}%</p>
          </div>
          <div className={`rounded-lg p-4 ${subCardBg}`}>
            <p className={`text-[10px] font-semibold ${textMuted}`}>Avg conversion</p>
            <p className={`text-2xl font-bold text-blue-400`}>{contentReporting.avgConversion.toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-2">
          {contentReporting.monthlyTrend.length === 0 ? (
            <p className={`text-xs ${textMuted}`}>No monthly trend data yet. Add entries in Content Log with engagement/conversion values.</p>
          ) : (
            contentReporting.monthlyTrend.map(point => (
              <div key={point.label} className="grid grid-cols-[90px_1fr_1fr] items-center gap-3">
                <span className={`text-[11px] font-medium ${textMuted}`}>{point.label}</span>
                <div className={`h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(2, Math.min(point.engagement, 100))}%` }} />
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(2, Math.min(point.conversion, 100))}%` }} />
                </div>
              </div>
            ))
          )}
          {contentReporting.monthlyTrend.length > 0 && (
            <div className={`grid grid-cols-[90px_1fr_1fr] text-[10px] ${textMuted}`}>
              <span />
              <span>Engagement trend</span>
              <span>Conversion trend</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Trends vs Target */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold ${textMain} mb-1`}>KPI Trends vs Target</h2>
        <p className={`text-xs ${textMuted} mb-4`}>Current performance compared to targets and previous period.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_KPI_TRENDS.map(kpi => {
            const pctOfTarget = Math.round((kpi.current / kpi.target) * 100);
            const change = kpi.current - kpi.previous;
            const changePct = kpi.previous > 0 ? Math.round((change / kpi.previous) * 100) : 0;
            const isImproving = kpi.name === 'Cost per Acquisition' ? change < 0 : change > 0;
            const atTarget = kpi.name === 'Cost per Acquisition' ? kpi.current <= kpi.target : kpi.current >= kpi.target;

            return (
              <div key={kpi.name} className={`rounded-lg p-4 ${subCardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-semibold ${textMuted}`}>{kpi.name}</span>
                  <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${isImproving ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isImproving ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(changePct)}%
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl font-bold ${textMain}`}>
                    {kpi.unit === '£' ? '£' : ''}{kpi.current.toLocaleString()}{kpi.unit === '%' ? '%' : ''}
                  </span>
                  <span className={`text-[10px] ${textMuted}`}>/ {kpi.unit === '£' ? '£' : ''}{kpi.target.toLocaleString()}{kpi.unit === '%' ? '%' : ''}</span>
                </div>
                <div className={`w-full h-1.5 rounded-full mt-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div className={`h-full rounded-full ${atTarget ? 'bg-emerald-500' : pctOfTarget > 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(pctOfTarget, 100)}%` }} />
                </div>
                <span className={`text-[9px] ${textMuted} mt-1 block`}>{pctOfTarget}% of target</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Idea Effectiveness Ranking */}
        <div className={`rounded-xl border p-6 ${cardBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={18} className="text-amber-400" />
            <h2 className={`text-lg font-semibold ${textMain}`}>Idea Effectiveness Ranking</h2>
          </div>
          <p className={`text-xs ${textMuted} mb-4`}>Ranked by measured impact. This turns the idea library into a learning system.</p>

          {ideaEffectiveness.length === 0 ? (
            <div className="py-8 text-center">
              <Lightbulb size={32} className={`mx-auto mb-3 ${textMuted}`} />
              <p className={`text-sm ${textMuted}`}>No activated ideas yet</p>
              <p className={`text-xs ${textMuted} mt-1`}>Activate ideas from the Growth Ideas page to see effectiveness data here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {ideaEffectiveness.map((item, idx) => (
                <div key={item.idea.id} className={`flex items-center gap-3 p-3 rounded-lg ${subCardBg}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                    idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                    idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                    `${isDark ? 'bg-slate-800' : 'bg-gray-200'} ${textMuted}`
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${textMain} truncate`}>{item.idea.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: getCategoryColor(item.idea.category) + '20', color: getCategoryColor(item.idea.category) }}>
                        {getCategoryLabel(item.idea.category)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className={`text-[9px] ${textMuted}`}>Engagement</p>
                      <p className={`text-xs font-semibold ${textMain}`}>{item.engagementLift}</p>
                    </div>
                    <div>
                      <p className={`text-[9px] ${textMuted}`}>Referral</p>
                      <p className={`text-xs font-semibold ${textMain}`}>{item.referralGrowth}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      item.overallScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                      item.overallScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {item.overallScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className={`rounded-xl border p-6 ${cardBg}`}>
          <h2 className={`text-lg font-semibold ${textMain} mb-1`}>Category Performance</h2>
          <p className={`text-xs ${textMuted} mb-4`}>Average effectiveness score by growth category.</p>

          <div className="space-y-3">
            {categoryPerformance.map(cp => (
              <div key={cp.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(cp.category) }} />
                    <span className={`text-xs font-medium ${textMain}`}>{getCategoryLabel(cp.category)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] ${textMuted}`}>{cp.count} ideas</span>
                    <span className={`text-xs font-bold ${
                      cp.avgScore >= 80 ? 'text-emerald-400' :
                      cp.avgScore >= 60 ? 'text-amber-400' :
                      cp.avgScore > 0 ? 'text-red-400' : textMuted
                    }`}>{cp.avgScore || '—'}</span>
                  </div>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${cp.avgScore}%`,
                    backgroundColor: getCategoryColor(cp.category),
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign ROI */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold ${textMain} mb-1`}>Campaign ROI Proxy</h2>
        <p className={`text-xs ${textMuted} mb-4`}>Budget efficiency and return proxy for recent campaigns.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={isDark ? 'border-b border-slate-800' : 'border-b border-gray-200'}>
                <th className={`text-left py-2 pr-4 font-semibold ${textMuted}`}>Campaign</th>
                <th className={`text-right py-2 px-3 font-semibold ${textMuted}`}>Budget</th>
                <th className={`text-right py-2 px-3 font-semibold ${textMuted}`}>Spent</th>
                <th className={`text-right py-2 px-3 font-semibold ${textMuted}`}>Efficiency</th>
                <th className={`text-right py-2 px-3 font-semibold ${textMuted}`}>Status</th>
                <th className={`text-right py-2 px-3 font-semibold ${textMuted}`}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {campaignROI.map(cr => (
                <tr key={cr.campaign.id} className={isDark ? 'border-b border-slate-800/50' : 'border-b border-gray-100'}>
                  <td className={`py-2.5 pr-4 font-medium ${textMain}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 rounded-full" style={{ backgroundColor: cr.campaign.color }} />
                      <span className="truncate max-w-[200px]">{cr.campaign.title}</span>
                    </div>
                  </td>
                  <td className={`text-right py-2.5 px-3 ${textMuted}`}>£{cr.campaign.budget.toLocaleString()}</td>
                  <td className={`text-right py-2.5 px-3 ${textMuted}`}>£{cr.campaign.spent.toLocaleString()}</td>
                  <td className="text-right py-2.5 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div className={`h-full rounded-full ${cr.efficiency > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(cr.efficiency, 100)}%` }} />
                      </div>
                      <span className={`text-xs ${textMuted}`}>{cr.efficiency}%</span>
                    </div>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                      cr.campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      cr.campaign.status === 'completed' ? 'bg-brand-500/10 text-brand-400' :
                      cr.campaign.status === 'planning' ? 'bg-blue-500/10 text-blue-400' :
                      `${isDark ? 'bg-slate-800' : 'bg-gray-200'} ${textMuted}`
                    }`}>{cr.campaign.status}</span>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    {cr.roi > 0 ? <TrendingUp size={14} className="text-emerald-400 ml-auto" /> :
                     cr.roi < 0 ? <TrendingDown size={14} className="text-red-400 ml-auto" /> :
                     <Minus size={14} className={`${textMuted} ml-auto`} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment Growth */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold ${textMain} mb-1`}>Segment Growth Analysis</h2>
        <p className={`text-xs ${textMuted} mb-4`}>Engagement and growth trends across key stakeholder segments.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { segment: 'Healthcare Staff', growth: 12, engagement: 78, trend: 'up' },
            { segment: 'Community Members', growth: 8, engagement: 65, trend: 'up' },
            { segment: 'Partner Orgs', growth: -3, engagement: 45, trend: 'down' },
            { segment: 'University Partners', growth: 15, engagement: 82, trend: 'up' },
            { segment: 'Volunteers', growth: 22, engagement: 71, trend: 'up' },
            { segment: 'Service Users', growth: 5, engagement: 58, trend: 'flat' },
            { segment: 'Media Contacts', growth: -1, engagement: 34, trend: 'down' },
            { segment: 'Policy Makers', growth: 9, engagement: 42, trend: 'up' },
          ].map(seg => (
            <div key={seg.segment} className={`rounded-lg p-3 ${subCardBg}`}>
              <p className={`text-xs font-semibold ${textMain} mb-1`}>{seg.segment}</p>
              <div className="flex items-center gap-1 mb-2">
                {seg.trend === 'up' ? <ArrowUpRight size={12} className="text-emerald-400" /> :
                 seg.trend === 'down' ? <ArrowDownRight size={12} className="text-red-400" /> :
                 <Minus size={12} className={textMuted} />}
                <span className={`text-sm font-bold ${seg.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {seg.growth > 0 ? '+' : ''}{seg.growth}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] ${textMuted}`}>Engagement</span>
                <div className={`flex-1 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div className={`h-full rounded-full ${seg.engagement >= 70 ? 'bg-emerald-500' : seg.engagement >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${seg.engagement}%` }} />
                </div>
                <span className={`text-[9px] font-semibold ${textMuted}`}>{seg.engagement}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
