<script lang="ts">
	let { color = '#c1d4e4', variant = 0 }: { color?: string; variant?: number } = $props();
</script>

<svg viewBox="0 0 400 250" fill="none" aria-hidden="true" class="city-art">
	<rect width="400" height="250" fill={color} /><circle
		cx={305 - (variant % 4) * 35}
		cy="65"
		r="34"
		fill="#f7ec96"
	/>
	<path d="M0 191 400 150v100H0Z" fill="#a8bba8" /><path d="m0 221 400-42v71H0Z" fill="#eeece1" />
	<path d="m20 173 0-77 55-18 0 95Z" fill="#8b6356" /><path
		d="m75 78 35 20v68l-35 7Z"
		fill="#624f49"
	/>
	<path d="m126 165 0-101 62 0v95Z" fill="#f1dfc0" /><path
		d="m188 64 26 17v75l-26 3Z"
		fill="#d0bfa3"
	/>
	<path d="m240 155 0-52 56-18v66Z" fill="#b4775c" /><path
		d="m296 85 28 17v45l-28 4Z"
		fill="#875945"
	/>
	<path d="m330 146 0-88 29-12 0 97Z" fill="#e9e0ca" /><path
		d="m359 46 23 16v78l-23 3Z"
		fill="#b8b49f"
	/>
	{#each [0, 1, 2] as row}{#each [0, 1, 2] as col}<path
				d={`M${30 + col * 14} ${108 + row * 21}v10m${104} ${-8 - row * 0}v10`}
				stroke="#e8bd8c"
				stroke-width="6"
			/>{/each}{/each}
	<path
		d="M141 82h10v14h-10zm24 0h10v14h-10zm-24 29h10v14h-10zm24 0h10v14h-10zm-15 31h16v20h-16z"
		fill="#657571"
	/>
	<path d="M250 120h11v15h-11zm24-7h11v15h-11z" fill="#efdba8" />
	<path d="m0 247 400-48" stroke="#c1bfb1" stroke-width="2" /><path
		d="m0 202 400-42"
		stroke="#47635b"
		stroke-width="2"
	/>
	<path d="M225 190v-52m-8 0h16" stroke="#243e43" stroke-width="3" /><circle
		cx="225"
		cy="135"
		r="5"
		fill="#fcf6db"
	/>
	<path d="M111 211v-27m-5-10 5 8 6-8" stroke="#193f46" stroke-width="5" /><circle
		cx="111"
		cy="165"
		r="5"
		fill="#193f46"
	/>
	<path d="M348 187v-29" stroke="#425d4e" stroke-width="4" /><circle
		cx="348"
		cy="149"
		r="18"
		fill="#668773"
	/>
</svg>
