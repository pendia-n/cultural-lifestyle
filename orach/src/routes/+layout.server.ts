import { session } from '#lib/server/auth';
import { subscriber } from '#lib/server/access';
export const load = async (event: import('@sveltejs/kit').RequestEvent) => {
	const user = await session(event);
	const db = event.platform?.env.DB;
	return {
		user,
		member: !!(user && db && (await subscriber(db, user.id))),
		accountsAvailable: !!event.platform?.env.DB && !!event.platform?.env.ORACH_JWT_SECRET,
		billingAvailable:
			!!event.platform?.env.STRIPE_SECRET_KEY &&
			!!event.platform?.env.STRIPE_WEBHOOK_SECRET &&
			!!event.platform?.env.ORACH_PASS_PRICE_CENTS
	};
};
