import { useState } from 'react';
import { FileText, Plus, Pencil, Trash2, X, Check, TrendingUp, TrendingDown, Minus, Brain, BarChart3, Lightbulb } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { PublishedContent, ContentFormat } from '../types';
import { generateLearningInsights } from '../utils/adaptiveEngine';

const formatOptions: { value: ContentFormat; label: string }[] = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social Media' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'video', label: 'Video' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'press-release', label: 'Press Release' },
  { value: 'case-study', label: 'Case Study' },
];

const channelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'other', label: 'Other' },
] as const;

export default function ContentLog() {
  const {
    publishedContent, addPublishedContent, updatePublishedContent, deletePublishedContent,
    editableKpis, editableAudiences, campaigns, contentPatterns, resetContentPatterns, permissions
  } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<PublishedContent | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formFormat, setFormFormat] = useState<ContentFormat>('social');
  const [formChannel, setFormChannel] = useState<typeof channelOptions[number]['value']>('linkedin');
  const [formAudienceId, setFormAudienceId] = useState('');
  const [formKpiId, setFormKpiId] = useState('');
  const [formCampaignId, setFormCampaignId] = useState('');
  const [formPublishDate, setFormPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEngagement, setFormEngagement] = useState<number | ''>('');
  const [formConversion, setFormConversion] = useState<number | ''>('');
  const [formReferral, setFormReferral] = useState<number | ''>('');
  const [formTheme, setFormTheme] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const activeKpis = editableKpis.filter(k => k.isActive);
  const activeAudiences = editableAudiences.filter(a => a.isActive);

  const insights = generateLearningInsights(contentPatterns, editableKpis, editableAudiences);

  const resetForm = () => {
    setFormTitle('');
    setFormFormat('social');
    setFormChannel('linkedin');
    setFormAudienceId('');
    setFormKpiId('');
    setFormCampaignId('');
    setFormPublishDate(new Date().toISOString().split('T')[0]);
    setFormEngagement('');
    setFormConversion('');
    setFormReferral('');
    setFormTheme('');
    setFormNotes('');
    setFormError('');
  };

  const openCreate = () => {
    setEditingContent(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (content: PublishedContent) => {
    setEditingContent(content);
    setFormTitle(content.title);
    setFormFormat(content.format);
    setFormChannel(content.channel);
    setFormAudienceId(content.audienceId || '');
    setFormKpiId(content.kpiId || '');
    setFormCampaignId(content.campaignId || '');
    setFormPublishDate(content.publishDate.split('T')[0]);
    setFormEngagement(content.engagementScore ?? '');
    setFormConversion(content.conversionRate ?? '');
    setFormReferral(content.referralImpact ?? '');
    setFormTheme(content.theme || '');
    setFormNotes(content.notes || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }

    const contentData: Omit<PublishedContent, 'id' | 'createdAt'> = {
      title: formTitle.trim(),
      format: formFormat,
      channel: formChannel,
      audienceId: formAudienceId || undefined,
      kpiId: formKpiId || undefined,
      campaignId: formCampaignId || undefined,
      publishDate: formPublishDate,
      engagementScore: formEngagement !== '' ? Number(formEngagement) : undefined,
      conversionRate: formConversion !== '' ? Number(formConversion) : undefined,
      referralImpact: formReferral !== '' ? Number(formReferral) : undefined,
      theme: formTheme.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingContent) {
      updatePublishedContent(editingContent.id, contentData);
    } else {
      const newContent: PublishedContent = {
        ...contentData,
        id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      addPublishedContent(newContent);
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deletePublishedContent(id);
    setConfirmDelete(null);
  };

  const getKpiName = (id?: string) => editableKpis.find(k => k.id === id)?.name || '-';
  const getAudienceName = (id?: string) => editableAudiences.find(a => a.id === id)?.name || '-';

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            Content Log
          </h1>
          <p className="text-gray-400 mt-1">Log published content to train the adaptive ideation engine</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInsights(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Brain className="w-4 h-4" />
            System Learning
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Content
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Total Logged</div>
          <div className="text-2xl font-bold">{publishedContent.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Patterns Learned</div>
          <div className="text-2xl font-bold text-purple-400">{contentPatterns.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Avg Engagement</div>
          <div className="text-2xl font-bold text-green-400">
            {publishedContent.length > 0
              ? (publishedContent.filter(c => c.engagementScore).reduce((sum, c) => sum + (c.engagementScore || 0), 0) /
                  publishedContent.filter(c => c.engagementScore).length || 0).toFixed(1)
              : 0}%
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-sm text-gray-400">Avg Conversion</div>
          <div className="text-2xl font-bold text-blue-400">
            {publishedContent.length > 0
              ? (publishedContent.filter(c => c.conversionRate).reduce((sum, c) => sum + (c.conversionRate || 0), 0) /
                  publishedContent.filter(c => c.conversionRate).length || 0).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      {/* Content List */}
      {publishedContent.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No content logged yet</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Start logging your published content to build the learning engine. 
            The system will learn from your performance data and improve idea recommendations.
          </p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            Log Your First Content
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-400">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Format</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Channel</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Audience</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">KPI</th>
                <th className="text-center py-3 px-4 font-medium text-gray-400">Eng %</th>
                <th className="text-center py-3 px-4 font-medium text-gray-400">Conv %</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {publishedContent.map(content => (
                <tr key={content.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-3 px-4">
                    <div className="font-medium">{content.title}</div>
                    {content.theme && (
                      <div className="text-xs text-gray-500">Theme: {content.theme}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-gray-700/50 text-xs capitalize">
                      {content.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize">{content.channel}</td>
                  <td className="py-3 px-4">{getAudienceName(content.audienceId)}</td>
                  <td className="py-3 px-4">{getKpiName(content.kpiId)}</td>
                  <td className="py-3 px-4 text-center">
                    {content.engagementScore !== undefined ? (
                      <span className={content.engagementScore >= 50 ? 'text-green-400' : content.engagementScore >= 25 ? 'text-amber-400' : 'text-red-400'}>
                        {content.engagementScore}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {content.conversionRate !== undefined ? (
                      <span className={content.conversionRate >= 10 ? 'text-green-400' : content.conversionRate >= 5 ? 'text-amber-400' : 'text-gray-400'}>
                        {content.conversionRate}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">{new Date(content.publishDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(content)}
                        className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-400" />
                      </button>
                      {permissions.canDeleteCampaign && (
                        <button
                          onClick={() => setConfirmDelete(content.id)}
                          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-gray-900 border-l border-gray-800 h-full overflow-y-auto animate-slideIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingContent ? 'Edit Content' : 'Log Published Content'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g., NHS Careers Week LinkedIn Post"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Format *</label>
                    <select
                      value={formFormat}
                      onChange={e => setFormFormat(e.target.value as ContentFormat)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                    >
                      {formatOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Channel *</label>
                    <select
                      value={formChannel}
                      onChange={e => setFormChannel(e.target.value as typeof formChannel)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                    >
                      {channelOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Audience</label>
                    <select
                      value={formAudienceId}
                      onChange={e => setFormAudienceId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Select audience...</option>
                      {activeAudiences.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">KPI Goal</label>
                    <select
                      value={formKpiId}
                      onChange={e => setFormKpiId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Select KPI...</option>
                      {activeKpis.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign</label>
                    <select
                      value={formCampaignId}
                      onChange={e => setFormCampaignId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Select campaign...</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Publish Date</label>
                    <input
                      type="date"
                      value={formPublishDate}
                      onChange={e => setFormPublishDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Theme/Topic</label>
                  <input
                    type="text"
                    value={formTheme}
                    onChange={e => setFormTheme(e.target.value)}
                    placeholder="e.g., Recruitment, Awareness, Wellbeing"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for pattern matching in the learning engine</p>
                </div>

                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Engagement %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formEngagement}
                        onChange={e => setFormEngagement(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0-100"
                        className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Conversion %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formConversion}
                        onChange={e => setFormConversion(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0-100"
                        className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Referral %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formReferral}
                        onChange={e => setFormReferral(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0-100"
                        className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Any observations about performance..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {editingContent ? 'Save Changes' : 'Log Content'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Learning Modal */}
      {showInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowInsights(false)} />
          <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  System Learning
                </h2>
                <button onClick={() => setShowInsights(false)} className="p-2 rounded-lg hover:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Insights derived from your logged content patterns
              </p>
            </div>

            <div className="p-6 space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Log more content with performance metrics to generate insights.</p>
                  <p className="text-sm mt-2">The system needs at least 4 content entries with data.</p>
                </div>
              ) : (
                insights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getTrendIcon(insight.trend)}
                          <span className="font-medium">{insight.title}</span>
                        </div>
                        <p className="text-sm text-gray-400">{insight.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{insight.metric.toFixed(1)}</div>
                        <div className="text-xs text-gray-500 capitalize">{insight.type.replace('-', ' ')}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {contentPatterns.length > 0 && permissions.canManageUsers && (
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all learned patterns? This cannot be undone.')) {
                        resetContentPatterns();
                      }
                    }}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Reset Pattern Memory
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Content?</h3>
            <p className="text-sm text-gray-400 mb-4">
              This will remove the content from your log. Pattern data already learned will be retained.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
