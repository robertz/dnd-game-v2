const MapEditor = {
	template: `
		<div class="encounter">
			<div class="encounter-main">
				<h1 class="fantasy-heading">Map Editor</h1>

				<!-- Load existing -->
				<div class="parchment-panel editor-panel">
					<h2 class="fantasy-heading">Load Existing Map</h2>
					<template v-if="existingMaps.length === 0">
						<p class="encounter-intro">No saved maps yet — build one below and save it.</p>
					</template>
					<template v-else>
						<div class="creation-scores">
							<label>Map
								<select v-model="selectedExisting" class="creation-input">
									<option value="">— choose a map —</option>
									<option v-for="opt in existingMaps" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
								</select>
							</label>
						</div>
						<div class="turn-actions">
							<button type="button" class="btn" @click="loadExisting()">Load</button>
						</div>
					</template>
				</div>

				<!-- Module & Map identity -->
				<div class="parchment-panel editor-panel">
					<h2 class="fantasy-heading">Module &amp; Map</h2>
					<div class="creation-scores">
						<label>Module slug<input v-model="moduleSlug" type="text" class="creation-input" placeholder="e.g. lost-mines"></label>
						<label>Module name<input v-model="moduleName" type="text" class="creation-input" placeholder="e.g. Lost Mines of the Trade Road"></label>
						<label>Module description<input v-model="moduleDescription" type="text" class="creation-input"></label>
					</div>
					<div class="creation-scores">
						<label>Map slug<input v-model="mapSlug" type="text" class="creation-input" placeholder="e.g. trade-road"></label>
						<label>Map name<input v-model="mapName" type="text" class="creation-input"></label>
					</div>
					<div class="turn-actions">
						<button type="button" :class="['btn', isEntryMap ? 'btn-auto-battle' : '']" @click="isEntryMap = !isEntryMap">{{ isEntryMap ? '✓ Entry Map for Module' : 'Set as Entry Map' }}</button>
					</div>
					<p class="encounter-intro">The module picker only enters a module's entry map — others are reached via transitions.</p>
				</div>

				<!-- Grid size -->
				<div class="parchment-panel editor-panel">
					<h2 class="fantasy-heading">Grid Size</h2>
					<div class="creation-scores">
						<label>Width<input v-model.number="width" type="number" class="creation-input" min="1" max="60"></label>
						<label>Height<input v-model.number="height" type="number" class="creation-input" min="1" max="60"></label>
						<label>Chunk size<input v-model.number="chunkSize" type="number" class="creation-input" min="1" max="60"></label>
					</div>
					<div class="turn-actions">
						<button type="button" class="btn" @click="newGrid()">New Grid (clears painting)</button>
					</div>
				</div>

				<!-- Brush palette -->
				<div class="parchment-panel editor-panel">
					<h2 class="fantasy-heading">Brush</h2>
					<div class="palette-row">
						<div v-for="swatch in palette" :key="swatch.symbol"
							:class="['tile', swatch.cssClass ? swatch.cssClass : '', placeMode === 'paint' && brush === swatch.symbol ? 'palette-swatch-selected' : '', 'palette-swatch']"
							:title="swatch.label"
							@click="selectBrush(swatch.symbol)"
						></div>
					</div>
					<div class="turn-actions">
						<button type="button" :class="['btn', placeMode === 'player' ? 'btn-auto-battle' : '']" @click="setPlaceMode('player')">Place Player Spawn</button>
					</div>
					<p class="encounter-intro">
						Mode: {{ modeLabel }}
						<template v-if="playerSpawn.x"> · Player spawn: ({{ playerSpawn.x }}, {{ playerSpawn.y }})</template>
					</p>
				</div>

				<!-- Spawn points -->
				<div class="parchment-panel editor-panel">
					<h2 class="fantasy-heading">Opponent Spawn Points</h2>
					<div class="creation-scores">
						<label>Spawn count
							<select v-model="spawnCountMode" class="creation-input">
								<option value="fixed">Fixed</option>
								<option value="random">Random range</option>
							</select>
						</label>
						<template v-if="spawnCountMode === 'fixed'">
							<label>Count<input v-model.number="spawnCount" type="number" class="creation-input" min="1"></label>
						</template>
						<template v-else>
							<label>Min<input v-model.number="spawnCountMin" type="number" class="creation-input" min="1"></label>
							<label>Max<input v-model.number="spawnCountMax" type="number" class="creation-input" min="1"></label>
						</template>
					</div>
					<div class="creation-scores">
						<label>Monster
							<select v-model="spawnMonsterMode" class="creation-input">
								<option value="random">Random (level-appropriate)</option>
								<option value="specific">Specific monster</option>
							</select>
						</label>
						<template v-if="spawnMonsterMode === 'specific'">
							<label>Which monster
								<select v-model="spawnMonsterName" class="creation-input">
									<option value="">— choose a monster —</option>
									<option v-for="m in monsterOptions" :key="m.name" :value="m.name">{{ m.name }} (CR {{ m.cr }})</option>
								</select>
							</label>
						</template>
					</div>
					<div class="turn-actions">
						<button type="button" :class="['btn', placeMode === 'spawn' ? 'btn-auto-battle' : '']" @click="setPlaceMode('spawn')">Place Spawn Point</button>
					</div>
					<ul v-if="spawnPoints.length" class="attack-list">
						<li v-for="(sp, i) in spawnPoints" :key="i">
							({{ sp.x }}, {{ sp.y }}) &mdash; {{ describeSpawn(sp) }}
							<button type="button" class="btn btn-end-turn" @click="spawnPoints.splice(i,1)">Remove</button>
						</li>
					</ul>
				</div>

				<!-- Transitions -->
				<div class="parchment-panel editor-panel">
					<h2 class="fantasy-heading">Map Transitions</h2>
					<div class="creation-scores">
						<label>Target module slug<input v-model="transitionTargetModule" type="text" class="creation-input" placeholder="e.g. lost-mines"></label>
						<label>Target map slug<input v-model="transitionTargetMap" type="text" class="creation-input" placeholder="e.g. trade-road"></label>
					</div>
					<div class="turn-actions">
						<button type="button" :class="['btn', placeMode === 'transition' ? 'btn-auto-battle' : '']" @click="setPlaceMode('transition')">Place Transition</button>
					</div>
					<ul v-if="transitions.length" class="attack-list">
						<li v-for="(tr, i) in transitions" :key="i">
							({{ tr.x }}, {{ tr.y }}) &rarr; {{ tr.targetModule }} / {{ tr.targetMap }}
							<button type="button" class="btn btn-end-turn" @click="transitions.splice(i,1)">Remove</button>
						</li>
					</ul>
				</div>

				<!-- Grid canvas -->
				<div v-if="grid.length" class="editor-grid-wrap">
					<div class="battle-grid" :style="{ gridTemplateColumns: 'repeat(' + width + ', 1fr)' }">
						<template v-for="(rowArr, rIdx) in grid" :key="rIdx">
							<div v-for="(sym, cIdx) in rowArr" :key="cIdx"
								:class="cellClass(cIdx + 1, rIdx + 1, sym)"
								:title="cellTitle(cIdx + 1, rIdx + 1)"
								@click="paintTile(cIdx + 1, rIdx + 1)"
							>{{ cellEmoji(cIdx + 1, rIdx + 1) }}</div>
						</template>
					</div>
				</div>

				<!-- Save -->
				<div class="parchment-panel editor-panel">
					<p v-if="saveError" class="encounter-banner encounter-banner-defeat">{{ saveError }}</p>
					<p v-if="saveMessage" class="encounter-banner encounter-banner-victory">{{ saveMessage }}</p>
					<div class="turn-actions">
						<button type="button" class="btn btn-attack" @click="saveMap()">Save Map</button>
					</div>
				</div>
			</div>
		</div>
	`,
	setup() {
		const { ref, computed, onMounted, inject } = Vue;
		const apiCall = inject( "api" );

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
		const transitionTargetModule = ref( "" );
		const transitionTargetMap    = ref( "" );
		const existingMaps   = ref( [] );
		const selectedExisting = ref( "" );
		const monsterOptions = ref( [] );
		const saveMessage = ref( "" );
		const saveError   = ref( "" );

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
			return "Painting terrain";
		} );

		onMounted( async () => {
			const data = await apiCall( "/api/mapeditor.bxm?list=1" ).catch( () => ({maps:[],monsters:[]}) );
			existingMaps.value  = data.maps    ?? [];
			monsterOptions.value = data.monsters ?? [];
			grid.value = buildEmptyGrid( width.value, height.value );
		} );

		function buildEmptyGrid( w, h ) {
			return Array.from( { length: h }, () => Array.from( { length: w }, () => "." ) );
		}

		function newGrid() {
			const w = Math.max( 1, Math.min( 60, width.value ) );
			const h = Math.max( 1, Math.min( 60, height.value ) );
			width.value  = w;
			height.value = h;
			grid.value   = buildEmptyGrid( w, h );
			playerSpawn.value  = {};
			spawnPoints.value  = [];
			transitions.value  = [];
			isEntryMap.value   = false;
			saveError.value    = "";
			saveMessage.value  = "";
		}

		function selectBrush( symbol ) {
			brush.value     = symbol;
			placeMode.value = "paint";
		}

		function setPlaceMode( mode ) {
			placeMode.value = mode;
		}

		function spawnPointAt( x, y ) {
			return spawnPoints.value.find( s => s.x === x && s.y === y ) ?? null;
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
				const filtered = spawnPoints.value.filter( s => !(s.x === x && s.y === y) );
				filtered.push( {
					x, y,
					countMode: spawnCountMode.value,
					count: Math.max( 1, spawnCount.value ),
					countMin: Math.max( 1, spawnCountMin.value ),
					countMax: Math.max( 1, spawnCountMax.value ),
					monsterMode: spawnMonsterMode.value,
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
			if ( playerSpawn.value.x === x && playerSpawn.value.y === y ) return cls + " tile-player";
			if ( spawnPointAt( x, y ) ) return cls + " tile-opponent";
			if ( transitionAt( x, y ) ) return cls + " tile-transition";
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
			return `${ countLabel } ${ monsterLabel }`;
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
				saveMessage.value       = `Loaded '${ data.mapName }' — edit and Save Map to update it.`;
			} catch ( e ) {
				saveError.value = "Failed to load map.";
			}
		}

		async function saveMap() {
			saveError.value   = "";
			saveMessage.value = "";

			if ( !moduleSlug.value || !moduleName.value ) { saveError.value = "Module slug and name are required."; return; }
			if ( !mapSlug.value    || !mapName.value    ) { saveError.value = "Map slug and name are required."; return; }
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
				saveError.value = "Save failed.";
			}
		}

		return {
			width, height, chunkSize, moduleSlug, moduleName, moduleDescription,
			mapSlug, mapName, isEntryMap, grid, playerSpawn, spawnPoints, transitions,
			brush, placeMode, spawnCountMode, spawnCount, spawnCountMin, spawnCountMax,
			spawnMonsterMode, spawnMonsterName, transitionTargetModule, transitionTargetMap,
			existingMaps, selectedExisting, monsterOptions, saveMessage, saveError,
			palette, modeLabel,
			newGrid, selectBrush, setPlaceMode, paintTile, loadExisting, saveMap,
			cellClass, cellTitle, cellEmoji, describeSpawn
		};
	}
};
