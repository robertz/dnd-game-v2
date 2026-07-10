const ModuleSelect = {
	template: `
		<div class="encounter">
			<div class="encounter-main">
				<h1 class="fantasy-heading">Choose Your Adventure</h1>

				<template v-if="loading">
					<loading-veil label="Charting the adventures..." />
				</template>

				<template v-else-if="error">
					<p class="encounter-intro">{{ error }}</p>
				</template>

				<template v-else>
					<template v-if="modules.length > 0">
						<div class="creation-grid">
							<div
								v-for="mod in modules"
								:key="mod.slug"
								class="creation-card"
								@click="chooseModule( mod )"
							>
								<h3 class="fantasy-heading">{{ mod.name }}</h3>
								<p class="stat-subtitle">{{ mod.description }}</p>
							</div>
						</div>
					</template>
					<template v-else>
						<p class="encounter-intro">No adventure modules installed yet.</p>
					</template>
				</template>

				<div class="turn-actions">
					<div class="creation-card" @click="classicDungeon()">
						<h3 class="fantasy-heading">Classic Dungeon</h3>
						<p class="stat-subtitle">The original hand-built dungeon crawl.</p>
					</div>
				</div>

				<div class="turn-actions" style="margin-top: 1.5rem;">
					<router-link class="btn" to="/character/sheet">Back to Character</router-link>
				</div>
			</div>
		</div>
	`,
	setup() {
		const { ref, onMounted, inject } = Vue;
		const router  = VueRouter.useRouter();
		const apiCall = inject( "api" );
		const modules = ref( [] );
		const loading = ref( true );
		const error   = ref( "" );

		onMounted( async () => {
			try {
				modules.value = await apiCall( "/api/modules.bxm" );
			} catch ( e ) {
				error.value = "Could not load adventure modules.";
			} finally {
				loading.value = false;
			}
		} );

		function chooseModule( mod ) {
			localStorage.setItem( "moduleSlug", mod.slug );
			localStorage.setItem( "mapSlug",    mod.entryMapSlug ?? "" );
			router.push( "/combat" );
		}

		function classicDungeon() {
			localStorage.removeItem( "moduleSlug" );
			localStorage.removeItem( "mapSlug" );
			router.push( "/combat" );
		}

		return { modules, loading, error, chooseModule, classicDungeon };
	}
};
