<script lang="ts">
	import AuthForm from '#lib/components/AuthForm.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Find your way back in. — Orach</title></svelte:head>
<div class="auth-shell">
	<p class="eyebrow">Your account</p>
	<h1>Find your way back in.</h1>
	<p>Recover your account using your username and saved recovery passcode.</p>
	<AuthForm kind="recovery" available={data.accountsAvailable} />
	<p class="small-text" style="text-align:center;margin-top:22px">
		Remembered your password? <a class="text-link" href="/sign-in">Sign in</a>
	</p>
</div>
