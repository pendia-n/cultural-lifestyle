<script lang="ts">
	import { api } from '#lib/client';
	import Icon from './Icon.svelte';
	let {
		kind,
		available = true
	}: { kind: 'signup' | 'login' | 'recovery' | 'security'; available?: boolean } = $props();
	let username = $state(''),
		password = $state(''),
		recovery = $state(''),
		message = $state(''),
		busy = $state(false),
		step = $state(1),
		unique = $state('');
	let timer: ReturnType<typeof setTimeout>;
	const valid = $derived(
		password.length >= 7 && password.length <= 18 && /[a-z]/i.test(password) && /\d/.test(password)
	);
	function check() {
		clearTimeout(timer);
		unique = '';
		if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return;
		timer = setTimeout(async () => {
			try {
				unique = (await api('auth/username?username=' + encodeURIComponent(username))).available
					? 'Username is available'
					: 'Username is already in use';
			} catch {
				unique = 'Could not check right now.';
			}
		}, 400);
	}
	async function submit() {
		busy = true;
		message = '';
		try {
			if (kind === 'recovery' && step === 1) {
				await api('auth/recovery-methods', { username });
				step = 2;
				return;
			}
			await api(
				kind === 'signup'
					? 'auth/signup'
					: kind === 'login'
						? 'auth/login'
						: kind === 'recovery'
							? 'auth/reset'
							: 'security',
				{ username, password, recovery }
			);
			if (kind === 'recovery') {
				message = 'Password reset. You can now sign in.';
				step = 3;
			} else if (kind === 'security') {
				password = '';
				recovery = '';
				message = 'Security updated. Other sessions have been signed out.';
			} else location.href = '/profile';
		} catch (e) {
			message = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

{#if !available}<p class="notice info" style="margin-bottom:20px">
		Account storage is being connected. You can still browse and create a plan on this device.
	</p>{/if}
<form
	class="panel"
	onsubmit={(e) => {
		e.preventDefault();
		void submit();
	}}
>
	{#if kind !== 'security' && step !== 3}<div class="field">
			<label for="username">Username</label><input
				id="username"
				name="username"
				bind:value={username}
				oninput={kind === 'signup' ? check : undefined}
				minlength="3"
				maxlength="24"
				pattern="[A-Za-z0-9_]+"
				autocomplete="username"
				required
				readonly={kind === 'recovery' && step > 1}
			/>{#if kind === 'signup'}<small aria-live="polite"
					>{unique || '3–24 letters, numbers or underscores.'}</small
				>{/if}
		</div>{/if}
	{#if kind === 'recovery' && step === 2}<div class="field">
			<label for="method">Recovery method</label><select id="method"
				><option>Recovery passcode</option></select
			><small>If the account exists, this is the supported recovery method.</small>
		</div>{/if}
	{#if kind === 'signup' || kind === 'security' || (kind === 'recovery' && step === 2)}<div
			class="field"
		>
			<label for="recovery"
				>{kind === 'signup'
					? 'Recovery passcode (optional)'
					: kind === 'security'
						? 'New recovery passcode (optional)'
						: 'Recovery passcode'}</label
			><input
				id="recovery"
				name="recovery"
				type="password"
				bind:value={recovery}
				minlength="8"
				maxlength="8"
				autocomplete={kind === 'recovery' ? 'off' : 'new-password'}
				required={kind === 'recovery'}
			/><small
				>Optional at signup. If supplied, use exactly 8 lowercase letters or numbers (digits only are accepted), different from your password. Without a recovery code, passcode recovery is unavailable.</small
			>
		</div>{/if}
	{#if kind === 'signup' || kind === 'login' || kind === 'security' || (kind === 'recovery' && step === 2)}<div
			class="field"
		>
			<label for="password"
				>{kind === 'security' || kind === 'recovery' ? 'New password' : 'Password'}{kind ===
				'security'
					? ' (optional)'
					: ''}</label
			><input
				id="password"
				type="password"
				name="password"
				bind:value={password}
				autocomplete={kind === 'login' ? 'current-password' : 'new-password'}
				required={kind !== 'security'}
				minlength="7"
				maxlength="18"
			/>{#if kind !== 'login'}<small aria-live="polite"
					>{valid
						? '✓ Password meets the requirements'
						: '7–18 characters, including a letter and a number.'}</small
				>{/if}
		</div>{/if}
	{#if step !== 3}<button class="button full" disabled={busy || !available}
			>{busy
				? 'Please wait…'
				: kind === 'signup'
					? 'Create free account'
					: kind === 'login'
						? 'Sign in'
						: kind === 'security'
							? 'Save security changes'
							: step === 1
								? 'Continue'
								: 'Reset password'}<Icon name="arrow" size={16} /></button
		>{/if}
	{#if kind === 'signup'}<p class="small-text muted" style="margin-top:18px">
			By creating an account, you agree to our <a class="text-link" href="/policies">policies</a>.
			No payment required.
		</p>{/if}
	{#if message}<p class="notice info" role="status" style="margin-top:18px">{message}</p>{/if}
	{#if step === 3}<a class="button full" href="/sign-in">Sign in</a>{/if}
</form>
