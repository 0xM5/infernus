-- Make the journal-images bucket public so uploaded images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE name = 'journal-images';

-- Add RLS policy to allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own journal images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policy to allow users to view their own images
CREATE POLICY "Users can view their own journal images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'journal-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policy to allow users to delete their own images
CREATE POLICY "Users can delete their own journal images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);