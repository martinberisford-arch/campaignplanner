import React, { useState } from 'react';
import { Target, Plus, Pencil, Archive, RotateCcw, X, Check, AlertTriangle, TrendingUp, Users, MousePointerClick, Heart } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { EditableKPI, KPICategory } from '../types';

const categoryIcons: Record<KPICategory, React.ReactNode> = {
  awareness: <TrendingUp className="w-4 h-4" />,
  engagement: <MousePointerClick className="w-4 h-4" />,
  conversion: <Users className="w-4 h-4" />,
  retention: <Heart className="w-4 h-4" />,
};

const categoryColors: Record<KPICategory, string> = {
  awareness: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  engagement: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  conversion: 'bg-green-500/20 text-green-400 border-green-500/30',
  retention: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function AdminKpis() {
  const { permissions, editableKpis, addEditableKpi, updateEditableKpi, archiveEditableKpi, restoreEditableKpi } = useApp();
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingKpi, setEditingKpi] = useState<EditableKPI | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<KPICategory | 'all'>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<KPICategory>('awareness');
  const [formError, setFormError] = useState('');

  const filteredKpis = editableKpis.filter(kpi => {
    if (filter === 'active' && !kpi.isActive) return false;
    if (filter === 'archived' && kpi.isActive) return false;
    if (categoryFilter !== 'all' && kpi.category !== categoryFilter) return false;
    return true;
  });

  const activeCount = editableKpis.filter(k => k.isActive).length;
  const archivedCount = editableKpis.filter(k => !k.isActive).length;

  const openCreate = () => {
    setEditingKpi(null);
    setFormName('');
    setFormDescription('');
    setFormCategory('awareness');
    setFormError('');
    setShowSlideOver(true);
  };

  const openEdit = (kpi: EditableKPI) => {
    setEditingKpi(kpi);
    setFormName(kpi.name);
    setFormDescription(kpi.description || '');
    setFormCategory(kpi.category);
    setFormError('');
    setShowSlideOver(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setFormError('KPI name is required');
      return;
    }

    if (editingKpi) {
      updateEditableKpi(editingKpi.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
      });
    } else {
      const newKpi: EditableKPI = {
        id: `ek-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addEditableKpi(newKpi);
    }

    setShowSlideOver(false);
  };

  if (!permissions.canManageUsers) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-400">Only administrators can manage KPIs.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            KPI Management
          </h1>
          <p className="text-gray-400 mt-1">Create and manage KPIs used in the Ideation Engine</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add KPI
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Total KPIs</div>
          <div className="text-2xl font-bold">{editableKpis.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Active</div>
          <div className="text-2xl font-bold text-green-400">{activeCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Archived</div>
          <div className="text-2xl font-bold text-gray-500">{archivedCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Categories</div>
          <div className="text-2xl font-bold">4</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
          {(['all', 'active', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === f ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
          {(['all', 'awareness', 'engagement', 'conversion', 'retention'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                categoryFilter === c ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI List */}
      <div className="space-y-3">
        {filteredKpis.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No KPIs found matching your filters.
          </div>
        ) : (
          filteredKpis.map(kpi => (
            <div
              key={kpi.id}
              className={`p-4 rounded-xl border transition-colors ${
                kpi.isActive
                  ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                  : 'bg-gray-900/50 border-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${categoryColors[kpi.category]}`}>
                    {categoryIcons[kpi.category]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{kpi.name}</h3>
                      {!kpi.isActive && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                          Archived
                        </span>
                      )}
                    </div>
                    {kpi.description && (
                      <p className="text-sm text-gray-400 mt-1">{kpi.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded border ${categoryColors[kpi.category]}`}>
                        {kpi.category}
                      </span>
                      <span>Created {new Date(kpi.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(kpi)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  {kpi.isActive ? (
                    <button
                      onClick={() => archiveEditableKpi(kpi.id)}
                      className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4 text-gray-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => restoreEditableKpi(kpi.id)}
                      className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide-over panel */}
      {showSlideOver && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSlideOver(false)}
          />
          <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-y-auto animate-slideIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingKpi ? 'Edit KPI' : 'Add KPI'}
                </h2>
                <button
                  onClick={() => setShowSlideOver(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g., Website Traffic"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Describe what this KPI measures..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['awareness', 'engagement', 'conversion', 'retention'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          formCategory === cat
                            ? `${categoryColors[cat]} border-2`
                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {categoryIcons[cat]}
                          <span className="capitalize">{cat}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSlideOver(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {editingKpi ? 'Save Changes' : 'Create KPI'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
