-- Add device_token column and unique constraint on name
ALTER TABLE lottery_entries ADD COLUMN device_token TEXT;
ALTER TABLE lottery_entries ADD CONSTRAINT lottery_entries_name_unique UNIQUE (name);
-- Partial unique index: only enforce uniqueness when device_token is not null
CREATE UNIQUE INDEX lottery_entries_device_token_idx ON lottery_entries (device_token) WHERE device_token IS NOT NULL;
