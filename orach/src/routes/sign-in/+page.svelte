<script lang="ts">
	import AuthForm from '#lib/components/AuthForm.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Good to have you back. — Orach</title></svelte:head>
<div class="auth-shell">
	<p class="eyebrow">Your account</p>
	<h1>Good to have you back.</h1>
	<p>Your home profile and next stay are waiting.</p>
	<AuthForm kind="login" available={data.accountsAvailable} />
	<p class="small-text" style="text-align:center;margin-top:22px">
		New here? <a class="text-link" href="/sign-up">Create a free account</a>
	</p>
	<p class="small-text" style="text-align:center;margin-top:16px">
		<a href="/recovery">Forgot your password?</a>
	</p>
</div>
