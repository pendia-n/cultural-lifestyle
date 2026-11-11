<script lang="ts">
	import AuthForm from '#lib/components/AuthForm.svelte';
	let { data } = $props();
</script>

<svelte:head><title>A little peace of mind. — Orach</title></svelte:head>
<div class="auth-shell">
	<p class="eyebrow">Your account</p>
	<h1>A little peace of mind.</h1>
	<p>Manage your password and recovery passcode. Your session lasts eight days.</p>
	<AuthForm kind="security" available={data.accountsAvailable} />
	<p class="small-text" style="text-align:center;margin-top:22px">
		Back to your everyday <a class="text-link" href="/profile">Home profile</a>
	</p>
</div>
