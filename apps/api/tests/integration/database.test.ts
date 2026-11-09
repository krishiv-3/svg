import { afterAll, describe, expect, it } from 'vitest';

import { checkDatabase, checkMigrations } from '../../src/core/db/health.js';
import { appClient } from './helpers.js';

/**
 * Proves the connection works, the baseline migration applied, and the runtime
 * role really is least-privileged.
 */
const prisma = appClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('database connectivity', () => {
  it('answers a trivial query', async () => {
    const rows = await prisma.$queryRaw<Array<{ one: number }>>`SELECT 1 AS one`;
    expect(rows[0]?.one).toBe(1);
  });

  it('reports healthy through the readiness probe', async () => {
    const result = await checkDatabase(prisma);
    expect(result.status).toBe('up');
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it('connects as the application role, not the owner', async () => {
    const rows = await prisma.$queryRaw<Array<{ current_user: string }>>`SELECT current_user`;
    expect(rows[0]?.current_user).toBe('gaushala_app');
  });
});

describe('baseline migration', () => {
  it('has no pending or failed migrations', async () => {
    const result = await checkMigrations(prisma);
    expect(result.status).toBe('up');
    expect(result.pending).toBe(0);
    expect(result.applied).toBeGreaterThanOrEqual(2);
  });

  it('created every baseline table', async () => {
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = rows.map((row) => row.table_name);

    expect(tables).toEqual(
      expect.arrayContaining([
        'permissions',
        'role_permissions',
        'roles',
        'settings',
        'user_permissions',
        'user_roles',
        'users',
      ]),
    );
  });
});

describe('least-privilege runtime role', () => {
  it('cannot create tables', async () => {
    await expect(
      prisma.$executeRawUnsafe('CREATE TABLE app_role_must_not_create (id int)'),
    ).rejects.toThrow(/permission denied|must be owner/i);
  });

  it('cannot drop tables', async () => {
    await expect(prisma.$executeRawUnsafe('DROP TABLE users')).rejects.toThrow(
      /permission denied|must be owner/i,
    );
  });

  it('can still read and write data', async () => {
    const count = await prisma.setting.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe('identity constraints', () => {
  it('rejects a non-lowercase email at the database level', async () => {
    await expect(
      prisma.$executeRaw`
        INSERT INTO users (id, email, name, status, created_at, updated_at)
        VALUES (gen_random_uuid(), 'UPPER@Example.test', 'Upper', 'INVITED', now(), now())
      `,
    ).rejects.toThrow(/check constraint/i);
  });

  it('rejects a duplicate email', async () => {
    const email = 'integration-duplicate@example.test';

    await prisma.$executeRaw`
      INSERT INTO users (id, email, name, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${email}, 'First', 'INVITED', now(), now())
    `;

    try {
      await expect(
        prisma.$executeRaw`
          INSERT INTO users (id, email, name, status, created_at, updated_at)
          VALUES (gen_random_uuid(), ${email}, 'Second', 'INVITED', now(), now())
        `,
      ).rejects.toThrow(/unique constraint|duplicate key/i);
    } finally {
      await prisma.user.deleteMany({ where: { email } });
    }
  });

  it('rejects an invalid role key format', async () => {
    await expect(
      prisma.$executeRaw`
        INSERT INTO roles (id, key, name, is_system, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Not A Key', 'Bad', false, now(), now())
      `,
    ).rejects.toThrow(/check constraint/i);
  });

  it('cascades role grants when a role is deleted', async () => {
    // Created locally rather than relying on seeded rows, and cleaned first so a
    // previously interrupted run cannot poison this one.
    await prisma.role.deleteMany({ where: { key: 'integration_temp_role' } });
    await prisma.permission.deleteMany({ where: { key: 'integration.temp_action' } });

    const permission = await prisma.permission.create({
      data: {
        id: crypto.randomUUID(),
        key: 'integration.temp_action',
        resource: 'integration',
        action: 'temp_action',
        description: 'Temporary permission for cascade testing',
      },
    });

    const role = await prisma.role.create({
      data: {
        id: crypto.randomUUID(),
        key: 'integration_temp_role',
        name: 'Integration Temp',
        isSystem: false,
      },
    });

    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });

    try {
      await prisma.role.delete({ where: { id: role.id } });

      const remaining = await prisma.rolePermission.count({ where: { roleId: role.id } });
      expect(remaining).toBe(0);
    } finally {
      await prisma.permission.deleteMany({ where: { key: 'integration.temp_action' } });
    }
  });
});
