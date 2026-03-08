import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { KPIDataSource, KPIRecordEntry, KPIChannelEntry, KPITimeSeriesEntry, KPISentimentEntry } from '../types';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Download, Info, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SOURCE_BADGES: Record<KPIDataSource, string> = {
  seed: 'Demo Data',
  manual: 'Manual Entry',
  ga4: 'Google Analytics 4',
  meta: 'Meta Business',
  linkedin: 'LinkedIn',
  hubspot: 'HubSpot',
  import: 'CSV Import',
};

const CATEGORY_LABELS = {
  awareness: 'Awareness',
  engagement: 'Engagement',
  conversion: 'Conversion',
  retention: 'Retention',
} as const;

type ActiveTab = 'overview' | 'records' | 'channels' | 'timeseries' | 'sentiment';

export default function KPIDashboard() {
  const {
    permissions,
    currentUser,
    editableKpis,
    kpiRecordData,
    addKpiRecord,
    editKpiRecord,
    deleteKpiRecord,
    kpiChannelData,
    addKpiChannel,
    editKpiChannel,
    deleteKpiChannel,
    kpiTimeSeriesData,
    addKpiTimeSeries,
    editKpiTimeSeries,
    deleteKpiTimeSeries,
    kpiSentimentData,
    addKpiSentiment,
    editKpiSentiment,
    deleteKpiSentiment,
  } = useApp();

  const canEdit = permissions.canEditCampaign;
  const activeKpis = editableKpis.filter(k => k.isActive);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedKpiId, setSelectedKpiId] = useState<string>('all');
  const [drilldownKpiId, setDrilldownKpiId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [recordForm, setRecordForm] = useState({
    kpiId: '', periodLabel: '', value: '', target: '', unit: '', source: 'manual' as KPIDataSource, notes: '',
  });

  const kpiRecords = useMemo(() => {
    const rows = selectedKpiId === 'all' ? kpiRecordData : kpiRecordData.filter(r => r.kpiId === selectedKpiId);
    return [...rows].sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
  }, [kpiRecordData, selectedKpiId]);

  const cards = useMemo(() => {
    return activeKpis.map(kpi => {
      const records = kpiRecordData
        .filter(r => r.kpiId === kpi.id)
        .sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
      const latest = records[records.length - 1];
      const previous = records[records.length - 2];
      const trend = latest && previous && previous.value !== 0 ? ((latest.value - previous.value) / previous.value) * 100 : 0;
      return { kpi, records, latest, trend };
    });
  }, [activeKpis, kpiRecordData]);

  const drilldownData = useMemo(() => {
    if (!drilldownKpiId) return null;
    const kpi = activeKpis.find(k => k.id === drilldownKpiId);
    if (!kpi) return null;
    const records = kpiRecordData
      .filter(r => r.kpiId === drilldownKpiId)
      .sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    const latest = records[records.length - 1];
    const previous = records[records.length - 2];
    const trend = latest && previous && previous.value !== 0 ? ((latest.value - previous.value) / previous.value) * 100 : 0;
    return { kpi, records, latest, trend };
  }, [activeKpis, drilldownKpiId, kpiRecordData]);

  const openRecordEditor = (entry?: KPIRecordEntry) => {
    if (entry) {
      setEditingRecordId(entry.id);
      setRecordForm({
        kpiId: entry.kpiId,
        periodLabel: entry.periodLabel,
        value: String(entry.value),
        target: entry.target === undefined ? '' : String(entry.target),
        unit: entry.unit,
        source: entry.source,
        notes: entry.notes || '',
      });
      return;
    }
    setEditingRecordId(null);
    setRecordForm({
      kpiId: selectedKpiId !== 'all' ? selectedKpiId : (activeKpis[0]?.id || ''),
      periodLabel: '',
      value: '',
      target: '',
      unit: '',
      source: 'manual',
      notes: '',
    });
  };

  const saveRecord = () => {
    if (!recordForm.kpiId || !recordForm.periodLabel || !recordForm.value || !recordForm.unit) return;
    const payload = {
      kpiId: recordForm.kpiId,
      periodLabel: recordForm.periodLabel,
      value: parseFloat(recordForm.value),
      target: recordForm.target ? parseFloat(recordForm.target) : undefined,
      unit: recordForm.unit,
      source: recordForm.source,
      sourceLabel: recordForm.source === 'manual' ? `Entered by ${currentUser?.name || 'User'}` : SOURCE_BADGES[recordForm.source],
      notes: recordForm.notes,
      addedBy: currentUser?.name || 'Unknown',
      addedAt: new Date().toISOString(),
    };

    if (editingRecordId) editKpiRecord(editingRecordId, payload);
    else addKpiRecord({ id: `kr-${Date.now()}`, ...payload });

    openRecordEditor();
  };

  const exportKpis = (type: 'csv' | 'json') => {
    const rows = kpiRecords.map(r => {
      const kpi = editableKpis.find(k => k.id === r.kpiId);
      return {
        kpi: kpi?.name || 'Unknown KPI',
        category: kpi ? CATEGORY_LABELS[kpi.category] : 'Unknown',
        period: r.periodLabel,
        value: r.value,
        unit: r.unit,
        target: r.target ?? '',
        source: SOURCE_BADGES[r.source],
        notes: r.notes || '',
      };
    });

    if (type === 'json') {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kpi-report.json';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    let csv = 'KPI,Category,Period,Value,Unit,Target,Source,Notes\n';
    rows.forEach(r => {
      csv += `"${r.kpi}","${r.category}","${r.period}",${r.value},"${r.unit}","${r.target}","${r.source}","${r.notes}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kpi-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">KPI Reporting Hub</h1>
          <p className="text-sm text-slate-400">Clean KPI reporting with drilldowns, trendlines and structured CRUD.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportKpis('csv')} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm flex items-center gap-2"><Download size={14} /> CSV</button>
          <button onClick={() => exportKpis('json')} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm flex items-center gap-2"><Download size={14} /> JSON</button>
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 mb-6 flex items-center gap-3 text-sm text-slate-300">
        <Info size={14} className="text-brand-400" />
        KPIs are managed in <span className="font-semibold text-white">Admin → KPI Management</span>. Click any KPI card in Overview for deeper reporting.
      </div>

      <div className="flex gap-2 overflow-x-auto mb-6">
        {(['overview', 'records', 'channels', 'timeseries', 'sentiment'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm capitalize ${activeTab === tab ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map(card => (
              <button
                key={card.kpi.id}
                onClick={() => setDrilldownKpiId(card.kpi.id)}
                className="text-left bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-brand-500/50 transition-colors"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">{CATEGORY_LABELS[card.kpi.category]}</p>
                <h3 className="font-semibold mt-1">{card.kpi.name}</h3>
                <p className="text-2xl font-bold mt-4">{card.latest ? `${card.latest.value.toLocaleString()} ${card.latest.unit}` : '--'}</p>
                <div className="text-xs mt-2 text-slate-400 flex items-center gap-1">
                  {card.trend >= 0 ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-red-400" />}
                  {card.records.length > 1 ? `${card.trend >= 0 ? '+' : ''}${card.trend.toFixed(1)}% vs previous` : 'Click to open KPI reporting'}
                </div>
              </button>
            ))}
          </div>

          {drilldownData && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Detailed KPI View</p>
                  <h3 className="font-semibold text-lg mt-1">{drilldownData.kpi.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{drilldownData.records.length} measurement entries</p>
                </div>
                <button onClick={() => setDrilldownKpiId(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <StatCard label="Latest" value={drilldownData.latest ? `${drilldownData.latest.value.toLocaleString()} ${drilldownData.latest.unit}` : '--'} />
                <StatCard label="Target" value={drilldownData.latest?.target !== undefined ? String(drilldownData.latest.target) : 'Not set'} />
                <StatCard label="Trend" value={drilldownData.records.length > 1 ? `${drilldownData.trend >= 0 ? '+' : ''}${drilldownData.trend.toFixed(1)}%` : 'N/A'} />
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={drilldownData.records.map(r => ({ period: r.periodLabel, value: r.value, target: r.target ?? null }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="period" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeDasharray="4 4" dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>

              <div className="overflow-auto mt-4">
                <table className="w-full text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-2">Period</th><th className="text-left p-2">Value</th><th className="text-left p-2">Target</th><th className="text-left p-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drilldownData.records.map(r => (
                      <tr key={r.id} className="border-b border-slate-800/70">
                        <td className="p-2">{r.periodLabel}</td>
                        <td className="p-2">{r.value.toLocaleString()} {r.unit}</td>
                        <td className="p-2">{r.target ?? '--'}</td>
                        <td className="p-2">{SOURCE_BADGES[r.source]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold">{editingRecordId ? 'Edit KPI record' : 'Add KPI record'}</h3>
            <select value={recordForm.kpiId} onChange={e => setRecordForm(prev => ({ ...prev, kpiId: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
              <option value="">Select KPI</option>
              {activeKpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <input value={recordForm.periodLabel} onChange={e => setRecordForm(prev => ({ ...prev, periodLabel: e.target.value }))} placeholder="Period (e.g. 2026-Q1)" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={recordForm.value} onChange={e => setRecordForm(prev => ({ ...prev, value: e.target.value }))} placeholder="Value" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
              <input value={recordForm.target} onChange={e => setRecordForm(prev => ({ ...prev, target: e.target.value }))} placeholder="Target" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={recordForm.unit} onChange={e => setRecordForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="Unit" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
              <select value={recordForm.source} onChange={e => setRecordForm(prev => ({ ...prev, source: e.target.value as KPIDataSource }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                {Object.entries(SOURCE_BADGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <textarea value={recordForm.notes} onChange={e => setRecordForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes (optional)" rows={3} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <div className="flex gap-2">
              <button disabled={!canEdit} onClick={saveRecord} className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Plus size={14} /> {editingRecordId ? 'Update' : 'Add'}</button>
              {editingRecordId && <button onClick={() => openRecordEditor()} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Cancel</button>}
            </div>
          </div>

          <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">KPI measurement records</h3>
              <select value={selectedKpiId} onChange={e => setSelectedKpiId(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                <option value="all">All KPIs</option>
                {activeKpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-2">KPI</th><th className="text-left p-2">Period</th><th className="text-left p-2">Value</th><th className="text-left p-2">Target</th><th className="text-left p-2">Source</th><th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiRecords.map(r => {
                    const kpi = editableKpis.find(k => k.id === r.kpiId);
                    return (
                      <tr key={r.id} className="border-b border-slate-800/70">
                        <td className="p-2">{kpi?.name || 'Unknown KPI'}</td>
                        <td className="p-2">{r.periodLabel}</td>
                        <td className="p-2">{r.value.toLocaleString()} {r.unit}</td>
                        <td className="p-2">{r.target ?? '--'}</td>
                        <td className="p-2">{SOURCE_BADGES[r.source]}</td>
                        <td className="p-2 text-right">
                          <button disabled={!canEdit} onClick={() => openRecordEditor(r)} className="p-2 text-slate-400 hover:text-white disabled:opacity-50"><Pencil size={14} /></button>
                          <button disabled={!canEdit} onClick={() => deleteKpiRecord(r.id)} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

      {activeTab === 'channels' && <ChannelSection data={kpiChannelData} canEdit={canEdit} onAdd={addKpiChannel} onEdit={editKpiChannel} onDelete={deleteKpiChannel} sourceLabel={SOURCE_BADGES} currentUser={currentUser?.name || 'Unknown'} />}
      {activeTab === 'timeseries' && <TimeSeriesSection data={kpiTimeSeriesData} canEdit={canEdit} onAdd={addKpiTimeSeries} onEdit={editKpiTimeSeries} onDelete={deleteKpiTimeSeries} sourceLabel={SOURCE_BADGES} currentUser={currentUser?.name || 'Unknown'} />}
      {activeTab === 'sentiment' && <SentimentSection data={kpiSentimentData} canEdit={canEdit} onAdd={addKpiSentiment} onEdit={editKpiSentiment} onDelete={deleteKpiSentiment} sourceLabel={SOURCE_BADGES} currentUser={currentUser?.name || 'Unknown'} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function ChannelSection({ data, onAdd, onEdit, onDelete, canEdit, sourceLabel, currentUser }: {
  data: KPIChannelEntry[];
  onAdd: (entry: KPIChannelEntry) => void;
  onEdit: (id: string, updates: Partial<KPIChannelEntry>) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  sourceLabel: Record<KPIDataSource, string>;
  currentUser: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ channel: '', impressions: '', clicks: '', conversions: '', spend: '', roi: '', notes: '', source: 'manual' as KPIDataSource });

  const startEdit = (entry?: KPIChannelEntry) => {
    if (!entry) {
      setEditingId(null);
      setForm({ channel: '', impressions: '', clicks: '', conversions: '', spend: '', roi: '', notes: '', source: 'manual' });
      return;
    }
    setEditingId(entry.id);
    setForm({ channel: entry.channel, impressions: String(entry.impressions), clicks: String(entry.clicks), conversions: String(entry.conversions), spend: String(entry.spend), roi: String(entry.roi), notes: entry.notes || '', source: entry.source });
  };

  const save = () => {
    if (!form.channel.trim()) return;
    const payload = {
      channel: form.channel,
      impressions: parseInt(form.impressions) || 0,
      clicks: parseInt(form.clicks) || 0,
      conversions: parseInt(form.conversions) || 0,
      spend: parseFloat(form.spend) || 0,
      roi: parseFloat(form.roi) || 0,
      notes: form.notes,
      source: form.source,
      sourceLabel: form.source === 'manual' ? `Entered by ${currentUser}` : sourceLabel[form.source],
      addedBy: currentUser,
      addedAt: new Date().toISOString(),
    };
    if (editingId) onEdit(editingId, payload);
    else onAdd({ id: `kc-${Date.now()}`, ...payload });
    startEdit();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold">{editingId ? 'Edit channel row' : 'Add channel row'}</h3>
        <input value={form.channel} onChange={e => setForm(prev => ({ ...prev, channel: e.target.value }))} placeholder="Channel" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.impressions} onChange={e => setForm(prev => ({ ...prev, impressions: e.target.value }))} placeholder="Impressions" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.clicks} onChange={e => setForm(prev => ({ ...prev, clicks: e.target.value }))} placeholder="Clicks" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.conversions} onChange={e => setForm(prev => ({ ...prev, conversions: e.target.value }))} placeholder="Conversions" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.spend} onChange={e => setForm(prev => ({ ...prev, spend: e.target.value }))} placeholder="Spend" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        </div>
        <input value={form.roi} onChange={e => setForm(prev => ({ ...prev, roi: e.target.value }))} placeholder="ROI" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        <select value={form.source} onChange={e => setForm(prev => ({ ...prev, source: e.target.value as KPIDataSource }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
          {Object.entries(sourceLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <div className="flex gap-2">
          <button disabled={!canEdit} onClick={save} className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button onClick={() => startEdit()} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Cancel</button>}
        </div>
      </div>

      <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="channel" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="impressions" fill="#6366f1" />
            <Bar dataKey="clicks" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
        <div className="overflow-auto mt-4">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-800"><th className="text-left p-2">Channel</th><th className="text-left p-2">Impressions</th><th className="text-left p-2">Clicks</th><th className="text-left p-2">Conversions</th><th className="text-right p-2">Actions</th></tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-slate-800/70">
                  <td className="p-2">{row.channel}</td><td className="p-2">{row.impressions.toLocaleString()}</td><td className="p-2">{row.clicks.toLocaleString()}</td><td className="p-2">{row.conversions.toLocaleString()}</td>
                  <td className="p-2 text-right">
                    <button disabled={!canEdit} onClick={() => startEdit(row)} className="p-2 text-slate-400 hover:text-white disabled:opacity-50"><Pencil size={14} /></button>
                    <button disabled={!canEdit} onClick={() => onDelete(row.id)} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TimeSeriesSection({ data, onAdd, onEdit, onDelete, canEdit, sourceLabel, currentUser }: {
  data: KPITimeSeriesEntry[];
  onAdd: (entry: KPITimeSeriesEntry) => void;
  onEdit: (id: string, updates: Partial<KPITimeSeriesEntry>) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  sourceLabel: Record<KPIDataSource, string>;
  currentUser: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ week: '', impressions: '', clicks: '', leads: '', spend: '', applications: '', notes: '', source: 'manual' as KPIDataSource });

  const startEdit = (entry?: KPITimeSeriesEntry) => {
    if (!entry) {
      setEditingId(null);
      setForm({ week: '', impressions: '', clicks: '', leads: '', spend: '', applications: '', notes: '', source: 'manual' });
      return;
    }
    setEditingId(entry.id);
    setForm({ week: entry.week, impressions: String(entry.impressions), clicks: String(entry.clicks), leads: String(entry.leads), spend: String(entry.spend), applications: String(entry.applications), notes: entry.notes || '', source: entry.source });
  };

  const save = () => {
    if (!form.week.trim()) return;
    const payload = {
      week: form.week,
      impressions: parseInt(form.impressions) || 0,
      clicks: parseInt(form.clicks) || 0,
      leads: parseInt(form.leads) || 0,
      spend: parseFloat(form.spend) || 0,
      applications: parseInt(form.applications) || 0,
      notes: form.notes,
      source: form.source,
      sourceLabel: form.source === 'manual' ? `Entered by ${currentUser}` : sourceLabel[form.source],
      addedBy: currentUser,
      addedAt: new Date().toISOString(),
    };
    if (editingId) onEdit(editingId, payload);
    else onAdd({ id: `kt-${Date.now()}`, ...payload });
    startEdit();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold">{editingId ? 'Edit time-series row' : 'Add time-series row'}</h3>
        <input value={form.week} onChange={e => setForm(prev => ({ ...prev, week: e.target.value }))} placeholder="Period label (e.g. W12 or Mar)" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.impressions} onChange={e => setForm(prev => ({ ...prev, impressions: e.target.value }))} placeholder="Impressions" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.clicks} onChange={e => setForm(prev => ({ ...prev, clicks: e.target.value }))} placeholder="Clicks" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.leads} onChange={e => setForm(prev => ({ ...prev, leads: e.target.value }))} placeholder="Leads" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.applications} onChange={e => setForm(prev => ({ ...prev, applications: e.target.value }))} placeholder="Applications" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        </div>
        <input value={form.spend} onChange={e => setForm(prev => ({ ...prev, spend: e.target.value }))} placeholder="Spend" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        <select value={form.source} onChange={e => setForm(prev => ({ ...prev, source: e.target.value as KPIDataSource }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
          {Object.entries(sourceLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <div className="flex gap-2">
          <button disabled={!canEdit} onClick={save} className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button onClick={() => startEdit()} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Cancel</button>}
        </div>
      </div>

      <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="impressions" stroke="#6366f1" strokeWidth={2} />
            <Line type="monotone" dataKey="applications" stroke="#f59e0b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="overflow-auto mt-4">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-800"><th className="text-left p-2">Period</th><th className="text-left p-2">Impressions</th><th className="text-left p-2">Clicks</th><th className="text-left p-2">Applications</th><th className="text-right p-2">Actions</th></tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-slate-800/70">
                  <td className="p-2">{row.week}</td><td className="p-2">{row.impressions.toLocaleString()}</td><td className="p-2">{row.clicks.toLocaleString()}</td><td className="p-2">{row.applications.toLocaleString()}</td>
                  <td className="p-2 text-right">
                    <button disabled={!canEdit} onClick={() => startEdit(row)} className="p-2 text-slate-400 hover:text-white disabled:opacity-50"><Pencil size={14} /></button>
                    <button disabled={!canEdit} onClick={() => onDelete(row.id)} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SentimentSection({ data, onAdd, onEdit, onDelete, canEdit, sourceLabel, currentUser }: {
  data: KPISentimentEntry[];
  onAdd: (entry: KPISentimentEntry) => void;
  onEdit: (id: string, updates: Partial<KPISentimentEntry>) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  sourceLabel: Record<KPIDataSource, string>;
  currentUser: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: '', positive: '', neutral: '', negative: '', source: 'manual' as KPIDataSource });

  const startEdit = (entry?: KPISentimentEntry) => {
    if (!entry) {
      setEditingId(null);
      setForm({ date: '', positive: '', neutral: '', negative: '', source: 'manual' });
      return;
    }
    setEditingId(entry.id);
    setForm({ date: entry.date, positive: String(entry.positive), neutral: String(entry.neutral), negative: String(entry.negative), source: entry.source });
  };

  const save = () => {
    if (!form.date.trim()) return;
    const payload = {
      date: form.date,
      positive: parseInt(form.positive) || 0,
      neutral: parseInt(form.neutral) || 0,
      negative: parseInt(form.negative) || 0,
      source: form.source,
      sourceLabel: form.source === 'manual' ? `Entered by ${currentUser}` : sourceLabel[form.source],
      addedBy: currentUser,
      addedAt: new Date().toISOString(),
    };
    if (editingId) onEdit(editingId, payload);
    else onAdd({ id: `ks-${Date.now()}`, ...payload });
    startEdit();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold">{editingId ? 'Edit sentiment row' : 'Add sentiment row'}</h3>
        <input value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} placeholder="Date label" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <input value={form.positive} onChange={e => setForm(prev => ({ ...prev, positive: e.target.value }))} placeholder="Positive" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.neutral} onChange={e => setForm(prev => ({ ...prev, neutral: e.target.value }))} placeholder="Neutral" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={form.negative} onChange={e => setForm(prev => ({ ...prev, negative: e.target.value }))} placeholder="Negative" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
        </div>
        <select value={form.source} onChange={e => setForm(prev => ({ ...prev, source: e.target.value as KPIDataSource }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
          {Object.entries(sourceLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <div className="flex gap-2">
          <button disabled={!canEdit} onClick={save} className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button onClick={() => startEdit()} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Cancel</button>}
        </div>
      </div>

      <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="positive" fill="#10b981" />
            <Bar dataKey="neutral" fill="#94a3b8" />
            <Bar dataKey="negative" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
        <div className="overflow-auto mt-4">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-800"><th className="text-left p-2">Date</th><th className="text-left p-2">Positive</th><th className="text-left p-2">Neutral</th><th className="text-left p-2">Negative</th><th className="text-right p-2">Actions</th></tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-slate-800/70">
                  <td className="p-2">{row.date}</td><td className="p-2">{row.positive}</td><td className="p-2">{row.neutral}</td><td className="p-2">{row.negative}</td>
                  <td className="p-2 text-right">
                    <button disabled={!canEdit} onClick={() => startEdit(row)} className="p-2 text-slate-400 hover:text-white disabled:opacity-50"><Pencil size={14} /></button>
                    <button disabled={!canEdit} onClick={() => onDelete(row.id)} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
