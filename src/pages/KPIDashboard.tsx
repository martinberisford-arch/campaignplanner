import { useState, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { kpiTimeSeriesData, channelPerformance, sentimentData } from '../data/mockData';
import {
  TrendingUp, TrendingDown, Eye, MousePointerClick,
  Users, DollarSign, Sparkles, Download, RefreshCw, Globe,
  Plus, X, Save, FileText, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function KPIDashboard() {
  const { campaigns, manualKpiData, setManualKpiData } = useApp();
  const [dateRange, setDateRange] = useState('8-weeks');
  const [selectedCampaign, setSelectedCampaign] = useState('c1');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Manual entry form
  const [manualMetric, setManualMetric] = useState('impressions');
  const [manualValue, setManualValue] = useState('');
  const [manualWeek, setManualWeek] = useState('W9');
  const [manualChannel, setManualChannel] = useState('Social Media');
  const [manualEntries, setManualEntries] = useState<Array<{metric: string; value: string; week: string; channel: string; addedAt: string}>>([]);

  const campaign = campaigns.find(c => c.id === selectedCampaign);
  const campaignTitle = campaign?.title || 'All Campaigns';

  // Merge manual data into time series
  const mergedTimeSeriesData = [...kpiTimeSeriesData];
  const manualWeeks = manualEntries.filter(e => !kpiTimeSeriesData.some(d => d.week === e.week));
  const uniqueWeeks = [...new Set(manualWeeks.map(e => e.week))];
  uniqueWeeks.forEach(week => {
    const weekEntries = manualEntries.filter(e => e.week === week);
    const newPoint: Record<string, number | string> = { week, impressions: 0, clicks: 0, leads: 0, spend: 0, applications: 0 };
    weekEntries.forEach(entry => {
      newPoint[entry.metric] = parseInt(entry.value) || 0;
    });
    mergedTimeSeriesData.push(newPoint as typeof kpiTimeSeriesData[0]);
  });

  const baseImpressions = manualKpiData['impressions'] || 0;
  const baseClicks = manualKpiData['clicks'] || 0;
  const baseApplications = manualKpiData['applications'] || 0;

  const topMetrics = [
    { label: 'Total Impressions', value: `${((1480000 + baseImpressions) / 1000000).toFixed(2)}M`, change: '+12.1%', up: true, icon: <Eye size={18} />, color: 'from-brand-500 to-violet-600' },
    { label: 'Total Clicks', value: `${((55200 + baseClicks) / 1000).toFixed(1)}K`, change: '+12.9%', up: true, icon: <MousePointerClick size={18} />, color: 'from-emerald-500 to-teal-600' },
    { label: 'Applications', value: (12840 + baseApplications).toLocaleString(), change: '+8.8%', up: true, icon: <Users size={18} />, color: 'from-amber-500 to-orange-600' },
    { label: 'Total Spend', value: '£67.5K', change: '45%', up: true, icon: <DollarSign size={18} />, color: 'from-pink-500 to-rose-600' },
    { label: 'Cost per Click', value: '£1.22', change: '-5.2%', up: true, icon: <TrendingDown size={18} />, color: 'from-cyan-500 to-blue-600' },
    { label: 'Conversion Rate', value: '3.8%', change: '+0.4%', up: true, icon: <TrendingUp size={18} />, color: 'from-purple-500 to-indigo-600' },
  ];

  const channelPieData = channelPerformance.map(c => ({
    name: c.channel,
    value: c.spend,
  }));

  const handleAddManualEntry = () => {
    if (!manualValue.trim()) return;
    const entry = {
      metric: manualMetric,
      value: manualValue,
      week: manualWeek,
      channel: manualChannel,
      addedAt: new Date().toLocaleString(),
    };
    setManualEntries(prev => [...prev, entry]);
    setManualKpiData(prev => ({
      ...prev,
      [manualMetric]: (prev[manualMetric] || 0) + (parseInt(manualValue) || 0),
    }));
    setManualValue('');
  };

  const generateExport = useCallback((format: string) => {
    const data = {
      campaign: campaignTitle,
      dateRange,
      exportedAt: new Date().toLocaleString(),
      metrics: topMetrics.map(m => ({ label: m.label, value: m.value, change: m.change })),
      channelPerformance: channelPerformance.map(c => ({
        channel: c.channel,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        spend: c.spend,
        roi: c.roi,
      })),
      timeSeries: mergedTimeSeriesData,
      manualEntries,
    };

    if (format === 'csv') {
      let csv = 'Metric,Value,Change\n';
      topMetrics.forEach(m => { csv += `"${m.label}","${m.value}","${m.change}"\n`; });
      csv += '\nChannel,Impressions,Clicks,Conversions,Spend,ROI\n';
      channelPerformance.forEach(c => {
        csv += `"${c.channel}",${c.impressions},${c.clicks},${c.conversions},${c.spend},${c.roi}\n`;
      });
      csv += '\nWeek,Impressions,Clicks,Applications,Spend\n';
      mergedTimeSeriesData.forEach(d => {
        csv += `${d.week},${d.impressions},${d.clicks},${d.applications},${d.spend}\n`;
      });
      if (manualEntries.length > 0) {
        csv += '\nManual Entries\nMetric,Value,Week,Channel,Added At\n';
        manualEntries.forEach(e => {
          csv += `"${e.metric}","${e.value}","${e.week}","${e.channel}","${e.addedAt}"\n`;
        });
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-kpi-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-kpi-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Generate printable report
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>KPI Report - ${campaignTitle}</title>
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
            .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
          </style></head><body>
          <h1>📊 Campaign Performance Report</h1>
          <p class="subtitle">${campaignTitle} · ${dateRange} · Exported ${new Date().toLocaleDateString()}</p>
          <h2>Key Metrics</h2>
          <div class="metric-grid">
            ${topMetrics.map(m => `<div class="metric-card"><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div><div class="metric-change">${m.change}</div></div>`).join('')}
          </div>
          <h2>Channel Performance</h2>
          <table><thead><tr><th>Channel</th><th>Impressions</th><th>Clicks</th><th>Conversions</th><th>Spend</th><th>ROI</th></tr></thead><tbody>
            ${channelPerformance.map(c => `<tr><td>${c.channel}</td><td>${(c.impressions/1e6).toFixed(1)}M</td><td>${(c.clicks/1e3).toFixed(0)}K</td><td>${c.conversions.toLocaleString()}</td><td>£${(c.spend/1e3).toFixed(0)}K</td><td>${c.roi}x</td></tr>`).join('')}
          </tbody></table>
          <h2>Weekly Trend</h2>
          <table><thead><tr><th>Week</th><th>Impressions</th><th>Clicks</th><th>Applications</th><th>Spend</th></tr></thead><tbody>
            ${mergedTimeSeriesData.map(d => `<tr><td>${d.week}</td><td>${(d.impressions/1e3).toFixed(0)}K</td><td>${(d.clicks/1e3).toFixed(1)}K</td><td>${d.applications.toLocaleString()}</td><td>£${d.spend.toLocaleString()}</td></tr>`).join('')}
          </tbody></table>
          ${manualEntries.length > 0 ? `<h2>Manual Data Entries</h2><table><thead><tr><th>Metric</th><th>Value</th><th>Week</th><th>Channel</th><th>Added</th></tr></thead><tbody>${manualEntries.map(e => `<tr><td>${e.metric}</td><td>${e.value}</td><td>${e.week}</td><td>${e.channel}</td><td>${e.addedAt}</td></tr>`).join('')}</tbody></table>` : ''}
          <div class="footer">Generated by CampaignOS · campaignos.app · Report ID: RPT-${Date.now().toString(36).toUpperCase()}</div>
          </body></html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    }

    setExportMessage(`${format.toUpperCase()} export generated successfully!`);
    setTimeout(() => { setExportMessage(''); setShowExportMenu(false); }, 2500);
  }, [campaignTitle, dateRange, topMetrics, mergedTimeSeriesData, manualEntries]);

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
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
            <option value="4-weeks">Last 4 Weeks</option>
            <option value="8-weeks">Last 8 Weeks</option>
            <option value="12-weeks">Last 12 Weeks</option>
          </select>
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 rounded-xl px-3 py-2">
            <Globe size={12} /> <span>GA4</span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1" />
            <span>Meta</span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-1" />
          </div>
          <button onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-700/50 hover:border-slate-600">
            <Plus size={14} /> Manual Entry
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
                  <div className="p-4 text-center text-sm text-emerald-400 font-medium">
                    ✅ {exportMessage}
                  </div>
                ) : (
                  <>
                    <button onClick={() => generateExport('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-sm text-left">
                      <FileText size={16} className="text-red-400" />
                      <div><p className="font-medium">Export as PDF</p><p className="text-[10px] text-slate-500">Printable report format</p></div>
                    </button>
                    <button onClick={() => generateExport('csv')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-sm text-left border-t border-slate-700/50">
                      <BarChart3 size={16} className="text-emerald-400" />
                      <div><p className="font-medium">Export as CSV</p><p className="text-[10px] text-slate-500">Spreadsheet compatible</p></div>
                    </button>
                    <button onClick={() => generateExport('json')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-sm text-left border-t border-slate-700/50">
                      <Download size={16} className="text-blue-400" />
                      <div><p className="font-medium">Export as JSON</p><p className="text-[10px] text-slate-500">Raw data for integrations</p></div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual entries indicator */}
      {manualEntries.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6 flex items-center gap-3">
          <Plus size={14} className="text-blue-400" />
          <span className="text-sm text-blue-300">{manualEntries.length} manual data {manualEntries.length === 1 ? 'entry' : 'entries'} added to this report</span>
          <button onClick={() => { setManualEntries([]); setManualKpiData({}); }}
            className="ml-auto text-xs text-blue-400 hover:text-blue-300 font-medium">Clear all</button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {topMetrics.map((m, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3`}>
              {m.icon}
            </div>
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
            <div className={`flex items-center gap-1 text-[10px] font-semibold mt-2 ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {m.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Performance Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Campaign Performance Over Time</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" />Impressions</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Clicks</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Applications</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mergedTimeSeriesData}>
              <defs>
                <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gClk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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

        {/* Budget Allocation Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Spend by Channel</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={channelPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {channelPieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                formatter={(value) => `£${(Number(value) / 1000).toFixed(1)}k`} />
              <Legend iconType="circle" iconSize={8}
                formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Channel Performance Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold">Channel Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 tracking-wider">
                  <th className="text-left p-3 font-semibold">Channel</th>
                  <th className="text-right p-3 font-semibold">Impressions</th>
                  <th className="text-right p-3 font-semibold">Clicks</th>
                  <th className="text-right p-3 font-semibold">Conv.</th>
                  <th className="text-right p-3 font-semibold">Spend</th>
                  <th className="text-right p-3 font-semibold">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {channelPerformance.map((ch, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      {ch.channel}
                    </td>
                    <td className="p-3 text-right text-slate-400">{(ch.impressions / 1000000).toFixed(1)}M</td>
                    <td className="p-3 text-right text-slate-400">{(ch.clicks / 1000).toFixed(0)}K</td>
                    <td className="p-3 text-right text-slate-400">{ch.conversions.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-400">£{(ch.spend / 1000).toFixed(0)}K</td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${ch.roi >= 3 ? 'text-emerald-400' : ch.roi >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
                        {ch.roi}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Social Sentiment Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sentimentData}>
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
      </div>

      {/* Spend Over Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold mb-4">Weekly Spend Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mergedTimeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `£${v / 1000}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
              formatter={(value) => `£${Number(value).toLocaleString()}`} />
            <Line type="monotone" dataKey="spend" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-brand-900/30 to-violet-900/20 border border-brand-700/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-brand-400" />
          <h3 className="font-semibold">AI Performance Summary</h3>
          <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-semibold">Auto-generated</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2">✅ What&apos;s Working</h4>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li>• LinkedIn ads delivering <span className="font-semibold text-emerald-400">3.2x ROI</span> — highest across all channels</li>
              <li>• Email open rates at <span className="font-semibold text-emerald-400">28.4%</span>, above NHS sector average of 22%</li>
              <li>• Social sentiment trending positive at <span className="font-semibold text-emerald-400">82%</span></li>
              <li>• Cost per application decreased <span className="font-semibold text-emerald-400">5.2%</span> week-on-week</li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-amber-400 mb-2">⚠️ Recommendations</h4>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li>• Consider <span className="font-semibold text-amber-400">increasing LinkedIn budget by 15%</span> based on performance data</li>
              <li>• Display ads underperforming — <span className="font-semibold text-amber-400">review creative assets</span> and targeting</li>
              <li>• Schedule <span className="font-semibold text-amber-400">A/B test on landing page</span> CTAs this week</li>
              <li>• Events channel shows strong conversion rate — <span className="font-semibold text-amber-400">add 2 more webinar dates</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowManualEntry(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Manual Data Entry</h2>
                <p className="text-xs text-slate-400 mt-1">Add KPI data manually when API sources are unavailable</p>
              </div>
              <button onClick={() => setShowManualEntry(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Metric</label>
                  <select value={manualMetric} onChange={e => setManualMetric(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                    <option value="impressions">Impressions</option>
                    <option value="clicks">Clicks</option>
                    <option value="applications">Applications</option>
                    <option value="leads">Leads</option>
                    <option value="spend">Spend (£)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Value</label>
                  <input type="number" value={manualValue} onChange={e => setManualValue(e.target.value)}
                    placeholder="e.g., 15000"
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Week</label>
                  <select value={manualWeek} onChange={e => setManualWeek(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                    {['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Channel Source</label>
                  <select value={manualChannel} onChange={e => setManualChannel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                    <option>Social Media</option>
                    <option>Email</option>
                    <option>Paid Search</option>
                    <option>Display</option>
                    <option>Content</option>
                    <option>Events</option>
                    <option>Direct</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <button onClick={handleAddManualEntry}
                disabled={!manualValue.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                <Save size={16} /> Add Data Point
              </button>

              {/* Recent manual entries */}
              {manualEntries.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Entries</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {manualEntries.slice().reverse().map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg text-xs">
                        <span className="text-brand-400 font-semibold capitalize">{entry.metric}</span>
                        <span className="text-white font-medium">{parseInt(entry.value).toLocaleString()}</span>
                        <span className="text-slate-500">{entry.week}</span>
                        <span className="text-slate-600">{entry.channel}</span>
                        <span className="text-slate-600 ml-auto">{entry.addedAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
