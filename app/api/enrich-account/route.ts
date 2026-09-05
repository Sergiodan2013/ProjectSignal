import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SearchResult={title:string;url:string;snippet:string};
type Person={name:string;title:string;linkedin:string;snippet:string};
type Mention={title:string;url:string;snippet:string;source:string;published?:string};

function clean(s:string){return s.replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim()}
function absUrl(url:string){try{return new URL(url).toString()}catch{return ""}}
function safePublicUrl(raw:string){
  try{const u=new URL(raw);if(!['http:','https:'].includes(u.protocol))return null;const h=u.hostname.toLowerCase();
    if(h==='localhost'||h==='127.0.0.1'||h==='::1'||h.endsWith('.local')||/^10\./.test(h)||/^192\.168\./.test(h)||/^172\.(1[6-9]|2\d|3[0-1])\./.test(h))return null;
    return u;
  }catch{return null}
}

async function ddg(query:string,limit=8):Promise<SearchResult[]>{
  const url=`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try{
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 ProjectSignal research agent','accept':'text/html'},cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!r.ok)return [];
    const html=await r.text();
    const out:SearchResult[]=[];
    const blocks=[...html.matchAll(/<div[^>]+class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi)];
    for(const b of blocks){
      const a=b[1].match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if(!a)continue;
      let href=a[1].replace(/&amp;/g,'&');
      try{const u=new URL(href,'https://duckduckgo.com');const uddg=u.searchParams.get('uddg');if(uddg)href=decodeURIComponent(uddg)}catch{}
      if(!safePublicUrl(href))continue;
      const sn=b[1].match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)?.[1]||'';
      out.push({title:clean(a[2]),url:href,snippet:clean(sn)}); if(out.length>=limit)break;
    }
    return out;
  }catch{return []}
}

function likelyOfficial(results:SearchResult[],company:string){
  const blocked=['linkedin.com','facebook.com','instagram.com','wikipedia.org','bloomberg.com','crunchbase.com','youtube.com','x.com'];
  const needle=company.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(' ')[0];
  return results.find(r=>{try{const h=new URL(r.url).hostname.toLowerCase();return !blocked.some(b=>h.includes(b))&&(h.includes(needle)||r.title.toLowerCase().includes(company.toLowerCase()))}catch{return false}}) || results.find(r=>{try{return !blocked.some(b=>new URL(r.url).hostname.includes(b))}catch{return false}});
}

async function fetchPage(url:string){
  const safe=safePublicUrl(url);if(!safe)return '';
  try{const r=await fetch(safe.toString(),{headers:{'user-agent':'Mozilla/5.0 ProjectSignal public-data agent'},redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(7000)});if(!r.ok)return '';return (await r.text()).slice(0,450000)}catch{return ''}
}
function extractEmails(html:string){return Array.from(new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[]).filter(x=>!/(example|wixpress|sentry|cloudflare|webpack)/i.test(x)))).slice(0,8)}
function extractPhones(html:string){
  const fromTel=[...html.matchAll(/href=["']tel:([^"']+)/gi)].map(m=>clean(m[1]));
  const loose=html.replace(/<[^>]+>/g,' ').match(/(?:\+\d{1,3}[\s().-]*)?(?:\d[\s().-]*){8,13}/g)||[];
  return Array.from(new Set([...fromTel,...loose].map(x=>x.trim()).filter(x=>x.replace(/\D/g,'').length>=8))).slice(0,6)
}
function extractLinkedin(html:string){return Array.from(new Set([...html.matchAll(/href=["']([^"']*linkedin\.com\/(?:company|in)\/[^"'#?]+)/gi)].map(m=>m[1].replace(/&amp;/g,'&')))).slice(0,10)}
function titleOf(html:string){return clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'')}

async function enrichWebsite(website:string){
  const u=safePublicUrl(website);if(!u)return {emails:[],phones:[],linkedin:[],pages:[],title:''};
  const base=`${u.protocol}//${u.host}`;
  const paths=['/','/contact','/contact-us','/about','/about-us','/team','/management'];
  const pages:any[]=[];let all='';
  for(const p of paths){const url=p==='/'?base:`${base}${p}`;const html=await fetchPage(url);if(!html)continue;all+=` ${html}`;pages.push({url,title:titleOf(html)});if(all.length>900000)break;}
  return {emails:extractEmails(all),phones:extractPhones(all),linkedin:extractLinkedin(all),pages:pages.slice(0,6),title:titleOf(all)};
}

async function newsRss(company:string):Promise<Mention[]>{
  const url=`https://www.bing.com/news/search?q=${encodeURIComponent('"'+company+'"')}&format=rss`;
  try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 ProjectSignal'},cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)return[];const xml=await r.text();const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0,8);return items.map(m=>{const x=m[1];const tag=(n:string)=>clean(x.match(new RegExp(`<${n}>([\\s\\S]*?)<\\/${n}>`,'i'))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g,'')||'');const link=tag('link');let source='Web';try{source=new URL(link).hostname.replace(/^www\./,'')}catch{}return{title:tag('title'),url:link,snippet:tag('description'),published:tag('pubDate'),source}}).filter(x=>x.url)}catch{return[]}
}

export async function GET(req:NextRequest){
  const company=(req.nextUrl.searchParams.get('company')||'').trim().slice(0,120);
  const country=(req.nextUrl.searchParams.get('country')||'').trim().slice(0,10);
  if(!company)return NextResponse.json({ok:false,error:'company is required'},{status:400});

  const officialResults=await ddg(`"${company}" ${country} official website contact`,10);
  const official=likelyOfficial(officialResults,company);
  const website=official?.url?(()=>{try{const u=new URL(official.url);return `${u.protocol}//${u.host}`}catch{return official.url}})():'';
  const site=website?await enrichWebsite(website):{emails:[],phones:[],linkedin:[],pages:[],title:''};

  const peopleSearch=await ddg(`site:linkedin.com/in "${company}" (director OR manager OR engineer OR procurement OR project)`,10);
  const people:Person[]=peopleSearch.filter(x=>/linkedin\.com\/in\//i.test(x.url)).slice(0,6).map(x=>{
    const parts=x.title.split(/[-|–—]/).map(s=>s.trim()).filter(Boolean);
    return {name:parts[0]||x.title,title:parts.slice(1).join(' · ')||'Relevant professional',linkedin:x.url,snippet:x.snippet};
  });

  const companyLinkedin=site.linkedin.find((x:string)=>/linkedin\.com\/company\//i.test(x)) || (await ddg(`site:linkedin.com/company "${company}"`,3)).find(x=>/linkedin\.com\/company\//i.test(x.url))?.url || '';
  const mentions=await newsRss(company);
  const webMentions=(await ddg(`"${company}" project OR construction OR expansion OR appointment`,8)).filter(x=>!x.url.includes('linkedin.com')).slice(0,5).map(x=>{let source='Web';try{source=new URL(x.url).hostname.replace(/^www\./,'')}catch{}return{...x,source}});

  const domains=officialResults.slice(0,6).map(x=>x.url);
  return NextResponse.json({
    ok:true,company,country,researchedAt:new Date().toISOString(),
    website:website||null,
    websiteTitle:site.title||official?.title||null,
    phones:site.phones,
    emails:site.emails,
    linkedinCompany:companyLinkedin||null,
    people,
    mentions:[...mentions,...webMentions].slice(0,10),
    evidence:{officialSearch:domains,scannedPages:site.pages},
    confidence:{website:website?82:25,contacts:(site.emails.length||site.phones.length)?78:30,people:people.length?65:20,mentions:(mentions.length||webMentions.length)?72:25}
  });
}
