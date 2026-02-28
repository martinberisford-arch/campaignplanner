import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { currentUser, users } from '../data/mockData';
import { ApprovalStatus, ApprovalItem } from '../types';
import {
  CheckCircle2, XCircle, Clock, MessageSquare, ChevronDown, ChevronUp,
  FileText, Image, DollarSign, Type, Shield, AlertTriangle, Send,
  Plus, X, Paperclip, History
} from 'lucide-react';

const statusConfig: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: <Clock size={16} className="text-amber-400" /> },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 size={16} className="text-emerald-400" /> },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle size={16} className="text-red-400" /> },
  'changes-requested': { label: 'Changes Requested', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: <AlertTriangle size={16} className="text-orange-400" /> },
};

const typeIcons: Record<string, React.ReactNode> = {
  brief: <FileText size={16} className="text-blue-400" />,
  asset: <Image size={16} className="text-purple-400" />,
  budget: <DollarSign size={16} className="text-emerald-400" />,
  copy: <Type size={16} className="text-pink-400" />,
  strategy: <Shield size={16} className="text-brand-400" />,
};

export default function Approvals() {
  const { approvals, updateApprovalStatus, addApproval, campaigns } = useApp();
  const [filter, setFilter] = useState<ApprovalStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [showNewApproval, setShowNewApproval] = useState(false);

  // New approval form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ApprovalItem['type']>('brief');
  const [newCampaignId, setNewCampaignId] = useState(campaigns[0]?.id || '');
  const [newDocument, setNewDocument] = useState('');
  const [newReviewerIds, setNewReviewerIds] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const filtered = filter === 'all' ? approvals : approvals.filter(a => a.status === filter);

  const stats = [
    { label: 'Pending', count: approvals.filter(a => a.status === 'pending').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Approved', count: approvals.filter(a => a.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Changes', count: approvals.filter(a => a.status === 'changes-requested').length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Rejected', count: approvals.filter(a => a.status === 'rejected').length, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  const setCommentText = (id: string, text: string) => {
    setCommentTexts(prev => ({ ...prev, [id]: text }));
  };

  const getCommentText = (id: string) => commentTexts[id] || '';

  const handleAction = (itemId: string, status: ApprovalStatus) => {
    const comment = getCommentText(itemId);
    updateApprovalStatus(itemId, currentUser.id, status, comment || (
      status === 'approved' ? 'Approved' :
      status === 'rejected' ? 'Rejected' :
      'Changes needed'
    ));
    setCommentTexts(prev => { const n = { ...prev }; delete n[itemId]; return n; });
  };

  const handleCreateApproval = () => {
    if (!newTitle.trim() || newReviewerIds.length === 0) return;

    const newApproval: ApprovalItem = {
      id: `a${Date.now()}`,
      title: newTitle,
      type: newType,
      status: 'pending',
      submittedBy: currentUser,
      campaignId: newCampaignId,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      version: 1,
      document: newDocument || undefined,
      reviewers: newReviewerIds.map(uid => ({
        user: users.find(u => u.id === uid) || users[0],
        status: 'pending' as ApprovalStatus,
      })),
    };

    addApproval(newApproval);
    setSubmitSuccess(true);
    setTimeout(() => {
      setShowNewApproval(false);
      setSubmitSuccess(false);
      setNewTitle('');
      setNewType('brief');
      setNewCampaignId(campaigns[0]?.id || '');
      setNewDocument('');
      setNewReviewerIds([]);
    }, 1500);
  };

  const toggleReviewer = (uid: string) => {
    setNewReviewerIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Approval Workflows</h1>
          <p className="text-sm text-slate-400 mt-1">Review and approve campaign materials, briefs, and budgets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800 rounded-xl px-3 py-2">
            <Shield size={14} className="text-brand-400" />
            Audit trail enabled · ISO 27001 compliant
          </div>
          <button onClick={() => setShowNewApproval(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Submit for Approval
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} border border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:border-slate-600 transition-colors`}
            onClick={() => setFilter(s.label.toLowerCase() === 'changes' ? 'changes-requested' : s.label.toLowerCase() as ApprovalStatus | 'all')}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4">Approval Pipeline</h3>
        <div className="flex items-center gap-2 overflow-x-auto">
          {['Draft', 'Submitted', 'In Review', 'Approved / Changes'].map((stage, i) => (
            <div key={stage} className="flex items-center gap-2 flex-shrink-0">
              <div className={`px-4 py-2 rounded-xl text-xs font-medium border ${i === 2 ? 'bg-brand-500/20 border-brand-500/30 text-brand-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {stage}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-slate-700" />}
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'pending', 'approved', 'changes-requested', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >{f === 'all' ? 'All Items' : f.replace('-', ' ')}</button>
        ))}
      </div>

      {/* Approval Items */}
      <div className="space-y-3">
        {filtered.map(item => {
          const config = statusConfig[item.status];
          const campaign = campaigns.find(c => c.id === item.campaignId);
          const isExpanded = expandedId === item.id;
          const isPending = item.status === 'pending';

          return (
            <div key={item.id} className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-brand-500/30' : 'border-slate-800 hover:border-slate-700'}`}>
              {/* Main row */}
              <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {typeIcons[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">v{item.version}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                      <span>Campaign: <span className="text-slate-300">{campaign?.title || 'Unknown'}</span></span>
                      <span>Submitted by <span className="text-slate-300">{item.submittedBy.name}</span></span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>

                  {/* Quick action buttons visible without expanding */}
                  {isPending && (
                    <div className="hidden lg:flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleAction(item.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-all border border-emerald-500/30 hover:border-emerald-500">
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button onClick={() => handleAction(item.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all border border-red-500/30 hover:border-red-500">
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Reviewer avatars */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {item.reviewers.map((r, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold ${
                          r.status === 'approved' ? 'bg-emerald-500/30 text-emerald-400' :
                          r.status === 'changes-requested' ? 'bg-orange-500/30 text-orange-400' :
                          r.status === 'rejected' ? 'bg-red-500/30 text-red-400' :
                          'bg-slate-700 text-slate-400'
                        }`} title={`${r.user.name}: ${r.status}`}>
                          {r.user.avatar}
                        </div>
                      ))}
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-800 animate-fade-in">
                  {/* Document preview if available */}
                  {item.document && (
                    <div className="p-5 border-b border-slate-800">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Paperclip size={12} /> Document Content
                      </h4>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                        {item.document}
                      </div>
                    </div>
                  )}

                  {/* Reviewers */}
                  <div className="p-5">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <History size={12} /> Review Status & Audit Trail
                    </h4>
                    <div className="space-y-3">
                      {item.reviewers.map((reviewer, i) => {
                        const rConfig = statusConfig[reviewer.status as ApprovalStatus] || statusConfig.pending;
                        return (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              reviewer.status === 'approved' ? 'bg-emerald-500/30 text-emerald-400' :
                              reviewer.status === 'rejected' ? 'bg-red-500/30 text-red-400' :
                              reviewer.status === 'changes-requested' ? 'bg-orange-500/30 text-orange-400' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {reviewer.user.avatar}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{reviewer.user.name}</span>
                                <span className="text-xs text-slate-500">{reviewer.user.department}</span>
                                <span className={`flex items-center gap-1 text-[10px] font-semibold ${rConfig.color}`}>
                                  {rConfig.icon} {rConfig.label}
                                </span>
                              </div>
                              {reviewer.comment && (
                                <div className="mt-2 flex items-start gap-2 text-xs text-slate-300 bg-slate-800/80 rounded-lg p-3 border-l-2 border-slate-600">
                                  <MessageSquare size={12} className="flex-shrink-0 mt-0.5 text-slate-500" />
                                  <span>{reviewer.comment}</span>
                                </div>
                              )}
                              {reviewer.date && <p className="text-[10px] text-slate-600 mt-1.5">Responded: {reviewer.date}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Panel - Always visible for actionable items */}
                  <div className="p-5 border-t border-slate-800 bg-slate-800/20">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      {isPending ? '✍️ Your Review' : item.status === 'changes-requested' ? '🔄 Resubmit or Update' : '💬 Add Comment'}
                    </h4>
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={getCommentText(item.id)}
                        onChange={e => setCommentText(item.id, e.target.value)}
                        placeholder={isPending ? "Add your review comments here... (required for Changes Requested, optional for Approve/Reject)" : "Add a comment to this approval item..."}
                        rows={3}
                        className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleAction(item.id, 'approved')}
                              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
                            >
                              <CheckCircle2 size={16} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                if (!getCommentText(item.id).trim()) {
                                  setCommentText(item.id, '');
                                  return alert('Please add a comment explaining what changes are needed.');
                                }
                                handleAction(item.id, 'changes-requested');
                              }}
                              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-orange-900/30"
                            >
                              <Send size={16} /> Request Changes
                            </button>
                            <button
                              onClick={() => handleAction(item.id, 'rejected')}
                              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-red-900/30"
                            >
                              <XCircle size={16} /> Reject
                            </button>
                          </>
                        )}
                        {item.status === 'changes-requested' && (
                          <>
                            <button
                              onClick={() => handleAction(item.id, 'approved')}
                              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold transition-colors"
                            >
                              <CheckCircle2 size={16} /> Approve (Override)
                            </button>
                            <button
                              onClick={() => handleAction(item.id, 'pending')}
                              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
                            >
                              <Send size={16} /> Resubmit for Review
                            </button>
                          </>
                        )}
                        {item.status === 'rejected' && (
                          <button
                            onClick={() => handleAction(item.id, 'pending')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
                          >
                            <Send size={16} /> Resubmit for Review
                          </button>
                        )}
                        {item.status === 'approved' && (
                          <p className="text-xs text-emerald-400 flex items-center gap-2 py-2.5">
                            <CheckCircle2 size={14} /> This item has been fully approved. No further action required.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-700" />
          <p className="font-medium">No items matching this filter</p>
          <p className="text-sm mt-1">All caught up! 🎉</p>
        </div>
      )}

      {/* New Approval Modal */}
      {showNewApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowNewApproval(false); setSubmitSuccess(false); }} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold">Submit for Approval</h2>
                <p className="text-xs text-slate-400 mt-1">Route a document or asset through the approval pipeline</p>
              </div>
              <button onClick={() => { setShowNewApproval(false); setSubmitSuccess(false); }} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-12 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Submitted Successfully!</h3>
                <p className="text-sm text-slate-400">Your item has been routed to the selected reviewers.</p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Item Title *</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g., Campaign Brief v2 - Final Review"
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Type</label>
                    <select value={newType} onChange={e => setNewType(e.target.value as ApprovalItem['type'])}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                      <option value="brief">Brief</option>
                      <option value="asset">Asset</option>
                      <option value="budget">Budget</option>
                      <option value="copy">Copy</option>
                      <option value="strategy">Strategy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Campaign</label>
                    <select value={newCampaignId} onChange={e => setNewCampaignId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Document / Notes</label>
                  <textarea value={newDocument} onChange={e => setNewDocument(e.target.value)}
                    placeholder="Paste the document content or describe what needs reviewing..."
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-2 block font-medium">Select Reviewers *</label>
                  <div className="space-y-2">
                    {users.filter(u => u.id !== currentUser.id).map(user => (
                      <button key={user.id} onClick={() => toggleReviewer(user.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                          newReviewerIds.includes(user.id)
                            ? 'bg-brand-500/10 border-brand-500/40'
                            : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600'
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          newReviewerIds.includes(user.id) ? 'bg-brand-500/30 text-brand-300' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {user.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.department} · {user.role}</p>
                        </div>
                        {newReviewerIds.includes(user.id) && (
                          <CheckCircle2 size={16} className="text-brand-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button onClick={() => setShowNewApproval(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleCreateApproval}
                    disabled={!newTitle.trim() || newReviewerIds.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                    <Send size={16} /> Submit for Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
