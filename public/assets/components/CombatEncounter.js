const VIEWPORT_RADIUS = 12;

const CombatEncounter = {
	template: `
		<div class="encounter">
			<div class="encounter-main">

				<loading-veil v-if="loading" label="Entering the dungeon..." />

				<!-- Game over banner -->
				<template v-if="cs.gameOver">
					<p :class="['encounter-banner', 'encounter-banner-' + cs.outcome]">
						{{ cs.outcome === 'victory' ? 'Victory! Every enemy is defeated.' : 'Defeat! ' + cs.player.name + ' has fallen.' }}
					</p>

					<!-- ASI panel -->
					<div v-if="cs.outcome === 'victory' && cs.player.pendingAbilityScoreImprovements > 0" class="parchment-panel asi-panel">
						<h2 class="fantasy-heading">Ability Score Improvement</h2>
						<p class="encounter-intro">
							{{ cs.player.name }} gains an Ability Score Improvement
							<template v-if="cs.player.pendingAbilityScoreImprovements > 1"> ({{ cs.player.pendingAbilityScoreImprovements }} to choose)</template>. Choose one:
						</p>
						<div class="turn-actions">
							<button type="button" :class="['btn', asiMode === 'single' ? 'btn-auto-battle' : '']" @click="asiMode = 'single'">+2 to one ability</button>
							<button type="button" :class="['btn', asiMode === 'double' ? 'btn-auto-battle' : '']" @click="asiMode = 'double'">+1 to two abilities</button>
							<button type="button" :class="['btn', asiMode === 'feat' ? 'btn-auto-battle' : '']" @click="asiMode = 'feat'">Take a feat instead</button>
						</div>
						<template v-if="asiMode !== 'feat'">
							<div class="creation-scores">
								<label>Ability <template v-if="asiMode === 'double'">1</template>:
									<select v-model="asiAbility1" class="creation-input">
										<option v-for="a in abilityAbbrs" :key="a" :value="a">{{ a.toUpperCase() }} ({{ cs.player.abilityScores[a] }})</option>
									</select>
								</label>
								<label v-if="asiMode === 'double'">Ability 2:
									<select v-model="asiAbility2" class="creation-input">
										<option v-for="a in abilityAbbrs" :key="a" :value="a">{{ a.toUpperCase() }} ({{ cs.player.abilityScores[a] }})</option>
									</select>
								</label>
							</div>
							<button type="button" class="btn btn-attack" @click="confirmAsi()">Confirm</button>
						</template>
						<template v-else>
							<div class="creation-grid">
								<div v-for="feat in availableLevelUpFeats" :key="feat"
									:class="['creation-card','creation-card-compact', asiSelectedFeat === feat ? 'creation-card-selected' : '']"
									@click="asiSelectedFeat = feat; asiSelectedSkills = []"
								>{{ feat }}</div>
							</div>
							<template v-if="asiSelectedFeat === 'Skilled'">
								<p class="stat-subtitle">Choose 3 skills ({{ asiSelectedSkills.length }} of 3 chosen)</p>
								<div class="creation-grid">
									<div v-for="skill in ALL_SKILLS" :key="skill"
										:class="['creation-card','creation-card-compact', asiSelectedSkills.includes(skill) ? 'creation-card-selected' : '']"
										@click="toggleAsiSkill(skill)"
									>{{ skill }}</div>
								</div>
							</template>
							<button type="button" class="btn btn-attack"
								:disabled="!asiSelectedFeat || (asiSelectedFeat === 'Skilled' && asiSelectedSkills.length !== 3)"
								@click="confirmFeat()"
							>Confirm</button>
						</template>
					</div>

					<div v-if="cs.outcome === 'victory'" class="turn-actions">
						<button type="button" class="btn btn-attack" @click="ws('continue_exploring')">Continue Exploring</button>
					</div>
				</template>

				<!-- Combat status -->
				<template v-else>
					<template v-if="!cs.initiativeRolled">
						<p class="encounter-intro">
							{{ cs.player.inCombat ? 'In combat!' : 'Exploring' }} — move toward the enemies to trigger initiative.
							({{ cs.movementRemaining }} square(s) of movement remaining)
						</p>
					</template>
					<template v-else>
						<p class="encounter-intro">
							Round {{ cs.round }} — {{ cs.currentTurn === 'player' ? 'Your turn.' : 'Enemy turn…' }}
							<template v-if="cs.currentTurn === 'player'"> ({{ cs.movementRemaining }} sq left<template v-if="cs.actionUsed">, action used</template>)</template>
						</p>
					</template>
				</template>

				<!-- Map grid -->
				<div v-if="mapLoaded" class="battle-grid-wrap">
					<div class="battle-grid" :style="{ gridTemplateColumns: 'repeat(' + viewportCols + ', 1fr)' }">
						<template v-for="row in viewportRows" :key="'r'+row">
							<template v-for="col in viewportCols" :key="col+','+row">
								<div
									:class="tileClass(vpMinCol + col - 1, vpMinRow + row - 1)"
									:title="tileTitle(vpMinCol + col - 1, vpMinRow + row - 1)"
									@click="tileClick(vpMinCol + col - 1, vpMinRow + row - 1)"
								>{{ tileEmoji(vpMinCol + col - 1, vpMinRow + row - 1) }}</div>
							</template>
						</template>
					</div>
				</div>

				<!-- Spell slots -->
				<p v-if="!cs.gameOver && cs.initiativeRolled && cs.player.isSpellcaster && cs.player.spellSlots && Object.keys(cs.player.spellSlots).length" class="stat-note spell-slot-bar">
					<strong>Spell Slots</strong>
					<span v-for="(count, level) in cs.player.spellSlots" :key="level" :class="['condition-chip', count <= 0 ? 'spell-slot-empty' : '']">L{{ level }}: {{ count }}</span>
				</p>

				<!-- Action bar -->
				<div v-if="!cs.gameOver && cs.initiativeRolled" class="turn-actions action-bar">
					<template v-if="cs.autoBattling">
						<div class="action-group">
							<div class="auto-battle-indicator">⚔ Auto-battling…</div>
							<button type="button" class="btn btn-end-turn" @click="stopAutoBattle()">Stop</button>
						</div>
					</template>
					<template v-else>
						<template v-if="cs.currentTurn === 'player'">
							<template v-if="cs.player.isDying">
								<div class="action-group">
									<button type="button" class="btn btn-attack" @click="ws('death_save')">Make Death Saving Throw</button>
								</div>
							</template>
							<template v-else-if="cs.player.hitPoints <= 0">
								<p class="encounter-intro">{{ cs.player.name }} is stabilized but unconscious.</p>
								<div class="action-bar-end">
									<button type="button" class="btn btn-end-turn" @click="ws('end_turn')">{{ partyMembers.length > 1 ? 'End Party Turn' : 'End Turn' }}</button>
								</div>
							</template>
							<template v-else>
								<div v-if="hasActionOptions" class="action-group">
									<span class="action-group-label">Action</span>
									<template v-if="remainingAttacks > 0 && (!cs.actionUsed || cs.attacksUsedThisTurn > 0)">
										<button type="button" class="btn btn-attack" @click="ws('attack')">Attack{{ remainingAttacks > 1 ? ' (' + remainingAttacks + ' left)' : '' }}</button>
										<template v-if="playerHasFeature(\`Paladin's Smite\`) && cs.player.spellSlots">
											<button v-for="(count, level) in cs.player.spellSlots" :key="'smite'+level" v-show="count > 0"
												type="button" class="btn btn-attack" @click="ws('smite',{slotLevel:level})">Smite (Lv {{ level }})</button>
										</template>
									</template>
									<template v-if="!cs.actionUsed">
										<button v-if="cs.player.hasGrapplerFeat" type="button" class="btn btn-attack" @click="ws('grapple')">Grapple</button>
										<button type="button" class="btn btn-attack" @click="ws('shove')">Shove</button>
										<button v-if="cs.player.hasBreathWeapon && !cs.player.usedBreathWeapon" type="button" class="btn btn-attack" @click="ws('breath_weapon')">Breath Weapon</button>
										<template v-if="cs.player.knownCantrips">
											<button v-for="cantrip in cs.player.knownCantrips" :key="cantrip.name"
												type="button" class="btn btn-attack"
												:title="describeSpell(cantrip)"
												@click="ws('cast_cantrip',{spellName:cantrip.name})">Cast {{ cantrip.name }}</button>
										</template>
										<template v-if="cs.player.knownLeveledSpells">
											<button v-for="spell in cs.player.knownLeveledSpells" :key="spell.name"
												type="button" class="btn btn-attack"
												:disabled="!hasSpellResource(spell.level)"
												:title="describeSpell(spell)"
												@click="ws('cast_spell',{spellName:spell.name})">Cast {{ spell.name }}</button>
										</template>
									</template>
								</div>

								<div v-if="hasBonusOptions" class="action-group">
									<span class="action-group-label">Bonus</span>
									<button v-if="canOffHandAttack" type="button" class="btn btn-attack" @click="ws('off_hand_attack')">Off-Hand Attack</button>
									<template v-if="!cs.bonusActionUsed">
										<button v-if="playerHasFeature('Second Wind') && !cs.player.usedSecondWind" type="button" class="btn btn-attack" @click="ws('second_wind')">Second Wind</button>
										<button v-if="playerHasFeature('Rage') && !cs.player.isRaging && cs.player.ragesRemaining > 0" type="button" class="btn btn-attack" @click="ws('start_rage')">Rage ({{ cs.player.ragesRemaining }} left)</button>
									</template>
									<button v-if="cs.player.isRaging" type="button" class="btn btn-attack" @click="ws('end_rage')">End Rage</button>
								</div>

								<div class="action-bar-end">
									<button type="button" class="btn btn-end-turn" @click="ws('end_turn')">{{ partyMembers.length > 1 ? 'End Party Turn' : 'End Turn' }}</button>
								</div>
							</template>
						</template>
					</template>
				</div>

				<!-- Rest bar — shown while exploring, and mid-encounter whenever no
				     mob is aware of the player (canRest tracks player.inCombat,
				     which the server clears once nothing has sight of you) -->
				<div v-if="!cs.gameOver && canRest" class="turn-actions rest-bar">
					<span class="stat-subtitle">{{ gameClockLabel }}</span>
					<span class="stat-subtitle">HD:
						<button type="button" class="btn btn-sm" :disabled="restDiceCount <= 0" @click="restDiceCount--">-</button>
						{{ restDiceCount }}
						<button type="button" class="btn btn-sm" :disabled="restDiceCount >= maxRestDice" @click="restDiceCount++">+</button>
					</span>
					<button type="button" class="btn btn-attack" @click="ws('short_rest',{diceCount:restDiceCount})">Short Rest</button>
					<button type="button" class="btn" :disabled="hoursUntilNextLongRest > 0" @click="ws('long_rest')" :title="hoursUntilNextLongRest > 0 ? 'Available in ~' + hoursUntilNextLongRest + ' more hour(s)' : ''">
						Long Rest{{ hoursUntilNextLongRest > 0 ? ' (~' + hoursUntilNextLongRest + 'h)' : '' }}
					</button>
				</div>

				<!-- Combat log -->
				<div class="combat-log">
					<h2 class="fantasy-heading">Combat Log</h2>
					<ul class="log-list">
						<li v-for="(entry, i) in cs.log" :key="i">{{ entry }}</li>
					</ul>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="encounter-sidebar">
				<div class="combatants">
					<template v-for="(member, memberIdx) in partyMembers" :key="member.characterId || memberIdx">
						<div
							:class="['stat-card','stat-card-player', member.hitPoints <= 0 ? 'stat-card-down' : '', (memberIdx+1) === cs.activePlayerIndex ? 'stat-card-active' : '']"
							:title="partyMembers.length > 1 ? 'Make ' + member.name + ' the active character' : ''"
							@click="selectActiveCharacter(memberIdx+1)"
						>
							<h2 class="fantasy-heading">{{ member.name }}{{ (memberIdx+1) === cs.activePlayerIndex ? ' ⚔' : '' }}</h2>
							<p class="stat-subtitle">Level {{ member.level }} {{ member.class }}{{ member.hitPoints <= 0 ? ' — Unconscious' : (foeBloodied(member) ? ' — Bloodied' : '') }}</p>
							<div class="hp-bar"><div :class="['hp-bar-fill', foeBloodied(member) ? 'hp-bar-fill-bloodied' : '']" :style="{ width: Math.max(0, member.hitPoints) / member.maxHitPoints * 100 + '%' }"></div></div>
							<div class="stat-inline">
								<span><strong>AC</strong> {{ member.armorClass }}</span>
								<span><strong>HP</strong> {{ Math.max(0, member.hitPoints) }}/{{ member.maxHitPoints }}</span>
								<span><strong>Spd</strong> {{ member.speed }} ft.</span>
							</div>
							<p v-if="member.isDying" class="stat-note"><strong>Death Saves</strong> ✓{{ Math.min(member.deathSaveSuccesses||0,3) }} ✗{{ Math.min(member.deathSaveFailures||0,3) }}</p>
							<p v-if="member.conditions && Object.keys(member.conditions).length" class="stat-note">
								<strong>Conditions</strong>
								<span v-for="(v, cond) in member.conditions" :key="cond" class="condition-chip">{{ cond }}</span>
							</p>
							<ul v-if="member.inventory && member.inventory.length" class="attack-list">
								<li v-for="w in member.inventory" :key="w.name">{{ w.name }} <span class="attack-stat">+{{ w.attackBonus }} · {{ w.damageDice }}+{{ w.damageBonus }}</span></li>
							</ul>
							<ul v-if="(memberIdx+1) === cs.activePlayerIndex && cs.items && cs.items.length" class="attack-list">
								<li v-for="item in cs.items" :key="item.id">
									{{ item.itemName }} <span class="attack-stat">x{{ item.quantity }}</span>
									<button v-if="itemIsUsable(item.itemName)" type="button" class="btn btn-attack"
										:disabled="cs.gameOver || cs.autoBattling || member.hitPoints <= 0 || (cs.initiativeRolled && (cs.currentTurn !== 'player' || cs.actionUsed))"
										@click.stop="ws('use_item',{inventoryId:item.id})"
									>Use</button>
								</li>
							</ul>
						</div>
					</template>

					<template v-for="foe in visibleFoes" :key="foe.mobIndex">
						<div
							:class="['stat-card','stat-card-opponent', foe.hitPoints <= 0 ? 'stat-card-down stat-card-defeated' : '', foe.mobIndex === cs.selectedOpponentIndex && foe.hitPoints > 0 ? 'stat-card-targeted' : '']"
							@click="ws('select_target',{mobIndex:foe.mobIndex})"
						>
							<h2 class="fantasy-heading">{{ foe.name }}{{ foe.mobIndex === cs.selectedOpponentIndex && foe.hitPoints > 0 ? ' 🎯' : '' }}</h2>
							<p class="stat-subtitle">{{ foe.creatureType }}{{ foe.hitPoints <= 0 ? ' — Destroyed' : (foeBloodied(foe) ? ' — Bloodied' : '') }}</p>
							<p v-if="foe.hitPoints > 0 && foe.aggroTarget && partyMembers.length > 1" class="stat-note stat-note-vuln">Focused on {{ foe.aggroTarget }}</p>
							<div class="hp-bar"><div :class="['hp-bar-fill', foeBloodied(foe) ? 'hp-bar-fill-bloodied' : '']" :style="{ width: Math.max(0, foe.hitPoints) / foe.maxHitPoints * 100 + '%' }"></div></div>
							<div class="stat-inline">
								<span><strong>AC</strong> {{ foe.armorClass }}</span>
								<span><strong>HP</strong> {{ Math.max(0, foe.hitPoints) }}/{{ foe.maxHitPoints }}</span>
								<span><strong>Spd</strong> {{ foe.speed }} ft.</span>
							</div>
							<p v-if="foe.conditions && Object.keys(foe.conditions).length" class="stat-note">
								<strong>Conditions</strong>
								<span v-for="(v, cond) in foe.conditions" :key="cond" class="condition-chip">{{ cond }}</span>
							</p>
							<ul v-if="foe.inventory && foe.inventory.length" class="attack-list">
								<li v-for="w in foe.inventory" :key="w.name">{{ w.name }} <span class="attack-stat">+{{ w.attackBonus }} · {{ w.damageDice }}+{{ w.damageBonus }}</span></li>
							</ul>
							<p v-if="foe.vulnerabilities && foe.vulnerabilities.length" class="stat-note stat-note-vuln"><strong>Vuln</strong> {{ foe.vulnerabilities.join(', ') }}</p>
							<p v-if="foe.immunities && foe.immunities.length" class="stat-note stat-note-immune"><strong>Immune</strong> {{ foe.immunities.join(', ') }}</p>
						</div>
					</template>
				</div>
			</div>
		</div>
	`,
	setup() {
		const { ref, computed, onMounted, onUnmounted, inject } = Vue;
		const socket    = inject( "socket" );
		const gameState = inject( "gameState" );
		const apiCall   = inject( "api" );

		const loading    = ref( true );
		const mapLoaded  = ref( false );
		const mapTiles   = ref( [] );
		const mapDecs    = ref( [] );
		const mapWidth   = ref( 0 );
		const mapHeight  = ref( 0 );
		const mapPois    = ref( [] );

		const asiMode         = ref( "single" );
		const asiAbility1     = ref( "str" );
		const asiAbility2     = ref( "dex" );
		const asiSelectedFeat = ref( "" );
		const asiSelectedSkills = ref( [] );
		const restDiceCount   = ref( 1 );
		let autoBattleInterval = null;

		const abilityAbbrs = ["str","dex","con","int","wis","cha"];
		const ALL_SKILLS = [
			"Acrobatics","Animal Handling","Arcana","Athletics","Deception",
			"History","Insight","Intimidation","Investigation","Medicine",
			"Nature","Perception","Performance","Persuasion","Religion",
			"Sleight of Hand","Stealth","Survival"
		];

		const cs = gameState;

		const encounterKey = ref( "" );

		onMounted( async () => {
			const charId     = localStorage.getItem( "charId" );
			const moduleSlug = localStorage.getItem( "moduleSlug" ) ?? "";
			const mapSlug    = localStorage.getItem( "mapSlug" )    ?? "";

			let charIds = null;
			try {
				charIds = JSON.parse( localStorage.getItem( "partyCharIds" ) || "null" );
			} catch ( e ) {
				charIds = null;
			}
			if ( !Array.isArray( charIds ) || !charIds.length ) {
				charIds = charId ? [ charId ] : [];
			}

			if ( !charIds.length ) {
				VueRouter.useRouter().push( "/" );
				return;
			}

			try {
				const data = await apiCall( "/api/combat.bxm", {
					method: "POST",
					body: JSON.stringify( { charIds, moduleSlug, mapSlug } )
				} );
				encounterKey.value = data.encounterKey;
				applyStateUpdate( data );
				baseClassCache.clear();
				mapTiles.value  = data.mapTiles  ?? [];
				mapDecs.value   = data.mapDecorations ?? [];
				mapWidth.value  = data.mapWidth  ?? 0;
				mapHeight.value = data.mapHeight ?? 0;
				mapPois.value   = data.mapPois   ?? [];
				mapLoaded.value = true;
			} catch ( e ) {
				console.error( "Failed to start combat", e );
			} finally {
				loading.value = false;
			}
		} );

		onUnmounted( () => {
			stopAutoBattle();
			socket.removeEventListener( "message", onSocketMessage );
		} );

		function onSocketMessage( event ) {
			const msg = JSON.parse( event.data );
			if ( msg.type === "state_update" ) {
				applyStateUpdate( msg );
				if ( msg.mapTiles ) {
					baseClassCache.clear();
					mapTiles.value  = msg.mapTiles;
					mapDecs.value   = msg.mapDecorations ?? [];
					mapWidth.value  = msg.mapWidth  ?? mapWidth.value;
					mapHeight.value = msg.mapHeight ?? mapHeight.value;
					mapPois.value   = msg.mapPois   ?? [];
				}
			}
		}
		socket.addEventListener( "message", onSocketMessage );

		function applyStateUpdate( data ) {
			// The initial /api/combat.bxm load sends the whole player; websocket
			// updates send only changed top-level fields as playerDelta.
			const player = data.player
				?? ( data.playerDelta ? Object.assign( {}, cs.player, data.playerDelta ) : cs.player );
			Object.assign( cs, {
				player,
				players:               data.players               ?? cs.players,
				activePlayerIndex:     data.activePlayerIndex      ?? cs.activePlayerIndex,
				opponents:             data.opponents             ?? cs.opponents,
				currentTurn:           data.currentTurn           ?? cs.currentTurn,
				round:                 data.round                 ?? cs.round,
				movementRemaining:     data.movementRemaining     ?? cs.movementRemaining,
				actionUsed:            data.actionUsed            ?? cs.actionUsed,
				bonusActionUsed:       data.bonusActionUsed       ?? cs.bonusActionUsed,
				attacksUsedThisTurn:   data.attacksUsedThisTurn   ?? cs.attacksUsedThisTurn,
				gameOver:              data.gameOver              ?? cs.gameOver,
				outcome:               data.outcome               ?? cs.outcome,
				log:                   data.log                   ?? cs.log,
				initiativeRolled:      data.initiativeRolled      ?? cs.initiativeRolled,
				selectedOpponentIndex: data.selectedOpponentIndex ?? cs.selectedOpponentIndex,
				items:                 data.items                 ?? cs.items,
				autoBattling:          data.autoBattling          ?? cs.autoBattling,
				gridPois:              data.gridPois              ?? cs.gridPois
			} );
			if ( data.mapPois ) mapPois.value = data.mapPois;
		}

		function ws( type, extra = {} ) {
			socket.send( JSON.stringify( { type, encounterKey: encounterKey.value, ...extra } ) );
		}

		function selectActiveCharacter( playerIndex ) {
			if ( cs.gameOver || cs.currentTurn !== "player" || playerIndex === cs.activePlayerIndex ) return;
			ws( "select_active_character", { playerIndex } );
		}

		function startAutoBattle() {
			if ( cs.gameOver || !cs.initiativeRolled ) return;
			cs.autoBattling = true;
			autoBattleInterval = setInterval( () => {
				if ( cs.gameOver || !cs.autoBattling ) {
					stopAutoBattle();
					return;
				}
				ws( "auto_step" );
			}, 900 );
		}

		function stopAutoBattle() {
			cs.autoBattling = false;
			if ( autoBattleInterval ) {
				clearInterval( autoBattleInterval );
				autoBattleInterval = null;
			}
			ws( "auto_step" ); // tell server autoBattling = false (noop if already stopped)
		}

		function confirmAsi() {
			ws( "confirm_asi", { mode: asiMode.value, ability1: asiAbility1.value, ability2: asiAbility2.value } );
		}

		function confirmFeat() {
			if ( !asiSelectedFeat.value ) return;
			if ( asiSelectedFeat.value === "Skilled" && asiSelectedSkills.value.length !== 3 ) return;
			ws( "confirm_feat", { featName: asiSelectedFeat.value, skills: asiSelectedSkills.value } );
			asiSelectedFeat.value = "";
			asiSelectedSkills.value = [];
		}

		function toggleAsiSkill( skill ) {
			const idx = asiSelectedSkills.value.indexOf( skill );
			if ( idx >= 0 ) {
				asiSelectedSkills.value.splice( idx, 1 );
			} else if ( asiSelectedSkills.value.length < 3 ) {
				asiSelectedSkills.value.push( skill );
			}
		}

		// ── Viewport helpers ────────────────────────────────────────────────

		const vpMinCol = computed( () => {
			if ( !cs.player || !cs.player.position || !mapWidth.value ) return 1;
			const px = cs.player.position.x;
			return Math.max( 1, Math.min( px - VIEWPORT_RADIUS, mapWidth.value - VIEWPORT_RADIUS * 2 ) );
		} );
		const vpMinRow = computed( () => {
			if ( !cs.player || !cs.player.position || !mapHeight.value ) return 1;
			const py = cs.player.position.y;
			return Math.max( 1, Math.min( py - VIEWPORT_RADIUS, mapHeight.value - VIEWPORT_RADIUS * 2 ) );
		} );
		const vpMaxCol = computed( () => Math.min( mapWidth.value,  vpMinCol.value + VIEWPORT_RADIUS * 2 ) );
		const vpMaxRow = computed( () => Math.min( mapHeight.value, vpMinRow.value + VIEWPORT_RADIUS * 2 ) );
		const viewportCols = computed( () => vpMaxCol.value - vpMinCol.value + 1 );
		const viewportRows = computed( () => vpMaxRow.value - vpMinRow.value + 1 );

		// Game coordinates are 1-based (BoxLang arrays); the JSON-decoded
		// arrays here are 0-based, hence the -1 on both axes.
		function tileIsWall( x, y ) {
			if ( !mapTiles.value.length ) return false;
			const row = mapTiles.value[ y - 1 ];
			return row ? row[ x - 1 ] === "wall" : false;
		}

		// BFS matching CombatService.reachableSquares — returns Set of "x,y" keys
		function computeReachable( startX, startY, maxDist ) {
			const dist = {};
			const queue = [ { x: startX, y: startY, d: 0 } ];
			let head = 0;
			while ( head < queue.length ) {
				const { x, y, d } = queue[ head++ ];
				if ( d >= maxDist ) continue;
				for ( let dx = -1; dx <= 1; dx++ ) {
					for ( let dy = -1; dy <= 1; dy++ ) {
						if ( dx === 0 && dy === 0 ) continue;
						const nx = x + dx, ny = y + dy;
						if ( nx < 1 || ny < 1 || nx > mapWidth.value || ny > mapHeight.value ) continue;
						if ( tileIsWall( nx, ny ) ) continue;
						// No corner cutting — must match CombatService._bfs(), or the
						// highlight offers diagonal moves the server will refuse.
						if ( dx !== 0 && dy !== 0 && ( tileIsWall( nx, y ) || tileIsWall( x, ny ) ) ) continue;
						const key = nx + "," + ny;
						if ( key in dist ) continue;
						dist[ key ] = d + 1;
						queue.push( { x: nx, y: ny, d: d + 1 } );
					}
				}
			}
			return dist;
		}

		const reachableSet = Vue.computed( () => {
			const p = cs.player;
			if ( !p || !p.position || cs.gameOver || cs.autoBattling || cs.currentTurn !== "player" || p.hitPoints <= 0 || !mapLoaded.value ) return {};
			return computeReachable( p.position.x, p.position.y, cs.movementRemaining );
		} );

		function tileDec( x, y ) {
			if ( !mapDecs.value.length ) return "";
			const row = mapDecs.value[ y - 1 ];
			return row ? (row[ x - 1 ] ?? "") : "";
		}

		// "x,y" -> entity lookups, rebuilt once per state update so the 625
		// per-tile template bindings do O(1) checks instead of scanning the
		// opponents/POI arrays 625 times each render.
		const foeByTile = computed( () => {
			const m = Object.create( null );
			for ( const o of cs.opponents ?? [] ) {
				if ( o.hitPoints > 0 && o.position ) m[ o.position.x + "," + o.position.y ] = o;
			}
			return m;
		} );

		const partyMembers = computed( () => {
			if ( cs.players && cs.players.length ) return cs.players;
			return ( cs.player && cs.player.name ) ? [ cs.player ] : [];
		} );

		// Non-active party members' tiles, keyed like foeByTile — the active
		// member's own tile is handled separately (tile-player/⚔) since it's
		// also the movement/camera anchor.
		const allyByTile = computed( () => {
			const m = Object.create( null );
			partyMembers.value.forEach( ( p, i ) => {
				if ( ( i + 1 ) !== cs.activePlayerIndex && p.hitPoints > 0 && p.position ) {
					m[ p.position.x + "," + p.position.y ] = p;
				}
			} );
			return m;
		} );

		function allyAt( x, y ) {
			return allyByTile.value[ x + "," + y ] ?? null;
		}

		function partyIndexAt( x, y ) {
			for ( let i = 0; i < partyMembers.value.length; i++ ) {
				const p = partyMembers.value[ i ];
				if ( p.hitPoints > 0 && p.position && p.position.x === x && p.position.y === y ) return i + 1;
			}
			return 0;
		}

		const poiByTile = computed( () => {
			const m = Object.create( null );
			for ( const p of mapPois.value ) {
				if ( p.type === "loot" || p.type === "transition" ) m[ p.x + "," + p.y ] = p.type;
			}
			return m;
		} );

		function opponentAt( x, y ) {
			return foeByTile.value[ x + "," + y ] ?? null;
		}

		function poiTypeAt( x, y ) {
			return poiByTile.value[ x + "," + y ] ?? "";
		}

		// The wall/decoration part of a tile's class never changes within a
		// map, so it's computed once per tile and cached; most tiles then
		// yield an identical class string every render and Vue skips the DOM
		// write. Cleared whenever a new map's tiles arrive.
		const baseClassCache = new Map();
		function baseTileClass( x, y ) {
			const key = x + "," + y;
			let base = baseClassCache.get( key );
			if ( base === undefined ) {
				const dec = tileDec( x, y );
				base = "tile";
				if ( dec ) base += " tile-" + dec;
				else if ( tileIsWall( x, y ) ) base += " tile-wall";
				baseClassCache.set( key, base );
			}
			return base;
		}

		function tileClass( x, y ) {
			const base = baseTileClass( x, y );

			if ( cs.player && cs.player.position && cs.player.position.x === x && cs.player.position.y === y ) return base + " tile-player";
			if ( allyAt( x, y ) ) return base + " tile-ally";
			const foe = opponentAt( x, y );
			if ( foe ) {
				const isTarget = foe.mobIndex === cs.selectedOpponentIndex;
				return base + " tile-opponent" + (isTarget ? " tile-targeted" : "");
			}
			const poi = poiTypeAt( x, y );
			if ( poi === "loot" ) return base + " tile-loot";
			if ( poi === "transition" ) return base + " tile-transition";
			if ( reachableSet.value[ x + "," + y ] !== undefined ) return base + " tile-reachable";
			return base;
		}

		function tileTitle( x, y ) {
			if ( cs.player && cs.player.position && cs.player.position.x === x && cs.player.position.y === y ) return cs.player.name;
			const ally = allyAt( x, y );
			if ( ally ) return ally.name + " (click to make active)";
			const foe = opponentAt( x, y );
			if ( foe ) return foe.name;
			const poi = poiTypeAt( x, y );
			if ( poi === "loot" ) return "Treasure";
			if ( poi === "transition" ) return "A path onward";
			return `x${x}, y${y}`;
		}

		function tileEmoji( x, y ) {
			if ( cs.player && cs.player.position && cs.player.position.x === x && cs.player.position.y === y ) return "⚔";
			if ( allyAt( x, y ) ) return "🛡";
			const foe = opponentAt( x, y );
			if ( foe ) return "☠";
			const poi = poiTypeAt( x, y );
			if ( poi === "loot" ) return "💰";
			if ( poi === "transition" ) return "🌀";
			return "";
		}

		function tileClick( x, y ) {
			if ( cs.gameOver || cs.autoBattling || cs.currentTurn !== "player" ) return;
			const allyIndex = partyIndexAt( x, y );
			if ( allyIndex && allyIndex !== cs.activePlayerIndex ) {
				selectActiveCharacter( allyIndex );
				return;
			}
			if ( cs.player.hitPoints <= 0 ) return;
			const foe = opponentAt( x, y );
			if ( foe ) {
				ws( "select_target", { mobIndex: foe.mobIndex } );
				if ( !cs.initiativeRolled ) {
					cs.log = [ foe.name + " is too far away — move closer to engage.", ...cs.log ];
				} else {
					ws( "attack" );
				}
			} else {
				ws( "move", { x, y } );
			}
		}

		// ── Combat computed ─────────────────────────────────────────────────

		const playerBloodied = computed( () => {
			const p = cs.player;
			return p && p.hitPoints > 0 && p.hitPoints <= p.maxHitPoints / 2;
		} );

		function foeBloodied( foe ) {
			return foe.hitPoints > 0 && foe.hitPoints <= foe.maxHitPoints / 2;
		}

		const visibleFoes = computed( () => {
			if ( !cs.opponents ) return [];
			return cs.opponents.filter( f => f.visible && ( f.hitPoints > 0 || f.defeatedAtRound === cs.round ) );
		} );

		const remainingAttacks = computed( () => {
			const p = cs.player;
			if ( !p ) return 0;
			const total = p.extraAttack ? 2 : 1;
			return Math.max( 0, total - (cs.attacksUsedThisTurn ?? 0) );
		} );

		const canOffHandAttack = computed( () => {
			if ( cs.bonusActionUsed ) return false;
			return true;
		} );

		// Gate the "Action"/"Bonus" action-bar groups on whether any button
		// inside them would actually render, so a spent action/bonus action
		// doesn't leave a bare group label with nothing under it.
		const hasActionOptions = computed( () => {
			if ( !cs.player ) return false;
			const canAttack = remainingAttacks.value > 0 && ( !cs.actionUsed || cs.attacksUsedThisTurn > 0 );
			return canAttack || !cs.actionUsed;
		} );

		const hasBonusOptions = computed( () => {
			if ( !cs.player ) return false;
			return canOffHandAttack.value || cs.player.isRaging;
		} );

		const canRest = computed( () => {
			const p = cs.player;
			if ( !p ) return false;
			if ( p.inCombat ) return false;
			return !( cs.gameOver && cs.outcome === "defeat" );
		} );

		const maxRestDice = computed( () => {
			const p = cs.player;
			if ( !p ) return 0;
			return Math.max( 0, (p.hitDiceMax ?? 0) - (p.hitDiceSpent ?? 0) );
		} );

		const hoursUntilNextLongRest = computed( () => {
			const p = cs.player;
			if ( !p || !p.gameClockSeconds || !p.lastLongRestAt ) return 0;
			const LONG_REST_COOLDOWN = 24 * 60 * 60;
			const elapsed = p.gameClockSeconds - p.lastLongRestAt;
			return Math.max( 0, Math.ceil( (LONG_REST_COOLDOWN - elapsed) / 3600 ) );
		} );

		const gameClockLabel = computed( () => {
			const p = cs.player;
			if ( !p || !p.gameClockSeconds ) return "";
			const total   = p.gameClockSeconds;
			const day     = Math.floor( total / 86400 ) + 1;
			const intoDay = total % 86400;
			const hh      = String( Math.floor( intoDay / 3600 ) ).padStart( 2, "0" );
			const mm      = String( Math.floor( (intoDay % 3600) / 60) ).padStart( 2, "0" );
			return `Day ${ day }, ${ hh }:${ mm }`;
		} );

		const availableLevelUpFeats = computed( () => {
			return ["Alert","Athlete","Actor","Charger","Crossbow Expert","Defensive Duelist","Dual Wielder","Dungeon Delver",
				"Durable","Elemental Adept","Grappler","Great Weapon Master","Healer","Heavily Armored","Heavy Armor Master",
				"Inspiring Leader","Keen Mind","Lightly Armored","Linguist","Lucky","Mage Slayer","Magic Initiate",
				"Martial Adept","Medium Armor Master","Mobile","Moderately Armored","Mounted Combatant","Observant",
				"Polearm Master","Resilient","Ritual Caster","Savage Attacker","Sentinel","Sharpshooter","Shield Master",
				"Skilled","Skulker","Spell Sniper","Tavern Brawler","Tough","War Caster","Weapon Master"
			];
		} );

		function playerHasFeature( name ) {
			return cs.player && cs.player.features && cs.player.features.includes( name );
		}

		function hasSpellResource( minimumLevel ) {
			const slots = cs.player?.spellSlots;
			if ( !slots ) return false;
			return Object.entries( slots ).some( ([lvl, count]) => parseInt(lvl) >= minimumLevel && count > 0 );
		}

		function itemIsUsable( name ) {
			const usable = ["Potion of Healing","Potion of Greater Healing","Potion of Superior Healing","Potion of Supreme Healing"];
			return usable.includes( name );
		}

		function describeSpell( spell ) {
			if ( spell.type === "heal" ) return `Heal — ${ spell.diceCount }d${ spell.diceSides }`;
			if ( spell.type === "attack" ) return `Attack — ${ spell.diceCount }d${ spell.diceSides } ${ spell.damageType }`;
			return `Save (${ (spell.saveAbility||"").toUpperCase() }) — ${ spell.diceCount }d${ spell.diceSides } ${ spell.damageType }`;
		}

		return {
			cs, loading, mapLoaded, mapWidth, mapHeight, partyMembers,
			vpMinCol, vpMinRow, viewportCols, viewportRows,
			asiMode, asiAbility1, asiAbility2, asiSelectedFeat, asiSelectedSkills, restDiceCount,
			abilityAbbrs, ALL_SKILLS, availableLevelUpFeats,
			playerBloodied, visibleFoes, foeBloodied, remainingAttacks, canOffHandAttack,
			hasActionOptions, hasBonusOptions,
			canRest, maxRestDice, hoursUntilNextLongRest, gameClockLabel,
			tileClass, tileTitle, tileEmoji, tileClick, selectActiveCharacter,
			playerHasFeature, hasSpellResource, itemIsUsable, describeSpell,
			ws, startAutoBattle, stopAutoBattle, confirmAsi, confirmFeat, toggleAsiSkill
		};
	}
};
