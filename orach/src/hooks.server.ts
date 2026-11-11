import { env as bindings } from 'cloudflare:workers';
import type { Handle } from '@sveltejs/kit/hooks';
import { error } from '@sveltejs/kit';
export const handle: Handle = async ({ event, resolve }) => {
	if (!event.platform) Object.defineProperty(event, 'platform', { value: { env: bindings } });
	if (
		event.request.method !== 'GET' &&
		event.request.method !== 'HEAD' &&
		event.url.pathname !== '/api/stripe/webhook'
	) {
		const origin = event.request.headers.get('origin');
		if (origin !== event.url.origin) error(403, 'This request must come from Orach.');
	}
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	if (
		event.url.pathname.startsWith('/api') ||
		['/profile', '/security'].includes(event.url.pathname)
	)
		response.headers.set('Cache-Control', 'no-store');
	return response;
};
