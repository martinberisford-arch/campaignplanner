import { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  Search, Upload, Grid3X3, List, Image, Video, FileText, BookOpen,
  Tag, Clock, User, Download, Eye, MoreVertical, Sparkles, FolderOpen
} from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  image: { icon: <Image size={20} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  video: { icon: <Video size={20} />, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  document: { icon: <FileText size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  template: { icon: <Grid3X3 size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  guideline: { icon: <BookOpen size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const colorPalettes = [
  'from-indigo-500/20 to-purple-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-rose-500/20 to-pink-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-cyan-500/20 to-blue-500/20',
  'from-violet-500/20 to-fuchsia-500/20',
  'from-lime-500/20 to-green-500/20',
  'from-red-500/20 to-rose-500/20',
];

export default function Assets() {
  const { assets } = useApp();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const filtered = assets.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) ||
     a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
     a.aiTags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const selected = assets.find(a => a.id === selectedAsset);

  const typeCounts = {
    all: assets.length,
    image: assets.filter(a => a.type === 'image').length,
    video: assets.filter(a => a.type === 'video').length,
    document: assets.filter(a => a.type === 'document').length,
    template: assets.filter(a => a.type === 'template').length,
    guideline: assets.filter(a => a.type === 'guideline').length,
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-sm text-slate-400 mt-1">Central repository with AI-powered categorisation and tagging</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
          <Upload size={16} /> Upload Assets
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {Object.entries(typeCounts).map(([type, count]) => (
          <button key={type} onClick={() => setTypeFilter(type)}
            className={`p-3 rounded-xl text-center transition-all ${typeFilter === type ? 'bg-brand-600/20 border border-brand-500/30' : 'bg-slate-900 border border-slate-800 hover:border-slate-700'}`}
          >
            <p className="text-lg font-bold">{count}</p>
            <p className="text-[10px] text-slate-500 capitalize">{type === 'all' ? 'All Assets' : type + 's'}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name, tag, or AI tag..." value={search} onChange={e => setSearch(e.target.value)}
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
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((asset, i) => {
                const config = typeConfig[asset.type];
                return (
                  <div key={asset.id}
                    onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                    className={`bg-slate-900 border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${selectedAsset === asset.id ? 'border-brand-500/50 ring-2 ring-brand-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    {/* Preview */}
                    <div className={`h-36 bg-gradient-to-br ${colorPalettes[i % colorPalettes.length]} flex items-center justify-center`}>
                      <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center ${config.color}`}>
                        {config.icon}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium truncate flex-1">{asset.name}</h3>
                        <MoreVertical size={14} className="text-slate-600 flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><Clock size={10} />{asset.createdAt}</span>
                        <span>{asset.size}</span>
                      </div>
                      {/* AI Tags */}
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
                const config = typeConfig[asset.type];
                return (
                  <div key={asset.id}
                    onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                    className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors ${selectedAsset === asset.id ? 'bg-slate-800/30' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center ${config.color} flex-shrink-0`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                        <span className="capitalize">{asset.type}</span>
                        <span>{asset.size}</span>
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
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"><Eye size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"><Download size={14} /></button>
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
            <h3 className="font-semibold mb-4">Asset Details</h3>
            <div className={`h-40 rounded-xl bg-gradient-to-br ${colorPalettes[0]} flex items-center justify-center mb-4`}>
              <div className={`w-16 h-16 rounded-2xl ${typeConfig[selected.type].bg} flex items-center justify-center ${typeConfig[selected.type].color}`}>
                {typeConfig[selected.type].icon}
              </div>
            </div>
            <h4 className="text-sm font-medium mb-3">{selected.name}</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="capitalize">{selected.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Size</span><span>{selected.size}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Uploaded</span><span>{selected.createdAt}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">By</span><span>{selected.uploadedBy.name}</span></div>
              {selected.campaignId && <div className="flex justify-between"><span className="text-slate-500">Campaign</span><span className="text-brand-400">{selected.campaignId}</span></div>}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-1 mb-2">
                <Tag size={12} className="text-slate-500" />
                <span className="text-xs font-semibold text-slate-500">Manual Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">{t}</span>
                ))}
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
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold transition-colors"><Download size={12} /> Download</button>
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors"><FolderOpen size={12} /> Open</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
