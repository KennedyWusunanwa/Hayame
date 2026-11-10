// Human labels and severity for every audited admin action. Severity decides
// the email: "important" and "critical" go to every admin, "info" is log-only.
export type AdminSeverity = "info" | "important" | "critical";

export const ACTION_CATALOG: Record<string, { label: string; severity: AdminSeverity }> = {
  "admin.login": { label: "Signed in", severity: "info" },
  "admin.login_failed": { label: "Failed sign-in", severity: "info" },
  "admin.login_blocked": { label: "Sign-in blocked (too many tries)", severity: "important" },
  "admin.logout": { label: "Signed out", severity: "info" },
  "admin.account_locked": { label: "Admin account locked", severity: "critical" },
  "admin.password_changed": { label: "Changed own password", severity: "important" },
  "admin.password_reset": { label: "Reset an admin's password", severity: "critical" },
  "admin.created": { label: "Created an admin account", severity: "critical" },
  "admin.role_changed": { label: "Changed an admin's role", severity: "critical" },
  "admin.deactivated": { label: "Deactivated an admin", severity: "critical" },
  "admin.reactivated": { label: "Reactivated an admin", severity: "critical" },
  host_id_viewed: { label: "Opened a host ID document", severity: "info" },
  renter_id_viewed: { label: "Opened a renter's verification photo", severity: "info" },
  renter_verification_approved: { label: "Approved a renter verification", severity: "important" },
  renter_verification_rejected: { label: "Rejected a renter verification", severity: "important" },
  listing_edited_by_admin: { label: "Edited a listing as admin", severity: "important" },
  listing_edited_by_host: { label: "Host edited a live listing", severity: "important" },
  "errors.cleared": { label: "Cleared resolved error reports", severity: "important" },
  "audit.exported": { label: "Exported the audit log", severity: "important" },
  "maintenance.enabled": { label: "Turned maintenance mode on", severity: "critical" },
  "maintenance.disabled": { label: "Turned maintenance mode off", severity: "critical" },
  "maintenance.updated": { label: "Edited the maintenance page", severity: "important" },
  platform_settings_updated: { label: "Changed the platform fee", severity: "critical" },
  booking_refunded: { label: "Refunded a booking", severity: "critical" },
  listing_deleted: { label: "Deleted a listing", severity: "critical" },
  listing_bulk_deleted: { label: "Bulk-deleted listings", severity: "critical" },
  listing_approved: { label: "Approved a listing", severity: "important" },
  listing_rejected: { label: "Rejected a listing", severity: "important" },
  host_application_approved: { label: "Approved a host application", severity: "important" },
  host_application_rejected: { label: "Rejected a host application", severity: "important" },
  dispute_status_updated: { label: "Updated a dispute", severity: "important" },
  review_hidden: { label: "Hid a review", severity: "important" },
  review_restored: { label: "Restored a review", severity: "important" },
  announcement_created: { label: "Published an announcement", severity: "important" },
  announcement_archived: { label: "Archived an announcement", severity: "info" },
  push_message_sent: { label: "Sent a push message", severity: "important" },
  user_profile_updated: { label: "Edited a user profile", severity: "important" },
  user_email_confirmed_manually: { label: "Confirmed a user's email by hand", severity: "important" },
  user_email_sent: { label: "Emailed a user", severity: "info" },
};

export function describeAction(action: string) {
  return (
    ACTION_CATALOG[action] ?? {
      label: action.replace(/[._]/g, " ").replace(/^./, (c) => c.toUpperCase()),
      severity: "info" as AdminSeverity,
    }
  );
}
