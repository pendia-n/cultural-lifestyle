# Orach implementation status

Updated 7 November 2026. This file describes the current comparison release; RELEASE-AUDIT.md records what was actually checked.

The main experience now compares a researched sample routine in two cities. Users select cities, days, travellers, quantities and source-listed offers. They do not enter category spending allowances. Prices, ranges, source passages, conditions and available source dates come from the saved provider responses. Accommodation remains separate because dates and room requirements determine an actual quote. Previous manual plans remain available at /saved-plans.

The original 32-city, eight-section corpus remains intact, with 53 additional focused source-price responses preserved in presets and versioned D1 archives. Derived offers are stored in city_offers and rebuilt without provider calls. Standalone menu prices inherit their product labels, image captions retain dish names, adult/child table columns are distinguished, and Japanese tax-inclusive amounts are preferred to their tax-exclusive reference amounts. Free transport near a museum and restricted free admission do not become ordinary free entry.

Free accounts save their current comparison. An active Plus subscription enables three named comparison versions, printable source-linked snapshots and full missing-city section/image research. Free and expired accounts receive only a new-city overview. Collected profiles remain publicly browsable. Paid access is enforced on the server.

All eight provider routes remain unchanged. New-city research and scheduled refresh use the same full-response archive and offer extraction. Core new-city sections with insufficient prices may make one bounded same-provider follow-up. The comparison polls saved results; queue work continues after leaving the page. Scheduling remains the top ten cities over seven days, on the 1st and 15th, with an active-subscriber gate.

Production remains one Worker, orach, with D1 and its research queue. The build finalizer preserves fetch, scheduled and queue handlers. No additional Worker or model provider was introduced.

Stripe configuration was not changed in this release. Checkout uses a monthly recurring subscription in code. A real customer payment, renewal and subscribed-user queue cycle are not claimed as proven; live Stripe testing is outside this task.

Source-listed prices are extracted research, not independently audited current venue quotes. Some categories still have genuine evidence gaps. The comparison marks missing rows and partial totals and identifies shared priced categories. It must not be described as a complete city cost average or guaranteed booking service.
