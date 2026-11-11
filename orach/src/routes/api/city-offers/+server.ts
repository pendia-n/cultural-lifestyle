import {json,error} from '@sveltejs/kit';
import {readOffers} from '#lib/server/offer-store';
import {cityDirectory} from '#lib/server/city-directory';
export const GET:import('./$types').RequestHandler=async({url,platform})=>{
 const slug=url.searchParams.get('city')||'';const city=(await cityDirectory(platform?.env.DB)).find(c=>c.slug===slug);if(!city)error(404,'City not found.');
 const db=platform!.env.DB;const coverage=await db.prepare('SELECT section,offers,comparable,status FROM research_coverage WHERE city_slug=?').bind(slug).all();
 return json({city,offers:await readOffers(db,slug),coverage:coverage.results},{headers:{'Cache-Control':'public,max-age=120'}});
};
