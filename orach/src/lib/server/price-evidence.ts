// Evidence passages, never computed totals or verified price records.
const money=/(?:[£€¥₹₩฿₫₪₱₺]|(?:USD|GBP|EUR|JPY|KRW|TWD|HKD|SGD|AUD|CAD|NZD|INR|AED|THB|MYR|ILS|ZAR|MAD|VND|PHP|TRY|PLN|HUF|GEL|BRL|EGP|R\$)\s*)\d[\d,.]*(?:\s*[–-]\s*\d[\d,.]*)?|\d[\d,.]*\s*(?:USD|GBP|EUR|JPY|KRW|TWD|HKD|SGD|AUD|CAD|NZD|INR|AED|THB|MYR|ILS|ZAR|MAD|VND|PHP|TRY|PLN|HUF|GEL|BRL|EGP)\b/g;
export function priceEvidence(text:unknown):string[]{
 if(typeof text!=='string'||text.startsWith('data:'))return[];
 const value=text.slice(0,100000),matches=[...value.matchAll(money)],result:string[]=[];
 let through=-1;
 for(const match of matches){
  const index=match.index!;if(index<=through)continue;
  const start=Math.max(0,value.lastIndexOf('\n',index-1)+1,index-200);
  const next=value.indexOf('\n',index);const end=Math.min(value.length,next<0?index+400:Math.max(next,index+200),index+500);
  result.push(value.slice(start,end).trim());through=end;
  if(result.length===2)break;
 }
 return result;
}
