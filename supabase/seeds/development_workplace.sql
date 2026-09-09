-- Development only. Run after both migrations in Supabase SQL Editor.
-- Uses the oldest existing van. If there is no van, set development_owner_id
-- to an existing auth user's profile UUID; this script does not change roles.
do $$
declare
  development_owner_id uuid := null; -- Replace null with 'YOUR-PROFILE-UUID' if needed.
  development_van_id uuid;
begin
  if exists (select 1 from public.workplaces where invite_code = 'ACERO123') then
    raise notice 'ACERO123 already exists; no changes made.';
    return;
  end if;
  select id into development_van_id from public.vans order by created_at, id limit 1;
  if development_van_id is null then
    if development_owner_id is null then
      raise exception 'No development van exists. Set development_owner_id in this script to an existing profile UUID and run again.';
    end if;
    insert into public.vans (owner_id, name) values (development_owner_id, 'Development Cob Van')
      returning id into development_van_id;
  end if;
  insert into public.workplaces (van_id, name, invite_code)
    values (development_van_id, 'ACERO', 'ACERO123');
end;
$$;
