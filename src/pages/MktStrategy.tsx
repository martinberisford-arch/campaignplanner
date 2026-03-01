import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { IdeaCategory, MarketingIdea } from '../types';
import { calculateGrowthCoverage, getCategoryLabel, getCategoryColor, CATEGORY_LIST, getRecommendations } from '../data/marketingIdeas';
import { Target, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, ChevronDown, ChevronRight, BarChart3, Zap, Shield } from 'lucide-react';

const BUDGET_OPTIONS = ['low', 'medium', 'high'] as const;
const TIME_OPTIONS = ['quick-win', '30-60-days', 'long-term'] as const;
const STAGE_OPTIONS = ['early', 'growth', 'mature'] as const;

export default function MktStrategy() {
  const { marketingIdeas, activateIdea, addCampaign, trackEvent, theme, campaigns } = useApp();
  const [budgetFilter, setBudgetFilter] = useState<typeof BUDGET_OPTIONS[number]>('medium');
  const [timeFilter, setTimeFilter] = useState<typeof TIME_OPTIONS[number]>('30-60-days');
  const [stageFilter, setStageFilter] = useState<typeof STAGE_OPTIONS[number]>('growth');
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set());

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const subCardBg = isDark ? 'bg-slate-800/50' : 'bg-gray-50';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMain = isDark ? 'text-white' : 'text-slate-900';

  const coverage = useMemo(() => calculateGrowthCoverage(marketingIdeas), [marketingIdeas]);

  const activatedByCategory = useMemo(() => {
    const map: Record<IdeaCategory, number> = {} as Record<IdeaCategory, number>;
    CATEGORY_LIST.forEach(c => {
      map[c] = marketingIdeas.filter(i => i.category === c && (i.status === 'activated' || i.status === 'completed')).length;
    });
    return map;
  }, [marketingIdeas]);

  const totalByCategory = useMemo(() => {
    const map: Record<IdeaCategory, number> = {} as Record<IdeaCategory, number>;
    CATEGORY_LIST.forEach(c => {
      map[c] = marketingIdeas.filter(i => i.category === c).length;
    });
    return map;
  }, [marketingIdeas]);

  const recommendations = useMemo(() => {
    return getRecommendations(marketingIdeas, {
      kpiGaps: [
        { kpi: 'referral', gap: 45 },
        { kpi: 'engagement', gap: 30 },
        { kpi: 'organic traffic', gap: 25 },
        { kpi: 'brand awareness', gap: 20 },
      ],
      underEngagedSegments: ['Community team', 'Youth', 'Partner organisation'],
      activatedIdeaCategories: marketingIdeas.filter(i => i.status === 'activated').map(i => i.category),
      budgetConstraint: budgetFilter,
      timeConstraint: timeFilter,
      organisationStage: stageFilter,
    });
  }, [marketingIdeas, budgetFilter, timeFilter, stageFilter]);

  // Radar chart — simple SVG
  const radarSize = 280;
  const radarCenter = radarSize / 2;
  const radarRadius = 110;
  const radarAngles = CATEGORY_LIST.map((_, i) => (Math.PI * 2 * i) / CATEGORY_LIST.length - Math.PI / 2);

  const radarPoints = (values: number[]) =>
    values.map((v, i) => {
      const r = (v / 100) * radarRadius;
      const x = radarCenter + r * Math.cos(radarAngles[i]);
      const y = radarCenter + r * Math.sin(radarAngles[i]);
      return `${x},${y}`;
    }).join(' ');

  const coverageValues = CATEGORY_LIST.map(c => (coverage as unknown as Record<string, number>)[c] || 0);
  const maxCoverage = Math.max(...coverageValues, 1);

  const totalActivated = marketingIdeas.filter(i => i.status === 'activated' || i.status === 'completed').length;
  const overReliance = CATEGORY_LIST.filter(c => activatedByCategory[c] > totalActivated * 0.4 && totalActivated > 2);

  const handleActivateIdea = (idea: MarketingIdea) => {
    setActivatingId(idea.id);
    trackEvent('idea_activated', idea.id);

    const newCampaign = {
      id: `c-${Date.now()}`,
      title: idea.name,
      description: idea.description,
      status: 'planning' as const,
      priority: idea.governanceRisk === 'high' ? 'high' as const : idea.governanceRisk === 'medium' ? 'medium' as const : 'low' as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + (idea.timeline === 'quick-win' ? 14 : idea.timeline === '30-60-days' ? 45 : 90) * 86400000).toISOString().split('T')[0],
      budget: idea.budget === 'low' ? 5000 : idea.budget === 'medium' ? 25000 : 75000,
      spent: 0,
      owner: { id: 'u1', name: 'Admin User', email: 'admin@campaignos.com', role: 'admin' as const, avatar: 'AU', department: 'Communications' },
      team: [],
      channels: [] as never[],
      goals: [idea.expectedOutcome],
      audiences: idea.requiredStakeholders,
      tasks: idea.executionChecklist.map((step, idx) => ({
        id: `t-${Date.now()}-${idx}`,
        title: step,
        description: '',
        status: 'todo' as const,
        dueDate: new Date(Date.now() + ((idx + 1) * 7) * 86400000).toISOString().split('T')[0],
        priority: 'medium' as const,
        campaignId: `c-${Date.now()}`,
        tags: [idea.category],
      })),
      kpis: [
        { id: `kpi-${Date.now()}-1`, name: idea.primaryKPI, value: 0, target: 100, unit: '%', trend: 0, category: 'primary' },
        { id: `kpi-${Date.now()}-2`, name: idea.secondaryKPI, value: 0, target: 100, unit: '%', trend: 0, category: 'secondary' },
      ],
      workspace: 'ws-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: getCategoryColor(idea.category),
    };

    addCampaign(newCampaign);
    activateIdea(idea.id, newCampaign.id);
    setActivatedIds(prev => new Set(prev).add(idea.id));

    setTimeout(() => setActivatingId(null), 1500);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textMain}`}>Marketing Strategy</h1>
        <p className={`text-sm ${textMuted} mt-1`}>Growth coverage analysis, idea recommendations, and strategic balance across 8 marketing pillars.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Ideas', value: marketingIdeas.length, icon: <Lightbulb size={18} />, color: 'text-amber-400' },
          { label: 'Activated', value: totalActivated, icon: <Zap size={18} />, color: 'text-emerald-400' },
          { label: 'Categories Covered', value: CATEGORY_LIST.filter(c => activatedByCategory[c] > 0).length + '/' + CATEGORY_LIST.length, icon: <Target size={18} />, color: 'text-brand-400' },
          { label: 'Campaigns Created', value: campaigns.length, icon: <BarChart3 size={18} />, color: 'text-violet-400' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border p-4 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={stat.color}>{stat.icon}</span>
              <span className={`text-xs font-medium ${textMuted}`}>{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${textMain}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Over-reliance warning */}
      {overReliance.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`text-sm font-semibold ${textMain}`}>Strategy Imbalance Detected</p>
            <p className={`text-xs ${textMuted} mt-1`}>
              Over-reliance on: {overReliance.map(c => getCategoryLabel(c)).join(', ')}. Consider diversifying your marketing activities across other growth pillars for balanced coverage.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Coverage Radar */}
        <div className={`rounded-xl border p-6 ${cardBg}`}>
          <h2 className={`text-lg font-semibold ${textMain} mb-1`}>Growth Coverage Radar</h2>
          <p className={`text-xs ${textMuted} mb-4`}>Activated ideas across 8 growth categories. Aim for balanced coverage.</p>

          <div className="flex justify-center">
            <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
              {/* Grid rings */}
              {[25, 50, 75, 100].map(ring => (
                <polygon key={ring}
                  points={radarAngles.map((a) => {
                    const r = (ring / 100) * radarRadius;
                    return `${radarCenter + r * Math.cos(a)},${radarCenter + r * Math.sin(a)}`;
                  }).join(' ')}
                  fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="1" />
              ))}
              {/* Axis lines */}
              {radarAngles.map((a, i) => (
                <line key={i} x1={radarCenter} y1={radarCenter}
                  x2={radarCenter + radarRadius * Math.cos(a)}
                  y2={radarCenter + radarRadius * Math.sin(a)}
                  stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="1" />
              ))}
              {/* Data polygon */}
              <polygon
                points={radarPoints(coverageValues.map(v => (v / Math.max(maxCoverage, 1)) * 100))}
                fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="2" />
              {/* Data dots */}
              {coverageValues.map((v, i) => {
                const r = ((v / Math.max(maxCoverage, 1)) * 100 / 100) * radarRadius;
                const x = radarCenter + r * Math.cos(radarAngles[i]);
                const y = radarCenter + r * Math.sin(radarAngles[i]);
                return <circle key={i} cx={x} cy={y} r="4" fill={getCategoryColor(CATEGORY_LIST[i])} stroke="white" strokeWidth="1.5" />;
              })}
              {/* Labels */}
              {CATEGORY_LIST.map((cat, i) => {
                const r = radarRadius + 22;
                const x = radarCenter + r * Math.cos(radarAngles[i]);
                const y = radarCenter + r * Math.sin(radarAngles[i]);
                return (
                  <text key={cat} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                    fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10" fontWeight="500">
                    {getCategoryLabel(cat)}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Category breakdown */}
          <div className="mt-4 space-y-2">
            {CATEGORY_LIST.map(cat => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(cat) }} />
                <span className={`text-xs font-medium flex-1 ${textMuted}`}>{getCategoryLabel(cat)}</span>
                <span className={`text-xs font-semibold ${textMain}`}>{activatedByCategory[cat]}/{totalByCategory[cat]}</span>
                <div className={`w-20 h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full" style={{
                    width: `${totalByCategory[cat] > 0 ? (activatedByCategory[cat] / totalByCategory[cat]) * 100 : 0}%`,
                    backgroundColor: getCategoryColor(cat),
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Engine */}
        <div className={`rounded-xl border p-6 ${cardBg}`}>
          <h2 className={`text-lg font-semibold ${textMain} mb-1`}>Idea Recommendations</h2>
          <p className={`text-xs ${textMuted} mb-4`}>Deterministic recommendations based on your KPI gaps, budget, and timeline constraints.</p>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div>
              <label className={`text-[10px] font-semibold ${textMuted} block mb-1`}>Budget</label>
              <select value={budgetFilter} onChange={e => setBudgetFilter(e.target.value as typeof budgetFilter)}
                className={`text-xs rounded-lg px-3 py-1.5 border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-900'}`}>
                {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-[10px] font-semibold ${textMuted} block mb-1`}>Timeline</label>
              <select value={timeFilter} onChange={e => setTimeFilter(e.target.value as typeof timeFilter)}
                className={`text-xs rounded-lg px-3 py-1.5 border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-900'}`}>
                <option value="quick-win">Quick Win</option>
                <option value="30-60-days">30–60 Days</option>
                <option value="long-term">Long-term</option>
              </select>
            </div>
            <div>
              <label className={`text-[10px] font-semibold ${textMuted} block mb-1`}>Stage</label>
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value as typeof stageFilter)}
                className={`text-xs rounded-lg px-3 py-1.5 border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-900'}`}>
                {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Recommendation list */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {recommendations.length === 0 && (
              <p className={`text-sm ${textMuted} py-8 text-center`}>No recommendations match your current filters. Try broadening constraints.</p>
            )}
            {recommendations.slice(0, 8).map(rec => (
              <div key={rec.idea.id} className={`rounded-lg border p-3 transition-colors ${isDark ? 'border-slate-800 hover:border-slate-700' : 'border-gray-200 hover:border-gray-300'} ${subCardBg}`}>
                <button className="w-full text-left flex items-start gap-3"
                  onClick={() => { setExpandedRec(expandedRec === rec.idea.id ? null : rec.idea.id); trackEvent('idea_viewed', rec.idea.id); }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: getCategoryColor(rec.idea.category) }}>
                    {rec.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${textMain} truncate`}>{rec.idea.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium`}
                        style={{ backgroundColor: getCategoryColor(rec.idea.category) + '20', color: getCategoryColor(rec.idea.category) }}>
                        {getCategoryLabel(rec.idea.category)}
                      </span>
                      <span className={`text-[10px] ${textMuted}`}>{rec.idea.timeline}</span>
                      <span className={`text-[10px] ${textMuted}`}>£{rec.idea.budget}</span>
                    </div>
                  </div>
                  {expandedRec === rec.idea.id ? <ChevronDown size={16} className={textMuted} /> : <ChevronRight size={16} className={textMuted} />}
                </button>

                {expandedRec === rec.idea.id && (
                  <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-3 animate-fade-in">
                    <p className={`text-xs ${textMuted}`}>{rec.idea.description}</p>

                    <div>
                      <p className={`text-[10px] font-semibold ${textMuted} mb-1`}>Why Recommended</p>
                      {rec.reasons.map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5 mb-0.5">
                          <CheckCircle2 size={10} className="text-emerald-400" />
                          <span className={`text-[11px] ${textMuted}`}>{r}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <div>
                        <p className={`text-[10px] font-semibold ${textMuted}`}>Primary KPI</p>
                        <p className={`text-xs ${textMain}`}>{rec.idea.primaryKPI}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-semibold ${textMuted}`}>Governance Risk</p>
                        <p className={`text-xs ${rec.idea.governanceRisk === 'high' ? 'text-red-400' : rec.idea.governanceRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {rec.idea.governanceRisk.charAt(0).toUpperCase() + rec.idea.governanceRisk.slice(1)}
                        </p>
                      </div>
                    </div>

                    {rec.idea.dpiaRequired && (
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Shield size={12} />
                        <span className="text-[10px] font-medium">DPIA Required</span>
                      </div>
                    )}

                    {activatedIds.has(rec.idea.id) ? (
                      <div className="flex items-center gap-2 text-emerald-400 py-1.5">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-semibold">Activated — campaign created</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleActivateIdea(rec.idea)}
                        disabled={activatingId === rec.idea.id}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                      >
                        {activatingId === rec.idea.id ? (
                          <>Activating...</>
                        ) : (
                          <>
                            <Zap size={12} /> Activate Idea
                            <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals alignment */}
      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h2 className={`text-lg font-semibold ${textMain} mb-1`}>KPI Alignment Matrix</h2>
        <p className={`text-xs ${textMuted} mb-4`}>How the 139 ideas map to key performance indicators. Each idea must have clear KPI alignment before activation.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={isDark ? 'border-b border-slate-800' : 'border-b border-gray-200'}>
                <th className={`text-left py-2 pr-4 font-semibold ${textMuted}`}>KPI Area</th>
                <th className={`text-center py-2 px-3 font-semibold ${textMuted}`}>Total Ideas</th>
                <th className={`text-center py-2 px-3 font-semibold ${textMuted}`}>Activated</th>
                <th className={`text-center py-2 px-3 font-semibold ${textMuted}`}>Coverage</th>
                <th className={`text-left py-2 px-3 font-semibold ${textMuted}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                'Engagement rate', 'Organic traffic', 'Referral conversion rate', 'Brand awareness',
                'Cost per acquisition', 'Activation rate', 'Satisfaction score', 'Media mentions',
              ].map(kpi => {
                const matching = marketingIdeas.filter(i => i.primaryKPI.toLowerCase().includes(kpi.toLowerCase()));
                const activated = matching.filter(i => i.status === 'activated' || i.status === 'completed');
                const pct = matching.length > 0 ? Math.round((activated.length / matching.length) * 100) : 0;
                return (
                  <tr key={kpi} className={isDark ? 'border-b border-slate-800/50' : 'border-b border-gray-100'}>
                    <td className={`py-2 pr-4 font-medium ${textMain}`}>{kpi}</td>
                    <td className="text-center py-2 px-3">{matching.length}</td>
                    <td className="text-center py-2 px-3">{activated.length}</td>
                    <td className="text-center py-2 px-3">
                      <div className={`w-16 h-1.5 rounded-full mx-auto ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        pct === 0 ? 'bg-red-500/10 text-red-400' : pct < 30 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {pct === 0 ? 'No coverage' : pct < 30 ? 'Low' : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
