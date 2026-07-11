# Database migrations &amp; seeds

## ⚠️ Before running anything here

Several of these files — `001_srd_schema.sql`, `017_beginner_dungeon.sql`, and
most of `seeds/` — contain their own `USE gameserver;` (or
`CREATE DATABASE IF NOT EXISTS gameserver`) statement. That statement
silently switches whatever session runs the file onto the `gameserver`
database, **regardless of which database your client connection was already
pointed at**. Piping one of these files into a session/tool that you intended
to scope to a different (e.g. scratch/test) database will instead run
against your real `gameserver` database.

Always run these with a plain, no-target-database connection, exactly as
shown below (`mysql -u root <file`, not `mysql -u root some_other_db <file`),
and never against a connection you're already using for something else.

## Run order

The migrations (`migrations/001`–`017`) are copied verbatim from the
earlier ColdBox-based version of this project
([`dnd-game`](../../dnd-game)), which tracked schema changes as it was
built. `018` and `019` are v2-specific and not present in that history.
Seeds are separate files correlated to a migration by the tables they
populate — v1 didn't script an end-to-end bootstrap, so this order is
reconstructed from those dependencies (schema before its data, base seed
before its follow-up `_update` patch):

```sh
mysql -u root                          < migrations/001_srd_schema.sql
mysql -u root gameserver               < seeds/srd_seed.sql
mysql -u root gameserver               < seeds/cantrips_seed.sql
mysql -u root gameserver               < migrations/002_spell_mechanics.sql
mysql -u root gameserver               < seeds/spell_mechanics_update.sql
mysql -u root gameserver               < migrations/003_character_spell_choices.sql
mysql -u root gameserver               < migrations/004_rest_tracking.sql
mysql -u root gameserver               < migrations/005_adventure_modules.sql
mysql -u root gameserver               < seeds/adventure_seed.sql
mysql -u root gameserver               < migrations/006_map_entry_point.sql
mysql -u root gameserver               < migrations/007_armor_and_items.sql
mysql -u root gameserver               < seeds/armor_and_items_seed.sql
mysql -u root gameserver               < migrations/008_structured_monster_data.sql
mysql -u root gameserver               < seeds/monsters_legacy_structured_update.sql
mysql -u root gameserver               < seeds/monsters_5e_srd_missing_seed.sql
mysql -u root gameserver               < seeds/monsters_5e_srd_missing_schema_update.sql
mysql -u root gameserver               < migrations/009_species_and_conditions.sql
mysql -u root gameserver               < migrations/010_backgrounds.sql
mysql -u root gameserver               < seeds/legacy_srd_seed.sql
mysql -u root gameserver               < migrations/011_character_class_skills.sql
mysql -u root gameserver               < migrations/012_multi_spell_known.sql
mysql -u root gameserver               < migrations/013_expertise_and_rage.sql
mysql -u root gameserver               < migrations/014_rest_and_game_clock.sql
mysql -u root gameserver               < migrations/015_multiclassing.sql
mysql -u root gameserver               < migrations/016_magic_initiate_picks.sql
mysql -u root gameserver               < migrations/017_beginner_dungeon.sql   # data, despite living in migrations/
mysql -u root gameserver               < seeds/dungeon_of_doom_seed.sql
mysql -u root gameserver               < migrations/018_battle_record.sql
mysql -u root gameserver               < migrations/019_add_auth.sql
```

`018_battle_record.sql` and `019_add_auth.sql` are the two v2-specific
migrations — the former recreates three per-character battle-record columns
(`monsters_fought`, `monsters_killed`, `deaths`) that exist in the current
schema but were never captured as a tracked migration in the v1 project;
the latter adds the `users` table and per-owner scoping (see the main
[README](../README.md)).

## Verifying against a live database

If you already have a populated `gameserver` and just want to confirm these
files still match its schema, compare against a real dump rather than
re-running anything destructive:

```sh
mysqldump -u root --no-data --skip-comments --compact gameserver > /tmp/live_schema.sql
```

then diff table-by-table. `001_srd_schema.sql` unconditionally drops and
recreates its tables — never run it against a database with data you want
to keep.
