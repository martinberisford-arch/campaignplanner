import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import ChatComponent, { ChatConfig, UiConfig } from '../components/ui/ChatInterface';
import { MessageTemplate, ExtractedPageData, MessageLog, DomainMapping } from '../types';
import {
  MessageSquare, Send, Copy, Check, Link, RefreshCw,
  Zap, Users, Clock, ArrowRight, Plus, Edit2, Trash2, ChevronRight,
  ChevronDown, Eye, Bold, Italic, Globe, Database, Settings, X,
  ExternalLink, AlertCircle, CheckCircle2, Layers, Save, RotateCcw,
  Hash, FileText, Activity, BarChart2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveTab = 'builder' | 'templates' | 'logs' | 'domain-mappings';

const AUDIENCE_SEGMENTS = [
  'All staff', 'Clinical teams', 'Management', 'Primary care',
  'Community services', 'Patients', 'Partners', 'Subscribers',
];

// ─── URL Extraction Engine (client-side simulation with real metadata parsing) ─

async function extractFromUrl(url: string, domainMappings: DomainMapping[]): Promise<{ data: ExtractedPageData; missing: string[]; method: string }> {
  // Validate URL client-side first
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL. Please enter a full URL including https://');
  }

  // Block internal/private IPs
  const hostname = parsedUrl.hostname;
  if (hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('127.')) {
    throw new Error('Internal URLs are not allowed for security reasons.');
  }

  // Check domain priority mapping for custom field map
  const domainMatch = domainMappings.find(dm => hostname.includes(dm.domain));
  const fieldMap = domainMatch?.fieldMap || {};

  // Call the real server-side scraping API — runs on Vercel, no CORS issues
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, fieldMap }),
  });

  if (!response.ok) {
    let errorMsg = `Scraping failed (${response.status})`;
    try {
      const errBody = await response.json() as { error?: string };
      if (errBody.error) errorMsg = errBody.error;
    } catch { /* ignore */ }
    throw new Error(errorMsg);
  }

  const result = await response.json() as {
    data: ExtractedPageData;
    missing: string[];
    method: string;
  };

  if (domainMatch) {
    result.data._domainPriority = domainMatch.domain;
  }

  return { data: result.data, missing: result.missing, method: result.method };
}

// ─── Template Engine: render message from template + data ────────────────────

function renderTemplate(template: string, data: Record<string, string>): string {
  // Handle conditional blocks {{#if field}}...{{/if}}
  let result = template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, field, content) => {
    return data[field] ? content : '';
  });
  // Replace variables
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  });
  // Remove unreplaced tokens
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n').trim();
  return result;
}

// Validate template syntax
function validateTemplate(body: string): string[] {
  const errors: string[] = [];
  const ifMatches = body.match(/\{\{#if \w+\}\}/g) || [];
  const endMatches = body.match(/\{\{\/if\}\}/g) || [];
  if (ifMatches.length !== endMatches.length) errors.push('Unclosed {{#if}} block detected');
  const tokens = body.match(/\{\{[^}]+\}\}/g) || [];
  tokens.forEach(t => {
    if (!t.match(/^\{\{(#if \w+|\/if|\w+)\}\}$/)) errors.push(`Unknown token: ${t}`);
  });
  const injectionPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
  injectionPatterns.forEach(p => { if (p.test(body)) errors.push('Potentially dangerous content detected'); });
  return errors;
}

// Extract variable tokens from template body
function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(?!#|\/)([\w]+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

// ─── Live Chat Preview ────────────────────────────────────────────────────────

interface LiveChatPreviewProps {
  finalMessage: string;
  templateType: 'sms' | 'whatsapp';
  audience: string;
  isDark: boolean;
  onCopy: () => void;
  copied: boolean;
}

function LiveChatPreview({ finalMessage, templateType, audience, isDark, onCopy, copied }: LiveChatPreviewProps) {
  const bgColor = isDark ? '#0f172a' : '#f0fdf4';
  const isWhatsApp = templateType === 'whatsapp';

  const chatConfig: ChatConfig = useMemo(() => {
    const messages = finalMessage
      ? [
          { id: 1, sender: 'left' as const, type: 'text' as const, content: `Message ready for ${audience}. Here's your preview:`, maxWidth: 'max-w-xs', loader: { enabled: true, delay: 0, duration: 700 } },
          { id: 2, sender: 'left' as const, type: 'text' as const, content: finalMessage, maxWidth: 'max-w-sm', loader: { enabled: true, delay: 0, duration: 900 } },
          { id: 3, sender: 'right' as const, type: 'text' as const, content: 'Looks great. I\'ll send it now.', maxWidth: 'max-w-xs', loader: { enabled: true, delay: 0, duration: 600 } },
        ]
      : [{ id: 1, sender: 'left' as const, type: 'text' as const, content: 'Paste a URL above and select a template to preview your message here.', maxWidth: 'max-w-xs', loader: { enabled: false, delay: 0, duration: 0 } }];

    return {
      leftPerson: { name: isWhatsApp ? 'WhatsApp' : 'SMS', avatar: isWhatsApp ? 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=64&h=64&fit=crop' : 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=64&h=64&fit=crop' },
      rightPerson: { name: 'You', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=64&h=64&fit=crop&crop=face' },
      messages,
    };
  }, [finalMessage, audience, isWhatsApp]);

  const uiConfig: UiConfig = {
    containerWidth: 420, containerHeight: 300, backgroundColor: bgColor, autoRestart: false,
    loader: { dotColor: isWhatsApp ? '#22c55e' : '#3b82f6' },
    linkBubbles: { backgroundColor: isWhatsApp ? '#dcfce7' : '#dbeafe', textColor: isWhatsApp ? '#166534' : '#1e40af', iconColor: isWhatsApp ? '#16a34a' : '#2563eb', borderColor: isWhatsApp ? '#bbf7d0' : '#bfdbfe' },
    leftChat: { backgroundColor: isDark ? '#1e293b' : '#ffffff', textColor: isDark ? '#e2e8f0' : '#0f172a', borderColor: isDark ? '#334155' : '#d1fae5', showBorder: true, nameColor: isWhatsApp ? '#16a34a' : '#2563eb' },
    rightChat: { backgroundColor: isWhatsApp ? '#dcfce7' : '#dbeafe', textColor: isWhatsApp ? '#14532d' : '#1e3a8a', borderColor: isWhatsApp ? '#bbf7d0' : '#bfdbfe', showBorder: false, nameColor: isDark ? '#94a3b8' : '#64748b' },
  };

  return (
    <div className="flex flex-col">
      <div className={`px-4 py-2 flex items-center gap-2 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-gray-100 bg-gray-50'}`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${isWhatsApp ? 'bg-emerald-500' : 'bg-blue-500'}`} />
        <span className={`text-[10px] font-medium uppercase tracking-wider flex-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          {isWhatsApp ? '📱 WhatsApp Preview' : '💬 SMS Preview'} · {audience}
        </span>
        {finalMessage && (
          <button onClick={onCopy} className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-all ${copied ? 'bg-emerald-500/10 text-emerald-400' : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
        )}
      </div>
      <div key={`${finalMessage.slice(0, 30)}-${templateType}`} className="flex justify-center">
        <ChatComponent config={chatConfig} uiConfig={uiConfig} />
      </div>
    </div>
  );
}

// ─── Template Editor Slide-Over ──────────────────────────────────────────────

interface TemplateEditorProps {
  template: Partial<MessageTemplate> | null;
  onSave: (t: MessageTemplate) => void;
  onClose: () => void;
  isDark: boolean;
}

function TemplateEditor({ template, onSave, onClose, isDark }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [type, setType] = useState<'sms' | 'whatsapp'>(template?.type || 'whatsapp');
  const [body, setBody] = useState(template?.baseStructure || '');
  const [domainPriority, setDomainPriority] = useState(template?.domainPriority || '');
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);

  const charLimit = type === 'sms' ? 160 : 500;
  const detectedVars = extractVariables(body);

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end);
    const newBody = body.slice(0, start) + before + (selected || 'text') + after + body.slice(end);
    setBody(newBody);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, end + before.length + (selected || 'text').length); }, 0);
  };

  const handleSave = () => {
    const errs = validateTemplate(body);
    if (!name.trim()) errs.unshift('Template name is required');
    if (!body.trim()) errs.unshift('Template body is required');
    setErrors(errs);
    if (errs.length > 0) return;

    const vars = extractVariables(body);
    const schema: MessageTemplate['variableSchema'] = {};
    vars.forEach(v => {
      schema[v] = template?.variableSchema?.[v] || { label: v.charAt(0).toUpperCase() + v.slice(1).replace(/([A-Z])/g, ' $1'), required: true };
    });

    onSave({
      id: template?.id || `mt-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      type,
      baseStructure: body,
      charLimit,
      placeholders: vars,
      isActive: template?.isActive ?? true,
      domainPriority: domainPriority.trim(),
      variableSchema: schema,
      usageCount: template?.usageCount || 0,
      createdAt: template?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const sampleData: Record<string, string> = {
    title: 'Sample Event Title', description: 'Sample description text', location: 'NHS HQ, London',
    startDate: '14 March 2025', time: '9:30 AM', url: 'https://example.nhs.uk/event', siteName: 'NHS England',
    cta: 'Register now', price: '£0 (Free)', author: 'NHS Comms', endDate: '14 March 2025',
  };

  const card = `rounded-2xl border p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`w-full max-w-2xl h-full overflow-y-auto shadow-2xl ${isDark ? 'bg-slate-950 border-l border-slate-800' : 'bg-white border-l border-gray-200'}`}>
        <div className={`sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div>
            <h2 className="font-bold text-base">{template?.id ? 'Edit Template' : 'New Template'}</h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Use {'{{variable}}'} tokens to add dynamic content</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreview(!preview)} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${preview ? 'bg-violet-600/10 text-violet-400' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
              <Eye size={12} /> {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
              <Save size={12} /> Save
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}><X size={16} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {errors.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              {errors.map((e, i) => <p key={i} className="text-xs text-red-400 flex items-center gap-2"><AlertCircle size={12} />{e}</p>)}
            </div>
          )}

          <div className={card}>
            <h3 className="text-sm font-semibold mb-3">Template Details</h3>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Template Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Event Announcement" className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`} />
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of when to use this template" className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Platform</label>
                  <select value={type} onChange={e => setType(e.target.value as 'sms' | 'whatsapp')} className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`}>
                    <option value="whatsapp">WhatsApp ({charLimit === 500 ? 500 : 160} chars)</option>
                    <option value="sms">SMS (160 chars)</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Domain Priority (optional)</label>
                  <input value={domainPriority} onChange={e => setDomainPriority(e.target.value)} placeholder="e.g. england.nhs.uk" className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-gray-50 border border-gray-200 text-slate-900'}`} />
                </div>
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Template Body</h3>
              <div className={`text-[10px] font-mono px-2 py-0.5 rounded ${body.length > charLimit ? 'bg-red-500/10 text-red-400' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                {body.length}/{charLimit}
              </div>
            </div>

            {/* Formatting toolbar */}
            <div className={`flex gap-1 mb-2 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
              <button onClick={() => insertFormatting('*', '*')} title="Bold (WhatsApp)" className={`p-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}><Bold size={12} /></button>
              <button onClick={() => insertFormatting('_', '_')} title="Italic (WhatsApp)" className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}><Italic size={12} /></button>
              <div className={`w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
              {['title', 'description', 'location', 'startDate', 'time', 'url', 'cta', 'price', 'siteName'].map(v => (
                <button key={v} onClick={() => {
                  const ta = document.getElementById('template-body') as HTMLTextAreaElement;
                  if (ta) { const pos = ta.selectionStart; const newBody = body.slice(0, pos) + `{{${v}}}` + body.slice(pos); setBody(newBody); }
                }} className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${isDark ? 'hover:bg-slate-800 bg-slate-900 text-slate-400' : 'hover:bg-gray-100 bg-gray-50 text-gray-500'}`}>
                  {v}
                </button>
              ))}
            </div>

            {!preview ? (
              <textarea
                id="template-body"
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                placeholder={`*{{title}}*\n\n📍 {{location}}\n📅 {{startDate}} at {{time}}\n\n{{description}}\n\nBook now: {{url}}`}
                className={`w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`}
              />
            ) : (
              <div className={`rounded-lg p-4 text-sm font-mono whitespace-pre-wrap min-h-32 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-gray-50 text-slate-900'}`}>
                {renderTemplate(body, sampleData) || <span className="text-gray-400 italic">Preview will appear here...</span>}
              </div>
            )}

            {detectedVars.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Detected variables:</span>
                {detectedVars.map(v => <span key={v} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>{`{{${v}}}`}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MktMessaging() {
  const {
    theme, addNotification, currentUser,
    messageTemplates, addMessageTemplate, updateMessageTemplate, deleteMessageTemplate, duplicateMessageTemplate,
    domainMappings, addDomainMapping, updateDomainMapping, deleteDomainMapping,
    messageLogs, addMessageLog,
    permissions,
  } = useApp();

  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<ActiveTab>('builder');

  // ── Builder state ──
  const [audience, setAudience] = useState('All staff');
  const [selectedTemplateId, setSelectedTemplateId] = useState(messageTemplates[0]?.id || '');
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedPageData | null>(null);
  const [extractMethod, setExtractMethod] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [finalMessage, setFinalMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [messageSaved, setMessageSaved] = useState(false);

  // ── Template management state ──
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Domain mapping state ──
  const [_editingMapping, setEditingMapping] = useState<Partial<DomainMapping> | null>(null);
  const [newMappingDomain, setNewMappingDomain] = useState('');
  const [newMappingField, setNewMappingField] = useState('title');
  const [newMappingMeta, setNewMappingMeta] = useState('og:title');

  const selectedTemplate = messageTemplates.find(t => t.id === selectedTemplateId) || messageTemplates[0];
  const activeTemplates = messageTemplates.filter(t => t.isActive);

  // Regenerate message when fields or template change
  const regenerateMessage = useCallback((template: MessageTemplate, fields: Record<string, string>) => {
    if (Object.keys(fields).length === 0) return;
    const rendered = renderTemplate(template.baseStructure, fields);
    setFinalMessage(rendered);
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    const updated = { ...fieldValues, [key]: value };
    setFieldValues(updated);
    if (selectedTemplate) regenerateMessage(selectedTemplate, updated);
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = messageTemplates.find(t => t.id === id);
    if (tmpl && Object.keys(fieldValues).length > 0) regenerateMessage(tmpl, fieldValues);
    else setFinalMessage('');
  };

  const handleExtract = async () => {
    if (!urlInput.trim()) return;
    setIsExtracting(true);
    setExtractError('');
    setExtractedData(null);
    setFinalMessage('');
    setMessageSaved(false);

    try {
      const { data, method } = await extractFromUrl(urlInput, domainMappings);
      setExtractedData(data);
      setExtractMethod(method);

      // Auto-map extracted data to template variables
      const template = selectedTemplate;
      if (template) {
        const mapped: Record<string, string> = {};
        template.placeholders.forEach(p => {
          const val = (data as Record<string, string | undefined>)[p];
          if (val) mapped[p] = val;
        });
        // Additional mappings
        if (data.siteName && !mapped.siteName) mapped.siteName = data.siteName;
        if (data.url) mapped.url = data.url;
        setFieldValues(mapped);
        regenerateMessage(template, mapped);
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to extract data from URL');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalMessage);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleWhatsAppLink = () => {
    const encoded = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleSaveToLog = () => {
    if (!finalMessage || !currentUser) return;
    const log: MessageLog = {
      id: `ml-${Date.now()}`,
      templateId: selectedTemplate?.id || '',
      templateName: selectedTemplate?.name || '',
      url: urlInput,
      extractedData: fieldValues,
      finalMessage,
      charCount: finalMessage.length,
      platform: selectedTemplate?.type || 'whatsapp',
      audience,
      predictedEngagement: getEngagementScore(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };
    addMessageLog(log);
    setMessageSaved(true);
    addNotification({ title: 'Message Saved', message: 'Saved to message log', type: 'system', icon: '💬' });
  };

  // Engagement scoring
  const getEngagementScore = () => {
    if (!finalMessage) return 0;
    let score = 45;
    const lower = finalMessage.toLowerCase();
    ['now', 'today', 'free', 'limited', 'exclusive', 'urgent'].forEach(t => { if (lower.includes(t)) score += 8; });
    ['register', 'sign up', 'join', 'book', 'learn', 'apply'].forEach(t => { if (lower.includes(t)) score += 5; });
    if (finalMessage.length > 50 && finalMessage.length <= (selectedTemplate?.charLimit || 160)) score += 12;
    if (finalMessage.includes('http')) score += 8;
    if (selectedTemplate?.type === 'whatsapp' && /[*_~]/.test(finalMessage)) score += 6;
    if (/[\u2600-\u27FF]/.test(finalMessage)) score += 4;
    return Math.min(98, score);
  };

  const getCTAStrength = (): 'weak' | 'medium' | 'strong' => {
    const l = finalMessage.toLowerCase();
    if (['now', 'today', 'limited', 'exclusive', 'urgent'].some(t => l.includes(t))) return 'strong';
    if (['register', 'sign up', 'join', 'book', 'apply'].some(t => l.includes(t))) return 'medium';
    return 'weak';
  };

  const engagementScore = getEngagementScore();
  const ctaStrength = getCTAStrength();
  const isOverLimit = finalMessage.length > (selectedTemplate?.charLimit || 160);
  const missingVars = selectedTemplate ? selectedTemplate.placeholders.filter(p => !fieldValues[p] && selectedTemplate.variableSchema[p]?.required) : [];

  // ── Styles ──
  const card = `rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`;
  const input = `w-full px-3 py-2 rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-gray-400'}`;
  const label = `text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`;

  // ── Filtered templates ──
  const filteredTemplates = messageTemplates.filter(t =>
    !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase()) || t.description?.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            Message Builder
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Structured URL → WhatsApp / SMS engine with template CRUD and extraction
          </p>
        </div>

        {/* Tab navigation */}
        <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-100 border border-gray-200'}`}>
          {[
            { id: 'builder', label: 'Builder', icon: MessageSquare },
            { id: 'templates', label: `Templates (${messageTemplates.length})`, icon: Layers },
            { id: 'logs', label: `Logs (${messageLogs.length})`, icon: Activity },
            ...(permissions.canCreateCampaign ? [{ id: 'domain-mappings', label: 'Domains', icon: Globe }] : []),
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-brand-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'}`}>
              <tab.icon size={12} />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BUILDER TAB ── */}
      {activeTab === 'builder' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            {/* Audience */}
            <div className={`${card} p-5`}>
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><Users size={14} /> 1. Audience</h3>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_SEGMENTS.map(seg => (
                  <button key={seg} onClick={() => setAudience(seg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${audience === seg ? 'bg-emerald-600 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            <div className={`${card} p-5`}>
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><Layers size={14} /> 2. Template</h3>
              <div className="grid grid-cols-2 gap-2">
                {activeTemplates.map(t => (
                  <button key={t.id} onClick={() => handleTemplateSelect(t.id)}
                    className={`p-3 rounded-xl text-left transition-all ${selectedTemplateId === t.id ? 'bg-violet-600/10 border-violet-500 border' : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-transparent' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.type === 'sms' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {t.type.toUpperCase()}
                      </span>
                      {t.domainPriority && <span className="text-[10px] text-violet-400">⭐ Priority</span>}
                    </div>
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.description}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { setEditingTemplate({}); setShowTemplateEditor(true); }} className={`mt-3 w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}>
                <Plus size={12} /> New Template
              </button>
            </div>

            {/* URL Extraction */}
            <div className={`${card} p-5`}>
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><Link size={14} /> 3. Extract from URL</h3>
              <div className="flex gap-2">
                <input type="url" value={urlInput} onChange={e => { setUrlInput(e.target.value); setExtractError(''); }}
                  placeholder="https://your-website.nhs.uk/page" className={`flex-1 ${input}`} />
                <button onClick={handleExtract} disabled={!urlInput.trim() || isExtracting}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-2">
                  {isExtracting ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  {isExtracting ? 'Extracting...' : 'Extract'}
                </button>
              </div>

              {extractError && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{extractError}</p>
                </div>
              )}

              {extractedData && (
                <div className={`mt-3 p-3 rounded-xl ${isDark ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className={`text-[10px] font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Data extracted · {extractMethod}</span>
                    <button onClick={() => setShowFieldEditor(!showFieldEditor)} className={`ml-auto text-[10px] flex items-center gap-0.5 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                      {showFieldEditor ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      {showFieldEditor ? 'Collapse' : 'Edit fields'}
                    </button>
                  </div>
                  {showFieldEditor && (
                    <div className="space-y-2 mt-2">
                      {selectedTemplate?.placeholders.map(p => (
                        <div key={p}>
                          <label className={`${label} flex items-center gap-1`}>
                            <span className={`font-mono text-[9px] px-1 rounded ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>{`{{${p}}}`}</span>
                            {selectedTemplate.variableSchema[p]?.label || p}
                            {selectedTemplate.variableSchema[p]?.required && <span className="text-red-400 text-[9px]">*</span>}
                          </label>
                          <input value={fieldValues[p] || ''} onChange={e => handleFieldChange(p, e.target.value)}
                            placeholder={selectedTemplate.variableSchema[p]?.hint || `Enter ${p}`}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs outline-none ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-gray-200 text-slate-900'}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {missingVars.length > 0 && Object.keys(fieldValues).length > 0 && (
                <div className={`mt-2 flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  <AlertCircle size={12} />
                  <span className="text-[10px]">Missing required: {missingVars.join(', ')}</span>
                </div>
              )}

              <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Extraction order: JSON-LD → OpenGraph → Meta → HTML. Domain mappings applied automatically.
              </p>
            </div>

            {/* Best Practices */}
            <div className={`${card} p-5`}>
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><Clock size={14} className="text-amber-400" /> Best Practices</h3>
              <ul className="space-y-2 text-xs">
                {[
                  'SMS: Keep under 160 chars to avoid message splitting',
                  'WhatsApp: Use *bold*, _italic_ for key information',
                  'Include urgency: "now", "today", "limited places"',
                  'Always include a clear, single call-to-action',
                  'Test your message on mobile before sending',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Preview & Output */}
          <div className="space-y-4">
            {/* Live Chat Preview */}
            <div className={`${card} overflow-hidden`}>
              <LiveChatPreview
                finalMessage={finalMessage}
                templateType={selectedTemplate?.type || 'whatsapp'}
                audience={audience}
                isDark={isDark}
                onCopy={handleCopy}
                copied={copySuccess}
              />
            </div>

            {/* Metrics */}
            {finalMessage && (
              <div className={`${card} p-5`}>
                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2"><BarChart2 size={14} /> Message Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Predicted Engagement</span>
                      <span className={`text-sm font-bold tabular-nums ${engagementScore >= 70 ? 'text-emerald-400' : engagementScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{engagementScore}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <div className={`h-full rounded-full transition-all duration-500 ${engagementScore >= 70 ? 'bg-emerald-500' : engagementScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${engagementScore}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>CTA Strength</p>
                      <p className={`text-xs font-bold mt-1 ${ctaStrength === 'strong' ? 'text-emerald-400' : ctaStrength === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>{ctaStrength.charAt(0).toUpperCase() + ctaStrength.slice(1)}</p>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Characters</p>
                      <p className={`text-xs font-bold mt-1 tabular-nums ${isOverLimit ? 'text-red-400' : 'text-emerald-400'}`}>{finalMessage.length}/{selectedTemplate?.charLimit}</p>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Platform</p>
                      <p className={`text-xs font-bold mt-1 ${selectedTemplate?.type === 'whatsapp' ? 'text-emerald-400' : 'text-blue-400'}`}>{selectedTemplate?.type?.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {finalMessage && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleCopy} className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${copySuccess ? 'bg-emerald-600 text-white' : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess ? 'Copied!' : 'Copy Message'}
                  </button>
                  <button onClick={handleWhatsAppLink} className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all">
                    <ExternalLink size={16} /> WhatsApp Link
                  </button>
                </div>
                <button onClick={handleSaveToLog} disabled={messageSaved} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${messageSaved ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white'}`}>
                  {messageSaved ? <><CheckCircle2 size={16} /> Saved to Log</> : <><Send size={16} /> Save to Message Log</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <Hash size={14} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
              <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} placeholder="Search templates..." className="flex-1 text-sm outline-none bg-transparent" />
            </div>
            <button onClick={() => { setEditingTemplate({}); setShowTemplateEditor(true); }}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium flex items-center gap-2">
              <Plus size={14} /> New Template
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredTemplates.map(t => (
              <div key={t.id} className={`${card} p-5 group`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.type === 'sms' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{t.type.toUpperCase()}</span>
                      {t.domainPriority && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">⭐ {t.domainPriority}</span>}
                      {!t.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">Inactive</span>}
                    </div>
                    <h3 className="font-semibold text-sm mt-1">{t.name}</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.description}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTemplate(t); setShowTemplateEditor(true); }}
                      className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => duplicateMessageTemplate(t.id)}
                      className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                      <Copy size={12} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(t.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Template preview */}
                <div className={`rounded-lg p-3 text-xs font-mono whitespace-pre-wrap max-h-24 overflow-hidden relative ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
                  {t.baseStructure}
                  <div className={`absolute bottom-0 left-0 right-0 h-8 ${isDark ? 'bg-gradient-to-t from-slate-800' : 'bg-gradient-to-t from-gray-50'}`} />
                </div>

                <div className={`mt-3 flex items-center justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  <div className="flex gap-3">
                    <span>{t.charLimit} char limit</span>
                    <span>{t.placeholders.length} variables</span>
                    <span>{t.usageCount} uses</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMessageTemplate(t.id, { isActive: !t.isActive })}
                      className={`px-2 py-0.5 rounded-full font-medium transition-all ${t.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-slate-500/10 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => { setSelectedTemplateId(t.id); setActiveTab('builder'); }}
                      className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-medium">
                      Use →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delete confirmation */}
          {confirmDeleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className={`rounded-2xl border p-6 max-w-sm w-full mx-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h3 className="font-bold mb-2">Delete Template?</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>This cannot be undone. Any saved messages using this template will retain their content.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDeleteId(null)} className={`flex-1 py-2 rounded-xl text-sm ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</button>
                  <button onClick={() => { deleteMessageTemplate(confirmDeleteId); setConfirmDeleteId(null); }} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold">Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {activeTab === 'logs' && (
        <div className={`${card} overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            <h3 className="font-semibold text-sm flex items-center gap-2"><Database size={14} /> Message Log ({messageLogs.length})</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Every message generated and saved from the Builder</p>
          </div>
          {messageLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={32} className={`mx-auto mb-3 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No messages logged yet. Generate and save a message from the Builder tab.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {messageLogs.map(log => (
                <div key={log.id} className={`px-6 py-4 hover:${isDark ? 'bg-slate-800/30' : 'bg-gray-50'} transition-colors`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${log.platform === 'sms' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{log.platform.toUpperCase()}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{log.templateName}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>· {log.audience}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>· {new Date(log.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className={`text-xs font-mono truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{log.finalMessage}</p>
                      {log.url && <p className={`text-[10px] mt-1 truncate ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Source: {log.url}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{log.charCount} chars</p>
                        <p className={`text-xs font-bold tabular-nums ${log.predictedEngagement >= 70 ? 'text-emerald-400' : log.predictedEngagement >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{log.predictedEngagement}% eng</p>
                      </div>
                      <button onClick={async () => { await navigator.clipboard.writeText(log.finalMessage); addNotification({ title: 'Copied', message: 'Message copied to clipboard', type: 'system', icon: '📋' }); }}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DOMAIN MAPPINGS TAB ── */}
      {activeTab === 'domain-mappings' && permissions.canCreateCampaign && (
        <div className="space-y-4">
          <div className={`${card} p-5`}>
            <h3 className="font-semibold mb-1 text-sm flex items-center gap-2"><Globe size={14} /> Domain Priority Mappings</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              When a URL matches a domain, the system uses your custom field mappings instead of generic OpenGraph extraction. This ensures the right data is pulled from your organisation's custom meta tags.
            </p>
            <div className="space-y-3">
              {domainMappings.map(mapping => (
                <div key={mapping.id} className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold font-mono">{mapping.domain}</p>
                      <div className="mt-2 space-y-1">
                        {Object.entries(mapping.fieldMap).map(([field, meta]) => (
                          <div key={field} className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            <span className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'bg-slate-700' : 'bg-white'}`}>{`{{${field}}}`}</span>
                            <ArrowRight size={10} />
                            <span className={`font-mono text-[10px] ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{meta}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingMapping(mapping)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-white text-gray-500'}`}><Edit2 size={12} /></button>
                      <button onClick={() => deleteDomainMapping(mapping.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add mapping form */}
            <div className={`mt-4 rounded-xl border p-4 ${isDark ? 'border-slate-700 border-dashed' : 'border-gray-200 border-dashed'}`}>
              <h4 className={`text-xs font-semibold mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Add New Domain Mapping</h4>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className={label}>Domain</label>
                  <input value={newMappingDomain} onChange={e => setNewMappingDomain(e.target.value)} placeholder="e.g. england.nhs.uk" className={input} />
                </div>
                <div>
                  <label className={label}>System Field</label>
                  <select value={newMappingField} onChange={e => setNewMappingField(e.target.value)} className={input}>
                    {['title', 'description', 'startDate', 'time', 'location', 'price', 'url', 'siteName'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Meta Tag Name</label>
                  <input value={newMappingMeta} onChange={e => setNewMappingMeta(e.target.value)} placeholder="e.g. og:title" className={input} />
                </div>
              </div>
              <button onClick={() => {
                if (!newMappingDomain.trim()) return;
                const existing = domainMappings.find(m => m.domain === newMappingDomain.trim());
                if (existing) {
                  updateDomainMapping(existing.id, { fieldMap: { ...existing.fieldMap, [newMappingField]: newMappingMeta } });
                } else {
                  addDomainMapping({ id: `dm-${Date.now()}`, domain: newMappingDomain.trim(), fieldMap: { [newMappingField]: newMappingMeta }, createdAt: new Date().toISOString() });
                }
                setNewMappingDomain(''); setNewMappingField('title'); setNewMappingMeta('og:title');
              }} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                <Plus size={12} /> Add / Update Mapping
              </button>
            </div>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-2"><Settings size={14} /> Extraction Priority Guide</h3>
            <div className="space-y-2 text-xs">
              {[
                { step: '1', label: 'JSON-LD Structured Data', desc: 'Schema.org markup — most reliable for events and articles' },
                { step: '2', label: 'Domain Priority Mapping', desc: 'Your custom meta tag mappings configured above' },
                { step: '3', label: 'OpenGraph Meta Tags', desc: 'og:title, og:description, og:image etc.' },
                { step: '4', label: 'Standard Meta Tags', desc: 'Standard meta name/description, keywords' },
                { step: '5', label: 'HTML Fallback', desc: 'H1, first paragraph, page title — least reliable' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>{s.step}</span>
                  <div>
                    <p className="font-medium">{s.label}</p>
                    <p className={isDark ? 'text-slate-500' : 'text-gray-400'}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset patterns option */}
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2"><RotateCcw size={14} /> Reset All Domain Mappings</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Remove all custom domain mappings and revert to generic extraction only.</p>
              </div>
              <button onClick={() => domainMappings.forEach(m => deleteDomainMapping(m.id))} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all">
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Slide-Over */}
      {showTemplateEditor && (
        <TemplateEditor
          template={editingTemplate}
          isDark={isDark}
          onClose={() => { setShowTemplateEditor(false); setEditingTemplate(null); }}
          onSave={(t) => {
            if (editingTemplate?.id) updateMessageTemplate(editingTemplate.id, t);
            else addMessageTemplate(t);
            setShowTemplateEditor(false);
            setEditingTemplate(null);
            addNotification({ title: 'Template Saved', message: `"${t.name}" template saved`, type: 'system', icon: '✅' });
          }}
        />
      )}
    </div>
  );
}
