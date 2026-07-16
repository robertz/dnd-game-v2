const CharacterCreation = {
	template: `
		<div class="creation">
			<h1 class="fantasy-heading">Create Your Character</h1>

			<template v-if="loading">
				<loading-veil label="Preparing the character forge..." />
			</template>

			<template v-else-if="createdCharacterId">
				<p class="encounter-banner encounter-banner-victory">
					{{ characterName }} the {{ selectedClass?.name }} has been created!
				</p>
				<div v-if="createdSheet" class="stat-card">
					<h2 class="fantasy-heading">{{ characterName }}</h2>
					<p class="stat-subtitle">{{ effectiveSpeciesName }} {{ selectedClass?.name }} — {{ selectedBackground }} — {{ selectedAlignment }}</p>
					<ul class="stat-list">
						<li>
							<strong>STR</strong> {{ createdSheet.abilityScores.str }} &nbsp;
							<strong>DEX</strong> {{ createdSheet.abilityScores.dex }} &nbsp;
							<strong>CON</strong> {{ createdSheet.abilityScores.con }}
						</li>
						<li>
							<strong>INT</strong> {{ createdSheet.abilityScores.int }} &nbsp;
							<strong>WIS</strong> {{ createdSheet.abilityScores.wis }} &nbsp;
							<strong>CHA</strong> {{ createdSheet.abilityScores.cha }}
						</li>
						<li v-if="createdSheet.skillProficiencies?.length">
							<strong>Skill Proficiencies</strong>
							<span
								v-for="skill in createdSheet.skillProficiencies"
								:key="skill"
								class="skill-chip"
								:title="skillTooltip(skill)"
							>{{ skill }}</span>
						</li>
						<li v-if="createdSheet.feats?.length">
							<strong>Feats</strong>
							<span v-for="feat in createdSheet.feats" :key="feat" class="skill-chip">{{ feat }}</span>
						</li>
						<li v-if="createdSheet.features?.length">
							<strong>Features</strong>
							<span v-for="f in createdSheet.features" :key="f.name" class="skill-chip">Lv {{ f.level }} — {{ f.name }}</span>
						</li>
					</ul>
				</div>
				<div class="turn-actions">
					<button type="button" class="btn btn-attack" @click="beginAdventure">Begin Adventure</button>
					<router-link class="btn btn-end-turn" to="/">Back to Character Select</router-link>
				</div>
			</template>

			<template v-else>
				<p class="encounter-intro">Step {{ step }} of {{ totalSteps }}</p>

				<p v-if="formError" class="encounter-banner encounter-banner-defeat">{{ formError }}</p>

				<!-- Choices so far — steps 1-5 only; step 6 shows the same list as its own Review below -->
				<div v-if="step < totalSteps && choicesSoFar.length" class="stat-card creation-summary">
					<h3 class="fantasy-heading">Your Choices So Far</h3>
					<ul class="stat-list">
						<li v-for="item in choicesSoFar" :key="item.label">
							<strong>{{ item.label }}</strong>
							<template v-if="item.skills">
								<span
									v-for="skill in item.skills" :key="skill"
									class="skill-chip"
									:title="skillTooltip(skill)"
								>{{ skill }}</span>
							</template>
							<template v-else>{{ item.text }}</template>
						</li>
					</ul>
				</div>

				<!-- Step 1: Class -->
				<template v-if="step === 1">
					<h2 class="fantasy-heading">Choose a Class</h2>
					<div class="creation-grid">
						<div
							v-for="cls in classes"
							:key="cls.id"
							class="creation-card"
							:class="{ 'creation-card-selected': selectedClassId == cls.id }"
							@click="selectClass(cls.id)"
						>
							<h3 class="fantasy-heading">{{ cls.name }}</h3>
							<p class="stat-subtitle">Primary: {{ cls.primaryAbility }} — {{ cls.hitDie }}</p>
							<p>Saves: {{ cls.savingThrows }}</p>
						</div>
					</div>

					<template v-if="selectedClass">
						<template v-if="selectedClass.skillChoice?.count > 0">
							<p class="stat-subtitle">
								Choose {{ selectedClass.skillChoice.count }} Skill Proficienc{{ selectedClass.skillChoice.count === 1 ? 'y' : 'ies' }}
							</p>
							<div class="creation-grid">
								<div
									v-for="skill in selectedClass.skillChoice.options"
									:key="skill"
									class="creation-card creation-card-compact"
									:class="{ 'creation-card-selected': selectedClassSkills.includes(skill) }"
									:title="skillTooltip(skill)"
									@click="toggleClassSkill(skill)"
								>{{ skill }}</div>
							</div>
						</template>

						<template v-if="selectedClass.hasFightingStyle">
							<p class="stat-subtitle">Choose a Fighting Style</p>
							<div class="creation-grid">
								<div
									v-for="style in selectedClass.fightingStyles"
									:key="style"
									class="creation-card creation-card-compact"
									:class="{ 'creation-card-selected': selectedFightingStyle === style }"
									@click="selectFightingStyle(style)"
								>{{ style }}</div>
							</div>
						</template>
					</template>
				</template>

				<!-- Step 2: Origin -->
				<template v-if="step === 2">
					<h2 class="fantasy-heading">Character Origin</h2>

					<p class="stat-subtitle">Choose a Species</p>
					<div class="creation-grid">
						<div
							v-for="opt in speciesOptions"
							:key="opt.name"
							class="creation-card creation-card-compact"
							:class="{ 'creation-card-selected': selectedSpecies === opt.name }"
							:title="speciesTooltip(opt.detail)"
							@click="selectSpecies(opt.name)"
						>{{ opt.name }}</div>
					</div>

					<template v-if="selectedSpeciesOption?.subraces?.length">
						<p class="stat-subtitle">Choose a {{ selectedSpecies }} Subrace</p>
						<div class="creation-grid">
							<div
								v-for="sub in selectedSpeciesOption.subraces"
								:key="sub"
								class="creation-card creation-card-compact"
								:class="{ 'creation-card-selected': selectedSubrace === sub }"
								:title="speciesTooltip(selectedSpeciesOption.subraceDetails[sub])"
								@click="selectSubrace(sub)"
							>{{ sub }}</div>
						</div>
					</template>

					<div v-if="selectedSpeciesDetail" class="stat-card creation-detail">
						<h3 class="fantasy-heading">{{ effectiveSpeciesName }}</h3>
						<p class="stat-subtitle">
							{{ selectedSpeciesDetail.size }} — Speed {{ selectedSpeciesDetail.speed }} ft
							<template v-if="selectedSpeciesDetail.darkvision > 0"> — Darkvision {{ selectedSpeciesDetail.darkvision }} ft</template>
						</p>
						<p v-if="abilityBonusSummary(selectedSpeciesDetail)">
							<strong>Ability Bonus</strong> {{ abilityBonusSummary(selectedSpeciesDetail) }}
						</p>
						<p v-if="selectedSpeciesDetail.languages?.length">
							<strong>Languages</strong> {{ selectedSpeciesDetail.languages.join(', ') }}
							<template v-if="selectedSpeciesDetail.bonusLanguageChoice"> plus one of your choice</template>
						</p>
						<p v-if="selectedSpeciesDetail.resistances?.length">
							<strong>Resistances</strong> {{ selectedSpeciesDetail.resistances.join(', ') }}
						</p>
						<ul v-if="selectedSpeciesDetail.traits?.length" class="stat-list">
							<li v-for="trait in selectedSpeciesDetail.traits" :key="trait.name">
								<strong>{{ trait.name }}</strong> {{ trait.description }}
							</li>
						</ul>

						<template v-if="selectedSpeciesDetail.choiceAbilityCount > 0">
							<p class="stat-subtitle">
								Choose {{ selectedSpeciesDetail.choiceAbilityCount }} ability score{{ selectedSpeciesDetail.choiceAbilityCount === 1 ? '' : 's' }} to increase by {{ selectedSpeciesDetail.choiceAbilityBonus }}
							</p>
							<div class="creation-grid">
								<div
									v-for="ability in choiceAbilityOptions"
									:key="ability"
									class="creation-card creation-card-compact"
									:class="{ 'creation-card-selected': selectedChoiceAbilities.includes(ability) }"
									@click="toggleChoiceAbility(ability)"
								>{{ ability.toUpperCase() }}</div>
							</div>
						</template>

						<template v-if="selectedSpeciesDetail.choiceSkillCount > 0">
							<p class="stat-subtitle">
								Choose {{ selectedSpeciesDetail.choiceSkillCount }} skill{{ selectedSpeciesDetail.choiceSkillCount === 1 ? '' : 's' }} of your choice
							</p>
							<div class="creation-grid">
								<div
									v-for="skill in ALL_SKILL_NAMES"
									:key="skill"
									class="creation-card creation-card-compact"
									:class="{ 'creation-card-selected': selectedSpeciesSkills.includes(skill) }"
									:title="skillTooltip(skill)"
									@click="toggleSpeciesSkill(skill)"
								>{{ skill }}</div>
							</div>
						</template>
					</div>

					<p class="stat-subtitle">Choose a Background</p>
					<div class="creation-grid">
						<div
							v-for="opt in backgroundOptions"
							:key="opt.name"
							class="creation-card creation-card-compact"
							:class="{ 'creation-card-selected': selectedBackground === opt.name }"
							@click="selectBackground(opt.name)"
						>{{ opt.name }}</div>
					</div>

					<div v-if="selectedBackgroundDetail" class="stat-card creation-detail">
						<h3 class="fantasy-heading">{{ selectedBackground }}</h3>
						<ul class="stat-list">
							<li><strong>Skill Proficiencies</strong> {{ selectedBackgroundDetail.skillProficiencies }}</li>
							<li v-if="selectedBackgroundDetail.toolProficiencies">
								<strong>Tool Proficiencies</strong> {{ selectedBackgroundDetail.toolProficiencies }}
							</li>
							<li v-if="selectedBackgroundDetail.bonusLanguageCount > 0">
								<strong>Languages</strong> {{ selectedBackgroundDetail.bonusLanguageCount }} of your choice
							</li>
							<li v-if="selectedBackgroundDetail.featureName">
								<strong>{{ selectedBackgroundDetail.featureName }}</strong> {{ selectedBackgroundDetail.featureDescription }}
							</li>
						</ul>
					</div>
				</template>

				<!-- Step 3: Ability Scores -->
				<template v-if="step === 3">
					<h2 class="fantasy-heading">Ability Scores</h2>
					<p v-if="selectedClass" class="stat-subtitle">{{ selectedClass.name }}'s primary attribute: <strong>{{ selectedClass.primaryAbility }}</strong> — assign your highest score there.</p>
					<p class="stat-subtitle">
						Click an ability to target it, then click a value to assign it there.
						<template v-if="activeAbility"> Assigning to <strong>{{ activeAbility.toUpperCase() }}</strong> next.</template>
					</p>

					<ul class="stat-list creation-scores">
						<li
							v-for="ability in ABILITY_ORDER" :key="ability"
							class="creation-card ability-assign-slot"
							:class="{ 'creation-card-selected': activeAbility === ability, 'ability-assign-slot-filled': ability in assignedScores }"
							@click="selectAbilitySlot(ability)"
						>
							<strong>{{ ability.toUpperCase() }}</strong>
							<span>{{ assignedScores[ability] ?? '—' }}</span>
						</li>
					</ul>

					<div class="creation-grid creation-grid-sm">
						<div
							v-for="value in standardArray"
							:key="value"
							class="creation-card creation-card-compact"
							@click="assignScore(value)"
						>{{ value }}</div>
					</div>

					<button type="button" class="btn btn-end-turn" @click="resetScores">Reset</button>
				</template>

				<!-- Step 4: Alignment -->
				<template v-if="step === 4">
					<h2 class="fantasy-heading">Alignment</h2>
					<div class="creation-grid">
						<div
							v-for="opt in ALIGNMENT_OPTIONS"
							:key="opt"
							class="creation-card creation-card-compact"
							:class="{ 'creation-card-selected': selectedAlignment === opt }"
							@click="selectAlignment(opt)"
						>{{ opt }}</div>
					</div>
				</template>

				<!-- Step 5: Spells (full casters only) -->
				<template v-if="step === 5">
					<h2 class="fantasy-heading">Spells</h2>

					<template v-if="cantripOptions.length">
						<p class="stat-subtitle">Choose a Cantrip</p>
						<div class="creation-grid">
							<div
								v-for="spell in cantripOptions"
								:key="spell.name"
								class="creation-card"
								:class="{ 'creation-card-selected': selectedCantripName === spell.name }"
								@click="selectCantrip(spell.name)"
							>
								<h3 class="fantasy-heading">{{ spell.name }}</h3>
								<p class="stat-subtitle">{{ describeSpellOption(spell) }}</p>
							</div>
						</div>
					</template>

					<template v-if="spellOptions.length">
						<p class="stat-subtitle">Choose a 1st-Level Spell</p>
						<div class="creation-grid">
							<div
								v-for="spell in spellOptions"
								:key="spell.name"
								class="creation-card"
								:class="{ 'creation-card-selected': selectedSpellName === spell.name }"
								@click="selectSpell(spell.name)"
							>
								<h3 class="fantasy-heading">{{ spell.name }}</h3>
								<p class="stat-subtitle">{{ describeSpellOption(spell) }}</p>
							</div>
						</div>
					</template>
				</template>

				<!-- Step 6: Name & Review -->
				<template v-if="step === 6">
					<h2 class="fantasy-heading">Name Your Character</h2>
					<input
						v-model="characterName"
						type="text"
						class="creation-input"
						placeholder="Character name"
					/>

					<div class="stat-card">
						<h3 class="fantasy-heading">Review</h3>
						<ul class="stat-list">
							<li v-for="item in choicesSoFar" :key="item.label">
								<strong>{{ item.label }}</strong>
								<template v-if="item.skills">
									<span
										v-for="skill in item.skills" :key="skill"
										class="skill-chip"
										:title="skillTooltip(skill)"
									>{{ skill }}</span>
								</template>
								<template v-else>{{ item.text }}</template>
							</li>
						</ul>
					</div>
				</template>

				<!-- Navigation -->
				<div class="turn-actions">
					<button v-if="step > 1" type="button" class="btn btn-end-turn" @click="previousStep">Back</button>
					<button v-if="step < totalSteps" type="button" class="btn btn-auto-battle" @click="nextStep">Next</button>
					<button v-else type="button" class="btn btn-attack" :disabled="submitting" @click="createCharacter">
						{{ submitting ? 'Creating...' : 'Create Character' }}
					</button>
				</div>
			</template>
		</div>
	`,

	setup() {
		const { ref, computed, onMounted } = Vue;
		const router = VueRouter.useRouter();

		// ── Static SRD data ────────────────────────────────────────────────────
		const ABILITY_ORDER = [ 'str', 'dex', 'con', 'int', 'wis', 'cha' ];
		const ALIGNMENT_OPTIONS = [
			'Lawful Good',   'Neutral Good',  'Chaotic Good',
			'Lawful Neutral','True Neutral',  'Chaotic Neutral',
			'Lawful Evil',   'Neutral Evil',  'Chaotic Evil'
		];
		const SKILL_ABILITY = {
			'Acrobatics': 'Dexterity',    'Animal Handling': 'Wisdom',   'Arcana': 'Intelligence',
			'Athletics': 'Strength',      'Deception': 'Charisma',       'History': 'Intelligence',
			'Insight': 'Wisdom',          'Intimidation': 'Charisma',    'Investigation': 'Intelligence',
			'Medicine': 'Wisdom',         'Nature': 'Intelligence',       'Perception': 'Wisdom',
			'Performance': 'Charisma',   'Persuasion': 'Charisma',      'Religion': 'Intelligence',
			'Sleight of Hand': 'Dexterity', 'Stealth': 'Dexterity',     'Survival': 'Wisdom'
		};
		const ALL_SKILL_NAMES = Object.keys( SKILL_ABILITY );

		// What each skill actually lets you do at the table — the ability
		// score alone (e.g. "Intelligence" for Religion) doesn't tell a new
		// player what the skill covers in play, which was the actual point of
		// confusion (see the tooltip these feed — skillTooltip()).
		const SKILL_DESCRIPTIONS = {
			'Acrobatics':       'Stay on your feet or slip free — tumbling, balancing, wriggling out of a grapple.',
			'Animal Handling':  'Calm, control, or read the intentions of an animal.',
			'Arcana':           'Recall lore about spells, magic items, planes, and magical traditions.',
			'Athletics':        'Climb, jump, swim, or force your way through — anything physically strenuous.',
			'Deception':        'Convincingly hide the truth, whether in words or actions.',
			'History':          'Recall lore about past events, civilizations, wars, and lost kingdoms.',
			'Insight':          "Read a creature's true intentions — catch a lie, sense a hidden motive.",
			'Intimidation':     'Influence someone through threats, hostile actions, or force of presence.',
			'Investigation':    'Deduce clues, spot hidden details, or figure out how something works.',
			'Medicine':         'Diagnose illness, stabilize the dying, or judge a cause of death.',
			'Nature':           'Recall lore about terrain, plants, animals, and natural weather patterns.',
			'Perception':       'Notice things — spot a hidden foe, hear a whisper, catch a passing detail.',
			'Performance':      'Entertain an audience with music, dance, acting, or storytelling.',
			'Persuasion':       'Influence someone through tact, social grace, or genuine goodwill.',
			'Religion':         'Recall lore about deities, rites, holy symbols, and religious hierarchies.',
			'Sleight of Hand':  'Plant something, lift a pocket, or otherwise be sneaky with your hands.',
			'Stealth':          'Conceal yourself, move silently, or slip past a watchful guard.',
			'Survival':         'Track quarry, forage, navigate the wild, or avoid natural hazards.'
		};

		// ── Wizard state ───────────────────────────────────────────────────────
		const step       = ref( 1 );
		const totalSteps = 6;
		const loading    = ref( true );
		const submitting = ref( false );
		const formError  = ref( '' );

		// Step 1 — Class
		const classes              = ref( [] );
		const selectedClassId      = ref( '' );
		const selectedClassSkills  = ref( [] );
		const selectedFightingStyle = ref( '' );
		const cantripOptions       = ref( [] );
		const spellOptions         = ref( [] );
		const selectedCantripName  = ref( '' );
		const selectedSpellName    = ref( '' );

		// Step 2 — Origin
		const speciesOptions         = ref( [] );
		const backgroundOptions      = ref( [] );
		const selectedSpecies        = ref( '' );
		const selectedSubrace        = ref( '' );
		const selectedChoiceAbilities = ref( [] );
		const selectedSpeciesSkills  = ref( [] );
		const selectedBackground     = ref( '' );

		// Step 3 — Ability Scores
		const standardArray   = ref( [ 15, 14, 13, 12, 10, 8 ] );
		const assignedScores  = ref( {} );
		const selectedAbility = ref( '' );

		// Step 4 — Alignment
		const selectedAlignment = ref( '' );

		// Step 6 — Details + post-creation
		const characterName      = ref( '' );
		const createdCharacterId = ref( '' );
		const createdSheet       = ref( null );

		// ── Computed ───────────────────────────────────────────────────────────
		const selectedClass = computed( () =>
			classes.value.find( c => c.id == selectedClassId.value ) || null
		);

		const effectiveSpeciesName = computed( () =>
			selectedSubrace.value || selectedSpecies.value
		);

		const selectedSpeciesOption = computed( () =>
			speciesOptions.value.find( s => s.name === selectedSpecies.value ) || null
		);

		const selectedSpeciesDetail = computed( () => {
			if ( !selectedSpeciesOption.value ) return null;
			if ( selectedSubrace.value ) {
				return selectedSpeciesOption.value.subraceDetails?.[ selectedSubrace.value ] || null;
			}
			return selectedSpeciesOption.value.detail || null;
		} );

		const selectedBackgroundDetail = computed( () => {
			const opt = backgroundOptions.value.find( b => b.name === selectedBackground.value );
			return opt?.detail || null;
		} );

		const choiceAbilityOptions = computed( () => {
			if ( !selectedSpeciesDetail.value ) return [];
			return ABILITY_ORDER.filter( a => selectedSpeciesDetail.value.abilityBonuses[ a ] === 0 );
		} );

		const hasSpellOptions = computed( () =>
			cantripOptions.value.length > 0 || spellOptions.value.length > 0
		);

		// Drives both the persistent "choices so far" panel (steps 1-5) and
		// step 6's Review — one source of truth so the two never drift, and
		// each entry only appears once its choice has actually been made.
		const choicesSoFar = computed( () => {
			const items = [];
			if ( selectedClass.value ) items.push( { label: 'Class', text: selectedClass.value.name } );
			if ( selectedClassSkills.value.length ) items.push( { label: 'Class Skills', skills: selectedClassSkills.value } );
			if ( selectedFightingStyle.value ) items.push( { label: 'Fighting Style', text: selectedFightingStyle.value } );
			if ( selectedSpecies.value ) items.push( { label: 'Species', text: effectiveSpeciesName.value } );
			if ( selectedSpeciesSkills.value.length ) items.push( { label: 'Species Skills', skills: selectedSpeciesSkills.value } );
			const speciesBonus = abilityBonusSummary( selectedSpeciesDetail.value );
			if ( speciesBonus ) items.push( { label: 'Species Bonus', text: speciesBonus } );
			if ( selectedBackground.value ) items.push( { label: 'Background', text: selectedBackground.value } );
			if ( selectedAlignment.value ) items.push( { label: 'Alignment', text: selectedAlignment.value } );
			if ( Object.keys( assignedScores.value ).length ) {
				const s = assignedScores.value;
				items.push( {
					label: 'Ability Scores',
					text: `STR ${ s.str ?? '—' }, DEX ${ s.dex ?? '—' }, CON ${ s.con ?? '—' }, INT ${ s.int ?? '—' }, WIS ${ s.wis ?? '—' }, CHA ${ s.cha ?? '—' }`
				} );
			}
			if ( selectedCantripName.value ) items.push( { label: 'Cantrip', text: selectedCantripName.value } );
			if ( selectedSpellName.value ) items.push( { label: '1st-Level Spell', text: selectedSpellName.value } );
			return items;
		} );

		// ── Helpers ────────────────────────────────────────────────────────────
		function skillTooltip( name ) {
			const ability = SKILL_ABILITY[ name ];
			const description = SKILL_DESCRIPTIONS[ name ];
			if ( !ability || !description ) return name;
			return `${ ability } — ${ description }`;
		}

		// A compact, hover-before-you-click summary of a species/subrace —
		// full trait text (some of it multi-paragraph SRD rules text, e.g.
		// Breath Weapon) already lives in the detail panel once you've picked
		// it, so this only lists trait names plus the core numbers, not their
		// full descriptions.
		function speciesTooltip( detail ) {
			if ( !detail ) return '';
			const lines = [];

			let coreLine = detail.size || '';
			if ( detail.speed ) coreLine += ( coreLine ? ' — ' : '' ) + `Speed ${ detail.speed } ft`;
			if ( detail.darkvision > 0 ) coreLine += ` — Darkvision ${ detail.darkvision } ft`;
			if ( coreLine ) lines.push( coreLine );

			const bonus = abilityBonusSummary( detail );
			if ( bonus ) lines.push( `Ability Bonus: ${ bonus }` );

			if ( detail.resistances?.length ) lines.push( `Resistances: ${ detail.resistances.join( ', ' ) }` );
			if ( detail.traits?.length ) lines.push( `Traits: ${ detail.traits.map( t => t.name ).join( ', ' ) }` );

			return lines.join( '\n' );
		}

		function abilityBonusSummary( detail ) {
			if ( !detail ) return '';
			const labels = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' };
			const parts = [];
			let nonZero = 0;
			for ( const ability of ABILITY_ORDER ) {
				if ( detail.abilityBonuses[ ability ] !== 0 ) {
					nonZero++;
					parts.push( `${ labels[ ability ] } +${ detail.abilityBonuses[ ability ] }` );
				}
			}
			let summary = nonZero === 6 ? `All abilities +${ detail.abilityBonuses.str }` : parts.join( ', ' );
			if ( detail.choiceAbilityCount > 0 ) {
				const choiceText = `${ detail.choiceAbilityCount } of your choice +${ detail.choiceAbilityBonus }`;
				summary = summary.length ? `${ summary }, plus ${ choiceText }` : choiceText;
			}
			return summary;
		}

		function describeSpellOption( spell ) {
			if ( spell.type === 'heal' )
				return `Heal — ${ spell.diceCount }d${ spell.diceSides }`;
			if ( spell.type === 'attack' )
				return `Attack — ${ spell.diceCount }d${ spell.diceSides } ${ spell.damageType }, range ${ spell.rangeSquares } sq`;
			return `Save (${ spell.saveAbility.toUpperCase() }) — ${ spell.diceCount }d${ spell.diceSides } ${ spell.damageType }, ${ spell.saveEffect === 'half' ? 'half on success' : 'none on success' }`;
		}

		// ── Step 1 actions ─────────────────────────────────────────────────────
		async function selectClass( classId ) {
			selectedClassId.value      = classId;
			selectedClassSkills.value  = [];
			selectedFightingStyle.value = '';
			cantripOptions.value       = [];
			spellOptions.value         = [];
			selectedCantripName.value  = '';
			selectedSpellName.value    = '';
			formError.value            = '';

			const cls = classes.value.find( c => c.id == classId );
			if ( cls?.isFullCaster ) {
				try {
					const spells = await api( `/api/options/spells.bxm?className=${ encodeURIComponent( cls.name ) }` );
					cantripOptions.value      = spells.cantrips || [];
					spellOptions.value        = spells.spells   || [];
					selectedCantripName.value = cantripOptions.value[ 0 ]?.name || '';
					selectedSpellName.value   = spellOptions.value[ 0 ]?.name   || '';
				} catch ( e ) {
					console.error( 'Failed to load spells', e );
				}
			}
		}

		function toggleClassSkill( skill ) {
			const count = selectedClass.value?.skillChoice?.count || 0;
			const idx   = selectedClassSkills.value.indexOf( skill );
			if ( idx >= 0 ) {
				selectedClassSkills.value.splice( idx, 1 );
			} else if ( selectedClassSkills.value.length < count ) {
				selectedClassSkills.value.push( skill );
			}
		}

		function selectFightingStyle( name ) {
			selectedFightingStyle.value = name;
			formError.value = '';
		}

		// ── Step 2 actions ─────────────────────────────────────────────────────
		function selectSpecies( name ) {
			selectedSpecies.value         = name;
			selectedSubrace.value         = '';
			selectedChoiceAbilities.value = [];
			selectedSpeciesSkills.value   = [];
			formError.value               = '';
		}

		function selectSubrace( name ) {
			selectedSubrace.value         = name;
			selectedChoiceAbilities.value = [];
			selectedSpeciesSkills.value   = [];
			formError.value               = '';
		}

		function toggleChoiceAbility( ability ) {
			if ( !choiceAbilityOptions.value.includes( ability ) ) return;
			const idx = selectedChoiceAbilities.value.indexOf( ability );
			if ( idx >= 0 ) {
				selectedChoiceAbilities.value.splice( idx, 1 );
			} else if ( selectedChoiceAbilities.value.length < selectedSpeciesDetail.value.choiceAbilityCount ) {
				selectedChoiceAbilities.value.push( ability );
			}
		}

		function toggleSpeciesSkill( skill ) {
			const limit = selectedSpeciesDetail.value?.choiceSkillCount || 0;
			const idx   = selectedSpeciesSkills.value.indexOf( skill );
			if ( idx >= 0 ) {
				selectedSpeciesSkills.value.splice( idx, 1 );
			} else if ( selectedSpeciesSkills.value.length < limit ) {
				selectedSpeciesSkills.value.push( skill );
			}
		}

		function selectBackground( name ) {
			selectedBackground.value = name;
			formError.value          = '';
		}

		// ── Step 3 actions ─────────────────────────────────────────────────────
		// The ability a clicked value goes to: whichever one was manually
		// targeted via selectAbilitySlot(), or (once that's filled, or if
		// nothing's been targeted yet) the first still-empty ability in fixed
		// order — same default sequence as before, just now overridable.
		const activeAbility = computed( () => {
			if ( selectedAbility.value && !( selectedAbility.value in assignedScores.value ) ) {
				return selectedAbility.value;
			}
			return ABILITY_ORDER.find( a => !( a in assignedScores.value ) ) ?? '';
		} );

		function selectAbilitySlot( ability ) {
			if ( ability in assignedScores.value ) {
				// Clicking an already-filled slot frees its value back into the
				// pool and targets that slot next, so swapping two assignments
				// doesn't require a full reset.
				standardArray.value.push( assignedScores.value[ ability ] );
				standardArray.value.sort( ( a, b ) => b - a );
				delete assignedScores.value[ ability ];
			}
			selectedAbility.value = ability;
		}

		function assignScore( value ) {
			const ability = activeAbility.value;
			if ( !ability ) return;
			assignedScores.value[ ability ] = value;
			standardArray.value = standardArray.value.filter( v => v !== value );
			selectedAbility.value = '';
			formError.value = '';
		}

		function resetScores() {
			assignedScores.value  = {};
			standardArray.value   = [ 15, 14, 13, 12, 10, 8 ];
			selectedAbility.value = '';
		}

		// ── Step 4 actions ─────────────────────────────────────────────────────
		function selectAlignment( alignment ) {
			selectedAlignment.value = alignment;
			formError.value         = '';
		}

		// ── Step 5 actions ─────────────────────────────────────────────────────
		function selectCantrip( name ) { selectedCantripName.value = name; formError.value = ''; }
		function selectSpell( name )   { selectedSpellName.value   = name; formError.value = ''; }

		// ── Navigation ─────────────────────────────────────────────────────────
		function validateStep( n ) {
			switch ( n ) {
				case 1: {
					if ( !selectedClassId.value ) return 'Choose a class to continue.';
					const choice = selectedClass.value?.skillChoice;
					if ( choice?.count > 0 && selectedClassSkills.value.length !== choice.count )
						return `Choose ${ choice.count } skill${ choice.count === 1 ? '' : 's' } to continue.`;
					if ( selectedClass.value?.hasFightingStyle && !selectedFightingStyle.value )
						return 'Choose a Fighting Style to continue.';
					return '';
				}
				case 2: {
					if ( !selectedSpecies.value ) return 'Choose a species to continue.';
					if ( selectedSpeciesOption.value?.subraces?.length && !selectedSubrace.value )
						return `Choose a ${ selectedSpecies.value } subrace to continue.`;
					const detail = selectedSpeciesDetail.value;
					if ( detail?.choiceAbilityCount > 0 && selectedChoiceAbilities.value.length !== detail.choiceAbilityCount )
						return `Choose ${ detail.choiceAbilityCount } ability score${ detail.choiceAbilityCount === 1 ? '' : 's' } to increase.`;
					if ( detail?.choiceSkillCount > 0 && selectedSpeciesSkills.value.length !== detail.choiceSkillCount )
						return `Choose ${ detail.choiceSkillCount } skill${ detail.choiceSkillCount === 1 ? '' : 's' } to continue.`;
					return selectedBackground.value ? '' : 'Choose a background to continue.';
				}
				case 3:
					return Object.keys( assignedScores.value ).length === 6 ? '' : 'Assign all six ability scores to continue.';
				case 4:
					return selectedAlignment.value ? '' : 'Choose an alignment to continue.';
				case 5:
					if ( !hasSpellOptions.value ) return '';
					if ( cantripOptions.value.length && !selectedCantripName.value ) return 'Choose a cantrip to continue.';
					if ( spellOptions.value.length  && !selectedSpellName.value   ) return 'Choose a 1st-level spell to continue.';
					return '';
				case 6:
					return characterName.value.trim() ? '' : 'Give your character a name.';
			}
			return '';
		}

		function nextStep() {
			const err = validateStep( step.value );
			if ( err ) { formError.value = err; return; }
			formError.value = '';
			if ( step.value < totalSteps ) {
				step.value++;
				if ( step.value === 5 && !hasSpellOptions.value ) step.value++;
			}
		}

		function previousStep() {
			formError.value = '';
			if ( step.value > 1 ) {
				step.value--;
				if ( step.value === 5 && !hasSpellOptions.value ) step.value--;
			}
		}

		// ── Create character ───────────────────────────────────────────────────
		async function createCharacter() {
			const err = validateStep( 6 );
			if ( err ) { formError.value = err; return; }
			submitting.value = true;
			formError.value  = '';

			try {
				const scores      = assignedScores.value;
				const chosenSkills = [ ...selectedClassSkills.value, ...selectedSpeciesSkills.value ];

				const result = await api( '/api/characters.bxm', {
					method : 'POST',
					body   : JSON.stringify( {
						name           : characterName.value.trim(),
						classId        : selectedClassId.value,
						str            : scores.str,
						dex            : scores.dex,
						con            : scores.con,
						int            : scores.int,
						wis            : scores.wis,
						cha            : scores.cha,
						species        : effectiveSpeciesName.value,
						background     : selectedBackground.value,
						alignment      : selectedAlignment.value,
						knownCantrip   : selectedCantripName.value,
						knownSpell     : selectedSpellName.value,
						choiceAbilities: selectedChoiceAbilities.value,
						classSkills    : chosenSkills,
						fightingStyle  : selectedFightingStyle.value
					} )
				} );

				createdCharacterId.value = result.id;
				localStorage.setItem( 'charId', result.id );
				createdSheet.value = await api( `/api/character.bxm?id=${ result.id }` );
			} catch ( e ) {
				formError.value = 'Failed to create character. Please try again.';
			} finally {
				submitting.value = false;
			}
		}

		function beginAdventure() {
			router.push( '/adventure' );
		}

		// ── Mount ──────────────────────────────────────────────────────────────
		onMounted( async () => {
			try {
				const [ cls, species, backgrounds ] = await Promise.all( [
					api( '/api/options/classes.bxm' ),
					api( '/api/options/species.bxm' ),
					api( '/api/options/backgrounds.bxm' )
				] );
				classes.value         = cls;
				speciesOptions.value  = species;
				backgroundOptions.value = backgrounds;
			} catch ( e ) {
				formError.value = 'Failed to load character creation data.';
			} finally {
				loading.value = false;
			}
		} );

		return {
			step, totalSteps, loading, submitting, formError,
			ABILITY_ORDER, ALIGNMENT_OPTIONS, ALL_SKILL_NAMES,
			classes, selectedClassId, selectedClass, selectedClassSkills, selectedFightingStyle,
			cantripOptions, spellOptions, selectedCantripName, selectedSpellName,
			speciesOptions, backgroundOptions,
			selectedSpecies, selectedSubrace, selectedSpeciesOption, selectedSpeciesDetail,
			selectedBackgroundDetail, selectedChoiceAbilities, selectedSpeciesSkills,
			choiceAbilityOptions, selectedBackground,
			standardArray, assignedScores, activeAbility,
			selectedAlignment,
			characterName, createdCharacterId, createdSheet,
			effectiveSpeciesName, hasSpellOptions, choicesSoFar,
			skillTooltip, speciesTooltip, abilityBonusSummary, describeSpellOption,
			selectClass, toggleClassSkill, selectFightingStyle,
			selectSpecies, selectSubrace, toggleChoiceAbility, toggleSpeciesSkill, selectBackground,
			selectAbilitySlot, assignScore, resetScores,
			selectAlignment,
			selectCantrip, selectSpell,
			nextStep, previousStep, createCharacter, beginAdventure
		};
	}
};
