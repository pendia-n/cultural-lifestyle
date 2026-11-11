import { cityDirectory, cityImages } from '#lib/server/city-directory';
export const load: import('./$types').PageServerLoad = async ({ platform }) => {
	const db = platform?.env.DB;
	const [destinations, images] = await Promise.all([cityDirectory(db), cityImages(db)]);
	return { destinations, images };
};
