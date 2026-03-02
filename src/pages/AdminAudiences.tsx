import React, { useState } from 'react';
import { Users, Plus, Pencil, Archive, RotateCcw, X, Check, AlertTriangle, Building2, Globe, Stethoscope, UserCheck, Handshake } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { EditableAudience, AudienceType } from '../types';

const typeIcons: Record<AudienceType, React.ReactNode> = {
  internal: <Building2 className="w-4 h-4" />,
  external: <Globe className="w-4 h-4" />,
  clinical: <Stethoscope className="w-4 h-4" />,
  public: <Users className="w-4 h-4" />,
  provider: <UserCheck className="w-4 h-4" />,
  partner: <Handshake className="w-4 h-4" />,
};

const typeColors: Record<AudienceType, string> = {
  internal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  external: 'bg-green-500/20 text-green-400 border-green-500/30',
  clinical: 'bg-red-500/20 text-red-400 border-red-500/30',
  public: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  provider: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  partner: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

const typeDescriptions: Record<AudienceType, string> = {
  internal: 'Staff and internal stakeholders',
  external: 'External individuals and organisations',
  clinical: 'Healthcare professionals and clinical staff',
  public: 'General public and service users',
  provider: 'Care providers and service delivery partners',
  partner: 'Partner organisations and collaborators',
};

export default function AdminAudiences() {
  const { permissions, editableAudiences, addEditableAudience, updateEditableAudience, archiveEditableAudience, restoreEditableAudience } = useApp();
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingAudience, setEditingAudience] = useState<EditableAudience | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<AudienceType | 'all'>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<AudienceType>('external');
  const [formError, setFormError] = useState('');

  const filteredAudiences = editableAudiences.filter(audience => {
    if (filter === 'active' && !audience.isActive) return false;
    if (filter === 'archived' && audience.isActive) return false;
    if (typeFilter !== 'all' && audience.type !== typeFilter) return false;
    return true;
  });

  const activeCount = editableAudiences.filter(a => a.isActive).length;
  const archivedCount = editableAudiences.filter(a => !a.isActive).length;

  const openCreate = () => {
    setEditingAudience(null);
    setFormName('');
    setFormDescription('');
    setFormType('external');
    setFormError('');
    setShowSlideOver(true);
  };

  const openEdit = (audience: EditableAudience) => {
    setEditingAudience(audience);
    setFormName(audience.name);
    setFormDescription(audience.description || '');
    setFormType(audience.type);
    setFormError('');
    setShowSlideOver(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setFormError('Audience name is required');
      return;
    }

    if (editingAudience) {
      updateEditableAudience(editingAudience.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        type: formType,
      });
    } else {
      const newAudience: EditableAudience = {
        id: `ea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        type: formType,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addEditableAudience(newAudience);
    }

    setShowSlideOver(false);
  };

  if (!permissions.canManageUsers) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-400">Only administrators can manage audiences.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            Audience Management
          </h1>
          <p className="text-gray-400 mt-1">Create and manage target audiences for the Ideation Engine</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Audience
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Total Audiences</div>
          <div className="text-2xl font-bold">{editableAudiences.length}</div>
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
          <div className="text-sm text-gray-400">Types</div>
          <div className="text-2xl font-bold">6</div>
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

        <div className="flex flex-wrap rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
          {(['all', 'internal', 'external', 'clinical', 'public', 'provider', 'partner'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                typeFilter === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Audience List */}
      <div className="space-y-3">
        {filteredAudiences.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No audiences found matching your filters.
          </div>
        ) : (
          filteredAudiences.map(audience => (
            <div
              key={audience.id}
              className={`p-4 rounded-xl border transition-colors ${
                audience.isActive
                  ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                  : 'bg-gray-900/50 border-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[audience.type]}`}>
                    {typeIcons[audience.type]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{audience.name}</h3>
                      {!audience.isActive && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                          Archived
                        </span>
                      )}
                    </div>
                    {audience.description && (
                      <p className="text-sm text-gray-400 mt-1">{audience.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded border ${typeColors[audience.type]}`}>
                        {audience.type}
                      </span>
                      <span>Created {new Date(audience.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(audience)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  {audience.isActive ? (
                    <button
                      onClick={() => archiveEditableAudience(audience.id)}
                      className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4 text-gray-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => restoreEditableAudience(audience.id)}
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
                  {editingAudience ? 'Edit Audience' : 'Add Audience'}
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
                    placeholder="e.g., Healthcare Professionals"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Describe this audience segment..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['internal', 'external', 'clinical', 'public', 'provider', 'partner'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setFormType(type)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          formType === type
                            ? `${typeColors[type]} border-2`
                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {typeIcons[type]}
                          <span className="capitalize font-medium">{type}</span>
                        </div>
                        <p className="text-xs text-gray-500">{typeDescriptions[type]}</p>
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {editingAudience ? 'Save Changes' : 'Create Audience'}
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
