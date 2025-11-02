BEGIN;

ALTER TABLE "study_note"
  ALTER COLUMN "content" TYPE jsonb
  USING (
    CASE
      WHEN "content" IS NULL THEN NULL
      WHEN trim("content") = '' THEN jsonb_build_object('type', 'text', 'content', '')
      WHEN "content" ~ '^[\s]*[{\[]' THEN "content"::jsonb
      ELSE jsonb_build_object('type', 'text', 'content', "content")
    END
  );

ALTER TABLE "note_media"
  ADD COLUMN IF NOT EXISTS "original_name" text,
  ADD COLUMN IF NOT EXISTS "mime_type" text,
  ADD COLUMN IF NOT EXISTS "size" integer;

UPDATE "note_media"
SET
  "original_name" = COALESCE("metadata"->>'originalName', 'unknown'),
  "mime_type" = COALESCE("metadata"->>'mimeType', 'application/octet-stream'),
  "size" = COALESCE(
    CASE
      WHEN ("metadata"->>'size') ~ '^[0-9]+$' THEN ("metadata"->>'size')::integer
      ELSE NULL
    END,
    0
  )
WHERE "original_name" IS NULL OR "mime_type" IS NULL OR "size" IS NULL;

ALTER TABLE "note_media"
  ALTER COLUMN "original_name" SET NOT NULL,
  ALTER COLUMN "mime_type" SET NOT NULL,
  ALTER COLUMN "size" SET NOT NULL;

ALTER TABLE study_note
  ALTER COLUMN content DROP DEFAULT,
  ALTER COLUMN content TYPE jsonb
    USING CASE
      WHEN content IS NULL THEN NULL
      WHEN btrim(content) LIKE '{%' OR btrim(content) LIKE '[%' THEN content::jsonb
      ELSE to_jsonb(content)
    END;

ALTER TABLE study_note
  ALTER COLUMN tags DROP DEFAULT,
  ALTER COLUMN tags TYPE jsonb
    USING CASE
      WHEN tags IS NULL THEN NULL
      ELSE to_jsonb(tags)
    END;

ALTER TABLE study_note
  ALTER COLUMN content SET DEFAULT NULL,
  ALTER COLUMN tags SET DEFAULT NULL;

COMMIT;


