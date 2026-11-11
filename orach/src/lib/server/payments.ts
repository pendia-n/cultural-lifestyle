import {subscriber} from './access.ts';
import { equal } from './auth.ts';
type CheckoutSession = {
	id: string;
	url: string | null;
	metadata?: { purchase_id?: string };
	payment_status: string;
	currency: string;
	amount_total: number;
	payment_intent: string | null;
};
type StripeEvent = {
	id: string;
	type: string;
	data: { object: CheckoutSession & { refunded?: boolean } };
};
class StripeGateway {
	private key: string;
	constructor(key: string) {this.key=key;}
	async create(data: Record<string, unknown>, id: string): Promise<CheckoutSession> {
		const form = new URLSearchParams();
		function add(prefix: string, value: unknown) {
			if (value === null || value === undefined) return;
			if (Array.isArray(value)) value.forEach((v, i) => add(`${prefix}[${i}]`, v));
			else if (typeof value === 'object')
				Object.entries(value).forEach(([k, v]) => add(prefix ? `${prefix}[${k}]` : k, v));
			else form.set(prefix, String(value));
		}
		Object.entries(data).forEach(([k, v]) => add(k, v));
		const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + this.key,
				'Stripe-Version': '2026-08-26.dahlia',
				'Idempotency-Key': id,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: form,
			signal: AbortSignal.timeout(15000)
		});
		if (!r.ok)
			error(502, 'Stripe could not open checkout. No payment was taken. Please try again.');
		return (await r.json()) as CheckoutSession;
	}
}
async function verifyEvent(body: string, signature: string, secret: string): Promise<StripeEvent> {
	const parts = signature.split(',');
	const t = parts.find((p) => p.startsWith('t='))?.slice(2);
	const sigs = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
	if (!t || Math.abs(Date.now() / 1000 - Number(t)) > 300) throw new Error('Expired signature');
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(t + '.' + body)));
	const expected = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	if (!sigs.some((sig) => equal(expected, sig))) throw new Error('Invalid signature');
	return JSON.parse(body);
}
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { database } from './db.ts';
function client(event: RequestEvent) {
	const key = event.platform?.env.STRIPE_SECRET_KEY;
	if (!key) error(503, 'Payments are not connected yet. Free planning and comments are available.');
	return new StripeGateway(key);
}
export async function checkout(event: RequestEvent, userId: string, stayId: string) {
	const env = event.platform?.env;
	if (!env?.STRIPE_WEBHOOK_SECRET || !env.ORACH_PASS_PRICE_CENTS || !env.ORACH_PUBLIC_ORIGIN)
		error(503, 'Checkout is not configured yet. Your free plan is saved.');
	const price = Number(env.ORACH_PASS_PRICE_CENTS);
	if (!Number.isInteger(price) || price < 100) error(503, 'The stay-pass price is not configured.');
	const db = database(event.platform);
	if(await subscriber(db,userId)) error(409,'Your subscription is already active.');
	const id = crypto.randomUUID();
	const stripe = client(event);
	const result = await stripe.create(
		{
			mode: 'subscription',
			line_items: [
				{
					price_data: {
						currency: 'usd',
						unit_amount: price,
						recurring: {interval:'month'},
						product_data: {
							name: 'Orach Plus',
							description:
								'Monthly membership: saved budget versions, printable trip summaries and new-city research. Renews monthly until cancelled.'
						}
					},
					quantity: 1
				}
			],
			client_reference_id: userId,
			metadata: { user_id: userId },
			subscription_data: {metadata:{user_id:userId}},
			success_url: env.ORACH_PUBLIC_ORIGIN + '/plan?payment=processing',
			cancel_url: env.ORACH_PUBLIC_ORIGIN + '/plan?payment=cancelled'
		},
		id
	);
	return json({ url: result.url });
}
export async function webhook(event: RequestEvent) {
	const secret = event.platform?.env.STRIPE_WEBHOOK_SECRET;
	if (!secret) error(503, 'Webhook is not configured.');
	const signature = event.request.headers.get('stripe-signature');
	if (!signature) error(400, 'Missing signature.');
	let stripeEvent: StripeEvent;
	try {
		stripeEvent = await verifyEvent(await event.request.text(), signature, secret);
	} catch {
		error(400, 'Invalid webhook signature.');
	}
	const db = database(event.platform);
	if (stripeEvent.type.startsWith('customer.subscription.')) {
		await syncSubscription(event, stripeEvent.data.object as unknown as Subscription);
	}
	if (await db.prepare('SELECT id FROM stripe_events WHERE id=?').bind(stripeEvent.id).first())
		return json({ received: true });
	if (
		['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(
			stripeEvent.type
		)
	) {
		const s = stripeEvent.data.object as CheckoutSession;
		if (s.payment_status === 'paid') {
			const p = await db
				.prepare(
					'SELECT p.*,s.data FROM purchases p JOIN stays s ON s.id=p.stay_id WHERE p.id=? AND p.stripe_session=?'
				)
				.bind(s.metadata?.purchase_id ?? '', s.id)
				.first<{
					id: string;
					user_id: string;
					stay_id: string;
					amount: number;
					data: string;
					status: string;
				}>();
			if (p && p.status !== 'refunded' && s.currency === 'usd' && s.amount_total === p.amount) {
				const stay = JSON.parse(p.data);
				const expires = new Date(Date.parse(stay.departure) + 7 * 86400000)
					.toISOString()
					.replace('T', ' ')
					.replace('Z', '');
				await db.batch([
					db
						.prepare("UPDATE purchases SET status='paid',payment_intent=? WHERE id=?")
						.bind(typeof s.payment_intent === 'string' ? s.payment_intent : null, p.id),
					db
						.prepare(
							'INSERT OR IGNORE INTO entitlements(purchase_id,user_id,stay_id,expires_at) VALUES(?,?,?,?)'
						)
						.bind(p.id, p.user_id, p.stay_id, expires)
				]);
			}
		}
	} else if (stripeEvent.type === 'charge.refunded') {
		const charge = stripeEvent.data.object;
		if (charge.refunded && typeof charge.payment_intent === 'string') {
			await db.batch([
				db
					.prepare(
						'UPDATE entitlements SET active=0 WHERE purchase_id IN (SELECT id FROM purchases WHERE payment_intent=?)'
					)
					.bind(charge.payment_intent),
				db
					.prepare("UPDATE purchases SET status='refunded' WHERE payment_intent=?")
					.bind(charge.payment_intent)
			]);
		}
	}
	await db.prepare('INSERT OR IGNORE INTO stripe_events(id) VALUES(?)').bind(stripeEvent.id).run();
	return json({ received: true });
}

type Subscription={id:string;status:string;metadata?:{user_id?:string};items?:{data:{current_period_end?:number}[]};current_period_end?:number};
async function syncSubscription(event:RequestEvent, incoming:Subscription){
 // Fetch authoritative Stripe state so delayed webhook delivery cannot restore cancelled access.
 const response=await fetch('https://api.stripe.com/v1/subscriptions/'+encodeURIComponent(incoming.id),{headers:{Authorization:'Bearer '+event.platform!.env.STRIPE_SECRET_KEY,'Stripe-Version':'2026-08-26.dahlia'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)error(502,'Subscription state could not be synchronized.');
 const sub=await response.json() as Subscription;
 const userId=sub.metadata?.user_id;
 if(!userId)return;
 const db=database(event.platform);
 if(!await db.prepare('SELECT id FROM users WHERE id=?').bind(userId).first())return;
 const end=Math.max(0,...(sub.items?.data||[]).map(item=>item.current_period_end||0),sub.current_period_end||0);
 await db.prepare('INSERT INTO subscriptions(id,user_id,status,current_period_end) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,current_period_end=excluded.current_period_end,updated_at=CURRENT_TIMESTAMP').bind(sub.id,userId,sub.status,end).run();
}

export async function billingPortal(event:RequestEvent,userId:string){
 const env=event.platform!.env,db=database(event.platform);
 const record=await db.prepare('SELECT id FROM subscriptions WHERE user_id=? ORDER BY updated_at DESC LIMIT 1').bind(userId).first<{id:string}>();
 if(!record)error(404,'No subscription is linked to this account.');
 const headers={Authorization:'Bearer '+env.STRIPE_SECRET_KEY,'Stripe-Version':'2026-08-26.dahlia'};
 const response=await fetch('https://api.stripe.com/v1/subscriptions/'+encodeURIComponent(record.id),{headers});
 if(!response.ok)error(502,'Could not retrieve your billing account.');
 const sub=await response.json() as {customer:string};
 const portal=await fetch('https://api.stripe.com/v1/billing_portal/sessions',{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({customer:sub.customer,return_url:env.ORACH_PUBLIC_ORIGIN+'/plan'})});
 if(!portal.ok)error(503,'Billing management is not configured yet.');
 return json(await portal.json());
}
