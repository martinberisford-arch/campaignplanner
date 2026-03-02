import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Clock } from 'lucide-react';

interface AIInputProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  theme?: 'dark' | 'light';
  recentQueries?: string[];
}

const SUGGESTIONS = [
  'Create a campaign for staff recruitment',
  'Generate a social media content plan',
  'Draft a campaign brief for flu vaccination',
  'Show performance summary for last month',
  'Suggest marketing ideas for low budget',
  'Plan an internal communications campaign',
];

export default function AIInput({
  onSubmit,
  placeholder = 'Ask AI anything — create campaigns, generate briefs, get insights...',
  theme = 'dark',
  recentQueries = [],
}: AIInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`relative flex items-start gap-3 rounded-2xl border transition-all duration-300 ${
          isFocused
            ? isDark
              ? 'border-brand-500/50 bg-slate-800/80 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/20'
              : 'border-brand-400 bg-white shadow-lg shadow-brand-500/10 ring-1 ring-brand-400/30'
            : isDark
              ? 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
              : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
        } px-4 py-3`}
      >
        <Sparkles
          size={18}
          className={`mt-1.5 flex-shrink-0 transition-colors ${
            isFocused ? 'text-brand-400' : isDark ? 'text-slate-500' : 'text-gray-400'
          }`}
        />
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={`flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-slate-500 min-h-[24px] max-h-[120px] pt-1 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        />
        <div className="flex items-center gap-2 mt-1">
          {value && (
            <button
              onClick={() => setValue('')}
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all btn-press ${
              value.trim()
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : isDark
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-2xl z-50 overflow-hidden animate-scale-in ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}
        >
          {recentQueries.length > 0 && (
            <>
              <div className={`px-3 py-2 ${isDark ? 'border-b border-slate-700' : 'border-b border-gray-100'}`}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Recent</p>
              </div>
              {recentQueries.slice(0, 3).map((q, i) => (
                <button
                  key={`recent-${i}`}
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(q); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Clock size={13} className="text-slate-500 flex-shrink-0" />
                  <span className="text-xs truncate">{q}</span>
                </button>
              ))}
            </>
          )}
          <div className={`px-3 py-2 ${isDark ? 'border-b border-slate-700' : 'border-b border-gray-100'} ${recentQueries.length > 0 ? isDark ? 'border-t border-slate-700' : 'border-t border-gray-100' : ''}`}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Suggestions</p>
          </div>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
              }`}
            >
              <Sparkles size={13} className="text-brand-400 flex-shrink-0" />
              <span className="text-xs">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
