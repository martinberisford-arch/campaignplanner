import { useState, useCallback, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { KPIChannelEntry, KPITimeSeriesEntry, KPISentimentEntry, KPIDataSource } from '../types';
import {
  TrendingUp, TrendingDown, Eye, MousePointerClick,
  Users, DollarSign, Sparkles, Download, RefreshCw,
  Plus, X, Save, FileText, BarChart3, Pencil, Trash2,
  Database, Info, AlertTriangle,
  Check, Upload
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const SOURCE_BADGES: Record<KPIDataSource, { label: string; color: string; bg: string }> = {
  seed: { label: 'Demo Data', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  manual: { label: 'Manual Entry', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ga4: { label: 'Google Analytics 4', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  meta: { label: 'Meta Business', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  linkedin: { label: 'LinkedIn', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  hubspot: { label: 'HubSpot', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  import: { label: 'CSV Import', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
};

function SourceBadge({ source }: { source: KPIDataSource }) {
  const s = SOURCE_BADGES[source];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${s.bg} ${s.color}`}>
      <Database size={8} /> {s.label}
    </span>
  );
}

export default function KPIDashboard() {
  const {
    campaigns, currentUser, permissions,
    kpiChannelData, addKpiChannel, editKpiChannel, deleteKpiChannel,
    kpiTimeSeriesData, addKpiTimeSeries, editKpiTimeSeries, deleteKpiTimeSeries,
    kpiSentimentData, addKpiSentiment, editKpiSentiment, deleteKpiSentiment,
  } = useApp();

  const [dateRange, setDateRange] = useState('8-weeks');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'timeseries' | 'sentiment' | 'sources'>('overview');

  // Channel CRUD state
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [channelForm, setChannelForm] = useState({ channel: '', impressions: '', clicks: '', conversions: '', spend: '', roi: '', source: 'manual' as KPIDataSource, notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Time series CRUD state
  const [showTSForm, setShowTSForm] = useState(false);
  const [editingTSId, setEditingTSId] = useState<string | null>(null);
  const [tsForm, setTsForm] = useState({ week: '', impressions: '', clicks: '', leads: '', spend: '', applications: '', source: 'manual' as KPIDataSource, notes: '' });

  // Sentiment CRUD state
  const [showSentForm, setShowSentForm] = useState(false);
  const [editingSentId, setEditingSentId] = useState<string | null>(null);
  const [sentForm, setSentForm] = useState({ date: '', positive: '', neutral: '', negative: '', source: 'manual' as KPIDataSource });

  // Data sources summary
  const [showSourceInfo, setShowSourceInfo] = useState(false);

  const campaignTitle = selectedCampaign === 'all' ? 'All Campaigns' : campaigns.find(c => c.id === selectedCampaign)?.title || 'All Campaigns';
  const canEdit = permissions.canEditCampaign;

  // ==================== COMPUTED METRICS ====================

  const totals = useMemo(() => {
    const imp = kpiChannelData.reduce((s, c) => s + c.impressions, 0);
    const clk = kpiChannelData.reduce((s, c) => s + c.clicks, 0);
    const conv = kpiChannelData.reduce((s, c) => s + c.conversions, 0);
    const spd = kpiChannelData.reduce((s, c) => s + c.spend, 0);
    const latestTS = kpiTimeSeriesData.length > 0 ? kpiTimeSeriesData[kpiTimeSeriesData.length - 1] : null;
    const prevTS = kpiTimeSeriesData.length > 1 ? kpiTimeSeriesData[kpiTimeSeriesData.length - 2] : null;
    const apps = latestTS?.applications || 0;
    const cpc = clk > 0 ? spd / clk : 0;
    const cvr = clk > 0 ? (conv / clk) * 100 : 0;

    // Calculate trends from time series
    const impTrend = latestTS && prevTS && prevTS.impressions > 0 ? ((latestTS.impressions - prevTS.impressions) / prevTS.impressions) * 100 : 0;
    const clkTrend = latestTS && prevTS && prevTS.clicks > 0 ? ((latestTS.clicks - prevTS.clicks) / prevTS.clicks) * 100 : 0;
    const appTrend = latestTS && prevTS && prevTS.applications > 0 ? ((latestTS.applications - prevTS.applications) / prevTS.applications) * 100 : 0;

    return { imp, clk, conv, spd, apps, cpc, cvr, impTrend, clkTrend, appTrend };
  }, [kpiChannelData, kpiTimeSeriesData]);

  const sourceSummary = useMemo(() => {
    const sources = new Map<KPIDataSource, number>();
    kpiChannelData.forEach(c => sources.set(c.source, (sources.get(c.source) || 0) + 1));
    kpiTimeSeriesData.forEach(t => sources.set(t.source, (sources.get(t.source) || 0) + 1));
    kpiSentimentData.forEach(s => sources.set(s.source, (sources.get(s.source) || 0) + 1));
    return Array.from(sources.entries()).map(([source, count]) => ({ source, count }));
  }, [kpiChannelData, kpiTimeSeriesData, kpiSentimentData]);

  const hasSeedData = sourceSummary.some(s => s.source === 'seed');

  const topMetrics = [
    {
      label: 'Total Impressions', value: totals.imp >= 1000000 ? `${(totals.imp / 1000000).toFixed(2)}M` : `${(totals.imp / 1000).toFixed(0)}K`,
      change: `${totals.impTrend >= 0 ? '+' : ''}${totals.impTrend.toFixed(1)}%`, up: totals.impTrend >= 0,
      icon: <Eye size={18} />, color: 'from-brand-500 to-violet-600',
      sourceBreakdown: kpiChannelData.map(c => ({ channel: c.channel, value: c.impressions, source: c.source })),
      explanation: 'Sum of impressions across all channel entries below'
    },
    {
      label: 'Total Clicks', value: totals.clk >= 1000000 ? `${(totals.clk / 1000000).toFixed(2)}M` : `${(totals.clk / 1000).toFixed(1)}K`,
      change: `${totals.clkTrend >= 0 ? '+' : ''}${totals.clkTrend.toFixed(1)}%`, up: totals.clkTrend >= 0,
      icon: <MousePointerClick size={18} />, color: 'from-emerald-500 to-teal-600',
      sourceBreakdown: kpiChannelData.map(c => ({ channel: c.channel, value: c.clicks, source: c.source })),
      explanation: 'Sum of clicks across all channel entries below'
    },
    {
      label: 'Applications', value: totals.apps.toLocaleString(),
      change: `${totals.appTrend >= 0 ? '+' : ''}${totals.appTrend.toFixed(1)}%`, up: totals.appTrend >= 0,
      icon: <Users size={18} />, color: 'from-amber-500 to-orange-600',
      sourceBreakdown: [],
      explanation: 'Latest value from weekly time series data'
    },
    {
      label: 'Total Spend', value: `£${totals.spd >= 1000 ? `${(totals.spd / 1000).toFixed(1)}K` : totals.spd.toLocaleString()}`,
      change: `${((totals.spd / (campaigns.find(c => c.id === selectedCampaign)?.budget || totals.spd || 1)) * 100).toFixed(0)}% of budget`, up: true,
      icon: <DollarSign size={18} />, color: 'from-pink-500 to-rose-600',
      sourceBreakdown: kpiChannelData.map(c => ({ channel: c.channel, value: c.spend, source: c.source })),
      explanation: 'Sum of spend across all channel entries below'
    },
    {
      label: 'Cost per Click', value: `£${totals.cpc.toFixed(2)}`,
      change: 'Calculated', up: true,
      icon: <TrendingDown size={18} />, color: 'from-cyan-500 to-blue-600',
      sourceBreakdown: [],
      explanation: 'Total Spend ÷ Total Clicks (auto-calculated)'
    },
    {
      label: 'Conversion Rate', value: `${totals.cvr.toFixed(1)}%`,
      change: 'Calculated', up: true,
      icon: <TrendingUp size={18} />, color: 'from-purple-500 to-indigo-600',
      sourceBreakdown: [],
      explanation: '(Total Conversions ÷ Total Clicks) × 100 (auto-calculated)'
    },
  ];

  const channelPieData = kpiChannelData.map(c => ({ name: c.channel, value: c.spend }));

  // ==================== CHANNEL CRUD ====================

  const openChannelForm = (entry?: KPIChannelEntry) => {
    if (entry) {
      setEditingChannelId(entry.id);
      setChannelForm({
        channel: entry.channel, impressions: String(entry.impressions), clicks: String(entry.clicks),
        conversions: String(entry.conversions), spend: String(entry.spend), roi: String(entry.roi),
        source: entry.source, notes: entry.notes || ''
      });
    } else {
      setEditingChannelId(null);
      setChannelForm({ channel: '', impressions: '', clicks: '', conversions: '', spend: '', roi: '', source: 'manual', notes: '' });
    }
    setShowChannelForm(true);
  };

  const saveChannel = () => {
    const data = {
      channel: channelForm.channel,
      impressions: parseInt(channelForm.impressions) || 0,
      clicks: parseInt(channelForm.clicks) || 0,
      conversions: parseInt(channelForm.conversions) || 0,
      spend: parseFloat(channelForm.spend) || 0,
      roi: parseFloat(channelForm.roi) || 0,
      source: channelForm.source,
      sourceLabel: channelForm.source === 'manual' ? `Entered by ${currentUser?.name || 'User'}` : SOURCE_BADGES[channelForm.source].label,
      notes: channelForm.notes,
      addedBy: currentUser?.name || 'Unknown',
      addedAt: new Date().toISOString(),
    };
    if (editingChannelId) {
      editKpiChannel(editingChannelId, data);
    } else {
      addKpiChannel({ ...data, id: `kc-${Date.now()}` });
    }
    setShowChannelForm(false);
  };

  // ==================== TIME SERIES CRUD ====================

  const openTSForm = (entry?: KPITimeSeriesEntry) => {
    if (entry) {
      setEditingTSId(entry.id);
      setTsForm({
        week: entry.week, impressions: String(entry.impressions), clicks: String(entry.clicks),
        leads: String(entry.leads), spend: String(entry.spend), applications: String(entry.applications),
        source: entry.source, notes: entry.notes || ''
      });
    } else {
      setEditingTSId(null);
      const nextWeek = `W${kpiTimeSeriesData.length + 1}`;
      setTsForm({ week: nextWeek, impressions: '', clicks: '', leads: '', spend: '', applications: '', source: 'manual', notes: '' });
    }
    setShowTSForm(true);
  };

  const saveTS = () => {
    const data = {
      week: tsForm.week,
      impressions: parseInt(tsForm.impressions) || 0,
      clicks: parseInt(tsForm.clicks) || 0,
      leads: parseInt(tsForm.leads) || 0,
      spend: parseFloat(tsForm.spend) || 0,
      applications: parseInt(tsForm.applications) || 0,
      source: tsForm.source,
      sourceLabel: tsForm.source === 'manual' ? `Entered by ${currentUser?.name || 'User'}` : SOURCE_BADGES[tsForm.source].label,
      notes: tsForm.notes,
      addedBy: currentUser?.name || 'Unknown',
      addedAt: new Date().toISOString(),
    };
    if (editingTSId) {
      editKpiTimeSeries(editingTSId, data);
    } else {
      addKpiTimeSeries({ ...data, id: `kt-${Date.now()}` });
    }
    setShowTSForm(false);
  };

  // ==================== SENTIMENT CRUD ====================

  const openSentForm = (entry?: KPISentimentEntry) => {
    if (entry) {
      setEditingSentId(entry.id);
      setSentForm({ date: entry.date, positive: String(entry.positive), neutral: String(entry.neutral), negative: String(entry.negative), source: entry.source });
    } else {
      setEditingSentId(null);
      setSentForm({ date: '', positive: '', neutral: '', negative: '', source: 'manual' });
    }
    setShowSentForm(true);
  };

  const saveSent = () => {
    const data = {
      date: sentForm.date,
      positive: parseInt(sentForm.positive) || 0,
      neutral: parseInt(sentForm.neutral) || 0,
      negative: parseInt(sentForm.negative) || 0,
      source: sentForm.source,
      sourceLabel: sentForm.source === 'manual' ? `Entered by ${currentUser?.name || 'User'}` : SOURCE_BADGES[sentForm.source].label,
      addedBy: currentUser?.name || 'Unknown',
      addedAt: new Date().toISOString(),
    };
    if (editingSentId) {
      editKpiSentiment(editingSentId, data);
    } else {
      addKpiSentiment({ ...data, id: `ks-${Date.now()}` });
    }
    setShowSentForm(false);
  };

  // ==================== EXPORT ====================

  const generateExport = useCallback((format: string) => {
    const data = {
      campaign: campaignTitle,
      dateRange,
      exportedAt: new Date().toLocaleString(),
      metrics: topMetrics.map(m => ({ label: m.label, value: m.value, change: m.change, explanation: m.explanation })),
      channelPerformance: kpiChannelData.map(c => ({
        channel: c.channel, impressions: c.impressions, clicks: c.clicks,
        conversions: c.conversions, spend: c.spend, roi: c.roi,
        source: SOURCE_BADGES[c.source].label, addedBy: c.addedBy, addedAt: c.addedAt, notes: c.notes
      })),
      timeSeries: kpiTimeSeriesData.map(t => ({
        week: t.week, impressions: t.impressions, clicks: t.clicks,
        leads: t.leads, spend: t.spend, applications: t.applications,
        source: SOURCE_BADGES[t.source].label, addedBy: t.addedBy
      })),
      dataSources: sourceSummary.map(s => ({ source: SOURCE_BADGES[s.source].label, entries: s.count })),
    };

    if (format === 'csv') {
      let csv = 'CampaignOS KPI Report\n';
      csv += `Campaign,${campaignTitle}\nDate Range,${dateRange}\nExported,${new Date().toLocaleString()}\n\n`;
      csv += 'DATA SOURCES\nSource,Number of Entries\n';
      sourceSummary.forEach(s => { csv += `"${SOURCE_BADGES[s.source].label}",${s.count}\n`; });
      csv += '\nTOP METRICS\nMetric,Value,Change,How Calculated\n';
      topMetrics.forEach(m => { csv += `"${m.label}","${m.value}","${m.change}","${m.explanation}"\n`; });
      csv += '\nCHANNEL PERFORMANCE\nChannel,Impressions,Clicks,Conversions,Spend,ROI,Data Source,Added By,Date,Notes\n';
      kpiChannelData.forEach(c => {
        csv += `"${c.channel}",${c.impressions},${c.clicks},${c.conversions},${c.spend},${c.roi},"${SOURCE_BADGES[c.source].label}","${c.addedBy}","${c.addedAt}","${c.notes || ''}"\n`;
      });
      csv += '\nWEEKLY TIME SERIES\nWeek,Impressions,Clicks,Leads,Spend,Applications,Data Source,Added By\n';
      kpiTimeSeriesData.forEach(t => {
        csv += `${t.week},${t.impressions},${t.clicks},${t.leads},${t.spend},${t.applications},"${SOURCE_BADGES[t.source].label}","${t.addedBy}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpi-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpi-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>KPI Report - ${campaignTitle}</title>
          <style>
            body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b;max-width:900px;margin:0 auto}
            h1{font-size:24px;margin-bottom:4px}
            h2{font-size:18px;margin-top:32px;border-bottom:2px solid #e2e8f0;padding-bottom:8px}
            .subtitle{color:#64748b;font-size:14px}
            table{width:100%;border-collapse:collapse;margin-top:16px}
            th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
            th{background:#f8fafc;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b}
            .metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
            .metric-card{background:#f8fafc;border-radius:12px;padding:16px}
            .metric-value{font-size:24px;font-weight:700}
            .metric-label{font-size:12px;color:#64748b;margin-top:4px}
            .metric-change{font-size:11px;color:#10b981;font-weight:600}
            .metric-explain{font-size:10px;color:#94a3b8;margin-top:2px;font-style:italic}
            .source-badge{display:inline-block;font-size:10px;background:#f1f5f9;border-radius:4px;padding:2px 6px;color:#475569;margin-left:4px}
            .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
            .warning{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;font-size:12px;color:#92400e;margin-top:16px}
          </style></head><body>
          <h1>📊 Campaign Performance Report</h1>
          <p class="subtitle">${campaignTitle} · ${dateRange} · Exported ${new Date().toLocaleDateString()}</p>
          <h2>Data Sources</h2>
          <table><thead><tr><th>Source</th><th>Entries</th></tr></thead><tbody>
            ${sourceSummary.map(s => `<tr><td>${SOURCE_BADGES[s.source].label}</td><td>${s.count}</td></tr>`).join('')}
          </tbody></table>
          ${hasSeedData ? '<div class="warning">⚠️ This report contains demo seed data. Replace with real data for accurate reporting.</div>' : ''}
          <h2>Key Metrics</h2>
          <div class="metric-grid">
            ${topMetrics.map(m => `<div class="metric-card"><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div><div class="metric-change">${m.change}</div><div class="metric-explain">${m.explanation}</div></div>`).join('')}
          </div>
          <h2>Channel Performance</h2>
          <table><thead><tr><th>Channel</th><th>Impressions</th><th>Clicks</th><th>Conv.</th><th>Spend</th><th>ROI</th><th>Source</th></tr></thead><tbody>
            ${kpiChannelData.map(c => `<tr><td>${c.channel}</td><td>${(c.impressions/1e6).toFixed(1)}M</td><td>${(c.clicks/1e3).toFixed(0)}K</td><td>${c.conversions.toLocaleString()}</td><td>£${(c.spend/1e3).toFixed(0)}K</td><td>${c.roi}x</td><td><span class="source-badge">${SOURCE_BADGES[c.source].label}</span></td></tr>`).join('')}
          </tbody></table>
          <h2>Weekly Trend</h2>
          <table><thead><tr><th>Week</th><th>Impressions</th><th>Clicks</th><th>Applications</th><th>Spend</th><th>Source</th></tr></thead><tbody>
            ${kpiTimeSeriesData.map(d => `<tr><td>${d.week}</td><td>${(d.impressions/1e3).toFixed(0)}K</td><td>${(d.clicks/1e3).toFixed(1)}K</td><td>${d.applications.toLocaleString()}</td><td>£${d.spend.toLocaleString()}</td><td><span class="source-badge">${SOURCE_BADGES[d.source].label}</span></td></tr>`).join('')}
          </tbody></table>
          <div class="footer">Generated by CampaignOS · Report ID: RPT-${Date.now().toString(36).toUpperCase()}</div>
          </body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    }

    setExportMessage(`${format.toUpperCase()} export generated`);
    setTimeout(() => { setExportMessage(''); setShowExportMenu(false); }, 2500);
  }, [campaignTitle, dateRange, topMetrics, kpiChannelData, kpiTimeSeriesData, sourceSummary, hasSeedData]);

  // ==================== RENDER ====================

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">KPI Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Performance analytics for {campaignTitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
            className="bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
            <option value="all">All Campaigns</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
            <option value="4-weeks">Last 4 Weeks</option>
            <option value="8-weeks">Last 8 Weeks</option>
            <option value="12-weeks">Last 12 Weeks</option>
          </select>
          <button onClick={() => setShowSourceInfo(!showSourceInfo)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${showSourceInfo ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-800 border-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
            <Database size={14} /> Sources
          </button>
          <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
              <Download size={14} /> Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                {exportMessage ? (
                  <div className="p-4 text-center text-sm text-emerald-400 font-medium">✅ {exportMessage}</div>
                ) : (
                  <>
                    <button onClick={() => generateExport('pdf')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-sm text-left">
                      <FileText size={16} className="text-red-400" />
                      <div><p className="font-medium">Export as PDF</p><p className="text-[10px] text-slate-500">Includes data source audit trail</p></div>
                    </button>
                    <button onClick={() => generateExport('csv')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-sm text-left border-t border-slate-700/50">
                      <BarChart3 size={16} className="text-emerald-400" />
                      <div><p className="font-medium">Export as CSV</p><p className="text-[10px] text-slate-500">All data with source columns</p></div>
                    </button>
                    <button onClick={() => generateExport('json')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-sm text-left border-t border-slate-700/50">
                      <Download size={16} className="text-blue-400" />
                      <div><p className="font-medium">Export as JSON</p><p className="text-[10px] text-slate-500">Raw data with metadata</p></div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Source Warning Banner */}
      {hasSeedData && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <div className="text-sm text-amber-300">
            <span className="font-semibold">Demo data detected.</span> Some metrics use seed data for demonstration. Edit or replace entries in the Channels and Time Series tabs with your real data.
          </div>
        </div>
      )}

      {/* Data Sources Panel */}
      {showSourceInfo && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Database size={16} className="text-brand-400" /> Where your data comes from</h3>
            <button onClick={() => setShowSourceInfo(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {sourceSummary.map(s => (
              <div key={s.source} className={`rounded-xl p-3 border ${SOURCE_BADGES[s.source].bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${SOURCE_BADGES[s.source].color}`}>{SOURCE_BADGES[s.source].label}</span>
                  <span className="text-lg font-bold">{s.count}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{s.count} data {s.count === 1 ? 'entry' : 'entries'}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            <Info size={10} className="inline mr-1" />
            Every number on this dashboard is traceable. Each metric shows its data source. Click the Channels or Time Series tabs to edit, add, or delete individual data points.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-slate-900 rounded-xl p-1 border border-slate-800 overflow-x-auto">
        {(['overview', 'channels', 'timeseries', 'sentiment', 'sources'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            {tab === 'overview' ? '📊 Overview' : tab === 'channels' ? '📡 Channels' : tab === 'timeseries' ? '📈 Time Series' : tab === 'sentiment' ? '💬 Sentiment' : '🔍 Data Audit'}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {topMetrics.map((m, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors group relative">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3`}>{m.icon}</div>
                <p className="text-xl font-bold">{m.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                <div className={`flex items-center gap-1 text-[10px] font-semibold mt-2 ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {m.change}
                </div>
                {/* Source tooltip on hover */}
                <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-[10px]">
                  <p className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1"><Info size={9} /> How this is calculated</p>
                  <p className="text-slate-400 mb-2">{m.explanation}</p>
                  {m.sourceBreakdown.length > 0 && (
                    <div className="space-y-1">
                      {m.sourceBreakdown.map((sb, j) => (
                        <div key={j} className="flex items-center justify-between">
                          <span className="text-slate-400">{sb.channel}</span>
                          <span className="flex items-center gap-1">
                            <span className="text-white font-medium">{sb.value.toLocaleString()}</span>
                            <SourceBadge source={sb.source} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Performance Over Time</h3>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" />Impressions</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Clicks</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Applications</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={kpiTimeSeriesData}>
                  <defs>
                    <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gClk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="impressions" stroke="#6366f1" fill="url(#gImp)" strokeWidth={2} />
                  <Area type="monotone" dataKey="clicks" stroke="#10b981" fill="url(#gClk)" strokeWidth={2} />
                  <Area type="monotone" dataKey="applications" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Pie */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Spend by Channel</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={channelPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {channelPieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    formatter={(value) => `£${(Number(value) / 1000).toFixed(1)}k`} />
                  <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-brand-900/30 to-violet-900/20 border border-brand-700/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-brand-400" />
              <h3 className="font-semibold">AI Performance Summary</h3>
              <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-semibold">Auto-generated from your data</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">✅ What&apos;s Working</h4>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  {kpiChannelData.sort((a, b) => b.roi - a.roi).slice(0, 2).map(c => (
                    <li key={c.id}>• {c.channel} delivering <span className="font-semibold text-emerald-400">{c.roi}x ROI</span> <SourceBadge source={c.source} /></li>
                  ))}
                  {kpiTimeSeriesData.length >= 2 && (() => {
                    const last = kpiTimeSeriesData[kpiTimeSeriesData.length - 1];
                    const prev = kpiTimeSeriesData[kpiTimeSeriesData.length - 2];
                    const growth = prev.clicks > 0 ? ((last.clicks - prev.clicks) / prev.clicks * 100).toFixed(1) : '0';
                    return <li>• Click growth <span className="font-semibold text-emerald-400">+{growth}%</span> week-on-week</li>;
                  })()}
                </ul>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-amber-400 mb-2">⚠️ Recommendations</h4>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  {kpiChannelData.sort((a, b) => a.roi - b.roi).slice(0, 1).map(c => (
                    <li key={c.id}>• {c.channel} lowest ROI at <span className="font-semibold text-amber-400">{c.roi}x</span> — review targeting</li>
                  ))}
                  {kpiChannelData.sort((a, b) => b.roi - a.roi).slice(0, 1).map(c => (
                    <li key={c.id}>• Consider increasing {c.channel} budget — highest ROI channel</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== CHANNELS TAB ==================== */}
      {activeTab === 'channels' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Channel Performance Data</h3>
              <p className="text-xs text-slate-500 mt-1">Each row is an individual data entry with its source clearly shown. Edit or delete any row, or add new data.</p>
            </div>
            {canEdit && (
              <button onClick={() => openChannelForm()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
                <Plus size={14} /> Add Channel Data
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 tracking-wider">
                  <th className="text-left p-3 font-semibold">Channel</th>
                  <th className="text-right p-3 font-semibold">Impressions</th>
                  <th className="text-right p-3 font-semibold">Clicks</th>
                  <th className="text-right p-3 font-semibold">Conversions</th>
                  <th className="text-right p-3 font-semibold">Spend</th>
                  <th className="text-right p-3 font-semibold">ROI</th>
                  <th className="text-left p-3 font-semibold">Data Source</th>
                  <th className="text-left p-3 font-semibold">Added By</th>
                  {canEdit && <th className="text-center p-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {kpiChannelData.map((ch, i) => (
                  <tr key={ch.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {ch.channel}
                    </td>
                    <td className="p-3 text-right text-slate-400">{ch.impressions >= 1000000 ? `${(ch.impressions / 1000000).toFixed(1)}M` : `${(ch.impressions / 1000).toFixed(0)}K`}</td>
                    <td className="p-3 text-right text-slate-400">{ch.clicks >= 1000 ? `${(ch.clicks / 1000).toFixed(0)}K` : ch.clicks}</td>
                    <td className="p-3 text-right text-slate-400">{ch.conversions.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-400">£{ch.spend >= 1000 ? `${(ch.spend / 1000).toFixed(0)}K` : ch.spend}</td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${ch.roi >= 3 ? 'text-emerald-400' : ch.roi >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{ch.roi}x</span>
                    </td>
                    <td className="p-3">
                      <SourceBadge source={ch.source} />
                      {ch.notes && <p className="text-[9px] text-slate-600 mt-0.5 max-w-[140px] truncate" title={ch.notes}>📝 {ch.notes}</p>}
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      <div>{ch.addedBy}</div>
                      <div className="text-[9px] text-slate-600">{new Date(ch.addedAt).toLocaleDateString()}</div>
                    </td>
                    {canEdit && (
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openChannelForm(ch)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
                            <Pencil size={13} className="text-blue-400" />
                          </button>
                          {deleteConfirm === ch.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => { deleteKpiChannel(ch.id); setDeleteConfirm(null); }} className="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg transition-colors" title="Confirm delete">
                                <Check size={13} />
                              </button>
                              <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="Cancel">
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(ch.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={13} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {kpiChannelData.length === 0 && (
                  <tr><td colSpan={9} className="p-12 text-center text-slate-500">
                    <Database size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="font-medium">No channel data yet</p>
                    <p className="text-xs mt-1">Add your first channel data entry above</p>
                  </td></tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-700">
                <tr className="text-sm font-semibold">
                  <td className="p-3">Totals</td>
                  <td className="p-3 text-right">{totals.imp >= 1000000 ? `${(totals.imp / 1e6).toFixed(1)}M` : `${(totals.imp / 1e3).toFixed(0)}K`}</td>
                  <td className="p-3 text-right">{totals.clk >= 1000 ? `${(totals.clk / 1e3).toFixed(0)}K` : totals.clk}</td>
                  <td className="p-3 text-right">{totals.conv.toLocaleString()}</td>
                  <td className="p-3 text-right">£{totals.spd >= 1000 ? `${(totals.spd / 1e3).toFixed(1)}K` : totals.spd}</td>
                  <td className="p-3 text-right text-brand-400">{totals.cvr.toFixed(1)}% CVR</td>
                  <td className="p-3 text-xs text-slate-500" colSpan={3}>{kpiChannelData.length} entries from {sourceSummary.filter(s => kpiChannelData.some(c => c.source === s.source)).length} source(s)</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TIME SERIES TAB ==================== */}
      {activeTab === 'timeseries' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Weekly Performance Chart</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kpiTimeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="impressions" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="applications" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                <Line type="monotone" dataKey="spend" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Weekly Time Series Data</h3>
                <p className="text-xs text-slate-500 mt-1">Each row represents one week of data. Edit inline, delete, or add new weeks.</p>
              </div>
              {canEdit && (
                <button onClick={() => openTSForm()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
                  <Plus size={14} /> Add Week
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 tracking-wider">
                    <th className="text-left p-3 font-semibold">Week</th>
                    <th className="text-right p-3 font-semibold">Impressions</th>
                    <th className="text-right p-3 font-semibold">Clicks</th>
                    <th className="text-right p-3 font-semibold">Leads</th>
                    <th className="text-right p-3 font-semibold">Applications</th>
                    <th className="text-right p-3 font-semibold">Spend</th>
                    <th className="text-left p-3 font-semibold">Source</th>
                    <th className="text-left p-3 font-semibold">Added By</th>
                    {canEdit && <th className="text-center p-3 font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {kpiTimeSeriesData.map(ts => (
                    <tr key={ts.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="p-3 font-semibold text-brand-400">{ts.week}</td>
                      <td className="p-3 text-right text-slate-400">{(ts.impressions / 1000).toFixed(0)}K</td>
                      <td className="p-3 text-right text-slate-400">{(ts.clicks / 1000).toFixed(1)}K</td>
                      <td className="p-3 text-right text-slate-400">{ts.leads.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-400">{ts.applications.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-400">£{ts.spend.toLocaleString()}</td>
                      <td className="p-3"><SourceBadge source={ts.source} /></td>
                      <td className="p-3 text-xs text-slate-500">{ts.addedBy}</td>
                      {canEdit && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openTSForm(ts)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><Pencil size={13} className="text-blue-400" /></button>
                            {deleteConfirm === ts.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => { deleteKpiTimeSeries(ts.id); setDeleteConfirm(null); }} className="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg"><Check size={13} /></button>
                                <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-slate-700 rounded-lg"><X size={13} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(ts.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SENTIMENT TAB ==================== */}
      {activeTab === 'sentiment' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Social Sentiment Analysis</h3>
              {canEdit && (
                <button onClick={() => openSentForm()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpiSentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="positive" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="neutral" fill="#64748b" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="negative" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" />Positive</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-500" />Neutral</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" />Negative</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-semibold">Sentiment Data Entries</h3>
              <p className="text-xs text-slate-500 mt-1">Each row is a sentiment reading with source attribution</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 tracking-wider">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-right p-3 font-semibold">Positive %</th>
                    <th className="text-right p-3 font-semibold">Neutral %</th>
                    <th className="text-right p-3 font-semibold">Negative %</th>
                    <th className="text-left p-3 font-semibold">Source</th>
                    <th className="text-left p-3 font-semibold">Added By</th>
                    {canEdit && <th className="text-center p-3 font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {kpiSentimentData.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="p-3 font-medium">{s.date}</td>
                      <td className="p-3 text-right text-emerald-400 font-semibold">{s.positive}%</td>
                      <td className="p-3 text-right text-slate-400">{s.neutral}%</td>
                      <td className="p-3 text-right text-red-400">{s.negative}%</td>
                      <td className="p-3"><SourceBadge source={s.source} /></td>
                      <td className="p-3 text-xs text-slate-500">{s.addedBy}</td>
                      {canEdit && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openSentForm(s)} className="p-1.5 hover:bg-slate-700 rounded-lg"><Pencil size={13} className="text-blue-400" /></button>
                            {deleteConfirm === s.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => { deleteKpiSentiment(s.id); setDeleteConfirm(null); }} className="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg"><Check size={13} /></button>
                                <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-slate-700 rounded-lg"><X size={13} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DATA AUDIT TAB ==================== */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Data Source Audit</h3>
            <p className="text-sm text-slate-400 mb-6">
              Every number on this dashboard is traceable to a specific data entry. This page shows you exactly where each piece of data came from, who entered it, and when.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-brand-400 mb-1">Channel Data</h4>
                <p className="text-2xl font-bold">{kpiChannelData.length}</p>
                <p className="text-xs text-slate-500">entries</p>
                <div className="mt-3 space-y-1">
                  {Array.from(new Set(kpiChannelData.map(c => c.source))).map(s => (
                    <div key={s} className="flex items-center justify-between text-xs">
                      <SourceBadge source={s} />
                      <span className="text-slate-400">{kpiChannelData.filter(c => c.source === s).length}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-emerald-400 mb-1">Time Series Data</h4>
                <p className="text-2xl font-bold">{kpiTimeSeriesData.length}</p>
                <p className="text-xs text-slate-500">weeks</p>
                <div className="mt-3 space-y-1">
                  {Array.from(new Set(kpiTimeSeriesData.map(t => t.source))).map(s => (
                    <div key={s} className="flex items-center justify-between text-xs">
                      <SourceBadge source={s} />
                      <span className="text-slate-400">{kpiTimeSeriesData.filter(t => t.source === s).length}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-violet-400 mb-1">Sentiment Data</h4>
                <p className="text-2xl font-bold">{kpiSentimentData.length}</p>
                <p className="text-xs text-slate-500">readings</p>
                <div className="mt-3 space-y-1">
                  {Array.from(new Set(kpiSentimentData.map(s => s.source))).map(s => (
                    <div key={s} className="flex items-center justify-between text-xs">
                      <SourceBadge source={s} />
                      <span className="text-slate-400">{kpiSentimentData.filter(d => d.source === s).length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Upload size={14} className="text-brand-400" /> How to add real data</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-300">Manual Entry (recommended to start)</p>
                  <p>1. Go to the <button onClick={() => setActiveTab('channels')} className="text-brand-400 underline">Channels</button> or <button onClick={() => setActiveTab('timeseries')} className="text-brand-400 underline">Time Series</button> tab</p>
                  <p>2. Click "Add Channel Data" or "Add Week"</p>
                  <p>3. Enter your numbers and select the data source</p>
                  <p>4. Your data replaces or supplements the demo data</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-300">Replacing demo data</p>
                  <p>1. Hover over any demo data row in the table</p>
                  <p>2. Click the ✏️ pencil icon to edit with your real figures</p>
                  <p>3. Change the source from "Demo Data" to "Manual Entry" or your actual source</p>
                  <p>4. Or click 🗑️ to delete demo rows entirely</p>
                </div>
              </div>
            </div>
          </div>

          {/* Full audit trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-semibold">Complete Data Trail</h3>
              <p className="text-xs text-slate-500 mt-1">Every data point in chronological order</p>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {[
                ...kpiChannelData.map(c => ({ type: 'Channel', label: `${c.channel}`, source: c.source, addedBy: c.addedBy, addedAt: c.addedAt, detail: `Imp: ${c.impressions.toLocaleString()} · Clicks: ${c.clicks.toLocaleString()} · Spend: £${c.spend.toLocaleString()}` })),
                ...kpiTimeSeriesData.map(t => ({ type: 'Time Series', label: t.week, source: t.source, addedBy: t.addedBy, addedAt: t.addedAt, detail: `Imp: ${t.impressions.toLocaleString()} · Clicks: ${t.clicks.toLocaleString()} · Apps: ${t.applications.toLocaleString()}` })),
                ...kpiSentimentData.map(s => ({ type: 'Sentiment', label: s.date, source: s.source, addedBy: s.addedBy, addedAt: s.addedAt, detail: `Pos: ${s.positive}% · Neu: ${s.neutral}% · Neg: ${s.negative}%` })),
              ].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
                .map((entry, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-slate-800/50 hover:bg-slate-800/20 text-xs">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold shrink-0 ${entry.type === 'Channel' ? 'bg-brand-500/10 text-brand-400' : entry.type === 'Time Series' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'}`}>
                    {entry.type}
                  </span>
                  <span className="font-semibold text-slate-300 w-28 shrink-0">{entry.label}</span>
                  <span className="text-slate-500 flex-1 truncate">{entry.detail}</span>
                  <SourceBadge source={entry.source} />
                  <span className="text-slate-600 w-20 text-right shrink-0">{entry.addedBy}</span>
                  <span className="text-slate-600 w-24 text-right shrink-0">{new Date(entry.addedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHANNEL FORM MODAL ==================== */}
      {showChannelForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChannelForm(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{editingChannelId ? 'Edit Channel Data' : 'Add Channel Data'}</h2>
                <p className="text-xs text-slate-400 mt-1">Enter performance metrics for a specific channel</p>
              </div>
              <button onClick={() => setShowChannelForm(false)} className="p-2 hover:bg-slate-800 rounded-xl"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Channel Name</label>
                <input value={channelForm.channel} onChange={e => setChannelForm(p => ({ ...p, channel: e.target.value }))}
                  placeholder="e.g., Social Media, Email, Paid Search"
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Impressions</label>
                  <input type="number" value={channelForm.impressions} onChange={e => setChannelForm(p => ({ ...p, impressions: e.target.value }))}
                    placeholder="0" className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Clicks</label>
                  <input type="number" value={channelForm.clicks} onChange={e => setChannelForm(p => ({ ...p, clicks: e.target.value }))}
                    placeholder="0" className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Conversions</label>
                  <input type="number" value={channelForm.conversions} onChange={e => setChannelForm(p => ({ ...p, conversions: e.target.value }))}
                    placeholder="0" className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Spend (£)</label>
                  <input type="number" value={channelForm.spend} onChange={e => setChannelForm(p => ({ ...p, spend: e.target.value }))}
                    placeholder="0" className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">ROI (x)</label>
                  <input type="number" step="0.1" value={channelForm.roi} onChange={e => setChannelForm(p => ({ ...p, roi: e.target.value }))}
                    placeholder="0.0" className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Data Source — where did these numbers come from?</label>
                <select value={channelForm.source} onChange={e => setChannelForm(p => ({ ...p, source: e.target.value as KPIDataSource }))}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="manual">Manual Entry (I typed these numbers)</option>
                  <option value="ga4">Google Analytics 4 (copied from GA4)</option>
                  <option value="meta">Meta Business Suite (copied from Meta)</option>
                  <option value="linkedin">LinkedIn Campaign Manager</option>
                  <option value="hubspot">HubSpot Reports</option>
                  <option value="import">CSV / Spreadsheet Import</option>
                  <option value="seed">Demo / Placeholder Data</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes (optional)</label>
                <input value={channelForm.notes} onChange={e => setChannelForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g., Pulled from GA4 on 22 Jan, Q1 campaign only"
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <button onClick={saveChannel} disabled={!channelForm.channel.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                <Save size={16} /> {editingChannelId ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TIME SERIES FORM MODAL ==================== */}
      {showTSForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTSForm(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{editingTSId ? 'Edit Week Data' : 'Add Week Data'}</h2>
                <p className="text-xs text-slate-400 mt-1">Enter performance metrics for a specific week</p>
              </div>
              <button onClick={() => setShowTSForm(false)} className="p-2 hover:bg-slate-800 rounded-xl"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Week Label</label>
                <input value={tsForm.week} onChange={e => setTsForm(p => ({ ...p, week: e.target.value }))}
                  placeholder="e.g., W9, Week 9, 20 Jan"
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Impressions</label>
                  <input type="number" value={tsForm.impressions} onChange={e => setTsForm(p => ({ ...p, impressions: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Clicks</label>
                  <input type="number" value={tsForm.clicks} onChange={e => setTsForm(p => ({ ...p, clicks: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Leads</label>
                  <input type="number" value={tsForm.leads} onChange={e => setTsForm(p => ({ ...p, leads: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Applications</label>
                  <input type="number" value={tsForm.applications} onChange={e => setTsForm(p => ({ ...p, applications: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Spend (£)</label>
                  <input type="number" value={tsForm.spend} onChange={e => setTsForm(p => ({ ...p, spend: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Data Source</label>
                <select value={tsForm.source} onChange={e => setTsForm(p => ({ ...p, source: e.target.value as KPIDataSource }))}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="manual">Manual Entry</option>
                  <option value="ga4">Google Analytics 4</option>
                  <option value="meta">Meta Business Suite</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="hubspot">HubSpot</option>
                  <option value="import">CSV Import</option>
                  <option value="seed">Demo Data</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes (optional)</label>
                <input value={tsForm.notes} onChange={e => setTsForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g., Includes organic + paid"
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <button onClick={saveTS} disabled={!tsForm.week.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                <Save size={16} /> {editingTSId ? 'Update Week' : 'Add Week'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SENTIMENT FORM MODAL ==================== */}
      {showSentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSentForm(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{editingSentId ? 'Edit Sentiment' : 'Add Sentiment Data'}</h2>
                <p className="text-xs text-slate-400 mt-1">Social sentiment percentages for a date period</p>
              </div>
              <button onClick={() => setShowSentForm(false)} className="p-2 hover:bg-slate-800 rounded-xl"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Date Label</label>
                <input value={sentForm.date} onChange={e => setSentForm(p => ({ ...p, date: e.target.value }))}
                  placeholder="e.g., Feb 17, W9, 17-23 Feb"
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-emerald-400 mb-1.5 block font-medium">Positive %</label>
                  <input type="number" value={sentForm.positive} onChange={e => setSentForm(p => ({ ...p, positive: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Neutral %</label>
                  <input type="number" value={sentForm.neutral} onChange={e => setSentForm(p => ({ ...p, neutral: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50" />
                </div>
                <div>
                  <label className="text-xs text-red-400 mb-1.5 block font-medium">Negative %</label>
                  <input type="number" value={sentForm.negative} onChange={e => setSentForm(p => ({ ...p, negative: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Data Source</label>
                <select value={sentForm.source} onChange={e => setSentForm(p => ({ ...p, source: e.target.value as KPIDataSource }))}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="manual">Manual Entry</option>
                  <option value="meta">Meta Business Suite</option>
                  <option value="hubspot">HubSpot</option>
                  <option value="import">CSV Import</option>
                  <option value="seed">Demo Data</option>
                </select>
              </div>
              <button onClick={saveSent} disabled={!sentForm.date.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                <Save size={16} /> {editingSentId ? 'Update' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
