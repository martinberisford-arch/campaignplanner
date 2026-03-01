import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { getCategoryLabel, getCategoryColor, CATEGORY_LIST } from '../data/marketingIdeas';
import { Calendar, ChevronLeft, ChevronRight, Lightbulb, TrendingUp, Target, Clock, BarChart3 } from 'lucide-react';

const AWARENESS_DAYS = [
  { date: '2025-01-27', name: 'Holocaust Memorial Day', category: 'community' as const },
  { date: '2025-02-01', name: 'LGBT History Month', category: 'community' as const },
  { date: '2025-02-04', name: 'World Cancer Day', category: 'engagement' as const },
  { date: '2025-02-06', name: 'Time to Talk Day', category: 'engagement' as const },
  { date: '2025-03-08', name: 'International Women\'s Day', category: 'community' as const },
  { date: '2025-03-13', name: 'National No Smoking Day', category: 'engagement' as const },
  { date: '2025-04-02', name: 'World Autism Day', category: 'community' as const },
  { date: '2025-04-07', name: 'World Health Day', category: 'engagement' as const },
  { date: '2025-05-12', name: 'International Nurses Day', category: 'authority' as const },
  { date: '2025-05-18', name: 'Mental Health Awareness Week', category: 'engagement' as const },
  { date: '2025-06-12', name: 'Carers Week', category: 'community' as const },
  { date: '2025-07-05', name: 'NHS Birthday', category: 'authority' as const },
  { date: '2025-09-10', name: 'World Suicide Prevention Day', category: 'engagement' as const },
  { date: '2025-10-10', name: 'World Mental Health Day', category: 'engagement' as const },
  { date: '2025-10-16', name: 'World Food Day', category: 'community' as const },
  { date: '2025-11-14', name: 'World Diabetes Day', category: 'engagement' as const },
  { date: '2025-12-01', name: 'World AIDS Day', category: 'engagement' as const },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MktCalendar() {
  const { campaigns, marketingIdeas, theme } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const subCardBg = isDark ? 'bg-slate-800/50' : 'bg-gray-50';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMain = isDark ? 'text-white' : 'text-slate-900';

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const activatedIdeas = marketingIdeas.filter(i => i.status === 'activated' || i.status === 'completed');

  const getEventsForDate = (dateStr: string) => {
    const campaignsOnDate = campaigns.filter(c => c.startDate <= dateStr && c.endDate >= dateStr);
    const awarenessOnDate = AWARENESS_DAYS.filter(a => a.date === dateStr);
    return { campaigns: campaignsOnDate, awareness: awarenessOnDate };
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : null;

  // Related ideas for selected date campaigns
  const relatedIdeas = useMemo(() => {
    if (!selectedEvents?.campaigns.length) return [];
    const campaignCategories = new Set<string>();
    selectedEvents.campaigns.forEach(c => {
      c.channels.forEach(ch => campaignCategories.add(ch));
    });
    return activatedIdeas.slice(0, 5);
  }, [selectedEvents, activatedIdeas]);

  // Monthly awareness this month
  const monthAwareness = AWARENESS_DAYS.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Active campaigns this month
  const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  const activeCampaignsThisMonth = campaigns.filter(c => c.startDate <= monthEnd && c.endDate >= monthStart);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${textMain}`}>Marketing Calendar</h1>
        <p className={`text-sm ${textMuted} mt-1`}>Campaigns, awareness days, and marketing activity in one view. Click any date for the intelligence panel.</p>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: activeCampaignsThisMonth.length, icon: <Target size={16} />, color: 'text-brand-400' },
          { label: 'Awareness Days', value: monthAwareness.length, icon: <Calendar size={16} />, color: 'text-amber-400' },
          { label: 'Ideas Activated', value: activatedIdeas.length, icon: <Lightbulb size={16} />, color: 'text-emerald-400' },
          { label: 'Avg. Campaign Length', value: activeCampaignsThisMonth.length > 0 ? Math.round(activeCampaignsThisMonth.reduce((sum, c) => sum + Math.ceil((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000), 0) / activeCampaignsThisMonth.length) + 'd' : '—', icon: <Clock size={16} />, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={s.color}>{s.icon}</span>
              <span className={`text-[10px] font-semibold ${textMuted}`}>{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${textMain}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className={`rounded-xl border p-6 col-span-2 ${cardBg}`}>
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className={`p-2 rounded-lg ${textMuted} hover:bg-slate-700/50`}><ChevronLeft size={20} /></button>
            <h2 className={`text-lg font-bold ${textMain}`}>{MONTHS[currentMonth]} {currentYear}</h2>
            <button onClick={nextMonth} className={`p-2 rounded-lg ${textMuted} hover:bg-slate-700/50`}><ChevronRight size={20} /></button>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {DAYS.map(d => (
              <div key={d} className={`text-center py-2 text-[10px] font-semibold ${textMuted}`}>{d}</div>
            ))}
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className={`aspect-square rounded-lg ${isDark ? 'bg-slate-900/30' : 'bg-gray-50/50'}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = getEventsForDate(dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              const hasEvents = events.campaigns.length > 0 || events.awareness.length > 0;

              return (
                <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start transition-all relative ${
                    isSelected ? 'ring-2 ring-brand-500 bg-brand-600/10' :
                    isToday ? (isDark ? 'bg-brand-900/30 ring-1 ring-brand-700' : 'bg-brand-50 ring-1 ring-brand-200') :
                    hasEvents ? (isDark ? 'bg-slate-800/70 hover:bg-slate-800' : 'bg-gray-50 hover:bg-gray-100') :
                    `hover:${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`
                  }`}>
                  <span className={`text-xs font-medium ${isToday ? 'text-brand-400' : textMain}`}>{day}</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full overflow-hidden">
                    {events.campaigns.slice(0, 2).map(c => (
                      <div key={c.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                    ))}
                    {events.awareness.slice(0, 1).map(a => (
                      <div key={a.date + a.name} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(a.category) }} />
                    ))}
                  </div>
                  {events.campaigns.length > 2 && (
                    <span className={`text-[8px] ${textMuted}`}>+{events.campaigns.length - 2}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700/30">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              <span className={`text-[10px] ${textMuted}`}>Campaign active</span>
            </div>
            {CATEGORY_LIST.slice(0, 4).map(cat => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                <span className={`text-[10px] ${textMuted}`}>{getCategoryLabel(cat)} awareness</span>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Panel */}
        <div className="space-y-4">
          {selectedDate && selectedEvents ? (
            <>
              <div className={`rounded-xl border p-4 ${cardBg}`}>
                <h3 className={`text-sm font-semibold ${textMain} mb-1`}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p className={`text-xs ${textMuted}`}>
                  {selectedEvents.campaigns.length} campaign{selectedEvents.campaigns.length !== 1 ? 's' : ''} · {selectedEvents.awareness.length} awareness event{selectedEvents.awareness.length !== 1 ? 's' : ''}
                </p>
              </div>

              {selectedEvents.awareness.length > 0 && (
                <div className={`rounded-xl border p-4 ${cardBg}`}>
                  <h3 className={`text-xs font-semibold ${textMuted} mb-3`}>🎗️ Awareness Days</h3>
                  {selectedEvents.awareness.map(a => (
                    <div key={a.name} className={`p-3 rounded-lg ${subCardBg} mb-2`}>
                      <p className={`text-sm font-semibold ${textMain}`}>{a.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: getCategoryColor(a.category) + '20', color: getCategoryColor(a.category) }}>
                        {getCategoryLabel(a.category)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedEvents.campaigns.length > 0 && (
                <div className={`rounded-xl border p-4 ${cardBg}`}>
                  <h3 className={`text-xs font-semibold ${textMuted} mb-3`}>📋 Active Campaigns</h3>
                  {selectedEvents.campaigns.map(c => (
                    <div key={c.id} className={`p-3 rounded-lg ${subCardBg} mb-2`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: c.color }} />
                        <div>
                          <p className={`text-sm font-semibold ${textMain}`}>{c.title}</p>
                          <p className={`text-[10px] ${textMuted}`}>{c.status} · £{c.budget.toLocaleString()}</p>
                        </div>
                      </div>
                      {c.kpis.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {c.kpis.map(k => (
                            <span key={k.id} className={`text-[10px] px-2 py-0.5 rounded-full ${subCardBg} ${textMuted}`}>
                              {k.name}: {k.value}/{k.target}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Related Ideas */}
              {relatedIdeas.length > 0 && (
                <div className={`rounded-xl border p-4 ${cardBg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-amber-400" />
                    <h3 className={`text-xs font-semibold ${textMuted}`}>Suggested Ideas</h3>
                  </div>
                  {relatedIdeas.map(idea => (
                    <div key={idea.id} className={`flex items-center gap-2 py-1.5`}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(idea.category) }} />
                      <span className={`text-xs ${textMain} truncate`}>{idea.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Default: upcoming events */}
              <div className={`rounded-xl border p-4 ${cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={14} className="text-brand-400" />
                  <h3 className={`text-xs font-semibold ${textMain}`}>Campaign Intelligence</h3>
                </div>
                <p className={`text-xs ${textMuted} mb-3`}>Click a date on the calendar to see detailed intelligence including campaigns, awareness days, and suggested ideas.</p>
                <div className={`p-3 rounded-lg ${subCardBg}`}>
                  <p className={`text-xs font-semibold ${textMain}`}>{activeCampaignsThisMonth.length} campaigns active this month</p>
                  <p className={`text-[10px] ${textMuted} mt-1`}>Total budget: £{activeCampaignsThisMonth.reduce((s, c) => s + c.budget, 0).toLocaleString()}</p>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <h3 className={`text-xs font-semibold ${textMain}`}>Upcoming Awareness Days</h3>
                </div>
                {monthAwareness.length === 0 ? (
                  <p className={`text-xs ${textMuted}`}>No awareness days this month</p>
                ) : monthAwareness.map(a => (
                  <div key={a.name} className={`flex items-center gap-2 py-1.5`}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(a.category) }} />
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${textMain}`}>{a.name}</p>
                      <p className={`text-[10px] ${textMuted}`}>{new Date(a.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
