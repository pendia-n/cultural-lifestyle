import type {Section} from './catalog.ts';
export type OfferKind='meal'|'coffee'|'activity'|'clothing'|'grocery'|'laundry'|'sim'|'ride'|'pass'|'stay'|'fee'|'other';
export type Offer={id:string;city:string;section:Section;name:string;item:string;amount:number;upper:number|null;currency:string;unit:string;kind:OfferKind;comparable:boolean;conditions:string;evidence:string;source:string;sourceTitle:string;sourceDate:string|null;from:boolean};
const symbols:Record<string,string>={'¥':'JPY','￥':'JPY','£':'GBP','€':'EUR','₩':'KRW','฿':'THB','₫':'VND','đ':'VND','₱':'PHP','₪':'ILS','₺':'TRY','₾':'GEL','R$':'BRL','HK$':'HKD','NT$':'TWD','S$':'SGD','A$':'AUD','AU$':'AUD','CA$':'CAD','C$':'CAD','NZ$':'NZD','Rp':'IDR','RM':'MYR','zł':'PLN','Kč':'CZK','Ft':'HUF'};
const codes='[A-Z]{3}';
const tok=`(?:${codes}|HK\\$|NT\\$|NZ\\$|AU\\$|CA\\$|A\\$|C\\$|S\\$|R\\$|Rp|RM|zł|Kč|Ft|[¥￥£€₩฿₫đ₱₪₺₾$]|yen|won|円|บาท|元|원|Dhs|dhs|د[.٫]?إ|R(?=\\s?\\d)|Rs[.]?|₹)`;
const num='\\d{1,3}(?:[ ,.]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?';
const pricePattern=new RegExp(`(${tok})\\s*(${num})|(${num})\\s*(${tok})(?![A-Za-z])`,'giu');
export function cleanText(text:string){return text.replace(/!\[([^\]]*)\]\([^)]*\)/g,(_,alt)=>/\d.{0,15}(?:yen|円|£|€|\$)/i.test(alt)?' ':alt).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\\([*_|])/g,'$1').replace(/[*_#]+/g,' ').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();}
function currency(token:string,expected:string){if((token==='¥'||token==='￥')&&expected==='CNY')return 'CNY';if(token==='$')return expected==='USD'?'USD':null;if(/Dhs|dhs|د|Rs/.test(token))return /Rs/.test(token)?'INR':['AED','MAD'].includes(expected)?expected:null;if(token==='R')return expected==='ZAR'?'ZAR':null;if(token==='₹')return 'INR';if(/yen|円/i.test(token))return 'JPY';if(token==='บาท')return 'THB';if(token==='元')return expected==='TWD'?'TWD':'CNY';if(token==='원'||token.toLowerCase()==='won')return 'KRW';if(token.toUpperCase()==='NIS')return 'ILS';return symbols[token]||token.toUpperCase();}
function numeric(text:string,code:string){let v=text.replace(/ /g,'');if(['TND','KWD','BHD','OMR','JOD','LYD','IQD'].includes(code)&&/^\d+[.,]\d{3}$/.test(v))return Number(v.replace(',','.'));if(/,\d{1,2}$/.test(v)&&!v.includes('.'))v=v.replace(',','.');else v=v.replace(/,/g,'');if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,'');const n=Number(v);return Number.isFinite(n)&&n>0&&n<1e8?n:null;}
function sources(input:unknown):{answer:unknown;rows:Record<string,any>[]} {const raw=input as any;const v=raw?.response||raw||{};let answer=v.answer;if(typeof answer==='string'){try{answer=JSON.parse(answer.replace(/^```(?:json)?\s*|\s*```$/g,''));}catch{}}
 return {answer,rows:v.citations||v.results||v.data?.web||v.web||[]};}
function classify(section:Section,text:string):{kind:OfferKind;unit:string;comparable:boolean}{
 const t=text.toLowerCase();const estimated=/\b(around|approximately|approx|typically|usually|tends to|anywhere between|average|savings|total|budget|expect to|might|about|under|often|easily sails|up to|at least|for example|example:|previously|formerly|used to|more than|less than|can run|can cost)\b/.test(t);
 const restricted=/\b(child(?:ren)?|kids?|student|senior|concession|resident|member(?:ship)?|deposit|refundable|supplement|surcharge|corkage|private room|minimum spend|service charge|add[- ]on|parking|top[- ]up|stored value|cards are sold|never tapped out|not tapped out|fail to tap|penalty|fined|fine of|cancellation|ביטול)\b|子供|小学生|儿童|學生|兒童|お子さま|こども|幼児|未就学|中学生|高校生/.test(t);
 if(estimated)return {kind:'other',unit:'indicative source estimate; not used in comparison',comparable:false};
 if(restricted)return {kind:'fee',unit:'restricted offer or additional charge',comparable:false};
 if(section==='eat')return {kind:'meal',unit:'per listed meal / person',comparable:/\b(lunch|dinner|meal|course|menu|ramen|noodle|pizza|burger|sandwich|curry|rice|sushi|bento|buffet)\b|ランチ|定食|ラーメン|午餐|套餐|便當|主餐|咖哩|Mittagsmenü|Mittagessen|pranzo|almuerzo|menú|plat du jour|menu du jour|정식|국수/.test(t)&&!/\b(class|workshop|sushi making|side|coleslaw|borscht|dessert|starter|wine|cocktail|beer|delivery|for two|two people|2 people|sharing|rolls|croissant|pastry|loaf|slice|slices|bao bun|bao buns|butty|kg|per 100)\b/.test(t)};
 if(section==='drink'){const coffee=/\b(coffee|espresso|americano|cappuccino|latte|flat white|tea|matcha|cafe|café)\b|コーヒー|ラテ|カプチーノ|紅茶|咖啡|拿鐵|caffè|cortado|Kaffee|커피|아메리카노/.test(t);return {kind:coffee?'coffee':'other',unit:coffee?'per listed drink':'per listed offer',comparable:coffee&&!/\b(cocktail|martini|liquor|bottle|beans|bag|200g|250g|500g|kg|for two|two people|unlimited|afternoon tea|high tea|per pot|person|including.*coffee|includes.*coffee|sandwich|sandwiches|scone|scones|pudding|cake|cakes|biscuits|tasting|pairing|flight)\b|\d+\s?g\b|飲み比べ|飲み放題|食べ放題|ペアリング|コース|スコーン|プリン|ケーキ|キャロット|お子さま|豆.{0,12}販売/.test(t)};}
 if(section==='play')return {kind:'activity',unit:'per person / listed admission',comparable:/\b(adults?|person|admission|entry|ticket|museum|workshop|class|tour)\b|入場|大人|成人|一般|adulte|adulto|Erwachsene|Eintritt|ingresso|entrada|성인|입장/.test(t)&&!/\b(group|private|family|per hour|per team|team of|room hire|from \d+ people)\b/.test(t)};
 if(section==='clothing')return {kind:'clothing',unit:'per listed item',comparable:false};
 if(section==='essential'){if(/\b(laundry|wash|load|launderette)\b/.test(t))return {kind:'laundry',unit:'per listed wash / load',comparable:false};if(/\b(sim|gb|data|prepaid)\b/.test(t))return {kind:'sim',unit:'per listed plan',comparable:false};return {kind:'grocery',unit:'per listed pack / quantity',comparable:false};}
 if(section==='transport'){const pass=/\b(day|daily|24[- ]?hour|weekly|7[- ]day|pass)\b/.test(t);return {kind:pass?'pass':'ride',unit:pass?'per listed pass':'per listed single ride',comparable:!pass&&/\b(single|one[- ]way|journey|ride|adult fare|flat fare|regular ticket fares|ic card fares|Einzelfahrt|Einzelfahrkarte|billet unitaire|biglietto singolo|billete sencillo|單程|单程|片道)\b/.test(t)&&!/\b(airport|taxi|uber|ferry|return|round trip|zone[s]? \d+[-–]\d+)\b/.test(t)};}
 return {kind:section==='stay'?'stay':'other',unit:section==='stay'?'listed accommodation offer; check dates':'per listed offer',comparable:false};
}
function hash(s:string){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
export function extractOffers(input:unknown,section:Section,city:string,expectedCurrency:string):Offer[]{
 const {rows,answer}=sources(input);const offers:Offer[]=[];const seen=new Set<string>();
 const add=(row:Record<string,any>,body:string)=>{
  if(!row.url||row.error||Number(row.metadata?.statusCode)>=400)return;let source:string;try{const u=new URL(row.url);if(!['https:','http:'].includes(u.protocol))return;source=u.href;}catch{return;}
  const text=cleanText(body);if(!text)return;
  if(section==='play'){
   // Match admission itself, not a nearby free bus, parking or restricted concession.
   for(const line of text.split(/\n|[。！？]|(?<=[.!?])\s+/u))if(/(?:admission|entry)\s*(?:(?:is|will be|remains|:)\s*)?free\b|free\s+(?:public\s+|general\s+|adult\s+)(?:admission|entry)\b|(?:入館料|入場料|관람료|입장료|門票)\s*[:：は]?\s*(?:無料|무료|免費|免费)/i.test(line)&&!/child|student|resident|member|with.*ticket|except|under \d|駐車|주차|小学生|子供|児童|幼児|市民|対象|for .{0,25}only|free admission days|on (?:May|September|November)|\b20\d\d\b|\b(?:day|days|aged|disabilit|caregiver|under|over)\b/i.test(line)){
    if(/^free admission\.?$/i.test(line.trim()))continue;
    const key=source+'|free|'+line.slice(0,150);if(seen.has(key))continue;seen.add(key);
    offers.push({id:`${city}-${section}-${hash(key)}`,city,section,name:String(row.title||'Free admission'),item:cleanText(String(row.title||'Free admission')).slice(0,130)+' · free admission',amount:0,upper:0,currency:expectedCurrency,unit:'free public admission',kind:'activity',comparable:true,conditions:line.slice(0,700),evidence:line.slice(0,900),source,sourceTitle:String(row.title||'Admission source'),sourceDate:row.publishedDate||null,from:false});
   }
  }
  const title=cleanText(String(row.title||new URL(source).hostname)).slice(0,160);
  const matches=[...text.matchAll(pricePattern)];
  for(let i=0;i<matches.length;i++){
   const m=matches[i],index=m.index!;const token=m[1]||m[4];
   const localDollar=token==='$'&&(['CAD','AUD','NZD','SGD'].includes(expectedCurrency))&&(new RegExp('\\b'+expectedCurrency+'\\b','i').test(text)||new RegExp(({CAD:'\\.ca',AUD:'\\.com\\.au',NZD:'\\.nz',SGD:'\\.sg'} as Record<string,string>)[expectedCurrency]+'$','i').test(new URL(source).hostname));
   const code=localDollar?expectedCurrency:currency(token,expectedCurrency);if(!code||code!==expectedCurrency)continue;
   const amount=numeric(m[2]||m[3],code);if(amount===null||/^[kKmM](?:\b|illion)/.test(text.slice(index+m[0].length)))continue;
   let start=text.lastIndexOf('\n',index)+1,end=text.indexOf('\n',index+m[0].length);if(end<0)end=text.length;
   // A source paragraph can contain many offers; use the sentence containing this amount.
   {const before=text.slice(start,index);const sentence=Math.max(before.lastIndexOf('. '),before.lastIndexOf('; '),before.lastIndexOf('。'),before.lastIndexOf('！'),before.lastIndexOf('？'));if(sentence>=0)start+=sentence+(/[。！？]/.test(before[sentence])?1:2);const tail=text.slice(index+m[0].length,end);const stop=tail.search(/[。！？]|[.!?;](?:\s|$)/);if(stop>=0)end=index+m[0].length+stop+1;}
   start=Math.max(start,index-230);end=Math.min(end,index+m[0].length+300);
   const line=text.slice(start,end).trim();if(/\(\d+\s*(?:yen|円)\s*units\)/i.test(line))continue;if(line.length<2||/\b(copyright|cookie|shipping|voucher|gift card|save up to|discount code)\b/i.test(line))continue;
   const previousLines=text.slice(Math.max(0,start-320),start).split('\n').map(v=>v.trim()).filter(Boolean).slice(-2);
   const previous=/[\u3040-\u30ff\u4e00-\u9fff]/u.test(previousLines.at(-1)||'')?previousLines.join(' · '):(previousLines.at(-1)||'');
   const next=text.slice(end,Math.min(text.length,end+200)).split('\n').filter(v=>v.trim()).slice(0,2).join(' ');
   const isTable=line.includes('|');
   const taxNet=/税抜[:：]?\s*$/.test(text.slice(Math.max(start,index-20),index));
   const scopedLine=taxNet?line:line.replace(/[（(]\s*税抜[:：][^）)]*[）)]/g,'');
   const standalone=scopedLine.replace(new RegExp(pricePattern.source,'giu'),'').replace(/税抜|税込/g,'').replace(/[()（）\s:：0-9.,|\[\]+-]/g,'').length<3;
   let context=standalone?previous+'\n'+scopedLine:scopedLine;
   if(isTable){
    const cells=line.split('|').map(v=>v.trim()),column=line.slice(0,Math.max(0,index-start)).split('|').length-1;
    const header=text.slice(Math.max(0,start-1400),start).split('\n').reverse().find(v=>v.includes('|')&&/adult|child|price|fare|ticket|大人|小児|料金|一般|成人|Erwachsene|adulte|adulto|성인/i.test(v));
    const heading=(header?.split('|')[column]?.trim()||'').replace(/\([^)]*\)/g,'');
    const cell=cells[column]||'';const offset=line.slice(0,Math.max(0,index-start)).length-(line.lastIndexOf('|',Math.max(0,index-start)-1)+1);
    const restrictedStart=cell.search(/(?:child|children|小児|小人|学生|concession)\s*[:：]/i);
    const adultCell=restrictedStart>=0&&offset<restrictedStart?cell.replace(/\([^)]*(?:child|children|小児|小人|学生)[^)]*\)/gi,''):cell;
    // A tabular child price must not inherit an adult heading from another column.
    context=[cells[1],heading,adultCell,...cells.slice(2).filter((v,j)=>j+2!==column&&!new RegExp(pricePattern.source,'iu').test(v))].filter(Boolean).join(' · ');
   }
   const from=/\b(from|starting|starts at|as low as)\s*$/i.test(text.slice(Math.max(start,index-22),index));
   let lower=amount;let upper:number|null=amount;
   const trailing=text.slice(index+m[0].length,index+m[0].length+30).match(/^\s*[-–—~〜]\s*(\d+(?:[,.]\d+)*)/);
   const leading=text.slice(Math.max(start,index-25),index).match(/(\d+(?:[,.]\d+)*)\s*[-–—~〜]\s*$/);
   if(trailing)upper=numeric(trailing[1],code);
   if(leading)lower=numeric(leading[1],code)??amount;
   const n=matches[i+1];if(n&&/^\s*[-–—~〜]\s*$/.test(text.slice(index+m[0].length,n.index))&&currency(n[1]||n[4],expectedCurrency)===code){upper=numeric(n[2]||n[3],code);i++;}
   if(upper!==null&&upper<lower)continue;
   let labelLine=line;
   if(trailing)labelLine=labelLine.replace(m[0]+trailing[0],' ');
   if(leading)labelLine=labelLine.replace(leading[0]+m[0],' ');
   if(isTable||standalone||!taxNet)labelLine=context;
   const priceOnly=labelLine.replace(new RegExp(pricePattern.source,'giu'),' ').replace(/[|:\\=–—~〜\s]+/g,' ').trim();
   if(priceOnly.length<3||priceOnly.length>220)continue;
   const otherCities=['Taipei','Tainan','Taichung','Keelung','Nuremberg','Berlin','Kyoto','Osaka','Seoul','Hiroshima','Daegu'];
   if(otherCities.some(other=>!city.includes(other.toLowerCase())&&new RegExp('\\b'+other+'\\b','i').test(line)))continue;
   if(/\b(total|savings|save up|budget|average cost|cost of living|currency|exchange rate|gdp|salary|per month|per week|per year)\b/i.test(line)&&section!=='stay')continue;
   if(section==='neighbourhood')continue;
   const classification=classify(section,context);if(taxNet){classification.kind='fee';classification.comparable=false;classification.unit='tax-exclusive reference; use the tax-inclusive menu price';}
   if(/cost of (?:food|living)|daily food budget|meal prices|food prices in|coffee drinks pricing|budget tips/i.test(title)||/ubereats\.|deliveroo\.|seamless\.|just-eat\./i.test(source))classification.comparable=false;
   if(section==='play'&&/festival|\bevent\b|開催|まつり|会期|\/events?\/|のみの出店|\d{1,2}月\d{1,2}日/i.test(title+' '+source+' '+context))classification.comparable=false;
   const japaneseItem=[...priceOnly.matchAll(/[「『]([^」』]{2,65})[」』]/gu)].at(-1)?.[1];
   const item=(japaneseItem||priceOnly).replace(/\s+/g,' ').slice(0,145);
   const key=source+'|'+item+'|'+amount;if(seen.has(key))continue;seen.add(key);
   offers.push({id:`${city}-${section}-${hash(key)}`,city,section,name:title,item,amount:lower,upper:from?null:upper,currency:code,unit:classification.unit,kind:classification.kind,comparable:classification.comparable&&!from&&([...context.matchAll(new RegExp(pricePattern.source,'giu'))].length===1||!!leading||!!trailing||upper!==lower)&&!/\b(steps|increment|discount|reduced|child|students|senior|airport|taxi)\b/i.test(context),conditions:(line+'\n'+(isTable||/tax|service|fee|charge|minimum|weekday|weekend|booking|reservation|includes|税込|税別/i.test(next)?next:'')).slice(0,700),evidence:context.slice(0,900),source,sourceTitle:title,sourceDate:row.publishedDate||row.metadata?.publishedTime||null,from});
  }
 };
 // Answer prose and structured items still require an actual returned citation.
 if(typeof answer==='string'&&rows.length){for(const block of answer.split(/\n(?=NAME:|#{1,3}\s|\d+[.)]\s)/)){const refs=[...block.matchAll(/\[(\d+)\]/g)].map(m=>rows[Number(m[1])-1]).filter(Boolean);if(refs.length===1)add(refs[0],block);}}
 if(answer&&typeof answer==='object'&&Array.isArray((answer as any).items))for(const item of (answer as any).items){const urls=(item.evidence||[]).map((e:any)=>e.source_url);const row=rows.find(r=>urls.includes(r.url));if(row)add({...row,title:item.name||row.title},[item.summary,JSON.stringify(item.details||{})].join('\n'));}
 if(answer&&typeof answer==='object'&&Array.isArray((answer as any).items))for(const item of (answer as any).items)for(const price of item.prices||[]){
  if(!Number.isFinite(price.amount)||price.amount<0||price.currency!==expectedCurrency||typeof price.excerpt!=='string')continue;
  const row=rows.find(r=>r.url===price.source_url);if(!row)continue;
  const before=offers.length;add({...row,title:item.name||row.title},String(price.name||item.name)+': '+price.excerpt+'\n'+(price.conditions||[]).join('; '));
  for(const offer of offers.slice(before)){if(offer.amount!==price.amount){offer.comparable=false;}if(price.price_type!=='standard')offer.comparable=false;if(price.unit)offer.unit=String(price.unit);if(['deposit','fee','supplement'].includes(price.price_type))offer.kind='fee';}
 }
 for(const row of rows){const body=[row.raw_content,row.markdown,row.text,row.content,row.description].find(t=>typeof t==='string'&&t.trim().length>0&&!t.startsWith('data:'))|| (Array.isArray(row.highlights)?row.highlights.filter((x:unknown)=>typeof x==='string').join('\n'):'');add(row,body);}
 return offers.sort((a,b)=>Number(b.comparable)-Number(a.comparable)).slice(0,32);
}
