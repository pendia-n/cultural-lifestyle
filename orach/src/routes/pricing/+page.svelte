<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Orach Plus — Orach pricing</title></svelte:head>
<div class="container">
	<div class="page-heading">
		<div>
			<p class="eyebrow">Keep it simple</p>
			<h1>A free start.<br />One optional membership.</h1>
			<p>
				Get useful planning tools before deciding to pay. Your profile, city guides and community
				notes stay free.
			</p>
		</div>
	</div>
	<div class="pricing-grid">
		<section class="panel">
			<span class="badge">{data.user && !data.member ? 'Your current plan' : 'Free access'}</span>
			<h2>Free account</h2>
			<div class="price">US$0</div>
			<p>For exploring local life and comparing cities.</p>
			<ul>
				<li>Browse available city profiles and source links</li>
				<li>Your reusable home profile</li>
				<li>Sourced city comparisons in local and familiar currency</li>
				<li>Save your current comparison to your account</li>
				<li>Post, like and report community comments</li>
			</ul>
			{#if data.user}
				<a class="button secondary full" href="/plan"
					>Continue comparing<Icon name="arrow" size={17} /></a
				>
			{:else}
				<a class="button secondary full" href="/sign-up"
					>Create a free account<Icon name="arrow" size={17} /></a
				>
			{/if}
		</section>
		<section class="panel paid">
			<span class="badge">{data.member ? 'Your current plan' : 'Optional monthly membership'}</span>
			<h2>Orach Plus</h2>
			<div class="price">US$7.99<span>per month</span></div>
			<p>For comparing possibilities and taking your plan with you.</p>
			<ul>
				<li>Everything in your free account</li>
				<li>Three named lifestyle comparison versions</li>
				<li>Choose meals, cafés and outings with source-listed prices</li>
				<li>Print your comparison with sources or save it as PDF</li>
				<li>Commission research for missing cities, within shared research limits</li>
			</ul>
			<a class="button full" href="/plan">Compare your cities<Icon name="arrow" size={17} /></a
			><small
				>Renews monthly until cancelled. Manage or cancel through your billing portal. Stripe
				Checkout supports eligible fiat and USDC methods where eligible.</small
			>
		</section>
	</div>

	{#if !data.billingAvailable}<div
			class="notice"
			style="max-width:940px;margin:25px auto"
			role="status"
		>
			Checkout is temporarily unavailable. Your free account and saved plans remain available.
		</div>{/if}

	<div class="prose">
		<h2>Before you buy</h2>
		<p>
			Membership unlocks paid features across your saved comparisons while active. City profiles and
			community contributions remain free. Cancelling stops renewal; access continues through the
			paid period. Source-listed prices are not live booking quotes. New-city research is subject to
			shared provider budgets and may be incomplete. See our policies for refund details.
		</p>
	</div>
</div>

<style>
	.pricing-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 25px;
		max-width: 940px;
		margin: auto;
	}
	.pricing-grid .panel {
		padding: 35px;
	}
	.pricing-grid h2 {
		font-size: 29px;
		margin: 24px 0;
	}
	.price {
		font:
			600 48px Manrope,
			sans-serif;
		letter-spacing: -2px;
	}
	.price span {
		display: block;
		font:
			12px 'DM Sans',
			sans-serif;
		letter-spacing: 0;
		margin-top: 10px;
		color: var(--muted);
	}
	.pricing-grid p {
		color: var(--muted);
		font-size: 14px;
		margin-top: 20px;
	}
	.pricing-grid ul {
		list-style: none;
		margin: 25px 0;
		padding: 0;
	}
	.pricing-grid li {
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
		font-size: 13px;
	}
	.pricing-grid li:before {
		content: '✓';
		margin-right: 10px;
		color: #7a8d53;
	}
	.paid {
		background: #eff2e4;
		border-color: #c5d0b4;
	}
	.paid small {
		display: block;
		font-size: 10px;
		color: var(--muted);
		line-height: 1.7;
		margin-top: 18px;
	}
	@media (max-width: 700px) {
		.pricing-grid {
			grid-template-columns: 1fr;
		}
		.pricing-grid .panel {
			padding: 27px;
		}
	}
</style>
