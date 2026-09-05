import { NextResponse } from "next/server";

const HVAC_TERMS = [
  "hvac","ventilat","luchtbehandeling","warmtepomp","koeling","klimaat","installatietechniek",
  "werktuigbouw","gebouwinstallat","lucht","verwarming","wko","bms","regeltechniek","brandklep",
  "rookbeheers","chiller","airco","energie-installat","technische installatie"
];

const BUILDING_TERMS = [
  "ziekenhuis","hospital","school","onderwijs","kantoor","office","hotel","zorg","gemeentehuis",
  "sporthal","zwembad","laboratorium","lab","nieuwbouw","renovatie","vastgoed","gebouw","bouw",
  "campus","logistiek","warehouse","terminal","station","appartement","bedrijfsgebouw","industrie"
];

const EARLY_TERMS = ["aanvraag","aangevraagd","vergunning","omgevingsvergunning","stedenbouw","ontwerp","nieuwbouw","uitbreiding","verbouwing","renovatie"];

function pick(obj:any, keys:string[]) {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  return undefined;
}
function textOf(v:any):string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(textOf).join(" ");
  if (typeof v === "object") return Object.values(v).map(textOf).join(" ");
  return "";
}
function decodeXml(s:string){return s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
function tag(xml:string,names:string[]){for(const name of names){const m=xml.match(new RegExp(`<[^>]*${name}[^>]*>([\\s\\S]*?)<\\/[^>]*${name}>`,`i`));if(m?.[1])return decodeXml(m[1])}return ""}

function score(hay:string, stage:"permit"|"planning"|"procurement") {
  const l = hay.toLowerCase();
  const hvacHits = HVAC_TERMS.filter(t=>l.includes(t)).length;
  const buildingHits = BUILDING_TERMS.filter(t=>l.includes(t)).length;
  const earlyHits = EARLY_TERMS.filter(t=>l.includes(t)).length;
  const stageBonus = stage === "planning" ? 18 : stage === "permit" ? 12 : 0;
  const relevance = Math.min(99, 28 + hvacHits*15 + buildingHits*6 + earlyHits*3 + stageBonus);
  return {relevance,hvacHits,buildingHits,earlyHits};
}

function normalizeTender(n:any, idx:number) {
  const hay=textOf(n); const s=score(hay,"procurement");
  const id=pick(n,["publicatieId","id","publicationId","uuid"])??`tn-${idx}`;
  const title=pick(n,["titel","title","opdrachtNaam","naam","description"])??"TenderNed publication";
  const published=pick(n,["publicatieDatum","publicationDate","datumPublicatie","date","verzenddatum"]);
  const buyer=pick(n,["aanbestedendeDienst","buyer","organisatie","contractingAuthority","organisatieNaam"]);
  const noticeType=pick(n,["publicatieType","noticeType","type","aankondigingType"]);
  return {id:`tn-${id}`,title:textOf(title).slice(0,220),published:published?String(published):null,buyer:textOf(buyer).slice(0,180)||"Public buyer",noticeType:textOf(noticeType).slice(0,120)||"Public notice",source:"TenderNed",country:"NL",stage:"procurement",...s,href:`https://www.tenderned.nl/aankondigingen/overzicht/${id}`,live:true};
}

async function tenderNed(){
  const endpoints=["https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties?page=0&size=100","https://www.tenderned.nl/papi/tenderned-rs-tns/publicaties?page=0&size=100"];
  let err="";
  for(const url of endpoints){try{const r=await fetch(url,{headers:{accept:"application/json","user-agent":"ProjectSignal/0.5"},next:{revalidate:900}});if(!r.ok){err=`${r.status} ${r.statusText}`;continue}const data=await r.json();const arr=Array.isArray(data)?data:(data?.content??data?.publicaties??data?.items??data?.results??[]);return arr.map(normalizeTender).filter((x:any)=>x.hvacHits>0||x.buildingHits>0).slice(0,80)}catch(e:any){err=e?.message||String(e)}}
  throw new Error(err||"TenderNed unavailable");
}

async function nlPermits(){
  const params=new URLSearchParams({version:"1.2",operation:"searchRetrieve","x-connection":"oep",startRecord:"1",maximumRecords:"100",query:'(title=omgevingsvergunning or keyword="omgevingsvergunning")'});
  const url=`https://zoek.officielebekendmakingen.nl/sru/Search?${params.toString()}`;
  const r=await fetch(url,{headers:{accept:"application/xml,text/xml","user-agent":"ProjectSignal/0.5"},next:{revalidate:1800}});
  if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const xml=await r.text();
  const recs=[...xml.matchAll(/<[^>]*recordData[^>]*>([\s\S]*?)<\/[^>]*recordData>/gi)].map(m=>m[1]);
  return recs.map((rec,i)=>{
    const title=tag(rec,["title"] )||"Omgevingsvergunning";
    const desc=tag(rec,["description","abstract","subject"]);
    const buyer=tag(rec,["creator","publisher","authority"])||"Dutch public authority";
    const published=tag(rec,["date","issued","available"])||null;
    const identifier=tag(rec,["identifier"]);
    const spatial=tag(rec,["spatial","coverage"]);
    const hay=`${title} ${desc} ${buyer} ${spatial}`; const s=score(hay,"permit");
    return {id:`nlp-${identifier||i}`,title:title.slice(0,220),published,buyer:buyer.slice(0,180),noticeType:"Omgevingsvergunning",source:"NL Official Publications",country:"NL",stage:"permit",...s,href:identifier?.startsWith("http")?identifier:`https://zoek.officielebekendmakingen.nl/`,live:true};
  }).filter((x:any)=>x.buildingHits>0||x.hvacHits>0||x.earlyHits>1).slice(0,80);
}

async function flandersPlanning(){
  const base="https://www.mercator.vlaanderen.be/raadpleegdienstenmercatorpubliek/ogc/features/v1";
  const cr=await fetch(`${base}/collections?f=json`,{headers:{accept:"application/json","user-agent":"ProjectSignal/0.5"},next:{revalidate:86400}});
  if(!cr.ok) throw new Error(`${cr.status} ${cr.statusText}`);
  const cj=await cr.json();
  const collections=(cj?.collections??[]).filter((c:any)=>/omgevingsvergunning|stedenbouw|radar/i.test(`${c?.id||""} ${c?.title||""} ${c?.description||""}`)).slice(0,4);
  if(!collections.length) throw new Error("No matching public RADAr/Stedenbouw collection exposed");
  const all:any[]=[];
  for(const c of collections){
    try{
      const ir=await fetch(`${base}/collections/${encodeURIComponent(c.id)}/items?f=json&limit=100`,{headers:{accept:"application/geo+json,application/json","user-agent":"ProjectSignal/0.5"},next:{revalidate:1800}});
      if(!ir.ok) continue; const ij=await ir.json();
      for(const f of (ij?.features??[])){
        const p=f?.properties??{}; const hay=textOf(p); const s=score(hay,"planning");
        if(!(s.buildingHits>0||s.hvacHits>0||s.earlyHits>1)) continue;
        const id=pick(p,["projectnummer","dossiernummer","id","uuid"])??f?.id??`${c.id}-${all.length}`;
        const title=pick(p,["projectnaam","onderwerp","omschrijving","title","naam"])??c.title??"Vlaamse omgevingsvergunning";
        const published=pick(p,["indieningsdatum","datum","publicatiedatum","beslissingsdatum","created"]);
        const buyer=pick(p,["vergunningverlenendeoverheid","bevoegdeoverheid","gemeente","organisatie","creator"])??"Vlaamse overheid / lokaal bestuur";
        all.push({id:`be-${id}`,title:textOf(title).slice(0,220),published:published?String(published):null,buyer:textOf(buyer).slice(0,180),noticeType:textOf(pick(p,["procedure","type","projecttype"])??"Omgevingsvergunning").slice(0,120),source:"Vlaanderen RADAr / Geopunt",country:"BE",stage:"planning",...s,href:"https://www.geopunt.be/kaart",live:true});
      }
    }catch{}
  }
  return all.slice(0,100);
}

function dedupe(items:any[]){
  const seen=new Map<string,any>();
  const norm=(s:string)=>s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim().slice(0,120);
  for(const x of items){const key=`${x.country}|${norm(x.title)}|${norm(x.buyer).slice(0,45)}`;const prev=seen.get(key);if(!prev||x.relevance>prev.relevance)seen.set(key,x)}
  return [...seen.values()].sort((a,b)=>b.relevance-a.relevance);
}

export async function GET(){
  const sources=[
    {name:"TenderNed",fn:tenderNed},
    {name:"NL Official Publications / Permits",fn:nlPermits},
    {name:"Vlaanderen RADAr / Geopunt",fn:flandersPlanning}
  ];
  const results=await Promise.allSettled(sources.map(s=>s.fn()));
  const status=results.map((r,i)=>({source:sources[i].name,ok:r.status==="fulfilled",count:r.status==="fulfilled"?r.value.length:0,error:r.status==="rejected"?String(r.reason?.message||r.reason):null}));
  const items=dedupe(results.flatMap(r=>r.status==="fulfilled"?r.value:[])).slice(0,160);
  const anyOk=status.some(s=>s.ok);
  return NextResponse.json({ok:anyOk,fetchedAt:new Date().toISOString(),count:items.length,sources:status,items},{status:anyOk?200:502});
}
