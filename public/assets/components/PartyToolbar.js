const PartyToolbar = {
	template: `
		<div class="party-toolbar" ref="menuEl" :class="{ 'party-toolbar-open': open }">
			<button
				type="button"
				class="party-toolbar-trigger"
				:aria-expanded="open"
				aria-label="Party"
				@click="open = !open"
			>Party ({{ partyState.members.length }}/4)</button>
			<div class="party-toolbar-menu">
				<template v-if="partyState.members.length === 0">
					<p class="stat-subtitle">No party saved yet — pick some on Character Select.</p>
				</template>
				<div v-else class="party-toolbar-member" v-for="member in partyState.members" :key="member.id">
					<div class="party-toolbar-member-info">
						<span class="party-toolbar-member-name">{{ member.name }}</span>
						<span class="stat-subtitle">Lv {{ member.level }} {{ member.className }}</span>
						<div class="hp-bar" :title="'HP ' + member.hitPoints + '/' + member.maxHitPoints">
							<div class="hp-bar-fill" :style="{ width: hpPercent( member ) + '%' }"></div>
						</div>
					</div>
					<button
						type="button"
						class="party-toolbar-member-remove"
						title="Remove from party"
						aria-label="Remove from party"
						@click="removeMember( member.id )"
					>&times;</button>
				</div>
				<button
					type="button"
					class="btn btn-sm btn-attack party-toolbar-start"
					:disabled="partyState.members.length === 0"
					@click="startAdventure"
				>Start Adventure</button>
			</div>
		</div>
	`,
	setup() {
		const { ref, onMounted, onUnmounted, inject } = Vue;
		const router     = VueRouter.useRouter();
		const partyState = inject( "partyState" );
		const saveParty   = inject( "saveParty" );
		const open        = ref( false );
		const menuEl      = ref( null );

		function onDocumentMousedown( evt ) {
			if ( open.value && menuEl.value && !menuEl.value.contains( evt.target ) ) {
				open.value = false;
			}
		}
		onMounted( () => document.addEventListener( "mousedown", onDocumentMousedown ) );
		onUnmounted( () => document.removeEventListener( "mousedown", onDocumentMousedown ) );

		function hpPercent( member ) {
			if ( !member.maxHitPoints ) return 0;
			return Math.max( 0, Math.min( 100, member.hitPoints / member.maxHitPoints * 100 ) );
		}

		async function removeMember( id ) {
			await saveParty( partyState.members.filter( ( m ) => m.id !== id ).map( ( m ) => m.id ) );
		}

		function startAdventure() {
			if ( partyState.members.length === 0 ) return;
			const ids = partyState.members.map( ( m ) => m.id );
			localStorage.setItem( "charId", ids[ 0 ] );
			localStorage.setItem( "partyCharIds", JSON.stringify( ids ) );
			open.value = false;
			router.push( "/adventure" );
		}

		return { partyState, open, menuEl, hpPercent, removeMember, startAdventure };
	}
};
