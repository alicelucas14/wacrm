-- 014_profile_is_online.sql
-- Add is_online column to profiles table, default is true so that existing profiles default to online.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT true;
