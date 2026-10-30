-- Surya Industries: individual client submission links.
-- Run this in Supabase Dashboard > SQL Editor after backing up your project.
-- Assumes existing public.customers.id is UUID and public.customer_documents matches the admin form.

-- Free-text multiline details field requested by Surya Industries.
alter table public.customers add column if not exists category text;

create extension if not exists pgcrypto;

create table if not exists public.client_submission_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  client_label text not null,
  client_email text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  customer_id text
);

alter table public.client_submission_links enable row level security;
drop policy if exists "Admins can view client submission links" on public.client_submission_links;
create policy "Admins can view client submission links"
  on public.client_submission_links for select to authenticated using (true);

-- Store uploads privately. If the bucket already exists, ensure its Public setting is OFF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-documents', 'customer-documents', false, 10485760,
  array['application/pdf','image/jpeg','image/png','image/webp','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

-- Check upload permission through a SECURITY DEFINER function so anonymous clients
-- do not need SELECT access to the invitation table (which would expose token hashes).
create or replace function public.can_upload_for_client_token(p_token_hash text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.client_submission_links l
    where l.token_hash = p_token_hash
      and l.used_at is null and l.revoked_at is null and l.expires_at > now()
  );
$$;
revoke all on function public.can_upload_for_client_token(text) from public;
grant execute on function public.can_upload_for_client_token(text) to anon, authenticated;

-- The first object-path folder is the SHA-256 hash of the invitation token.
drop policy if exists "Client can upload files with a valid invitation" on storage.objects;
create policy "Client can upload files with a valid invitation"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'customer-documents'
    and array_length(storage.foldername(name), 1) >= 1
    and (
      (storage.foldername(name))[1] = 'public'
      or public.can_upload_for_client_token((storage.foldername(name))[1])
    )
  );

create or replace function public.create_client_submission_link(
  p_token_hash text, p_client_label text, p_client_email text, p_expires_at timestamptz
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Admin login required'; end if;
  if length(coalesce(p_token_hash, '')) <> 64 then raise exception 'Invalid invitation token'; end if;
  if length(trim(coalesce(p_client_label, ''))) < 1 then raise exception 'Client name is required'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '31 days' then raise exception 'Expiry must be within the next 30 days'; end if;
  insert into public.client_submission_links(token_hash, client_label, client_email, created_by, expires_at)
  values (p_token_hash, trim(p_client_label), nullif(trim(coalesce(p_client_email, '')), ''), auth.uid(), p_expires_at)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.validate_client_submission_link(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare l public.client_submission_links%rowtype;
begin
  select * into l from public.client_submission_links where token_hash = p_token_hash;
  if not found or l.used_at is not null or l.revoked_at is not null or l.expires_at <= now() then
    return jsonb_build_object('valid', false);
  end if;
  return jsonb_build_object('valid', true, 'client_label', l.client_label, 'expires_at', l.expires_at);
end;
$$;

create or replace function public.submit_client_customer_details(
  p_token_hash text, p_customer jsonb, p_documents jsonb default '[]'::jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare l public.client_submission_links%rowtype; new_customer_id uuid; doc jsonb;
begin
  -- Lock the link so two simultaneous submissions cannot both use it.
  select * into l from public.client_submission_links where token_hash = p_token_hash for update;
  if not found or l.used_at is not null or l.revoked_at is not null or l.expires_at <= now() then
    raise exception 'This invitation is invalid, expired, revoked, or already used';
  end if;
  if length(trim(coalesce(p_customer->>'client_name', ''))) < 1 then raise exception 'Client / Company Name is required'; end if;
  if jsonb_typeof(coalesce(p_documents, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_documents, '[]'::jsonb)) > 5 then
    raise exception 'Maximum five documents are allowed';
  end if;
  insert into public.customers(client_name, contact_person, contact_number, office_number, designation, email, category, remark, contact_date)
  values (
    trim(p_customer->>'client_name'), nullif(trim(coalesce(p_customer->>'contact_person','')), ''),
    nullif(trim(coalesce(p_customer->>'contact_number','')), ''), nullif(trim(coalesce(p_customer->>'office_number','')), ''),
    nullif(trim(coalesce(p_customer->>'designation','')), ''), nullif(trim(coalesce(p_customer->>'email','')), ''),
    nullif(trim(coalesce(p_customer->>'category','')), ''), nullif(trim(coalesce(p_customer->>'remark','')), ''), nullif(p_customer->>'contact_date','')::date
  ) returning id into new_customer_id;

  for doc in select value from jsonb_array_elements(coalesce(p_documents, '[]'::jsonb)) loop
    if (doc->>'storage_path') not like p_token_hash || '/%' then raise exception 'Invalid document path'; end if;
    insert into public.customer_documents(customer_id, file_name, file_type, file_size, storage_path)
    values (new_customer_id, doc->>'file_name', doc->>'file_type', (doc->>'file_size')::bigint, doc->>'storage_path');
  end loop;
  update public.client_submission_links set used_at = now(), customer_id = new_customer_id::text where id = l.id;
  return jsonb_build_object('success', true, 'customer_id', new_customer_id::text);
end;
$$;

create or replace function public.revoke_client_submission_link(p_link_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Admin login required'; end if;
  update public.client_submission_links set revoked_at = now()
  where id = p_link_id and used_at is null and revoked_at is null;
  if not found then raise exception 'Invitation not found or already used/revoked'; end if;
end;
$$;

revoke all on function public.create_client_submission_link(text,text,text,timestamptz) from public, anon;
grant execute on function public.create_client_submission_link(text,text,text,timestamptz) to authenticated;
revoke all on function public.validate_client_submission_link(text) from public;
grant execute on function public.validate_client_submission_link(text) to anon, authenticated;
revoke all on function public.submit_client_customer_details(text,jsonb,jsonb) from public;
grant execute on function public.submit_client_customer_details(text,jsonb,jsonb) to anon, authenticated;
revoke all on function public.revoke_client_submission_link(uuid) from public, anon;
grant execute on function public.revoke_client_submission_link(uuid) to authenticated;

-- Important: do not create any anonymous SELECT policy on customers or customer_documents.
-- Keep existing admin-only read policies. Existing admin document downloads must use signed URLs
-- or authenticated storage policies, because this bucket is private.


-- General public form: anyone with the shared public URL may submit repeatedly.
-- Unlike invitation links, this function does not require or consume a token.
create or replace function public.submit_public_customer_details(
  p_customer jsonb, p_documents jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare new_customer_id uuid; doc jsonb;
begin
  if length(trim(coalesce(p_customer->>'client_name', ''))) < 1 then
    raise exception 'Client / Company Name is required';
  end if;
  if length(coalesce(p_customer->>'client_name','')) > 200
    or length(coalesce(p_customer->>'category','')) > 5000
    or length(coalesce(p_customer->>'remark','')) > 5000 then
    raise exception 'One or more fields exceed the allowed length';
  end if;
  if jsonb_typeof(coalesce(p_documents, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_documents, '[]'::jsonb)) > 5 then
    raise exception 'Maximum five documents are allowed';
  end if;

  insert into public.customers(client_name, contact_person, contact_number, office_number, designation, email, category, remark, contact_date)
  values (
    trim(p_customer->>'client_name'), nullif(trim(coalesce(p_customer->>'contact_person','')), ''),
    nullif(trim(coalesce(p_customer->>'contact_number','')), ''), nullif(trim(coalesce(p_customer->>'office_number','')), ''),
    nullif(trim(coalesce(p_customer->>'designation','')), ''), nullif(trim(coalesce(p_customer->>'email','')), ''),
    nullif(trim(coalesce(p_customer->>'category','')), ''), nullif(trim(coalesce(p_customer->>'remark','')), ''), nullif(p_customer->>'contact_date','')::date
  ) returning id into new_customer_id;

  for doc in select value from jsonb_array_elements(coalesce(p_documents, '[]'::jsonb)) loop
    if coalesce(doc->>'storage_path','') not like 'public/%' then
      raise exception 'Invalid public document path';
    end if;
    insert into public.customer_documents(customer_id, file_name, file_type, file_size, storage_path)
    values (new_customer_id, doc->>'file_name', doc->>'file_type', (doc->>'file_size')::bigint, doc->>'storage_path');
  end loop;

  return jsonb_build_object('success', true, 'customer_id', new_customer_id::text);
end;
$$;

revoke all on function public.submit_public_customer_details(jsonb, jsonb) from public;
grant execute on function public.submit_public_customer_details(jsonb, jsonb) to anon, authenticated;

-- Allow authenticated admin users to read private customer files and create signed URLs.
-- The frontend admin portal uses Supabase Auth; do not make the bucket public.
drop policy if exists "Admins can view customer documents" on storage.objects;
create policy "Admins can view customer documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'customer-documents');
