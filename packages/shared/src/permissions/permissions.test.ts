import { describe, expect, it } from 'vitest';

import {
  PERMISSION_KEYS,
  PERMISSIONS,
  ROLE_TEMPLATES,
  WILDCARD_PERMISSION,
  expandPermissions,
} from './permissions.js';

describe('permission catalogue', () => {
  it('uses the resource.action format', () => {
    for (const permission of PERMISSIONS) {
      expect(permission.key).toMatch(/^[a-z]+(\.[a-z]+)*\.[a-z_]+$/);
      expect(permission.key).toBe(`${permission.resource}.${permission.action}`);
    }
  });

  it('contains no duplicates', () => {
    expect(new Set(PERMISSION_KEYS).size).toBe(PERMISSION_KEYS.length);
  });

  it('covers every module described in the architecture', () => {
    const resources = new Set(PERMISSIONS.map((p) => p.resource));
    for (const resource of [
      'page',
      'media',
      'enquiry',
      'donation',
      'receipt',
      'seo',
      'user',
      'role',
      'audit',
    ]) {
      expect(resources.has(resource as never)).toBe(true);
    }
  });

  it('gives every permission a human-readable description', () => {
    for (const permission of PERMISSIONS) {
      expect(permission.description.length).toBeGreaterThan(3);
    }
  });
});

describe('expandPermissions', () => {
  it('expands the wildcard to the full catalogue', () => {
    expect(expandPermissions([WILDCARD_PERMISSION])).toEqual([...PERMISSION_KEYS]);
  });

  it('drops unknown permissions', () => {
    expect(expandPermissions(['page.read', 'not.a.permission'])).toEqual(['page.read']);
  });
});

describe('role templates', () => {
  it('declares four system templates with unique keys', () => {
    expect(ROLE_TEMPLATES).toHaveLength(4);
    expect(new Set(ROLE_TEMPLATES.map((r) => r.key)).size).toBe(4);
    expect(ROLE_TEMPLATES.every((r) => r.isSystem)).toBe(true);
  });

  it('only references permissions that exist in the catalogue', () => {
    const known = new Set<string>([...PERMISSION_KEYS, WILDCARD_PERMISSION]);
    for (const role of ROLE_TEMPLATES) {
      for (const permission of role.permissions) {
        expect(known.has(permission), `${role.key} -> ${permission}`).toBe(true);
      }
    }
  });

  it('keeps least privilege for non-super-admin roles', () => {
    const contentEditor = ROLE_TEMPLATES.find((r) => r.key === 'content_editor');
    const donationManager = ROLE_TEMPLATES.find((r) => r.key === 'donation_manager');
    const volunteerManager = ROLE_TEMPLATES.find((r) => r.key === 'volunteer_manager');

    expect(contentEditor?.permissions).not.toContain('user.manage');
    expect(contentEditor?.permissions).not.toContain('role.manage');

    expect(donationManager?.permissions).not.toContain('donation.refund');
    expect(donationManager?.permissions).not.toContain('donation.export');
    expect(donationManager?.permissions).not.toContain('settings.donation.update');

    expect(volunteerManager?.permissions).not.toContain('donation.read');
    expect(volunteerManager?.permissions).not.toContain('page.update');
  });

  it('grants publish rights to the content editor but not to financial or volunteer roles', () => {
    const contentEditor = ROLE_TEMPLATES.find((r) => r.key === 'content_editor');
    expect(contentEditor?.permissions).toContain('page.publish');
    expect(contentEditor?.permissions).not.toContain('impact.verify');

    for (const key of ['donation_manager', 'volunteer_manager']) {
      const role = ROLE_TEMPLATES.find((r) => r.key === key);
      expect(role?.permissions.some((p) => p.endsWith('.publish'))).toBe(false);
    }
  });
});
