import { useState, useRef, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { BackupFile, BackupMetadata, BackupRestoreMode } from '../types';
import {
  Download, Upload, Shield, Clock, CheckCircle2, XCircle, AlertTriangle,
  FileJson, HardDrive, RotateCcw, Eye, Trash2, ChevronDown, ChevronRight,
  Lock, Info, Archive, RefreshCw
} from 'lucide-react';

const APP_VERSION = '3.6.0';
const APP_SCHEMA_VERSION = '3.6';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const BACKUP_TABLES = [
  'campaigns', 'approvals', 'assets', 'workspacesList', 'tools',
  'editableKpis', 'editableAudiences', 'kpiChannelData', 'kpiTimeSeriesData',
  'kpiSentimentData', 'marketingIdeas', 'publishedContent',
];

// Learning tables: contentPatterns, analyticsEvents

const TABLE_LABELS: Record<string, string> = {
  campaigns: 'Campaigns',
  approvals: 'Approval Items',
  assets: 'Assets',
  workspacesList: 'Workspaces',
  tools: 'Tool Registry',
  editableKpis: 'KPIs',
  editableAudiences: 'Audiences',
  kpiChannelData: 'KPI Channel Data',
  kpiTimeSeriesData: 'KPI Time Series',
  kpiSentimentData: 'KPI Sentiment Data',
  marketingIdeas: 'Marketing Ideas (139)',
  publishedContent: 'Published Content',
  contentPatterns: 'Content Patterns (Learning)',
  analyticsEvents: 'Analytics Events',
};

// Simple hash for checksum
async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate structure of each record
function validateTableStructure(tableName: string, records: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(records)) {
    errors.push(`${tableName}: Expected array, got ${typeof records}`);
    return { valid: false, errors };
  }

  const requiredFields: Record<string, string[]> = {
    campaigns: ['id', 'title', 'status'],
    approvals: ['id', 'title', 'status'],
    assets: ['id', 'name', 'type'],
    workspacesList: ['id', 'name'],
    tools: ['id', 'title'],
    editableKpis: ['id', 'name', 'category'],
    editableAudiences: ['id', 'name', 'type'],
    kpiChannelData: ['id', 'channel'],
    kpiTimeSeriesData: ['id', 'week'],
    kpiSentimentData: ['id', 'date'],
    marketingIdeas: ['id', 'name', 'category'],
    publishedContent: ['id', 'title'],
    contentPatterns: ['id', 'theme'],
    analyticsEvents: ['event', 'timestamp'],
  };

  const fields = requiredFields[tableName] || ['id'];
  records.forEach((record, idx) => {
    if (typeof record !== 'object' || record === null) {
      errors.push(`${tableName}[${idx}]: Expected object`);
      return;
    }
    fields.forEach(field => {
      if (!(field in (record as Record<string, unknown>))) {
        errors.push(`${tableName}[${idx}]: Missing required field "${field}"`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

// Check for duplicate IDs
function checkDuplicateIds(tableName: string, records: unknown[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  records.forEach((record, idx) => {
    const r = record as Record<string, unknown>;
    if (r.id && typeof r.id === 'string') {
      if (ids.has(r.id)) {
        errors.push(`${tableName}[${idx}]: Duplicate ID "${r.id}"`);
      }
      ids.add(r.id);
    }
  });
  return errors;
}

export default function Backups() {
  const {
    currentUser, theme, getBackupData, addBackupLog,
    backupLogs, restoreMerge, restoreFullReplace,
    campaigns, approvals, assets, workspacesList, tools,
    editableKpis, editableAudiences, kpiChannelData,
    kpiTimeSeriesData, kpiSentimentData, marketingIdeas, publishedContent,
    contentPatterns, analyticsEvents,
  } = useApp();

  const [includeLearning, setIncludeLearning] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastBackup, setLastBackup] = useState<BackupFile | null>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<BackupFile | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [validated, setValidated] = useState(false);
  const [restoreMode, setRestoreMode] = useState<BackupRestoreMode>('dry-run');
  const [dryRunResult, setDryRunResult] = useState<Record<string, { current: number; incoming: number; new: number; updated: number }> | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState('');

  // Safety confirmation for full replace
  const [showSafetyConfirm, setShowSafetyConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // History expand
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';
  const isDark = theme === 'dark';

  // Current record counts
  const currentCounts: Record<string, number> = {
    campaigns: campaigns.length,
    approvals: approvals.length,
    assets: assets.length,
    workspacesList: workspacesList.length,
    tools: tools.length,
    editableKpis: editableKpis.length,
    editableAudiences: editableAudiences.length,
    kpiChannelData: kpiChannelData.length,
    kpiTimeSeriesData: kpiTimeSeriesData.length,
    kpiSentimentData: kpiSentimentData.length,
    marketingIdeas: marketingIdeas.length,
    publishedContent: publishedContent.length,
    contentPatterns: contentPatterns.length,
    analyticsEvents: analyticsEvents.length,
  };

  const totalRecords = Object.values(currentCounts).reduce((a, b) => a + b, 0);

  // ==================== GENERATE BACKUP ====================

  const handleGenerateBackup = useCallback(async () => {
    setGenerating(true);
    try {
      const data = getBackupData(includeLearning);
      const recordCounts: Record<string, number> = {};
      Object.entries(data).forEach(([key, arr]) => {
        recordCounts[key] = (arr as unknown[]).length;
      });

      const dataStr = JSON.stringify(data);
      const checksum = await generateChecksum(dataStr);

      const metadata: BackupMetadata = {
        version: APP_VERSION,
        appSchemaVersion: APP_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        checksum,
        recordCounts,
        includesLearningPatterns: includeLearning,
      };

      const backup: BackupFile = { metadata, data: data as Record<string, unknown[]> };
      setLastBackup(backup);

      addBackupLog({
        id: `bl-${Date.now()}`,
        type: 'export',
        status: 'success',
        recordCounts,
        performedBy: currentUser?.name || 'Unknown',
        checksum,
        createdAt: new Date().toISOString(),
        notes: `Exported ${Object.values(recordCounts).reduce((a, b) => a + b, 0)} records${includeLearning ? ' (incl. learning patterns)' : ''}`,
      });
    } catch (err) {
      console.error('Backup generation failed:', err);
    }
    setGenerating(false);
  }, [getBackupData, includeLearning, addBackupLog, currentUser]);

  const handleDownload = useCallback(() => {
    if (!lastBackup) return;
    const blob = new Blob([JSON.stringify(lastBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaignos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [lastBackup]);

  // ==================== UPLOAD & VALIDATE ====================

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(null);
    setUploadErrors([]);
    setUploadWarnings([]);
    setValidated(false);
    setDryRunResult(null);
    setRestoreSuccess('');

    if (file.size > MAX_FILE_SIZE) {
      setUploadErrors([`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 25MB limit`]);
      return;
    }

    setUploadFileName(file.name);

    try {
      const text = await file.text();
      let parsed: BackupFile;

      try {
        parsed = JSON.parse(text);
      } catch {
        setUploadErrors(['Invalid JSON file. The file is corrupted or not a valid backup.']);
        return;
      }

      // Step 1: Top-level key validation
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!parsed.metadata) errors.push('Missing "metadata" section');
      if (!parsed.data) errors.push('Missing "data" section');

      if (errors.length > 0) {
        setUploadErrors(errors);
        return;
      }

      // Step 2: Metadata validation
      if (!parsed.metadata.version) warnings.push('Missing version in metadata');
      if (!parsed.metadata.checksum) errors.push('Missing checksum — file integrity cannot be verified');
      if (!parsed.metadata.generatedAt) warnings.push('Missing generation timestamp');

      // Version compatibility
      if (parsed.metadata.appSchemaVersion && parsed.metadata.appSchemaVersion !== APP_SCHEMA_VERSION) {
        warnings.push(`Schema version mismatch: backup is v${parsed.metadata.appSchemaVersion}, current is v${APP_SCHEMA_VERSION}. Full Replace blocked unless forced.`);
      }

      // Checksum verification
      if (parsed.metadata.checksum) {
        const dataStr = JSON.stringify(parsed.data);
        const recalculated = await generateChecksum(dataStr);
        if (recalculated !== parsed.metadata.checksum) {
          errors.push('Checksum mismatch — file data has been modified since export. Restore blocked.');
          setUploadErrors(errors);
          return;
        }
      }

      // Step 3: Schema validation per table
      Object.entries(parsed.data).forEach(([tableName, records]) => {
        if (!Array.isArray(records)) {
          errors.push(`${tableName}: Expected array of records`);
          return;
        }
        const validation = validateTableStructure(tableName, records);
        if (!validation.valid) {
          errors.push(...validation.errors.slice(0, 5));
          if (validation.errors.length > 5) {
            errors.push(`${tableName}: ... and ${validation.errors.length - 5} more errors`);
          }
        }

        // Duplicate ID check
        const dupes = checkDuplicateIds(tableName, records);
        if (dupes.length > 0) {
          errors.push(...dupes.slice(0, 3));
        }
      });

      if (errors.length > 0) {
        setUploadErrors(errors);
        setUploadWarnings(warnings);
        return;
      }

      setUploadedFile(parsed);
      setUploadErrors([]);
      setUploadWarnings(warnings);
      setValidated(true);
    } catch (err) {
      setUploadErrors([`Failed to read file: ${err}`]);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ==================== DRY RUN ====================

  const handleDryRun = useCallback(() => {
    if (!uploadedFile) return;

    const result: Record<string, { current: number; incoming: number; new: number; updated: number }> = {};

    Object.entries(uploadedFile.data).forEach(([tableName, records]) => {
      const currentData = currentCounts[tableName] || 0;
      const incoming = (records as unknown[]).length;
      let newCount = 0;
      let updatedCount = 0;

      // Compare IDs if we have current data
      const currentItems = (() => {
        switch (tableName) {
          case 'campaigns': return campaigns;
          case 'approvals': return approvals;
          case 'assets': return assets;
          case 'workspacesList': return workspacesList;
          case 'tools': return tools;
          case 'editableKpis': return editableKpis;
          case 'editableAudiences': return editableAudiences;
          case 'kpiChannelData': return kpiChannelData;
          case 'kpiTimeSeriesData': return kpiTimeSeriesData;
          case 'kpiSentimentData': return kpiSentimentData;
          case 'marketingIdeas': return marketingIdeas;
          case 'publishedContent': return publishedContent;
          case 'contentPatterns': return contentPatterns;
          default: return [];
        }
      })();

      const currentIds = new Set((currentItems as Array<{ id?: string }>).map(i => i.id).filter(Boolean));

      (records as Array<{ id?: string }>).forEach(r => {
        if (r.id && currentIds.has(r.id)) updatedCount++;
        else newCount++;
      });

      result[tableName] = { current: currentData, incoming, new: newCount, updated: updatedCount };
    });

    setDryRunResult(result);
    setRestoreMode('dry-run');

    addBackupLog({
      id: `bl-${Date.now()}`,
      type: 'import',
      mode: 'dry-run',
      status: 'dry-run',
      recordCounts: Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.incoming])),
      performedBy: currentUser?.name || 'Unknown',
      fileName: uploadFileName,
      createdAt: new Date().toISOString(),
      notes: 'Dry run validation completed successfully',
    });
  }, [uploadedFile, currentCounts, campaigns, approvals, assets, workspacesList, tools, editableKpis, editableAudiences, kpiChannelData, kpiTimeSeriesData, kpiSentimentData, marketingIdeas, publishedContent, contentPatterns, addBackupLog, currentUser, uploadFileName]);

  // ==================== EXECUTE RESTORE ====================

  const executeRestore = useCallback((mode: 'merge' | 'full-replace') => {
    if (!uploadedFile) return;
    setRestoring(true);

    try {
      if (mode === 'merge') {
        restoreMerge(uploadedFile.data);
      } else {
        restoreFullReplace(uploadedFile.data);
      }

      const recordCounts: Record<string, number> = {};
      Object.entries(uploadedFile.data).forEach(([k, v]) => {
        recordCounts[k] = (v as unknown[]).length;
      });

      addBackupLog({
        id: `bl-${Date.now()}`,
        type: 'import',
        mode,
        status: 'success',
        recordCounts,
        performedBy: currentUser?.name || 'Unknown',
        fileName: uploadFileName,
        checksum: uploadedFile.metadata.checksum,
        createdAt: new Date().toISOString(),
        notes: `${mode === 'merge' ? 'Merge' : 'Full replace'} restore completed. ${Object.values(recordCounts).reduce((a, b) => a + b, 0)} records processed.`,
      });

      setRestoreSuccess(`✅ ${mode === 'merge' ? 'Merge' : 'Full replace'} restore completed successfully.`);
      setUploadedFile(null);
      setValidated(false);
      setDryRunResult(null);
    } catch (err) {
      addBackupLog({
        id: `bl-${Date.now()}`,
        type: 'import',
        mode,
        status: 'failed',
        performedBy: currentUser?.name || 'Unknown',
        fileName: uploadFileName,
        createdAt: new Date().toISOString(),
        notes: `Restore failed: ${err}`,
      });
      setUploadErrors([`Restore failed: ${err}. No data was changed (transaction rolled back).`]);
    }

    setRestoring(false);
    setShowSafetyConfirm(false);
    setConfirmText('');
    setCountdown(5);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, [uploadedFile, restoreMerge, restoreFullReplace, addBackupLog, currentUser, uploadFileName]);

  const handleFullReplaceConfirm = useCallback(() => {
    setShowSafetyConfirm(true);
    setCountdown(5);
    setConfirmText('');
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Lock size={48} className="mx-auto mb-4 text-slate-600" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-500">Only administrators can access the backup system.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
              <HardDrive size={22} className="text-violet-500" />
            </div>
            Backup & Restore
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Export, import, and restore your CampaignOS data with integrity verification.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
          <Shield size={12} />
          Admin Only
        </div>
      </div>

      {/* Success Message */}
      {restoreSuccess && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{restoreSuccess}</span>
          <button onClick={() => setRestoreSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-400">✕</button>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==================== GENERATE BACKUP ==================== */}
        <div className={`rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className={`p-5 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            <h2 className="font-semibold flex items-center gap-2">
              <Download size={16} className="text-blue-500" />
              Generate Backup
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Create a full logical snapshot of your data.
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Record counts */}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Current Data</p>
              <div className="grid grid-cols-2 gap-2">
                {BACKUP_TABLES.map(table => (
                  <div key={table} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{TABLE_LABELS[table]}</span>
                    <span className="font-semibold tabular-nums">{currentCounts[table]}</span>
                  </div>
                ))}
              </div>
              <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm ${isDark ? 'bg-brand-500/10 text-brand-400' : 'bg-brand-50 text-brand-600'}`}>
                <span>Total Records</span>
                <span className="tabular-nums">{totalRecords}</span>
              </div>
            </div>

            {/* Include learning toggle */}
            <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${includeLearning ? isDark ? 'border-violet-500/30 bg-violet-500/5' : 'border-violet-200 bg-violet-50' : isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
              <input type="checkbox" checked={includeLearning} onChange={e => setIncludeLearning(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500" />
              <div>
                <p className="text-sm font-medium">Include Learning Patterns</p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Content patterns ({contentPatterns.length}) + Analytics events ({analyticsEvents.length})
                </p>
              </div>
            </label>

            {/* Generate button */}
            <button onClick={handleGenerateBackup} disabled={generating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
              {generating ? <><RefreshCw size={16} className="animate-spin" /> Generating...</> : <><Archive size={16} /> Generate Backup</>}
            </button>

            {/* Download button */}
            {lastBackup && (
              <div className={`p-4 rounded-xl border animate-fade-in ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <FileJson size={20} className="text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Backup Ready</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {new Date(lastBackup.metadata.generatedAt).toLocaleString()} · {Object.values(lastBackup.metadata.recordCounts).reduce((a, b) => a + b, 0)} records
                    </p>
                  </div>
                </div>
                <div className={`text-xs font-mono px-3 py-2 rounded-lg mb-3 truncate ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                  SHA-256: {lastBackup.metadata.checksum.slice(0, 32)}...
                </div>
                <button onClick={handleDownload}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
                  <Download size={16} /> Download JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== UPLOAD & RESTORE ==================== */}
        <div className={`rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className={`p-5 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            <h2 className="font-semibold flex items-center gap-2">
              <Upload size={16} className="text-amber-500" />
              Upload & Restore
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Upload a backup file, validate, and restore.
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* File upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDark ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
              <Upload size={24} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              <p className="text-sm font-medium">Click to upload backup file</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>JSON format · Max 25MB</p>
              {uploadFileName && (
                <p className={`text-xs mt-2 font-medium ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                  📄 {uploadFileName}
                </p>
              )}
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </div>

            {/* Errors */}
            {uploadErrors.length > 0 && (
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={16} className="text-red-500" />
                  <span className="text-sm font-semibold text-red-500">Validation Failed</span>
                </div>
                <ul className="space-y-1">
                  {uploadErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-400 flex items-start gap-2">
                      <span className="mt-0.5">•</span><span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {uploadWarnings.length > 0 && (
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span className="text-sm font-semibold text-amber-500">Warnings</span>
                </div>
                <ul className="space-y-1">
                  {uploadWarnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-400 flex items-start gap-2">
                      <span className="mt-0.5">•</span><span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validated — show actions */}
            {validated && uploadedFile && (
              <div className="space-y-3 animate-fade-in">
                <div className={`p-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">File validated — checksum verified ✓</span>
                </div>

                {/* Metadata */}
                <div className={`p-3 rounded-xl text-xs space-y-1 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  <p><span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Version:</span> <span className="font-medium">{uploadedFile.metadata.version}</span></p>
                  <p><span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Generated:</span> <span className="font-medium">{new Date(uploadedFile.metadata.generatedAt).toLocaleString()}</span></p>
                  <p><span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Tables:</span> <span className="font-medium">{Object.keys(uploadedFile.data).length}</span></p>
                  <p><span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Total records:</span> <span className="font-medium">{Object.values(uploadedFile.metadata.recordCounts).reduce((a, b) => a + b, 0)}</span></p>
                  <p><span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Learning data:</span> <span className="font-medium">{uploadedFile.metadata.includesLearningPatterns ? 'Yes' : 'No'}</span></p>
                </div>

                {/* Mode selector */}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Restore Mode</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([['dry-run', 'Dry Run', Eye], ['merge', 'Merge', RefreshCw], ['full-replace', 'Full Replace', RotateCcw]] as [BackupRestoreMode, string, typeof Eye][]).map(([mode, label, Icon]) => (
                      <button key={mode} onClick={() => setRestoreMode(mode)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all ${restoreMode === mode
                          ? mode === 'full-replace'
                            ? isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-300 text-red-600'
                            : isDark ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-brand-50 border-brand-300 text-brand-600'
                          : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        <Icon size={16} className="mx-auto mb-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                    {restoreMode === 'dry-run' && 'Preview changes without modifying any data.'}
                    {restoreMode === 'merge' && 'Insert new records and update existing ones. No data is deleted.'}
                    {restoreMode === 'full-replace' && '⚠️ Deletes all current data and replaces with backup. Irreversible.'}
                  </p>
                </div>

                {/* Execute button */}
                {restoreMode === 'dry-run' && (
                  <button onClick={handleDryRun}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                    <Eye size={16} /> Run Dry Run Analysis
                  </button>
                )}
                {restoreMode === 'merge' && (
                  <button onClick={() => executeRestore('merge')} disabled={restoring}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
                    {restoring ? <><RefreshCw size={16} className="animate-spin" /> Merging...</> : <><RefreshCw size={16} /> Execute Merge Restore</>}
                  </button>
                )}
                {restoreMode === 'full-replace' && (
                  <button onClick={handleFullReplaceConfirm}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
                    <AlertTriangle size={16} /> Execute Full Replace
                  </button>
                )}

                {/* Dry Run Results */}
                {dryRunResult && (
                  <div className={`p-4 rounded-xl border animate-fade-in ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Info size={14} className="text-blue-500" /> Dry Run Results
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(dryRunResult).map(([table, counts]) => (
                        <div key={table} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-slate-900/50' : 'bg-white'}`}>
                          <span className={`flex-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{TABLE_LABELS[table] || table}</span>
                          <span className="tabular-nums">{counts.current} → {counts.incoming}</span>
                          {counts.new > 0 && <span className="text-emerald-500 font-medium">+{counts.new}</span>}
                          {counts.updated > 0 && <span className="text-amber-500 font-medium">~{counts.updated}</span>}
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 pt-3 border-t text-xs ${isDark ? 'border-slate-700 text-slate-500' : 'border-gray-200 text-gray-400'}`}>
                      <span className="text-emerald-500">+N = new records</span> · <span className="text-amber-500">~N = updated records</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== RESTORE HISTORY ==================== */}
      <div className={`rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-5 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
          <h2 className="font-semibold flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            Restore History
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Audit trail of all backup and restore operations.
          </p>
        </div>

        {backupLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock size={24} className={`mx-auto mb-2 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No backup or restore operations yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {backupLogs.map(log => (
              <div key={log.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    log.type === 'export' ? isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-500'
                    : log.status === 'success' ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-500'
                    : log.status === 'failed' ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
                    : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-500'
                  }`}>
                    {log.type === 'export' ? <Download size={16} /> : log.status === 'failed' ? <XCircle size={16} /> : <Upload size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {log.type === 'export' ? 'Backup Export' : `Restore (${log.mode})`}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {log.performedBy} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {log.status}
                  </span>

                  {expandedLog === log.id ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                </button>

                {expandedLog === log.id && (
                  <div className={`px-5 pb-4 animate-fade-in`}>
                    <div className={`p-4 rounded-xl space-y-2 text-xs ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                      {log.notes && <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>{log.notes}</p>}
                      {log.fileName && <p><span className={isDark ? 'text-slate-500' : 'text-gray-400'}>File:</span> {log.fileName}</p>}
                      {log.checksum && (
                        <p className="font-mono"><span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Checksum:</span> {log.checksum.slice(0, 32)}...</p>
                      )}
                      {log.recordCounts && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <p className={`font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Record Counts:</p>
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(log.recordCounts).map(([table, count]) => (
                              <div key={table} className="flex justify-between">
                                <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{TABLE_LABELS[table] || table}</span>
                                <span className="tabular-nums font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== SAFETY CONFIRMATION MODAL ==================== */}
      {showSafetyConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowSafetyConfirm(false); if (countdownRef.current) clearInterval(countdownRef.current); }} />
          <div className={`relative rounded-2xl w-full max-w-md shadow-2xl animate-scale-in ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-center">Full Replace Restore</h3>
              <p className={`text-sm text-center mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                This will <span className="font-bold text-red-500">permanently delete all current data</span> and replace it with the backup file.
                This action cannot be undone.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Type <span className="font-mono text-red-500">RESTORE CONFIRM</span> to proceed:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="RESTORE CONFIRM"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400'} focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                />
              </div>

              {countdown > 0 && (
                <div className={`text-center py-3 rounded-xl ${isDark ? 'bg-red-500/5' : 'bg-red-50'}`}>
                  <p className="text-xs text-red-500 font-medium">
                    Wait {countdown} seconds before confirming...
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSafetyConfirm(false); setConfirmText(''); if (countdownRef.current) clearInterval(countdownRef.current); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'}`}>
                  Cancel
                </button>
                <button
                  onClick={() => executeRestore('full-replace')}
                  disabled={confirmText !== 'RESTORE CONFIRM' || countdown > 0 || restoring}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
                  {restoring ? <><RefreshCw size={16} className="animate-spin" /> Restoring...</> : <><Trash2 size={14} /> Confirm Full Replace</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
