import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { database } from './db.ts';
const encoder = new TextEncoder();
export const DAYS = 8 * 24 * 60 * 60;
export const passwordValid = (s: string) =>
	s.length >= 7 && s.length <= 18 && /[a-z]/i.test(s) && /\d/.test(s);
const encode = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
const decode = (s: string) =>
	Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
export async function hash(value: string, saved?: string) {
	const salt = saved ? saved.split('.')[0] : encode(crypto.getRandomValues(new Uint8Array(16)));
	const key = await crypto.subtle.importKey('raw', encoder.encode(value), 'PBKDF2', false, [
		'deriveBits'
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt: decode(salt), iterations: 100000, hash: 'SHA-256' },
		key,
		256
	);
	return salt + '.' + encode(new Uint8Array(bits));
}
export function equal(a: string, b: string) {
	let diff = a.length ^ b.length;
	for (let i = 0; i < Math.max(a.length, b.length); i++)
		diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
	return diff === 0;
}
async function signingKey(secret: string) {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}
export async function issue(event: RequestEvent, id: string, version: number) {
	const secret = event.platform?.env.ORACH_JWT_SECRET;
	if (!secret) error(503, 'Account signing is not configured.');
	const body =
		encode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))) +
		'.' +
		encode(
			encoder.encode(
				JSON.stringify({ sub: id, v: version, exp: Math.floor(Date.now() / 1000) + DAYS })
			)
		);
	const sig = encode(
		new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(body)))
	);
	event.cookies.set('orach_session', body + '.' + sig, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: DAYS
	});
}
export async function session(
	event: RequestEvent
): Promise<{ id: string; username: string; version: number } | null> {
	const token = event.cookies.get('orach_session'),
		secret = event.platform?.env.ORACH_JWT_SECRET;
	if (!token || !secret || !event.platform?.env.DB) return null;
	try {
		const [head, body, sig, ...rest] = token.split('.');
		if (rest.length || !sig) return null;
		const header = JSON.parse(new TextDecoder().decode(decode(head)));
		if (header.alg !== 'HS256') return null;
		if (
			!(await crypto.subtle.verify(
				'HMAC',
				await signingKey(secret),
				decode(sig),
				encoder.encode(head + '.' + body)
			))
		)
			return null;
		const payload = JSON.parse(new TextDecoder().decode(decode(body)));
		if (!payload.exp || payload.exp <= Date.now() / 1000) return null;
		return await database(event.platform)
			.prepare('SELECT id,username,version FROM users WHERE id=? AND version=?')
			.bind(payload.sub, payload.v)
			.first();
	} catch {
		return null;
	}
}
export async function requireUser(event: RequestEvent) {
	const u = await session(event);
	if (!u) error(401, 'Sign in to continue.');
	return u;
}
export async function limit(event: RequestEvent, scope: string, max = 8) {
	const ip = event.getClientAddress();
	const time = Math.floor(Date.now() / 1000);
	const bucket = scope + ':' + ip + ':' + Math.floor(time / 900);
	const db = database(event.platform);
	const row = await db
		.prepare(
			'INSERT INTO attempts(bucket,count,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count'
		)
		.bind(bucket, time + 900)
		.first<{ count: number }>();
	if (row && row.count > max) error(429, 'Too many attempts. Try again in 15 minutes.');
}
