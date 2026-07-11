# Database

Two files, generated from the live `gameserver` database rather than
hand-maintained as incremental migrations:

- **`schema.sql`** — structure only (all 26 tables, indexes, foreign keys).
- **`seed.sql`** — reference/content data only: classes, subclasses, class
  features, feats, magic items, monsters, spells, weapons, armors, items,
  species, species traits, backgrounds, conditions, and the built-in
  adventure modules/maps. Deliberately excludes user/runtime tables
  (`users`, `characters`, `character_inventory`, `character_features`,
  `character_feats`, `character_armor`, `character_items`,
  `character_multiclass_levels`) — those start empty; accounts and
  characters are created through the app itself.

## Setup

```sh
mysql -u root gameserver < db/schema.sql
mysql -u root gameserver < db/seed.sql
```

Always specify the target database explicitly on the command line as shown
(`mysql -u root gameserver < file`), not via a `USE` statement inside the
file or an already-connected session pointed elsewhere — neither file
contains its own `USE`/`CREATE DATABASE` statement, specifically so running
it can't silently land on the wrong database.

The built-in modules seed with `owner_user_id = NULL` (no user exists yet
on a fresh install). They're playable immediately, but not editable via the
map editor until claimed:

```sql
UPDATE adventure_modules SET owner_user_id = <your-user-id> WHERE owner_user_id IS NULL;
```

## Regenerating these files

If the live schema or reference content changes, regenerate both from the
current database rather than hand-editing:

```sh
mysqldump -u root --no-data --set-gtid-purged=OFF --skip-comments gameserver \
  > db/schema.sql

mysqldump -u root --no-create-info --complete-insert --set-gtid-purged=OFF --skip-comments \
  gameserver classes subclasses class_features feats magic_items monsters spells weapons \
  armors items species species_traits backgrounds conditions \
  adventure_modules adventure_maps adventure_map_chunks adventure_map_pois \
  > db/seed.sql
```

Then re-add the header comments (see the top of each file) and, in
`seed.sql`, null out `adventure_modules.owner_user_id` again before
committing — otherwise a fresh install's seed data would reference a
specific user id that doesn't exist yet.

## History

Earlier versions of this file documented a 17-file migration history plus
10 separate seed files, copied from this project's previous ColdBox-based
incarnation ([`dnd-game`](../../dnd-game)). That history is why the schema
looks the way it does, but keeping it in this repo as executable SQL turned
out to be actively dangerous: one of those files (`001_srd_schema.sql`)
carried a hardcoded `USE gameserver;` that, when run against a session
intended for a different (scratch/test) database, silently dropped and
recreated tables in the real database instead — which is exactly what
happened once. The two files here are a straight dump of the schema that
history produced, with no destructive statements and no possibility of
targeting the wrong database.
