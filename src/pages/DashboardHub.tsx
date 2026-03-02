import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { Tool, ViewType } from '../types';
import BlurFade from '../components/ui/BlurFade';
import DotPattern from '../components/ui/DotPattern';
import AIInput from '../components/ui/AIInput';
import { GlowingEffect } from '../components/ui/GlowingEffect';
import ChatComponent from '../components/ui/ChatInterface';
import type { ChatConfig, UiConfig } from '../components/ui/ChatInterface';
import {
  FolderKanban, Sparkles, Calendar, CheckCircle2, BarChart3, ImageIcon,
  Target, Lightbulb, TrendingUp, Settings, ExternalLink, CalendarDays,
  Palette,   Search, Filter, X, Plus, Pencil, Trash2, GripVertical,
  Eye, EyeOff, ArrowRight, Globe, Layers, Shield, MessageSquare,
  type LucideIcon
} from 'lucide-react';

// Map icon name strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  FolderKanban, Sparkles, Calendar, CheckCircle2, BarChart3, ImageIcon,
  Target, Lightbulb, TrendingUp, Settings, ExternalLink, CalendarDays,
  Palette, Globe, Layers, Shield, Search, Filter, Plus, ArrowRight,
};

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  core: { label: 'Core', color: 'text-brand-400', bg: 'bg-brand-500/10' },
  marketing: { label: 'Marketing', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  analytics: { label: 'Analytics', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  admin: { label: 'Admin', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  external: { label: 'External', color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

const BADGE_COLORS: Record<string, string> = {
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const ICON_GRADIENTS: Record<string, string> = {
  core: 'from-brand-500 to-violet-600',
  marketing: 'from-emerald-500 to-teal-600',
  analytics: 'from-amber-500 to-orange-600',
  admin: 'from-slate-500 to-slate-600',
  external: 'from-blue-500 to-cyan-600',
};

type FilterTab = 'all' | 'core' | 'marketing' | 'analytics' | 'admin' | 'external';

export default function DashboardHub() {
  const {
    tools, addTool, editTool, deleteTool, reorderTools,
    currentUser, setView, theme,
    campaigns, approvals, assets, aiCommandLog, addAiCommand,
    addNotification,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
  const [dragOverToolId, setDragOverToolId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const isDark = theme === 'dark';

  // Get dynamic metrics for tiles
  const getToolMetrics = useCallback((tool: Tool): { count?: number; label?: string } | null => {
    if (tool.route === 'campaigns') return { count: campaigns.length, label: 'campaigns' };
    if (tool.route === 'approvals') {
      const pending = approvals.filter(a => a.status === 'pending').length;
      return pending > 0 ? { count: pending, label: 'pending' } : null;
    }
    if (tool.route === 'assets') return { count: assets.length, label: 'assets' };
    return tool.toolMetrics ? { count: tool.toolMetrics.count, label: tool.toolMetrics.label } : null;
  }, [campaigns, approvals, assets]);

  // Filter and search
  const filteredTools = useMemo(() => {
    let result = tools
      .filter(t => t.isEnabled || isAdmin)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    if (activeFilter !== 'all') {
      result = result.filter(t => t.category === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.badge && t.badge.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tools, activeFilter, searchQuery, isAdmin]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.name?.split(' ')[0] || 'there';

  // Handle AI input
  const handleAICommand = (query: string) => {
    addAiCommand(query);
    const q = query.toLowerCase();
    if (q.includes('campaign') && (q.includes('create') || q.includes('new') || q.includes('plan'))) {
      setView('ai-brief');
    } else if (q.includes('brief') || q.includes('generate')) {
      setView('ai-brief');
    } else if (q.includes('kpi') || q.includes('performance') || q.includes('analytics') || q.includes('metric')) {
      setView('kpi');
    } else if (q.includes('calendar') || q.includes('schedule')) {
      setView('calendar');
    } else if (q.includes('approval') || q.includes('review')) {
      setView('approvals');
    } else if (q.includes('idea') || q.includes('growth') || q.includes('marketing idea')) {
      setView('mkt-ideas');
    } else if (q.includes('strategy')) {
      setView('mkt-strategy');
    } else if (q.includes('asset') || q.includes('file') || q.includes('document')) {
      setView('assets');
    } else if (q.includes('setting') || q.includes('team') || q.includes('integration')) {
      setView('settings');
    } else {
      setView('ai-brief');
    }
    addNotification({
      title: 'AI Command Processed',
      message: `Navigating based on: "${query}"`,
      type: 'ai',
      icon: '🤖',
    });
  };

  // Handle tile click
  const handleTileClick = (tool: Tool) => {
    if (!tool.isEnabled && !isAdmin) return;
    if (tool.isExternal && tool.externalUrl) {
      window.open(tool.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (tool.route) {
      setView(tool.route);
    }
  };

  // Admin: drag and drop reorder
  const handleDragStart = (toolId: string) => {
    if (!isAdmin) return;
    setDraggedToolId(toolId);
  };

  const handleDragOver = (e: React.DragEvent, toolId: string) => {
    e.preventDefault();
    if (draggedToolId && draggedToolId !== toolId) {
      setDragOverToolId(toolId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedToolId || draggedToolId === targetId) {
      setDraggedToolId(null);
      setDragOverToolId(null);
      return;
    }
    const sorted = [...tools].sort((a, b) => a.displayOrder - b.displayOrder);
    const dragIdx = sorted.findIndex(t => t.id === draggedToolId);
    const dropIdx = sorted.findIndex(t => t.id === targetId);
    if (dragIdx === -1 || dropIdx === -1) return;
    const [moved] = sorted.splice(dragIdx, 1);
    sorted.splice(dropIdx, 0, moved);
    reorderTools(sorted);
    setDraggedToolId(null);
    setDragOverToolId(null);
  };

  const handleDragEnd = () => {
    setDraggedToolId(null);
    setDragOverToolId(null);
  };

  // Filter tabs
  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Tools', count: tools.filter(t => t.isEnabled || isAdmin).length },
    { id: 'core', label: 'Core', count: tools.filter(t => (t.isEnabled || isAdmin) && t.category === 'core').length },
    { id: 'marketing', label: 'Marketing', count: tools.filter(t => (t.isEnabled || isAdmin) && t.category === 'marketing').length },
    { id: 'analytics', label: 'Analytics', count: tools.filter(t => (t.isEnabled || isAdmin) && t.category === 'analytics').length },
    { id: 'external', label: 'External', count: tools.filter(t => (t.isEnabled || isAdmin) && t.category === 'external').length },
  ];

  return (
    <div className="relative min-h-full">
      {/* Dot pattern background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <DotPattern dotColor={isDark ? '#94a3b8' : '#64748b'} dotSize={1} gap={28} />
      </div>

      <div className="relative p-4 md:p-8 max-w-[1400px] mx-auto space-y-8">
        {/* ===== GREETING SECTION ===== */}
        <BlurFade delay={0} duration={0.5}>
          <div className="pt-2 md:pt-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {campaigns.filter(c => c.status === 'active' || c.status === 'planning').length} active campaigns
              {approvals.filter(a => a.status === 'pending').length > 0 &&
                ` · ${approvals.filter(a => a.status === 'pending').length} pending approvals`
              }
            </p>
          </div>
        </BlurFade>

        {/* ===== AI INPUT SECTION ===== */}
        <BlurFade delay={0.1} duration={0.5}>
          <div className="max-w-2xl">
            <AIInput
              onSubmit={handleAICommand}
              theme={theme}
              recentQueries={aiCommandLog.slice(0, 5)}
              placeholder="Ask AI anything — create campaigns, generate briefs, find stakeholders..."
            />
          </div>
        </BlurFade>

        {/* ===== INTERACTIVE DEMO SECTION ===== */}
        <BlurFade delay={0.15} duration={0.5}>
          <InteractiveDemo isDark={isDark} />
        </BlurFade>

        {/* ===== TOOLS SECTION ===== */}
        <BlurFade delay={0.2} duration={0.5}>
          <div className="space-y-4">
            {/* Section header with search and admin toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Marketing Tools</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} available
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className={`relative flex items-center rounded-xl border transition-colors ${
                  isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'
                }`}>
                  <Search size={14} className={`ml-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tools..."
                    className={`w-40 md:w-56 px-2 py-2 text-xs bg-transparent outline-none ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-gray-400'}`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1.5 mr-1 rounded-lg text-slate-500 hover:text-slate-300">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Admin button */}
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all btn-press ${
                      showAdminPanel
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                        : isDark
                          ? 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                          : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings size={14} />
                    {showAdminPanel ? 'Done Editing' : 'Manage Tools'}
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-1.5">
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === tab.id
                      ? isDark
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-white'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    activeFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Admin: Add Tool button */}
            {showAdminPanel && isAdmin && (
              <BlurFade delay={0} duration={0.3}>
                <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-between ${
                  isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-brand-400" />
                    <div>
                      <p className="text-xs font-semibold">Admin Mode</p>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        Drag tiles to reorder · Click edit to modify · Toggle visibility
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowCreateForm(true); setEditingTool(null); }}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold text-white transition-colors btn-press"
                  >
                    <Plus size={14} /> Add Tool
                  </button>
                </div>
              </BlurFade>
            )}

            {/* ===== TILE GRID ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTools.map((tool, i) => {
                const IconComponent = ICON_MAP[tool.icon] || Layers;
                const metrics = getToolMetrics(tool);
                const catInfo = CATEGORY_LABELS[tool.category] || CATEGORY_LABELS.core;
                const gradient = ICON_GRADIENTS[tool.category] || ICON_GRADIENTS.core;
                const isDragging = draggedToolId === tool.id;
                const isDragOver = dragOverToolId === tool.id;

                return (
                  <BlurFade key={tool.id} delay={0.05 * i} duration={0.35}>
                    <div
                      draggable={showAdminPanel && isAdmin}
                      onDragStart={() => handleDragStart(tool.id)}
                      onDragOver={(e) => handleDragOver(e, tool.id)}
                      onDrop={(e) => handleDrop(e, tool.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => !showAdminPanel && handleTileClick(tool)}
                      className={`group relative rounded-2xl border p-5 transition-all duration-200 ${
                        !tool.isEnabled ? 'opacity-50' : ''
                      } ${
                        isDragging ? 'opacity-40 scale-95' : ''
                      } ${
                        isDragOver ? isDark ? 'border-brand-500 bg-brand-500/5' : 'border-brand-400 bg-brand-50' : ''
                      } ${
                        showAdminPanel
                          ? isDark
                            ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                          : isDark
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 cursor-pointer'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/50 cursor-pointer'
                      }`}
                      style={showAdminPanel ? { cursor: isAdmin ? 'grab' : 'default' } : undefined}
                    >
                      {/* Glowing effect on hover */}
                      {!showAdminPanel && tool.isEnabled && (
                        <GlowingEffect
                          spread={40}
                          glow={true}
                          disabled={false}
                          proximity={64}
                          inactiveZone={0.01}
                          borderWidth={3}
                        />
                      )}
                      {/* Admin drag handle */}
                      {showAdminPanel && isAdmin && (
                        <div className={`absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>
                          <GripVertical size={14} />
                        </div>
                      )}

                      {/* Admin actions */}
                      {showAdminPanel && isAdmin && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); editTool(tool.id, { isEnabled: !tool.isEnabled }); }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              tool.isEnabled
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-slate-500 hover:bg-slate-700'
                            }`}
                            title={tool.isEnabled ? 'Disable' : 'Enable'}
                          >
                            {tool.isEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTool(tool); setShowCreateForm(true); }}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(tool.id); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg text-white mb-4 group-hover:scale-105 transition-transform`}>
                        <IconComponent size={20} />
                      </div>

                      {/* Title + Badge */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm">{tool.title}</h3>
                        {tool.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${BADGE_COLORS[tool.badgeColor || 'blue']}`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {tool.description}
                      </p>

                      {/* Footer: category + metrics */}
                      <div className="flex items-center justify-between mt-auto">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catInfo.bg} ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {metrics && metrics.count !== undefined && (
                          <span className={`text-[10px] font-semibold tabular-nums ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            {metrics.count} {metrics.label}
                          </span>
                        )}
                        {tool.isExternal && (
                          <ExternalLink size={12} className={`${isDark ? 'text-slate-600' : 'text-gray-300'} group-hover:text-blue-400 transition-colors`} />
                        )}
                      </div>

                      {/* Disabled overlay */}
                      {!tool.isEnabled && showAdminPanel && (
                        <div className={`absolute inset-0 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-900/60' : 'bg-white/60'}`}>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">Disabled</span>
                        </div>
                      )}
                    </div>
                  </BlurFade>
                );
              })}

              {/* Empty state */}
              {filteredTools.length === 0 && (
                <div className={`col-span-full py-16 text-center rounded-2xl border-2 border-dashed ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                  <Search size={32} className={`mx-auto mb-3 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
                  <p className="text-sm font-medium">No tools match your search</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Try a different search term or filter</p>
                  <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                    className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-medium">Clear filters</button>
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Quick stats footer */}
        <BlurFade delay={0.4} duration={0.4}>
          <div className={`flex flex-wrap items-center justify-center gap-6 py-6 border-t ${isDark ? 'border-slate-800/50' : 'border-gray-200'}`}>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{campaigns.length}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Campaigns</p>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{campaigns.filter(c => c.status === 'active').length}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Active</p>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{approvals.filter(a => a.status === 'pending').length}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Pending Approvals</p>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{assets.length}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Assets</p>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{tools.filter(t => t.isEnabled).length}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Active Tools</p>
            </div>
          </div>
        </BlurFade>
      </div>

      {/* ===== ADMIN SLIDE-OVER PANEL (Create/Edit Tool) ===== */}
      {showCreateForm && isAdmin && (
        <ToolSlideOver
          tool={editingTool}
          onClose={() => { setShowCreateForm(false); setEditingTool(null); }}
          onSave={(data) => {
            if (editingTool) {
              editTool(editingTool.id, data);
            } else {
              const newTool: Tool = {
                ...data as Tool,
                id: `t-${Date.now()}`,
                displayOrder: tools.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              addTool(newTool);
            }
            setShowCreateForm(false);
            setEditingTool(null);
          }}
          theme={theme}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className={`relative rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6 text-center ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Tool?</h3>
            <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <span className="font-semibold">"{tools.find(t => t.id === deleteConfirmId)?.title}"</span>
            </p>
            <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>This removes the tile from the hub. It won't delete any data.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors btn-press ${isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Cancel
              </button>
              <button onClick={() => { deleteTool(deleteConfirmId); setDeleteConfirmId(null); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors text-white btn-press">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== INTERACTIVE DEMO COMPONENT =====

function InteractiveDemo({ isDark }: { isDark: boolean }) {
  const [showDemo, setShowDemo] = useState(false);

  const chatUiConfig: UiConfig = {
    containerWidth: 480,
    containerHeight: 380,
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    autoRestart: true,
    restartDelay: 4000,
    loader: { dotColor: isDark ? '#94a3b8' : '#64748b' },
    linkBubbles: {
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
      textColor: isDark ? '#e2e8f0' : '#475569',
      iconColor: isDark ? '#94a3b8' : '#64748b',
      borderColor: isDark ? '#475569' : '#cbd5e1'
    },
    leftChat: {
      backgroundColor: isDark ? '#334155' : '#ffffff',
      textColor: isDark ? '#e2e8f0' : '#1e293b',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      showBorder: true,
      nameColor: isDark ? '#818cf8' : '#4f46e5'
    },
    rightChat: {
      backgroundColor: isDark ? '#4f46e520' : '#eef2ff',
      textColor: isDark ? '#e2e8f0' : '#1e293b',
      borderColor: isDark ? '#4f46e540' : '#c7d2fe',
      showBorder: true,
      nameColor: isDark ? '#a5b4fc' : '#6366f1'
    }
  };

  const chatConfig: ChatConfig = {
    leftPerson: {
      name: "You",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    rightPerson: {
      name: "Comms AI",
      avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop&crop=face"
    },
    messages: [
      {
        id: 1,
        sender: 'left',
        type: 'text',
        content: 'I need to plan a recruitment campaign for primary care coaches across 8 weeks with a £150k budget.',
        maxWidth: 'max-w-sm',
        loader: { enabled: true, delay: 800, duration: 1500 }
      },
      {
        id: 2,
        sender: 'right',
        type: 'text',
        content: "I've created a draft campaign brief. Here's the overview: 4 phases across 8 weeks — Awareness (wk 1-2), Engagement (wk 3-4), Conversion (wk 5-6), and Retention (wk 7-8).",
        maxWidth: 'max-w-md',
        loader: { enabled: true, delay: 2000, duration: 2000 }
      },
      {
        id: 3,
        sender: 'right',
        type: 'text-with-links',
        content: 'I recommend splitting budget: 40% digital ads, 25% events, 20% content, 15% partnerships. Based on NHS sector benchmarks.',
        maxWidth: 'max-w-sm',
        links: [
          { text: 'View Brief' },
          { text: 'Channel Plan' },
          { text: 'Timeline' }
        ],
        loader: { enabled: false }
      },
      {
        id: 4,
        sender: 'left',
        type: 'text',
        content: 'That looks great. Can you flag any governance risks?',
        maxWidth: 'max-w-xs',
        loader: { enabled: true, delay: 3000, duration: 1200 }
      },
      {
        id: 5,
        sender: 'right',
        type: 'text',
        content: '⚠️ 2 risks flagged: Data consent needed for targeted LinkedIn ads, and accessibility review required for all creative assets before launch. I\'ve added both to your governance checklist.',
        maxWidth: 'max-w-md',
        loader: { enabled: true, delay: 2500, duration: 1800 }
      }
    ]
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
      <button
        onClick={() => setShowDemo(!showDemo)}
        className={`w-full flex items-center justify-between p-5 transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
            <MessageSquare size={18} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold">See how it works</h3>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Watch an AI-powered campaign planning conversation in action
            </p>
          </div>
        </div>
        <div className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
          showDemo 
            ? isDark ? 'bg-brand-600/20 text-brand-400' : 'bg-brand-50 text-brand-600'
            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'
        }`}>
          {showDemo ? 'Hide Demo' : 'Watch Demo'}
        </div>
      </button>

      {showDemo && (
        <div className={`border-t px-4 py-6 flex justify-center ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
          <ChatComponent config={chatConfig} uiConfig={chatUiConfig} />
        </div>
      )}
    </div>
  );
}

// ===== SLIDE-OVER PANEL FOR CREATE/EDIT TOOL =====

interface ToolSlideOverProps {
  tool: Tool | null;
  onClose: () => void;
  onSave: (data: Partial<Tool>) => void;
  theme: 'dark' | 'light';
}

const AVAILABLE_ICONS = [
  'FolderKanban', 'Sparkles', 'Calendar', 'CheckCircle2', 'BarChart3', 'ImageIcon',
  'Target', 'Lightbulb', 'TrendingUp', 'Settings', 'ExternalLink', 'CalendarDays',
  'Palette', 'Globe', 'Layers', 'Shield', 'Search', 'Plus',
];

function ToolSlideOver({ tool, onClose, onSave, theme }: ToolSlideOverProps) {
  const isDark = theme === 'dark';
  const [form, setForm] = useState({
    title: tool?.title || '',
    description: tool?.description || '',
    icon: tool?.icon || 'Layers',
    route: tool?.route || '',
    externalUrl: tool?.externalUrl || '',
    isExternal: tool?.isExternal || false,
    isEnabled: tool?.isEnabled ?? true,
    category: tool?.category || 'core' as Tool['category'],
    badge: tool?.badge || '',
    badgeColor: tool?.badgeColor || 'blue',
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon,
      route: form.isExternal ? undefined : (form.route as ViewType) || undefined,
      externalUrl: form.isExternal ? form.externalUrl : undefined,
      isExternal: form.isExternal,
      isEnabled: form.isEnabled,
      category: form.category as Tool['category'],
      badge: form.badge || undefined,
      badgeColor: form.badgeColor || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-slide-in-right ${isDark ? 'bg-slate-900 border-l border-slate-700' : 'bg-white border-l border-gray-200'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 ${isDark ? 'bg-slate-900 border-b border-slate-800' : 'bg-white border-b border-gray-200'}`}>
          <div>
            <h3 className="text-lg font-bold">{tool ? 'Edit Tool' : 'Add New Tool'}</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {tool ? 'Modify tool tile settings' : 'Create a new tool tile for the hub'}
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Brand Guidelines"
              className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-brand-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:border-brand-500'}`} />
          </div>

          {/* Description */}
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of what this tool does..."
              rows={3}
              className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-colors ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-brand-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:border-brand-500'}`} />
          </div>

          {/* Icon picker */}
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map(iconName => {
                const Ic = ICON_MAP[iconName] || Layers;
                return (
                  <button key={iconName} onClick={() => setForm(p => ({ ...p, icon: iconName }))}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      form.icon === iconName
                        ? 'bg-brand-600/20 ring-2 ring-brand-500 text-brand-400 scale-110'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}>
                    <Ic size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type toggle */}
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Type</label>
            <div className="flex gap-2">
              <button onClick={() => setForm(p => ({ ...p, isExternal: false }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${!form.isExternal ? 'bg-brand-600 text-white' : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-gray-100 text-gray-500'}`}>
                Internal Route
              </button>
              <button onClick={() => setForm(p => ({ ...p, isExternal: true }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${form.isExternal ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-gray-100 text-gray-500'}`}>
                External URL
              </button>
            </div>
          </div>

          {/* Route or URL */}
          {form.isExternal ? (
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>External URL</label>
              <input type="url" value={form.externalUrl} onChange={e => setForm(p => ({ ...p, externalUrl: e.target.value }))}
                placeholder="https://..."
                className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-brand-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:border-brand-500'}`} />
            </div>
          ) : (
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Route</label>
              <select value={form.route} onChange={e => setForm(p => ({ ...p, route: e.target.value }))}
                className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'bg-slate-800 border border-slate-700 text-white focus:border-brand-500' : 'bg-gray-50 border border-gray-200 text-slate-900 focus:border-brand-500'}`}>
                <option value="">Select page...</option>
                <option value="dashboard">Dashboard</option>
                <option value="campaigns">Campaigns</option>
                <option value="calendar">Calendar</option>
                <option value="ai-brief">AI Brief Generator</option>
                <option value="approvals">Approvals</option>
                <option value="kpi">KPI Dashboard</option>
                <option value="assets">Assets</option>
                <option value="settings">Settings</option>
                <option value="mkt-strategy">Marketing Strategy</option>
                <option value="mkt-ideas">Growth Ideas (139)</option>
                <option value="mkt-calendar">Marketing Calendar</option>
                <option value="mkt-performance">Performance Review</option>
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Category</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                <button key={key} onClick={() => setForm(p => ({ ...p, category: key as Tool['category'] }))}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    form.category === key ? `${val.bg} ${val.color} ring-1 ring-current` : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Badge (optional)</label>
              <input type="text" value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
                placeholder="e.g., New, Beta, AI"
                className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`} />
            </div>
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Badge Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {Object.keys(BADGE_COLORS).map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, badgeColor: c }))}
                    className={`w-7 h-7 rounded-full border-2 text-[10px] font-bold flex items-center justify-center transition-all ${
                      form.badgeColor === c ? 'scale-110 border-white' : 'border-transparent opacity-60 hover:opacity-100'
                    } ${BADGE_COLORS[c]}`}>
                    {c[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enabled toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <div>
              <p className="text-sm font-medium">Enabled</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Show this tile to all users</p>
            </div>
            <button onClick={() => setForm(p => ({ ...p, isEnabled: !p.isEnabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.isEnabled ? 'bg-brand-600' : isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Preview tile */}
          <div>
            <label className={`text-xs font-semibold block mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Preview</label>
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${ICON_GRADIENTS[form.category] || ICON_GRADIENTS.core} flex items-center justify-center text-white shadow-lg`}>
                  {(() => { const Ic = ICON_MAP[form.icon] || Layers; return <Ic size={20} />; })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{form.title || 'Tool Name'}</h3>
                    {form.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${BADGE_COLORS[form.badgeColor || 'blue']}`}>
                        {form.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {form.description || 'Tool description will appear here'}
                  </p>
                  <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${(CATEGORY_LABELS[form.category] || CATEGORY_LABELS.core).bg} ${(CATEGORY_LABELS[form.category] || CATEGORY_LABELS.core).color}`}>
                    {(CATEGORY_LABELS[form.category] || CATEGORY_LABELS.core).label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-6 flex gap-3 ${isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white border-t border-gray-200'}`}>
          <button onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors btn-press ${isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!form.title.trim()}
            className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors btn-press shadow-lg shadow-brand-500/20">
            {tool ? 'Save Changes' : 'Create Tool'}
          </button>
        </div>
      </div>
    </div>
  );
}
