const { createApp, reactive, ref, computed, onMounted, onUnmounted, inject } = Vue;
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
	if ( !res.ok ) {
		// Prefer the server's own {"error": "..."} body text over a bare
		// status code — mapeditor.bxm's 403 ("You don't own this module")
		// and similar handlers give callers something actionable to show
		// the user instead of a generic "API error 403" they'd have to
		// translate themselves.
		let detail = "";
		try {
			detail = ( await res.clone().json() ).error ?? "";
		} catch ( e ) { /* body wasn't JSON — fall back to the bare status */ }
		const err = new Error( detail || `API error ${ res.status } on ${ path }` );
		err.status = res.status;
		throw err;
	}
	return res.json();
}

// ── Shared party state (standing adventuring party, persisted server-side) ───

// Populated once per login (see App's onMounted / setCurrentUser below) and
// shared by CharacterSelect and PartyToolbar so both reflect the same saved
// party without either owning a separate copy.
const partyState = reactive( { members: [], loaded: false } );

async function loadParty() {
	partyState.members = await api( "/api/party.bxm" );
	partyState.loaded = true;
}

async function saveParty( characterIds ) {
	partyState.members = await api( "/api/party.bxm", {
		method: "POST",
		body: JSON.stringify( { characterIds } )
	} );
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
				<template v-if="loading">
					<h1 class="fantasy-heading">Choose Your Hero</h1>
					<loading-veil label="Summoning adventurers..." />
				</template>

				<template v-else-if="error">
					<h1 class="fantasy-heading">Choose Your Hero</h1>
					<p class="encounter-intro">{{ error }}</p>
				</template>

				<template v-else-if="characters.length === 0">
					<h1 class="fantasy-heading">Choose Your Hero</h1>
					<p class="encounter-intro">No adventurers yet — create one to begin.</p>
					<div class="turn-actions">
						<router-link class="btn btn-auto-battle" to="/character/new">Create New Character</router-link>
					</div>
				</template>

				<!-- Party already set — lead with "go play," not the full roster grid;
				     "Manage Party" is the escape hatch back into it. -->
				<template v-else-if="!managingParty && party.length > 0">
					<h1 class="fantasy-heading">Ready to Adventure</h1>
					<div class="party-continue-grid">
						<div v-for="member in partyState.members" :key="member.id" class="creation-card party-continue-card">
							<h3 class="fantasy-heading">{{ member.name }}</h3>
							<p class="stat-subtitle">Lv {{ member.level }} {{ member.className }}</p>
							<div class="hp-bar" :title="'HP ' + member.hitPoints + '/' + member.maxHitPoints">
								<div class="hp-bar-fill" :style="{ width: hpPercent( member ) + '%' }"></div>
							</div>
							<span class="stat-subtitle">HP {{ member.hitPoints }}/{{ member.maxHitPoints }}</span>
						</div>
					</div>
					<div class="turn-actions">
						<button type="button" class="btn" @click="managingParty = true">Manage Party</button>
						<button type="button" class="btn btn-attack" @click="startPartyAdventure">Start Adventure ({{ party.length }}/4)</button>
					</div>
				</template>

				<template v-else>
					<h1 class="fantasy-heading">Choose Your Hero</h1>
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
								<button
									type="button"
									class="char-card-delete"
									title="Delete character"
									aria-label="Delete character"
									@click.stop="deleteCharacter( character )"
								>&times;</button>
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
					<div class="turn-actions">
						<router-link class="btn btn-auto-battle" to="/character/new">Create New Character</router-link>
						<button
							v-if="party.length > 0"
							type="button"
							class="btn btn-attack"
							@click="managingParty = false"
						>Done — Continue ({{ party.length }}/4)</button>
					</div>
				</template>
			</div>
		</div>
	`,
	setup() {
		const router     = VueRouter.useRouter();
		const characters = ref( [] );
		const loading    = ref( true );
		const error      = ref( "" );
		// Starts false so a returning user with a saved party lands on the
		// "Ready to Adventure" summary instead of the full roster grid; set
		// true by "Manage Party" and back to false by "Done — Continue".
		const managingParty = ref( false );
		// Read-through view of the shared, server-persisted partyState — kept
		// as a plain id array here since that's what isInParty()/toggle/start
		// already work with, and what localStorage.partyCharIds expects.
		const party = computed( () => partyState.members.map( ( m ) => m.id ) );

		onMounted( async () => {
			try {
				characters.value = await api( "/api/characters.bxm" );
				if ( !partyState.loaded ) await loadParty();
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

		async function playCharacter( id ) {
			localStorage.setItem( "charId", id );
			localStorage.setItem( "partyCharIds", JSON.stringify( [ id ] ) );
			// Soloing replaces the standing party with just this character,
			// same as picking party members does — the saved party is meant
			// to always be "who I'm currently adventuring with," so this
			// keeps the toolbar and Character Select in sync with what's
			// actually about to happen instead of silently diverging from it.
			await saveParty( [ id ] );
			router.push( "/adventure" );
		}

		async function deleteCharacter( character ) {
			if ( !window.confirm( `Delete ${ character.name }? This can't be undone.` ) ) return;
			await api( `/api/characters.bxm?id=${ character.id }`, { method: "DELETE" } );
			characters.value = characters.value.filter( ( c ) => c.id !== character.id );
			// party_members cascades server-side on character delete (see
			// db/schema.sql fk_party_character) — refetch rather than guess
			// at the resulting order.
			if ( isInParty( character.id ) ) await loadParty();
			if ( localStorage.getItem( "charId" ) == character.id ) {
				localStorage.removeItem( "charId" );
			}
		}

		function isInParty( id ) {
			return party.value.includes( id );
		}

		async function togglePartyMember( id ) {
			const ids = party.value.slice();
			const idx = ids.indexOf( id );
			if ( idx !== -1 ) {
				ids.splice( idx, 1 );
			} else if ( ids.length < 4 ) {
				ids.push( id );
			}
			await saveParty( ids );
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
			characters, loading, error, party, partyState, managingParty,
			selectCharacter, playCharacter, deleteCharacter, isInParty,
			togglePartyMember, startPartyAdventure,
			abilityMod, hpPercent, xpPercent, abilityOrder
		};
	}
};

// CharacterCreation loaded from /assets/components/CharacterCreation.js
// CharacterSheet    loaded from /assets/components/CharacterSheet.js
// ModuleSelect      loaded from /assets/components/ModuleSelect.js
// CombatEncounter   loaded from /assets/components/CombatEncounter.js
// MapEditor         loaded from /assets/components/MapEditor.js
// PartyToolbar      loaded from /assets/components/PartyToolbar.js

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
	// Combat actions (move/attack/rest/...) route through send() with no
	// optimistic UI update — a send that silently drops because the socket
	// isn't OPEN yet (the combat view renders from an HTTP fetch, so a click
	// can easily land before the WS handshake finishes) looks exactly like
	// "nothing is clickable," with no error and no visual feedback at all.
	// Queue instead, and flush once the connection (re)opens.
	const sendQueue = [];
	const MAX_QUEUED = 20;

	function connect() {
		ws = new WebSocket( url );
		ws.onopen  = () => {
			attempts = 0;
			console.log( "SocketBox connected" );
			while ( sendQueue.length && ws.readyState === WebSocket.OPEN ) {
				ws.send( sendQueue.shift() );
			}
		};
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
			if ( ws.readyState === WebSocket.OPEN ) {
				ws.send( data );
				return;
			}
			sendQueue.push( data );
			// Bound the queue so a long-dead connection can't replay a huge
			// backlog of stale clicks once it eventually reconnects — drop the
			// oldest first, keeping the most recent (most likely still-relevant) actions.
			if ( sendQueue.length > MAX_QUEUED ) sendQueue.shift();
		},
		// The server binds a connection to whatever session.userId existed at
		// WS handshake time (see WebSocket.bx onConnect) — and login rotates
		// the session ID on top of that. A socket opened on the login screen
		// is therefore permanently anonymous: every combat action bounces off
		// the encounter-ownership check as "Unauthorized" and the whole UI
		// looks frozen until a page reload. Auth.js calls this right after a
		// successful login/register so the connection is re-established under
		// the authenticated session, without the backoff delay a real drop gets.
		reconnect() {
			attempts = 0;
			const old = ws;
			old.onclose = null;
			try { old.close(); } catch ( e ) { /* already closed */ }
			connect();
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
				<template v-if="hasCharacter">
					<router-link to="/character/sheet" :class="{ 'site-nav-active': route.path === '/character/sheet' }">Character Sheet</router-link>
					<router-link to="/adventure"       :class="{ 'site-nav-active': route.path === '/adventure' }">Adventure</router-link>
				</template>
				<router-link to="/map-editor" class="site-nav-desktop-only" :class="{ 'site-nav-active': route.path === '/map-editor' }">Map Editor</router-link>

				<party-toolbar v-if="currentUser" />

				<div class="site-nav-account" ref="accountMenuEl" :class="{ 'site-nav-account-open': accountMenuOpen }">
					<button
						type="button"
						class="site-nav-account-trigger"
						:aria-expanded="accountMenuOpen"
						aria-label="Account menu"
						@click="accountMenuOpen = !accountMenuOpen"
					>
						<span v-if="currentUser" class="site-nav-avatar" :title="currentUser.username">{{ currentUser.username.charAt(0).toUpperCase() }}</span>
						<span v-else class="site-nav-avatar">?</span>
					</button>
					<div class="site-nav-account-menu">
						<span v-if="currentUser" class="site-nav-account-username">{{ currentUser.username }}</span>
						<router-link to="/character/new" :class="{ 'site-nav-active': route.path === '/character/new' }">Create Character</router-link>
						<a v-if="currentUser" href="#" @click.prevent="logout">Log Out</a>
						<router-link v-else to="/login" :class="{ 'site-nav-active': route.path === '/login' }">Sign In</router-link>
					</div>
				</div>
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
		// Party membership (not "ever picked a character") is what actually
		// gates these links now — reactive off partyState directly, unlike
		// the old localStorage.charId check, which needed a manual re-read
		// on every route change since localStorage itself isn't reactive.
		const hasCharacter = computed( () => partyState.members.length > 0 );
		const mobileNavOpen = ref( false );
		const accountMenuOpen = ref( false );
		const accountMenuEl = ref( null );

		// Collapse the mobile menu and the account dropdown on every navigation
		// instead of requiring a close handler on each individual link.
		Vue.watch( () => route.path, () => {
			mobileNavOpen.value = false;
			accountMenuOpen.value = false;
		} );

		// Close the account dropdown on an outside click — mousedown (not
		// click) so it fires before a click on another nav link navigates.
		function onDocumentMousedown( evt ) {
			if ( accountMenuOpen.value && accountMenuEl.value && !accountMenuEl.value.contains( evt.target ) ) {
				accountMenuOpen.value = false;
			}
		}
		onMounted( () => document.addEventListener( "mousedown", onDocumentMousedown ) );
		onUnmounted( () => document.removeEventListener( "mousedown", onDocumentMousedown ) );

		onMounted( async () => {
			const result = await api( "/api/auth.bxm" );
			currentUser.value = result.userId ? result : null;
			if ( currentUser.value ) await loadParty();
		} );

		async function logout() {
			await api( "/api/auth.bxm", { method: "POST", body: JSON.stringify( { action: "logout" } ) } );
			currentUser.value = null;
			partyState.members = [];
			partyState.loaded = false;
			router.push( "/login" );
		}

		return { route, hasCharacter, currentUser, mobileNavOpen, accountMenuOpen, accountMenuEl, logout };
	}
};

// ── App ───────────────────────────────────────────────────────────────────────

createApp( App )
	.component( "loading-veil", LoadingVeil )
	.component( "party-toolbar", PartyToolbar )
	.use( router )
	.provide( "socket", socket )
	.provide( "gameState", gameState )
	.provide( "api", api )
	.provide( "partyState", partyState )
	.provide( "loadParty", loadParty )
	.provide( "saveParty", saveParty )
	.provide( "setCurrentUser", ( u ) => { currentUser.value = u; if ( u ) loadParty(); } )
	.mount( "#app" );
