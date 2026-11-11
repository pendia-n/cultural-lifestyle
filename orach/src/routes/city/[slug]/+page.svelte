<script lang="ts">
	import { sections, money, type Entry } from '#lib/catalog';
	import Icon from '#lib/components/Icon.svelte';
	import CityArt from '#lib/components/CityArt.svelte';
	import Comments from '#lib/components/Comments.svelte';
	import { api, readLocal } from '#lib/client';
	import { onMount } from 'svelte';
	let { data } = $props();
	let active = $state('eat'),
		selected = $state<Entry | null>(null),
		toast = $state(''),
		dialog: HTMLDialogElement;
	let requested = $state(false);
	const filtered = $derived(data.entries.filter((e: Entry) => e.section === active));
	const current = $derived(sections.find((s) => s.id === active)!);
	onMount(() => {
		void api('search', { city: data.city.slug }).catch(() => {});
	});
	function show(entry: Entry) {
		selected = entry;
		dialog.showModal();
	}
	function save(entry: Entry) {
		const saved = readLocal<{ city: string; entry: Entry }[]>('orach-favourites', []);
		if (!saved.some((s) => s.entry.id === entry.id && s.city === data.city.slug))
			saved.push({ city: data.city.slug, entry });
		localStorage.setItem('orach-favourites', JSON.stringify(saved));
		toast = 'Saved to your favourites on this device.';
		setTimeout(() => (toast = ''), 3500);
	}
	async function request() {
		try {
			await api('coverage', { city: data.city.slug });
			requested = true;
		} catch (e) {
			toast = (e as Error).message;
			setTimeout(() => (toast = ''), 4000);
		}
	}
</script>

<svelte:head><title>{data.city.name} fieldnotes — Orach</title></svelte:head>
<div class="container">
 {#if data.images.length}<div style="display:flex;gap:12px;overflow-x:auto;padding:16px 0" aria-label="City image gallery">{#each data.images as image}<a href={image} target="_blank" rel="noreferrer"><img src={image} alt={data.city.name + ' — city image'} loading="lazy" referrerpolicy="no-referrer" style="height:180px;max-width:300px;object-fit:cover;border-radius:12px" onerror={(event)=>{(event.currentTarget as HTMLImageElement).style.display='none'}} /></a>{/each}</div>{/if}
	<a href="/explore" class="back">← All destinations</a>
	<section class="city-hero">
		<div>
			<p class="eyebrow">{data.city.country} · {data.city.currency}</p>
			<h1>Your everyday<br />in {data.city.name}.</h1>
			<p>Find a good meal, a new experience and your own corner of the city.</p>
			<div class="city-actions">
				<a class="button" href={'/plan?city=' + data.city.slug}
					>Compare this city<Icon name="arrow" size={17} /></a
				><span class="badge draft"
					>{data.city.status === 'draft' ? 'Research preview' : 'Profile awaiting research'}</span
				>
			</div>
		</div>
		<div class="city-illustration">
			<CityArt color={data.city.color} /><span>Destination illustration</span>
		</div>
	</section>
	<div class="notice info">
		{#if data.entries.length}These are excerpts from collected research, not live-confirmed
			recommendations. Check the linked source before visiting or booking. Prices are source-listed with their conditions; they are not live booking quotes.{:else}This city is on our collection list. Its researched profile
			is not available yet. You can compare available city information and share community notes.{/if}
	</div>
	<div class="city-layout">
		<div class="city-content">
			<div class="section-tabs pill-group" aria-label="City sections">
				{#each sections as section}<button
						class="pill"
						class:active={active === section.id}
						onclick={() => (active = section.id)}
						><Icon name={section.icon} size={16} />{section.name}</button
					>{/each}
			</div>
			<div class="section-heading">
				<p class="eyebrow">Your city fieldnotes</p>
				<h2>{current.name}</h2>
				<p>{current.description}</p>
			</div>

			{#if data.research[active]}
				<section class="panel" style="margin-top:24px">
					<p class="eyebrow">Collected research · needs checking</p>
					{#if data.research[active].summary}<details><summary>Read the research notes</summary><p style="white-space:pre-wrap">
							{data.research[active].summary}
						</p></details>{/if}
					<details>
						<summary>Read the original sources</summary>
						<ul>
							{#each data.research[active].sources as source}<li>
									<a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
								</li>{/each}
						</ul>
					</details>
					<small
						>Source material may include outdated or inapplicable information. Check the exact
						place, date and conditions.</small
					>
				</section>
			{/if}
			<Comments city={data.city.slug} section={active} user={data.user} />
			{#if filtered.length}<div class="entry-list">
					{#each filtered as entry}<article class="entry-card">
							<div class="entry-icon"><Icon name={current.icon} size={26} /></div>
							<div class="entry-main">
								<span class="badge draft">{entry.status}</span>
								<h3>{entry.name}</h3>
								<p>{entry.description}</p>
								<div class="entry-price">
									{entry.status === 'Source reference'
										? 'Read original source'
										: active === 'neighbourhood'
											? 'Explore this area'
											: entry.amount !== null
												? money(entry.amount, entry.priceCurrency||data.city.currency)
												: 'See source details'}<small
										>{active === 'neighbourhood'
											? 'Local character and practical details'
											: entry.amount !== null
												? entry.unit
												: 'Source details available'}</small
									>
								</div>
								<div class="entry-actions">
									<button class="text-link" onclick={() => show(entry)}
										>Details & conditions<Icon name="arrow" size={14} /></button
									><button
										class="icon-button"
										onclick={() => save(entry)}
										aria-label={'Save ' + entry.name}><Icon name="heart" size={17} /></button
									>
								</div>
							</div>
						</article>{/each}
				</div>{:else}<div class="empty">
					<Icon name={current.icon} size={32} />
					<h3>
						{data.city.slug === 'manchester'
							? 'This section needs more evidence.'
							: 'A fieldbook waiting to be filled.'}
					</h3>
					<p>
						We’ll show sourced places and practical details here when the section is ready.
						Community notes are open now.
					</p>
					<button class="button secondary" onclick={request} disabled={requested || !data.user}
						>{requested
							? 'Interest recorded'
							: data.user
								? 'Request this profile'
								: 'Sign in to request coverage'}</button
					>
				</div>{/if}
		</div>
		<aside class="city-aside">
			<div class="panel">
				<Icon name="calendar" size={25} />
				<h3>Make room for<br />your kind of stay.</h3>
				<p>Choose your routine and compare sourced meals, drinks and experiences across cities.</p>
				<a href={'/plan?city=' + data.city.slug} class="button full"
					>Compare city life<Icon name="arrow" size={16} /></a
				><small>No payment needed to start.</small>
			</div>
			<div class="source-note">
				<Icon name="shield" size={20} />
				<h4>Know what you’re looking at.</h4>
				<p>
					Research excerpts and community experiences are labelled separately. Likes show
					usefulness, not verification.
				</p>
				<a href="/policies" class="text-link">Our source policy</a>
			</div>
		</aside>
	</div>
</div>
<dialog bind:this={dialog}>
	<div class="row">
		<span class="badge draft">{selected?.status}</span><button
			class="icon-button"
			aria-label="Close details"
			onclick={() => dialog.close()}><Icon name="close" size={18} /></button
		>
	</div>
	{#if selected}<h2>{selected.name}</h2>
		<p style="white-space:pre-line">{selected.detail}</p>
		<p class="small-text">
			Evidence: {selected.evidence}. Current price and availability have not been reconfirmed.
		</p>
		<a class="button" href={selected.source} target="_blank" rel="noopener noreferrer"
			>Check original source<Icon name="arrow" size={16} /></a
		><button class="button secondary" onclick={() => save(selected!)}>Save favourite</button>{/if}
</dialog>
{#if toast}<div class="toast" role="status">{toast}</div>{/if}

<style>
	.back {
		display: inline-block;
		font-size: 12px;
		color: var(--muted);
		margin-top: 28px;
	}
	.city-hero {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 60px;
		align-items: center;
		padding: 30px 0 35px;
	}
	.city-hero h1 {
		font-size: clamp(38px, 4.2vw, 61px);
		margin: 16px 0;
		letter-spacing: -2.3px;
	}
	.city-hero > div > p:not(.eyebrow) {
		color: var(--muted);
		font-size: 15px;
		max-width: 400px;
	}
	.city-actions {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-top: 24px;
	}
	.city-illustration {
		height: 250px;
		border-radius: 10px;
		overflow: hidden;
		position: relative;
	}
	.city-illustration span {
		position: absolute;
		bottom: 10px;
		right: 10px;
		font-size: 9px;
		background: #fff9;
		padding: 4px 7px;
		border-radius: 4px;
	}
	.city-layout {
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 35px;
		padding-top: 30px;
	}
	.section-tabs {
		padding-bottom: 24px;
		border-bottom: 1px solid var(--line);
	}
	.section-tabs .pill {
		padding: 9px 12px;
	}
	.section-heading {
		padding: 30px 0 24px;
	}
	.section-heading h2 {
		margin: 10px 0;
		font-size: 33px;
	}
	.section-heading > p:last-child {
		color: var(--muted);
		font-size: 14px;
	}
	.entry-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
	}
	.entry-card {
		display: flex;
		gap: 16px;
		padding: 24px;
		background: white;
		border: 1px solid var(--line);
		border-radius: 12px;
	}
	.entry-icon {
		height: 52px;
		width: 52px;
		min-width: 52px;
		display: grid;
		place-items: center;
		background: #e8eddd;
		border-radius: 50%;
	}
	.entry-main {
		min-width: 0;
		flex: 1;
	}
	.entry-main h3 {
		font-size: 20px;
		margin: 12px 0 9px;
	}
	.entry-main > p {
		font-size: 13px;
		color: var(--muted);
	}
	.entry-price {
		font-family: Manrope, sans-serif;
		font-size: 23px;
		letter-spacing: -0.5px;
		margin: 20px 0;
	}
	.entry-price small {
		display: block;
		font:
			11px 'DM Sans',
			sans-serif;
		letter-spacing: 0;
		color: var(--muted);
		margin-top: 5px;
	}
	.entry-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.entry-actions .text-link {
		font-size: 11px;
	}
	.city-aside .panel {
		position: sticky;
		top: 20px;
		background: #ecf0e5;
	}
	.city-aside h3 {
		font-size: 25px;
		margin: 18px 0;
	}
	.city-aside p {
		font-size: 13px;
		color: var(--muted);
		margin: 15px 0 22px;
	}
	.city-aside small {
		display: block;
		text-align: center;
		font-size: 10px;
		margin-top: 12px;
		color: var(--muted);
	}
	.source-note {
		padding: 28px 10px;
	}
	.source-note h4 {
		margin: 12px 0;
		font-size: 13px;
	}
	.source-note .text-link {
		font-size: 11px;
	}
	@media (max-width: 1100px) {
		.entry-list {
			grid-template-columns: 1fr;
		}
		.city-layout {
			grid-template-columns: 1fr 250px;
			gap: 22px;
		}
		.city-hero {
			gap: 25px;
		}
	}
	@media (max-width: 700px) {
		.city-hero {
			grid-template-columns: 1fr;
			padding-top: 25px;
			gap: 25px;
		}
		.city-hero h1 {
			font-size: 43px;
		}
		.city-illustration {
			height: 180px;
		}
		.city-layout {
			grid-template-columns: 1fr;
		}
		.city-aside {
			display: none;
		}
		.section-tabs {
			flex-wrap: nowrap;
			overflow: auto;
			margin: 0 -5%;
			padding-left: 5%;
			padding-right: 5%;
		}
		.city-actions {
			gap: 12px;
		}
		.city-actions .badge {
			font-size: 9px;
		}
		.entry-card {
			padding: 20px;
		}
		.entry-icon {
			width: 42px;
			min-width: 42px;
			height: 42px;
		}
		.city-content {
			min-width: 0;
		}
	}
</style>
