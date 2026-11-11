# Orach

Orach compares everyday city life using researched, source-listed offers. The main experience is `/plan`: choose two cities, stay length, traveller count and a routine. Orach supplies prices for available meals, coffee/tea, cultural outings and local rides. Optional clothing and grocery items are explicitly selected products. Users do not need to enter category budgets.

## Comparison and price data

Full original responses are preserved in the preset files and versioned D1 archive. `research-offers.ts` reads Tavily results, Exa Search text/highlights, Exa Answer prose/structured records and Firecrawl web extracts. It extracts amounts, ranges, original currency, named items, conditions, source passages and source dates where available. `city_offers` links records to the archived response version. `research_coverage` records extracted and comparison-eligible counts per city/section.

The comparison uses selected offers and quantities, not claimed city averages. Missing prices remain excluded and explicit. A source explicitly stating free public admission is a valid zero; missing data is never silently free. Children/member concessions, optional fees, deposits, stored-value topups, parking, tea packages and vague daily budgets must not become ordinary adult unit prices. Optional clothing/grocery products are not equivalent cross-city baskets. Accommodation requires date-specific quotes and is outside the lifestyle subtotal.

Source-listed does not mean independently verified or currently bookable. Extraction is conservative and still has limitations across languages, formatting and source quality; coverage gaps remain visible. Price conditions are accessible next to each selected offer. Cross-city totals with different coverage are not ranked as like-for-like; the page identifies the common priced categories.

The original 32-city × eight-section corpus is retained. The final import contains 5,758 extracted price records, with 711 eligible for routine comparisons. A bounded additional collection produced 53 targeted price follow-ups, preserved as `presets/<city>/<section>-prices*.md` and additional archived response versions. The collection used 54 Tavily credits, 63 Firecrawl credits and US$0.112 in Exa usage, recorded in monthly usage. Rebuild offers using `node --experimental-strip-types scripts/research-tools/prepare-offers.mjs`; import the generated `research-output/offers.sql`. This rebuild makes no provider calls. Re-running the import replaces derived offers but preserves original raw research chunks.

## Access

Free users can browse profiles, sources and galleries; compare collected city offers; create an account; save their current comparison; save a simple home profile; and post, like or report section comments. Missing-city overviews require a free account.

Orach Plus costs US$7.99/month, renewing until cancelled. An active, unexpired subscription enables commissioning full new-city research, three named comparison versions, and a printable source-backed comparison summary (browser Print → Save as PDF). Printed snapshots preserve the selected offers, quantities, source links, conditions and available cached exchange rates at save time. Current saved versions reopen against available present research; an unavailable selected offer requires reselection.

Five unique non-author account likes qualify a comment as labelled community information. Likes are not fact verification. Payments do not promote comments.

Existing manually entered saved stays and legacy stay passes are preserved at `/saved-plans`; that screen is no longer the main comparison experience. Existing pass access remains scoped to its original stay.

## Research pipeline

| Sections | Function |
| --- | --- |
| Eat, Drink, Essentials | Tavily Search |
| Play, Clothing | Exa Search |
| Neighbourhood, Stay | Exa Answer |
| Transport | Firecrawl Search |

A free or expired account requesting a missing city receives an overview only. Active members also queue eight sections and images. The same offer extractor runs when background research is saved. A core section with insufficient comparable offers gets at most one focused price follow-up within shared monthly budgets; its response is archived separately and combined with the first response for extraction. Completed source requests do not imply complete price coverage. The comparison polls saved results while research runs; leaving the page does not cancel the queue.

Tavily/Firecrawl monthly allowances remain 1,000 credits each, and Exa's allowance is US$10. Reservations bound spending. Follow-up allowance exhaustion or a failed source does not invent a price. Provider attempts are bounded and interrupted jobs have leases. New-city name matching ignores punctuation/case for existing known names; general spelling correction and comprehensive country/currency resolution remain limitations.

City images and a chosen cover are stored as URLs in D1. Explore displays covers and profiles display galleries. Availability/relevance/publication rights still need judgement.

Twice-monthly scheduled research runs on the 1st and 15th at 02:00 UTC, only with at least one active subscriber. It refreshes up to ten cities by deduplicated searches in the preceding seven days. Scheduler requests share the provider request builder and raw-response/offer storage pipeline.

## Currency

Frankfurter v2 reference rates are cached daily by pair in D1. Complete familiar currency codes, including TND, load conversion automatically; blank/incomplete inputs do not fetch. The source rate date and stale-cache fallback are shown. Reference conversion excludes bank/card fees. Destination currency and familiar currency remain separate.

## Billing and accounts

Stripe Checkout is configured in code with `mode: 'subscription'` and inline monthly recurring pricing. The user confirmed the subscription lifecycle events are enabled. Live payment lifecycle testing is outside the current scope; implementation tests do not prove a real charge. No Stripe configuration changes are part of this comparison upgrade.

Session cookies are Secure, HttpOnly, SameSite=Lax and eight days. Recovery passcodes are optional at signup; supplied codes are eight lowercase letters/digits, different from the password. Keys remain server-side and must not appear in source or logs.

## Operation

There is one Cloudflare Worker, `orach`, with D1 and one research queue. Apply migrations, run `pnpm check`, `node --experimental-strip-types --test tests/*.test.ts`, and `pnpm build`, then deploy the existing Worker. The build finalizer preserves fetch, scheduled and queue handlers; never deploy after bypassing it. Never create a separate research Worker.
