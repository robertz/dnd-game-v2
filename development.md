# Development Notes

Follow-ups and known gaps that don't belong in README.md but are worth
tracking for future work.

## Upcasting

- **Player can't deliberately upcast.** `castLeveledSpellFor()` only applies
  the upcast bonus when `_spendSpellSlot()`'s lowest-available-slot pick
  happens to land above the spell's own level (e.g. every lower slot is
  already spent) — there's no UI for a player to *choose* to spend a higher
  slot for the bonus while a lower one is still available.

- **Some spells still can't be upcast**, because their `higher_level_text`
  doesn't fit even the multi-effect dice model (see "Multi-effect spells"
  below):
  - **Chain Lightning**, **Scorching Ray** — grant an extra
    projectile/target per level above minimum, not bigger dice.
  - **Geas** — extends duration, not damage/healing.

  (**Ice Knife** used to be in this list — its Cold explosion is now a
  `spell_effects` row with its own `upcast_dice_count`/`upcast_dice_sides`,
  independent of the primary Piercing attack roll, which still doesn't
  upcast. See "Multi-effect spells" below.)

## Multi-effect spells

`spell_effects` (see db/README.md) covers two of five patterns found across
the mechanized spell set: same-roll multi-damage (Ice Storm) and a primary
effect chained to a separate AoE save (Ice Knife). Not modeled, and
architecturally distinct enough (timing/scheduling, not "more than one
effect") that they don't fit this table:

- **Delayed/DoT damage on a future turn** — Acid Arrow ("2d4 Acid damage at
  the end of its next turn"), Vitriolic Sphere (same pattern). Needs a
  pending-effect/status-tracking system, not just extra columns.
- **Random sub-effect tables** — Prismatic Spray (roll 1d8, pick one of
  eight wildly different effects, from damage to petrification to
  banishment). Needs a "roll to pick an effect" abstraction.
- **Multi-round escalating spells** — Storm of Vengeance, Tsunami (a
  different effect fires each round for several turns). Needs a mini
  scheduling engine.

Also unmodeled even within the two supported patterns:

- **`spell_effects.effect_type = 'attack'` for a `separate_roll` effect.**
  `_castChainedSpellEffect()` only implements a chained *save* roll — no
  spell in the current dataset needs a chained attack roll, so that branch
  was never written.
- **Cross-faction AoE.** A `separate_roll` effect's `aoe_radius_squares`
  only ever expands the target list within the primary defender's own side
  (see `_castChainedSpellEffect()`'s `candidates` selection) — there's no
  mechanism anywhere in this codebase for one spell to hit both allies and
  enemies in the same blast, so a real Ice Knife (which by RAW can catch
  *anyone* within 5 ft., friend or foe) is simplified to same-side-only.
