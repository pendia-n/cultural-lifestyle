import {priceEvidence} from './price-evidence.ts';
// Display excerpts are bounded; complete immutable provider responses remain archived.
export function researchPreview(input:unknown):unknown{
 if(!input||typeof input!=='object')return input;
 const raw=input as Record<string,unknown>;
 if(raw.response)return {city:raw.city,response:researchPreview(raw.response)};
 let remaining=18000;
 function sources(rows:unknown){return Array.isArray(rows)?rows.map(value=>{
  const row=value as Record<string,unknown>;
  const passage=[row.text,row.markdown,row.raw_content,row.content,row.description].find(value=>typeof value==='string'&&!value.startsWith('data:'));
  const content=typeof passage==='string'?passage.slice(0,Math.min(2000,remaining)):undefined;
  remaining-=content?.length||0;
  const price_evidence=priceEvidence(passage).map(text=>{const excerpt=text.slice(0,remaining);remaining-=excerpt.length;return excerpt;}).filter(Boolean);
  return {title:row.title,url:row.url,content,price_evidence,publishedDate:row.publishedDate,description:typeof row.description==='string'?row.description.slice(0,400):undefined,highlights:Array.isArray(row.highlights)?row.highlights.filter(x=>typeof x==='string').map(x=>x.slice(0,400)).slice(0,2):undefined,error:row.error,metadata:row.metadata?{statusCode:(row.metadata as Record<string,unknown>).statusCode}:undefined};
 }):undefined;}
 return {answer:raw.answer,citations:sources(raw.citations),results:sources(raw.results),web:sources(raw.web),data:raw.data?{web:sources((raw.data as Record<string,unknown>).web)}:undefined};
}
