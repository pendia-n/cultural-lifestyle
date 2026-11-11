export const researchSections = [
	'eat',
	'drink',
	'play',
	'clothing',
	'essential',
	'neighbourhood',
	'stay',
	'transport'
] as const;
export type ResearchSection = (typeof researchSections)[number];
export type ResearchCity = { name: string; country: string; currency?:string };
const subjects: Record<ResearchSection, string> = {
	eat: 'everyday local meals vegetarian official menu prices portions tax service',
	drink: 'coffee tea local drinks official menu prices serving minimum spend',
	play: 'ongoing adult cultural activities beginner workshops official admission price duration mandatory extras',
	clothing: 'local independent vintage clothing public shops named garments prices',
	essential:
		'supermarket grocery pack prices public laundry load tariff prepaid SIM allowance validity',
	neighbourhood:
		'four distinct neighbourhoods actual named food cultural venues practical tradeoffs',
	stay: 'hostel ordinary hotel serviced apartment exact room kitchen laundry fees no date-free room quote',
	transport: 'official adult local bus rail fares ticket validity transfers airport route fare'
};
export function sectionRequest(city: ResearchCity, section: ResearchSection) {
	const query = `${city.name}, ${city.country}: ${subjects[section]}. Find distinct named local places and exact products or adult services with ${city.currency||'original local currency'} prices and units. Prefer official branch menus, operator tariffs and local-language sources. Preserve portions, course counts, tax/service, minimum spend, availability, booking requirements and restrictions. Exclude generic city budgets, other cities, member/child-only prices and expired one-off events. Cover both everyday choices and distinctive local experiences; do not invent missing information.`;
	if (section === 'transport')
		return {
			provider: 'firecrawl',
			endpoint: 'https://api.firecrawl.dev/v2/search',
			body: {
				query,
				limit: 5,
				sources: [{ type: 'web' }],
				domainTools: false,
				scrapeOptions: { formats: ['markdown'], onlyMainContent: true, parsers: [], maxAge: 0 }
			}
		};
	if (section === 'play' || section === 'clothing')
		return {
			provider: 'exa',
			endpoint: 'https://api.exa.ai/search',
			body: {
				query,
				type: 'auto',
				numResults: 8,
				contents: { text: { maxCharacters: 20000 }, highlights: true, maxAgeHours: 24 }
			}
		};
	if (section === 'neighbourhood' || section === 'stay')
		return {
			provider: 'exa',
			endpoint: 'https://api.exa.ai/answer',
			body: {
				query:
					query +
					' Return up to 6 distinct NAME: records with exact locality, character, amenities or experience, source citations, inclusions and restrictions. List supported original-currency prices with their units separately from optional fees. For Stay never substitute laundry fees for room prices or invent date-free booking quotes. For Neighbourhood include actual named cultural/food venues and practical tradeoffs. Maximum 900 words. Do not invent prices, dates or amenities.',
				text: true
			}
		};
	return {
		provider: 'tavily',
		endpoint: 'https://api.tavily.com/search',
		body: {
			query,
			search_depth: 'advanced',
			max_results: 8,
			auto_parameters: false,
			include_raw_content: 'markdown',
			include_answer: false,
			include_usage: true
		}
	};
}
export function overviewRequest(city: ResearchCity) {
	return {
		endpoint: 'https://api.exa.ai/answer',
		body: {
			query: `Tell me the eat, drink, play, clothing, essential, neighbourhood, stay and transport of ${city.name}, ${city.country}, for a tourist staying longer, living locally, cutting unnecessary cost and enjoying unique experiences. Do not invent prices or current availability.`,
			outputSchema: {
				type: 'object',
				required: ['answer'],
				additionalProperties: false,
				properties: {
					answer: { type: 'string', description: '1 sentence answer for the search query' }
				}
			},
			text: true
		}
	};
}
export async function parallelSections<T>(
	city: ResearchCity,
	execute: (section: ResearchSection, request: ReturnType<typeof sectionRequest>) => Promise<T>
) {
	return Promise.allSettled(
		researchSections.map((section) => execute(section, sectionRequest(city, section)))
	);
}
export function priceFollowupRequest(city:ResearchCity,section:ResearchSection){
 const request=sectionRequest(city,section);
 // Search endpoints retrieve pages; a short retrieval query is more useful than report-writing instructions.
 const retrieval:Partial<Record<ResearchSection,string>>={eat:'ordinary complete lunch set restaurant menu prices',drink:'cafe espresso cappuccino single cup menu prices',play:'museum regular adult admission official ticket price',transport:'official local bus metro adult single ticket fare distance tariff'};
 request.body.query=`${city.name} ${city.country} ${retrieval[section]||subjects[section]} ${city.currency||'local currency'}`;
 const focus:Partial<Record<ResearchSection,string>>={eat:'named complete regular adult meals or lunch sets, not sides or generic daily budgets',drink:'individual cups of coffee or tea with explicit size, not afternoon-tea packages, food, tasting flights, bottles or bags of beans',play:'regular adult admission to ongoing museums or recurring workshops, not dated festivals or concession tickets',transport:'ordinary adult single local bus/metro fares, not airport or concession fares'};
 if(section==='stay'||section==='neighbourhood')request.body.query+=' '+(focus[section]||'exact named items with prices and units');
 return request;
}
