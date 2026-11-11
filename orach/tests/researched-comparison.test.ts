import test from 'node:test';import assert from 'node:assert/strict';
import {extractOffers} from '../src/lib/research-offers.ts';
import {cityBasket,defaultCounts,sumRows,validateComparison} from '../src/lib/comparison.ts';
const source=(text:string)=>({results:[{url:'https://example.org/tokyo/menu',title:'Tokyo lunch menu',raw_content:text}]});
test('named meal prices survive extraction with child prices and fees kept separate',()=>{
 const offers=extractOffers(source('Chef’s choice lunch (Basket set): 4,000 yen.\nChildren’s meal: 2,500 yen. Adults must order a kaiseki meal.\nPrivate room supplement: 3,000 yen.'),'eat','tokyo','JPY');
 assert.equal(offers.find(o=>o.amount===4000)?.comparable,true);
 assert.equal(offers.find(o=>o.amount===2500)?.comparable,false);
 assert.equal(offers.find(o=>o.amount===3000)?.comparable,false);
 assert(offers.every(o=>o.evidence&&o.source));
});
test('ranges preserve both limits; savings and vague daily budgets do not become meals',()=>{
 const offers=extractOffers({results:[{url:'https://example.org/menu',title:'Menu',text:'Adult lunch set: £12–15 per person.\nTotal daily budget: £31 including meals.\nTypical meal around £8.'}]},'eat','manchester','GBP');
 const meal=offers.find(o=>o.amount===12)!;assert.equal(meal.upper,15);assert(meal.comparable);assert(!offers.some(o=>o.amount===31));assert(!offers.find(o=>o.amount===8)?.comparable);
});
test('Exa highlights are read and unqualified dollar prices do not become yen',()=>{
 const offers=extractOffers({results:[{title:'Tokyo admission',url:'https://example.org/admission',highlights:['Adult museum admission: JPY 1,500 per person.','Adult admission $20.']}]},'play','tokyo','JPY');
 assert.equal(offers.length,1);assert.equal(offers[0].amount,1500);
});
test('comparison multiplies listed offers while missing prices stay excluded and explicit',()=>{
 const offers=extractOffers(source('Chef’s choice lunch: ¥4,000.'),'eat','tokyo','JPY');
 const config=validateComparison({left:'tokyo',right:'busan',days:7,travellers:2,currency:'HKD',counts:defaultCounts(),selected:{}});
 const rows=cityBasket(offers,'tokyo',config),summary=sumRows(rows);
 assert.equal(rows.find(r=>r.id==='meal')?.quantity,28);assert.equal(summary.low,112000);assert(summary.missing.includes('Coffee or tea'));assert(summary.missing.includes('Cultural outings'));
 const none=cityBasket(offers,'tokyo',{...config,selected:{'tokyo:meal':'none'}});assert.equal(none.find(r=>r.id==='meal')?.low,null);
});
test('quantities and city pairs are validated independently of client totals',()=>{
 assert.throws(()=>validateComparison({left:'tokyo',right:'tokyo',days:7,travellers:1,currency:'JPY',counts:defaultCounts()}));
 assert.throws(()=>validateComparison({left:'tokyo',right:'busan',days:-1,travellers:1,currency:'JPY',counts:defaultCounts()}));
});

test('free admission is a sourced zero while tea packages and topups stay out of unit comparisons',()=>{
 const free=extractOffers({results:[{title:'Busan museum',url:'https://example.org/museum',text:'Adult museum admission: Free.'}]},'play','busan','KRW');assert.equal(free[0].amount,0);assert(free[0].comparable);
 const tea=extractOffers({results:[{title:'Perth tea',url:'https://example.com.au/tea',text:'Afternoon tea: $79 per person including unlimited tea and coffee.'}]},'drink','perth','AUD');assert(!tea.some(o=>o.comparable));
 const topup=extractOffers(source('Suica cards are sold for 1,000 yen. Single metro ride: 180 yen.'),'transport','tokyo','JPY');assert(!topup.find(o=>o.amount===1000)?.comparable);assert(topup.find(o=>o.amount===180)?.comparable);
});
test('currency codes outside the launch collection are accepted with original source evidence',()=>{
 const a=extractOffers({results:[{title:'Oslo menu',url:'https://example.no/menu',text:'Adult lunch set: NOK 150.'}]},'eat','oslo-norway','NOK');assert.equal(a[0].currency,'NOK');assert.equal(a[0].amount,150);
});

test('three-decimal currencies do not turn a 4.500 TND meal into 4500 dinars',()=>{
 const a=extractOffers({results:[{title:'Tunis menu',url:'https://example.tn/menu',text:'Lunch set: TND 4.500.'}]},'eat','tunis-tunisia','TND');assert.equal(a[0].amount,4.5);
});

test('nearby free shuttle and restricted museum entry never become public free admission',()=>{
 const raw={results:[{title:'Visit the museum',url:'https://example.org/visit',text:'Walk to our entrance. There is a free bus to the museum.\nAdmission is free for Manchester residents only.'}]};
 assert(!extractOffers(raw,'play','manchester','GBP').some(o=>o.comparable));
});
test('tea food packages, cake and bean prices are not single drinks',()=>{
 for(const text of ['Hatters Tea (£10.50) sandwiches and choice of any brew.','コーヒープリン 690円。','コーヒー豆100g800円で販売。'])assert(!extractOffers(source(text),'drink','tokyo',text.includes('£')?'GBP':'JPY').some(o=>o.comparable));
 const cups=extractOffers(source('新宿は人気です。「ハンドドリップコーヒー」550円を注文できます。'),'drink','tokyo','JPY');assert.equal(cups[0]?.item,'ハンドドリップコーヒー');assert(cups[0]?.comparable);
});
test('tables associate adult and child columns separately and dated workshops stay out',()=>{
 const rows=extractOffers(source('| Ticket | Adult | Child |\n| --- | --- | --- |\n| Single metro ride | ¥180 | ¥90 |'),'transport','tokyo','JPY');
 assert(rows.find(o=>o.amount===180)?.comparable);assert(!rows.find(o=>o.amount===90)?.comparable);
 const event=extractOffers({results:[{title:'PLAY PARK',url:'https://example.org/events/2026/10/1',text:'Adult workshop entry: ¥2500.'}]},'play','tokyo','JPY');assert(!event[0]?.comparable);
});
test('incomplete portions and historical fares are not ordinary meals or current rides',()=>{
 assert(!extractOffers(source('Pizza slice £3.'),'eat','manchester','GBP')[0]?.comparable);
 assert(!extractOffers(source('Single trips previously cost more than £4.'),'transport','manchester','GBP')[0]?.comparable);
});

test('standalone menu prices keep their preceding product and include tax correctly',()=>{
 const drinks=extractOffers({results:[{title:'Manchester cafe menu',url:'https://example.org/menu',raw_content:'### Espresso gf\n\n£3.2\nOur signature local espresso\n\n### Latte gf\n\n£4.2'}]},'drink','manchester','GBP');
 assert(drinks.find(o=>o.amount===3.2)?.comparable);assert(drinks.find(o=>o.amount===3.2)?.item.includes('Espresso'));
 const meals=extractOffers(source('![しょうが焼定食](https://example.org/meal.jpg)\n\n890円 （税抜：**810**円）'),'eat','tokyo','JPY');
 assert(meals.find(o=>o.amount===890)?.comparable);assert(!meals.find(o=>o.amount===810)?.comparable);assert(meals.find(o=>o.amount===890)?.item.includes('しょうが焼定食'));
});
test('concession fragments and special free days are not ordinary free museum entry',()=>{
 const raw={results:[{title:'Museum admission',url:'https://example.org/museum',text:'High school students and over 70\nFree admission.\nFree admission days\nFree admission on May 19, September 21 and November 3, 2026.\n| Adults | 1,000 yen |'}]};
 const offers=extractOffers(raw,'play','tokyo','JPY');assert(!offers.some(o=>o.amount===0&&o.comparable));assert(offers.find(o=>o.amount===1000)?.comparable);
});

test('a previous cocktail description does not turn the next cocktail into a coffee',()=>{
 const data={results:[{title:'Cafe menu',url:'https://example.org/menu',text:"### Espresso Martini\n£9.5\nSophisticated espresso and coffee spirit.\n### Amaretti Sour\n£8.9\n### Espresso\n£3.2"}]};
 const offers=extractOffers(data,'drink','manchester','GBP');assert(!offers.find(o=>o.amount===8.9)?.comparable);assert(offers.find(o=>o.amount===3.2)?.comparable);
});

test('meal workshops and incomplete-tap penalties do not become routine meals or rides',()=>{
 assert(!extractOffers(source('Sushi making class with a meal: ¥9000.'),'eat','tokyo','JPY')[0]?.comparable);
 assert(!extractOffers(source('A journey tapped in and never tapped out is charged the full £4.60 and counts towards no cap.'),'transport','manchester','GBP')[0]?.comparable);
});
