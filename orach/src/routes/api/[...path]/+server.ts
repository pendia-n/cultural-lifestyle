import {stayAccess} from '#lib/server/access';
import { json, error, type RequestEvent } from '@sveltejs/kit';
import { database } from '#lib/server/db';
import { session, requireUser, hash, equal, issue, limit, passwordValid } from '#lib/server/auth';
import { cities, sections } from '#lib/catalog';
import { checkout, webhook, billingPortal } from '#lib/server/payments';
const validSection = (s: string) => sections.some((x) => x.id === s);
async function knownCity(event: RequestEvent, slug: unknown) {
	if (typeof slug !== 'string') return false;
	if (cities.some((city) => city.slug === slug)) return true;
	return !!(await database(event.platform)
		.prepare("SELECT slug FROM cities WHERE slug=? AND status IN ('draft','published')")
		.bind(slug)
		.first());
}

const text = (o: Record<string, unknown>, key: string) =>
	typeof o[key] === 'string' ? (o[key] as string).trim() : '';
export async function GET(event: RequestEvent) {
	const path = event.params.path;
	if (path === 'auth/session') return json({ user: await session(event) });
	if (path === 'auth/username') {
		const username = event.url.searchParams.get('username') ?? '';
		if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return json({ available: false });
		const u = await database(event.platform)
			.prepare('SELECT id FROM users WHERE username=?')
			.bind(username)
			.first();
		return json({ available: !u });
	}
	if (path === 'comments') {
		const city = event.url.searchParams.get('city') ?? '',
			section = event.url.searchParams.get('section') ?? '';
		if (!(await knownCity(event, city)) || !validSection(section))
			error(400, 'Choose a city and section.');
		const user = await session(event);
		const result = await database(event.platform)
			.prepare(
				`SELECT c.id,c.body,c.created_at,u.username,COUNT(l.user_id) AS likes,MAX(CASE WHEN l.user_id=? THEN 1 ELSE 0 END) AS liked FROM comments c JOIN users u ON u.id=c.user_id LEFT JOIN comment_likes l ON l.comment_id=c.id WHERE c.city_slug=? AND c.section=? AND c.hidden=0 GROUP BY c.id ORDER BY (COUNT(l.user_id)>=5) DESC,COUNT(l.user_id) DESC,c.created_at DESC LIMIT 50`
			)
			.bind(user?.id ?? '', city, section)
			.all();
		return json({
			comments: result.results.map((comment) => ({
				...comment,
				community_card: Number(comment.likes) >= 5
			})),
			threshold: 5
		});
	}
	if (path === 'profile') {
		const u = await requireUser(event);
		const row = await database(event.platform)
			.prepare('SELECT data FROM profiles WHERE user_id=?')
			.bind(u.id)
			.first<{ data: string }>();
		return json({ profile: row ? JSON.parse(row.data) : null });
	}
	if (path === 'stays') {
		const u = await requireUser(event);
		const rows = await database(event.platform)
			.prepare('SELECT id,data FROM stays WHERE user_id=? ORDER BY updated_at DESC LIMIT 50')
			.bind(u.id)
			.all<{ id: string; data: string }>();
		return json({ stays: rows.results.map((r) => ({ id: r.id, ...JSON.parse(r.data) })) });
	}
	if (path === 'scenarios' || path === 'export') {
		const u = await requireUser(event);
		const id = event.url.searchParams.get('stay');
		const db = database(event.platform);
		const ent = await stayAccess(database(event.platform),u.id,id);
		if (!ent) error(403, 'An active membership or valid legacy stay pass is required.');
		if (path === 'scenarios') {
			const r = await db
				.prepare('SELECT name,data FROM scenarios WHERE stay_id=? AND user_id=?')
				.bind(id, u.id)
				.all<{ name: string; data: string }>();
			return json({
				scenarios: r.results.map((x) => ({ name: x.name, data: JSON.parse(x.data) }))
			});
		}
		const row = await db
			.prepare('SELECT data FROM stays WHERE id=? AND user_id=?')
			.bind(id, u.id)
			.first<{ data: string }>();
		if (!row) error(404, 'Stay not found.');
		return new Response(
			JSON.stringify(
				{
					note: 'Your own estimates; not live quotes. Reference exchange rate supplied by you.',
					stay: JSON.parse(row.data)
				},
				null,
				2
			),
			{
				headers: {
					'Content-Type': 'application/json',
					'Content-Disposition': 'attachment; filename="orach-stay.json"'
				}
			}
		);
	}
	if (path === 'entitlement') {
		const u = await requireUser(event);
		const id = event.url.searchParams.get('stay');
		const ent = await stayAccess(database(event.platform),u.id,id);
		return json({ active: !!ent });
	}
	error(404, 'Not found.');
}
export async function POST(event: RequestEvent) {
	const path = event.params.path;
	if (path === 'stripe/webhook') return webhook(event);
	if (Number(event.request.headers.get('content-length') ?? 0) > 30000)
		error(413, 'This request is too large.');
	let o: Record<string, unknown>;
	try {
		o = await event.request.json();
	} catch {
		error(400, 'Send a valid request.');
	}
	const db = database(event.platform);
	if (path === 'auth/logout') {
		const u = await session(event);
		if (u) await db.prepare('UPDATE users SET version=version+1 WHERE id=?').bind(u.id).run();
		event.cookies.delete('orach_session', { path: '/' });
		return json({ ok: true });
	}
	if (path === 'auth/signup') {
		await limit(event, 'signup', 5);
		const username = text(o, 'username'),
			password = text(o, 'password'),
			recovery = text(o, 'recovery');
		if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
			error(400, 'Use 3–24 letters, numbers or underscores.');
		if (!passwordValid(password)) error(400, 'Use 7–18 characters with a letter and a number.');
		if (recovery && !/^[a-z0-9]{8}$/.test(recovery))
			error(400, 'Recovery code must be exactly 8 lowercase letters or numbers. Digits only are accepted.');
		if (recovery && recovery === password) error(400, 'Recovery code must be different from your password, or leave it blank.');
		if (!event.platform?.env.ORACH_JWT_SECRET) error(503, 'Account signing is not configured.');
		const id = crypto.randomUUID();
		try {
			await db
				.prepare('INSERT INTO users(id,username,password,recovery) VALUES(?,?,?,?)')
				.bind(id, username, await hash(password), recovery ? await hash(recovery) : '')
				.run();
		} catch (e) {
			if (String(e).includes('UNIQUE')) error(409, 'That username is already in use.');
			throw e;
		}
		await issue(event, id, 0);
		return json({ ok: true });
	}
	if (path === 'auth/login') {
		await limit(event, 'login');
		const u = await db
			.prepare('SELECT * FROM users WHERE username=?')
			.bind(text(o, 'username'))
			.first<{ id: string; password: string; version: number }>();
		const candidate = await hash(text(o, 'password'), u?.password);
		if (!u || !equal(candidate, u.password)) error(401, 'Username or password is incorrect.');
		await issue(event, u.id, u.version);
		return json({ ok: true });
	}
	if (path === 'auth/recovery-methods') {
		await limit(event, 'recovery-methods');
		return json({
			methods: ['passcode'],
			message: 'If this account exists, verify its recovery passcode.'
		});
	}
	if (path === 'auth/reset') {
		await limit(event, 'reset', 5);
		const u = await db
			.prepare('SELECT id,recovery FROM users WHERE username=?')
			.bind(text(o, 'username'))
			.first<{ id: string; recovery: string }>();
		const candidate = await hash(text(o, 'recovery'), u?.recovery);
		if (!u || !equal(candidate, u.recovery)) error(400, 'Recovery details could not be verified.');
		const password = text(o, 'password');
		if (!passwordValid(password)) error(400, 'Use 7–18 characters with a letter and a number.');
		await db
			.prepare('UPDATE users SET password=?,version=version+1 WHERE id=?')
			.bind(await hash(password), u.id)
			.run();
		event.cookies.delete('orach_session', { path: '/' });
		return json({ ok: true });
	}
	if (path === 'search') {
		const slug = text(o, 'city');
		if (!(await knownCity(event, slug))) error(400, 'Unknown city.');
		await limit(event, 'search', 60);
		let visitor = event.cookies.get('orach_visitor');
		if (!visitor) {
			visitor = crypto.randomUUID();
			event.cookies.set('orach_visitor', visitor, {
				path: '/',
				secure: true,
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 2592000
			});
		}
		await db
			.prepare(
				`INSERT INTO search_events(city_slug,visitor) SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM search_events WHERE city_slug=? AND visitor=? AND searched_at>datetime('now','-1 day'))`
			)
			.bind(slug, visitor, slug, visitor)
			.run();
		return json({ ok: true });
	}
	const u = await requireUser(event);
	if (path === 'profile') {
		const profile = o.profile as Record<string, unknown>;
		if (!profile || typeof profile !== 'object') error(400, 'Check your profile.');
		const home = String(profile.home ?? '').slice(0, 100),
			currency = String(profile.currency ?? '');
		if (!/^[A-Z]{3}$/.test(currency)) error(400, 'Choose a familiar currency.');
		const value = {
			home,
			homeCountry:String(profile.homeCountry||'').slice(0,80),
			homeCurrency:/^[A-Z]{3}$/.test(String(profile.homeCurrency))?profile.homeCurrency:'',
			currency,
			travellers: Math.max(1, Math.min(20, Number(profile.travellers) || 1))
		};
		await db
			.prepare(
				'INSERT INTO profiles(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data'
			)
			.bind(u.id, JSON.stringify(value))
			.run();
		return json({ ok: true });
	}
	if (path === 'stays') {
		const data = o.stay as Record<string, unknown>;
		if (!data || typeof data !== 'object' || !(await knownCity(event, data.city)))
			error(400, 'Choose a destination.');
		if (JSON.stringify(data).length > 20000) error(400, 'This stay is too large.');
		const start = Date.parse(String(data.arrival)),
			end = Date.parse(String(data.departure));
		if (
			!Number.isFinite(start) ||
			!Number.isFinite(end) ||
			end <= start ||
			(end - start) / 86400000 > 90
		)
			error(400, 'Choose valid dates for 1–90 nights.');
		for (const key of [
			'travellers',
			'accommodation',
			'food',
			'transport',
			'extras',
			'rate',
			'homeDaily'
		]) {
			const n = Number(data[key] ?? 0);
			if (!Number.isFinite(n) || n < 0 || n > 100000000)
				error(400, 'Enter valid, non-negative amounts.');
		}
		if (Number(data.travellers) < 1 || Number(data.travellers) > 20)
			error(400, 'Choose 1–20 travellers.');
		if (!/^[A-Z]{3}$/.test(String(data.currency))) error(400, 'Choose a valid currency code.');
		const id = text(o, 'id') || crypto.randomUUID();
		const existing = await db
			.prepare('SELECT user_id FROM stays WHERE id=?')
			.bind(id)
			.first<{ user_id: string }>();
		if (existing && existing.user_id !== u.id) error(403, 'This stay belongs to another account.');
		if (existing) {
			const purchase = await db
				.prepare("SELECT id FROM purchases WHERE stay_id=? AND status IN ('pending','paid')")
				.bind(id)
				.first();
			if (purchase) {
				const row = await db
					.prepare('SELECT data FROM stays WHERE id=?')
					.bind(id)
					.first<{ data: string }>();
				const old = JSON.parse(row!.data);
				if (['city', 'arrival', 'departure'].some((k) => old[k] !== data[k]))
					error(
						409,
						'This stay has an active checkout or pass. Create a new stay to change destination or dates.'
					);
			}
		}
		await db
			.prepare(
				'INSERT INTO stays(id,user_id,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP'
			)
			.bind(id, u.id, JSON.stringify(data))
			.run();
		return json({ ok: true, id });
	}
	if (path === 'comments') {
		await limit(event, 'comment:' + u.id, 12);
		const city = text(o, 'city'),
			section = text(o, 'section'),
			body = text(o, 'body');
		if (
			!(await knownCity(event, city)) ||
			!validSection(section) ||
			body.length < 10 ||
			body.length > 1200
		)
			error(400, 'Write 10–1,200 characters and choose a city section.');
		await db
			.prepare('INSERT INTO comments(id,user_id,city_slug,section,body) VALUES(?,?,?,?,?)')
			.bind(crypto.randomUUID(), u.id, city, section, body)
			.run();
		return json({ ok: true });
	}
	if (path === 'comments/like' || path === 'comments/report') {
		await limit(event, 'reaction:' + u.id, 60);
		const id = text(o, 'id');
		const comment = await db
			.prepare('SELECT user_id FROM comments WHERE id=? AND hidden=0')
			.bind(id)
			.first<{ user_id: string }>();
		if (!comment) error(404, 'Comment not found.');
		if (path.endsWith('like')) {
			if (comment.user_id === u.id) error(400, 'You cannot like your own comment.');
			const like = await db
				.prepare('SELECT 1 FROM comment_likes WHERE comment_id=? AND user_id=?')
				.bind(id, u.id)
				.first();
			if (like)
				await db
					.prepare('DELETE FROM comment_likes WHERE comment_id=? AND user_id=?')
					.bind(id, u.id)
					.run();
			else
				await db
					.prepare('INSERT INTO comment_likes(comment_id,user_id) VALUES(?,?)')
					.bind(id, u.id)
					.run();
		} else
			await db
				.prepare('INSERT OR IGNORE INTO comment_reports(comment_id,user_id) VALUES(?,?)')
				.bind(id, u.id)
				.run();
		return json({ ok: true });
	}
	if (path === 'coverage') {
		const city = text(o, 'city');
		if (!(await knownCity(event, city))) error(400, 'Unknown city.');
		await db
			.prepare('INSERT OR IGNORE INTO coverage_requests(city_slug) VALUES(?)')
			.bind(city)
			.run();
		return json({ ok: true });
	}
	if (path === 'security') {
		const password = text(o, 'password'),
			recovery = text(o, 'recovery');
		if (password && !passwordValid(password))
			error(400, 'Use 7–18 characters with a letter and a number.');
		if (recovery && !/^[a-z0-9]{8}$/.test(recovery))
			error(400, 'Recovery passcode must have 8 lowercase letters or numbers.');
		if (!password && !recovery) error(400, 'Enter a new password or recovery passcode.');
		const now = Math.floor(Date.now() / 1000);
		const count = await db
			.prepare('SELECT COUNT(*) AS n FROM password_changes WHERE user_id=? AND changed_at>?')
			.bind(u.id, now - 86400)
			.first<{ n: number }>();
		if (password && (count?.n ?? 0) >= 4)
			error(429, 'You can change your password four times in 24 hours.');
		const updates = [];
		if (password)
			updates.push(
				db
					.prepare('UPDATE users SET password=?,version=version+1 WHERE id=?')
					.bind(await hash(password), u.id),
				db.prepare('INSERT INTO password_changes(user_id,changed_at) VALUES(?,?)').bind(u.id, now)
			);
		else updates.push(db.prepare('UPDATE users SET version=version+1 WHERE id=?').bind(u.id));
		if (recovery)
			updates.push(
				db.prepare('UPDATE users SET recovery=? WHERE id=?').bind(await hash(recovery), u.id)
			);
		await db.batch(updates);
		await issue(event, u.id, u.version + 1);
		return json({ ok: true });
	}
	if (path === 'scenarios') {
		const stayId = text(o, 'stayId'),
			name = text(o, 'name');
		if (!name || name.length > 60 || !o.stay || JSON.stringify(o.stay).length > 20000)
			error(400, 'Check the scenario details.');
		const ent = await stayAccess(database(event.platform),u.id,stayId);
		if (!ent) error(403, 'An active membership or valid legacy stay pass is required.');
		await db
			.prepare(
				'INSERT INTO scenarios(id,stay_id,user_id,name,data) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM scenarios WHERE stay_id=? AND user_id=?)<3'
			)
			.bind(crypto.randomUUID(), stayId, u.id, name, JSON.stringify(o.stay), stayId, u.id)
			.run();
		const result = await db
			.prepare('SELECT name,data FROM scenarios WHERE stay_id=? AND user_id=?')
			.bind(stayId, u.id)
			.all<{ name: string; data: string }>();
		return json({
			scenarios: result.results.map((r) => ({ name: r.name, data: JSON.parse(r.data) }))
		});
	}
	if (path === 'billing-portal') return billingPortal(event,u.id);
	if (path === 'checkout') return checkout(event, u.id, text(o, 'stayId'));
	error(404, 'Not found.');
}
