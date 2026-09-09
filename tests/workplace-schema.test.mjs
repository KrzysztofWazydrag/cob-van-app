import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { expect, test } from 'vitest';

test('shared workplace RPC persists membership without granting privileges or exposing codes', async () => {
  const db = new PGlite();
  const user = (n) => `00000000-0000-0000-0000-00000000000${n}`;
  const asUser = async (n) => db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '${user(n)}';`);
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
    `);
    for (const file of ['20260909000100_auth_foundation.sql', '20260909000200_workplace_onboarding.sql']) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
    }
    await db.exec(`
      insert into auth.users values ('${user(1)}', '{}'), ('${user(2)}', '{}'), ('${user(3)}', '{}');
      insert into public.vans (id, owner_id, name) values ('${user(4)}', '${user(3)}', 'Dev van');
    `);
    const seed = await readFile(new URL('../supabase/seeds/development_workplace.sql', import.meta.url), 'utf8');
    await db.exec(seed); await db.exec(seed);
    expect((await db.query('select * from workplaces')).rows).toHaveLength(1);
    await db.exec(`insert into workplaces (van_id, name, invite_code, is_active) values
      ('${user(4)}', 'Inactive', 'INACTIVE', false), ('${user(4)}', 'Other', 'OTHER', true);`);
    await asUser(1);
    expect((await db.query('select id, name from workplaces')).rows).toEqual([]);
    for (const code of ['BAD', 'INACTIVE', '', 'acero123']) {
      await expect(db.query('select join_workplace($1)', [code])).rejects.toThrow("We couldn't find that workplace code.");
    }
    await expect(db.query('select join_workplace(null)')).rejects.toThrow();
    await db.query('select join_workplace($1)', ['  ACERO123  ']);
    const membership = (await db.query('select workplace_id, role, van_id from profiles')).rows[0];
    expect(membership).toMatchObject({ role: 'customer', van_id: null });
    expect(membership.workplace_id).toBeTruthy();
    expect((await db.query('select id, name from workplaces')).rows).toEqual([{ id: membership.workplace_id, name: 'ACERO' }]);
    for (const sql of [
      'select invite_code from workplaces', 'select * from workplaces', 'select van_id from workplaces',
      "update profiles set role = 'owner'", "update profiles set role = 'driver'",
      `update profiles set van_id = '${user(4)}'`, 'update profiles set workplace_id = null',
      `update profiles set workplace_id = '${membership.workplace_id}' where id = '${user(2)}'`,
      "select join_workplace('OTHER')", "select join_workplace('ACERO123')",
    ]) await expect(db.exec(sql)).rejects.toThrow();
    await asUser(2);
    expect((await db.query('select workplace_id from profiles')).rows[0].workplace_id).toBeNull();
    await db.exec("select join_workplace('ACERO123')");
    expect((await db.query('select workplace_id from profiles')).rows[0].workplace_id).toBe(membership.workplace_id);
    await asUser(1);
    expect((await db.query('select workplace_id from profiles')).rows[0].workplace_id).toBe(membership.workplace_id);
    await db.exec(`reset role; update profiles set role = 'driver' where id = '${user(3)}';`);
    await asUser(3);
    await expect(db.exec("select join_workplace('ACERO123')")).rejects.toThrow('Only customer');
    await db.exec("set request.jwt.claim.sub = '';");
    await expect(db.exec("select join_workplace('ACERO123')")).rejects.toThrow('Authentication required');
    await db.exec('reset role; set role anon;');
    await expect(db.exec("select join_workplace('ACERO123')")).rejects.toThrow();
    await expect(db.exec('select id, name from workplaces')).rejects.toThrow();
  } finally { await db.close(); }
}, 30000);
