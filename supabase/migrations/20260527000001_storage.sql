-- Screenshots bucket + storage RLS — run after core migration
-- Bucket: screenshots (public read, authenticated write, owner-only delete)

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Allow public read
create policy "Screenshots public read"
on storage.objects for select
using (bucket_id = 'screenshots');

-- Allow authenticated users to upload to their own folder: {user_id}/...
create policy "Screenshots authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow owners to update/delete their own objects
create policy "Screenshots owner update"
on storage.objects for update
to authenticated
using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Screenshots owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- Note: If you already created the bucket manually in Dashboard → Storage,
-- just run the 4 CREATE POLICY statements above.
