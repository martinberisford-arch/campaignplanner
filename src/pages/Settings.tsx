import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { workspaces } from '../data/mockData';
import { Role } from '../types';
import { getRoleDescription } from '../utils/permissions';
import {
  Shield, Users, Bell, Globe, Lock, Database, Palette,
  ChevronRight, CheckCircle2, FileText, Zap, X, Save, Send,
  UserPlus, AlertTriangle, Eye, EyeOff, Trash2, RotateCcw, Edit3
} from 'lucide-react';

type SettingsTab = 'general' | 'security' | 'integrations' | 'team' | 'compliance';

export default function Settings() {
  const {
    workspaceSettings, setWorkspaceSettings,
    notificationSettings, setNotificationSettings,
    integrations, setIntegrations,
    teamMembers,
    permissions, currentUser,
    createUser, updateUser, deactivateUser, reactivateUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saveMessage, setSaveMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);

  // Create user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('contributor');
  const [newDept, setNewDept] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  // Edit user form
  const [editRole, setEditRole] = useState<Role>('contributor');
  const [editDept, setEditDept] = useState('');

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; requireAdmin?: boolean }[] = [
    { id: 'general', label: 'General', icon: <Palette size={16} /> },
    { id: 'security', label: 'Security & Access', icon: <Shield size={16} /> },
    { id: 'integrations', label: 'Integrations', icon: <Globe size={16} /> },
    { id: 'team', label: 'Team & Users', icon: <Users size={16} /> },
    { id: 'compliance', label: 'Compliance', icon: <FileText size={16} /> },
  ];

  const showSaved = (msg?: string) => {
    setSaveMessage(msg || 'Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 2500);
  };

  const toggleNotification = (index: number) => {
    if (!permissions.canEditSettings) return;
    setNotificationSettings(prev =>
      prev.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item)
    );
    showSaved('Notification preference updated');
  };

  const toggleIntegration = (index: number) => {
    if (!permissions.canManageIntegrations) return;
    setIntegrations(prev =>
      prev.map((item, i) => i === index ? {
        ...item,
        status: item.status === 'connected' ? 'available' as const : 'connected' as const
      } : item)
    );
    showSaved(integrations[index].status === 'connected' ? `${integrations[index].name} disconnected` : `${integrations[index].name} connected`);
  };

  const handleSaveWorkspace = () => {
    if (!permissions.canEditSettings) return;
    showSaved('Workspace settings saved');
  };

  const handleCreateUser = () => {
    setCreateError('');
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setCreateError('All required fields must be filled.');
      return;
    }
    if (newPassword.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }

    const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const result = createUser({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      avatar: initials,
      department: newDept || 'General',
    });

    if (!result.success) {
      setCreateError(result.error || 'Failed to create user');
    } else {
      setCreateSuccess(true);
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('contributor');
        setNewDept('');
        showSaved(`User ${newName} created successfully`);
      }, 1500);
    }
  };

  const openEditUser = (userId: string) => {
    const user = teamMembers.find(u => u.id === userId);
    if (user) {
      setEditRole(user.role);
      setEditDept(user.department);
      setShowEditModal(userId);
    }
  };

  const handleUpdateUser = () => {
    if (showEditModal) {
      updateUser(showEditModal, { role: editRole, department: editDept });
      setShowEditModal(null);
      showSaved('User updated successfully');
    }
  };

  const roleColorClass = (role: string) =>
    role === 'admin' ? 'bg-brand-500/20 text-brand-400' :
    role === 'editor' ? 'bg-emerald-500/20 text-emerald-400' :
    role === 'contributor' ? 'bg-amber-500/20 text-amber-400' :
    'bg-slate-500/20 text-slate-400';

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your workspace, security, integrations, and compliance
            {!permissions.canEditSettings && (
              <span className="ml-2 text-amber-400 text-xs font-medium">(Read-only — your role cannot edit settings)</span>
            )}
          </p>
        </div>
        {saveMessage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 font-medium animate-fade-in">
            <CheckCircle2 size={16} />
            {saveMessage}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-brand-600/20 text-brand-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Workspace Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Workspace Name</label>
                    <input type="text" value={workspaceSettings.name}
                      onChange={e => permissions.canEditSettings && setWorkspaceSettings(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!permissions.canEditSettings}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Organisation</label>
                    <input type="text" value={workspaceSettings.organisation}
                      onChange={e => permissions.canEditSettings && setWorkspaceSettings(prev => ({ ...prev, organisation: e.target.value }))}
                      disabled={!permissions.canEditSettings}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Sector</label>
                    <select value={workspaceSettings.sector}
                      onChange={e => permissions.canEditSettings && setWorkspaceSettings(prev => ({ ...prev, sector: e.target.value }))}
                      disabled={!permissions.canEditSettings}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <option>Public Sector - Healthcare</option>
                      <option>Public Sector - Government</option>
                      <option>Public Sector - Education</option>
                      <option>Non-Profit</option>
                      <option>Private Sector</option>
                    </select>
                  </div>
                  {permissions.canEditSettings && (
                    <button onClick={handleSaveWorkspace}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
                      <Save size={16} /> Save Changes
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Active Workspaces</h3>
                <div className="space-y-3">
                  {workspaces.map(ws => (
                    <div key={ws.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                      <span className="text-2xl">{ws.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ws.name}</p>
                        <p className="text-xs text-slate-500">{ws.campaigns} campaigns · {ws.members} members</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-600" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Notifications</h3>
                <div className="space-y-3">
                  {notificationSettings.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell size={14} className="text-slate-500" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <button
                        onClick={() => toggleNotification(i)}
                        disabled={!permissions.canEditSettings}
                        className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${item.enabled ? 'bg-brand-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Lock size={16} className="text-brand-400" /> Authentication
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'SSO via Microsoft Azure AD', status: 'Active', icon: '🔐' },
                    { label: 'Multi-factor Authentication (MFA)', status: 'Enforced', icon: '🛡️' },
                    { label: 'OAuth 2.0 + OpenID Connect', status: 'Active', icon: '🔑' },
                    { label: 'Session timeout: 30 minutes', status: 'Configured', icon: '⏱️' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm flex-1">{item.label}</span>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-slate-400 mb-4">Permissions matrix defining what each role can do within CampaignOS. Your current role: <span className="font-semibold text-white capitalize">{currentUser?.role}</span></p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-500">
                        <th className="text-left p-3">Permission</th>
                        <th className="text-center p-3">Admin</th>
                        <th className="text-center p-3">Editor</th>
                        <th className="text-center p-3">Contributor</th>
                        <th className="text-center p-3">Viewer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {[
                        { perm: 'View campaigns & dashboards', vals: [true, true, true, true] },
                        { perm: 'Create campaigns', vals: [true, true, true, false] },
                        { perm: 'Edit campaigns', vals: [true, true, false, false] },
                        { perm: 'Delete campaigns', vals: [true, false, false, false] },
                        { perm: 'Submit for approval', vals: [true, true, true, false] },
                        { perm: 'Approve / reject', vals: [true, true, false, false] },
                        { perm: 'Upload assets', vals: [true, true, true, false] },
                        { perm: 'Delete assets', vals: [true, false, false, false] },
                        { perm: 'Export reports', vals: [true, true, false, false] },
                        { perm: 'Add manual KPI data', vals: [true, true, false, false] },
                        { perm: 'Use AI Brief Generator', vals: [true, true, true, false] },
                        { perm: 'Manage users', vals: [true, false, false, false] },
                        { perm: 'Edit workspace settings', vals: [true, false, false, false] },
                        { perm: 'Manage integrations', vals: [true, false, false, false] },
                        { perm: 'View audit logs', vals: [true, true, false, false] },
                      ].map(row => (
                        <tr key={row.perm} className="hover:bg-slate-800/20">
                          <td className="p-3 font-medium text-xs">{row.perm}</td>
                          {row.vals.map((v, i) => (
                            <td key={i} className="p-3 text-center">
                              {v ? <CheckCircle2 size={14} className="text-emerald-400 mx-auto" /> : <span className="text-slate-700">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {permissions.canViewAuditLogs && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Database size={16} className="text-amber-400" /> Audit Logs
                    </h3>
                    <button className="text-xs text-brand-400 hover:text-brand-300 font-medium">Export Logs</button>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">All user actions are logged with timestamps, IP addresses, and action details for compliance and audit purposes.</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Last 30 days: <span className="text-white font-semibold">2,847 events</span></span>
                    <span>Retention: <span className="text-white font-semibold">7 years</span></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-fade-in">
              {!permissions.canManageIntegrations && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-300">Only administrators can connect or disconnect integrations.</p>
                </div>
              )}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Connected Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {integrations.map((int, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 transition-colors">
                      <span className="text-2xl">{int.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{int.name}</p>
                        <p className="text-xs text-slate-500">{int.desc}</p>
                      </div>
                      {int.status === 'connected' ? (
                        <button onClick={() => toggleIntegration(i)}
                          disabled={!permissions.canManageIntegrations}
                          className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-red-500/10 hover:text-red-400 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-400">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full group-hover:bg-red-400 group-disabled:group-hover:bg-emerald-400" />
                          <span className="group-hover:hidden group-disabled:group-hover:inline">Connected</span>
                          <span className="hidden group-hover:inline group-disabled:group-hover:hidden">Disconnect</span>
                        </button>
                      ) : (
                        <button onClick={() => toggleIntegration(i)}
                          disabled={!permissions.canManageIntegrations}
                          className="text-[10px] font-semibold text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-full hover:bg-brand-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-brand-400" />
                  <h3 className="font-semibold">API Access</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">Use the CampaignOS API for custom integrations and data exports.</p>
                <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <code className="text-xs text-slate-300 flex-1 font-mono">sk-campaignos-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>
                  {permissions.canManageIntegrations && (
                    <button className="text-xs text-brand-400 hover:text-brand-300 font-medium">Regenerate</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Team Members</h3>
                    <p className="text-xs text-slate-500 mt-1">{teamMembers.filter(m => m.active).length} active, {teamMembers.filter(m => !m.active).length} deactivated</p>
                  </div>
                  {permissions.canManageUsers && (
                    <button onClick={() => { setShowCreateModal(true); setCreateError(''); }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold transition-colors">
                      <UserPlus size={14} /> Create User
                    </button>
                  )}
                </div>

                {!permissions.canManageUsers && (
                  <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                    <Lock size={14} className="text-amber-400" />
                    <p className="text-xs text-amber-300">Only administrators can create, edit, or deactivate users.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      member.active ? 'bg-slate-800/40 border-transparent' : 'bg-slate-800/20 border-red-500/10 opacity-60'
                    }`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        member.active
                          ? member.role === 'admin' ? 'bg-gradient-to-br from-brand-400 to-violet-500'
                          : member.role === 'editor' ? 'bg-gradient-to-br from-emerald-400 to-teal-600'
                          : member.role === 'contributor' ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-slate-400 to-slate-600'
                          : 'bg-slate-700'
                      }`}>
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{member.name}</p>
                          {member.id === currentUser?.id && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400">YOU</span>
                          )}
                          {!member.active && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">DEACTIVATED</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      <span className="text-xs text-slate-400 hidden md:block">{member.department}</span>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${roleColorClass(member.role)}`}>
                        {member.role}
                      </span>
                      {permissions.canManageUsers && member.id !== currentUser?.id && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditUser(member.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors" title="Edit user">
                            <Edit3 size={14} />
                          </button>
                          {member.active ? (
                            <button onClick={() => { deactivateUser(member.id); showSaved(`${member.name} deactivated`); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Deactivate user">
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button onClick={() => { reactivateUser(member.id); showSaved(`${member.name} reactivated`); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Reactivate user">
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Descriptions */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Role Descriptions</h3>
                <div className="space-y-3">
                  {(['admin', 'editor', 'contributor', 'viewer'] as Role[]).map(role => (
                    <div key={role} className="p-4 bg-slate-800/40 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${roleColorClass(role)}`}>{role}</span>
                      </div>
                      <p className="text-xs text-slate-400">{getRoleDescription(role)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-brand-400" /> Compliance Standards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { standard: 'UK GDPR', status: 'Compliant', desc: 'Data protection and privacy standards', icon: '🇬🇧' },
                    { standard: 'ISO 27001', status: 'Ready', desc: 'Information security management', icon: '🔒' },
                    { standard: 'Cyber Essentials Plus', status: 'Certified', desc: 'UK government security standard', icon: '🛡️' },
                    { standard: 'SOC 2 Type II', status: 'In Progress', desc: 'Service organisation controls', icon: '📋' },
                    { standard: 'WCAG 2.1 AA', status: 'Compliant', desc: 'Web accessibility guidelines', icon: '♿' },
                    { standard: 'NHS DSPT', status: 'Submitted', desc: 'Data Security Protection Toolkit', icon: '🏥' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-slate-800/40 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-sm font-semibold">{item.standard}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                          item.status === 'Compliant' || item.status === 'Certified' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.status === 'Ready' || item.status === 'Submitted' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>{item.status}</span>
                      </div>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Data Handling</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Data residency', value: 'UK (London region)' },
                    { label: 'Encryption at rest', value: 'AES-256' },
                    { label: 'Encryption in transit', value: 'TLS 1.3' },
                    { label: 'Backup frequency', value: 'Every 4 hours' },
                    { label: 'Data retention', value: '7 years (configurable)' },
                    { label: 'Right to deletion', value: 'DSAR process active' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setCreateSuccess(false); }} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Create New User</h2>
                <p className="text-xs text-slate-400 mt-1">Add a new team member with assigned role and credentials</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); setCreateSuccess(false); }} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {createSuccess ? (
              <div className="p-12 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">User Created!</h3>
                <p className="text-sm text-slate-400">They can now log in with their credentials.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Full Name *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., Jane Smith"
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Email Address *</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    placeholder="e.g., jane.smith@nhs.net"
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Password * (min 6 characters)</label>
                  <div className="relative">
                    <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Set their initial password"
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Role *</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value as Role)}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="contributor">Contributor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Department</label>
                    <input type="text" value={newDept} onChange={e => setNewDept(e.target.value)}
                      placeholder="e.g., Marketing"
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Selected Role: <span className="capitalize text-white">{newRole}</span></p>
                  <p className="text-xs text-slate-400">{getRoleDescription(newRole)}</p>
                </div>

                {createError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    {createError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleCreateUser}
                    disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                    <Send size={16} /> Create User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit User</h2>
              <button onClick={() => setShowEditModal(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xs font-bold">
                  {teamMembers.find(u => u.id === showEditModal)?.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{teamMembers.find(u => u.id === showEditModal)?.name}</p>
                  <p className="text-xs text-slate-500">{teamMembers.find(u => u.id === showEditModal)?.email}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value as Role)}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="contributor">Contributor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Department</label>
                <input type="text" value={editDept} onChange={e => setEditDept(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditModal(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleUpdateUser}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
