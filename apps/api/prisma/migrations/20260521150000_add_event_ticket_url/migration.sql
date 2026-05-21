-- Add ticketUrl, externalId, externalSource fields to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "ticket_url" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_id" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_source" VARCHAR(50);
