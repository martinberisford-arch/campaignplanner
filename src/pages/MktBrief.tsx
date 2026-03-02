import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ContentFormat } from '../types';
import { generateHeadline, generateOutline } from '../utils/ideaEngine';
import { MENTAL_MODELS } from '../data/mentalModels';
import {
  FileText, CheckCircle2, ArrowRight, ArrowLeft, Download,
  Copy, Send, Sparkles, Target, Users, BookOpen, Check
} from 'lucide-react';

const FORMAT_LABELS: Record<ContentFormat, string> = {
  'blog': 'Blog Post',
  'email': 'Email Campaign',
  'social': 'Social Media Post',
  'carousel': 'Carousel',
  'video': 'Video Script',
  'newsletter': 'Newsletter',
  'press-release': 'Press Release',
  'case-study': 'Case Study',
};

const DEFAULT_CRO_CHECKLIST = [
  { item: 'Clear headline with benefit statement', completed: false },
  { item: 'Above-the-fold CTA visible', completed: false },
  { item: 'Social proof element included', completed: false },
  { item: 'Mobile-responsive layout', completed: false },
  { item: 'Accessibility checked (alt text, contrast)', completed: false },
  { item: 'Brand guidelines followed', completed: false },
  { item: 'Tracking pixels/UTMs configured', completed: false },
  { item: 'Legal/compliance review if needed', completed: false },
];

export default function MktBrief() {
  const { theme, setView, addNotification } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [format, setFormat] = useState<ContentFormat>('blog');
  const [audience, setAudience] = useState('');
  const [kpiGoal, setKpiGoal] = useState('');
  const [cta, setCta] = useState('');
  const [mentalModelId, setMentalModelId] = useState('social-proof');

  // Generated brief data
  const [headline, setHeadline] = useState('');
  const [outline, setOutline] = useState<{ section: string; content: string }[]>([]);
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [croChecklist, setCroChecklist] = useState(DEFAULT_CRO_CHECKLIST);
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefGenerated, setBriefGenerated] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const isDark = theme === 'dark';

  const handleGenerateBrief = async () => {
    if (!ideaTitle || !audience || !kpiGoal) return;

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate headline
    const mockIdea = {
      id: 'temp',
      title: ideaTitle,
      description: ideaDescription,
      format,
      audience,
      kpiGoal,
      relatedIdeaId: '',
      mentalModel: mentalModelId,
      suggestedCTA: cta || 'Learn more',
      engagementScore: 7,
      createdAt: new Date().toISOString(),
      status: 'draft' as const,
    };

    const generatedHeadline = generateHeadline(mockIdea, audience);
    const generatedOutline = generateOutline(mockIdea, kpiGoal);

    setHeadline(generatedHeadline);
    setOutline(generatedOutline);
    setTalkingPoints([
      `Key benefit for ${audience}`,
      'Supporting statistic or data point',
      'Emotional connection / story element',
      'Urgency or timeliness factor',
    ]);
    setAssets([
      'Hero image (1200x630px)',
      'Author/source headshot',
      'Supporting infographic or chart',
      'Brand logo in correct format',
    ]);
    setCroChecklist(DEFAULT_CRO_CHECKLIST);

    setIsGenerating(false);
    setBriefGenerated(true);
    setStep(3);
  };

  const toggleChecklistItem = (idx: number) => {
    setCroChecklist(prev => prev.map((item, i) => 
      i === idx ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleExportPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>Content Brief: ${ideaTitle}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 24px; color: #6366f1; }
            h3 { font-size: 14px; margin-top: 16px; }
            p { font-size: 14px; line-height: 1.6; color: #374151; }
            .meta { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
            .section { margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; }
            ul { padding-left: 20px; }
            li { font-size: 13px; margin-bottom: 8px; }
            .checklist { list-style: none; padding: 0; }
            .checklist li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <h1>Content Brief: ${ideaTitle}</h1>
          <p class="meta">Format: ${FORMAT_LABELS[format]} | Audience: ${audience} | KPI: ${kpiGoal}</p>
          
          <h2>Headline</h2>
          <p style="font-size: 18px; font-weight: 600;">${headline}</p>
          
          <h2>Outline</h2>
          ${outline.map(s => `<div class="section"><h3>${s.section}</h3><p>${s.content}</p></div>`).join('')}
          
          <h2>Key Talking Points</h2>
          <ul>${talkingPoints.map(p => `<li>${p}</li>`).join('')}</ul>
          
          <h2>Call to Action</h2>
          <p style="font-weight: 600; color: #6366f1;">${cta || 'Learn more'}</p>
          
          <h2>Required Assets</h2>
          <ul>${assets.map(a => `<li>${a}</li>`).join('')}</ul>
          
          <h2>CRO Checklist</h2>
          <ul class="checklist">${croChecklist.map(c => `<li>${c.completed ? '✅' : '⬜'} ${c.item}</li>`).join('')}</ul>
          
          <p style="margin-top: 32px; font-size: 11px; color: #9ca3af;">Generated by CampaignOS Content Brief Builder</p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopyBrief = async () => {
    const briefText = `
# Content Brief: ${ideaTitle}

**Format:** ${FORMAT_LABELS[format]}
**Audience:** ${audience}
**KPI Goal:** ${kpiGoal}

## Headline
${headline}

## Outline
${outline.map(s => `### ${s.section}\n${s.content}`).join('\n\n')}

## Key Talking Points
${talkingPoints.map(p => `- ${p}`).join('\n')}

## Call to Action
${cta || 'Learn more'}

## Required Assets
${assets.map(a => `- ${a}`).join('\n')}

## CRO Checklist
${croChecklist.map(c => `- [${c.completed ? 'x' : ' '}] ${c.item}`).join('\n')}
    `.trim();

    await navigator.clipboard.writeText(briefText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSendToCampaign = () => {
    addNotification({
      title: 'Brief Saved',
      message: `"${ideaTitle}" brief added to campaign planner`,
      type: 'system',
      icon: '📋',
    });
    setView('campaigns');
  };

  const mentalModel = MENTAL_MODELS.find(m => m.id === mentalModelId);

  return (
    <div className="p-4 md:p-8 max-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            Content Brief Builder
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Create structured briefs with headlines, outlines, and CTAs
          </p>
        </div>
        <button
          onClick={() => setView('mkt-ideation')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <ArrowLeft size={16} />
          Back to Ideation
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s
                ? 'bg-brand-600 text-white'
                : isDark ? 'bg-slate-800 text-slate-500' : 'bg-gray-200 text-gray-400'
            }`}>
              {step > s ? <Check size={14} /> : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-0.5 ${step > s ? 'bg-brand-600' : isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
        <span className={`ml-2 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          {step === 1 ? 'Select Idea' : step === 2 ? 'Confirm Details' : 'Review Brief'}
        </span>
      </div>

      {/* Step 1: Enter Idea */}
      {step === 1 && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h2 className="font-semibold mb-4">Step 1: Define Your Content Idea</h2>
          
          <div className="space-y-4">
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Idea Title *
              </label>
              <input
                type="text"
                value={ideaTitle}
                onChange={e => setIdeaTitle(e.target.value)}
                placeholder="e.g., Staff wellbeing awareness campaign"
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Description (optional)
              </label>
              <textarea
                value={ideaDescription}
                onChange={e => setIdeaDescription(e.target.value)}
                placeholder="Brief description of the content idea..."
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Content Format *
              </label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as ContentFormat)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`}
              >
                {Object.entries(FORMAT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!ideaTitle}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm Details */}
      {step === 2 && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h2 className="font-semibold mb-4">Step 2: Confirm Audience & KPI</h2>
          
          <div className="space-y-4">
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <Users size={12} className="inline mr-1" /> Target Audience *
              </label>
              <input
                type="text"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g., NHS staff, Primary care managers"
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <Target size={12} className="inline mr-1" /> KPI Goal *
              </label>
              <input
                type="text"
                value={kpiGoal}
                onChange={e => setKpiGoal(e.target.value)}
                placeholder="e.g., Increase webinar signups, Drive awareness"
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Call to Action
              </label>
              <input
                type="text"
                value={cta}
                onChange={e => setCta(e.target.value)}
                placeholder="e.g., Sign up now, Download the guide"
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Behavioural Model
              </label>
              <select
                value={mentalModelId}
                onChange={e => setMentalModelId(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`}
              >
                {MENTAL_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {mentalModel && (
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {mentalModel.application}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <ArrowLeft size={14} className="inline mr-1" /> Back
              </button>
              <button
                onClick={handleGenerateBrief}
                disabled={!audience || !kpiGoal || isGenerating}
                className="flex-1 py-2.5 bg-gradient-to-r from-brand-500 to-violet-600 hover:from-brand-400 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Sparkles size={14} className="animate-pulse" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Generate Brief
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review Brief */}
      {step === 3 && briefGenerated && (
        <div className="space-y-4">
          {/* Brief Header */}
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">{ideaTitle}</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {FORMAT_LABELS[format]} · {audience} · {kpiGoal}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyBrief}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} ${copySuccess ? 'text-emerald-400' : ''}`}
                  title="Copy to clipboard"
                >
                  {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <button
                  onClick={handleExportPDF}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                  title="Export PDF"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>

            {/* Headline */}
            <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-brand-500/5 border border-brand-500/20' : 'bg-brand-50 border border-brand-100'}`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Headline</p>
              <p className="font-semibold text-lg">{headline}</p>
            </div>

            {/* CTA */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Call to Action</p>
              <p className="font-semibold">{cta || 'Learn more'}</p>
            </div>
          </div>

          {/* Outline */}
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-violet-400" />
              Content Outline
            </h3>
            <div className="space-y-3">
              {outline.map((section, idx) => (
                <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  <p className="text-sm font-semibold mb-1">{idx + 1}. {section.section}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{section.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Talking Points & Assets */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className="font-semibold mb-3 text-sm">Key Talking Points</h3>
              <ul className="space-y-2">
                {talkingPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className="font-semibold mb-3 text-sm">Required Assets</h3>
              <ul className="space-y-2">
                {assets.map((asset, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <FileText size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
                    <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{asset}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CRO Checklist */}
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-4">CRO Checklist</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {croChecklist.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleChecklistItem(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left text-xs transition-all ${
                    item.completed
                      ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : isDark ? 'border-slate-600' : 'border-gray-300'
                  }`}>
                    {item.completed && <Check size={12} />}
                  </div>
                  <span className={item.completed ? '' : isDark ? 'text-slate-300' : 'text-gray-700'}>{item.item}</span>
                </button>
              ))}
            </div>
            <p className={`text-xs mt-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {croChecklist.filter(c => c.completed).length}/{croChecklist.length} items completed
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Edit Brief
            </button>
            <button
              onClick={handleSendToCampaign}
              className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-violet-600 hover:from-brand-400 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Send to Campaign Planner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
