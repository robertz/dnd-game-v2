const { createApp, reactive, ref, computed, onMounted, inject } = Vue;
const { createRouter, createWebHistory } = VueRouter;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function api( path, options = {} ) {
	const res = await fetch( path, {
		headers: { "Content-Type": "application/json" },
		...options
	} );
	if ( res.status === 401 && path !== "/api/auth.bxm" ) {
		window.location.href = "/login";
		throw new Error( `API error 401 on ${ path }` );
	}
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
							:class="{ 'char-card-party-selected': isInParty( character.id ) }"
							@click="selectCharacter( character.id )"
						>
							<label class="char-card-party-toggle" :title="'Add ' + character.name + ' to the party'" @click.stop>
								<input
									type="checkbox"
									:checked="isInParty( character.id )"
									:disabled="!isInParty( character.id ) && party.length >= 4"
									@change="togglePartyMember( character.id )"
								>
								Bring on adventure
							</label>
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

							<div class="char-card-stats char-battle-record">
								<span><strong>Fought</strong> {{ character.monstersFought }}</span>
								<span><strong>Kills</strong> {{ character.monstersKilled }}</span>
								<span v-if="character.deaths > 0"><strong>Deaths</strong> {{ character.deaths }}</span>
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
								<button type="button" class="btn btn-sm btn-attack" @click.stop="playCharacter( character.id )">Adventure Solo</button>
							</div>
						</div>
					</div>
				</template>

				<div class="turn-actions">
					<router-link class="btn btn-auto-battle" to="/character/new">Create New Character</router-link>
					<button
						v-if="party.length > 0"
						type="button"
						class="btn btn-attack"
						@click="startPartyAdventure"
					>Start Adventure with Party ({{ party.length }}/4)</button>
				</div>
			</div>
		</div>
	`,
	setup() {
		const router     = VueRouter.useRouter();
		const characters = ref( [] );
		const loading    = ref( true );
		const error      = ref( "" );
		const party      = ref( [] );

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
			localStorage.setItem( "partyCharIds", JSON.stringify( [ id ] ) );
			router.push( "/adventure" );
		}

		function isInParty( id ) {
			return party.value.includes( id );
		}

		function togglePartyMember( id ) {
			const idx = party.value.indexOf( id );
			if ( idx !== -1 ) {
				party.value.splice( idx, 1 );
			} else if ( party.value.length < 4 ) {
				party.value.push( id );
			}
		}

		function startPartyAdventure() {
			if ( party.value.length === 0 ) return;
			localStorage.setItem( "charId", party.value[ 0 ] );
			localStorage.setItem( "partyCharIds", JSON.stringify( party.value ) );
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

		return {
			characters, loading, error, party, selectCharacter, playCharacter,
			isInParty, togglePartyMember, startPartyAdventure,
			abilityMod, hpPercent, xpPercent, abilityOrder
		};
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
		{ path: "/login",           component: Auth },
		{ path: "/character/new",   component: CharacterCreation },
		{ path: "/character/sheet", component: CharacterSheet },
		{ path: "/adventure",       component: ModuleSelect },
		{ path: "/combat",          component: CombatEncounter },
		{ path: "/map-editor",      component: MapEditor }
	]
} );

// ── WebSocket ─────────────────────────────────────────────────────────────────

// Thin facade over a WebSocket that reconnects with exponential backoff when
// the connection drops (laptop sleep, server restart) — otherwise every combat
// button silently dies with the socket. Components hold this stable object;
// message listeners are re-attached to each new underlying connection.
function createReconnectingSocket( url ) {
	let ws = null;
	let attempts = 0;
	const messageListeners = new Set();

	function connect() {
		ws = new WebSocket( url );
		ws.onopen  = () => { attempts = 0; console.log( "SocketBox connected" ); };
		ws.onerror = ( err ) => console.error( "SocketBox error", err );
		ws.onclose = () => {
			const delay = Math.min( 30000, 1000 * 2 ** attempts++ );
			console.log( `SocketBox closed — reconnecting in ${ delay }ms` );
			setTimeout( connect, delay );
		};
		messageListeners.forEach( ( fn ) => ws.addEventListener( "message", fn ) );
	}

	connect();

	return {
		addEventListener( type, fn ) {
			if ( type === "message" ) messageListeners.add( fn );
			ws.addEventListener( type, fn );
		},
		removeEventListener( type, fn ) {
			messageListeners.delete( fn );
			ws.removeEventListener( type, fn );
		},
		send( data ) {
			if ( ws.readyState === WebSocket.OPEN ) ws.send( data );
		}
	};
}

const socket = createReconnectingSocket( "/ws" );

// ── Shared game state (combat encounter fills this in) ────────────────────────

const gameState = reactive( {
	player:                {},
	players:               [],
	activePlayerIndex:     1,
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

const currentUser = ref( null );

// ── Root layout ───────────────────────────────────────────────────────────────

const App = {
	template: `
		<header class="site-header">
			<h1 class="fantasy-heading site-title">The Adventure Begins</h1>
			<button
				type="button"
				class="nav-toggle"
				:class="{ 'nav-toggle-open': mobileNavOpen }"
				:aria-expanded="mobileNavOpen"
				aria-label="Toggle navigation"
				@click="mobileNavOpen = !mobileNavOpen"
			><span></span><span></span><span></span></button>
			<nav class="site-nav" :class="{ 'site-nav-open': mobileNavOpen }">
				<router-link to="/"              :class="{ 'site-nav-active': route.path === '/' }">Character Select</router-link>
				<router-link to="/character/new" :class="{ 'site-nav-active': route.path === '/character/new' }">Create Character</router-link>
				<template v-if="hasCharacter">
					<router-link to="/character/sheet" :class="{ 'site-nav-active': route.path === '/character/sheet' }">Character Sheet</router-link>
					<router-link to="/adventure"       :class="{ 'site-nav-active': route.path === '/adventure' }">Adventure</router-link>
				</template>
				<router-link to="/map-editor" class="site-nav-desktop-only" :class="{ 'site-nav-active': route.path === '/map-editor' }">Map Editor</router-link>
				<template v-if="currentUser">
					<span class="site-nav-avatar" :title="currentUser.username">{{ currentUser.username.charAt(0).toUpperCase() }}</span>
					<a href="#" @click.prevent="logout">Log Out</a>
				</template>
				<router-link v-else to="/login" :class="{ 'site-nav-active': route.path === '/login' }">Sign In</router-link>
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
		const router       = VueRouter.useRouter();
		// localStorage isn't reactive, so a computed over it evaluates once and
		// never updates — re-check on every navigation instead, so the nav
		// links appear as soon as a first character is picked.
		const hasCharacter = ref( !!localStorage.getItem( "charId" ) );
		const mobileNavOpen = ref( false );

		// Collapse the mobile menu on every navigation instead of requiring
		// a close handler on each individual link/router-link.
		Vue.watch( () => route.path, () => {
			mobileNavOpen.value = false;
			hasCharacter.value  = !!localStorage.getItem( "charId" );
		} );

		onMounted( async () => {
			const result = await api( "/api/auth.bxm" );
			currentUser.value = result.userId ? result : null;
		} );

		async function logout() {
			await api( "/api/auth.bxm", { method: "POST", body: JSON.stringify( { action: "logout" } ) } );
			currentUser.value = null;
			router.push( "/login" );
		}

		return { route, hasCharacter, currentUser, mobileNavOpen, logout };
	}
};

// ── App ───────────────────────────────────────────────────────────────────────

createApp( App )
	.component( "loading-veil", LoadingVeil )
	.use( router )
	.provide( "socket", socket )
	.provide( "gameState", gameState )
	.provide( "api", api )
	.provide( "setCurrentUser", ( u ) => { currentUser.value = u; } )
	.mount( "#app" );
