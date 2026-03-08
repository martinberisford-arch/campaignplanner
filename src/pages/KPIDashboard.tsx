import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { KPIDataSource, KPIRecordEntry, KPIChannelEntry, KPITimeSeriesEntry, KPISentimentEntry } from '../types';
import { Plus, Pencil, Trash2, TrendingUp, Target, Database, Download, Info } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedKpiId, setSelectedKpiId] = useState<string>('all');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [recordForm, setRecordForm] = useState({
    kpiId: '',
    periodLabel: '',
    value: '',
    target: '',
    unit: '',
    source: 'manual' as KPIDataSource,
    notes: '',
  });

  const canEdit = permissions.canEditCampaign;
  const activeKpis = editableKpis.filter(k => k.isActive);

  const filteredRecords = useMemo(() => {
    const all = selectedKpiId === 'all'
      ? kpiRecordData
      : kpiRecordData.filter(r => r.kpiId === selectedKpiId);
    return [...all].sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
  }, [kpiRecordData, selectedKpiId]);

  const overviewCards = useMemo(() => {
    return activeKpis.map(kpi => {
      const records = kpiRecordData
        .filter(r => r.kpiId === kpi.id)
        .sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
      const latest = records[records.length - 1];
      const prev = records[records.length - 2];
      const trend = latest && prev && prev.value !== 0 ? ((latest.value - prev.value) / prev.value) * 100 : 0;
      const targetGap = latest?.target ? latest.value - latest.target : undefined;
      return { kpi, records, latest, trend, targetGap };
    });
  }, [activeKpis, kpiRecordData]);

  const chartData = filteredRecords.map(r => ({
    period: r.periodLabel,
    value: r.value,
    target: r.target ?? null,
  }));

  const openRecordForm = (entry?: KPIRecordEntry) => {
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

    if (editingRecordId) {
      editKpiRecord(editingRecordId, payload);
    } else {
      addKpiRecord({ id: `kr-${Date.now()}`, ...payload });
    }
    setEditingRecordId(null);
    openRecordForm();
  };

  const exportKpis = (type: 'csv' | 'json') => {
    const rows = filteredRecords.map(r => {
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
          <p className="text-sm text-slate-400">A KPI-first reporting area with full CRUD, trendlines and exportable reporting.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportKpis('csv')} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm flex items-center gap-2"><Download size={14} /> CSV</button>
          <button onClick={() => exportKpis('json')} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm flex items-center gap-2"><Download size={14} /> JSON</button>
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 mb-6 flex items-center gap-3 text-sm text-slate-300">
        <Info size={14} className="text-brand-400" />
        KPIs shown here come from <span className="font-semibold text-white">Admin → KPI Management</span>, and their measurements are managed below.
      </div>

      <div className="flex gap-2 overflow-x-auto mb-6">
        {(['overview', 'records', 'channels', 'timeseries', 'sentiment'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm ${activeTab === tab ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {overviewCards.map(card => (
              <div key={card.kpi.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{CATEGORY_LABELS[card.kpi.category]}</p>
                    <h3 className="font-semibold mt-1">{card.kpi.name}</h3>
                  </div>
                  <Target size={16} className="text-brand-400" />
                </div>
                <p className="text-2xl font-bold mt-4">{card.latest ? `${card.latest.value.toLocaleString()} ${card.latest.unit}` : '--'}</p>
                <div className="text-xs mt-2 text-slate-400 flex items-center gap-1">
                  <TrendingUp size={12} className={card.trend >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                  {card.records.length > 1 ? `${card.trend >= 0 ? '+' : ''}${card.trend.toFixed(1)}% vs previous` : 'Need at least 2 records for trend'}
                </div>
                <p className="text-xs mt-2 text-slate-500">
                  {card.targetGap === undefined ? 'No target set' : card.targetGap >= 0 ? `Above target by ${card.targetGap.toFixed(2)}` : `Below target by ${Math.abs(card.targetGap).toFixed(2)}`}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Trendlines by KPI</h3>
              <select value={selectedKpiId} onChange={e => setSelectedKpiId(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                <option value="all">All KPIs</option>
                {activeKpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="period" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeDasharray="5 5" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap items-end gap-2 mb-4">
            <select value={recordForm.kpiId} onChange={e => setRecordForm(prev => ({ ...prev, kpiId: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
              <option value="">Select KPI</option>
              {activeKpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <input value={recordForm.periodLabel} onChange={e => setRecordForm(prev => ({ ...prev, periodLabel: e.target.value }))} placeholder="Period (e.g. 2026-Q1)" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <input value={recordForm.value} onChange={e => setRecordForm(prev => ({ ...prev, value: e.target.value }))} placeholder="Value" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <input value={recordForm.target} onChange={e => setRecordForm(prev => ({ ...prev, target: e.target.value }))} placeholder="Target (optional)" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <input value={recordForm.unit} onChange={e => setRecordForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="Unit (%, users, £)" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <select value={recordForm.source} onChange={e => setRecordForm(prev => ({ ...prev, source: e.target.value as KPIDataSource }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
              {Object.keys(SOURCE_BADGES).map(source => <option key={source} value={source}>{SOURCE_BADGES[source as KPIDataSource]}</option>)}
            </select>
            <button disabled={!canEdit} onClick={saveRecord} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm flex items-center gap-2 disabled:opacity-50"><Plus size={14} /> {editingRecordId ? 'Update' : 'Add'}</button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="text-left p-2">KPI</th><th className="text-left p-2">Period</th><th className="text-left p-2">Value</th><th className="text-left p-2">Target</th><th className="text-left p-2">Source</th><th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => {
                  const kpi = editableKpis.find(k => k.id === r.kpiId);
                  return (
                    <tr key={r.id} className="border-b border-slate-800/70">
                      <td className="p-2">{kpi?.name || 'Unknown KPI'}</td>
                      <td className="p-2">{r.periodLabel}</td>
                      <td className="p-2">{r.value.toLocaleString()} {r.unit}</td>
                      <td className="p-2">{r.target ?? '--'}</td>
                      <td className="p-2"><span className="px-2 py-1 rounded bg-slate-800 text-xs">{SOURCE_BADGES[r.source]}</span></td>
                      <td className="p-2 text-right">
                        <button disabled={!canEdit} onClick={() => openRecordForm(r)} className="p-2 text-slate-400 hover:text-white disabled:opacity-50"><Pencil size={14} /></button>
                        <button disabled={!canEdit} onClick={() => deleteKpiRecord(r.id)} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'channels' && <LegacyCrud title="Channel metrics" data={kpiChannelData} onAdd={addKpiChannel} onEdit={editKpiChannel} onDelete={deleteKpiChannel} canEdit={canEdit} kind="channel" />}
      {activeTab === 'timeseries' && <LegacyCrud title="Time-series metrics" data={kpiTimeSeriesData} onAdd={addKpiTimeSeries} onEdit={editKpiTimeSeries} onDelete={deleteKpiTimeSeries} canEdit={canEdit} kind="timeseries" />}
      {activeTab === 'sentiment' && <LegacyCrud title="Sentiment metrics" data={kpiSentimentData} onAdd={addKpiSentiment} onEdit={editKpiSentiment} onDelete={deleteKpiSentiment} canEdit={canEdit} kind="sentiment" />}
    </div>
  );
}

function LegacyCrud({ title, data, onAdd, onEdit, onDelete, canEdit, kind }: {
  title: string;
  data: Array<KPIChannelEntry | KPITimeSeriesEntry | KPISentimentEntry>;
  onAdd: (entry: KPIChannelEntry | KPITimeSeriesEntry | KPISentimentEntry) => void;
  onEdit: (id: string, updates: Partial<KPIChannelEntry | KPITimeSeriesEntry | KPISentimentEntry>) => void;
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
          <textarea value={jsonValue} onChange={e => setJsonValue(e.target.value)} rows={10} className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono" placeholder='{"field":"value"}' />
          <button disabled={!canEdit} onClick={save} className="mt-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50">Save</button>
        </div>
      )}
    </div>
  );
}
