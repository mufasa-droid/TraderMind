-- Screenshots bucket + storage RLS — idempotent migration
-- Bucket: screenshots (public read, authenticated write, owner-only delete)

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- 1. Allow public read
drop policy if exists "Screenshots public read" on storage.objects;
create policy "Screenshots public read"
on storage.objects for select
using (bucket_id = 'screenshots');

-- 2. Allow authenticated users to upload to their own folder: {user_id}/...
drop policy if exists "Screenshots authenticated upload" on storage.objects;
create policy "Screenshots authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow owners to update their own objects
drop policy if exists "Screenshots owner update" on storage.objects;
create policy "Screenshots owner update"
on storage.objects for update
to authenticated
using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Allow owners to delete their own objects
drop policy if exists "Screenshots owner delete" on storage.objects;
create policy "Screenshots owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
