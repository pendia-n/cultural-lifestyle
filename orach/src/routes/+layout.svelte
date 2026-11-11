<script lang="ts">
	import './layout.css';
	import Icon from '#lib/components/Icon.svelte';
	import { page } from '$app/state';
	let { children, data } = $props();
	const nav = [
		{ href: '/explore', label: 'Explore', icon: 'compass' },
		{ href: '/plan', label: 'Compare cities', icon: 'calendar' },
		{ href: '/profile', label: 'Home profile', icon: 'user' }
	];
</script>

<svelte:head
	><link rel="icon" href="/orach.svg" type="image/svg+xml" /><meta
		name="theme-color"
		content="#173e4c"
	/><meta
		name="description"
		content="Find your everyday somewhere new. Explore local food, experiences and practical prices, then build a stay around your own habits."
	/></svelte:head
>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
	<a href="/" class="brand" aria-label="Orach home"
		><img src="/orach.svg" alt="" width="34" height="34" />orach<span class="brand-dot">.</span></a
	>
	<nav class="desktop-nav" aria-label="Main navigation">
		{#each nav as item}<a href={item.href} class:active={page.url.pathname.startsWith(item.href)}
				><Icon name={item.icon} size={17} />{item.label}</a
			>{/each}
	</nav>
	<div class="header-end">
		<a class="quiet-link" href="/pricing"
			>{data.user ? (data.member ? 'Plus' : 'Free') : 'Pricing'}</a
		>{#if data.user}<a class="button small" href="/security"
				>{data.user.username}<Icon name="shield" size={15} /></a
			>{:else}<a class="button small" href="/sign-in">Sign in <Icon name="arrow" size={16} /></a
			>{/if}
	</div>
</header>
<main id="main">{@render children()}</main>
<footer class="site-footer">
	<a href="/" class="brand"><img src="/orach.svg" alt="" width="25" height="25" />orach.</a>
	<p>A little more local. A little more you.</p>
	<div>
		<a href="/about">About</a><a href="/announcements">Updates</a><a href="/policies"
			>Policies & sources</a
		>
	</div>
</footer>
<nav class="mobile-nav" aria-label="Mobile navigation">
	{#each nav as item}<a
			href={item.href}
			class:active={page.url.pathname.startsWith(item.href)}
			aria-label={item.label}
			title={item.label}
			><Icon name={item.icon} size={24} /><span class="sr-only">{item.label}</span></a
		>{/each}
</nav>
