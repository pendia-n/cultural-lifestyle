declare global {
	interface Env {
		DB: D1Database;
		CITY_RESEARCH_QUEUE?: Queue<import("./lib/server/discovery-task").CityTask>;
		ORACH_JWT_SECRET?: string;
		STRIPE_SECRET_KEY?: string;
		STRIPE_WEBHOOK_SECRET?: string;
		ORACH_PUBLIC_ORIGIN?: string;
		ORACH_PASS_PRICE_CENTS?: string;
		TAVILY_API_KEY?: string;
		EXA_API_KEY?: string;
		FIRECRAWL_API_KEY?: string;
	}
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}
export {};
