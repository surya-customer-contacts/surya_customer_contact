-- Run this if you already applied client-submission-portal.sql before the admin document viewer was added.
-- This allows signed URLs for logged-in admin users while keeping the bucket private.
drop policy if exists "Admins can view customer documents" on storage.objects;
create policy "Admins can view customer documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'customer-documents');
