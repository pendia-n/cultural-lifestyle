import {cityDirectory} from '#lib/server/city-directory';
export const load:import('./$types').PageServerLoad=async({platform})=>({destinations:await cityDirectory(platform?.env.DB)});
