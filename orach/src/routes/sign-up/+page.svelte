<script lang="ts">
	import AuthForm from '#lib/components/AuthForm.svelte';
	let { data } = $props();
</script>

<svelte:head><title>A home for your next stay. — Orach</title></svelte:head>
<div class="auth-shell">
	<p class="eyebrow">Free signup</p>
	<h1>A home for your next stay.</h1>
	<p>Free to join. Save your profile, plan a stay and share useful city notes.</p>
	<AuthForm kind="signup" available={data.accountsAvailable} />
	<p class="small-text" style="text-align:center;margin-top:22px">
		Already have an account? <a class="text-link" href="/sign-in">Sign in</a>
	</p>
</div>
