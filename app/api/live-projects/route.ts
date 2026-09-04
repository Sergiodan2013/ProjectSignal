import { NextResponse } from "next/server";

const HVAC_TERMS = [
  "hvac","ventilat","luchtbehandeling","warmtepomp","koeling","klimaat","installatietechniek",
  "werktuigbouw","gebouwinstallat","lucht","verwarming","wko","bms","regeltechniek","brandklep",
  "rookbeheers","chiller","airco","energie-installat","technische installatie"
];

const BUILDING_TERMS = [
  "ziekenhuis","hospital","school","onderwijs","kantoor","office","hotel","zorg","gemeentehuis",
  "sporthal","zwembad","laboratorium","lab","nieuwbouw","renovatie","vastgoed","gebouw","bouw",
  "campus","logistiek","warehouse","terminal","station"
];

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

function normalizeNotice(n:any, idx:number) {
  const hay = textOf(n).toLowerCase();
  const hvacHits = HVAC_TERMS.filter(t => hay.includes(t)).length;
  const buildingHits = BUILDING_TERMS.filter(t => hay.includes(t)).length;
  const relevance = Math.min(99, 35 + hvacHits * 16 + buildingHits * 7);
  const id = pick(n,["publicatieId","id","publicationId","uuid"]) ?? `tn-${idx}`;
  const title = pick(n,["titel","title","opdrachtNaam","naam","description"]) ?? "TenderNed publication";
  const published = pick(n,["publicatieDatum","publicationDate","datumPublicatie","date","verzenddatum"]);
  const buyer = pick(n,["aanbestedendeDienst","buyer","organisatie","contractingAuthority","organisatieNaam"]);
  const noticeType = pick(n,["publicatieType","noticeType","type","aankondigingType"]);
  return {
    id:String(id), title:textOf(title).slice(0,220), published:published ? String(published) : null,
    buyer:textOf(buyer).slice(0,180) || "Public buyer", noticeType:textOf(noticeType).slice(0,120) || "Public notice",
    source:"TenderNed", country:"NL", relevance, hvacHits, buildingHits,
    href:`https://www.tenderned.nl/aankondigingen/overzicht/${id}`,
    live:true
  };
}

export async function GET() {
  const endpoints = [
    "https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties?page=0&size=100",
    "https://www.tenderned.nl/papi/tenderned-rs-tns/publicaties?page=0&size=100"
  ];
  let lastError = "";
  for (const url of endpoints) {
    try {
      const r = await fetch(url,{headers:{"accept":"application/json","user-agent":"ProjectSignal/0.4"},next:{revalidate:900}});
      if (!r.ok) { lastError = `${r.status} ${r.statusText}`; continue; }
      const data = await r.json();
      const arr = Array.isArray(data) ? data : (data?.content ?? data?.publicaties ?? data?.items ?? data?.results ?? []);
      const normalized = arr.map(normalizeNotice)
        .filter((x:any)=>x.hvacHits>0 || x.buildingHits>0)
        .sort((a:any,b:any)=>b.relevance-a.relevance)
        .slice(0,40);
      return NextResponse.json({ok:true,source:"TenderNed TNS",fetchedAt:new Date().toISOString(),count:normalized.length,items:normalized});
    } catch (e:any) { lastError = e?.message || String(e); }
  }
  return NextResponse.json({ok:false,source:"TenderNed TNS",error:lastError,items:[]},{status:502});
}
