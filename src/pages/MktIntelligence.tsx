import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { InsightCategory } from '../types';
import { generateInsights } from '../utils/intelligenceEngine';
import { MENTAL_MODELS } from '../data/mentalModels';
import {
  Brain, Lightbulb, TrendingUp, Target, Filter, Search,
  ChevronDown, ChevronRight, Zap, ArrowRight, BarChart3,
  CheckCircle2, RefreshCw, BookOpen
} from 'lucide-react';

const CATEGORY_CONFIG: Record<InsightCategory, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  campaign: { label: 'Campaign', color: 'text-brand-400', bg: 'bg-brand-500/10', icon: <Target size={14} /> },
  referral: { label: 'Referral', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: <Zap size={14} /> },
  engagement: { label: 'Engagement', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <TrendingUp size={14} /> },
  benchmark: { label: 'Benchmark', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: <BarChart3 size={14} /> },
  content: { label: 'Content', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <BookOpen size={14} /> },
  audience: { label: 'Audience', color: 'text-pink-400', bg: 'bg-pink-500/10', icon: <Brain size={14} /> },
};

export default function MktIntelligence() {
  const {
    campaigns, kpiChannelData, kpiTimeSeriesData, marketingIdeas, approvals, theme, setView
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | 'all'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isDark = theme === 'dark';

  // Generate insights
  const insights = useMemo(() => {
    return generateInsights({
      campaigns,
      kpiChannelData,
      kpiTimeSeriesData,
      marketingIdeas,
      approvals,
    });
  }, [campaigns, kpiChannelData, kpiTimeSeriesData, marketingIdeas, approvals]);

  // Filter insights
  const filteredInsights = useMemo(() => {
    let result = insights;

    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter);
    }

    if (confidenceFilter === 'high') {
      result = result.filter(i => i.confidence >= 0.85);
    } else if (confidenceFilter === 'medium') {
      result = result.filter(i => i.confidence >= 0.7 && i.confidence < 0.85);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        (i.action && i.action.toLowerCase().includes(q))
      );
    }

    return result;
  }, [insights, categoryFilter, confidenceFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: insights.length,
    highConfidence: insights.filter(i => i.confidence >= 0.85).length,
    actionable: insights.filter(i => i.actionable).length,
    avgConfidence: insights.length > 0 ? insights.reduce((s, i) => s + i.confidence, 0) / insights.length : 0,
  }), [insights]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-emerald-400 bg-emerald-500/10';
    if (confidence >= 0.7) return 'text-amber-400 bg-amber-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  const getMentalModelInfo = (modelId?: string) => {
    if (!modelId) return null;
    return MENTAL_MODELS.find(m => m.id === modelId);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            Marketing Intelligence
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Auto-generated insights from your campaign and KPI data
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isDark ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-gray-200 hover:bg-gray-50'
          } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh Insights
        </button>
      </div>

      {/* Summary Strip */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl ${isDark ? 'bg-slate-900/50 border border-slate-800' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Total Insights</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-emerald-400">{stats.highConfidence}</p>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>High Confidence</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-brand-400">{stats.actionable}</p>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Actionable</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">{Math.round(stats.avgConfidence * 100)}%</p>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Avg Confidence</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className={`flex-1 flex items-center rounded-xl border px-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Search size={16} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search insights..."
            className={`flex-1 px-3 py-2.5 text-sm bg-transparent outline-none ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-gray-400'}`}
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as InsightCategory | 'all')}
            className={`px-3 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-gray-200 text-slate-900'}`}
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Confidence filter */}
        <select
          value={confidenceFilter}
          onChange={e => setConfidenceFilter(e.target.value as 'all' | 'high' | 'medium')}
          className={`px-3 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-gray-200 text-slate-900'}`}
        >
          <option value="all">All Confidence</option>
          <option value="high">High (85%+)</option>
          <option value="medium">Medium (70-85%)</option>
        </select>
      </div>

      {/* Insight Feed */}
      <div className="space-y-3">
        {filteredInsights.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <Lightbulb size={32} className={`mx-auto mb-3 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
            <p className="text-sm font-medium">No insights match your filters</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const catConfig = CATEGORY_CONFIG[insight.category];
            const isExpanded = expandedInsight === insight.id;
            const mentalModel = getMentalModelInfo(insight.mentalModel);

            return (
              <div
                key={insight.id}
                className={`rounded-2xl border transition-all duration-200 ${
                  isDark ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                  className="w-full flex items-start gap-4 p-4 text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catConfig.bg}`}>
                    <span className={catConfig.color}>{catConfig.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{insight.title}</h3>
                      {insight.actionable && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-brand-500/10 text-brand-400 rounded-full font-medium">
                          Actionable
                        </span>
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {insight.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catConfig.bg} ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                      {insight.relatedKpi && (
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          KPI: {insight.relatedKpi}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={`px-4 pb-4 pt-0 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                    <div className="pt-4 space-y-4">
                      {/* Full summary */}
                      <div>
                        <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Analysis</p>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{insight.summary}</p>
                      </div>

                      {/* Action recommendation */}
                      {insight.action && (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-brand-500/5 border border-brand-500/20' : 'bg-brand-50 border border-brand-100'}`}>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-brand-400 mb-1">Recommended Action</p>
                              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{insight.action}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mental model */}
                      {mentalModel && (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-violet-500/5 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}>
                          <div className="flex items-start gap-2">
                            <Brain size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-violet-400 mb-1">Behavioural Model: {mentalModel.name}</p>
                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{mentalModel.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        {insight.relatedCampaignId && (
                          <button
                            onClick={() => setView('campaigns')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors"
                          >
                            View Campaign <ArrowRight size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => setView('mkt-ideas')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Apply to New Campaign <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mental Models Reference */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Brain size={18} className="text-violet-400" />
          <h2 className="font-semibold">Behavioural Models Reference</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MENTAL_MODELS.slice(0, 6).map(model => (
            <div
              key={model.id}
              className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}
            >
              <p className="text-sm font-semibold mb-1">{model.name}</p>
              <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{model.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
