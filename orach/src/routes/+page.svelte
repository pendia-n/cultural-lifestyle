<script lang="ts">
	let { data } = $props();
	import Icon from '#lib/components/Icon.svelte';
	import CityArt from '#lib/components/CityArt.svelte';
	import CityCover from '#lib/components/CityCover.svelte';
	let query = $state('');
	const featured = $derived(
		['manchester', 'tokyo', 'phuket', 'kaohsiung'].map((s) =>
			data.destinations.find((c) => c.slug === s)!
		)
	);
</script>

<svelte:head><title>Orach — Find your everyday, somewhere new</title></svelte:head>
<div class="container">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">For a stay that feels like you</p>
			<h1>Somewhere new.<br />Your kind of<br /><span>everyday.</span></h1>
			<p class="hero-description">
				The little coffee place. A pottery class. Your weekly shop.<br class="desktop-break" /> Discover
				local life, and what it could cost you.
			</p>
			<form class="destination-search" action="/explore">
				<Icon name="search" /><input
					aria-label="Search destinations"
					name="q"
					bind:value={query}
					placeholder="Where are you thinking of going?"
				/><button class="button" type="submit"
					><span>Find your city</span><Icon name="arrow" size={18} /></button
				>
			</form>
			<div class="hero-foot">
				<span><Icon name="check" size={14} /> Free to explore</span><span
					><Icon name="globe" size={14} /> Your familiar currency</span
				>
			</div>
		</div>
		<div class="hero-visual">
			<div class="art-label">
				<span>THE EVERYDAY FIELDNOTES</span><Icon name="compass" size={22} />
			</div>
			<div class="hero-art"><CityArt color="#c0d9e1" /></div>
			<div class="visual-caption">
				<div>
					<p class="eyebrow">A first look at</p>
					<h3>Manchester, UK</h3>
				</div>
				<a href="/city/manchester" class="round-arrow" aria-label="Explore Manchester"
					><Icon name="arrow" /></a
				>
			</div>
			<div class="floating-note">
				<span class="note-symbol"><Icon name="spark" size={22} /></span>
				<div>
					<strong>Make something to take home.</strong>
					<p>Pottery, people, a different afternoon.</p>
				</div>
			</div>
			<p class="illustration-label">City illustration · Manchester research preview</p>
		</div>
	</section>
	<section class="promise-strip">
		<div>
			<span>01</span>
			<p>Find your corner.<small>Food, culture and discoveries beyond a checklist.</small></p>
		</div>
		<div>
			<span>02</span>
			<p>Know what goes into it.<small>Original prices, conditions and source links.</small></p>
		</div>
		<div>
			<span>03</span>
			<p>Make it your stay.<small>Your routine, real offers, two cities.</small></p>
		</div>
	</section>
	<section class="discover-section">
		<div class="section-top">
			<div>
				<p class="eyebrow">A world of possibilities</p>
				<h2>Where would you feel at home?</h2>
			</div>
			<a href="/explore" class="text-link">Explore destinations<Icon name="arrow" size={17} /></a>
		</div>
		<div class="grid-four">
			{#each featured as city (city.slug)}<a class="city-card" href={'/city/' + city.slug}
					><div class="art-wrap">
						<CityCover images={data.images[city.slug] || []} name={city.name} /><span class="badge"
							>{city.status === 'draft' ? 'Research preview' : 'Profile coming soon'}</span
						>
					</div>
					<div class="card-body">
						<span class="country">{city.country}</span>
						<h3>{city.name}</h3>
						<div class="card-bottom">
							<span>{city.currency} · local currency</span><Icon name="arrow" size={17} />
						</div>
					</div></a
				>{/each}
		</div>
	</section>
	<section class="home-banner">
		<div>
			<p class="eyebrow">Your life is the starting point</p>
			<h2>A coffee is more than<br />a currency conversion.</h2>
			<p>
				Compare the things you actually enjoy using source-listed prices. Keep estimates and real
				spending separate.
			</p>
			<a class="button light" href="/profile"
				>Create your free home profile<Icon name="arrow" size={18} /></a
			>
		</div>
		<div class="basket-note">
			<Icon name="basket" size={34} />
			<h3>Your habits. A different city.</h3>
			<div><span>At home</span><span>Somewhere new</span></div>
			<p>What you pay for a coffee →<br />What a local coffee costs</p>
			<small>Comparisons appear when matching prices are available. No made-up city averages.</small
			>
		</div>
	</section>
</div>

<style>
	.hero {
		display: grid;
		grid-template-columns: 1.12fr 1fr;
		gap: 60px;
		padding: 66px 0 50px;
		align-items: center;
	}
	.hero-copy h1 {
		margin: 23px 0;
	}
	.hero-copy h1 span {
		position: relative;
		color: #6e8563;
	}
	.hero-description {
		color: var(--muted);
		font-size: 15px;
		margin-bottom: 27px;
	}
	.destination-search {
		display: flex;
		align-items: center;
		border: 1px solid #cdd8d2;
		background: white;
		padding: 7px;
		border-radius: 10px;
		gap: 10px;
		max-width: 610px;
		box-shadow: 0 4px 20px #163b4910;
	}
	.destination-search > :global(svg) {
		margin-left: 8px;
		color: var(--muted);
	}
	.destination-search input {
		width: 100%;
		min-width: 0;
		border: 0;
		background: none;
		padding: 10px 0;
		outline: none;
		font-size: 12px;
	}
	.destination-search .button {
		padding: 13px;
		white-space: nowrap;
		font-size: 12px;
	}
	.hero-foot {
		display: flex;
		gap: 23px;
		font-size: 11px;
		color: var(--muted);
		margin-top: 16px;
	}
	.hero-foot span {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.hero-visual {
		position: relative;
		transform: rotate(2deg);
		background: #fff;
		border: 1px solid #d8e1db;
		padding: 15px 15px 10px;
		border-radius: 12px;
		box-shadow: 0 16px 40px #1b3c4b0b;
	}
	.art-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 5px 5px 15px;
		font-size: 9px;
		letter-spacing: 2px;
		color: var(--muted);
	}
	.hero-art {
		height: 310px;
		overflow: hidden;
		border-radius: 5px;
	}
	.hero-art :global(svg) {
		height: 100%;
		width: 100%;
		object-fit: cover;
	}
	.visual-caption {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22px 8px 12px;
	}
	.visual-caption .eyebrow {
		font-size: 9px;
		margin-bottom: 7px;
	}
	.visual-caption h3 {
		font-size: 26px;
	}
	.round-arrow {
		border: 1px solid var(--line);
		border-radius: 50%;
		padding: 12px;
		display: flex;
	}
	.floating-note {
		position: absolute;
		left: -32px;
		bottom: 112px;
		background: #f4f0b0;
		padding: 18px 22px;
		display: flex;
		align-items: center;
		gap: 13px;
		transform: rotate(-5deg);
		box-shadow: 0 8px 20px #173e4c15;
		border-radius: 6px;
	}
	.floating-note strong {
		font-size: 12px;
	}
	.floating-note p {
		font-size: 10px;
		margin-top: 3px;
	}
	.note-symbol {
		border: 1px solid #bdc27670;
		border-radius: 50%;
		padding: 9px;
		display: flex;
	}
	.illustration-label {
		font-size: 8px;
		color: var(--muted);
		padding: 0 8px;
	}
	.promise-strip {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-block: 1px solid var(--line);
		padding: 25px 0;
		gap: 25px;
	}
	.promise-strip > div {
		display: flex;
		gap: 16px;
		align-items: center;
	}
	.promise-strip > div > span {
		font-size: 10px;
		border: 1px solid #cfdbce;
		border-radius: 50%;
		padding: 9px;
		color: #738265;
	}
	.promise-strip p {
		font-size: 13px;
		font-weight: 600;
	}
	.promise-strip small {
		display: block;
		font-size: 11px;
		font-weight: 400;
		color: var(--muted);
		margin-top: 3px;
	}
	.discover-section {
		padding: 65px 0;
	}
	.discover-section h2 {
		margin-top: 13px;
		font-size: 33px;
	}
	.home-banner {
		display: grid;
		grid-template-columns: 1fr 0.8fr;
		gap: 80px;
		background: var(--ink);
		color: #f7f8ee;
		border-radius: 14px;
		padding: 50px 55px;
	}
	.home-banner .eyebrow {
		color: #c2d0c9;
	}
	.home-banner h2 {
		margin: 18px 0;
	}
	.home-banner p {
		font-size: 14px;
		color: #c8d7d7;
		max-width: 430px;
		margin-bottom: 23px;
	}
	.basket-note {
		background: #f1f2e7;
		color: var(--ink);
		padding: 30px;
		border-radius: 8px;
		transform: rotate(-2deg);
		align-self: center;
	}
	.basket-note h3 {
		margin: 18px 0;
		font-size: 22px;
	}
	.basket-note > div {
		display: flex;
		justify-content: space-between;
		font-size: 10px;
		border-block: 1px solid #d0d8cb;
		padding: 12px 0;
	}
	.basket-note p {
		color: var(--ink);
		line-height: 2.2;
		font-size: 16px;
		margin: 18px 0;
	}
	.basket-note small {
		color: var(--muted);
		font-size: 10px;
		line-height: 1.6;
		display: block;
	}
	@media (max-width: 1000px) {
		.hero {
			gap: 30px;
		}
		.hero-art {
			height: 280px;
		}
		.hero h1 {
			font-size: 57px;
		}
		.destination-search .button span {
			display: none;
		}
		.home-banner {
			gap: 40px;
			padding: 35px;
		}
	}
	@media (max-width: 700px) {
		.hero {
			grid-template-columns: 1fr;
			padding: 38px 0 35px;
			gap: 34px;
		}
		.hero h1 {
			font-size: 56px;
		}
		.hero-description {
			font-size: 14px;
		}
		.hero-visual {
			max-width: 470px;
			margin: 0 8px 0 18px;
		}
		.hero-art {
			height: 235px;
		}
		.floating-note {
			bottom: 105px;
			left: -18px;
			padding: 13px;
		}
		.promise-strip {
			grid-template-columns: 1fr;
			gap: 18px;
		}
		.promise-strip > div {
			gap: 13px;
		}
		.discover-section {
			padding: 38px 0;
		}
		.section-top {
			flex-direction: column;
		}
		.discover-section h2 {
			font-size: 28px;
		}
		.home-banner {
			grid-template-columns: 1fr;
			gap: 30px;
			padding: 30px 24px;
		}
		.basket-note {
			transform: none;
			padding: 22px;
		}
		.hero-foot {
			font-size: 10px;
		}
		.hero-visual .visual-caption h3 {
			font-size: 24px;
		}
	}
</style>
