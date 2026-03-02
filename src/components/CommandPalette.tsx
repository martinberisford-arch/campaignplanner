import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { ViewType } from '../types';
import {
  Search, LayoutDashboard, Calendar, FolderKanban, Sparkles, CheckCircle2,
  BarChart3, ImageIcon, Settings, ArrowRight, Hash, Users,
  Target, Lightbulb, TrendingUp, Zap, Plus, Moon, Sun, LogOut
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  category: 'navigation' | 'campaign' | 'action' | 'team' | 'recent';
  action: () => void;
  keywords?: string[];
}

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    setView, campaigns, setSelectedCampaignId, teamMembers,
    theme, toggleTheme, logout
  } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo((): CommandItem[] => {
    const nav: CommandItem[] = [
      { id: 'nav-hub', label: 'Home', sublabel: 'Marketing Tools Hub', icon: <LayoutDashboard size={18} />, category: 'navigation', action: () => { setView('hub'); onClose(); }, keywords: ['home', 'hub', 'tools'] },
      { id: 'nav-dash', label: 'Dashboard', sublabel: 'Overview & stats', icon: <BarChart3 size={18} />, category: 'navigation', action: () => { setView('dashboard'); onClose(); }, keywords: ['overview', 'stats'] },
      { id: 'nav-cal', label: 'Calendar', sublabel: 'Campaign calendar', icon: <Calendar size={18} />, category: 'navigation', action: () => { setView('calendar'); onClose(); }, keywords: ['schedule', 'timeline'] },
      { id: 'nav-camp', label: 'Campaigns', sublabel: 'All campaigns', icon: <FolderKanban size={18} />, category: 'navigation', action: () => { setView('campaigns'); onClose(); }, keywords: ['projects', 'boards'] },
      { id: 'nav-ai', label: 'AI Brief Generator', sublabel: 'Create briefs with AI', icon: <Sparkles size={18} />, category: 'navigation', action: () => { setView('ai-brief'); onClose(); }, keywords: ['generate', 'brief', 'artificial'] },
      { id: 'nav-app', label: 'Approvals', sublabel: 'Review & approve', icon: <CheckCircle2 size={18} />, category: 'navigation', action: () => { setView('approvals'); onClose(); }, keywords: ['review', 'approve'] },
      { id: 'nav-kpi', label: 'KPI Dashboard', sublabel: 'Performance metrics', icon: <BarChart3 size={18} />, category: 'navigation', action: () => { setView('kpi'); onClose(); }, keywords: ['analytics', 'metrics', 'data'] },
      { id: 'nav-assets', label: 'Assets', sublabel: 'Files & documents', icon: <ImageIcon size={18} />, category: 'navigation', action: () => { setView('assets'); onClose(); }, keywords: ['files', 'documents', 'images'] },
      { id: 'nav-settings', label: 'Settings', sublabel: 'App configuration', icon: <Settings size={18} />, category: 'navigation', action: () => { setView('settings'); onClose(); }, keywords: ['config', 'preferences'] },
      { id: 'nav-strat', label: 'Marketing Strategy', sublabel: 'Strategy overview', icon: <Target size={18} />, category: 'navigation', action: () => { setView('mkt-strategy' as ViewType); onClose(); }, keywords: ['strategy', 'marketing'] },
      { id: 'nav-ideas', label: 'Growth Ideas (139)', sublabel: '139 marketing framework', icon: <Lightbulb size={18} />, category: 'navigation', action: () => { setView('mkt-ideas' as ViewType); onClose(); }, keywords: ['ideas', 'growth', '139'] },
      { id: 'nav-perf', label: 'Performance Review', sublabel: 'Marketing performance', icon: <TrendingUp size={18} />, category: 'navigation', action: () => { setView('mkt-performance' as ViewType); onClose(); }, keywords: ['performance', 'review'] },
    ];

    const campaignItems: CommandItem[] = campaigns.slice(0, 8).map(c => ({
      id: `camp-${c.id}`,
      label: c.title,
      sublabel: `${c.status} · £${(c.budget/1000).toFixed(0)}k`,
      icon: <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />,
      category: 'campaign' as const,
      action: () => { setSelectedCampaignId(c.id); setView('campaign-detail'); onClose(); },
      keywords: [c.status, ...c.channels],
    }));

    const actions: CommandItem[] = [
      { id: 'act-new', label: 'Create New Campaign', sublabel: 'Start a new campaign', icon: <Plus size={18} />, category: 'action', action: () => { setView('campaigns'); onClose(); }, keywords: ['new', 'create'] },
      { id: 'act-brief', label: 'Generate AI Brief', sublabel: 'AI-powered brief creation', icon: <Zap size={18} />, category: 'action', action: () => { setView('ai-brief'); onClose(); }, keywords: ['generate', 'ai'] },
      { id: 'act-theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, sublabel: 'Toggle theme', icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />, category: 'action', action: () => { toggleTheme(); onClose(); }, keywords: ['theme', 'dark', 'light', 'mode'] },
      { id: 'act-logout', label: 'Sign Out', sublabel: 'Log out of Comms Dashboard', icon: <LogOut size={18} />, category: 'action', action: () => { logout(); onClose(); }, keywords: ['logout', 'signout'] },
    ];

    const teamItems: CommandItem[] = teamMembers.filter(m => m.active).slice(0, 5).map(m => ({
      id: `team-${m.id}`,
      label: m.name,
      sublabel: `${m.role} · ${m.department}`,
      icon: <Users size={18} />,
      category: 'team' as const,
      action: () => { setView('settings'); onClose(); },
      keywords: [m.email, m.department, m.role],
    }));

    return [...nav, ...campaignItems, ...actions, ...teamItems];
  }, [campaigns, teamMembers, theme, setView, setSelectedCampaignId, toggleTheme, logout, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12);
    const q = query.toLowerCase();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.sublabel?.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [query, allItems]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filtered]);

  const categoryLabels: Record<string, string> = {
    navigation: 'Pages',
    campaign: 'Campaigns',
    action: 'Quick Actions',
    team: 'Team Members',
    recent: 'Recent',
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`cmd-palette relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden animate-cmdpalette ${
        theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'
      }`} style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)' }}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <Search size={20} className="text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, campaigns, actions, people..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-slate-500"
            style={{ caretColor: '#818cf8' }}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-slate-500 bg-slate-800 rounded-md border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Search size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No results for "{query}"</p>
              <p className="text-xs text-slate-600 mt-1">Try searching for a page, campaign, or action</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-5 py-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {categoryLabels[category] || category}
                  </p>
                </div>
                {items.map(item => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                        isSelected
                          ? theme === 'light' ? 'bg-brand-50 text-brand-700' : 'bg-brand-600/15 text-white'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className={`text-xs truncate ${isSelected ? 'text-brand-300' : 'text-slate-500'}`}>{item.sublabel}</p>
                        )}
                      </div>
                      {isSelected && <ArrowRight size={14} className="text-brand-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-slate-800 text-[10px] text-slate-600">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">esc</kbd> close</span>
          <span className="ml-auto flex items-center gap-1"><Hash size={10} /> {filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}
