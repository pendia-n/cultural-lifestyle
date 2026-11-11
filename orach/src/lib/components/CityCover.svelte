<script lang="ts">
	let { images, name }: { images: string[]; name: string } = $props();
	let index = $state(0);
	$effect(() => {
		void images;
		index = 0;
	});
</script>

<div class="city-cover">
	{#if images[index]}<img
			src={images[index]}
			alt={name}
			loading="lazy"
			referrerpolicy="no-referrer"
			onerror={() => (index += 1)}
		/>{:else}<span>{name}</span>{/if}
</div>

<style>
	.city-cover {
		position: absolute;
		inset: 0;
		background: #e5eddf;
		display: grid;
		place-items: center;
		color: #173e4c;
		font-weight: 600;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
