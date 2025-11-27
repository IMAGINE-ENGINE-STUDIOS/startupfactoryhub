-- Update feed-media bucket to support larger video files (up to 500MB)
UPDATE storage.buckets 
SET file_size_limit = 524288000  -- 500MB in bytes
WHERE name = 'feed-media';