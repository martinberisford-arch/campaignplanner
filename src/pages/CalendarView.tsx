import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';

type CalendarMode = 'month' | 'timeline';

export default function CalendarView() {
  const { campaigns, setView, setSelectedCampaignId } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 15));
  const [mode, setMode] = useState<CalendarMode>('month');

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

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaign Calendar</h1>
          <p className="text-sm text-slate-400 mt-1">Plan and visualise your campaign timelines</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-xl p-1">
            {(['month', 'timeline'] as CalendarMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${mode === m ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >{m}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-1.5">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="text-slate-400 hover:text-white"><ChevronLeft size={18} /></button>
            <span className="text-sm font-semibold min-w-[140px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="text-slate-400 hover:text-white"><ChevronRight size={18} /></button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 rounded-xl">Today</button>
        </div>
      </div>

      {mode === 'month' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="p-3 text-xs font-semibold text-slate-500 text-center uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayCampaigns = getCampaignsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              return (
                <div key={i} className={`min-h-[100px] md:min-h-[120px] border-b border-r border-slate-800/50 p-1.5 ${!isCurrentMonth ? 'bg-slate-950/50' : 'hover:bg-slate-800/20'} transition-colors`}>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayCampaigns.slice(0, 3).map(c => (
                      <div key={c.id}
                        onClick={() => { setSelectedCampaignId(c.id); setView('campaign-detail'); }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:brightness-110 transition-all"
                        style={{ backgroundColor: c.color + '30', color: c.color, borderLeft: `2px solid ${c.color}` }}
                      >
                        {c.title}
                      </div>
                    ))}
                    {dayCampaigns.length > 3 && (
                      <div className="text-[10px] text-slate-500 pl-1.5">+{dayCampaigns.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Timeline / Gantt View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Week Headers */}
              <div className="flex border-b border-slate-800">
                <div className="w-64 flex-shrink-0 p-3 border-r border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">Campaign</span>
                </div>
                <div className="flex-1 flex">
                  {timelineWeeks.map((w, i) => (
                    <div key={i} className="flex-1 min-w-[60px] p-2 text-center border-r border-slate-800/30 text-[10px] text-slate-500 font-medium">
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
                  <div key={campaign.id} className="flex border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <div className="w-64 flex-shrink-0 p-3 border-r border-slate-800 flex items-center gap-3 cursor-pointer"
                      onClick={() => { setSelectedCampaignId(campaign.id); setView('campaign-detail'); }}>
                      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: campaign.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{campaign.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1"><Clock size={10} /> {format(start, 'dd MMM')} — {format(end, 'dd MMM')}</span>
                          <span className="flex items-center gap-1"><Users size={10} /> {campaign.team.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center relative py-2">
                      <div
                        className="gantt-bar absolute h-7 rounded-lg flex items-center px-2 text-[10px] font-medium cursor-pointer"
                        style={{
                          left: `${(startOffset / totalSpan) * 100}%`,
                          width: `${Math.min((duration / totalSpan) * 100, 100 - (startOffset / totalSpan) * 100)}%`,
                          backgroundColor: campaign.color + '40',
                          borderLeft: `3px solid ${campaign.color}`,
                          color: campaign.color,
                        }}
                        onClick={() => { setSelectedCampaignId(campaign.id); setView('campaign-detail'); }}
                      >
                        <span className="truncate">{campaign.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {campaigns.map(c => (
          <div key={c.id} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
            <span className="text-xs text-slate-400">{c.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
