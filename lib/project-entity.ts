export type LiveSignal = {
  id:string;
  title:string;
  published:string|null;
  buyer:string;
  noticeType:string;
  source:string;
  country:string;
  stage:string;
  relevance:number;
  customerScore:number;
  matchedProducts:string[];
  why:string;
  href:string;
  live:boolean;
};

export type ProjectEntity = {
  id:string;
  canonicalKey:string;
  name:string;
  country:string;
  currentStage:string;
  primaryAccount:string;
  opportunityScore:number;
  dataConfidence:number;
  matchedProducts:string[];
  signalCount:number;
  sourceCount:number;
  sources:string[];
  firstSeen:string|null;
  lastSeen:string|null;
  why:string;
  timeline:LiveSignal[];
};

const STOP = new Set([
  'the','and','for','with','from','into','new','project','projects','public','notice','works','work','contract','construction',
  'van','voor','met','een','het','de','der','den','aan','inzake','betreffende','omgevingsvergunning','vergunning','aanvraag','publicatie',
  'des','les','une','pour','avec','dans','sur','construction','marché','avis',
  'gemeente','stad','province','provincie','netherlands','nederland','belgium','belgie','belgië'
]);

function normalizeText(value:string){
  return (value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function tokens(value:string){
  return normalizeText(value).split(' ').filter(t=>t.length>=3&&!STOP.has(t));
}
function jaccard(a:string[],b:string[]){
  if(!a.length||!b.length)return 0;
  const A=new Set(a),B=new Set(b);let inter=0;for(const x of A)if(B.has(x))inter++;
  const union=new Set([...A,...B]).size;return union?inter/union:0;
}
function stageRank(stage:string){return stage==='planning'?1:stage==='permit'?2:stage==='procurement'?4:3}
function parseDate(v:string|null){if(!v)return 0;const n=Date.parse(v);return Number.isFinite(n)?n:0}
function stableHash(input:string){let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function meaningfulTitle(title:string){return tokens(title).length>=2&&normalizeText(title).length>=12}

function shouldMerge(a:LiveSignal,b:LiveSignal){
  if(a.country!==b.country)return false;
  const at=tokens(a.title),bt=tokens(b.title);if(at.length<2||bt.length<2)return false;
  const titleSim=jaccard(at,bt);
  const an=normalizeText(a.title),bn=normalizeText(b.title);
  const buyerSim=jaccard(tokens(a.buyer),tokens(b.buyer));
  if(an===bn&&meaningfulTitle(a.title))return true;
  if(titleSim>=0.74)return true;
  if(titleSim>=0.56&&buyerSim>=0.45)return true;
  const short=an.length<bn.length?an:bn,long=an.length>=bn.length?an:bn;
  if(short.length>18&&long.includes(short)&&Math.min(at.length,bt.length)>=3)return true;
  return false;
}

function bestName(signals:LiveSignal[]){
  return [...signals].sort((a,b)=>{
    const genericA=/^(omgevingsvergunning|public notice|tenderned publication)$/i.test(a.title.trim())?1:0;
    const genericB=/^(omgevingsvergunning|public notice|tenderned publication)$/i.test(b.title.trim())?1:0;
    if(genericA!==genericB)return genericA-genericB;
    return b.title.length-a.title.length;
  })[0]?.title||'Construction project';
}
function bestAccount(signals:LiveSignal[]){
  const ranked=[...signals].sort((a,b)=>{
    const ga=/public buyer|public authority|vlaamse overheid|dutch public authority/i.test(a.buyer)?1:0;
    const gb=/public buyer|public authority|vlaamse overheid|dutch public authority/i.test(b.buyer)?1:0;
    if(ga!==gb)return ga-gb;
    return b.buyer.length-a.buyer.length;
  });
  return ranked[0]?.buyer||'Account not yet identified';
}
function currentStage(signals:LiveSignal[]){
  const dated=[...signals].filter(s=>parseDate(s.published)>0).sort((a,b)=>parseDate(b.published)-parseDate(a.published));
  if(dated.length)return dated[0].stage;
  return [...signals].sort((a,b)=>stageRank(b.stage)-stageRank(a.stage))[0]?.stage||'unknown';
}

export function buildProjects(signals:LiveSignal[]):ProjectEntity[]{
  const groups:LiveSignal[][]=[];
  const ordered=[...signals].sort((a,b)=>(b.customerScore||b.relevance)-(a.customerScore||a.relevance));
  for(const signal of ordered){
    let best=-1,bestScore=0;
    for(let i=0;i<groups.length;i++){
      const rep=groups[i][0];
      if(!shouldMerge(signal,rep))continue;
      const score=jaccard(tokens(signal.title),tokens(rep.title));
      if(score>bestScore){best=i;bestScore=score}
    }
    if(best>=0)groups[best].push(signal);else groups.push([signal]);
  }

  return groups.map(group=>{
    const timeline=[...group].sort((a,b)=>parseDate(a.published)-parseDate(b.published)||stageRank(a.stage)-stageRank(b.stage));
    const name=bestName(group),primaryAccount=bestAccount(group),country=group[0]?.country||'';
    const canonicalKey=`${country}|${normalizeText(name)}|${normalizeText(primaryAccount)}`;
    const sources=[...new Set(group.map(x=>x.source))];
    const matchedProducts=[...new Set(group.flatMap(x=>x.matchedProducts||[]))];
    const base=Math.max(...group.map(x=>x.customerScore||x.relevance||0));
    const corroboration=Math.min(6,(group.length-1)*2)+Math.min(4,(sources.length-1)*2);
    const opportunityScore=Math.min(99,base+corroboration);
    const dated=group.map(x=>x.published).filter(Boolean) as string[];
    const sortedDates=[...dated].sort((a,b)=>parseDate(a)-parseDate(b));
    let confidence=42;
    confidence+=Math.min(20,group.length*5);
    confidence+=Math.min(15,sources.length*6);
    if(primaryAccount&&!/not yet identified|public buyer|public authority/i.test(primaryAccount))confidence+=10;
    if(dated.length)confidence+=7;
    if(matchedProducts.length)confidence+=6;
    confidence=Math.min(98,confidence);
    const stage=currentStage(group);
    const reasonParts=[
      matchedProducts.length?`${matchedProducts.slice(0,3).join(' · ')} matched to the active portfolio`:'Building-project relevance detected',
      group.length>1?`${group.length} public signals combined into one project`:'Single public signal — monitor for corroboration',
      stage==='planning'||stage==='permit'?'Earlier-stage influence window may still be open':'Procurement-stage action is more time-sensitive'
    ];
    return {
      id:`prj_${stableHash(canonicalKey)}`,
      canonicalKey,
      name,
      country,
      currentStage:stage,
      primaryAccount,
      opportunityScore,
      dataConfidence:confidence,
      matchedProducts,
      signalCount:group.length,
      sourceCount:sources.length,
      sources,
      firstSeen:sortedDates[0]||null,
      lastSeen:sortedDates[sortedDates.length-1]||null,
      why:reasonParts.join('. ')+'.',
      timeline
    };
  }).sort((a,b)=>b.opportunityScore-a.opportunityScore||b.dataConfidence-a.dataConfidence);
}
