import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { KPIDataSource, KPIRecordEntry, KPIChannelEntry, KPITimeSeriesEntry, KPISentimentEntry } from '../types';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Download, Info, X, Database } from 'lucide-react';
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


function toSource(value: string): KPIDataSource {
  if (value in SOURCE_BADGES) return value as KPIDataSource;
  return 'manual';
}

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

  const recordsForFilter = useMemo(() => {
    const rows = selectedKpiId === 'all' ? kpiRecordData : kpiRecordData.filter(r => r.kpiId === selectedKpiId);
    return [...rows].sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
  }, [kpiRecordData, selectedKpiId]);

  const cardData = useMemo(() => {
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

  const drilldown = useMemo(() => {
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
    const rows = recordsForFilter.map(r => {
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

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cardData.map(card => (
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

      {drilldown && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Detailed KPI View</p>
              <h3 className="font-semibold text-lg mt-1">{drilldown.kpi.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{drilldown.records.length} measurement entries</p>
            </div>
            <button onClick={() => setDrilldownKpiId(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <StatCard label="Latest" value={drilldown.latest ? `${drilldown.latest.value.toLocaleString()} ${drilldown.latest.unit}` : '--'} />
            <StatCard label="Target" value={drilldown.latest?.target !== undefined ? String(drilldown.latest.target) : 'Not set'} />
            <StatCard label="Trend" value={drilldown.records.length > 1 ? `${drilldown.trend >= 0 ? '+' : ''}${drilldown.trend.toFixed(1)}%` : 'N/A'} />
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={drilldown.records.map(r => ({ period: r.periodLabel, value: r.value, target: r.target ?? null }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeDasharray="4 4" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderRecords = () => (
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
          <select value={recordForm.source} onChange={e => setRecordForm(prev => ({ ...prev, source: toSource(e.target.value) }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
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
              {recordsForFilter.map(r => {
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
  );

  const renderSecondaryTab = () => {
    if (activeTab === 'channels') {
      return <ChannelSection title="Channel metrics" data={kpiChannelData} onAdd={addKpiChannel} onEdit={editKpiChannel} onDelete={deleteKpiChannel} canEdit={canEdit} kind="channel" />;
    }
    if (activeTab === 'timeseries') {
      return <ChannelSection title="Time-series metrics" data={kpiTimeSeriesData} onAdd={addKpiTimeSeries} onEdit={editKpiTimeSeries} onDelete={deleteKpiTimeSeries} canEdit={canEdit} kind="timeseries" />;
    }
    if (activeTab === 'sentiment') {
      return <ChannelSection title="Sentiment metrics" data={kpiSentimentData} onAdd={addKpiSentiment} onEdit={editKpiSentiment} onDelete={deleteKpiSentiment} canEdit={canEdit} kind="sentiment" />;
    }
    return null;
  };

  const renderMainContent = () => {
    if (activeTab === 'overview') return renderOverview();
    if (activeTab === 'records') return renderRecords();
    return renderSecondaryTab();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">KPI Reporting Hub</h1>
          <p className="text-sm text-slate-400">Stable KPI reporting with drilldowns, trendlines and structured CRUD.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportKpis('csv')} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm flex items-center gap-2"><Download size={14} /> CSV</button>
          <button onClick={() => exportKpis('json')} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm flex items-center gap-2"><Download size={14} /> JSON</button>
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 mb-6 flex items-center gap-3 text-sm text-slate-300">
        <Info size={14} className="text-brand-400" />
        KPIs are managed in <span className="font-semibold text-white">Admin → KPI Management</span>. Click KPI cards in overview for drilldown reporting.
      </div>

      <div className="flex gap-2 overflow-x-auto mb-6">
        {(['overview', 'records', 'channels', 'timeseries', 'sentiment'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${activeTab === tab ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderMainContent()}
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

function ChannelSection({ title, data, onAdd, onEdit, onDelete, canEdit, kind }: {
  title: string;
  data: Array<KPIChannelEntry | KPITimeSeriesEntry | KPISentimentEntry>;
  onAdd: (entry: any) => void;
  onEdit: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  kind: 'channel' | 'timeseries' | 'sentiment';
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonValue, setJsonValue] = useState('');

  const save = () => {
    try {
      const payload = JSON.parse(jsonValue);
      if (editingId) onEdit(editingId, payload);
      else onAdd({ id: `${kind}-${Date.now()}`, ...payload } as KPIChannelEntry & KPITimeSeriesEntry & KPISentimentEntry);
      setShowForm(false);
      setEditingId(null);
      setJsonValue('');
    } catch {
      // noop
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><Database size={16} /> {title}</h3>
        <button disabled={!canEdit} onClick={() => setShowForm(v => !v)} className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50">{showForm ? 'Close' : 'Add / Edit JSON'}</button>
      </div>

      {kind === 'channel' && (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data as KPIChannelEntry[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="channel" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="impressions" fill="#6366f1" />
            <Bar dataKey="clicks" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 space-y-2">
        {data.map(item => (
          <div key={item.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between">
            <pre className="text-xs text-slate-300 overflow-auto">{JSON.stringify(item, null, 2)}</pre>
            <div>
              <button disabled={!canEdit} onClick={() => { setEditingId(item.id); setJsonValue(JSON.stringify(item, null, 2)); setShowForm(true); }} className="p-2 text-slate-400 hover:text-white disabled:opacity-50"><Pencil size={14} /></button>
              <button disabled={!canEdit} onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mt-4">
          <textarea value={jsonValue} onChange={e => setJsonValue(e.target.value)} rows={10} className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono" placeholder="Paste JSON payload" />
          <button disabled={!canEdit} onClick={save} className="mt-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}
