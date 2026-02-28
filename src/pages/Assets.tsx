import { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { Asset } from '../types';
import {
  Search, Upload, Grid3X3, List, Image, Video, FileText, BookOpen,
  Tag, Clock, User, Download, Eye, Sparkles, FolderOpen, Plus,
  X, Link2, Pencil, Trash2, ExternalLink, Globe, Check, AlertCircle
} from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  image: { icon: <Image size={20} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  video: { icon: <Video size={20} />, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  document: { icon: <FileText size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  template: { icon: <Grid3X3 size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  guideline: { icon: <BookOpen size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  link: { icon: <Globe size={20} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

const colorPalettes = [
  'from-indigo-500/20 to-purple-500/20', 'from-emerald-500/20 to-teal-500/20',
  'from-rose-500/20 to-pink-500/20', 'from-amber-500/20 to-orange-500/20',
  'from-cyan-500/20 to-blue-500/20', 'from-violet-500/20 to-fuchsia-500/20',
  'from-lime-500/20 to-green-500/20', 'from-red-500/20 to-rose-500/20',
];

const AI_TAG_DICTIONARY: Record<string, string[]> = {
  image: ['visual', 'graphic', 'photography', 'brand imagery'],
  video: ['multimedia', 'motion', 'storytelling', 'engagement'],
  document: ['documentation', 'reference', 'text content', 'formal'],
  template: ['reusable', 'design system', 'layout', 'framework'],
  guideline: ['standards', 'compliance', 'best practice', 'governance'],
  link: ['external resource', 'web reference', 'online tool', 'bookmark'],
};

function generateAITags(name: string, type: string, tags: string[], description?: string): string[] {
  const aiTags: string[] = [...(AI_TAG_DICTIONARY[type] || []).slice(0, 2)];
  const text = `${name} ${tags.join(' ')} ${description || ''}`.toLowerCase();
  if (text.includes('nhs') || text.includes('health')) aiTags.push('healthcare');
  if (text.includes('social') || text.includes('instagram') || text.includes('twitter') || text.includes('linkedin')) aiTags.push('social media');
  if (text.includes('brand')) aiTags.push('brand identity');
  if (text.includes('recruit') || text.includes('career') || text.includes('job')) aiTags.push('recruitment');
  if (text.includes('report') || text.includes('analytics') || text.includes('data')) aiTags.push('analytics');
  if (text.includes('event') || text.includes('conference')) aiTags.push('events');
  if (text.includes('template') || text.includes('toolkit')) aiTags.push('resource kit');
  if (text.includes('video') || text.includes('film')) aiTags.push('video content');
  if (text.includes('pdf') || text.includes('doc')) aiTags.push('document');
  return [...new Set(aiTags)].slice(0, 5);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

type ModalMode = 'upload-file' | 'add-link' | 'edit' | null;

export default function Assets() {
  const { assets, addAsset, editAsset, deleteAsset, currentUser, permissions, campaigns, activeWorkspaceId, workspacesList } = useApp();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<Asset['type']>('document');
  const [formTags, setFormTags] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formCampaignId, setFormCampaignId] = useState('');
  const [formWorkspace, setFormWorkspace] = useState(activeWorkspaceId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter by active workspace
  const workspaceFiltered = activeWorkspaceId
    ? assets.filter(a => a.workspace === activeWorkspaceId)
    : assets;

  const filtered = workspaceFiltered.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) ||
     a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
     a.aiTags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
     (a.description || '').toLowerCase().includes(search.toLowerCase()) ||
     (a.linkUrl || '').toLowerCase().includes(search.toLowerCase()))
  );

  const selected = assets.find(a => a.id === selectedAsset);

  const typeCounts: Record<string, number> = { all: workspaceFiltered.length };
  for (const a of workspaceFiltered) {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const resetForm = () => {
    setFormName(''); setFormType('document'); setFormTags(''); setFormDescription('');
    setFormLinkUrl(''); setFormCampaignId(''); setFormWorkspace(activeWorkspaceId || '');
    setSelectedFiles([]); setUploadProgress(null);
  };

  const openUploadFile = () => { resetForm(); setModal('upload-file'); };
  const openAddLink = () => { resetForm(); setFormType('link'); setModal('add-link'); };
  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormType(asset.type);
    setFormTags(asset.tags.join(', '));
    setFormDescription(asset.description || '');
    setFormLinkUrl(asset.linkUrl || '');
    setFormCampaignId(asset.campaignId || '');
    setFormWorkspace(asset.workspace || '');
    setModal('edit');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      if (files.length === 1 && !formName) {
        setFormName(files[0].name);
        // Auto-detect type
        const ext = files[0].name.split('.').pop()?.toLowerCase() || '';
        if (['jpg','jpeg','png','gif','svg','webp','bmp'].includes(ext)) setFormType('image');
        else if (['mp4','mov','avi','webm','mkv'].includes(ext)) setFormType('video');
        else if (['pdf','doc','docx','xls','xlsx','pptx','txt','csv'].includes(ext)) setFormType('document');
        else if (['zip','rar','7z'].includes(ext)) setFormType('template');
        else setFormType('document');
      }
    }
  };

  const handleSubmitUpload = () => {
    if (modal === 'upload-file' && selectedFiles.length === 0) return;
    if (modal === 'add-link' && !formLinkUrl.trim()) return;
    if (!formName.trim()) return;

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 30 + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(null);

      const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
      const isLink = modal === 'add-link';

      if (modal === 'upload-file') {
        // Create one asset per file
        selectedFiles.forEach((file, idx) => {
          const name = selectedFiles.length === 1 ? formName.trim() : file.name;
          const newAsset: Asset = {
            id: `as-${Date.now()}-${idx}`,
            name,
            type: formType,
            source: 'file',
            url: URL.createObjectURL(file),
            thumbnail: '',
            tags,
            campaignId: formCampaignId || undefined,
            uploadedBy: currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role, avatar: currentUser.avatar, department: currentUser.department } : { id: 'u1', name: 'Admin User', email: '', role: 'admin', avatar: 'AU', department: '' },
            createdAt: new Date().toISOString().split('T')[0],
            size: formatFileSize(file.size),
            aiTags: generateAITags(name, formType, tags, formDescription),
            workspace: formWorkspace || undefined,
            description: formDescription || undefined,
          };
          addAsset(newAsset);
        });
        showSuccess(`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded successfully!`);
      } else if (isLink) {
        const newAsset: Asset = {
          id: `as-${Date.now()}`,
          name: formName.trim(),
          type: 'link',
          source: 'link',
          url: '#',
          linkUrl: formLinkUrl.trim(),
          thumbnail: '',
          tags,
          campaignId: formCampaignId || undefined,
          uploadedBy: currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role, avatar: currentUser.avatar, department: currentUser.department } : { id: 'u1', name: 'Admin User', email: '', role: 'admin', avatar: 'AU', department: '' },
          createdAt: new Date().toISOString().split('T')[0],
          size: '-',
          aiTags: generateAITags(formName.trim(), 'link', tags, formDescription),
          workspace: formWorkspace || undefined,
          description: formDescription || undefined,
        };
        addAsset(newAsset);
        showSuccess('Link added successfully!');
      }

      setModal(null);
      resetForm();
    }, 1000);
  };

  const handleSaveEdit = () => {
    if (!editingAsset || !formName.trim()) return;
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    editAsset(editingAsset.id, {
      name: formName.trim(),
      type: formType,
      tags,
      description: formDescription || undefined,
      linkUrl: formLinkUrl || undefined,
      campaignId: formCampaignId || undefined,
      workspace: formWorkspace || undefined,
      aiTags: generateAITags(formName.trim(), formType, tags, formDescription),
    });
    showSuccess(`"${formName.trim()}" updated!`);
    setModal(null);
    setEditingAsset(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const asset = assets.find(a => a.id === id);
    deleteAsset(id);
    if (selectedAsset === id) setSelectedAsset(null);
    setDeleteConfirm(null);
    showSuccess(`"${asset?.name}" deleted.`);
  };

  const canEdit = permissions.canEditCampaign;
  const canDelete = permissions.canDeleteCampaign;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Success */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-emerald-600/10 border border-emerald-600/20 rounded-xl flex items-center gap-2 animate-fade-in">
          <Check size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-400 font-medium">{successMsg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-sm text-slate-400 mt-1">Central repository with AI-powered categorisation — upload files or save links to websites</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={openAddLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">
              <Link2 size={16} /> Add Link
            </button>
            <button onClick={openUploadFile}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
              <Upload size={16} /> Upload Files
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(typeCounts).map(([type, count]) => (
          <button key={type} onClick={() => setTypeFilter(type)}
            className={`px-4 py-2.5 rounded-xl text-center transition-all flex items-center gap-2 ${typeFilter === type ? 'bg-brand-600/20 border border-brand-500/30' : 'bg-slate-900 border border-slate-800 hover:border-slate-700'}`}>
            {type !== 'all' && typeConfig[type] && <span className={typeConfig[type].color}>{typeConfig[type].icon}</span>}
            <span className="text-sm font-bold">{count}</span>
            <span className="text-[10px] text-slate-500 capitalize">{type === 'all' ? 'All' : type + 's'}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name, tag, URL, or description..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}><Grid3X3 size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}><List size={16} /></button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
              <FolderOpen size={48} className="text-slate-700 mb-4" />
              <p className="text-lg font-semibold text-slate-400 mb-2">No assets found</p>
              <p className="text-sm text-slate-500 mb-6">
                {search ? 'Try a different search term' : 'Upload files or add links to get started'}
              </p>
              {canEdit && (
                <div className="flex gap-2">
                  <button onClick={openAddLink} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium"><Link2 size={14} /> Add Link</button>
                  <button onClick={openUploadFile} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold"><Upload size={14} /> Upload</button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((asset, i) => {
                const config = typeConfig[asset.type] || typeConfig.document;
                return (
                  <div key={asset.id}
                    onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                    className={`bg-slate-900 border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg group relative ${selectedAsset === asset.id ? 'border-brand-500/50 ring-2 ring-brand-500/20' : 'border-slate-800 hover:border-slate-700'}`}>
                    {/* Source badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${asset.source === 'link' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700/80 text-slate-300'}`}>
                        {asset.source === 'link' ? '🔗 Link' : '📁 File'}
                      </span>
                    </div>
                    {/* Actions */}
                    {canEdit && (
                      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }}
                          className="p-1.5 rounded-lg bg-slate-800/80 backdrop-blur text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Pencil size={12} /></button>
                        {canDelete && (
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(asset.id); }}
                            className="p-1.5 rounded-lg bg-slate-800/80 backdrop-blur text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-colors"><Trash2 size={12} /></button>
                        )}
                      </div>
                    )}
                    <div className={`h-36 bg-gradient-to-br ${colorPalettes[i % colorPalettes.length]} flex items-center justify-center`}>
                      <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center ${config.color}`}>{config.icon}</div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium truncate mb-1">{asset.name}</h3>
                      {asset.description && <p className="text-[10px] text-slate-500 truncate mb-2">{asset.description}</p>}
                      {asset.source === 'link' && asset.linkUrl && (
                        <p className="text-[10px] text-cyan-400 truncate mb-2 flex items-center gap-1"><Globe size={9} />{asset.linkUrl}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><Clock size={10} />{asset.createdAt}</span>
                        {asset.source === 'file' && <span>{asset.size}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {asset.aiTags.slice(0, 3).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-brand-500/10 text-brand-400 rounded-md">
                            <Sparkles size={8} />{tag}
                          </span>
                        ))}
                        {asset.aiTags.length > 3 && <span className="text-[9px] text-slate-600">+{asset.aiTags.length - 3}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
              {filtered.map(asset => {
                const config = typeConfig[asset.type] || typeConfig.document;
                return (
                  <div key={asset.id}
                    onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                    className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors group ${selectedAsset === asset.id ? 'bg-slate-800/30' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center ${config.color} flex-shrink-0`}>{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{asset.name}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${asset.source === 'link' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                          {asset.source === 'link' ? 'LINK' : 'FILE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                        <span className="capitalize">{asset.type}</span>
                        {asset.source === 'file' && <span>{asset.size}</span>}
                        {asset.linkUrl && <span className="text-cyan-400 truncate max-w-[200px]">{asset.linkUrl}</span>}
                        <span className="flex items-center gap-1"><User size={10} />{asset.uploadedBy.name}</span>
                        <span>{asset.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {asset.aiTags.slice(0, 2).map(tag => (
                        <span key={tag} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-brand-500/10 text-brand-400 rounded-md">
                          <Sparkles size={8} />{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.source === 'link' && asset.linkUrl && (
                        <button onClick={(e) => { e.stopPropagation(); window.open(asset.linkUrl, '_blank'); }}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-cyan-400 transition-colors" title="Open link"><ExternalLink size={14} /></button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"><Eye size={14} /></button>
                      {asset.source === 'file' && <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"><Download size={14} /></button>}
                      {canEdit && (
                        <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"><Pencil size={14} /></button>
                      )}
                      {canDelete && (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(asset.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-600/10 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="hidden lg:block w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit sticky top-8 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Asset Details</h3>
              <button onClick={() => setSelectedAsset(null)} className="text-slate-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className={`h-40 rounded-xl bg-gradient-to-br ${colorPalettes[0]} flex items-center justify-center mb-4`}>
              <div className={`w-16 h-16 rounded-2xl ${(typeConfig[selected.type] || typeConfig.document).bg} flex items-center justify-center ${(typeConfig[selected.type] || typeConfig.document).color}`}>
                {(typeConfig[selected.type] || typeConfig.document).icon}
              </div>
            </div>
            <h4 className="text-sm font-medium mb-1">{selected.name}</h4>
            {selected.description && <p className="text-[10px] text-slate-500 mb-3">{selected.description}</p>}

            {/* Link URL */}
            {selected.source === 'link' && selected.linkUrl && (
              <a href={selected.linkUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mb-3 hover:bg-cyan-500/20 transition-colors group">
                <Globe size={14} className="text-cyan-400" />
                <span className="text-xs text-cyan-400 truncate flex-1">{selected.linkUrl}</span>
                <ExternalLink size={12} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="capitalize flex items-center gap-1">{selected.source === 'link' ? '🔗' : '📁'} {selected.type}</span></div>
              {selected.source === 'file' && <div className="flex justify-between"><span className="text-slate-500">Size</span><span>{selected.size}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Uploaded</span><span>{selected.createdAt}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">By</span><span>{selected.uploadedBy.name}</span></div>
              {selected.workspace && (
                <div className="flex justify-between"><span className="text-slate-500">Workspace</span><span>{workspacesList.find(w => w.id === selected.workspace)?.name || selected.workspace}</span></div>
              )}
              {selected.campaignId && (
                <div className="flex justify-between"><span className="text-slate-500">Campaign</span><span className="text-brand-400">{campaigns.find(c => c.id === selected.campaignId)?.title || selected.campaignId}</span></div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-1 mb-2">
                <Tag size={12} className="text-slate-500" />
                <span className="text-xs font-semibold text-slate-500">Manual Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selected.tags.length > 0 ? selected.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">{t}</span>
                )) : <span className="text-[10px] text-slate-600">No tags</span>}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-1 mb-2">
                <Sparkles size={12} className="text-brand-400" />
                <span className="text-xs font-semibold text-brand-400">AI Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selected.aiTags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {selected.source === 'link' && selected.linkUrl ? (
                <a href={selected.linkUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold transition-colors">
                  <ExternalLink size={12} /> Open Link
                </a>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold transition-colors"><Download size={12} /> Download</button>
              )}
              {canEdit && (
                <button onClick={() => openEdit(selected)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors"><Pencil size={12} /> Edit</button>
              )}
              {canDelete && (
                <button onClick={() => setDeleteConfirm(selected.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-xs font-medium transition-colors"><Trash2 size={12} /></button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload File / Add Link Modal */}
      {(modal === 'upload-file' || modal === 'add-link') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setModal(null); resetForm(); }} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {modal === 'upload-file' ? <><Upload size={20} className="text-brand-400" /> Upload Files</> : <><Link2 size={20} className="text-cyan-400" /> Add Link</>}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {modal === 'upload-file' ? 'Upload files from your computer. AI will automatically tag them.' : 'Save a link to an external website, tool, or resource.'}
                </p>
              </div>
              <button onClick={() => { setModal(null); resetForm(); }} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tab switcher */}
              <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                <button onClick={() => { setModal('upload-file'); setFormType('document'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors ${modal === 'upload-file' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <Upload size={14} /> Upload File
                </button>
                <button onClick={() => { setModal('add-link'); setFormType('link'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors ${modal === 'add-link' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <Link2 size={14} /> Add Link
                </button>
              </div>

              {/* File picker */}
              {modal === 'upload-file' && (
                <div>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-xl p-8 text-center transition-colors hover:bg-brand-500/5 group">
                    <Upload size={32} className="text-slate-600 group-hover:text-brand-400 mx-auto mb-3 transition-colors" />
                    <p className="text-sm font-semibold text-slate-400 group-hover:text-white transition-colors">Click to select files</p>
                    <p className="text-[10px] text-slate-600 mt-1">or drag and drop (supports all file types)</p>
                  </button>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-xl">
                          <FileText size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{f.name}</p>
                            <p className="text-[10px] text-slate-500">{formatFileSize(f.size)}</p>
                          </div>
                          <button onClick={() => setSelectedFiles(prev => prev.filter((_, j) => j !== i))}
                            className="text-slate-500 hover:text-red-400"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Link URL */}
              {modal === 'add-link' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Website URL *</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="url" value={formLinkUrl} onChange={e => setFormLinkUrl(e.target.value)}
                      placeholder="https://example.com/resource"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder={modal === 'add-link' ? 'e.g., NHS Brand Guidelines Website' : 'e.g., Campaign Hero Banner.png'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description (optional)</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  placeholder="What is this asset for?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 h-16 resize-none" />
              </div>

              {/* Type (for file uploads) */}
              {modal === 'upload-file' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Asset Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(['image', 'video', 'document', 'template', 'guideline'] as const).map(t => (
                      <button key={t} onClick={() => setFormType(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formType === t ? 'bg-brand-600/20 text-brand-400 ring-1 ring-brand-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {typeConfig[t].icon}
                        <span className="capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Tags (comma separated)</label>
                <input type="text" value={formTags} onChange={e => setFormTags(e.target.value)}
                  placeholder="e.g., brand, social, campaign"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>

              {/* Campaign link */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Link to Campaign (optional)</label>
                <select value={formCampaignId} onChange={e => setFormCampaignId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="">No campaign</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Workspace */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Workspace</label>
                <select value={formWorkspace} onChange={e => setFormWorkspace(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="">No workspace</option>
                  {workspacesList.map(ws => <option key={ws.id} value={ws.id}>{ws.icon} {ws.name}</option>)}
                </select>
              </div>

              {/* AI Tag Preview */}
              {formName && (
                <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-brand-400" />
                    <span className="text-[10px] font-semibold text-brand-400">AI-Generated Tags Preview</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {generateAITags(formName, modal === 'add-link' ? 'link' : formType, formTags.split(',').map(t => t.trim()).filter(Boolean), formDescription).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload progress */}
              {uploadProgress !== null && (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{uploadProgress >= 100 ? 'Processing...' : 'Uploading...'}</span>
                    <span>{Math.min(100, Math.round(uploadProgress))}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, uploadProgress)}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button onClick={() => { setModal(null); resetForm(); }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSubmitUpload}
                disabled={(!formName.trim()) || (modal === 'upload-file' && selectedFiles.length === 0) || (modal === 'add-link' && !formLinkUrl.trim()) || uploadProgress !== null}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {modal === 'upload-file' ? <><Upload size={14} /> Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'File'}</> : <><Plus size={14} /> Add Link</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && editingAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setModal(null); setEditingAsset(null); resetForm(); }} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2"><Pencil size={18} className="text-brand-400" /> Edit Asset</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Name</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              {editingAsset.source === 'link' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">URL</label>
                  <input type="url" value={formLinkUrl} onChange={e => setFormLinkUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 h-16 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['image', 'video', 'document', 'template', 'guideline', 'link'] as const).map(t => (
                    <button key={t} onClick={() => setFormType(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${formType === t ? 'bg-brand-600/20 text-brand-400 ring-1 ring-brand-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Tags</label>
                <input type="text" value={formTags} onChange={e => setFormTags(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Campaign</label>
                <select value={formCampaignId} onChange={e => setFormCampaignId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="">No campaign</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Workspace</label>
                <select value={formWorkspace} onChange={e => setFormWorkspace(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="">No workspace</option>
                  {workspacesList.map(ws => <option key={ws.id} value={ws.id}>{ws.icon} {ws.name}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button onClick={() => { setModal(null); setEditingAsset(null); resetForm(); }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleSaveEdit} disabled={!formName.trim()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-xl text-sm font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Asset?</h3>
            <p className="text-sm text-slate-400 mb-1">
              <span className="text-white font-semibold">"{assets.find(a => a.id === deleteConfirm)?.name}"</span>
            </p>
            <p className="text-xs text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
