const MapEditor = {
	template: `
		<div class="mapeditor">

			<!-- Small screens can't usefully host a drag/paint grid editor —
			     point them back rather than hand them a broken tool. -->
			<div class="mapeditor-mobile-notice">
				<h1 class="fantasy-heading">Map Editor</h1>
				<p class="encounter-intro">The map editor needs a larger screen — grid painting isn't practical on a phone. Please switch to a tablet or desktop to build or edit maps.</p>
				<div class="turn-actions">
					<router-link class="btn" to="/">Back to Character Select</router-link>
				</div>
			</div>

			<!-- Top toolbar: title, load, settings toggle, save -->
			<div class="mapeditor-topbar">
				<h1 class="fantasy-heading">Map Editor</h1>
				<div class="mapeditor-topbar-actions">
					<select v-model="selectedExisting" class="creation-input mapeditor-load-select">
						<option value="">Load a map…</option>
						<option v-for="opt in existingMaps" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
					</select>
					<button type="button" class="btn btn-sm" :disabled="!selectedExisting" @click="loadExisting()">Load</button>
					<button type="button" :class="['btn', 'btn-sm', showSettings ? 'btn-auto-battle' : '']" @click="showSettings = !showSettings">⚙ Settings</button>
					<button type="button" class="btn btn-sm btn-attack" @click="saveMap()">Save Map</button>
				</div>
			</div>

			<p v-if="saveError" class="encounter-banner encounter-banner-defeat mapeditor-banner">{{ saveError }}</p>
			<p v-if="saveMessage" class="encounter-banner encounter-banner-victory mapeditor-banner">{{ saveMessage }}</p>

			<!-- Settings drawer: module/map identity, grid size — set once, then tucked away -->
			<div v-if="showSettings" class="parchment-panel mapeditor-settings">
				<div class="mapeditor-settings-grid">
					<label>Module slug<input v-model="moduleSlug" type="text" class="creation-input" placeholder="e.g. lost-mines"></label>
					<label>Module name<input v-model="moduleName" type="text" class="creation-input" placeholder="e.g. Lost Mines of the Trade Road"></label>
					<label>Module description<input v-model="moduleDescription" type="text" class="creation-input"></label>
					<label>Map slug<input v-model="mapSlug" type="text" class="creation-input" placeholder="e.g. trade-road"></label>
					<label>Map name<input v-model="mapName" type="text" class="creation-input"></label>
					<label>Width<input v-model.number="width" type="number" class="creation-input" min="1" max="128"></label>
					<label>Height<input v-model.number="height" type="number" class="creation-input" min="1" max="128"></label>
					<label>Chunk size<input v-model.number="chunkSize" type="number" class="creation-input" min="1" max="128"></label>
				</div>
				<div class="turn-actions">
					<button type="button" :class="['btn', 'btn-sm', isEntryMap ? 'btn-auto-battle' : '']" @click="isEntryMap = !isEntryMap">{{ isEntryMap ? '✓ Entry Map for Module' : 'Set as Entry Map' }}</button>
					<button type="button" class="btn btn-sm" @click="newGrid()">New Grid (clears painting)</button>
				</div>
				<p class="stat-subtitle" style="margin:0.4rem 0 0;">The module picker only enters a module's entry map — others are reached via transitions.</p>
			</div>

			<!-- Sidebar (tools, right next to the canvas) + canvas -->
			<div class="mapeditor-body">
				<aside class="mapeditor-sidebar">

					<div class="editor-sidebar-section">
						<h3 class="editor-sidebar-title">Brush</h3>
						<div class="palette-grid">
							<button type="button" v-for="swatch in palette" :key="swatch.symbol"
								:class="['palette-swatch-btn', placeMode === 'paint' && brush === swatch.symbol ? 'palette-swatch-btn-selected' : '']"
								:title="swatch.label"
								@click="selectBrush( swatch.symbol )"
							>
								<span :class="['tile', 'palette-swatch-preview', swatch.cssClass]"></span>
								<span class="palette-swatch-label">{{ swatch.label }}</span>
							</button>
						</div>
					</div>

					<div class="editor-sidebar-section">
						<h3 class="editor-sidebar-title">Place</h3>
						<div class="tool-btn-col">
							<button type="button" :class="['btn', 'btn-sm', 'tool-btn', placeMode === 'player' ? 'btn-auto-battle' : '']" @click="setPlaceMode('player')">⚔ Player Spawn</button>
							<button type="button" :class="['btn', 'btn-sm', 'tool-btn', placeMode === 'spawn' ? 'btn-auto-battle' : '']" @click="setPlaceMode('spawn')">☠ Opponent Spawn</button>
							<button type="button" :class="['btn', 'btn-sm', 'tool-btn', placeMode === 'transition' ? 'btn-auto-battle' : '']" @click="setPlaceMode('transition')">🌀 Transition</button>
						</div>
						<p class="editor-mode-hint">{{ modeLabel }}</p>

						<!-- Contextual options for the active placement tool -->
						<div v-if="placeMode === 'spawn'" class="editor-tool-options">
							<label>Count
								<select v-model="spawnCountMode" class="creation-input">
									<option value="fixed">Fixed</option>
									<option value="random">Random range</option>
								</select>
							</label>
							<template v-if="spawnCountMode === 'fixed'">
								<label>Amount<input v-model.number="spawnCount" type="number" class="creation-input" min="1"></label>
							</template>
							<template v-else>
								<div class="editor-tool-options-row">
									<label>Min<input v-model.number="spawnCountMin" type="number" class="creation-input" min="1"></label>
									<label>Max<input v-model.number="spawnCountMax" type="number" class="creation-input" min="1"></label>
								</div>
							</template>
							<label>Monster
								<select v-model="spawnMonsterMode" class="creation-input">
									<option value="random">Random (level-appropriate)</option>
									<option value="specific">Specific monster</option>
								</select>
							</label>
							<label v-if="spawnMonsterMode === 'specific'">Which
								<select v-model="spawnMonsterName" class="creation-input">
									<option value="">— choose —</option>
									<option v-for="m in monsterOptions" :key="m.name" :value="m.name">{{ m.name }} (CR {{ m.cr }})</option>
								</select>
							</label>
							<label v-if="spawnMonsterMode === 'random'" class="editor-checkbox-label">
								<input type="checkbox" v-model="spawnSameType">
								Same type for whole group
							</label>
							<button type="button" class="btn btn-sm" v-if="editingSpawnIndex !== null" @click="cancelSpawnEdit()">Cancel edit</button>
						</div>

						<div v-if="placeMode === 'transition'" class="editor-tool-options">
							<label>Target module<input v-model="transitionTargetModule" type="text" class="creation-input" placeholder="e.g. lost-mines"></label>
							<label>Target map<input v-model="transitionTargetMap" type="text" class="creation-input" placeholder="e.g. trade-road"></label>
						</div>
					</div>

					<div v-if="playerSpawn.x || spawnPoints.length || transitions.length" class="editor-sidebar-section">
						<h3 class="editor-sidebar-title">Placed Markers</h3>
						<ul class="editor-marker-list">
							<li v-if="playerSpawn.x" class="editor-marker-row editor-marker-row-clickable" title="Scroll the map to this marker" @click="scrollToTile(playerSpawn.x, playerSpawn.y)">
								<span>⚔ Player spawn — ({{ playerSpawn.x }}, {{ playerSpawn.y }})</span>
							</li>
							<li v-for="(sp, i) in spawnPoints" :key="'sp'+i" :class="['editor-marker-row', 'editor-marker-row-clickable', editingSpawnIndex === i ? 'editor-marker-row-editing' : '']" title="Scroll the map to this marker" @click="scrollToTile(sp.x, sp.y)">
								<span>☠ ({{ sp.x }}, {{ sp.y }}) — {{ describeSpawn(sp) }}</span>
								<button type="button" class="btn btn-sm" @click.stop="editSpawn(i)">✎</button>
								<button type="button" class="btn btn-sm btn-end-turn" @click.stop="removeSpawn(i)">✕</button>
							</li>
							<li v-for="(tr, i) in transitions" :key="'tr'+i" class="editor-marker-row editor-marker-row-clickable" title="Scroll the map to this marker" @click="scrollToTile(tr.x, tr.y)">
								<span>🌀 ({{ tr.x }}, {{ tr.y }}) → {{ tr.targetModule }}/{{ tr.targetMap }}</span>
								<button type="button" class="btn btn-sm btn-end-turn" @click.stop="transitions.splice(i,1)">✕</button>
							</li>
						</ul>
					</div>

				</aside>

				<div class="editor-grid-wrap mapeditor-canvas" ref="gridWrapEl" @scroll="onGridScroll">
					<div v-if="grid.length" class="battle-grid" :style="{
						gridTemplateColumns: 'repeat(' + width + ', ' + tileSize + 'px)',
						gridTemplateRows: 'repeat(' + height + ', ' + tileSize + 'px)'
					}">
						<template v-for="y in visibleRows" :key="'r'+y">
							<div v-for="x in visibleCols" :key="x+','+y"
								:style="{ gridColumn: x, gridRow: y, width: tileSize + 'px' }"
								:class="cellClass(x, y, grid[y-1][x-1])"
								:title="cellTitle(x, y)"
								@click="paintTile(x, y)"
							>{{ cellEmoji(x, y) }}</div>
						</template>
					</div>
				</div>
			</div>
		</div>
	`,
	setup() {
		const { ref, computed, onMounted, onUnmounted, nextTick, inject } = Vue;
		const apiCall = inject( "api" );

		// Virtualized grid rendering — a hand-authored map can be up to
		// 128x128 (16,384 tiles). Rendering every tile as a DOM node
		// regardless of scroll position both tanks performance and hits a
		// real WebKit/Safari rendering bug: with that many elements, tiles
		// far from the initial viewport can lose their box-shadow border
		// once scrolled into view (a paint bug, not something fixable by
		// CSS alone — confirmed even after dropping `contain: paint`).
		// Only the tiles within the current scroll viewport (plus a
		// buffer) are ever mounted; everything else is just empty grid
		// space, so there's nothing off-screen for the browser to get
		// wrong. Same technique CombatEncounter.js already uses for its
		// (much smaller, position-based rather than scroll-based) viewport
		// window. Explicit `gridColumn`/`gridRow` placement lets a sparse
		// subset of cells populate the full width x height track grid, so
		// the wrap's scrollWidth/scrollHeight — and therefore the
		// scrollbar — still reflect the map's true full size.
		const gridWrapEl  = ref( null );
		const tileSize    = ref( 34 );
		const scrollLeft  = ref( 0 );
		const scrollTop   = ref( 0 );
		const wrapWidth   = ref( 800 );
		const wrapHeight  = ref( 600 );
		const flashMarker = ref( null );
		const VIRTUALIZE_BUFFER = 6;
		let flashMarkerTimeout = null;

		// Placed Markers sidebar → click to jump there instead of hunting
		// for a spawn point across a map that can be up to 128x128. Centers
		// the tile in the current viewport and briefly highlights it (see
		// .tile-marker-flash) so it's easy to spot once the view lands.
		function scrollToTile( x, y ) {
			if ( !gridWrapEl.value ) return;
			const size = tileSize.value || 34;
			const targetLeft = Math.max( 0, ( x - 0.5 ) * size - wrapWidth.value  / 2 );
			const targetTop  = Math.max( 0, ( y - 0.5 ) * size - wrapHeight.value / 2 );
			// Plain property assignment, not scrollTo({behavior:"smooth"}) —
			// the smooth-scroll animation silently no-ops in some automated/
			// headless environments (confirmed while testing this), while
			// direct assignment is a reliable, universally-supported jump.
			gridWrapEl.value.scrollLeft = targetLeft;
			gridWrapEl.value.scrollTop  = targetTop;
			onGridScroll();

			flashMarker.value = { x, y };
			if ( flashMarkerTimeout ) clearTimeout( flashMarkerTimeout );
			flashMarkerTimeout = setTimeout( () => { flashMarker.value = null; }, 1500 );
		}

		// Mirrors .tile's own `width: clamp(16px, 2.6vw, 34px)` — driven
		// from this same JS value (see the tile's inline `width` style)
		// rather than trusting the grid track size and the tile's CSS
		// clamp() to independently land on the exact same subpixel value.
		function measureTileSize() {
			tileSize.value = Math.min( 34, Math.max( 16, window.innerWidth * 0.026 ) );
		}

		function measureWrap() {
			if ( !gridWrapEl.value ) return;
			wrapWidth.value  = gridWrapEl.value.clientWidth;
			wrapHeight.value = gridWrapEl.value.clientHeight;
		}

		function onGridScroll() {
			if ( !gridWrapEl.value ) return;
			scrollLeft.value = gridWrapEl.value.scrollLeft;
			scrollTop.value  = gridWrapEl.value.scrollTop;
		}

		let resizeObserver = null;
		onUnmounted( () => {
			window.removeEventListener( "resize", measureTileSize );
			if ( resizeObserver ) resizeObserver.disconnect();
			if ( flashMarkerTimeout ) clearTimeout( flashMarkerTimeout );
		} );

		function visibleRange( scrollPos, viewportSize, tilesTotal ) {
			const size = tileSize.value || 34;
			const start = Math.max( 1, Math.floor( scrollPos / size ) - VIRTUALIZE_BUFFER );
			const count = Math.ceil( viewportSize / size ) + VIRTUALIZE_BUFFER * 2;
			const end   = Math.min( tilesTotal, start + count );
			const out   = [];
			for ( let i = start; i <= end; i++ ) out.push( i );
			return out;
		}

		const visibleCols = computed( () => visibleRange( scrollLeft.value, wrapWidth.value,  width.value ) );
		const visibleRows = computed( () => visibleRange( scrollTop.value,  wrapHeight.value, height.value ) );

		const width       = ref( 20 );
		const height      = ref( 15 );
		const chunkSize   = ref( 32 );
		const moduleSlug  = ref( "" );
		const moduleName  = ref( "" );
		const moduleDescription = ref( "" );
		const mapSlug     = ref( "" );
		const mapName     = ref( "" );
		const isEntryMap  = ref( false );
		const grid        = ref( [] );
		const playerSpawn = ref( {} );
		const spawnPoints = ref( [] );
		const transitions = ref( [] );
		const brush       = ref( "." );
		const placeMode   = ref( "paint" );
		const spawnCountMode   = ref( "fixed" );
		const spawnCount       = ref( 1 );
		const spawnCountMin    = ref( 1 );
		const spawnCountMax    = ref( 3 );
		const spawnMonsterMode = ref( "random" );
		const spawnMonsterName = ref( "" );
		const spawnSameType    = ref( false );
		const editingSpawnIndex = ref( null );
		const transitionTargetModule = ref( "" );
		const transitionTargetMap    = ref( "" );
		const existingMaps   = ref( [] );
		const selectedExisting = ref( "" );
		const monsterOptions = ref( [] );
		const saveMessage = ref( "" );
		const saveError   = ref( "" );
		const showSettings = ref( true );

		const TILE_CLASSES = {
			".": "", "#": "tile-wall", "^": "tile-torch", "O": "tile-pillar", "D": "tile-door",
			"x": "tile-spikes", "c": "tile-chest", "b": "tile-rubble", "n": "tile-banner",
			"y": "tile-crystal", "g": "tile-grass", "r": "tile-road", "t": "tile-forest",
			"m": "tile-mountain", "w": "tile-water", "s": "tile-sand"
		};

		const palette = [
			{ symbol: ".", label: "Floor",    cssClass: "" },
			{ symbol: "#", label: "Wall",     cssClass: "tile-wall" },
			{ symbol: "^", label: "Torch",    cssClass: "tile-torch" },
			{ symbol: "O", label: "Pillar",   cssClass: "tile-pillar" },
			{ symbol: "D", label: "Door",     cssClass: "tile-door" },
			{ symbol: "x", label: "Spikes",   cssClass: "tile-spikes" },
			{ symbol: "c", label: "Chest",    cssClass: "tile-chest" },
			{ symbol: "b", label: "Rubble",   cssClass: "tile-rubble" },
			{ symbol: "n", label: "Banner",   cssClass: "tile-banner" },
			{ symbol: "y", label: "Crystal",  cssClass: "tile-crystal" },
			{ symbol: "g", label: "Grass",    cssClass: "tile-grass" },
			{ symbol: "r", label: "Road",     cssClass: "tile-road" },
			{ symbol: "t", label: "Forest",   cssClass: "tile-forest" },
			{ symbol: "m", label: "Mountain", cssClass: "tile-mountain" },
			{ symbol: "w", label: "Water",    cssClass: "tile-water" },
			{ symbol: "s", label: "Sand",     cssClass: "tile-sand" }
		];

		const modeLabel = computed( () => {
			if ( placeMode.value === "player" )     return "Click a tile to set the player spawn";
			if ( placeMode.value === "spawn" )      return "Click a tile to place an opponent spawn point";
			if ( placeMode.value === "transition" ) return "Click a tile to place a transition";
			return "Painting terrain — pick a tile above";
		} );

		onMounted( async () => {
			const data = await apiCall( "/api/mapeditor.bxm?list=1" ).catch( () => ({maps:[],monsters:[]}) );
			existingMaps.value  = data.maps    ?? [];
			monsterOptions.value = data.monsters ?? [];
			grid.value = buildEmptyGrid( width.value, height.value );

			measureTileSize();
			window.addEventListener( "resize", measureTileSize );
			await nextTick();
			measureWrap();
			if ( window.ResizeObserver && gridWrapEl.value ) {
				resizeObserver = new ResizeObserver( measureWrap );
				resizeObserver.observe( gridWrapEl.value );
			}
		} );

		function buildEmptyGrid( w, h ) {
			return Array.from( { length: h }, () => Array.from( { length: w }, () => "." ) );
		}

		// A new/just-loaded grid's dimensions can be completely different
		// from whatever was scrolled to before — reset the scroll position
		// (both the ref state and the actual DOM element) so the visible
		// tile window starts back at the top-left instead of momentarily
		// showing blank space at a leftover offset.
		function resetGridScroll() {
			scrollLeft.value = 0;
			scrollTop.value  = 0;
			if ( gridWrapEl.value ) {
				gridWrapEl.value.scrollLeft = 0;
				gridWrapEl.value.scrollTop  = 0;
			}
		}

		function newGrid() {
			const w = Math.max( 1, Math.min( 128, width.value ) );
			const h = Math.max( 1, Math.min( 128, height.value ) );
			width.value  = w;
			height.value = h;
			grid.value   = buildEmptyGrid( w, h );
			playerSpawn.value  = {};
			spawnPoints.value  = [];
			transitions.value  = [];
			isEntryMap.value   = false;
			editingSpawnIndex.value = null;
			saveError.value    = "";
			saveMessage.value  = "";
			resetGridScroll();
		}

		function selectBrush( symbol ) {
			brush.value     = symbol;
			placeMode.value = "paint";
		}

		function setPlaceMode( mode ) {
			// Clicking the already-active tool switches back to painting,
			// so there's always a one-click way out of a placement mode
			// without having to reach for a brush swatch.
			placeMode.value = ( placeMode.value === mode ) ? "paint" : mode;
			editingSpawnIndex.value = null;
		}

		function spawnPointAt( x, y ) {
			return spawnPoints.value.find( s => s.x === x && s.y === y ) ?? null;
		}

		// Loads a placed spawn point's settings into the tool options so it
		// can be adjusted, then re-applied by clicking a tile (the same one,
		// to edit in place, or a different one to move it) — see paintTile's
		// "spawn" branch, which replaces this index instead of only matching
		// on clicked position.
		function editSpawn( i ) {
			const sp = spawnPoints.value[ i ];
			if ( !sp ) return;
			placeMode.value         = "spawn";
			editingSpawnIndex.value = i;
			spawnCountMode.value    = sp.countMode ?? "fixed";
			spawnCount.value        = sp.count ?? 1;
			spawnCountMin.value     = sp.countMin ?? 1;
			spawnCountMax.value     = sp.countMax ?? 3;
			spawnMonsterMode.value  = sp.monsterMode ?? "random";
			spawnMonsterName.value  = sp.monsterName ?? "";
			spawnSameType.value     = sp.sameType ?? false;
			scrollToTile( sp.x, sp.y );
		}

		function cancelSpawnEdit() {
			editingSpawnIndex.value = null;
		}

		function removeSpawn( i ) {
			if ( editingSpawnIndex.value === i ) editingSpawnIndex.value = null;
			spawnPoints.value.splice( i, 1 );
		}

		function transitionAt( x, y ) {
			return transitions.value.find( t => t.x === x && t.y === y ) ?? null;
		}

		function paintTile( x, y ) {
			if ( x < 1 || x > width.value || y < 1 || y > height.value ) return;

			if ( placeMode.value === "player" ) {
				playerSpawn.value = { x, y };
				return;
			}
			if ( placeMode.value === "spawn" ) {
				if ( spawnCountMode.value === "random" && spawnCountMin.value > spawnCountMax.value ) {
					saveError.value = "Spawn count minimum can't exceed maximum.";
					return;
				}
				if ( spawnMonsterMode.value === "specific" && !spawnMonsterName.value ) {
					saveError.value = "Choose a specific monster before placing.";
					return;
				}
				// Editing an existing spawn point replaces that specific entry
				// (even if it's being moved to a new tile) rather than only
				// ever matching by clicked position.
				const editIndex = editingSpawnIndex.value;
				const filtered = spawnPoints.value.filter( ( s, i ) => i !== editIndex && !(s.x === x && s.y === y) );
				editingSpawnIndex.value = null;
				filtered.push( {
					x, y,
					countMode: spawnCountMode.value,
					count: Math.max( 1, spawnCount.value ),
					countMin: Math.max( 1, spawnCountMin.value ),
					countMax: Math.max( 1, spawnCountMax.value ),
					monsterMode: spawnMonsterMode.value,
					sameType: spawnSameType.value,
					monsterName: spawnMonsterName.value
				} );
				spawnPoints.value = filtered;
				saveError.value   = "";
				return;
			}
			if ( placeMode.value === "transition" ) {
				if ( !transitionTargetModule.value || !transitionTargetMap.value ) {
					saveError.value = "Enter a target module slug and map slug before placing a transition.";
					return;
				}
				const filtered = transitions.value.filter( t => !(t.x === x && t.y === y) );
				filtered.push( { x, y, targetModule: transitionTargetModule.value, targetMap: transitionTargetMap.value } );
				transitions.value = filtered;
				saveError.value   = "";
				return;
			}
			// paint
			grid.value[ y - 1 ][ x - 1 ] = brush.value;
		}

		function cellClass( x, y, sym ) {
			const tileCls = TILE_CLASSES[ sym ] ?? "";
			let cls = "tile" + (tileCls ? " " + tileCls : "");
			if ( playerSpawn.value.x === x && playerSpawn.value.y === y ) cls += " tile-player";
			else if ( spawnPointAt( x, y ) ) cls += " tile-opponent";
			else if ( transitionAt( x, y ) ) cls += " tile-transition";
			if ( flashMarker.value && flashMarker.value.x === x && flashMarker.value.y === y ) cls += " tile-marker-flash";
			return cls;
		}

		function cellTitle( x, y ) {
			const sp = spawnPointAt( x, y );
			if ( sp ) return describeSpawn( sp );
			const tr = transitionAt( x, y );
			if ( tr ) return `Transition to ${ tr.targetModule } / ${ tr.targetMap }`;
			return `x${ x }, y${ y }`;
		}

		function cellEmoji( x, y ) {
			if ( playerSpawn.value.x === x && playerSpawn.value.y === y ) return "⚔";
			if ( spawnPointAt( x, y ) ) return "☠";
			if ( transitionAt( x, y ) ) return "🌀";
			return "";
		}

		function describeSpawn( sp ) {
			const countLabel   = sp.countMode === "random" ? `${ sp.countMin }-${ sp.countMax }` : `${ sp.count }`;
			const monsterLabel = sp.monsterMode === "specific" && sp.monsterName ? sp.monsterName : "random";
			const sameTypeSuffix = sp.monsterMode !== "specific" && sp.sameType ? " (same type)" : "";
			return `${ countLabel } ${ monsterLabel }${ sameTypeSuffix }`;
		}

		async function loadExisting() {
			saveError.value   = "";
			saveMessage.value = "";
			if ( !selectedExisting.value ) return;
			const parts = selectedExisting.value.split( "::" );
			if ( parts.length !== 2 ) return;
			try {
				const data = await apiCall( `/api/mapeditor.bxm?moduleSlug=${ encodeURIComponent(parts[0]) }&mapSlug=${ encodeURIComponent(parts[1]) }` );
				moduleSlug.value        = data.moduleSlug;
				moduleName.value        = data.moduleName;
				moduleDescription.value = data.moduleDescription ?? "";
				mapSlug.value           = data.mapSlug;
				mapName.value           = data.mapName;
				width.value             = data.width;
				height.value            = data.height;
				chunkSize.value         = data.chunkSize ?? 32;
				grid.value              = data.grid;
				playerSpawn.value       = data.playerSpawn;
				spawnPoints.value       = data.spawnPoints ?? [];
				transitions.value       = data.transitions ?? [];
				isEntryMap.value        = data.isEntry ?? false;
				placeMode.value         = "paint";
				editingSpawnIndex.value = null;
				showSettings.value      = false;
				resetGridScroll();
				saveMessage.value       = `Loaded '${ data.mapName }' — edit and Save Map to update it.`;
			} catch ( e ) {
				saveError.value = "Failed to load map.";
			}
		}

		async function saveMap() {
			saveError.value   = "";
			saveMessage.value = "";

			if ( !moduleSlug.value || !moduleName.value ) { saveError.value = "Module slug and name are required."; showSettings.value = true; return; }
			if ( !mapSlug.value    || !mapName.value    ) { saveError.value = "Map slug and name are required."; showSettings.value = true; return; }
			if ( !playerSpawn.value.x || spawnPoints.value.length === 0 ) {
				saveError.value = "Place a player spawn and at least one opponent spawn point before saving.";
				return;
			}

			const FLOOR_SYMBOLS = [".",",","^","O","D","x","c","b","n","y","g","r","s"];
			const ps = playerSpawn.value;
			if ( !FLOOR_SYMBOLS.includes( grid.value[ ps.y - 1 ]?.[ ps.x - 1 ] ) ) {
				saveError.value = "Player spawn must be on a floor tile.";
				return;
			}
			for ( const sp of spawnPoints.value ) {
				if ( !FLOOR_SYMBOLS.includes( grid.value[ sp.y - 1 ]?.[ sp.x - 1 ] ) ) {
					saveError.value = "Every opponent spawn point must be on a floor tile.";
					return;
				}
			}

			try {
				const res = await apiCall( "/api/mapeditor.bxm", {
					method: "POST",
					body: JSON.stringify( {
						moduleSlug:        moduleSlug.value,
						moduleName:        moduleName.value,
						moduleDescription: moduleDescription.value,
						mapSlug:           mapSlug.value,
						mapName:           mapName.value,
						width:             width.value,
						height:            height.value,
						chunkSize:         chunkSize.value,
						grid:              grid.value,
						playerSpawn:       playerSpawn.value,
						spawnPoints:       spawnPoints.value,
						transitions:       transitions.value,
						isEntryMap:        isEntryMap.value
					} )
				} );
				saveMessage.value = res.message ?? "Saved.";
				const updated = await apiCall( "/api/mapeditor.bxm?list=1" ).catch( () => ({maps:[]}) );
				existingMaps.value = updated.maps ?? [];
			} catch ( e ) {
				saveError.value = e.message || "Save failed.";
			}
		}

		return {
			width, height, chunkSize, moduleSlug, moduleName, moduleDescription,
			mapSlug, mapName, isEntryMap, grid, playerSpawn, spawnPoints, transitions,
			brush, placeMode, spawnCountMode, spawnCount, spawnCountMin, spawnCountMax,
			spawnMonsterMode, spawnMonsterName, spawnSameType, editingSpawnIndex, transitionTargetModule, transitionTargetMap,
			existingMaps, selectedExisting, monsterOptions, saveMessage, saveError, showSettings,
			palette, modeLabel,
			gridWrapEl, tileSize, visibleCols, visibleRows, onGridScroll, scrollToTile,
			newGrid, selectBrush, setPlaceMode, paintTile, loadExisting, saveMap,
			cellClass, cellTitle, cellEmoji, describeSpawn, editSpawn, cancelSpawnEdit, removeSpawn
		};
	}
};
