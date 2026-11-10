// Role and permission matrix for the admin portal. Pure data + one helper, so
// the server guards, the navigation and the Team page all read the same rules.

export const ADMIN_ROLES = ["super_admin", "admin", "support", "finance"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = [
  "overview.view",
  "applications.review",
  "hosts.view",
  "users.view",
  "users.manage",
  "vehicles.review",
  "vehicles.delete",
  "messages.reply",
  "disputes.resolve",
  "bookings.refund",
  "payments.view",
  "reviews.moderate",
  "announcements.send",
  "filters.manage",
  "analytics.view",
  "errors.view",
  "platform.fee",
  "maintenance.manage",
  "audit.view",
  "audit.export",
  "team.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "overview.view": "See the dashboard",
  "applications.review": "Approve or reject host applications and renter verifications",
  "hosts.view": "View hosts",
  "users.view": "View users",
  "users.manage": "Edit, email or confirm users",
  "vehicles.review": "Approve or reject listings",
  "vehicles.delete": "Delete listings",
  "messages.reply": "Message users as Hayame",
  "disputes.resolve": "Update disputes",
  "bookings.refund": "Issue refunds",
  "payments.view": "See Paystack balance, payments and payouts",
  "reviews.moderate": "Hide or restore reviews",
  "announcements.send": "Send announcements and push messages",
  "filters.manage": "Manage car makes and models",
  "analytics.view": "See analytics",
  "errors.view": "See error reports",
  "platform.fee": "Change the platform fee",
  "maintenance.manage": "Turn maintenance mode on or off",
  "audit.view": "Read the audit log",
  "audit.export": "Export the audit log",
  "team.manage": "Manage admin accounts and roles",
};

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[] | "all"> = {
  super_admin: "all",
  admin: [
    "overview.view",
    "applications.review",
    "hosts.view",
    "users.view",
    "users.manage",
    "vehicles.review",
    "vehicles.delete",
    "messages.reply",
    "disputes.resolve",
    "reviews.moderate",
    "announcements.send",
    "filters.manage",
    "analytics.view",
    "errors.view",
    "audit.view",
  ],
  support: [
    "overview.view",
    "hosts.view",
    "users.view",
    "messages.reply",
    "disputes.resolve",
    "reviews.moderate",
    "errors.view",
  ],
  finance: [
    "overview.view",
    "users.view",
    "disputes.resolve",
    "bookings.refund",
    "payments.view",
    "analytics.view",
    "audit.view",
  ],
};

export const ROLE_META: Record<AdminRole, { label: string; description: string }> = {
  super_admin: {
    label: "Super admin",
    description: "Everything, including the team, platform fee, maintenance mode and refunds.",
  },
  admin: {
    label: "Admin",
    description: "Runs day to day: hosts, listings, users, messages, announcements. No money, team or site switches.",
  },
  support: {
    label: "Support",
    description: "Helps people: messages, disputes, reviews and error reports. Read-only on users and hosts.",
  },
  finance: {
    label: "Finance",
    description: "Payments, refunds, disputes and analytics. Cannot change listings, users or the team.",
  },
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

export function permissionsFor(role: AdminRole): readonly Permission[] {
  const granted = ROLE_PERMISSIONS[role];
  return granted === "all" ? PERMISSIONS : granted;
}

export function can(role: AdminRole | null | undefined, permission: Permission) {
  if (!role) return false;
  return permissionsFor(role).includes(permission);
}
