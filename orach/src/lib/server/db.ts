import { error } from '@sveltejs/kit';
export function database(platform: App.Platform | undefined) {
	const db = platform?.env.DB;
	if (!db)
		error(503, 'Account storage is not connected. You can still explore and plan on this device.');
	return db;
}
