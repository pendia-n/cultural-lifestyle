export async function subscriber(db:D1Database,userId:string) {
 return !!await db.prepare("SELECT id FROM subscriptions WHERE user_id=? AND status='active' AND current_period_end>? LIMIT 1").bind(userId,Math.floor(Date.now()/1000)).first();
}
export async function stayAccess(db:D1Database,userId:string,stayId:unknown){
 if(await subscriber(db,userId))return true;
 return !!await db.prepare("SELECT purchase_id FROM entitlements WHERE user_id=? AND stay_id=? AND active=1 AND expires_at>datetime('now')").bind(userId,stayId).first();
}
