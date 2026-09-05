"use client";

import "./live.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, Radar, AlertTriangle, LoaderCircle, Building2 } from "lucide-react";
import Link from "next/link";

type Analysis={company:string;hostname:string;source:"website"|"curated-fallback";categories:{name:string;applications:string;confidence:number}[];idealProjects:string[];analyzedAt:string};
type Item={id:string;title:string;published:string|null;buyer:string;noticeType:string;source:string;country:string;stage:string;relevance:number;customerScore:number;matchedProducts:string[];why:string;href:string;live:boolean};
type Source={source:string;ok:boolean;count:number;error:string|null};

const defaultProfile:Analysis={company:"Systemair",hostname:"systemair.com",source:"curated-fallback",categories:[
 {name:"Air handling units",applications:"Hospitals · hotels · offices · schools",confidence:98},
 {name:"Commercial ventilation",applications:"Broad commercial buildings",confidence:98},
 {name:"Fire & smoke ventilation",applications:"Hospitals · public buildings · logistics",confidence:94},
 {name:"Heat recovery",applications:"Energy-efficient new build · renovation",confidence:92},
],idealProjects:["Hospitals","Hotels","Offices","Schools","Public buildings","Logistics","Renovation"],analyzedAt:""};

export default function LivePage(){
 const [items,setItems]=useState<Item[]>([]); const [sources,setSources]=useState<Source[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [stamp,setStamp]=useState("");
 const [website,setWebsite]=useState("https://www.systemair.com"); const [profile,setProfile]=useState<Analysis>(defaultProfile); const [analyzing,setAnalyzing]=useState(false); const [profileError,setProfileError]=useState("");

 useEffect(()=>{try{const saved=localStorage.getItem("projectsignal-profile");if(saved){const p=JSON.parse(saved);setProfile(p);setWebsite(`https://${p.hostname}`)}}catch{}},[]);
 useEffect(()=>{load(profile)},[profile]);

 async function analyzeCompany(){
  setAnalyzing(true);setProfileError("");
  try{const r=await fetch("/api/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({website})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Analysis failed");setProfile(d);localStorage.setItem("projectsignal-profile",JSON.stringify(d));}
  catch(e:any){setProfileError(e?.message||String(e))}finally{setAnalyzing(false)}
 }

 async function load(p:Analysis){
  setLoading(true);setError("");
  try{const products=p.categories.map(x=>x.name).join("|");const qs=new URLSearchParams({company:p.company,products,countries:"NL|BE"});const r=await fetch(`/api/live-projects?${qs.toString()}`,{cache:"no-store"});const d=await r.json();if(!d.ok)throw new Error(d.error||"Feed unavailable");setItems(d.items||[]);setSources(d.sources||[]);setStamp(d.fetchedAt||"");}
  catch(e:any){setError(e?.message||String(e))}finally{setLoading(false)}
 }

 const high=useMemo(()=>items.filter(x=>x.customerScore>=80).length,[items]);
 const early=useMemo(()=>items.filter(x=>x.stage==="planning"||x.stage==="permit").length,[items]);

 return <main className="livePage">
  <div className="liveTop"><Link href="/" className="backLink"><ArrowLeft size={16}/> Back to ProjectSignal</Link><button onClick={()=>load(profile)} className="secondary" disabled={loading}><RefreshCw size={15}/>{loading?"Refreshing…":"Refresh live feed"}</button></div>

  <section className="liveHero"><span className="kicker"><span className="dot orange"/> LIVE PRODUCT-TO-PROJECT INTELLIGENCE</span><h1>Live opportunities ranked for <em>{profile.company}</em>.</h1><p>The same public project feed is scored differently for each manufacturer. ProjectSignal uses the detected portfolio to rank permits, planning signals and procurement notices by product fit and sales timing.</p></section>

  <section className="panel profileLive"><div><span className="micro">COMPANY WEBSITE</span><div className="profileLiveInput"><input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://www.company.com"/><button className="primary" onClick={analyzeCompany} disabled={analyzing}>{analyzing?<><LoaderCircle size={15} className="spin"/> Analysing…</>:<>Analyse & re-rank</>}</button></div>{profileError&&<p className="urgent">{profileError}</p>}<div className="quickProfiles"><button onClick={()=>setWebsite("https://www.systemair.com")}>Systemair</button><button onClick={()=>setWebsite("https://www.renson.net")}>Renson</button><button onClick={()=>setWebsite("https://www.zehnder.nl")}>Zehnder</button><button onClick={()=>setWebsite("https://www.daikin.be")}>Daikin</button></div></div><aside><span className="micro">ACTIVE PORTFOLIO · {profile.source==="website"?"WEBSITE-DETECTED":"CURATED FALLBACK"}</span><b>{profile.company}</b><p>{profile.categories.map(x=>x.name).join(" · ")}</p></aside></section>

  <div className="metrics"><article className="metric"><span className="micro">LIVE MATCHES</span><strong>{loading?"—":items.length}</strong><small>NL + BE current feed</small></article><article className="metric"><span className="micro">HIGH FIT FOR {profile.company.toUpperCase()}</span><strong>{loading?"—":high}</strong><small>customer score ≥ 80</small></article><article className="metric"><span className="micro">EARLY-STAGE SIGNALS</span><strong>{loading?"—":early}</strong><small>planning + permits</small></article><article className="metric"><span className="micro">LAST REFRESH</span><strong style={{fontSize:16}}>{stamp?new Date(stamp).toLocaleString():"—"}</strong><small>server-cached public sources</small></article></div>

  <section className="sourceHealth"><div className="panelHead"><div><span className="micro">SOURCE HEALTH</span><h2>Live ingestion status</h2></div></div><div className="sourceGrid">{sources.map(s=><article key={s.source} className={s.ok?"sourceOk":"sourceBad"}><span/><div><b>{s.source}</b><small>{s.ok?`${s.count} records ingested`:s.error||"Unavailable"}</small></div></article>)}</div></section>

  {error&&<div className="liveError"><AlertTriangle size={18}/><div><b>Live sources temporarily unavailable</b><span>{error}</span></div></div>}

  <section className="panel livePanel"><div className="panelHead"><div><span className="micro">CUSTOMER-SPECIFIC LIVE FEED</span><h2>Signals ranked for {profile.company}</h2></div><span className="high">LIVE + PROFILE AWARE</span></div>
   {loading?<div className="liveLoading"><Radar size={22}/> Reading public sources and recalculating {profile.company} fit…</div>:
   items.length===0?<p>No relevant signals were found in the current source window.</p>:
   <div className="tableWrap"><table><thead><tr><th>Fit</th><th>Opportunity</th><th>Matched products</th><th>Stage</th><th>Authority / buyer</th><th>Source</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><span className="score">{x.customerScore}</span></td><td><b>{x.title}</b><span>{x.why}</span></td><td>{x.matchedProducts?.length?x.matchedProducts.slice(0,2).join(" · "):"No explicit product text"}</td><td><span className={`stage stage-${x.stage}`}>{x.stage}</span></td><td><b>{x.buyer}</b><span>{x.published?(()=>{const d=new Date(x.published);return Number.isNaN(d.getTime())?x.published:d.toLocaleDateString()})():"Date unavailable"}</span></td><td><a href={x.href} target="_blank" rel="noreferrer" className="sourceLink">{x.source} <ExternalLink size={13}/></a></td></tr>)}</tbody></table></div>}
  </section>

  <section className="liveNote"><Building2 size={20}/><div><b>What changed in this version</b><p>The feed is no longer ranked only by generic HVAC relevance. Every record now receives a second score based on the active company portfolio. A ventilation manufacturer and a heat-pump manufacturer can therefore see different priorities from the same public source stream.</p></div></section>
 </main>
}
