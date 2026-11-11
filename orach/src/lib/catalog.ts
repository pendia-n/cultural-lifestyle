export const sections = [
	{
		id: 'eat',
		name: 'Eat',
		icon: 'utensils',
		description: 'Everyday meals and something worth going out for.'
	},
	{
		id: 'drink',
		name: 'Drink',
		icon: 'coffee',
		description: 'A good cup, a local ritual, a place to linger.'
	},
	{
		id: 'play',
		name: 'Play & explore',
		icon: 'spark',
		description: 'Make something. Try something. Remember it.'
	},
	{
		id: 'clothing',
		name: 'Shop',
		icon: 'bag',
		description: 'Independent shops, secondhand finds and useful basics.'
	},
	{
		id: 'essential',
		name: 'Essentials',
		icon: 'basket',
		description: 'The small things that make a place feel familiar.'
	},
	{
		id: 'neighbourhood',
		name: 'Neighbourhoods',
		icon: 'pin',
		description: 'Find your corner of the city.'
	},
	{
		id: 'stay',
		name: 'Stay',
		icon: 'bed',
		description: 'Practical places to make a temporary home.'
	},
	{
		id: 'transport',
		name: 'Get around',
		icon: 'train',
		description: 'Fares, tickets and the details that matter.'
	}
] as const;
export type Section = (typeof sections)[number]['id'];
export type City = {
	slug: string;
	name: string;
	country: string;
	currency: string;
	region: string;
	color: string;
	status: 'awaiting' | 'draft' | 'published';
};
const groups: [string, string, string, string, string[]][] = [
	['Japan', 'JPY', 'Asia', '#eecbb8', ['Tokyo', 'Osaka', 'Sapporo']],
	['South Korea', 'KRW', 'Asia', '#ccd9f4', ['Seoul', 'Busan']],
	['Macao', 'MOP', 'Asia', '#e8cbae', ['Macao']],
	['Hong Kong', 'HKD', 'Asia', '#d6e3b9', ['Hong Kong']],
	['China', 'CNY', 'Asia', '#c4dfd4', ['Shenzhen']],
	['Taiwan', 'TWD', 'Asia', '#f3d593', ['Kaohsiung']],
	['Thailand', 'THB', 'Asia', '#e1dcc0', ['Phuket', 'Chiang Mai']],
	['Vietnam', 'VND', 'Asia', '#b6d7c0', ['Hanoi']],
	['Malaysia', 'MYR', 'Asia', '#e5c8bb', ['George Town']],
	['Singapore', 'SGD', 'Asia', '#cbdccb', ['Singapore']],
	['Indonesia', 'IDR', 'Asia', '#c8d5bc', ['Jakarta']],
	['Philippines', 'PHP', 'Asia', '#e6d8ad', ['Manila']],
	['India', 'INR', 'Asia', '#e7bc9d', ['Mumbai', 'Delhi']],
	['United Arab Emirates', 'AED', 'Middle East', '#e2d2b6', ['Dubai']],
	['United Kingdom', 'GBP', 'Europe', '#c1d4e4', ['Manchester', 'Glasgow', 'Bristol']],
	['France', 'EUR', 'Europe', '#e4c7c5', ['Lyon', 'Nice', 'Bordeaux']],
	['Italy', 'EUR', 'Europe', '#efd4a9', ['Bologna', 'Naples']],
	['Spain', 'EUR', 'Europe', '#e6c192', ['Valencia', 'Madrid']],
	['Portugal', 'EUR', 'Europe', '#bad8dc', ['Lisbon']],
	['Germany', 'EUR', 'Europe', '#d0d5b9', ['Munich', 'Cologne']],
	['Netherlands', 'EUR', 'Europe', '#e5c0aa', ['Rotterdam', 'Amsterdam']],
	['Czechia', 'CZK', 'Europe', '#d7ccbf', ['Prague']],
	['Hungary', 'HUF', 'Europe', '#e1c9bd', ['Budapest']],
	['Türkiye', 'TRY', 'Europe', '#c5d6df', ['Antalya', 'Istanbul']],
	['Poland', 'PLN', 'Europe', '#cbd3b8', ['Kraków', 'Warsaw']],
	['Georgia', 'GEL', 'Europe', '#dabeb3', ['Tbilisi']],
	['United States', 'USD', 'Americas', '#ccd6e5', ['New York City', 'Chicago', 'Las Vegas']],
	['Canada', 'CAD', 'Americas', '#d9c7b9', ['Montréal', 'Québec City']],
	['Brazil', 'BRL', 'Americas', '#c5dcaf', ['Rio de Janeiro']],
	['Australia', 'AUD', 'Oceania', '#ebd2af', ['Perth']],
	['New Zealand', 'NZD', 'Oceania', '#c5d6c0', ['Wellington', 'Auckland']],
	['Morocco', 'MAD', 'Africa', '#e5bd9f', ['Marrakesh', 'Fes']],
	['Egypt', 'EGP', 'Africa', '#e6d09c', ['Cairo']],
	['Israel', 'ILS', 'Middle East', '#c3d9de', ['Tel Aviv']],
	['South Africa', 'ZAR', 'Africa', '#cdd1ac', ['Cape Town']]
];
export const slugify = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
export const launchCityNames = [
	'Phuket',
	'Chiang Mai',
	'Hanoi',
	'Manchester',
	'Kaohsiung',
	'Busan',
	'Tokyo',
	'Manila',
	'Mumbai',
	'Dubai',
	'Bristol',
	'Nice',
	'Bordeaux',
	'Bologna',
	'Naples',
	'Valencia',
	'Munich',
	'Cologne',
	'Rotterdam',
	'Budapest',
	'Antalya',
	'Kraków',
	'Tbilisi',
	'Chicago',
	'Québec City',
	'Rio de Janeiro',
	'Perth',
	'Wellington',
	'Marrakesh',
	'Cairo',
	'Tel Aviv',
	'Cape Town'
];
export const cities: City[] = groups.flatMap(([country, currency, region, color, names]) =>
	names
		.filter((name) => launchCityNames.includes(name))
		.map((name) => ({
			name,
			country,
			currency,
			region,
			color,
			slug: slugify(name),
			status: name === 'Manchester' ? 'draft' : 'awaiting'
		}))
);
export type Entry = {
	id: string;
	section: Section;
	name: string;
	description: string;
	detail: string;
	amount: number | null;
 priceCurrency?: string;
	unit: string;
	source: string;
	evidence: string;
	status: string;
};
// Manually selected excerpts from the supplied Manchester research, not live confirmations.
export const manchester: Entry[] = [
	{
		id: 'alberts-lunch',
		section: 'eat',
		name: 'Lunch at Albert’s Shed',
		description: 'Two courses, by the canal in Castlefield.',
		detail:
			'The supplied menu excerpt lists two courses for £16.50 or three for £20.50. Tuesday–Friday 12–5pm; Saturday 12–3pm. Check the current menu before visiting.',
		amount: 16.5,
		unit: 'per person · two courses',
		source: 'https://alberts-restaurants.com/shed',
		evidence: 'manchester_eat.md · official menu excerpt',
		status: 'Needs current confirmation'
	},
	{
		id: 'hinterland',
		section: 'drink',
		name: 'Hinterland',
		description: 'An alcohol-free bar and plant-based café.',
		detail:
			'The research identifies this Northern Quarter venue. A current drinks menu and prices have not been confirmed.',
		amount: null,
		unit: 'Price not confirmed',
		source: 'https://hinterland.bar',
		evidence: 'manchester_drink.md · venue discovery',
		status: 'Discovery only'
	},
	{
		id: 'familia-wheel',
		section: 'play',
		name: 'Get your hands into clay',
		description: 'An introduction to wheel throwing at Familia Studios.',
		detail:
			'The supplied official-page excerpt lists a two-hour introduction at £48 per person. Equipment, firing, collection arrangements and current availability need confirmation.',
		amount: 48,
		unit: 'per person · 2 hours',
		source: 'https://www.familiastudios.com/',
		evidence: 'manchester_play.md · official page excerpt',
		status: 'Needs current confirmation'
	},
	{
		id: 'craft-wheel',
		section: 'play',
		name: 'A pottery session of your own',
		description: 'One-to-one wheel throwing at Manchester Craft & Design Centre.',
		detail:
			'The supplied excerpt lists £85 per 1:1 session including fired pots. Over 12; under 16s accompanied by an adult. Confirm duration and collection arrangements with the operator.',
		amount: 85,
		unit: 'per 1:1 session',
		source: 'https://www.craftanddesign.com/workshops/throwing-on-the-wheel/',
		evidence: 'manchester_play.md · operator excerpt',
		status: 'Needs current confirmation'
	},
	{
		id: 'vintage-folk',
		section: 'clothing',
		name: 'Vintage Folk warehouse events',
		description: 'Secondhand finds with prices by item, rather than weight.',
		detail:
			'The research lists tops/T-shirts at £5 and coats at £25 for event stock. The warehouse is not an everyday shop. Confirm the next sale dates; website stock is separate.',
		amount: 5,
		unit: 'T-shirt · event stock only',
		source: 'https://www.vintage-folk.com/pages/thrift',
		evidence: 'manchester_clothing.md · official event excerpt',
		status: 'Dates need confirmation'
	},
	{
		id: 'northern-quarter',
		section: 'neighbourhood',
		name: 'Northern Quarter',
		description: 'Independent shops, street art and live music.',
		detail:
			'An area to explore for Afflecks and Band on the Wall. This is an editorial starting point drawn from the supplied research, not a safety or accommodation recommendation.',
		amount: null,
		unit: 'Area guide',
		source:
			'https://www.visitmanchester.com/things-to-see-and-do/explore/neighbourhoods/northern-quarter/',
		evidence: 'manchester_neighbourhood.md · cited summary',
		status: 'Editorial draft'
	},
	{
		id: 'wilde',
		section: 'stay',
		name: 'Wilde Manchester, City Centre',
		description: 'An aparthotel option to investigate for a longer stay.',
		detail:
			'The supplied answer mentions kitchens and a laundry room, with details varying or unconfirmed. No nightly quote or availability has been collected. Enter your own accommodation quote in your plan.',
		amount: null,
		unit: 'Quote required',
		source: 'https://www.wilde.com/manchester/city-centre',
		evidence: 'manchester_stay.md · cited summary',
		status: 'Amenities need confirmation'
	},
	{
		id: 'bee-hopper',
		section: 'transport',
		name: 'Bee Network hopper ticket',
		description: 'A local bus fare with a 60-minute transfer window.',
		detail:
			'The saved official page lists £2 adult and £1 child hopper tickets, with further Bee Network bus journeys within 60 minutes. Day passes, trams and airport routes have separate conditions.',
		amount: 2,
		unit: 'adult hopper ticket',
		source: 'https://tfgm.com/tickets-and-passes/bus-tickets',
		evidence: 'manchester_transport.md · official page excerpt',
		status: 'Needs current confirmation'
	}
];
export const money = (n: number, currency: string) => {
 if(!Number.isFinite(n))return '—';
 const code=typeof currency==='string'?currency.trim().toUpperCase():'';
 try {if(!/^[A-Z]{3}$/.test(code))throw Error('Invalid currency');return new Intl.NumberFormat('en',{style:'currency',currency:code,maximumFractionDigits:2}).format(n);}
 catch {return new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n)+' (currency unavailable)';}
};
