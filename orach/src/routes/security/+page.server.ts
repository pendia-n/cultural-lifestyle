import { redirect } from '@sveltejs/kit';
export const load = async ({ parent }: import('./$types').PageServerLoadEvent) => {
	const { user } = await parent();
	if (!user) redirect(303, '/sign-in');
};
