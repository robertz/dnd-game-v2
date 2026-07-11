const Auth = {
	template: `
		<div class="auth-screen">
			<div class="auth-card">
				<div class="auth-crest">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
						<path d="M9.3 12.2l2 2 3.4-4" />
					</svg>
				</div>

				<h1 class="fantasy-heading auth-title">{{ mode === 'login' ? 'Welcome Back' : 'Join the Adventure' }}</h1>
				<p class="auth-subtitle">{{ mode === 'login' ? 'Sign in to continue your quest.' : 'Create an account to begin your journey.' }}</p>

				<transition name="auth-fade" mode="out-in">
					<p v-if="formError" :key="formError" class="auth-error">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 3l10 18H2L12 3z" />
							<path d="M12 10v4" />
							<circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
						</svg>
						{{ formError }}
					</p>
				</transition>

				<form @submit.prevent="submit" class="auth-form">
					<div class="auth-field">
						<label for="auth-username">Username</label>
						<div class="auth-input-wrap">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="8" r="3.2" />
								<path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
							</svg>
							<input
								id="auth-username"
								ref="usernameInput"
								v-model="username"
								type="text"
								autocomplete="username"
								required
							>
						</div>
					</div>

					<div class="auth-field">
						<label for="auth-password">Password</label>
						<div class="auth-input-wrap">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<rect x="5" y="10.5" width="14" height="9" rx="1.5" />
								<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
							</svg>
							<input
								id="auth-password"
								v-model="password"
								:type="showPassword ? 'text' : 'password'"
								:autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
								required
							>
							<button
								type="button"
								class="auth-toggle-visibility"
								:aria-label="showPassword ? 'Hide password' : 'Show password'"
								@click="showPassword = !showPassword"
							>
								<svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
									<circle cx="12" cy="12" r="2.6" />
								</svg>
								<svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M3 3l18 18" />
									<path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a15.6 15.6 0 0 1-3.4 4.2M6.6 6.6C4 8.3 2 12 2 12s3.5 6.5 10 6.5c1.3 0 2.5-.2 3.6-.6" />
									<path d="M9.5 9.8a2.6 2.6 0 0 0 3.7 3.7" />
								</svg>
							</button>
						</div>
					</div>

					<button type="submit" class="btn btn-attack auth-submit" :disabled="submitting">
						<span v-if="submitting" class="auth-spinner"></span>
						<span>{{ submitting ? 'One moment...' : ( mode === 'login' ? 'Sign In' : 'Create Account' ) }}</span>
					</button>
				</form>

				<button type="button" class="auth-switch" :disabled="submitting" @click="toggleMode">
					{{ mode === 'login' ? "Need an account? " : "Already have an account? " }}<strong>{{ mode === 'login' ? 'Register' : 'Sign In' }}</strong>
				</button>
			</div>
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
		const showPassword = ref( false );
		const usernameInput = ref( null );

		function focusUsername() {
			Vue.nextTick( () => usernameInput.value?.focus() );
		}

		onMounted( focusUsername );

		function toggleMode() {
			mode.value = mode.value === "login" ? "register" : "login";
			formError.value = "";
			focusUsername();
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

		return {
			mode, username, password, formError, submitting, showPassword, usernameInput,
			toggleMode, submit
		};
	}
};
