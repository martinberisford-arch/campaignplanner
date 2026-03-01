import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { IdeaCategory, MarketingIdea } from '../types';
import { getCategoryLabel, getCategoryColor, CATEGORY_LIST } from '../data/marketingIdeas';
import {
  Search, Filter, Lightbulb, Zap, CheckCircle2, Shield,
  ArrowRight, X, Eye, LayoutGrid, List
} from 'lucide-react';

export default function MktIdeas() {
  const { marketingIdeas, activateIdea, addCampaign, trackEvent, theme } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<IdeaCategory | 'all'>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detailIdea, setDetailIdea] = useState<MarketingIdea | null>(null);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const subCardBg = isDark ? 'bg-slate-800/50' : 'bg-gray-50';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-900';

  const filtered = useMemo(() => {
    return marketingIdeas.filter(i => {
      if (!i.deletedAt) {
        if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase()) && !i.primaryKPI.toLowerCase().includes(search.toLowerCase())) return false;
        if (catFilter !== 'all' && i.category !== catFilter) return false;
        if (budgetFilter !== 'all' && i.budget !== budgetFilter) return false;
        if (timeFilter !== 'all' && i.timeline !== timeFilter) return false;
        if (stageFilter !== 'all' && i.stage !== stageFilter) return false;
        if (statusFilter !== 'all' && i.status !== statusFilter) return false;
        if (riskFilter !== 'all' && i.governanceRisk !== riskFilter) return false;
        return true;
      }
      return false;
    });
  }, [marketingIdeas, search, catFilter, budgetFilter, timeFilter, stageFilter, statusFilter, riskFilter]);

  const handleActivate = (idea: MarketingIdea) => {
    setActivatingId(idea.id);
    trackEvent('idea_activated', idea.id);

    const newCampaign = {
      id: `c-${Date.now()}`,
      title: idea.name,
      description: idea.description,
      status: 'planning' as const,
      priority: idea.governanceRisk === 'high' ? 'high' as const : 'medium' as const,
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
    setTimeout(() => setActivatingId(null), 1500);
  };

  const activeFilterCount = [catFilter !== 'all', budgetFilter !== 'all', timeFilter !== 'all', stageFilter !== 'all', statusFilter !== 'all', riskFilter !== 'all'].filter(Boolean).length;

  const clearFilters = () => {
    setCatFilter('all'); setBudgetFilter('all'); setTimeFilter('all');
    setStageFilter('all'); setStatusFilter('all'); setRiskFilter('all'); setSearch('');
  };

  const statusBadge = (status: MarketingIdea['status']) => {
    const map = {
      library: { bg: 'bg-slate-500/10 text-slate-400', label: 'Library' },
      shortlisted: { bg: 'bg-blue-500/10 text-blue-400', label: 'Shortlisted' },
      activated: { bg: 'bg-emerald-500/10 text-emerald-400', label: 'Activated' },
      completed: { bg: 'bg-brand-500/10 text-brand-400', label: 'Completed' },
      paused: { bg: 'bg-amber-500/10 text-amber-400', label: 'Paused' },
    };
    const s = map[status];
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.bg}`}>{s.label}</span>;
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Growth Ideas Framework</h1>
          <p className={`text-sm ${textMuted} mt-1`}>{marketingIdeas.length} structured ideas · {filtered.length} shown · Filterable, executable, KPI-linked</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-brand-600/20 text-brand-400' : textMuted + ' hover:bg-slate-800'}`}><List size={18} /></button>
          <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg ${viewMode === 'card' ? 'bg-brand-600/20 text-brand-400' : textMuted + ' hover:bg-slate-800'}`}><LayoutGrid size={18} /></button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={`rounded-xl border p-3 ${cardBg}`}>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search ideas by name, description, or KPI..."
              className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm border ${inputBg} focus:outline-none focus:ring-2 focus:ring-brand-500/50`} />
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-brand-600/10 border-brand-500/30 text-brand-400' : `${cardBg} ${textMuted}`}`}>
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
          </button>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 font-medium">Clear all</button>
          )}

          {/* Category quick filters */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setCatFilter('all')}
              className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${catFilter === 'all' ? 'bg-brand-600 text-white' : `${subCardBg} ${textMuted}`}`}>All</button>
            {CATEGORY_LIST.map(cat => (
              <button key={cat} onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
                className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors`}
                style={catFilter === cat ? { backgroundColor: getCategoryColor(cat), color: 'white' } : {}}>
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-700/30 flex gap-4 flex-wrap animate-fade-in">
            {[
              { label: 'Budget', value: budgetFilter, set: setBudgetFilter, options: ['all', 'low', 'medium', 'high'] },
              { label: 'Timeline', value: timeFilter, set: setTimeFilter, options: ['all', 'quick-win', '30-60-days', 'long-term'] },
              { label: 'Stage', value: stageFilter, set: setStageFilter, options: ['all', 'early', 'growth', 'mature'] },
              { label: 'Status', value: statusFilter, set: setStatusFilter, options: ['all', 'library', 'shortlisted', 'activated', 'completed', 'paused'] },
              { label: 'Risk', value: riskFilter, set: setRiskFilter, options: ['all', 'low', 'medium', 'high'] },
            ].map(f => (
              <div key={f.label}>
                <label className={`text-[10px] font-semibold ${textMuted} block mb-1`}>{f.label}</label>
                <select value={f.value} onChange={e => f.set(e.target.value)}
                  className={`text-xs rounded-lg px-3 py-1.5 border ${inputBg}`}>
                  {f.options.map(o => <option key={o} value={o}>{o === 'all' ? `All ${f.label}s` : o.charAt(0).toUpperCase() + o.slice(1).replace(/-/g, ' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? 'bg-slate-800/50 border-b border-slate-800' : 'bg-gray-50 border-b border-gray-200'}>
                  <th className={`text-left py-3 px-4 font-semibold ${textMuted}`}>#</th>
                  <th className={`text-left py-3 px-4 font-semibold ${textMuted}`}>Idea</th>
                  <th className={`text-left py-3 px-3 font-semibold ${textMuted}`}>Category</th>
                  <th className={`text-left py-3 px-3 font-semibold ${textMuted}`}>Budget</th>
                  <th className={`text-left py-3 px-3 font-semibold ${textMuted}`}>Timeline</th>
                  <th className={`text-left py-3 px-3 font-semibold ${textMuted}`}>Primary KPI</th>
                  <th className={`text-left py-3 px-3 font-semibold ${textMuted}`}>Risk</th>
                  <th className={`text-left py-3 px-3 font-semibold ${textMuted}`}>Status</th>
                  <th className={`text-right py-3 px-4 font-semibold ${textMuted}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((idea, idx) => (
                  <tr key={idea.id}
                    className={`transition-colors cursor-pointer ${isDark ? 'border-b border-slate-800/50 hover:bg-slate-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} ${expandedId === idea.id ? (isDark ? 'bg-slate-800/20' : 'bg-gray-50') : ''}`}
                    onClick={() => { setExpandedId(expandedId === idea.id ? null : idea.id); trackEvent('idea_viewed', idea.id); }}>
                    <td className={`py-2.5 px-4 font-mono ${textMuted}`}>{idx + 1}</td>
                    <td className="py-2.5 px-4">
                      <p className={`font-medium ${textMain} truncate max-w-[250px]`}>{idea.name}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: getCategoryColor(idea.category) + '20', color: getCategoryColor(idea.category) }}>
                        {getCategoryLabel(idea.category)}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 capitalize ${textMuted}`}>{idea.budget}</td>
                    <td className={`py-2.5 px-3 ${textMuted}`}>{idea.timeline.replace(/-/g, ' ')}</td>
                    <td className={`py-2.5 px-3 ${textMuted} truncate max-w-[150px]`}>{idea.primaryKPI}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        idea.governanceRisk === 'high' ? 'bg-red-500/10 text-red-400' :
                        idea.governanceRisk === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>{idea.governanceRisk}</span>
                    </td>
                    <td className="py-2.5 px-3">{statusBadge(idea.status)}</td>
                    <td className="py-2.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailIdea(idea)} className={`p-1.5 rounded-lg hover:bg-slate-700/50 ${textMuted}`} title="View details"><Eye size={14} /></button>
                        {idea.status === 'library' && (
                          <button onClick={() => handleActivate(idea)}
                            disabled={activatingId === idea.id}
                            className="p-1.5 rounded-lg text-brand-400 hover:bg-brand-600/10" title="Activate idea">
                            <Zap size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Lightbulb size={32} className={`mx-auto mb-3 ${textMuted}`} />
              <p className={`text-sm ${textMuted}`}>No ideas match your current filters</p>
              <button onClick={clearFilters} className="text-xs text-brand-400 hover:text-brand-300 mt-2 font-medium">Clear all filters</button>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(idea => (
            <div key={idea.id} className={`rounded-xl border p-4 transition-colors ${cardBg} hover:border-brand-500/30`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(idea.category) + '20' }}>
                  <Lightbulb size={18} style={{ color: getCategoryColor(idea.category) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${textMain} line-clamp-1`}>{idea.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: getCategoryColor(idea.category) + '20', color: getCategoryColor(idea.category) }}>
                      {getCategoryLabel(idea.category)}
                    </span>
                    {statusBadge(idea.status)}
                  </div>
                </div>
              </div>
              <p className={`text-xs ${textMuted} line-clamp-2 mb-3`}>{idea.description}</p>
              <div className="flex items-center gap-3 text-[10px] mb-3 flex-wrap">
                <span className={textMuted}>💰 {idea.budget}</span>
                <span className={textMuted}>⏱ {idea.timeline.replace(/-/g, ' ')}</span>
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                  idea.governanceRisk === 'high' ? 'bg-red-500/10 text-red-400' :
                  idea.governanceRisk === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>{idea.governanceRisk} risk</span>
              </div>
              <div className={`text-[10px] ${textMuted} mb-3`}>
                <span className="font-semibold">KPI:</span> {idea.primaryKPI}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDetailIdea(idea)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-50'} ${textMuted}`}>
                  Details
                </button>
                {idea.status === 'library' && (
                  <button onClick={() => handleActivate(idea)}
                    disabled={activatingId === idea.id}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1 disabled:opacity-50">
                    <Zap size={12} /> Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailIdea && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailIdea(null)} />
          <div className={`relative rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <div className={`sticky top-0 z-10 p-6 pb-4 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: getCategoryColor(detailIdea.category) + '20', color: getCategoryColor(detailIdea.category) }}>
                      {getCategoryLabel(detailIdea.category)}
                    </span>
                    {statusBadge(detailIdea.status)}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      detailIdea.governanceRisk === 'high' ? 'bg-red-500/10 text-red-400' :
                      detailIdea.governanceRisk === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>{detailIdea.governanceRisk} risk</span>
                  </div>
                  <h2 className={`text-xl font-bold ${textMain}`}>{detailIdea.name}</h2>
                </div>
                <button onClick={() => setDetailIdea(null)} className={`p-2 rounded-lg ${textMuted} hover:bg-slate-700/50`}><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className={`text-xs font-semibold ${textMuted} mb-1`}>Description</h3>
                <p className={`text-sm ${textMain}`}>{detailIdea.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className={`rounded-lg p-3 ${subCardBg}`}>
                  <p className={`text-[10px] font-semibold ${textMuted}`}>Budget</p>
                  <p className={`text-sm font-semibold capitalize ${textMain}`}>{detailIdea.budget}</p>
                </div>
                <div className={`rounded-lg p-3 ${subCardBg}`}>
                  <p className={`text-[10px] font-semibold ${textMuted}`}>Timeline</p>
                  <p className={`text-sm font-semibold ${textMain}`}>{detailIdea.timeline.replace(/-/g, ' ')}</p>
                </div>
                <div className={`rounded-lg p-3 ${subCardBg}`}>
                  <p className={`text-[10px] font-semibold ${textMuted}`}>Stage</p>
                  <p className={`text-sm font-semibold capitalize ${textMain}`}>{detailIdea.stage}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className={`text-xs font-semibold ${textMuted} mb-1`}>Primary KPI</h3>
                  <p className={`text-sm ${textMain}`}>{detailIdea.primaryKPI}</p>
                </div>
                <div>
                  <h3 className={`text-xs font-semibold ${textMuted} mb-1`}>Secondary KPI</h3>
                  <p className={`text-sm ${textMain}`}>{detailIdea.secondaryKPI}</p>
                </div>
              </div>

              <div>
                <h3 className={`text-xs font-semibold ${textMuted} mb-1`}>Expected Outcome</h3>
                <p className={`text-sm ${textMain}`}>{detailIdea.expectedOutcome}</p>
              </div>

              <div>
                <h3 className={`text-xs font-semibold ${textMuted} mb-1`}>Measurement Plan</h3>
                <p className={`text-sm ${textMain}`}>{detailIdea.measurementPlan}</p>
              </div>

              <div>
                <h3 className={`text-xs font-semibold ${textMuted} mb-2`}>Execution Checklist</h3>
                <div className="space-y-1">
                  {detailIdea.executionChecklist.map((step, i) => (
                    <div key={i} className={`flex items-center gap-2 py-1 text-xs ${textMain}`}>
                      <CheckCircle2 size={12} className={textMuted} />
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className={`text-xs font-semibold ${textMuted} mb-1`}>Required Assets</h3>
                  <div className="flex flex-wrap gap-1">
                    {detailIdea.requiredAssets.map((a, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${subCardBg} ${textMuted}`}>{a}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className={`text-xs font-semibold ${textMuted} mb-1`}>Stakeholders</h3>
                  <div className="flex flex-wrap gap-1">
                    {detailIdea.requiredStakeholders.map((s, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${subCardBg} ${textMuted}`}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Governance section */}
              <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-brand-400" />
                  <h3 className={`text-xs font-semibold ${textMain}`}>Governance & DPIA</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'DPIA Required', value: detailIdea.dpiaRequired, icon: detailIdea.dpiaRequired ? '⚠️' : '✅' },
                    { label: 'Consent Required', value: detailIdea.consentRequired, icon: detailIdea.consentRequired ? '⚠️' : '✅' },
                    { label: 'Asset Consent', value: detailIdea.assetConsentRequired, icon: detailIdea.assetConsentRequired ? '⚠️' : '✅' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className={`text-xs ${textMuted}`}>{item.label}: <span className={`font-semibold ${item.value ? 'text-amber-400' : 'text-emerald-400'}`}>{item.value ? 'Yes' : 'No'}</span></span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1">
                  <p className={`text-[10px] ${textMuted}`}><span className="font-semibold">Retention:</span> {detailIdea.retentionImplication}</p>
                  <p className={`text-[10px] ${textMuted}`}><span className="font-semibold">Lawful Basis:</span> {detailIdea.lawfulBasis}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {detailIdea.status === 'library' && (
                  <button onClick={() => { handleActivate(detailIdea); setDetailIdea(null); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold text-white transition-colors">
                    <Zap size={14} /> Activate Idea <ArrowRight size={14} />
                  </button>
                )}
                <button onClick={() => setDetailIdea(null)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-50'} ${textMuted}`}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
