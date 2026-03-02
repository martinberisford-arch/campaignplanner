import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { ContentFormat } from '../types';
import { generateContentIdeas } from '../utils/ideaEngine';
import { AWARENESS_EVENTS, getUpcomingEvents } from '../data/awarenessEvents';
import { MENTAL_MODELS } from '../data/mentalModels';
import {
  Lightbulb, Calendar, Users, Target, Sparkles,
  ChevronRight, BookOpen, Video, Mail, FileText,
  Image, Megaphone, CheckCircle2, Plus, Brain
} from 'lucide-react';

const FORMAT_CONFIG: Record<ContentFormat, { label: string; icon: React.ReactNode; color: string }> = {
  'blog': { label: 'Blog Post', icon: <FileText size={16} />, color: 'text-blue-400' },
  'email': { label: 'Email', icon: <Mail size={16} />, color: 'text-emerald-400' },
  'social': { label: 'Social Post', icon: <Megaphone size={16} />, color: 'text-pink-400' },
  'carousel': { label: 'Carousel', icon: <Image size={16} />, color: 'text-violet-400' },
  'video': { label: 'Video', icon: <Video size={16} />, color: 'text-red-400' },
  'newsletter': { label: 'Newsletter', icon: <BookOpen size={16} />, color: 'text-amber-400' },
  'press-release': { label: 'Press Release', icon: <FileText size={16} />, color: 'text-slate-400' },
  'case-study': { label: 'Case Study', icon: <Target size={16} />, color: 'text-teal-400' },
};

const AUDIENCE_SEGMENTS = [
  'Healthcare professionals',
  'NHS staff',
  'Primary care teams',
  'Hospital managers',
  'Community services',
  'Mental health workers',
  'Social care staff',
  'Commissioners',
  'Patients & carers',
  'General public',
  'Local authorities',
  'Charity partners',
  'Academic researchers',
  'Students & trainees',
];

const KPI_OBJECTIVES = [
  'Increase engagement',
  'Drive conversions',
  'Generate leads',
  'Boost awareness',
  'Improve retention',
  'Encourage referrals',
  'Build authority',
  'Grow community',
];

export default function MktIdeation() {
  const { marketingIdeas, theme, setView } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAudience, setSelectedAudience] = useState('');
  const [selectedKpi, setSelectedKpi] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat | ''>('');
  const [selectedEvent, setSelectedEvent] = useState<string | ''>('');
  const [generatedIdeas, setGeneratedIdeas] = useState<ReturnType<typeof generateContentIdeas>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<typeof generatedIdeas[0] | null>(null);

  const isDark = theme === 'dark';

  // Get upcoming awareness events
  const upcomingEvents = useMemo(() => getUpcomingEvents(60), []);
  const allEvents = AWARENESS_EVENTS;

  const handleGenerate = async () => {
    if (!selectedAudience || !selectedKpi || !selectedFormat) return;

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate generation

    const event = selectedEvent ? allEvents.find(e => e.id === selectedEvent) : undefined;

    const ideas = generateContentIdeas({
      audienceSegment: selectedAudience,
      kpiObjective: selectedKpi,
      contentFormat: selectedFormat as ContentFormat,
      awarenessEvent: event,
      marketingIdeas,
    });

    setGeneratedIdeas(ideas);
    setIsGenerating(false);
    setStep(2);
  };

  const getMentalModel = (modelId: string) => MENTAL_MODELS.find(m => m.id === modelId);

  const handleSelectIdea = (idea: typeof generatedIdeas[0]) => {
    setSelectedIdea(idea);
  };

  const handleCreateBrief = () => {
    setView('mkt-brief');
  };

  const resetGenerator = () => {
    setStep(1);
    setGeneratedIdeas([]);
    setSelectedIdea(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Lightbulb size={20} className="text-white" />
            </div>
            Content Ideation Engine
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Generate targeted content ideas based on your audience and goals
          </p>
        </div>
        {step === 2 && (
          <button
            onClick={resetGenerator}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            Start Over
          </button>
        )}
      </div>

      {/* Step 1: Input Form */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Generator Form */}
          <div className={`lg:col-span-2 rounded-2xl border p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h2 className="font-semibold mb-6 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              Generate Content Ideas
            </h2>

            <div className="space-y-6">
              {/* Audience Segment */}
              <div>
                <label className={`text-xs font-semibold block mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Users size={12} className="inline mr-1" /> Target Audience *
                </label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_SEGMENTS.map(aud => (
                    <button
                      key={aud}
                      onClick={() => setSelectedAudience(aud)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedAudience === aud
                          ? 'bg-brand-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Objective */}
              <div>
                <label className={`text-xs font-semibold block mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Target size={12} className="inline mr-1" /> KPI Objective *
                </label>
                <div className="flex flex-wrap gap-2">
                  {KPI_OBJECTIVES.map(kpi => (
                    <button
                      key={kpi}
                      onClick={() => setSelectedKpi(kpi)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedKpi === kpi
                          ? 'bg-emerald-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {kpi}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Format */}
              <div>
                <label className={`text-xs font-semibold block mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  <FileText size={12} className="inline mr-1" /> Content Format *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFormat(key as ContentFormat)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        selectedFormat === key
                          ? 'bg-violet-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={selectedFormat === key ? 'text-white' : config.color}>{config.icon}</span>
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Awareness Event (Optional) */}
              <div>
                <label className={`text-xs font-semibold block mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  <Calendar size={12} className="inline mr-1" /> Awareness Event (optional)
                </label>
                <select
                  value={selectedEvent}
                  onChange={e => setSelectedEvent(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`}
                >
                  <option value="">No specific event</option>
                  <optgroup label="Upcoming Events">
                    {upcomingEvents.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</option>
                    ))}
                  </optgroup>
                  <optgroup label="All Events">
                    {allEvents.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedAudience || !selectedKpi || !selectedFormat || isGenerating}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Sparkles size={16} className="animate-pulse" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate 5 Content Ideas
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Awareness Calendar Panel */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-brand-400" />
              Upcoming Awareness Days
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No events in the next 60 days</p>
              ) : (
                upcomingEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedEvent === event.id
                        ? 'bg-brand-600/10 border-brand-500/30 border'
                        : isDark ? 'bg-slate-800/50 hover:bg-slate-800 border border-transparent' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <p className="text-xs font-semibold">{event.name}</p>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} · {event.category}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Generated Ideas */}
      {step === 2 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ideas List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-400" />
                Generated Ideas ({generatedIdeas.length})
              </h2>
              <div className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                {selectedAudience} · {selectedKpi} · {FORMAT_CONFIG[selectedFormat as ContentFormat]?.label}
              </div>
            </div>

            {generatedIdeas.map((idea, idx) => {
              const mentalModel = getMentalModel(idea.mentalModel);
              const isSelected = selectedIdea === idea;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectIdea(idea)}
                  className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/5'
                      : isDark ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <span className="text-lg font-bold text-amber-400">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{idea.title}</h3>
                      <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {idea.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                          Score: {idea.engagementScore.toFixed(1)}/10
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-100 text-violet-700'}`}>
                          CTA: {idea.suggestedCTA}
                        </span>
                        {mentalModel && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-100 text-pink-700'}`}>
                            <Brain size={10} /> {mentalModel.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`p-1.5 rounded-full ${isSelected ? 'bg-brand-500 text-white' : isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      {isSelected ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Idea Detail */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            {selectedIdea ? (
              <div className="space-y-4">
                <h3 className="font-semibold">{selectedIdea.title}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{selectedIdea.description}</p>

                <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <p className={`text-[10px] font-semibold uppercase mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Details</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Format</span>
                      <span className="font-medium">{FORMAT_CONFIG[selectedIdea.format]?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Engagement Score</span>
                      <span className="font-medium text-emerald-400">{selectedIdea.engagementScore.toFixed(1)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Suggested CTA</span>
                      <span className="font-medium">{selectedIdea.suggestedCTA}</span>
                    </div>
                    {selectedIdea.relatedIdeaId && (
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>139 Framework Link</span>
                        <span className="font-medium text-brand-400">#{selectedIdea.relatedIdeaId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {getMentalModel(selectedIdea.mentalModel) && (
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-violet-500/5 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Brain size={12} className="text-violet-400" />
                      <p className="text-xs font-semibold text-violet-400">{getMentalModel(selectedIdea.mentalModel)?.name}</p>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {getMentalModel(selectedIdea.mentalModel)?.application}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCreateBrief}
                  className="w-full py-3 bg-gradient-to-r from-brand-500 to-violet-600 hover:from-brand-400 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Create Content Brief
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb size={32} className={`mx-auto mb-3 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
                <p className="text-sm font-medium">Select an idea</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Click on an idea to see details and create a brief
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
