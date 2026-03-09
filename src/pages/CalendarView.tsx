import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { ChevronLeft, ChevronRight, Clock, Users, Plus, X, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { CalendarEventItem } from '../types';

type CalendarMode = 'month' | 'timeline';
type CalendarFilter = 'all' | 'campaigns' | 'events';

export default function CalendarView() {
  const {
    campaigns, setView, setSelectedCampaignId, theme,
    calendarEvents, addCalendarEvent,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 15));
  const [mode, setMode] = useState<CalendarMode>('month');
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState<CalendarEventItem['type']>('internal');
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

  const getCampaignsForDay = (day: Date) => campaigns.filter(c => {
    try {
      const start = parseISO(c.startDate);
      const end = parseISO(c.endDate);
      return isWithinInterval(day, { start, end });
    } catch { return false; }
  });

  const getEventsForDay = (day: Date) => calendarEvents.filter(e => {
    try {
      const start = parseISO(e.date);
      const end = e.endDate ? parseISO(e.endDate) : start;
      return isWithinInterval(day, { start, end });
    } catch { return false; }
  });

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

  const handleAddEvent = () => {
    if (!eventTitle.trim() || !eventDate) return;
    addCalendarEvent({
      id: `ce-${Date.now()}`,
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      date: eventDate,
      endDate: eventEndDate || undefined,
      type: eventType,
      color: eventType === 'internal' ? '#f59e0b' : '#06b6d4',
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    });
    setShowAddEvent(false);
    setEventTitle('');
    setEventDate('');
    setEventEndDate('');
    setEventDescription('');
    setEventType('internal');
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaign Calendar</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Plan campaigns and internal events in one place
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowAddEvent(true)} className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1">
            <Plus size={14} /> Add Event
          </button>

          <div className={`flex rounded-xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {(['all', 'campaigns', 'events'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === f ? 'bg-emerald-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                {f}
              </button>
            ))}
          </div>

          <div className={`flex rounded-xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {(['month', 'timeline'] as CalendarMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize ${mode === m ? 'bg-brand-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                {m}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}><ChevronLeft size={18} /></button>
            <span className={`text-sm font-semibold min-w-[140px] text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {mode === 'month' ? (
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${containerBg}`}>
          <div className={`grid grid-cols-7 border-b ${headerBorderClass}`}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className={`p-3 text-xs font-semibold text-center uppercase tracking-wider ${dayHeaderTextClass}`}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayCampaigns = getCampaignsForDay(day);
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const showCampaigns = filter === 'all' || filter === 'campaigns';
              const showEvents = filter === 'all' || filter === 'events';

              return (
                <div key={i} className={`min-h-[100px] md:min-h-[120px] border-b border-r ${dayBorderClass} p-1.5 ${!isCurrentMonth ? offMonthBg : ''} ${hoverBg}`}>
                  <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : isCurrentMonth ? currentMonthText : offMonthText}`}>{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {showCampaigns && dayCampaigns.slice(0, 2).map(c => (
                      <div key={c.id} onClick={() => { setSelectedCampaignId(c.id); setView('campaign-detail'); }} className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate cursor-pointer" style={{ backgroundColor: isDark ? c.color + '25' : c.color + '18', color: isDark ? c.color : adjustColorForLight(c.color), borderLeft: `2px solid ${c.color}` }}>{c.title}</div>
                    ))}
                    {showEvents && dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate" style={{ backgroundColor: isDark ? (e.color || '#f59e0b') + '25' : (e.color || '#f59e0b') + '18', color: isDark ? (e.color || '#f59e0b') : adjustColorForLight(e.color || '#f59e0b'), borderLeft: `2px solid ${e.color || '#f59e0b'}` }}>{e.title}</div>
                    ))}
                    {(dayCampaigns.length + dayEvents.length > 4) && <div className={`text-[10px] pl-1.5 font-medium ${moreText}`}>+more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${containerBg}`}>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className={`flex border-b ${headerBorderClass}`}>
                <div className={`w-64 flex-shrink-0 p-3 border-r ${headerBorderClass}`}><span className={`text-xs font-semibold ${dayHeaderTextClass}`}>Item</span></div>
                <div className="flex-1 flex">{timelineWeeks.map((w, i) => <div key={i} className={`flex-1 min-w-[60px] p-2 text-center border-r ${dayBorderClass} text-[10px] font-semibold ${dayHeaderTextClass}`}>{format(w, 'dd MMM')}</div>)}</div>
              </div>

              {(filter === 'all' || filter === 'campaigns') && campaigns.map(campaign => {
                const start = parseISO(campaign.startDate); const end = parseISO(campaign.endDate);
                const totalSpan = timelineWeeks.length; const firstWeek = timelineWeeks[0];
                const startOffset = Math.max(0, Math.floor((start.getTime() - firstWeek.getTime()) / (7 * 86400000)));
                const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));
                return (
                  <div key={campaign.id} className={`flex border-b ${dayBorderClass} ${isDark ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}`}>
                    <div className={`w-64 flex-shrink-0 p-3 border-r ${headerBorderClass} flex items-center gap-3 cursor-pointer`} onClick={() => { setSelectedCampaignId(campaign.id); setView('campaign-detail'); }}>
                      <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: campaign.color }} />
                      <div className="min-w-0"><p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{campaign.title}</p><div className={`flex items-center gap-2 text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><span className="flex items-center gap-1"><Clock size={10} /> {format(start, 'dd MMM')} — {format(end, 'dd MMM')}</span><span className="flex items-center gap-1"><Users size={10} /> {campaign.team.length}</span></div></div>
                    </div>
                    <div className="flex-1 flex items-center relative py-2"><div className="absolute h-7 rounded-lg flex items-center px-2 text-[10px] font-semibold" style={{ left: `${(startOffset / totalSpan) * 100}%`, width: `${Math.min((duration / totalSpan) * 100, 100 - (startOffset / totalSpan) * 100)}%`, backgroundColor: isDark ? campaign.color + '35' : campaign.color + '20', borderLeft: `3px solid ${campaign.color}`, color: isDark ? campaign.color : adjustColorForLight(campaign.color) }}><span className="truncate">{campaign.title}</span></div></div>
                  </div>
                );
              })}

              {(filter === 'all' || filter === 'events') && calendarEvents.map(event => {
                const start = parseISO(event.date); const end = parseISO(event.endDate || event.date);
                const totalSpan = timelineWeeks.length; const firstWeek = timelineWeeks[0];
                const startOffset = Math.max(0, Math.floor((start.getTime() - firstWeek.getTime()) / (7 * 86400000)));
                const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));
                const color = event.color || '#f59e0b';
                return (
                  <div key={event.id} className={`flex border-b ${dayBorderClass} ${isDark ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}`}>
                    <div className={`w-64 flex-shrink-0 p-3 border-r ${headerBorderClass} flex items-center gap-3`}>
                      <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <div className="min-w-0"><p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{event.title}</p><div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1`}><CalendarDays size={10} /> {format(start, 'dd MMM')} {event.endDate ? `— ${format(end, 'dd MMM')}` : ''}</div></div>
                    </div>
                    <div className="flex-1 flex items-center relative py-2"><div className="absolute h-7 rounded-lg flex items-center px-2 text-[10px] font-semibold" style={{ left: `${(startOffset / totalSpan) * 100}%`, width: `${Math.min((duration / totalSpan) * 100, 100 - (startOffset / totalSpan) * 100)}%`, backgroundColor: isDark ? color + '35' : color + '20', borderLeft: `3px solid ${color}`, color: isDark ? color : adjustColorForLight(color) }}><span className="truncate">{event.title}</span></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddEvent(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Add Calendar Event</h3><button onClick={() => setShowAddEvent(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X size={16} /></button></div>
            <div className="space-y-3">
              <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event title" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
              <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
                <input type="date" value={eventEndDate} onChange={e => setEventEndDate(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
              </div>
              <select value={eventType} onChange={e => setEventType(e.target.value as CalendarEventItem['type'])} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                <option value="internal">Internal Comms</option>
                <option value="campaign-support">Campaign Support</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Cancel</button>
              <button onClick={handleAddEvent} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm">Add Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function adjustColorForLight(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  let r = parseInt(clean.slice(0, 2), 16);
  let g = parseInt(clean.slice(2, 4), 16);
  let b = parseInt(clean.slice(4, 6), 16);
  r = Math.floor(r * 0.55);
  g = Math.floor(g * 0.55);
  b = Math.floor(b * 0.55);
  return `rgb(${r},${g},${b})`;
}
