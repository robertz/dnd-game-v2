# Database

Two files, generated from the live `gameserver` database rather than
hand-maintained as incremental migrations:

- **`schema.sql`** — structure only (all 28 tables, indexes, foreign keys).
- **`seed.sql`** — reference/content data only: classes, subclasses, class
  features, feats, magic items, monsters, spells, spell effects, weapons,
  armors, items, species, species traits, backgrounds, conditions, and the
  built-in adventure modules/maps. Deliberately excludes user/runtime tables
  (`users`, `characters`, `character_inventory`, `character_features`,
  `character_feats`, `character_armor`, `character_items`,
  `character_multiclass_levels`) — those start empty; accounts and
  characters are created through the app itself.

## Spells: `upcast_dice_count`/`upcast_dice_sides` and `spell_effects`

Each spell mechanizes at most one primary damage/heal effect directly on
`spells` (`damage_dice`/`damage_type` or `heal_dice`). `upcast_dice_count`/
`upcast_dice_sides` (nullable) hold the bonus dice added per slot level
above the spell's own, parsed from `higher_level_text` — NULL means no
upcast bonus is modeled, either because the spell has no such text or
because the text doesn't fit a simple dice-bonus model (e.g. Chain
Lightning/Scorching Ray grant an extra projectile per level, not bigger
dice; Geas extends duration).

A spell with more than one simultaneous damage effect (found via a manual
audit, not automatically) gets one or more rows in `spell_effects` instead
of trying to cram a second damage type onto `spells` itself:

- `trigger_type = 'same_roll'` — shares the primary effect's own attack/
  save roll and outcome; just a second damage type added to the total
  (e.g. Ice Storm: one Dex save, Bludgeoning + Cold together, each halved
  independently on a success so per-type resistance/immunity still
  applies correctly).
- `trigger_type = 'separate_roll'` — its own independent roll against its
  own target(s), fired unconditionally after the primary effect resolves,
  regardless of whether the primary effect hit/succeeded. `aoe_radius_squares`
  optionally extends the target list to every other living combatant on the
  same side within that many squares of the primary target (e.g. Ice Knife:
  an attack roll for Piercing damage, then — hit or miss — a separate Dex
  save for Cold damage against the target *and* anyone within 5 ft./1 square
  of it).

Not every multi-effect spell fits even this: delayed/DoT damage on a later
turn (Acid Arrow, Vitriolic Sphere), random sub-effect tables (Prismatic
Spray), and multi-round escalating spells (Storm of Vengeance, Tsunami)
are architecturally different problems (timing/scheduling, not "more than
one effect") and aren't modeled at all — see development.md.

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
  gameserver classes subclasses class_features feats magic_items monsters spells spell_effects \
  weapons armors items species species_traits backgrounds conditions \
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
