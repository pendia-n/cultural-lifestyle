# Orach — a plain-language product summary

*Updated 18 November 2026. For sharing with other chats or collaborators.*

Orach helps people compare everyday life in different cities: meals, cafés, cultural experiences, shopping and practical essentials. It focuses on enjoyable local life and memorable experiences, with lighter coverage of accommodation and transport.

## How the app works

Choose two cities, how many days you would spend in each, and your traveller count. Set a routine—for example, two meals and a coffee each day, three cultural outings during the stay and two local rides a day.

Orach supplies available source-listed prices. Users can select the actual meal, drink, outing or ticket they prefer and see the cost of that same routine in both cities. They do not need to research and enter their own spending allowance for every category. Clothing and groceries are optional, specific products that users can add.

Each choice links to its source and conditions. Totals appear in local currency and convert automatically into a familiar currency, with the exchange-rate date shown. Compare uses a dropdown of supported conversion currencies, keeps a valid home-profile default (such as HKD), and offers TND. If a rate is unavailable, local prices remain visible. The sample routine is not a city average or a live booking quote. Missing prices are explicitly excluded, not treated as free, and comparisons identify which categories have prices in both cities. Accommodation needs quotes for actual dates and is separate from the lifestyle subtotal.

## City profiles

Profiles contain eight sections: Eat, Drink, Play and explore, Clothing and shopping, Essentials, Neighbourhoods, Stay, and Get around. They include available images, source links, practical details and extracted price offers with their units and restrictions.

Home and Explore show city photos from the saved galleries, using the first image and trying the next if it fails. Public pages no longer advertise preset counts. Internally, the initial import covered 32 cities across all eight sections: 256 original responses and 53 follow-ups produced 5,758 extracted price records, of which 711 qualified for routine comparisons at import. These are internal import figures, not promises of current coverage. The original research is retained. Additional focused searches have been collected to fill missing prices. Coverage varies by city and category; not every source contains a usable adult price.

## Adding a missing city

The comparison page has an inline add-city flow. Users can enter any country or territory, not only the suggestions. Local currency is inferred from existing country information where available; otherwise it needs confirmation.

Free or expired subscribers receive a saved short overview. Active Plus subscribers also commission all eight sections and images in the background, subject to research limits. Research continues if the user leaves. Saved results progressively become available and remain free for everyone to browse.

## Free and paid access

| Free | Orach Plus — US$7.99/month |
| --- | --- |
| Browse collected profiles, source links and images | Everything available free |
| Compare city offers and convert currencies | Commission missing-city section and image research within shared allowances |
| Save a current comparison to an account | Save and reopen three named comparison versions |
| Save home city, familiar currency and traveller count | Print a comparison with sources or save it as PDF |
| Add missing-city overviews | Manage membership and cancellation through the billing portal |
| Post, like and report city-section comments | Membership benefits apply while the subscription is active |

Signed-in accounts show Free or Plus based on active subscription status. Pricing marks the current plan and offers Continue comparing to signed-in users; the signup button is for visitors. Signed-in visitors to the signup and sign-in pages are redirected to their profile.

The subscription renews monthly until cancelled. Expired users cannot commission more background research. Collected city information remains publicly browsable. Paying does not make a comment more prominent or a claim more authoritative.

Existing manually entered saved plans remain available separately for people who already used them. They are no longer the main planning flow.

## Community and updates

Five unique non-author account likes qualify a comment for a labelled community highlight. Likes indicate interest rather than factual verification.

Routine research is scheduled for the 1st and 15th of each month, targeting up to ten most-searched cities from the preceding seven days. It runs only when there is an active subscriber; it does not promise that every city is refreshed twice monthly.

## Current limits

Source prices can be outdated, conditional or unavailable for a visitor's dates. Children’s tickets, optional fees and deposits should not be used as ordinary adult meal, admission or room prices. Clothing and grocery products may differ between cities. Not all images or source material have been independently reviewed.

City spelling correction and country/currency autofill are incomplete. Some categories still need more evidence. The app should show those gaps clearly rather than invent figures or claim complete coverage.

The recurring subscription configuration is implemented and checked in code. A complete real customer billing lifecycle has not been demonstrated in the project's validation work. The product's paid demand and retention also remain unproven.


## Research handoff and maintenance

The live app reads saved city research, extracted prices, and image URLs from its database. The original provider responses and follow-ups were archived there. The current checkout has no tracked preset folder; the app can build and deploy without it. Existing offline import scripts still expect the old Markdown files. To rebuild from scratch without paying for the same research again, export the archived responses or adapt those scripts to read the archive.

The research routing remains Tavily Search for Eat, Drink and Essentials; Exa Search for Play and Clothing; Exa Answer for Neighbourhoods and Stay; Firecrawl Search for Get around. New city research uses the same price extraction rules as the preset import. [APP.md](APP.md) and [RELEASE-AUDIT.md](RELEASE-AUDIT.md) retain technical and verification details.

An older public repository contained a Firecrawl credential inside tracked transport examples. That exposure was confirmed; who triggered the unexplained bank searches and how many credits they consumed were not. Removing the old files does not revoke a copied credential. Rotation status has not been verified in this handoff.

## What to do next

Freeze feature work for a two-week promotion test. Fix observed blockers in comparing, saving, or paying. On 18 November the public Compare, Explore, and Pricing pages responded successfully; this was a reachability check, not a fresh checkout or paid research test.

Send travellers choosing between real destinations straight to [Compare cities](https://orach.pendia-community.workers.dev/plan). Recruit ten people in that situation and observe whether they get a comparison they'd actually use. If people don't click, change the hook or audience. If they get stuck, fix that step. If they compare and don't return or pay, test the reason to buy before adding features. A signup does not establish recurring demand.

First promotion asset: a 25-second vertical video, **“Tokyo looked cheaper. Then I changed the meal.”** Use one short presenter take and one real screen recording. Open with Tokyo versus Manchester, show both cities with the same seven-day routine in HKD, switch the selected Tokyo meal from ¥860 to ¥4,000 across all 14 meal slots, and hold on the result before inviting viewers to compare their own cities free. Use the values shown in the recording, since rates and offers can change. Label the totals **Sample spending · accommodation excluded**. If filming only one asset, record the real app and add voiceover; the visible change is the proof.
