const CharacterSheet = {
	template: `
		<div class="encounter">
			<div class="encounter-main">
				<template v-if="loading">
					<loading-veil label="Unfurling the character sheet..." />
				</template>

				<template v-else-if="error">
					<p class="encounter-intro">{{ error }}</p>
				</template>

				<template v-else-if="character.name">

					<div class="parchment-panel" style="margin-bottom:1rem;">
						<h2 class="fantasy-heading" style="margin:0 0 0.3rem;">{{ character.name }}</h2>
						<p class="stat-subtitle" style="margin:0;">
							<template v-if="character.classes && character.classes.length > 1">
								Level {{ character.totalLevel }} {{ character.species }}
								<template v-for="(cls,i) in character.classes" :key="cls.classId">{{ cls.className }} {{ cls.level }}<template v-if="i < character.classes.length - 1"> / </template></template>
							</template>
							<template v-else>
								Level {{ character.level }} {{ character.species }} {{ character.className }}
							</template>
							<template v-if="character.subclassName"> ({{ character.subclassName }})</template>
							<template v-if="character.background"> &bull; {{ character.background }}</template>
							<template v-if="character.alignment"> &bull; {{ character.alignment }}</template>
							&bull; {{ character.experiencePoints }} XP &bull; Hit Die: {{ character.hitDie }}
						</p>
					</div>

					<!-- Pending choices -->
					<div v-if="character.multiclassOptions && character.multiclassOptions.length" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Multiclass</h3>
						<p class="stat-subtitle" style="margin:0 0 0.5rem;">Your ability scores qualify you to multiclass into one of these. Pick one to queue your next level there.</p>
						<div class="creation-grid">
							<div v-for="opt in character.multiclassOptions" :key="opt.id"
								class="creation-card creation-card-compact"
								:title="'Requires ' + opt.primaryAbility + ' 13+'"
								@click="sheetAction('startMulticlass',{classId:opt.id})"
							>{{ opt.name }}</div>
						</div>
					</div>

					<div v-if="character.nextLevelOptions && character.nextLevelOptions.length > 1" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Next Level Goes To</h3>
						<div class="creation-grid">
							<div v-for="opt in character.nextLevelOptions" :key="opt.classId"
								:class="['creation-card','creation-card-compact', opt.classId === character.nextLevelClassId ? 'creation-card-selected' : '']"
								@click="sheetAction(opt.level === 0 ? 'startMulticlass' : 'setNextLevelClass', {classId:opt.classId})"
							>{{ opt.className }} {{ opt.level === 0 ? '(new)' : opt.level }}</div>
						</div>
					</div>

					<div v-if="character.subclassChoice && character.subclassChoice.pending" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Choose Your Subclass</h3>
						<div class="creation-grid">
							<div v-for="opt in character.subclassChoice.availableSubclasses" :key="opt.id"
								class="creation-card creation-card-compact"
								:title="opt.tagline"
								@click="sheetAction('chooseSubclass',{subclassId:opt.id})"
							>{{ opt.name }}</div>
						</div>
					</div>

					<div v-if="character.fightingStyleChoice && character.fightingStyleChoice.pending" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Choose Your Fighting Style</h3>
						<div class="creation-grid">
							<div v-for="style in character.fightingStyleChoice.availableStyles" :key="style"
								class="creation-card creation-card-compact"
								@click="sheetAction('chooseFightingStyle',{styleName:style})"
							>{{ style }}</div>
						</div>
					</div>

					<div v-if="cantripChoice.pending" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Learn a Cantrip</h3>
						<div class="creation-grid">
							<div v-for="opt in cantripChoice.availableCantrips" :key="opt.name"
								class="creation-card creation-card-compact"
								:title="describeSpell(opt)"
								@click="sheetAction('chooseCantrip',{cantripName:opt.name})"
							>{{ opt.name }}</div>
						</div>
					</div>

					<div v-if="spellChoice.pending" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Learn a Level {{ spellChoice.level }} Spell</h3>
						<div class="creation-grid">
							<div v-for="opt in spellChoice.availableSpells" :key="opt.name"
								class="creation-card creation-card-compact"
								:title="describeSpell(opt)"
								@click="sheetAction('chooseSpell',{spellName:opt.name})"
							>{{ opt.name }}</div>
						</div>
					</div>

					<div v-if="expertiseChoice.pending" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Choose Expertise</h3>
						<div class="creation-grid">
							<div v-for="skill in expertiseChoice.availableSkills" :key="skill"
								class="creation-card creation-card-compact"
								@click="sheetAction('chooseExpertise',{skillName:skill})"
							>{{ skill }}</div>
						</div>
					</div>

					<div v-if="magicInitiateChoice.pendingCantrips > 0" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Magic Initiate: Choose a Cantrip ({{ magicInitiateChoice.pendingCantrips }} remaining)</h3>
						<div class="creation-grid">
							<div v-for="opt in magicInitiateChoice.availableCantrips" :key="opt.name"
								class="creation-card creation-card-compact"
								:title="describeSpell(opt)"
								@click="sheetAction('chooseMagicInitiateCantrip',{cantripName:opt.name})"
							>{{ opt.name }}</div>
						</div>
					</div>

					<div v-if="magicInitiateChoice.pendingSpell" class="parchment-panel asi-panel" style="margin-bottom:1rem;">
						<h3 class="fantasy-heading" style="margin:0 0 0.3rem;">Magic Initiate: Choose a 1st-Level Spell</h3>
						<div class="creation-grid">
							<div v-for="opt in magicInitiateChoice.availableSpells" :key="opt.name"
								class="creation-card creation-card-compact"
								:title="describeSpell(opt)"
								@click="sheetAction('chooseMagicInitiateSpell',{spellName:opt.name})"
							>{{ opt.name }}</div>
						</div>
					</div>

					<!-- Ability scores -->
					<div class="ability-grid">
						<div v-for="abbr in ['str','dex','con','int','wis','cha']" :key="abbr" class="ability-box">
							<span class="ability-label">{{ abbr.toUpperCase() }}</span>
							<span class="ability-score">{{ character.abilityScores[abbr] }}</span>
							<span class="ability-mod">{{ modLabel(character.modifiers[abbr]) }}</span>
						</div>
					</div>

					<!-- Core stats -->
					<div class="core-stats-row">
						<div class="core-stat-box"><span class="core-stat-label">AC</span><span class="core-stat-value">{{ character.armorClass }}</span></div>
						<div class="core-stat-box"><span class="core-stat-label">Max HP</span><span class="core-stat-value">{{ character.maxHitPoints }}</span></div>
						<div class="core-stat-box"><span class="core-stat-label">Speed</span><span class="core-stat-value">{{ character.speed }} ft</span></div>
						<div class="core-stat-box"><span class="core-stat-label">Proficiency</span><span class="core-stat-value">+{{ character.proficiencyBonus }}</span></div>
						<div class="core-stat-box"><span class="core-stat-label">Gold</span><span class="core-stat-value">{{ character.gold }}</span></div>
					</div>

					<!-- Traits/features -->
					<div class="parchment-panel" style="margin-bottom:1rem;">
						<p class="stat-subtitle" style="margin:0 0 0.5rem;"><strong>Saving Throws:</strong> {{ (character.savingThrowProficiencies||[]).join(', ') }}</p>
						<template v-if="character.skillProficiencies && character.skillProficiencies.length">
							<p class="stat-subtitle" style="margin:0 0 0.4rem;"><strong>Skill Proficiencies</strong></p>
							<div class="sheet-features" style="margin-bottom:0.5rem;">
								<span v-for="skill in character.skillProficiencies" :key="skill" class="feature-chip">{{ skill }}<template v-if="character.expertiseSkills && character.expertiseSkills.includes(skill)">*</template></span>
							</div>
						</template>
						<template v-if="character.features && character.features.length">
							<p class="stat-subtitle" style="margin:0.75rem 0 0.4rem;"><strong>Features</strong></p>
							<div class="sheet-features">
								<span v-for="f in character.features" :key="f.name" class="feature-chip">Lv {{ f.level }} — {{ f.name }}</span>
							</div>
						</template>
						<template v-if="character.feats && character.feats.length">
							<p class="stat-subtitle" style="margin:0.75rem 0 0.4rem;"><strong>Feats</strong></p>
							<div class="sheet-features">
								<span v-for="feat in character.feats" :key="feat" class="feature-chip">{{ feat }}</span>
							</div>
						</template>
						<template v-if="character.speciesDetail && character.speciesDetail.traits && character.speciesDetail.traits.length">
							<p class="stat-subtitle" style="margin:0.75rem 0 0.4rem;"><strong>Species Traits</strong></p>
							<div class="sheet-features">
								<span v-for="t in character.speciesDetail.traits" :key="t.name" class="feature-chip" :title="t.description">{{ t.name }}</span>
							</div>
						</template>
					</div>

					<!-- Tabs -->
					<div class="sheet-tabs">
						<button v-for="t in availableTabs" :key="t.id" type="button"
							:class="['sheet-tab', tab === t.id ? 'sheet-tab-active' : '']"
							@click="tab = t.id; message = ''"
						>{{ t.label }}</button>
					</div>

					<!-- Weapons tab -->
					<div v-if="tab === 'weapons'" class="sheet-tab-panel">
						<div v-if="inventory.length === 0" class="stat-subtitle">No weapons in inventory.</div>
						<div v-for="item in inventory" :key="item.id" class="inventory-row">
							<span class="inventory-name">{{ item.weaponName }}<template v-if="item.equipped"> <span class="feature-chip" style="font-size:0.7rem;padding:0.1rem 0.45rem;">equipped</span></template></span>
							<span class="inventory-stat">{{ item.damageDice }} {{ item.damageType }}</span>
							<span class="inventory-stat">Atk {{ modLabel(item.attackBonus) }} / Dmg {{ modLabel(item.damageBonus) }}</span>
							<span class="inventory-stat" style="display:flex;gap:0.3rem;">
								<button type="button" :class="['btn', item.category === 'melee' ? 'btn-auto-battle' : '']" style="padding:0.15rem 0.5rem;font-size:0.75rem;" @click="inventoryMutate('setCategory',{inventoryId:item.id,category:'melee'})">Melee</button>
								<button type="button" :class="['btn', item.category === 'ranged' ? 'btn-auto-battle' : '']" style="padding:0.15rem 0.5rem;font-size:0.75rem;" @click="inventoryMutate('setCategory',{inventoryId:item.id,category:'ranged'})">Ranged</button>
							</span>
							<button type="button" class="btn" style="padding:0.15rem 0.5rem;font-size:0.75rem;" @click="inventoryMutate('equipWeapon',{inventoryId:item.id,equipped:!item.equipped})">{{ item.equipped ? 'Unequip' : 'Equip' }}</button>
							<button type="button" class="btn" style="padding:0.15rem 0.5rem;font-size:0.75rem;border-color:var(--blood);color:var(--blood);" @click="inventoryMutate('removeWeapon',{inventoryId:item.id})">Remove</button>
						</div>
						<div class="add-weapon-form">
							<label class="stat-subtitle">Add weapon
								<select v-model="addWeaponId" class="creation-input" style="margin:0.3rem 0 0;max-width:280px;">
									<option v-for="w in availableWeapons" :key="w.id" :value="w.id">{{ w.name }} ({{ w.damageDice }} {{ w.damageType }})</option>
								</select>
							</label>
							<label class="stat-subtitle">Slot
								<select v-model="addWeaponCategory" class="creation-input" style="margin:0.3rem 0 0;max-width:120px;">
									<option value="melee">Melee</option>
									<option value="ranged">Ranged</option>
								</select>
							</label>
							<button type="button" class="btn btn-attack" @click="addWeapon()">Add</button>
						</div>
					</div>

					<!-- Armor tab -->
					<div v-if="tab === 'armor'" class="sheet-tab-panel">
						<div v-if="armorInventory.length === 0" class="stat-subtitle">No armor in inventory.</div>
						<div v-for="item in armorInventory" :key="item.id" class="inventory-row">
							<span class="inventory-name">{{ item.armorName }}<template v-if="item.equipped"> <span class="feature-chip" style="font-size:0.7rem;padding:0.1rem 0.45rem;">equipped</span></template></span>
							<span class="inventory-stat">{{ capitalize(item.armorType) }} (AC {{ item.baseAc }})</span>
							<button type="button" class="btn" style="padding:0.15rem 0.5rem;font-size:0.75rem;" @click="inventoryMutate('equipArmor',{inventoryId:item.id,equipped:!item.equipped})">{{ item.equipped ? 'Unequip' : 'Equip' }}</button>
							<button type="button" class="btn" style="padding:0.15rem 0.5rem;font-size:0.75rem;border-color:var(--blood);color:var(--blood);" @click="inventoryMutate('removeArmor',{inventoryId:item.id})">Remove</button>
						</div>
						<div class="add-weapon-form">
							<label class="stat-subtitle">Add armor
								<select v-model="addArmorId" class="creation-input" style="margin:0.3rem 0 0;max-width:280px;">
									<option v-for="a in availableArmors" :key="a.id" :value="a.id">{{ a.name }} (AC {{ a.baseAc }})</option>
								</select>
							</label>
							<button type="button" class="btn btn-attack" @click="inventoryMutate('addArmor',{armorId:addArmorId})">Add</button>
						</div>
					</div>

					<!-- Items tab -->
					<div v-if="tab === 'items'" class="sheet-tab-panel">
						<div v-if="itemInventory.length === 0" class="stat-subtitle">No items in inventory.</div>
						<div v-for="item in itemInventory" :key="item.id" class="inventory-row">
							<span class="inventory-name">{{ item.itemName }} &times;{{ item.quantity }}</span>
							<span class="inventory-stat">{{ item.itemType }}</span>
							<span class="inventory-stat">{{ item.description }}</span>
							<button type="button" class="btn" style="padding:0.15rem 0.5rem;font-size:0.75rem;border-color:var(--blood);color:var(--blood);" @click="inventoryMutate('removeItem',{inventoryId:item.id})">Remove</button>
						</div>
						<div class="add-weapon-form">
							<label class="stat-subtitle">Add item
								<select v-model="addItemId" class="creation-input" style="margin:0.3rem 0 0;max-width:280px;">
									<option v-for="it in availableItems" :key="it.id" :value="it.id">{{ it.name }} ({{ it.itemType }})</option>
								</select>
							</label>
							<label class="stat-subtitle">Qty
								<input v-model.number="addItemQuantity" type="number" class="creation-input" min="1" style="margin:0.3rem 0 0;max-width:80px;">
							</label>
							<button type="button" class="btn btn-attack" @click="addItem()">Add</button>
						</div>
					</div>

					<!-- Spells tab -->
					<div v-if="tab === 'spells'" class="sheet-tab-panel">
						<template v-if="(character.knownCantripNames && character.knownCantripNames.length) || (character.knownSpellNames && character.knownSpellNames.length)">
							<h3 class="fantasy-heading">Known Spells</h3>
							<p class="stat-subtitle" style="margin:0 0 0.75rem;">
								<template v-if="character.knownCantripNames && character.knownCantripNames.length">Cantrips: {{ character.knownCantripNames.join(', ') }}<br></template>
								<template v-if="character.knownSpellNames && character.knownSpellNames.length">Spells: {{ character.knownSpellNames.join(', ') }}</template>
							</p>
						</template>
						<template v-if="cantripOptions.length">
							<h3 class="fantasy-heading">Starting Cantrip</h3>
							<div class="creation-grid">
								<div v-for="opt in cantripOptions" :key="opt.name"
									:class="['creation-card', selectedCantripName === opt.name ? 'creation-card-selected' : '']"
									@click="selectedCantripName = opt.name"
								>
									<h4 class="fantasy-heading" style="margin:0 0 0.25rem;">{{ opt.name }}</h4>
									<p class="stat-subtitle" style="margin:0;">{{ describeSpell(opt) }}</p>
								</div>
							</div>
						</template>
						<template v-if="spellOptions.length">
							<h3 class="fantasy-heading">Starting 1st-Level Spell</h3>
							<div class="creation-grid">
								<div v-for="opt in spellOptions" :key="opt.name"
									:class="['creation-card', selectedSpellName === opt.name ? 'creation-card-selected' : '']"
									@click="selectedSpellName = opt.name"
								>
									<h4 class="fantasy-heading" style="margin:0 0 0.25rem;">{{ opt.name }}</h4>
									<p class="stat-subtitle" style="margin:0;">{{ describeSpell(opt) }}</p>
								</div>
							</div>
						</template>
						<div v-if="cantripOptions.length || spellOptions.length" class="turn-actions">
							<button type="button" class="btn btn-attack" @click="saveSpells()">Save Spell Choices</button>
						</div>
					</div>

					<p v-if="message" class="sheet-message">{{ message }}</p>

				</template>

				<div class="turn-actions" style="margin-top:1.5rem;">
					<router-link class="btn" to="/">Back to Character Select</router-link>
					<router-link class="btn btn-auto-battle" to="/adventure">Adventure</router-link>
				</div>
			</div>
		</div>
	`,
	setup() {
		const { ref, computed, onMounted, inject } = Vue;
		const apiCall = inject( "api" );
		const router  = VueRouter.useRouter();

		const loading    = ref( true );
		const error      = ref( "" );
		const character  = ref( {} );
		const inventory     = ref( [] );
		const armorInventory = ref( [] );
		const itemInventory  = ref( [] );
		const availableWeapons = ref( [] );
		const availableArmors  = ref( [] );
		const availableItems   = ref( [] );
		const cantripOptions   = ref( [] );
		const spellOptions     = ref( [] );
		const cantripChoice    = ref( { pending: false, availableCantrips: [] } );
		const spellChoice      = ref( { pending: false, availableSpells: [], level: 0 } );
		const expertiseChoice  = ref( { pending: false, availableSkills: [] } );
		const magicInitiateChoice = ref( { pendingCantrips: 0, availableCantrips: [], pendingSpell: false, availableSpells: [] } );

		const tab               = ref( "weapons" );
		const message           = ref( "" );
		const addWeaponId       = ref( "" );
		const addWeaponCategory = ref( "melee" );
		const addArmorId        = ref( "" );
		const addItemId         = ref( "" );
		const addItemQuantity   = ref( 1 );
		const selectedCantripName = ref( "" );
		const selectedSpellName   = ref( "" );

		const availableTabs = computed( () => {
			const tabs = [
				{ id: "weapons", label: "Weapons" },
				{ id: "armor",   label: "Armor" },
				{ id: "items",   label: "Items" }
			];
			if ( cantripOptions.value.length || spellOptions.value.length ) {
				tabs.push( { id: "spells", label: "Spells" } );
			}
			return tabs;
		} );

		async function loadSheet() {
			const charId = localStorage.getItem( "charId" );
			if ( !charId ) {
				router.push( "/" );
				return;
			}
			try {
				const data = await apiCall( `/api/sheet.bxm?id=${ charId }` );
				applySheetData( data );
				selectedCantripName.value = character.value.knownCantripName ?? "";
				selectedSpellName.value   = character.value.knownSpellName   ?? "";
			} catch ( e ) {
				error.value = "Could not load character sheet.";
			} finally {
				loading.value = false;
			}
		}

		function applySheetData( data ) {
			character.value      = data.character;
			inventory.value      = data.inventory         ?? [];
			armorInventory.value = data.armorInventory    ?? [];
			itemInventory.value  = data.itemInventory     ?? [];
			availableWeapons.value = data.availableWeapons ?? [];
			availableArmors.value  = data.availableArmors  ?? [];
			availableItems.value   = data.availableItems   ?? [];
			cantripOptions.value   = data.cantripOptions   ?? [];
			spellOptions.value     = data.spellOptions     ?? [];
			cantripChoice.value    = data.cantripChoice    ?? { pending: false, availableCantrips: [] };
			spellChoice.value      = data.spellChoice      ?? { pending: false, availableSpells: [], level: 0 };
			expertiseChoice.value  = data.expertiseChoice  ?? { pending: false, availableSkills: [] };
			magicInitiateChoice.value = data.magicInitiateChoice ?? { pendingCantrips: 0, availableCantrips: [], pendingSpell: false, availableSpells: [] };
			if ( availableWeapons.value.length && !addWeaponId.value ) addWeaponId.value = availableWeapons.value[0].id;
			if ( availableArmors.value.length  && !addArmorId.value  ) addArmorId.value  = availableArmors.value[0].id;
			if ( availableItems.value.length   && !addItemId.value   ) addItemId.value   = availableItems.value[0].id;
		}

		function applyInventoryUpdate( data ) {
			character.value      = data.character;
			inventory.value      = data.inventory      ?? [];
			armorInventory.value = data.armorInventory ?? [];
			itemInventory.value  = data.itemInventory  ?? [];
		}

		async function sheetAction( action, extra = {} ) {
			const charId = localStorage.getItem( "charId" );
			try {
				const data = await apiCall( "/api/sheet.bxm", {
					method: "PUT",
					body: JSON.stringify( { charId, action, ...extra } )
				} );
				applyInventoryUpdate( data );
				message.value = "";
				await loadSheet();
			} catch ( e ) {
				message.value = "Action failed.";
			}
		}

		async function inventoryMutate( action, extra = {} ) {
			const charId = localStorage.getItem( "charId" );
			try {
				const data = await apiCall( "/api/sheet.bxm", {
					method: "PUT",
					body: JSON.stringify( { charId, action, ...extra } )
				} );
				applyInventoryUpdate( data );
				message.value = action.includes( "remove" ) ? "Removed." : "Updated.";
			} catch ( e ) {
				message.value = "Action failed.";
			}
		}

		async function addWeapon() {
			if ( !addWeaponId.value ) return;
			const charId = localStorage.getItem( "charId" );
			const data = await apiCall( "/api/sheet.bxm", {
				method: "PUT",
				body: JSON.stringify( { charId, action: "addWeapon", weaponId: addWeaponId.value, category: addWeaponCategory.value } )
			} );
			applyInventoryUpdate( data );
			message.value = "Weapon added.";
		}

		async function addItem() {
			if ( !addItemId.value ) return;
			const charId = localStorage.getItem( "charId" );
			const data = await apiCall( "/api/sheet.bxm", {
				method: "PUT",
				body: JSON.stringify( { charId, action: "addItem", itemId: addItemId.value, quantity: addItemQuantity.value } )
			} );
			applyInventoryUpdate( data );
			message.value = "Item added.";
		}

		async function saveSpells() {
			const charId = localStorage.getItem( "charId" );
			const data = await apiCall( "/api/sheet.bxm", {
				method: "PUT",
				body: JSON.stringify( { charId, action: "saveSpells", cantripName: selectedCantripName.value, spellName: selectedSpellName.value } )
			} );
			applyInventoryUpdate( data );
			message.value = "Spell choices saved.";
		}

		function modLabel( mod ) {
			return mod >= 0 ? `+${ mod }` : `${ mod }`;
		}

		function capitalize( s ) {
			return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
		}

		function describeSpell( spell ) {
			if ( spell.type === "heal" ) return `Heal — ${ spell.diceCount }d${ spell.diceSides }`;
			if ( spell.type === "attack" ) return `Attack — ${ spell.diceCount }d${ spell.diceSides } ${ spell.damageType }`;
			return `Save (${ (spell.saveAbility||"").toUpperCase() }) — ${ spell.diceCount }d${ spell.diceSides } ${ spell.damageType }`;
		}

		onMounted( loadSheet );

		return {
			loading, error, character, inventory, armorInventory, itemInventory,
			availableWeapons, availableArmors, availableItems,
			cantripOptions, spellOptions, cantripChoice, spellChoice, expertiseChoice, magicInitiateChoice,
			tab, message, addWeaponId, addWeaponCategory, addArmorId, addItemId, addItemQuantity,
			selectedCantripName, selectedSpellName, availableTabs,
			sheetAction, inventoryMutate, addWeapon, addItem, saveSpells, modLabel, capitalize, describeSpell
		};
	}
};
