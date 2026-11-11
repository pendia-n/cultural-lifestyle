# Connect recurring billing

The implemented plan is Orach Plus, US$7.99/month, using inline recurring Checkout pricing. A pre-created Price ID is not required. Do not accept live customers until the sandbox flow below passes.

1. In Stripe Workbench → Webhooks, create an event destination for your account, using `https://orach.pendia-community.workers.dev/api/stripe/webhook`.
2. Select `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`. Use API version 2026-08-26.dahlia.
3. Reveal the endpoint signing secret (`whsec_…`) and enter it using `pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET`. Do not paste it into source code or logs.
4. Configure STRIPE_SECRET_KEY through the same secret command. Prefer a restricted key granting the Checkout, Subscription read, and Billing Portal permissions used by the app. Match sandbox keys to sandbox webhooks; live keys to live webhooks.
5. In Stripe Settings → Billing → Customer portal, enable subscription cancellation and payment-method updates. Enable eligible fiat and USDC methods in your Stripe payment-method configuration; eligibility determines which methods Checkout shows.
6. In a sandbox: sign up free, subscribe, verify active access and three budget versions per stay, open the printable summary, manage billing, cancel, and verify access expires at the paid period end. Simulate failed payment/renewal and confirm access is removed when status is not active. Confirm webhook retries do not duplicate access.

The app fetches current subscription state from Stripe when subscription events arrive. Subscriptions created outside this app require explicit user mapping; they cannot safely be attributed by an unverified email match.
