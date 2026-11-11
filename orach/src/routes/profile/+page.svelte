<script lang="ts">
	import { onMount } from 'svelte';
	import { api, readLocal } from '#lib/client';
	import Icon from '#lib/components/Icon.svelte';
	let { data } = $props();
	let home = $state(''),
		currency = $state('HKD'),
		travellers = $state(1),
		message = $state(''),
		busy = $state(false);
	onMount(async () => {
		let profile = readLocal('orach-profile', { home: '', currency: 'HKD', travellers: 1 });
		if (data.user) {
			try {
				profile = (await api('profile')).profile ?? profile;
			} catch {
				message = 'Your saved device profile is available. Account sync could not be reached.';
			}
		}
		home = profile.home;
		currency = profile.currency;
		travellers = profile.travellers;
	});
	async function save() {
		busy = true;
		try {
			const profile = { home, currency, travellers };
			if (data.user) await api('profile', { profile });
			localStorage.setItem('orach-profile', JSON.stringify(profile));
			message = data.user
				? 'Home profile saved to your account.'
				: 'Home profile saved on this device. Sign up free to sync it.';
		} catch (e) {
			message = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Your home profile — Orach</title></svelte:head>
<div class="container">
	<div class="page-heading">
		<div>
			<p class="eyebrow">Start with what you know</p>
			<h1>Your everyday,<br />before you go.</h1>
			<p>
				Save your home city and the currency you prefer for comparisons.
			</p>
		</div>
		<span class="badge">Free, always</span>
	</div>
	<div class="profile-layout">
		<form
			class="panel"
			onsubmit={(e) => {
				e.preventDefault();
				void save();
			}}
		>
			<h3>Your home baseline</h3>
			<p class="small-text muted" style="margin:10px 0 25px">
				Only the essentials. You can change these later.
			</p>
			<div class="field">
				<label for="home">Home city</label><input
					id="home"
					bind:value={home}
					placeholder="For example, Hong Kong"
					required
					maxlength="100"
				/>
			</div>
			<div class="form-grid">
				<div class="field">
					<label for="currency">Familiar currency</label><select id="currency" bind:value={currency}
						>{#each ['HKD', 'USD', 'GBP', 'EUR', 'JPY', 'KRW', 'CNY', 'TWD', 'SGD', 'AUD', 'CAD', 'NZD', 'INR', 'AED', 'THB', 'MYR', 'MOP', 'ILS', 'ZAR', 'MAD', 'VND', 'IDR', 'PHP', 'TRY', 'PLN', 'CZK', 'HUF', 'GEL', 'BRL', 'EGP'] as c}<option
								>{c}</option
							>{/each}</select
					>
				</div>
				<div class="field">
					<label for="travellers">Usual traveller count</label><input
						type="number"
						id="travellers"
						bind:value={travellers}
						min="1"
						max="20"
						required
					/>
				</div>
			</div>
			<button class="button" disabled={busy}
				>{busy ? 'Saving…' : 'Save home profile'}<Icon name="check" size={16} /></button
			>{#if message}<p class="notice info" role="status" style="margin-top:18px">{message}</p>{/if}
		</form>
		<aside>
			<div class="profile-note">
				<Icon name="basket" size={35} />
				<h2>A reference point.<br />Not a stereotype.</h2>
				<p>
					Your routine might look nothing like a city average. Orach starts with your own prices
					where you have them, and labels missing information.
				</p>
				<a href="/plan" class="text-link">Compare city life<Icon name="arrow" size={16} /></a>
			</div>
			{#if !data.user}<div class="notice">
					You’re planning on this device. <a href="/sign-up" class="text-link"
						>Create a free account</a
					> to save across devices and post community notes.
				</div>{:else}<div class="row" style="padding:22px 0">
					<a class="text-link" href="/security">Account security</a><button
						class="button secondary small"
						onclick={async () => {
							await api('auth/logout', {});
							location.href = '/';
						}}>Sign out</button
					>
				</div>{/if}
		</aside>
	</div>
</div>

<style>
	.profile-layout {
		display: grid;
		grid-template-columns: 1fr 0.8fr;
		gap: 60px;
		max-width: 1000px;
	}
	.profile-note {
		background: #e9eddc;
		padding: 34px;
		border-radius: 14px;
		margin-bottom: 22px;
	}
	.profile-note h2 {
		font-size: 29px;
		margin: 22px 0;
	}
	.profile-note p {
		font-size: 14px;
		color: var(--muted);
		margin-bottom: 24px;
	}
	@media (max-width: 700px) {
		.profile-layout {
			grid-template-columns: 1fr;
			gap: 25px;
		}
	}
</style>
