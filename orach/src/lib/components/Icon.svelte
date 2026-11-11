<script lang="ts">
	let { name = 'spark', size = 20 }: { name?: string; size?: number } = $props();
	const paths: Record<string, string> = {
		compass: 'm12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z',
		arrow: 'M5 12h14m-6-6 6 6-6 6',
		search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
		pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
		heart: 'M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-5 4 0 11 8 17 8-6 13-13 8-17Z',
		bag: 'M5 7h14l2 15H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
		coffee: 'M3 4h14v9a6 6 0 0 1-12 0V4Zm14 1h2a3 3 0 0 1 0 6h-2M2 22h18',
		utensils: 'M4 2v7a3 3 0 0 0 6 0V2M7 2v20M20 2c-4 3-5 8-1 10h1V2Zm0 10v10',
		spark: 'm12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8ZM20 2v4m-2-2h4',
		basket: 'm4 9 5-7m11 7-5-7M2 9h20l-3 13H5L2 9Zm7 4v5m6-5v5',
		bed: 'M2 20V6m20 14v-9H2m3 0V5h7v6m0-6h7v6M2 17h20',
		train: 'M5 16V3h14v13H5Zm0-8h14m-9-5v5M7 16l-3 6m13-6 3 6M6 20h12M8 12h1m6 0h1',
		user: 'M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 22v-3a9 9 0 0 1 18 0v3',
		calendar: 'M3 5h18v17H3V5Zm0 6h18M7 2v6m10-6v6',
		check: 'm4 12 5 5L20 6',
		close: 'm5 5 14 14M5 19 19 5',
		globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20',
		plus: 'M12 4v16M4 12h16',
		shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z',
		download: 'M12 2v14m-5-5 5 5 5-5M3 17v5h18v-5',
		menu: 'M3 6h18M3 12h18M3 18h18'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.6"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"><path d={paths[name] ?? paths.spark} /></svg
>
