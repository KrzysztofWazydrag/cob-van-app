begin;

-- Only membership details are readable; shared codes remain private.
grant select (id, name) on public.workplaces to authenticated;
create policy workplaces_read_assigned on public.workplaces
  for select to authenticated using (
    id = (select workplace_id from public.profiles where id = (select auth.uid()))
  );

create function public.join_workplace(workplace_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  customer_id uuid := auth.uid();
  customer_role text;
  current_workplace uuid;
  target_workplace uuid;
begin
  if customer_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  -- Serialize joins for this account so concurrent requests cannot switch membership.
  select role, workplace_id into customer_role, current_workplace
    from public.profiles where id = customer_id for update;
  if not found or customer_role <> 'customer' then
    raise exception 'Only customer accounts can join a workplace.' using errcode = '42501';
  end if;
  if current_workplace is not null then
    raise exception 'You already belong to a workplace.' using errcode = '42501';
  end if;

  select id into target_workplace from public.workplaces
    where invite_code = btrim(workplace_code) and is_active
    for share;
  if target_workplace is null then
    raise exception 'We couldn''t find that workplace code.' using errcode = 'P0001';
  end if;

  update public.profiles set workplace_id = target_workplace where id = customer_id;
end;
$$;

revoke all on function public.join_workplace(text) from public, anon, authenticated;
grant execute on function public.join_workplace(text) to authenticated;

commit;
