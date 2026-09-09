import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { expect, test } from 'vitest';

test('migration creates customer profiles and enforces ownership and column restrictions', async () => {
  const db = new PGlite();
  const first = '00000000-0000-0000-0000-000000000001';
  const second = '00000000-0000-0000-0000-000000000002';
  const third = '00000000-0000-0000-0000-000000000003';
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('${first}', '{"display_name":"Existing customer"}');
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/20260909000100_auth_foundation.sql', import.meta.url), 'utf8'));
    await db.exec(`insert into auth.users values ('${second}', '{"display_name":"Kris","role":"owner"}');`);
    await db.exec(`insert into auth.users values ('${third}', '{"display_name":"Future driver","role":"driver"}');`);
    const { rows } = await db.query('select * from public.profiles order by id');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toMatchObject({ id: second, display_name: 'Kris', role: 'customer', van_id: null, workplace_id: null });
    expect(rows[2]).toMatchObject({ id: third, display_name: 'Future driver', role: 'customer', van_id: null, workplace_id: null });
    expect(rows[1].created_at).toBeTruthy();
    const rls = await db.query("select relrowsecurity from pg_class where oid in ('public.profiles'::regclass, 'public.vans'::regclass, 'public.workplaces'::regclass)");
    expect(rls.rows.every((row) => row.relrowsecurity)).toBe(true);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${second}';`);
    expect((await db.query('select id from public.profiles')).rows).toEqual([{ id: second }]);
    await db.exec(`update public.profiles set display_name = 'Renamed' where id = '${second}';`);
    expect((await db.query('select display_name from public.profiles')).rows[0].display_name).toBe('Renamed');
    expect((await db.query(`update public.profiles set display_name = 'Intruder' where id = '${first}' returning id`)).rows).toEqual([]);
    for (const sql of [
      "update public.profiles set role = 'owner'",
      "update public.profiles set role = 'driver'",
      'update public.profiles set van_id = null',
      'update public.profiles set workplace_id = null',
      `insert into public.profiles (id) values ('${first}')`,
      'delete from public.profiles',
      'select * from public.vans',
      'select * from public.workplaces',
      'select public.handle_new_user()',
    ]) await expect(db.exec(sql)).rejects.toThrow();
    await db.exec('reset role; set role anon;');
    await expect(db.query('select * from public.profiles')).rejects.toThrow();
    await db.exec(`reset role; delete from auth.users where id = '${second}';`);
    expect((await db.query(`select * from public.profiles where id = '${second}'`)).rows).toHaveLength(0);
  } finally {
    await db.close();
  }
}, 30000);
