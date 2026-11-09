/**
 * RBAC permission catalogue — the single source of truth for authorisation.
 *
 * Copied into the `permissions` table by the seed script, and asserted against
 * it by an integration test so the database can never drift from the code that
 * guards the routes (docs/ARCHITECTURE.md §10).
 */

export const PERMISSION_MAP = {
  dashboard: ['view'],
  page: ['read', 'create', 'update', 'delete', 'publish', 'schedule', 'archive', 'restore'],
  homepage: ['read', 'update', 'publish'],
  activity: ['read', 'create', 'update', 'delete', 'publish', 'schedule', 'archive', 'restore'],
  news: ['read', 'create', 'update', 'delete', 'publish', 'schedule', 'archive', 'restore'],
  event: ['read', 'create', 'update', 'delete', 'publish', 'schedule', 'archive', 'restore'],
  campaign: ['read', 'create', 'update', 'delete', 'publish', 'schedule', 'archive', 'restore'],
  impact: ['read', 'create', 'update', 'delete', 'publish', 'verify'],
  testimonial: ['read', 'create', 'update', 'delete', 'publish', 'approve'],
  navigation: ['read', 'update'],
  media: ['read', 'upload', 'update', 'delete', 'replace'],
  enquiry: ['read', 'update', 'assign', 'delete', 'export'],
  donation: ['read', 'update_status', 'refund', 'export', 'reconcile'],
  receipt: ['read', 'issue', 'void', 'reissue'],
  seo: ['read', 'manage', 'redirects'],
  'settings.general': ['read', 'update'],
  'settings.contact': ['read', 'update'],
  'settings.forms': ['read', 'update'],
  'settings.email': ['read', 'update'],
  'settings.analytics': ['read', 'update'],
  'settings.donation': ['read', 'update'],
  user: ['read', 'manage', 'invite', 'revoke_sessions'],
  role: ['read', 'manage'],
  audit: ['read', 'export'],
  system: ['health', 'maintenance_mode', 'cache_purge'],
} as const;

export type PermissionResource = keyof typeof PERMISSION_MAP;
export type PermissionAction<R extends PermissionResource> = (typeof PERMISSION_MAP)[R][number];
export type PermissionKey = {
  [R in PermissionResource]: `${R}.${PermissionAction<R>}`;
}[PermissionResource];

/** Meta-permission held only by the Super Admin template. */
export const WILDCARD_PERMISSION = '*';

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  read: 'View',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete',
  publish: 'Publish',
  schedule: 'Schedule',
  archive: 'Archive',
  restore: 'Restore',
  verify: 'Verify',
  approve: 'Approve',
  upload: 'Upload',
  replace: 'Replace',
  assign: 'Assign',
  export: 'Export',
  refund: 'Refund',
  reconcile: 'Reconcile',
  issue: 'Issue',
  void: 'Void',
  reissue: 'Reissue',
  manage: 'Manage',
  redirects: 'Manage redirects',
  update_status: 'Update status',
  invite: 'Invite',
  revoke_sessions: 'Revoke sessions',
  health: 'View health',
  maintenance_mode: 'Toggle maintenance mode',
  cache_purge: 'Purge cache',
};

const RESOURCE_LABELS: Record<string, string> = {
  dashboard: 'dashboard',
  page: 'pages',
  homepage: 'homepage',
  activity: 'activities',
  news: 'news',
  event: 'events',
  campaign: 'campaigns',
  impact: 'impact statistics',
  testimonial: 'testimonials',
  navigation: 'navigation',
  media: 'media library',
  enquiry: 'enquiries',
  donation: 'donations',
  receipt: 'receipts',
  seo: 'SEO settings',
  'settings.general': 'general settings',
  'settings.contact': 'contact settings',
  'settings.forms': 'form settings',
  'settings.email': 'email settings',
  'settings.analytics': 'analytics settings',
  'settings.donation': 'donation settings',
  user: 'users',
  role: 'roles',
  audit: 'audit log',
  system: 'system controls',
};

export interface PermissionDefinition {
  key: PermissionKey;
  resource: PermissionResource;
  action: string;
  description: string;
}

export const PERMISSIONS: readonly PermissionDefinition[] = (
  Object.keys(PERMISSION_MAP) as PermissionResource[]
).flatMap((resource) =>
  PERMISSION_MAP[resource].map((action) => ({
    key: `${resource}.${action}` as PermissionKey,
    resource,
    action,
    description: `${ACTION_LABELS[action] ?? action} ${RESOURCE_LABELS[resource] ?? resource}`,
  })),
);

export const PERMISSION_KEYS: readonly PermissionKey[] = PERMISSIONS.map((p) => p.key);

/** Expand a wildcard permission into the concrete catalogue. */
export function expandPermissions(permissions: readonly string[]): PermissionKey[] {
  if (permissions.includes(WILDCARD_PERMISSION)) {
    return [...PERMISSION_KEYS];
  }
  return permissions.filter((p): p is PermissionKey =>
    (PERMISSION_KEYS as readonly string[]).includes(p),
  );
}

export interface RoleTemplate {
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: readonly string[];
}

const CONTENT_PUBLISHING = [
  'page.publish',
  'page.schedule',
  'homepage.publish',
  'activity.publish',
  'activity.schedule',
  'news.publish',
  'news.schedule',
  'event.publish',
  'event.schedule',
  'campaign.publish',
  'campaign.schedule',
] as const;

/**
 * Role templates mirror docs/ARCHITECTURE.md §10.3. They are starting points:
 * an administrator can create further roles with any combination of
 * permissions, subject to the privilege-escalation guard.
 */
export const ROLE_TEMPLATES: readonly RoleTemplate[] = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    description:
      'Full access to every module, including users, roles, payment configuration, financial exports and security controls.',
    isSystem: true,
    permissions: [WILDCARD_PERMISSION],
  },
  {
    key: 'content_editor',
    name: 'Content Editor',
    description:
      'Writes and publishes pages, homepage sections, activities, news, events, campaigns, media and SEO metadata.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'page.read',
      'page.create',
      'page.update',
      'homepage.read',
      'homepage.update',
      'activity.read',
      'activity.create',
      'activity.update',
      'news.read',
      'news.create',
      'news.update',
      'event.read',
      'event.create',
      'event.update',
      'campaign.read',
      'campaign.create',
      'campaign.update',
      'impact.read',
      'impact.create',
      'impact.update',
      'testimonial.read',
      'testimonial.create',
      'testimonial.update',
      'navigation.read',
      'navigation.update',
      'media.read',
      'media.upload',
      'media.update',
      'seo.read',
      'seo.manage',
      'seo.redirects',
      'settings.general.read',
      'settings.general.update',
      'settings.contact.read',
      'settings.contact.update',
      'settings.forms.read',
      'settings.forms.update',
      ...CONTENT_PUBLISHING,
    ],
  },
  {
    key: 'donation_manager',
    name: 'Donation Manager',
    description:
      'Manages campaigns, donation records, reconciliation and receipts. Cannot refund, export, change payment settings or manage users.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'campaign.read',
      'campaign.create',
      'campaign.update',
      'donation.read',
      'donation.update_status',
      'donation.reconcile',
      'receipt.read',
      'receipt.issue',
      'receipt.reissue',
      'media.read',
      'settings.donation.read',
    ],
  },
  {
    key: 'volunteer_manager',
    name: 'Volunteer Manager',
    description:
      'Handles contact and volunteer enquiries. Has no access to financial data, content publishing or configuration.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'enquiry.read',
      'enquiry.update',
      'enquiry.assign',
      'media.read',
    ],
  },
];
