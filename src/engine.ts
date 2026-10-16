export type Direction='higher'|'lower';
export interface Indicator {id:string;name:string;pillar:string;include:boolean;direction:Direction;weight:number;unit:string;definition:string;percentileColumn?:string;imported?:boolean}
export interface Watershed {id:number;hybasId:number;wsId:number;wmz:string;basin:string;catchment:string;area:number;hasGeometry:boolean;raw:Record<string,number|null>;sourceAttributes:Record<string,unknown>;excelScore:number|null}
export interface Ranked extends Watershed {score:number|null;rank:number|null;tier:string;percentiles:Record<string,number|null>;missing:string[]}
export interface Filters {wmz:string;basin:string;catchment:string;minArea:number}
export const defaultFilters:Filters={wmz:'All',basin:'All',catchment:'All',minArea:1000};
export function normalized(indicators:Indicator[]){const sum=indicators.reduce((a,i)=>a+(i.include?i.weight:0),0);return Object.fromEntries(indicators.map(i=>[i.id,i.include&&sum>0?i.weight/sum:0]));}
export function scope(rows:Watershed[],f:Filters){return rows.filter(r=>r.area>=f.minArea&&(f.wmz==='All'||r.wmz===f.wmz)&&(f.basin==='All'||r.basin===f.basin)&&(f.catchment==='All'||r.catchment===f.catchment));}
// PERCENTRANK.INC default significance=3; equal values use first ascending index.
export function percentiles(values:number[]){const sorted=[...values].sort((a,b)=>a-b);const result=new Map<number,number>();sorted.forEach((v,i)=>{if(!result.has(v))result.set(v,values.length<2?NaN:Math.floor(i/(values.length-1)*1000+1e-10)/1000)});return result;}
export function calculate(rows:Watershed[],indicators:Indicator[]):Ranked[]{
 const weights=normalized(indicators),validWeight=indicators.some(i=>weights[i.id]>0);
 const p=Object.fromEntries(indicators.map(i=>[i.id,percentiles(rows.map(r=>r.raw[i.id]??0))]));
 const ranked:Ranked[]=rows.map(r=>{
  const ps=Object.fromEntries(indicators.map(i=>[i.id,rows.length>1?p[i.id].get(r.raw[i.id]??0)??null:null]));
  const score=!validWeight||rows.length<2?null:indicators.reduce((a,i)=>a+(weights[i.id]>0?weights[i.id]*(i.direction==='lower'?1-(ps[i.id]??0):(ps[i.id]??0)):0),0);
  return {...r,score,rank:null,tier:'Not scored',percentiles:ps,missing:indicators.filter(i=>r.raw[i.id]==null).map(i=>i.id)};
 }).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.id-b.id);
 let rank=0;ranked.forEach((r,j)=>{if(r.score!==null){if(j===0||r.score!==ranked[j-1].score)rank=j+1;r.rank=rank;r.tier=tier(rank,ranked.length);}});return ranked;
}
export function tier(rank:number,n:number){for(const p of [1,5,10,20])if(rank<=Math.ceil(n*p/100))return `Top ${p}%`;return 'Remaining';}
export function withinTier(r:Ranked,percent:number,n:number){return !percent||(r.rank!==null&&r.rank<=Math.ceil(n*percent/100));}
export const fmt=(n:number|null|undefined,d=2)=>n==null||!Number.isFinite(n)?'—':n.toLocaleString('en-US',{maximumFractionDigits:d});
