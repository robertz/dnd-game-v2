const Auth = {
	template: `
		<div class="creation">
			<h1 class="fantasy-heading">{{ mode === 'login' ? 'Sign In' : 'Create an Account' }}</h1>

			<p v-if="formError" class="encounter-banner encounter-banner-defeat">{{ formError }}</p>

			<form @submit.prevent="submit">
				<label>Username<input v-model="username" type="text" class="creation-input" autocomplete="username" required></label>
				<label>Password<input v-model="password" type="password" class="creation-input" autocomplete="current-password" required></label>

				<div class="turn-actions">
					<button type="submit" class="btn btn-attack" :disabled="submitting">
						{{ mode === 'login' ? 'Sign In' : 'Register' }}
					</button>
					<button type="button" class="btn btn-end-turn" @click="toggleMode">
						{{ mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign In' }}
					</button>
				</div>
			</form>
		</div>
	`,
	setup() {
		const api      = inject( "api" );
		const setUser  = inject( "setCurrentUser" );
		const router   = VueRouter.useRouter();
		const mode     = ref( "login" );
		const username = ref( "" );
		const password = ref( "" );
		const formError = ref( "" );
		const submitting = ref( false );

		function toggleMode() {
			mode.value = mode.value === "login" ? "register" : "login";
			formError.value = "";
		}

		async function submit() {
			submitting.value = true;
			formError.value = "";
			try {
				const result = await api( "/api/auth.bxm", {
					method: "POST",
					body: JSON.stringify( { action: mode.value, username: username.value, password: password.value } )
				} );
				if ( result.error ) {
					formError.value = result.error;
					return;
				}
				setUser( result );
				router.push( "/" );
			} catch ( e ) {
				formError.value = "Could not reach the server.";
			} finally {
				submitting.value = false;
			}
		}

		return { mode, username, password, formError, submitting, toggleMode, submit };
	}
};
