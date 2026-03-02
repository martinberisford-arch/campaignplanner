import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import ChatComponent, { ChatConfig, UiConfig } from '../components/ui/ChatInterface';
import {
  MessageSquare, Send, Copy, Check, Link,
  RefreshCw, Smartphone, Zap, Users, Clock, ArrowRight
} from 'lucide-react';

const MESSAGE_TYPES = [
  { id: 'reminder', label: 'Reminder', icon: '⏰', desc: 'Event or deadline reminders' },
  { id: 'event', label: 'Event', icon: '📅', desc: 'Event announcements & invitations' },
  { id: 'update', label: 'Update', icon: '📢', desc: 'News and status updates' },
  { id: 'cta', label: 'Call to Action', icon: '🎯', desc: 'Action-focused messages' },
];

const AUDIENCE_SEGMENTS = [
  'All staff',
  'Clinical teams',
  'Management',
  'Primary care',
  'Community services',
  'Patients',
  'Partners',
  'Subscribers',
];

const DEFAULT_TEMPLATES = [
  {
    id: 'sms-reminder',
    name: 'SMS Reminder',
    type: 'sms',
    baseStructure: 'Hi {{firstName}}, reminder: {{eventName}} is on {{date}} at {{time}}. {{link}}',
    charLimit: 160,
    placeholders: ['firstName', 'eventName', 'date', 'time', 'link'],
  },
  {
    id: 'sms-event',
    name: 'SMS Event Invite',
    type: 'sms',
    baseStructure: '{{orgName}}: {{eventName}} - {{date}}. Register now: {{link}}',
    charLimit: 160,
    placeholders: ['orgName', 'eventName', 'date', 'link'],
  },
  {
    id: 'whatsapp-update',
    name: 'WhatsApp Update',
    type: 'whatsapp',
    baseStructure: '📢 *{{headline}}*\n\n{{summary}}\n\n👉 Learn more: {{link}}',
    charLimit: 500,
    placeholders: ['headline', 'summary', 'link'],
  },
  {
    id: 'whatsapp-cta',
    name: 'WhatsApp CTA',
    type: 'whatsapp',
    baseStructure: '🎯 *{{headline}}*\n\n{{benefit}}\n\n✅ {{cta}}: {{link}}',
    charLimit: 500,
    placeholders: ['headline', 'benefit', 'cta', 'link'],
  },
];

// ─── Live Chat Preview Component ────────────────────────────────────────────

interface LiveChatPreviewProps {
  finalMessage: string;
  templateType: string;
  audience: string;
  isDark: boolean;
}

function LiveChatPreview({ finalMessage, templateType, audience, isDark }: LiveChatPreviewProps) {
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const isWhatsApp = templateType === 'whatsapp';

  const chatConfig: ChatConfig = useMemo(() => {
    const messages = finalMessage
      ? [
          {
            id: 1,
            sender: 'left' as const,
            type: 'text' as const,
            content: `Hi, we've prepared a message for ${audience}. Ready to review?`,
            maxWidth: 'max-w-xs',
            loader: { enabled: true, delay: 0, duration: 900 },
          },
          {
            id: 2,
            sender: 'right' as const,
            type: 'text' as const,
            content: 'Yes, show me what you have.',
            maxWidth: 'max-w-xs',
            loader: { enabled: true, delay: 0, duration: 600 },
          },
          {
            id: 3,
            sender: 'left' as const,
            type: 'text' as const,
            content: finalMessage,
            maxWidth: 'max-w-sm',
            loader: { enabled: true, delay: 0, duration: 1200 },
          },
          {
            id: 4,
            sender: 'right' as const,
            type: 'text' as const,
            content: 'That looks great. I\'ll copy and send it now.',
            maxWidth: 'max-w-xs',
            loader: { enabled: true, delay: 0, duration: 700 },
          },
        ]
      : [
          {
            id: 1,
            sender: 'left' as const,
            type: 'text' as const,
            content: 'Extract a URL and choose a template to preview your message here as a live conversation.',
            maxWidth: 'max-w-xs',
            loader: { enabled: false, delay: 0, duration: 0 },
          },
        ];

    return {
      leftPerson: {
        name: 'Comms Bot',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face',
      },
      rightPerson: {
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=64&h=64&fit=crop&crop=face',
      },
      messages,
    };
  }, [finalMessage, audience]);

  const uiConfig: UiConfig = {
    containerWidth: 420,
    containerHeight: 340,
    backgroundColor: bgColor,
    autoRestart: false,
    loader: { dotColor: isWhatsApp ? '#22c55e' : '#3b82f6' },
    linkBubbles: {
      backgroundColor: isWhatsApp ? '#dcfce7' : '#dbeafe',
      textColor: isWhatsApp ? '#166534' : '#1e40af',
      iconColor: isWhatsApp ? '#16a34a' : '#2563eb',
      borderColor: isWhatsApp ? '#bbf7d0' : '#bfdbfe',
    },
    leftChat: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      textColor: isDark ? '#e2e8f0' : '#0f172a',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      showBorder: true,
      nameColor: isWhatsApp ? '#16a34a' : '#2563eb',
    },
    rightChat: {
      backgroundColor: isWhatsApp ? '#dcfce7' : '#dbeafe',
      textColor: isWhatsApp ? '#14532d' : '#1e3a8a',
      borderColor: isWhatsApp ? '#bbf7d0' : '#bfdbfe',
      showBorder: false,
      nameColor: isDark ? '#94a3b8' : '#64748b',
    },
  };

  return (
    <div className="flex flex-col items-center">
      {/* Platform indicator */}
      <div className={`w-full px-4 py-2 flex items-center gap-2 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className={`w-2 h-2 rounded-full ${isWhatsApp ? 'bg-emerald-500' : 'bg-blue-500'}`} />
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          {isWhatsApp ? 'WhatsApp Preview' : 'SMS Preview'} · {audience}
        </span>
      </div>
      {/* Chat window — key changes force remount when message changes */}
      <div key={finalMessage.slice(0, 40)} className="w-full flex justify-center">
        <ChatComponent config={chatConfig} uiConfig={uiConfig} />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MktMessaging() {
  const { theme, addNotification } = useApp();

  const [messageType, setMessageType] = useState('reminder');
  const [audience, setAudience] = useState('All staff');
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATES[0]);
  const [urlToScrape, setUrlToScrape] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [finalMessage, setFinalMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const isDark = theme === 'dark';

  // Simulate URL scraping (in production this would be a server-side function)
  const handleScrapeUrl = async () => {
    if (!urlToScrape) return;

    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mock extracted data based on URL patterns
    const mockData: Record<string, string> = {
      headline: 'Staff Wellbeing Programme Launch',
      summary: 'Join our new wellbeing initiative designed to support NHS staff mental and physical health.',
      eventName: 'Wellbeing Workshop',
      date: '15 March 2025',
      time: '2:00 PM',
      orgName: 'NHS England',
      benefit: 'Access free resources and support for your wellbeing',
      cta: 'Sign up now',
      link: urlToScrape,
    };

    setExtractedData(mockData);
    setCustomFields({ ...mockData });
    generateMessage(mockData);
    setIsLoading(false);
  };

  const generateMessage = (data: Record<string, string>) => {
    let message = selectedTemplate.baseStructure;
    
    Object.entries(data).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Replace any remaining placeholders with empty strings
    message = message.replace(/\{\{[^}]+\}\}/g, '');
    
    setFinalMessage(message);
  };

  const handleFieldChange = (key: string, value: string) => {
    const updated = { ...customFields, [key]: value };
    setCustomFields(updated);
    generateMessage(updated);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      if (Object.keys(customFields).length > 0) {
        generateMessage(customFields);
      }
    }
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(finalMessage);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    addNotification({
      title: 'Message Copied',
      message: 'Message copied to clipboard',
      type: 'system',
      icon: '📋',
    });
  };

  const charCount = finalMessage.length;
  const charLimit = selectedTemplate.charLimit;
  const isOverLimit = charCount > charLimit;

  const getCTAStrength = (): 'weak' | 'medium' | 'strong' => {
    const lower = finalMessage.toLowerCase();
    const strongTerms = ['now', 'today', 'free', 'limited', 'exclusive', 'urgent'];
    const mediumTerms = ['register', 'sign up', 'join', 'book', 'learn'];
    
    const hasStrong = strongTerms.some(t => lower.includes(t));
    const hasMedium = mediumTerms.some(t => lower.includes(t));
    
    if (hasStrong) return 'strong';
    if (hasMedium) return 'medium';
    return 'weak';
  };

  const getEngagementPrediction = (): number => {
    let score = 50;
    
    // CTA strength
    if (getCTAStrength() === 'strong') score += 20;
    else if (getCTAStrength() === 'medium') score += 10;
    
    // Optimal length (not too short, not over limit)
    if (charCount > 50 && !isOverLimit) score += 15;
    
    // Has link
    if (finalMessage.includes('http') || finalMessage.includes('link')) score += 10;
    
    // Has emoji (for WhatsApp)
    if (selectedTemplate.type === 'whatsapp' && /[\u{1F300}-\u{1F9FF}]/u.test(finalMessage)) score += 5;
    
    return Math.min(100, score);
  };

  const ctaStrength = getCTAStrength();
  const engagementScore = getEngagementPrediction();

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </div>
          SMS / WhatsApp Message Builder
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Create short-form messages with automatic URL extraction
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Builder Form */}
        <div className="space-y-4">
          {/* Message Type */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-3 text-sm">Step 1: Message Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {MESSAGE_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setMessageType(type.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    messageType === type.id
                      ? 'bg-brand-600/10 border-brand-500 border'
                      : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-transparent' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <p className="text-xs font-semibold mt-1">{type.label}</p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Users size={14} /> Step 2: Audience
            </h3>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_SEGMENTS.map(seg => (
                <button
                  key={seg}
                  onClick={() => setAudience(seg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    audience === seg
                      ? 'bg-emerald-600 text-white'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Link size={14} /> Step 3: Paste URL to Extract Content
            </h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlToScrape}
                onChange={e => setUrlToScrape(e.target.value)}
                placeholder="https://your-website.nhs.uk/page"
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`}
              />
              <button
                onClick={handleScrapeUrl}
                disabled={!urlToScrape || isLoading}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                Extract
              </button>
            </div>
            <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              We'll extract the title, description and key content from the URL
            </p>
          </div>

          {/* Template Selection */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Smartphone size={14} /> Step 4: Choose Template
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedTemplate.id === template.id
                      ? 'bg-violet-600/10 border-violet-500 border'
                      : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-transparent' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      template.type === 'sms' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {template.type.toUpperCase()}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{template.charLimit} chars</span>
                  </div>
                  <p className="text-xs font-semibold">{template.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Fields */}
          {Object.keys(extractedData).length > 0 && (
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className="font-semibold mb-3 text-sm">Edit Extracted Fields</h3>
              <div className="space-y-3">
                {selectedTemplate.placeholders.map(placeholder => (
                  <div key={placeholder}>
                    <label className={`text-xs font-medium block mb-1 capitalize ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {placeholder.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="text"
                      value={customFields[placeholder] || ''}
                      onChange={e => handleFieldChange(placeholder, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview & Output */}
        <div className="space-y-4">
          {/* Live Chat Preview */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`px-5 pt-5 pb-3 flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Smartphone size={14} className="text-emerald-500" />
                  Live Conversation Preview
                </h3>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {finalMessage ? 'Your message as it appears in a real conversation' : 'Extract a URL above to see your message here'}
                </p>
              </div>
              {finalMessage && (
                <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  isOverLimit
                    ? 'bg-red-500/10 text-red-400'
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {charCount}/{charLimit} chars
                  {isOverLimit && <span className="ml-1">⚠️ over</span>}
                </div>
              )}
            </div>

            <LiveChatPreview
              finalMessage={finalMessage}
              templateType={selectedTemplate.type}
              audience={audience}
              isDark={isDark}
            />
          </div>

          {/* Metrics */}
          {finalMessage && (
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className="font-semibold mb-4 text-sm">Engagement Prediction</h3>
              
              <div className="space-y-4">
                {/* Engagement Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Predicted Engagement</span>
                    <span className={`text-sm font-bold ${engagementScore >= 70 ? 'text-emerald-400' : engagementScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {engagementScore}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${engagementScore >= 70 ? 'bg-emerald-500' : engagementScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${engagementScore}%` }}
                    />
                  </div>
                </div>

                {/* CTA Strength */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>CTA Strength</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    ctaStrength === 'strong' ? 'bg-emerald-500/10 text-emerald-400' :
                    ctaStrength === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {ctaStrength.charAt(0).toUpperCase() + ctaStrength.slice(1)}
                  </span>
                </div>

                {/* Message Length */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Length</span>
                  <span className={`text-xs font-semibold ${isOverLimit ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isOverLimit ? 'Over limit' : 'Within limit'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {finalMessage && (
            <div className="flex gap-3">
              <button
                onClick={handleCopyMessage}
                className={`flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  copySuccess
                    ? 'bg-emerald-600 text-white'
                    : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? 'Copied!' : 'Copy Message'}
              </button>
              <button
                onClick={() => {
                  addNotification({
                    title: 'Message Saved',
                    message: 'Message template saved to campaign',
                    type: 'system',
                    icon: '💬',
                  });
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Save to Campaign
              </button>
            </div>
          )}

          {/* Tips */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              Best Practices
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>SMS: Keep under 160 chars to avoid splitting</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>WhatsApp: Use emojis and bold *text* for engagement</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Include urgency words: "now", "today", "limited"</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Always include a clear call-to-action</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
