-- v2-only addition not present in the v1 (dnd-game) migration history it was
-- copied from: per-character lifetime battle-record counters, shown on the
-- character select card and character sheet (CombatEncounter's win/death
-- tracking). Added directly against the shared gameserver database during
-- v2 development rather than as a tracked v1 migration — recreated here so
-- the migration set reproduces the actual current schema.

ALTER TABLE characters
    ADD COLUMN monsters_fought INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN monsters_killed INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN deaths          INT UNSIGNED NOT NULL DEFAULT 0;
