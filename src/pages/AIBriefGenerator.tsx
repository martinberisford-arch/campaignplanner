import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Copy, Download, CheckCircle2, Target, Users, Megaphone, Clock, DollarSign, AlertTriangle, MessageSquare, Zap, HelpCircle, ChevronDown, ChevronRight, Lightbulb, X } from 'lucide-react';
import { AIBrief } from '../types';

// ============ PROMPT BUILDER DATA (from marketing skills best-practice) ============

const campaignTypes = [
  { id: 'recruitment', label: '👥 Staff Recruitment', desc: 'Attract and hire new employees', promptFragment: 'a staff recruitment campaign' },
  { id: 'awareness', label: '📢 Awareness / Behaviour Change', desc: 'Raise awareness about a topic or service', promptFragment: 'an awareness and behaviour change campaign' },
  { id: 'engagement', label: '💬 Stakeholder Engagement', desc: 'Engage patients, residents, or communities', promptFragment: 'a stakeholder engagement campaign' },
  { id: 'event', label: '🎪 Event Promotion', desc: 'Promote a conference, webinar, or open day', promptFragment: 'an event promotion campaign' },
  { id: 'internal', label: '🏢 Internal Communications', desc: 'Communicate with staff about changes or programmes', promptFragment: 'an internal communications campaign' },
  { id: 'digital', label: '🌐 Digital / Website Launch', desc: 'Promote a new website, app, or digital service', promptFragment: 'a digital service launch campaign' },
  { id: 'crisis', label: '🚨 Crisis / Urgent Comms', desc: 'Time-sensitive communications response', promptFragment: 'a crisis communications response' },
  { id: 'brand', label: '🎨 Brand / Reputation', desc: 'Build or refresh your organisational brand', promptFragment: 'a brand and reputation campaign' },
];

const sectorExamples = [
  { id: 'nhs', label: '🏥 NHS / Healthcare', example: 'for NHS trusts across England' },
  { id: 'council', label: '🏛️ Local Government', example: 'for local council residents' },
  { id: 'university', label: '🎓 University / Education', example: 'for university students and staff' },
  { id: 'charity', label: '💛 Non-Profit / Charity', example: 'for charity supporters and beneficiaries' },
  { id: 'government', label: '🇬🇧 Central Government', example: 'for UK government stakeholders' },
  { id: 'other', label: '🏢 Other', example: '' },
];

const audiencePresets = [
  'General public', 'Healthcare professionals', 'NHS staff', 'Young people (16-25)',
  'Parents and carers', 'Over 65s', 'Employers', 'Students', 'Local residents',
  'Clinical staff', 'Teachers / educators', 'Job seekers', 'Ethnic minority communities',
  'People with disabilities', 'Senior leaders', 'Volunteers',
];

const channelPresets = [
  '📱 Social media', '📧 Email', '🔍 Google Ads', '📺 Video', '📰 PR / Media',
  '📝 Blog / Content', '🎪 Events', '📬 Direct mail', '📻 Radio', '🖥️ Display ads',
  '🤝 Partnerships', '📱 SMS', '🎙️ Podcasts',
];

const budgetRanges = [
  { label: '£5k - £20k', value: '15000', desc: 'Small — single channel, short campaign' },
  { label: '£20k - £75k', value: '50000', desc: 'Medium — multi-channel, 4-8 weeks' },
  { label: '£75k - £200k', value: '150000', desc: 'Large — full campaign, 6-12 weeks' },
  { label: '£200k - £500k', value: '350000', desc: 'Enterprise — national, multi-phase' },
  { label: '£500k+', value: '750000', desc: 'Major — large-scale national programme' },
];

const durationOptions = [
  { label: '2 weeks', value: '2' }, { label: '4 weeks', value: '4' },
  { label: '6 weeks', value: '6' }, { label: '8 weeks', value: '8' },
  { label: '12 weeks', value: '12' }, { label: '6 months', value: '26' },
];

const goalTemplates: Record<string, string[]> = {
  recruitment: ['Receive X applications for [role]', 'Fill X vacancies by [date]', 'Increase awareness of the role by X%', 'Reduce time-to-hire by X%'],
  awareness: ['Reach X people with key messages', 'Achieve X% awareness uplift (pre/post survey)', 'Drive X visits to information page', 'Increase X behaviour by X%'],
  engagement: ['Achieve X responses to consultation', 'Reach X stakeholders', 'Achieve X% satisfaction score', 'Generate X pieces of feedback'],
  event: ['Achieve X registrations', 'Reach X attendance', 'Achieve NPS score of X', 'Generate X follow-up enquiries'],
  internal: ['Achieve X% staff awareness', 'Drive X intranet page visits', 'Achieve X% survey completion', 'Reduce X by X%'],
  digital: ['Drive X sign-ups / downloads', 'Achieve X monthly active users', 'Reach X page views in first month', 'Achieve task completion rate of X%'],
  crisis: ['Issue public statement within X hours', 'Reach X% of affected population', 'Achieve X media coverage pieces', 'Resolve public concerns within X days'],
  brand: ['Achieve X% brand recognition uplift', 'Generate X earned media mentions', 'Improve sentiment score by X points', 'Achieve X social media followers'],
};

const promptTips = [
  { emoji: '🎯', title: 'Be specific about your goal', desc: 'Instead of "raise awareness", say "increase vaccination uptake by 15% among over-65s in London"' },
  { emoji: '👥', title: 'Describe who you want to reach', desc: 'The more specific your audience, the better the channel recommendations. Include age, location, profession.' },
  { emoji: '💰', title: 'Include your budget', desc: 'Even a rough figure helps the AI allocate channels realistically. Say "budget around £50k" or "limited budget under £10k".' },
  { emoji: '📅', title: 'Mention your timeline', desc: 'Say "over 8 weeks" or "launching in March for 3 months" so the AI can build a realistic phased plan.' },
  { emoji: '📍', title: 'Add context about your sector', desc: 'Mention if you\'re NHS, a council, or a university — the AI adapts recommendations for your compliance and audience needs.' },
  { emoji: '📊', title: 'State what success looks like', desc: 'If you know your targets (e.g., "200 applications" or "10,000 page views"), include them.' },
];

const samplePrompts = [
  "Plan a nation-wide staff recruitment campaign for primary care coaches over 8 weeks with budget £150k",
  "Create a winter flu vaccination awareness campaign targeting over-65s across London NHS trusts",
  "Design a mental health awareness programme for university students running over 4 weeks with £45k budget",
  "Launch an internal digital transformation communications campaign for NHS trust staff over 12 weeks",
];

const generateBrief = (prompt: string): AIBrief => {
  const hasBudget = prompt.match(/£([\d,]+k?)/i);
  const budget = hasBudget ? parseInt(hasBudget[1].replace(/,/g, '').replace('k', '000')) : 100000;
  const hasWeeks = prompt.match(/(\d+)\s*weeks?/i);
  const weeks = hasWeeks ? parseInt(hasWeeks[1]) : 8;

  return {
    title: prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt,
    objective: `Execute a comprehensive, multi-channel campaign to achieve measurable outcomes over ${weeks} weeks with a total investment of £${(budget/1000).toFixed(0)}k. This campaign will leverage data-driven strategies, cross-sector benchmarks, and AI-optimised channel allocation to maximise ROI and stakeholder engagement.`,
    audiences: [
      'Primary target: Healthcare professionals and clinical staff aged 25-45',
      'Secondary target: Career changers with transferable skills in health and social care',
      'Tertiary target: Recent graduates from health sciences and allied health programmes',
      'Influencer segment: NHS trust HR directors and hiring managers',
    ],
    channels: [
      { name: 'Social Media (LinkedIn, Facebook, Instagram)', allocation: Math.round(budget * 0.30), rationale: 'Highest reach for professional audiences. LinkedIn for career-stage targeting, Meta for broad awareness.' },
      { name: 'Paid Search (Google Ads)', allocation: Math.round(budget * 0.20), rationale: 'Capture high-intent searches. Estimated 3.2% CTR based on NHS recruitment benchmarks.' },
      { name: 'Email Marketing', allocation: Math.round(budget * 0.10), rationale: 'Nurture existing subscriber base. 28% open rate expected for sector.' },
      { name: 'Content Marketing & SEO', allocation: Math.round(budget * 0.15), rationale: 'Long-form content, blog posts, case studies to build authority and organic traffic.' },
      { name: 'Events & Webinars', allocation: Math.round(budget * 0.12), rationale: 'Virtual and in-person engagement events with Q&A sessions.' },
      { name: 'PR & Media Relations', allocation: Math.round(budget * 0.08), rationale: 'Trade press coverage and NHS media partnerships.' },
      { name: 'Programmatic Display', allocation: Math.round(budget * 0.05), rationale: 'Retargeting engaged visitors. Geo-targeted to priority regions.' },
    ],
    timeline: [
      { phase: 'Discovery & Planning', weeks: `Week 1-${Math.ceil(weeks*0.15)}`, activities: ['Stakeholder alignment workshops', 'Audience research & segmentation', 'Channel benchmarking analysis', 'Creative brief development'] },
      { phase: 'Content Creation', weeks: `Week ${Math.ceil(weeks*0.15)+1}-${Math.ceil(weeks*0.35)}`, activities: ['Asset design & production', 'Copy creation & review', 'Video testimonial filming', 'Landing page development'] },
      { phase: 'Soft Launch', weeks: `Week ${Math.ceil(weeks*0.35)+1}-${Math.ceil(weeks*0.5)}`, activities: ['A/B testing launch', 'Email sequence activation', 'Social media rollout', 'PR embargo lift'] },
      { phase: 'Full Campaign', weeks: `Week ${Math.ceil(weeks*0.5)+1}-${Math.ceil(weeks*0.85)}`, activities: ['Full paid media activation', 'Event series launch', 'Influencer partnerships', 'Weekly performance optimisation'] },
      { phase: 'Evaluation & Close', weeks: `Week ${Math.ceil(weeks*0.85)+1}-${weeks}`, activities: ['Performance analysis', 'Stakeholder reporting', 'Lessons learned workshop', 'ROI calculation & presentation'] },
    ],
    budget: [
      { category: 'Media Buy (Paid)', amount: Math.round(budget * 0.45), percentage: 45 },
      { category: 'Creative Production', amount: Math.round(budget * 0.20), percentage: 20 },
      { category: 'Technology & Tools', amount: Math.round(budget * 0.10), percentage: 10 },
      { category: 'Events & Engagement', amount: Math.round(budget * 0.12), percentage: 12 },
      { category: 'Agency & Consultancy', amount: Math.round(budget * 0.08), percentage: 8 },
      { category: 'Contingency', amount: Math.round(budget * 0.05), percentage: 5 },
    ],
    risks: [
      { risk: 'Budget overrun on paid media', impact: 'High', mitigation: 'Daily spend caps, weekly budget reviews, automated alerts at 80% threshold' },
      { risk: 'Low application quality', impact: 'Medium', mitigation: 'Refine targeting parameters, add qualification questions to landing page' },
      { risk: 'Stakeholder approval delays', impact: 'High', mitigation: 'Pre-approved content calendar, delegated authority framework, 48-hour SLA' },
      { risk: 'Platform algorithm changes', impact: 'Medium', mitigation: 'Diversified channel strategy, organic content backup, monitoring dashboards' },
      { risk: 'Negative PR or social backlash', impact: 'High', mitigation: 'Crisis comms plan, social listening tools, rapid response team on standby' },
    ],
    kpis: [
      { metric: 'Total Applications', target: `${Math.round(budget / 3)}+`, measurement: 'Application tracking system + UTM parameters' },
      { metric: 'Cost per Application', target: `<£${(3).toFixed(2)}`, measurement: 'Total spend / qualified applications' },
      { metric: 'Website Visits', target: `${Math.round(budget * 3.5).toLocaleString()}+`, measurement: 'GA4 sessions with campaign source' },
      { metric: 'Social Engagement Rate', target: '>4.5%', measurement: 'Engagements / impressions across platforms' },
      { metric: 'Email Open Rate', target: '>28%', measurement: 'Email platform analytics' },
      { metric: 'Brand Awareness Lift', target: '+15%', measurement: 'Pre/post campaign survey' },
    ],
    messaging: [
      { audience: 'Healthcare Professionals', keyMessage: 'Shape the future of primary care. Your expertise matters.', tone: 'Empowering, professional, purposeful' },
      { audience: 'Career Changers', keyMessage: 'Your next career move could transform communities.', tone: 'Inspirational, accessible, supportive' },
      { audience: 'Recent Graduates', keyMessage: 'Start your career where it matters most.', tone: 'Energetic, aspirational, modern' },
      { audience: 'Hiring Managers', keyMessage: 'We\'re building the workforce your communities need.', tone: 'Strategic, evidence-based, collaborative' },
    ],
    totalBudget: budget,
    duration: `${weeks} weeks`,
  };
};

export default function AIBriefGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState<AIBrief | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [streamText, setStreamText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prompt Builder state
  const [builderType, setBuilderType] = useState('');
  const [builderSector, setBuilderSector] = useState('');
  const [builderAudiences, setBuilderAudiences] = useState<string[]>([]);
  const [builderChannels, setBuilderChannels] = useState<string[]>([]);
  const [builderBudget, setBuilderBudget] = useState('');
  const [builderDuration, setBuilderDuration] = useState('');
  const [builderGoal, setBuilderGoal] = useState('');
  const [builderContext, setBuilderContext] = useState('');
  const [builderStep, setBuilderStep] = useState(1);
  const [expandedGoalSection, setExpandedGoalSection] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setBrief(null);
    setStreamText('');
    setActiveSection('overview');

    const steps = [
      'Analysing prompt and extracting parameters...',
      'Researching sector benchmarks and comparables...',
      'Generating audience segmentation...',
      'Optimising channel mix allocation...',
      'Building timeline and workload forecast...',
      'Calculating budget distribution...',
      'Assessing risks and mitigation strategies...',
      'Generating messaging frameworks...',
      'Compiling final brief...',
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setStreamText(steps[i]);
        i++;
      } else {
        clearInterval(interval);
        const generated = generateBrief(prompt);
        setBrief(generated);
        setIsGenerating(false);
      }
    }, 400);
  };

  const handleCopy = () => {
    if (!brief) return;
    navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildPromptFromWizard = () => {
    const typeInfo = campaignTypes.find(t => t.id === builderType);
    const sectorInfo = sectorExamples.find(s => s.id === builderSector);

    let builtPrompt = `Plan ${typeInfo?.promptFragment || 'a campaign'}`;
    if (sectorInfo && sectorInfo.example) builtPrompt += ` ${sectorInfo.example}`;
    if (builderGoal) builtPrompt += ` to ${builderGoal}`;
    if (builderAudiences.length > 0) builtPrompt += ` targeting ${builderAudiences.join(', ')}`;
    if (builderDuration) builtPrompt += ` over ${builderDuration} weeks`;
    if (builderBudget) builtPrompt += ` with budget £${parseInt(builderBudget).toLocaleString()}`;
    if (builderChannels.length > 0) builtPrompt += `. Preferred channels: ${builderChannels.join(', ')}`;
    if (builderContext) builtPrompt += `. Additional context: ${builderContext}`;

    setPrompt(builtPrompt);
    setShowPromptBuilder(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  const sections = [
    { id: 'overview', label: 'Overview', icon: <Target size={14} /> },
    { id: 'audiences', label: 'Audiences', icon: <Users size={14} /> },
    { id: 'channels', label: 'Channels', icon: <Megaphone size={14} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
    { id: 'budget', label: 'Budget', icon: <DollarSign size={14} /> },
    { id: 'risks', label: 'Risks', icon: <AlertTriangle size={14} /> },
    { id: 'messaging', label: 'Messaging', icon: <MessageSquare size={14} /> },
    { id: 'kpis', label: 'KPIs', icon: <Zap size={14} /> },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full mb-4">
          <Sparkles size={14} className="text-brand-400" />
          <span className="text-xs font-semibold text-brand-400">AI-Powered Brief Generation</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Campaign Brief Generator</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">
          Describe your campaign in your own words — you don't need to be a marketing expert.
          Our AI will create a full professional brief with channels, timeline, budget, and KPIs.
        </p>
      </div>

      {/* Help Section for Non-Marketeers */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex gap-3">
          <button onClick={() => setShowPromptBuilder(true)}
            className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-r from-brand-600/20 to-violet-600/20 border border-brand-500/30 rounded-2xl hover:border-brand-500/50 transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500/30 transition-colors">
              <Lightbulb size={24} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-300">Not sure what to write? Use the Prompt Builder</p>
              <p className="text-xs text-slate-400 mt-0.5">Answer simple questions and we'll write the prompt for you — no marketing jargon needed</p>
            </div>
            <ChevronRight size={18} className="text-brand-400 flex-shrink-0" />
          </button>

          <button onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 transition-colors text-left flex-shrink-0">
            <HelpCircle size={18} className="text-amber-400" />
            <span className="text-xs font-medium text-slate-300 hidden md:inline">Writing Tips</span>
          </button>
        </div>

        {/* Tips Panel */}
        {showTips && (
          <div className="mt-4 bg-slate-900 border border-amber-500/20 rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <HelpCircle size={16} className="text-amber-400" />
                How to write a great campaign prompt
              </h3>
              <button onClick={() => setShowTips(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {promptTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-lg flex-shrink-0">{tip.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{tip.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <p className="text-xs text-emerald-300 font-semibold mb-1">💡 Example of a great prompt:</p>
              <p className="text-xs text-slate-300 italic">"Plan a staff recruitment campaign for NHS primary care coaches, targeting healthcare professionals and career changers aged 25-45, running over 8 weeks with a budget of £150k. Use social media, Google Ads, and email. We need 200 applications."</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your campaign in plain English... e.g., 'We need to recruit 200 nurses across London over 8 weeks with a budget of around £150k'"
            className="w-full bg-transparent text-white placeholder:text-slate-500 resize-none focus:outline-none text-sm leading-relaxed min-h-[80px]"
            rows={3}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Sparkles size={12} /> GPT-4 powered · Public sector optimised · UK GDPR compliant
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all"
            >
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Send size={16} /> Generate Brief</>}
            </button>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="mt-4">
          <span className="text-xs text-slate-500 mb-2 block">Or try one of these examples:</span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((sp, i) => (
              <button key={i} onClick={() => setPrompt(sp)}
                className="text-xs px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors truncate max-w-[320px]">
                {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generating animation */}
      {isGenerating && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-xl shadow-brand-500/30 animate-pulse">
                <Sparkles size={28} />
              </div>
            </div>
            <p className="text-sm text-brand-300 typing-cursor mb-2">{streamText}</p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-brand-500 rounded-full" style={{ animation: `pulse-dot 1.4s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generated Brief */}
      {brief && !isGenerating && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-success-500" />
              <span className="text-sm font-semibold text-success-500">Brief generated successfully</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors">
                {copied ? <><CheckCircle2 size={14} className="text-success-500" /> Copied!</> : <><Copy size={14} /> Copy JSON</>}
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors">
                <Download size={14} /> Export PDF
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold transition-colors">
                Create Campaign
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeSection === s.id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >{s.icon} {s.label}</button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {activeSection === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                <div><h2 className="text-xl font-bold mb-2">{brief.title}</h2><div className="flex items-center gap-4 text-sm text-slate-400"><span className="flex items-center gap-1"><Clock size={14} /> {brief.duration}</span><span className="flex items-center gap-1"><DollarSign size={14} /> £{(brief.totalBudget/1000).toFixed(0)}k total budget</span></div></div>
                <div><h3 className="text-sm font-semibold text-slate-300 mb-2">Campaign Objective</h3><p className="text-sm text-slate-400 leading-relaxed">{brief.objective}</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4"><div className="text-2xl font-bold text-brand-400">{brief.channels.length}</div><div className="text-xs text-slate-500 mt-1">Channels</div></div>
                  <div className="bg-slate-800/50 rounded-xl p-4"><div className="text-2xl font-bold text-emerald-400">{brief.timeline.length}</div><div className="text-xs text-slate-500 mt-1">Phases</div></div>
                  <div className="bg-slate-800/50 rounded-xl p-4"><div className="text-2xl font-bold text-amber-400">{brief.kpis.length}</div><div className="text-xs text-slate-500 mt-1">KPIs Tracked</div></div>
                </div>
              </div>
            )}
            {activeSection === 'audiences' && (<div className="space-y-3 animate-fade-in"><h3 className="text-lg font-bold mb-4">Target Audiences</h3>{brief.audiences.map((a, i) => (<div key={i} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl"><div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">{i + 1}</div><p className="text-sm text-slate-300 leading-relaxed">{a}</p></div>))}</div>)}
            {activeSection === 'channels' && (<div className="space-y-4 animate-fade-in"><h3 className="text-lg font-bold mb-4">Channel Mix & Allocation</h3>{brief.channels.map((ch, i) => (<div key={i} className="p-4 bg-slate-800/50 rounded-xl"><div className="flex items-center justify-between mb-2"><h4 className="text-sm font-semibold">{ch.name}</h4><span className="text-sm font-bold text-brand-400">£{(ch.allocation / 1000).toFixed(1)}k</span></div><p className="text-xs text-slate-400 mb-3">{ch.rationale}</p><div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all" style={{ width: `${(ch.allocation / brief.totalBudget) * 100}%` }} /></div><div className="text-right text-[10px] text-slate-500 mt-1">{((ch.allocation / brief.totalBudget) * 100).toFixed(0)}% of budget</div></div>))}</div>)}
            {activeSection === 'timeline' && (<div className="space-y-4 animate-fade-in"><h3 className="text-lg font-bold mb-4">Campaign Timeline</h3><div className="relative"><div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />{brief.timeline.map((phase, i) => (<div key={i} className="relative pl-12 pb-8 last:pb-0"><div className="absolute left-2.5 w-4 h-4 rounded-full bg-brand-600 border-2 border-slate-900 z-10" /><div className="bg-slate-800/50 rounded-xl p-4"><div className="flex items-center justify-between mb-2"><h4 className="font-semibold text-sm">{phase.phase}</h4><span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded-full">{phase.weeks}</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{phase.activities.map((act, j) => (<div key={j} className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 size={12} className="text-slate-600 flex-shrink-0" />{act}</div>))}</div></div></div>))}</div></div>)}
            {activeSection === 'budget' && (<div className="space-y-4 animate-fade-in"><h3 className="text-lg font-bold mb-4">Budget Breakdown</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{brief.budget.map((b, i) => (<div key={i} className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-lg font-bold text-brand-400">{b.percentage}%</div><div className="flex-1"><p className="text-sm font-medium">{b.category}</p><p className="text-lg font-bold text-brand-400">£{(b.amount / 1000).toFixed(1)}k</p></div></div>))}</div><div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-center"><p className="text-sm text-slate-400">Total Campaign Investment</p><p className="text-3xl font-bold text-brand-400 mt-1">£{(brief.totalBudget / 1000).toFixed(0)}k</p></div></div>)}
            {activeSection === 'risks' && (<div className="space-y-4 animate-fade-in"><h3 className="text-lg font-bold mb-4">Risk Assessment & Mitigation</h3>{brief.risks.map((r, i) => (<div key={i} className="bg-slate-800/50 rounded-xl p-4"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><AlertTriangle size={16} className={r.impact === 'High' ? 'text-danger-500' : 'text-warning-500'} /><h4 className="text-sm font-semibold">{r.risk}</h4></div><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.impact === 'High' ? 'bg-danger-500/20 text-danger-500' : 'bg-warning-500/20 text-warning-500'}`}>{r.impact} Impact</span></div><p className="text-xs text-slate-400"><span className="text-slate-300 font-medium">Mitigation: </span>{r.mitigation}</p></div>))}</div>)}
            {activeSection === 'messaging' && (<div className="space-y-4 animate-fade-in"><h3 className="text-lg font-bold mb-4">Messaging Framework</h3>{brief.messaging.map((m, i) => (<div key={i} className="bg-slate-800/50 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><Users size={14} className="text-brand-400" /><span className="text-xs font-semibold text-brand-400">{m.audience}</span></div><p className="text-base font-semibold mb-2">"{m.keyMessage}"</p><p className="text-xs text-slate-500">Tone: {m.tone}</p></div>))}</div>)}
            {activeSection === 'kpis' && (<div className="space-y-4 animate-fade-in"><h3 className="text-lg font-bold mb-4">Key Performance Indicators</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{brief.kpis.map((k, i) => (<div key={i} className="bg-slate-800/50 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><Target size={14} className="text-brand-400" /><h4 className="text-sm font-semibold">{k.metric}</h4></div><p className="text-xl font-bold text-brand-400 mb-1">{k.target}</p><p className="text-[10px] text-slate-500">Measured via: {k.measurement}</p></div>))}</div></div>)}
          </div>
        </div>
      )}

      {/* ========== PROMPT BUILDER WIZARD MODAL ========== */}
      {showPromptBuilder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPromptBuilder(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><Lightbulb size={20} className="text-brand-400" /> Prompt Builder</h2>
                <p className="text-xs text-slate-400 mt-0.5">Answer these simple questions — no marketing knowledge needed</p>
              </div>
              <button onClick={() => setShowPromptBuilder(false)} className="p-2 hover:bg-slate-800 rounded-xl"><X size={18} className="text-slate-400" /></button>
            </div>

            {/* Step Progress */}
            <div className="px-5 pt-4">
              <div className="flex items-center gap-3 mb-1">
                {[1,2,3,4].map(s => (
                  <div key={s} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all ${builderStep >= s ? 'bg-brand-500' : 'bg-slate-700'}`} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Step {builderStep} of 4</p>
            </div>

            <div className="p-5">
              {/* Step 1: What & Who */}
              {builderStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="text-sm font-semibold mb-3 block">What type of campaign is this?</label>
                    <p className="text-xs text-slate-400 mb-3">Pick the one that best describes what you're trying to do</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {campaignTypes.map(ct => (
                        <button key={ct.id} onClick={() => setBuilderType(ct.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                            builderType === ct.id ? 'bg-brand-600/10 border-brand-500/40 ring-1 ring-brand-500/20' : 'border-slate-700 hover:bg-slate-800'
                          }`}>
                          <span className="text-lg">{ct.label.split(' ')[0]}</span>
                          <div>
                            <p className="text-xs font-semibold">{ct.label.split(' ').slice(1).join(' ')}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{ct.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-3 block">What sector are you in?</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {sectorExamples.map(s => (
                        <button key={s.id} onClick={() => setBuilderSector(s.id)}
                          className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                            builderSector === s.id ? 'bg-brand-600/10 border-brand-500/40' : 'border-slate-700 hover:bg-slate-800'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Goals & Audience */}
              {builderStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">What's the main goal?</label>
                    <p className="text-xs text-slate-400 mb-3">Write it in your own words — for example "get 200 people to apply for the nurse role"</p>
                    <textarea value={builderGoal} onChange={e => setBuilderGoal(e.target.value)}
                      placeholder="e.g., Recruit 200 primary care coaches, or Increase flu vaccine uptake by 15%"
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none" />

                    {builderType && goalTemplates[builderType] && (
                      <div className="mt-2">
                        <button onClick={() => setExpandedGoalSection(!expandedGoalSection)} className="flex items-center gap-1 text-[10px] text-brand-400 font-medium hover:text-brand-300">
                          {expandedGoalSection ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          Need inspiration? See example goals
                        </button>
                        {expandedGoalSection && (
                          <div className="mt-2 flex flex-wrap gap-1.5 animate-fade-in">
                            {goalTemplates[builderType].map((g, i) => (
                              <button key={i} onClick={() => setBuilderGoal(g)}
                                className="text-[10px] px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:border-brand-500/40 hover:text-white transition-colors">
                                {g}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">Who are you trying to reach?</label>
                    <p className="text-xs text-slate-400 mb-3">Select all that apply, or type your own in the box below</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {audiencePresets.map(a => (
                        <button key={a} onClick={() => setBuilderAudiences(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                          className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                            builderAudiences.includes(a)
                              ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                              : 'border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                          {a}
                        </button>
                      ))}
                    </div>
                    {builderAudiences.length > 0 && (
                      <p className="text-[10px] text-emerald-400">✓ Selected: {builderAudiences.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Budget, Duration, Channels */}
              {builderStep === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">What's your approximate budget?</label>
                    <p className="text-xs text-slate-400 mb-3">Don't worry if it's not exact — a rough range helps the AI plan realistically</p>
                    <div className="grid grid-cols-1 gap-2">
                      {budgetRanges.map(br => (
                        <button key={br.value} onClick={() => setBuilderBudget(br.value)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            builderBudget === br.value ? 'bg-brand-600/10 border-brand-500/40' : 'border-slate-700 hover:bg-slate-800'
                          }`}>
                          <span className="text-sm font-semibold">{br.label}</span>
                          <span className="text-[10px] text-slate-500">{br.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">How long should the campaign run?</label>
                    <div className="flex flex-wrap gap-2">
                      {durationOptions.map(d => (
                        <button key={d.value} onClick={() => setBuilderDuration(d.value)}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            builderDuration === d.value ? 'bg-brand-600/10 border-brand-500/40 text-brand-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">Any preferred channels? (optional)</label>
                    <p className="text-xs text-slate-400 mb-3">Select if you have preferences — otherwise the AI will recommend the best mix</p>
                    <div className="flex flex-wrap gap-1.5">
                      {channelPresets.map(ch => (
                        <button key={ch} onClick={() => setBuilderChannels(prev => prev.includes(ch) ? prev.filter(x => x !== ch) : [...prev, ch])}
                          className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                            builderChannels.includes(ch) ? 'bg-brand-600/20 border-brand-500/40 text-brand-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Generate */}
              {builderStep === 4 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Anything else the AI should know? (optional)</label>
                    <p className="text-xs text-slate-400 mb-3">Any special requirements, constraints, or context — write in plain English</p>
                    <textarea value={builderContext} onChange={e => setBuilderContext(e.target.value)}
                      placeholder="e.g., We need BSL-accessible materials, must comply with NHS brand guidelines, focus on North West England..."
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none" />
                  </div>

                  {/* Preview */}
                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Your generated prompt preview</h4>
                    <p className="text-sm text-white leading-relaxed">
                      {(() => {
                        const typeInfo = campaignTypes.find(t => t.id === builderType);
                        const sectorInfo = sectorExamples.find(s => s.id === builderSector);
                        let preview = `Plan ${typeInfo?.promptFragment || 'a campaign'}`;
                        if (sectorInfo && sectorInfo.example) preview += ` ${sectorInfo.example}`;
                        if (builderGoal) preview += ` to ${builderGoal}`;
                        if (builderAudiences.length > 0) preview += ` targeting ${builderAudiences.join(', ')}`;
                        if (builderDuration) preview += ` over ${builderDuration} weeks`;
                        if (builderBudget) preview += ` with budget £${parseInt(builderBudget).toLocaleString()}`;
                        if (builderChannels.length > 0) preview += `. Preferred channels: ${builderChannels.join(', ')}`;
                        if (builderContext) preview += `. Additional context: ${builderContext}`;
                        return preview;
                      })()}
                    </p>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 size={14} /> This prompt will generate a full campaign brief including channel strategy, timeline, budget allocation, risk assessment, messaging frameworks, and KPIs.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
                {builderStep > 1 ? (
                  <button onClick={() => setBuilderStep(s => s - 1)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">Back</button>
                ) : (
                  <button onClick={() => setShowPromptBuilder(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                )}
                {builderStep < 4 ? (
                  <button onClick={() => setBuilderStep(s => s + 1)}
                    disabled={builderStep === 1 && !builderType}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                    Continue
                  </button>
                ) : (
                  <button onClick={() => { buildPromptFromWizard(); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all">
                    <Sparkles size={16} /> Use This Prompt
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
