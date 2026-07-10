const { createApp, reactive, ref, computed, onMounted, inject } = Vue;
const { createRouter, createWebHistory } = VueRouter;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function api( path, options = {} ) {
	const res = await fetch( path, {
		headers: { "Content-Type": "application/json" },
		...options
	} );
	if ( !res.ok ) throw new Error( `API error ${ res.status } on ${ path }` );
	return res.json();
}

// ── LoadingVeil (shared spinner for any page still fetching) ─────────────────

const LoadingVeil = {
	props: [ "label" ],
	template: `
		<div class="loading-veil">
			<div class="loading-spinner"><span class="loading-spinner-icon">⚔</span></div>
			<p class="encounter-intro">{{ label || "Loading..." }}</p>
		</div>
	`
};

// ── CharacterSelect (inline — simple enough to not need a separate file) ─────

const CharacterSelect = {
	template: `
		<div class="encounter">
			<div class="encounter-main">
				<h1 class="fantasy-heading">Choose Your Hero</h1>

				<template v-if="loading">
					<loading-veil label="Summoning adventurers..." />
				</template>

				<template v-else-if="error">
					<p class="encounter-intro">{{ error }}</p>
				</template>

				<template v-else-if="characters.length === 0">
					<p class="encounter-intro">No adventurers yet — create one to begin.</p>
				</template>

				<template v-else>
					<div class="char-select-grid">
						<div
							v-for="character in characters"
							:key="character.id"
							class="creation-card char-card"
							@click="selectCharacter( character.id )"
						>
							<div class="char-card-header">
								<h3 class="fantasy-heading">{{ character.name }}</h3>
								<span class="char-level-badge">Lv {{ character.level }}</span>
							</div>
							<p class="stat-subtitle">
								{{ character.species }} {{ character.className }}
								<template v-if="character.background"> · {{ character.background }}</template>
								<template v-if="character.alignment"> · {{ character.alignment }}</template>
							</p>

							<div class="hp-bar" :title="'HP ' + character.hitPoints + '/' + character.maxHitPoints">
								<div class="hp-bar-fill" :style="{ width: hpPercent( character ) + '%' }"></div>
							</div>

							<div class="char-card-stats">
								<span><strong>HP</strong> {{ character.hitPoints }}/{{ character.maxHitPoints }}</span>
								<span><strong>AC</strong> {{ character.armorClass }}</span>
								<span><strong>Spd</strong> {{ character.speed }} ft.</span>
								<span><strong>PB</strong> +{{ character.proficiencyBonus }}</span>
								<span><strong>Gold</strong> {{ character.gold }}</span>
							</div>

							<div class="ability-row">
								<span v-for="ab in abilityOrder" :key="ab" class="ability-chip">
									<span class="ability-chip-label">{{ ab.toUpperCase() }}</span>
									{{ character.abilities[ab] }} ({{ abilityMod( character.abilities[ab] ) }})
								</span>
							</div>

							<div class="xp-row" v-if="character.nextLevelXp > 0">
								<div class="xp-bar" :title="character.experiencePoints + ' / ' + character.nextLevelXp + ' XP'">
									<div class="xp-bar-fill" :style="{ width: xpPercent( character ) + '%' }"></div>
								</div>
								<span class="stat-subtitle xp-label">{{ character.experiencePoints }} / {{ character.nextLevelXp }} XP</span>
							</div>
							<p v-else class="stat-subtitle xp-label">Max level · {{ character.experiencePoints }} XP</p>

							<div class="char-card-footer">
								<span class="stat-subtitle" v-if="character.lastPlayed">Last played {{ character.lastPlayed }}</span>
								<button type="button" class="btn btn-sm btn-attack" @click.stop="playCharacter( character.id )">Adventure</button>
							</div>
						</div>
					</div>
				</template>

				<div class="turn-actions">
					<router-link class="btn btn-auto-battle" to="/character/new">Create New Character</router-link>
				</div>
			</div>
		</div>
	`,
	setup() {
		const router     = VueRouter.useRouter();
		const characters = ref( [] );
		const loading    = ref( true );
		const error      = ref( "" );

		onMounted( async () => {
			try {
				characters.value = await api( "/api/characters.bxm" );
			} catch ( e ) {
				error.value = "Could not load characters. Is the server running?";
			} finally {
				loading.value = false;
			}
		} );

		function selectCharacter( id ) {
			localStorage.setItem( "charId", id );
			router.push( "/character/sheet" );
		}

		function playCharacter( id ) {
			localStorage.setItem( "charId", id );
			router.push( "/adventure" );
		}

		function abilityMod( score ) {
			const mod = Math.floor( ( score - 10 ) / 2 );
			return ( mod >= 0 ? "+" : "" ) + mod;
		}

		function hpPercent( c ) {
			if ( !c.maxHitPoints ) return 0;
			return Math.max( 0, Math.min( 100, c.hitPoints / c.maxHitPoints * 100 ) );
		}

		function xpPercent( c ) {
			const span = c.nextLevelXp - c.currentLevelXp;
			if ( span <= 0 ) return 100;
			return Math.max( 0, Math.min( 100, ( c.experiencePoints - c.currentLevelXp ) / span * 100 ) );
		}

		const abilityOrder = [ "str", "dex", "con", "int", "wis", "cha" ];

		return { characters, loading, error, selectCharacter, playCharacter, abilityMod, hpPercent, xpPercent, abilityOrder };
	}
};

// CharacterCreation loaded from /assets/components/CharacterCreation.js
// CharacterSheet    loaded from /assets/components/CharacterSheet.js
// ModuleSelect      loaded from /assets/components/ModuleSelect.js
// CombatEncounter   loaded from /assets/components/CombatEncounter.js
// MapEditor         loaded from /assets/components/MapEditor.js

// ── Router ────────────────────────────────────────────────────────────────────

const router = createRouter( {
	history: createWebHistory(),
	routes: [
		{ path: "/",                component: CharacterSelect },
		{ path: "/character/new",   component: CharacterCreation },
		{ path: "/character/sheet", component: CharacterSheet },
		{ path: "/adventure",       component: ModuleSelect },
		{ path: "/combat",          component: CombatEncounter },
		{ path: "/map-editor",      component: MapEditor }
	]
} );

// ── WebSocket ─────────────────────────────────────────────────────────────────

const socket = new WebSocket( "/ws" );

socket.onopen  = () => console.log( "SocketBox connected" );
socket.onerror = ( err ) => console.error( "SocketBox error", err );
socket.onclose = () => console.log( "SocketBox closed" );

// ── Shared game state (combat encounter fills this in) ────────────────────────

const gameState = reactive( {
	player:                {},
	opponents:             [],
	items:                 [],
	currentTurn:           "player",
	round:                 1,
	movementRemaining:     6,
	actionUsed:            false,
	bonusActionUsed:       false,
	attacksUsedThisTurn:   0,
	gameOver:              false,
	outcome:               "",
	log:                   [],
	initiativeRolled:      false,
	selectedOpponentIndex: 1,
	autoBattling:          false,
	gridPois:              [],
	asiMode:               "single",
	asiAbility1:           "str",
	asiAbility2:           "dex",
	asiSelectedFeat:       "",
	asiSelectedSkills:     []
} );

// ── Root layout ───────────────────────────────────────────────────────────────

const App = {
	template: `
		<header class="site-header">
			<h1 class="fantasy-heading site-title">The Adventure Begins</h1>
			<nav class="site-nav">
				<router-link to="/"              :class="{ 'site-nav-active': route.path === '/' }">Character Select</router-link>
				<router-link to="/character/new" :class="{ 'site-nav-active': route.path === '/character/new' }">Create Character</router-link>
				<template v-if="hasCharacter">
					<router-link to="/character/sheet" :class="{ 'site-nav-active': route.path === '/character/sheet' }">Character Sheet</router-link>
					<router-link to="/adventure"       :class="{ 'site-nav-active': route.path === '/adventure' }">Adventure</router-link>
				</template>
				<router-link to="/map-editor" :class="{ 'site-nav-active': route.path === '/map-editor' }">Map Editor</router-link>
			</nav>
		</header>
		<main class="scroll">
			<div class="parchment-panel">
				<router-view v-slot="{ Component }">
					<transition name="page-fade" mode="out-in">
						<component :is="Component" />
					</transition>
				</router-view>
			</div>
		</main>
	`,
	setup() {
		const route        = VueRouter.useRoute();
		const hasCharacter = Vue.computed( () => !!localStorage.getItem( "charId" ) );
		return { route, hasCharacter };
	}
};

// ── App ───────────────────────────────────────────────────────────────────────

createApp( App )
	.component( "loading-veil", LoadingVeil )
	.use( router )
	.provide( "socket", socket )
	.provide( "gameState", gameState )
	.provide( "api", api )
	.mount( "#app" );
