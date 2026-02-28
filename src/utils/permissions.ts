import { Role } from '../types';

export interface Permissions {
  canViewDashboard: boolean;
  canViewCampaigns: boolean;
  canCreateCampaign: boolean;
  canEditCampaign: boolean;
  canDeleteCampaign: boolean;
  canViewApprovals: boolean;
  canSubmitForApproval: boolean;
  canApproveReject: boolean;
  canViewKPI: boolean;
  canAddManualKPI: boolean;
  canExportReports: boolean;
  canViewAssets: boolean;
  canUploadAssets: boolean;
  canDeleteAssets: boolean;
  canViewSettings: boolean;
  canEditSettings: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
  canViewAuditLogs: boolean;
  canUseAIBrief: boolean;
  canViewCalendar: boolean;
}

export function getPermissions(role: Role): Permissions {
  switch (role) {
    case 'admin':
      return {
        canViewDashboard: true,
        canViewCampaigns: true,
        canCreateCampaign: true,
        canEditCampaign: true,
        canDeleteCampaign: true,
        canViewApprovals: true,
        canSubmitForApproval: true,
        canApproveReject: true,
        canViewKPI: true,
        canAddManualKPI: true,
        canExportReports: true,
        canViewAssets: true,
        canUploadAssets: true,
        canDeleteAssets: true,
        canViewSettings: true,
        canEditSettings: true,
        canManageUsers: true,
        canManageIntegrations: true,
        canViewAuditLogs: true,
        canUseAIBrief: true,
        canViewCalendar: true,
      };
    case 'editor':
      return {
        canViewDashboard: true,
        canViewCampaigns: true,
        canCreateCampaign: true,
        canEditCampaign: true,
        canDeleteCampaign: false,
        canViewApprovals: true,
        canSubmitForApproval: true,
        canApproveReject: true,
        canViewKPI: true,
        canAddManualKPI: true,
        canExportReports: true,
        canViewAssets: true,
        canUploadAssets: true,
        canDeleteAssets: false,
        canViewSettings: true,
        canEditSettings: false,
        canManageUsers: false,
        canManageIntegrations: false,
        canViewAuditLogs: true,
        canUseAIBrief: true,
        canViewCalendar: true,
      };
    case 'contributor':
      return {
        canViewDashboard: true,
        canViewCampaigns: true,
        canCreateCampaign: true,
        canEditCampaign: false,
        canDeleteCampaign: false,
        canViewApprovals: true,
        canSubmitForApproval: true,
        canApproveReject: false,
        canViewKPI: true,
        canAddManualKPI: false,
        canExportReports: false,
        canViewAssets: true,
        canUploadAssets: true,
        canDeleteAssets: false,
        canViewSettings: true,
        canEditSettings: false,
        canManageUsers: false,
        canManageIntegrations: false,
        canViewAuditLogs: false,
        canUseAIBrief: true,
        canViewCalendar: true,
      };
    case 'viewer':
      return {
        canViewDashboard: true,
        canViewCampaigns: true,
        canCreateCampaign: false,
        canEditCampaign: false,
        canDeleteCampaign: false,
        canViewApprovals: true,
        canSubmitForApproval: false,
        canApproveReject: false,
        canViewKPI: true,
        canAddManualKPI: false,
        canExportReports: false,
        canViewAssets: true,
        canUploadAssets: false,
        canDeleteAssets: false,
        canViewSettings: true,
        canEditSettings: false,
        canManageUsers: false,
        canManageIntegrations: false,
        canViewAuditLogs: false,
        canUseAIBrief: false,
        canViewCalendar: true,
      };
  }
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'editor': return 'Editor';
    case 'contributor': return 'Contributor';
    case 'viewer': return 'Viewer';
  }
}

export function getRoleDescription(role: Role): string {
  switch (role) {
    case 'admin': return 'Full access. Can manage users, approve/reject, delete campaigns, edit settings, and view audit logs.';
    case 'editor': return 'Can create and edit campaigns, approve/reject submissions, upload assets, and export reports. Cannot delete or manage settings.';
    case 'contributor': return 'Can create campaigns and submit items for approval. Cannot approve, delete, or manage settings.';
    case 'viewer': return 'Read-only access. Can view campaigns, dashboards, and assets. Cannot create, edit, or approve anything.';
  }
}
