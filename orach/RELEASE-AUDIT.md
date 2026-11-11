# Orach comparison release audit

Updated 7 November 2026.

## Checked in this release

- Production holds 5,758 extracted source-price records across 32 cities, including 711 comparison-eligible offers. All 32 city pages and the comparison, Explore, pricing and previous-plans pages returned HTTP 200.
- Original 256 city-section responses remain archived. Additional focused responses are preserved in presets and D1. No original preset file was overwritten.
- The main comparison supplies collected prices and quantity calculations rather than asking users for category budgets. Prior manual plans remain separately available.
- A live temporary free account signed up with no recovery passcode, saved its current comparison, retrieved it, and reproduced the source-price multiplication for 28 meals. Named-version saving and printable-summary access returned 403 for that free account. Anonymous comparison access returned 401. The exact temporary account and its comparison were removed afterwards, and zero audit accounts remained.
- Browser interaction changed seven days/one traveller into three days/two travellers: meal quantity changed from 14 to 12 and the totals recalculated. Entering TND loaded both currency conversions with the reference-rate date. A 390 × 844 viewport showed the mobile bottom navigation and readable routine controls.
- Live verification found and corrected false classifications involving a free museum shuttle, restricted free entry, tea-and-food packages, coffee beans/desserts, expired workshops, partial meal portions, historical fares, and numeric table-unit headers. Explicit standalone menu prices and Japanese tax-inclusive menu prices now retain their actual item labels. These cases have regression checks.
- Forty-two tests pass, including provider routing, durable research persistence, budgets/leases, access, subscription Checkout code and the extraction/comparison regressions. Svelte checking has zero errors or warnings, and the full production build passes.
- Provider usage for the bounded additional collection: 54 Tavily credits, 63 Firecrawl credits and US$0.112 Exa. Usage is recorded once through migrations. No new provider keys or model service were introduced.
- Production continues to use one Worker with the existing D1, queue and twice-monthly schedule. No Stripe configuration was changed.

## Implemented but not claimed as proven live

- A real Stripe subscription payment, renewal, failure/cancellation lifecycle and customer portal transaction. The user confirmed webhook events are enabled; live billing testing is outside this task.
- Full paid new-city queue execution through an actual subscribed account. Fixtures cover all eight provider routes, persistence, duplicate delivery and failure handling.
- Paid named versions and printable summaries through an actual subscribed account. Free denial is verified live; paid behavior is checked in source and fixtures.
- Scheduled top-ten refresh with real active membership and independent community-comment promotion.

## Limits

The derived prices are source-listed claims with attached evidence, not an independently verified venue database. Menus and source conditions can change. Local-language extraction and source quality still limit coverage. Missing categories stay explicitly excluded; a missing price is never silently zero. Optional clothing and grocery products are not equivalent baskets, additional tax/service fees are not automatically added, and accommodation needs a date-specific quote. Image availability does not prove relevance or publication rights.
