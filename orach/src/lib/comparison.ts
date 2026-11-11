import type {Offer,OfferKind} from './research-offers.ts';
export const basket=[
 {id:'meal',label:'Meals',unit:'per person / day',daily:true,default:2,section:'eat'},
 {id:'coffee',label:'Coffee or tea',unit:'per person / day',daily:true,default:1,section:'drink'},
 {id:'activity',label:'Cultural outings',unit:'per person / stay',daily:false,default:3,section:'play'},
 {id:'ride',label:'Local single rides',unit:'per person / day',daily:true,default:2,section:'transport'},
 {id:'clothing',label:'Clothing items',unit:'per person / stay',daily:false,default:0,section:'clothing'},
 {id:'grocery',label:'Grocery packs',unit:'per person / stay',daily:false,default:0,section:'essential'}
] as const;
export type BasketKind=typeof basket[number]['id'];
export type ComparisonConfig={left:string;right:string;days:number;travellers:number;currency:string;counts:Record<BasketKind,number>;selected:Record<string,string>};
export const defaultCounts=()=>Object.fromEntries(basket.map(row=>[row.id,row.default])) as Record<BasketKind,number>;
export function validateComparison(input:unknown):ComparisonConfig{
 const v=input as ComparisonConfig;if(!v||typeof v.left!=='string'||typeof v.right!=='string'||v.left===v.right||!Number.isInteger(v.days)||v.days<1||v.days>90||!Number.isInteger(v.travellers)||v.travellers<1||v.travellers>20||!/^[A-Z]{3}$/.test(v.currency))throw Error('Choose two different cities, 1–90 days, 1–20 travellers and a three-letter currency.');
 const counts=defaultCounts();for(const row of basket){const n=v.counts?.[row.id];if(!Number.isFinite(n)||n<0||n>(row.daily?10:100))throw Error('Check the quantities in your routine.');counts[row.id]=n;}
 if(Object.keys(v.selected||{}).length>32)throw Error('Too many selected offers.');
 const selected:Record<string,string>={};for(const [k,value] of Object.entries(v.selected||{})){if(k.length>160||typeof value!=='string'||value.length>180)throw Error('Check your selected offers.');selected[k]=value;}
 return {left:v.left,right:v.right,days:v.days,travellers:v.travellers,currency:v.currency,counts,selected};
}
export function candidates(offers:Offer[],kind:BasketKind){
 const optional=['clothing','grocery'].includes(kind);
 // Optional packs and garments only enter a total after the user selects the exact item.
 const directory=(o:Offer)=>/neotaste\.|tripadvisor\.|tiktok\.|instagram\.|facebook\.|coffeestics\./i.test(o.source)?1:0;
 return offers.filter(o=>o.kind===kind&&(o.comparable||optional)&&!o.from).sort((a,b)=>directory(a)-directory(b)||a.amount-b.amount).slice(0,40);
}
export function cityBasket(offers:Offer[],slug:string,config:ComparisonConfig){
 return basket.map(row=>{const pool=candidates(offers,row.id),key=slug+':'+row.id;const wanted=config.selected[key];
 const choice=pool.find(o=>o.id===wanted)||(!['clothing','grocery'].includes(row.id)&&!wanted?pool[0]:undefined);
 const rawQuantity=config.counts[row.id]*(row.daily?config.days:1)*config.travellers;const quantity=Number.isFinite(rawQuantity)&&rawQuantity>=0?rawQuantity:0;
 return {...row,pool,choice,quantity,low:quantity===0?0:choice?quantity*choice.amount:null,high:quantity===0?0:choice&&choice.upper!==null?quantity*choice.upper:null};});
}
export function sumRows(rows:ReturnType<typeof cityBasket>){return {low:rows.reduce((sum,row)=>sum+(row.low??0),0),high:rows.reduce((sum,row)=>sum+(row.high??row.low??0),0),missing:rows.filter(row=>row.quantity>0&&row.low===null).map(row=>row.label),priced:rows.filter(row=>row.quantity>0&&row.low!==null).length};}
export const comparableKinds:OfferKind[]=['meal','coffee','activity','ride'];
