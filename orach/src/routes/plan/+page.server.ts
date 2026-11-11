import {cityDirectory} from '#lib/server/city-directory';
import {readOffers} from '#lib/server/offer-store';
import {session} from '#lib/server/auth';
import {subscriber} from '#lib/server/access';
export const load:import('./$types').PageServerLoad=async event=>{
 const db=event.platform?.env.DB, destinations=await cityDirectory(db),user=await session(event);
 const left=destinations.find(c=>c.slug===event.url.searchParams.get('city'))?.slug||'tokyo';
 const right=left==='manchester'?'tokyo':'manchester';
 const initialOffers=db?{[left]:await readOffers(db,left),[right]:await readOffers(db,right)}:{};
 return {destinations,left,right,initialOffers,member:db&&user?await subscriber(db,user.id):false};
};
