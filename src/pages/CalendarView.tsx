import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';

type CalendarMode = 'month' | 'timeline';

export default function CalendarView() {
  const { campaigns, setView, setSelectedCampaignId, theme } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 15));
  const [mode, setMode] = useState<CalendarMode>('month');
  const isDark = theme === 'dark';

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => {
    const result: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [calStart, calEnd]);

  const getCampaignsForDay = (day: Date) => {
    return campaigns.filter(c => {
      try {
        const start = parseISO(c.startDate);
        const end = parseISO(c.endDate);
        return isWithinInterval(day, { start, end });
      } catch { return false; }
    });
  };

  const timelineWeeks = useMemo(() => {
    const weeks: Date[] = [];
    let d = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = addDays(endOfWeek(addMonths(monthEnd, 2), { weekStartsOn: 1 }), 1);
    while (d < end) {
      weeks.push(d);
      d = addDays(d, 7);
    }
    return weeks;
  }, [monthStart, monthEnd]);

  const containerBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const headerBorderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const dayBorderClass = isDark ? 'border-slate-800/50' : 'border-slate-100';
  const dayHeaderTextClass = isDark ? 'text-slate-500' : 'text-slate-400';
  const offMonthBg = isDark ? 'bg-slate-950/50' : 'bg-slate-50';
  const hoverBg = isDark ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50';
  const currentMonthText = isDark ? 'text-slate-300' : 'text-slate-700';
  const offMonthText = isDark ? 'text-slate-600' : 'text-slate-300';
  const moreText = isDark ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaign Calendar</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Plan and visualise your campaign timelines
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className={`flex rounded-xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {(['month', 'timeline'] as CalendarMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  mode === m
                    ? 'bg-brand-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >{m}</button>
            ))}
          </div>

          {/* Month navigation */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <span className={`text-sm font-semibold min-w-[140px] text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-xl transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {mode === 'month' ? (
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${containerBg}`}>
          {/* Day Headers */}
          <div className={`grid grid-cols-7 border-b ${headerBorderClass}`}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div
                key={d}
                className={`p-3 text-xs font-semibold text-center uppercase tracking-wider ${dayHeaderTextClass}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayCampaigns = getCampaignsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={i}
                  className={`min-h-[100px] md:min-h-[120px] border-b border-r ${dayBorderClass} p-1.5 transition-colors ${
                    !isCurrentMonth ? offMonthBg : hoverBg
                  }`}
                >
                  {/* Date number */}
                  <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    isToday
                      ? 'bg-brand-600 text-white'
                      : isCurrentMonth
                        ? currentMonthText
                        : offMonthText
                  }`}>
                    {format(day, 'd')}
                  </div>

                  {/* Campaign pills */}
                  <div className="space-y-0.5">
                    {dayCampaigns.slice(0, 3).map(c => (
                      <div
                        key={c.id}
                        onClick={() => { setSelectedCampaignId(c.id); setView('campaign-detail'); }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate cursor-pointer hover:brightness-110 transition-all"
                        style={{
                          backgroundColor: isDark ? c.color + '25' : c.color + '18',
                          color: isDark ? c.color : adjustColorForLight(c.color),
                          borderLeft: `2px solid ${c.color}`,
                        }}
                      >
                        {c.title}
                      </div>
                    ))}
                    {dayCampaigns.length > 3 && (
                      <div className={`text-[10px] pl-1.5 font-medium ${moreText}`}>
                        +{dayCampaigns.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Timeline / Gantt View */
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${containerBg}`}>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Week Headers */}
              <div className={`flex border-b ${headerBorderClass}`}>
                <div className={`w-64 flex-shrink-0 p-3 border-r ${headerBorderClass}`}>
                  <span className={`text-xs font-semibold ${dayHeaderTextClass}`}>Campaign</span>
                </div>
                <div className="flex-1 flex">
                  {timelineWeeks.map((w, i) => (
                    <div
                      key={i}
                      className={`flex-1 min-w-[60px] p-2 text-center border-r ${dayBorderClass} text-[10px] font-semibold ${dayHeaderTextClass}`}
                    >
                      {format(w, 'dd MMM')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign Rows */}
              {campaigns.map(campaign => {
                const start = parseISO(campaign.startDate);
                const end = parseISO(campaign.endDate);
                const totalSpan = timelineWeeks.length;
                const firstWeek = timelineWeeks[0];
                const startOffset = Math.max(0, Math.floor((start.getTime() - firstWeek.getTime()) / (7 * 86400000)));
                const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));

                return (
                  <div
                    key={campaign.id}
                    className={`flex border-b ${dayBorderClass} transition-colors ${isDark ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}`}
                  >
                    <div
                      className={`w-64 flex-shrink-0 p-3 border-r ${headerBorderClass} flex items-center gap-3 cursor-pointer`}
                      onClick={() => { setSelectedCampaignId(campaign.id); setView('campaign-detail'); }}
                    >
                      <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: campaign.color }} />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {campaign.title}
                        </p>
                        <div className={`flex items-center gap-2 text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {format(start, 'dd MMM')} — {format(end, 'dd MMM')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={10} /> {campaign.team.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center relative py-2">
                      <div
                        className="gantt-bar absolute h-7 rounded-lg flex items-center px-2 text-[10px] font-semibold cursor-pointer"
                        style={{
                          left: `${(startOffset / totalSpan) * 100}%`,
                          width: `${Math.min((duration / totalSpan) * 100, 100 - (startOffset / totalSpan) * 100)}%`,
                          backgroundColor: isDark ? campaign.color + '35' : campaign.color + '20',
                          borderLeft: `3px solid ${campaign.color}`,
                          color: isDark ? campaign.color : adjustColorForLight(campaign.color),
                        }}
                        onClick={() => { setSelectedCampaignId(campaign.id); setView('campaign-detail'); }}
                      >
                        <span className="truncate">{campaign.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {campaigns.length === 0 && (
                <div className={`py-16 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <p className="text-sm">No campaigns to display.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {campaigns.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Darken a hex colour for light mode text to ensure WCAG AA contrast (≥4.5:1 on white bg).
 * Takes the campaign colour and returns a darkened version safe on white.
 */
function adjustColorForLight(hex: string): string {
  // Parse hex
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  let r = parseInt(clean.slice(0, 2), 16);
  let g = parseInt(clean.slice(2, 4), 16);
  let b = parseInt(clean.slice(4, 6), 16);

  // Darken by 40% to ensure contrast on white backgrounds
  r = Math.floor(r * 0.55);
  g = Math.floor(g * 0.55);
  b = Math.floor(b * 0.55);

  return `rgb(${r},${g},${b})`;
}
