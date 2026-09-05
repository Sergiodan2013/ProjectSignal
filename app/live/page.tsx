"use client";

import "./live.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, Radar, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Item={id:string;title:string;published:string|null;buyer:string;noticeType:string;source:string;country:string;stage:"planning"|"permit"|"procurement";relevance:number;hvacHits:number;buildingHits:number;earlyHits?:number;href:string;live:boolean};
type SourceStatus={source:string;ok:boolean;count:number;error:string|null};

export default function LivePage(){
 const [items,setItems]=useState<Item[]>([]); const [sources,setSources]=useState<SourceStatus[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [stamp,setStamp]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const r=await fetch('/api/live-projects',{cache:'no-store'});const d=await r.json();if(!d.ok)throw new Error(d.error||'All live sources unavailable');setItems(d.items||[]);setSources(d.sources||[]);setStamp(d.fetchedAt||'');}catch(e:any){setError(e?.message||String(e));}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const high=useMemo(()=>items.filter(x=>x.relevance>=70).length,[items]);
 const early=useMemo(()=>items.filter(x=>x.stage==='planning'||x.stage==='permit').length,[items]);
 const activeSources=useMemo(()=>sources.filter(x=>x.ok).length,[sources]);
 return <main className="livePage">
  <div className="liveTop"><Link href="/" className="backLink"><ArrowLeft size={16}/> Back to ProjectSignal</Link><button onClick={load} className="secondary" disabled={loading}><RefreshCw size={15}/>{loading?'Refreshing…':'Refresh live feed'}</button></div>
  <section className="liveHero"><span className="kicker"><span className="dot orange"/> LIVE DATA / BENELUX VALIDATION</span><h1>One feed across tenders, permits and planning signals.</h1><p>ProjectSignal now combines procurement-stage TenderNed data with Dutch official permit publications and public Vlaanderen RADAr/Geopunt planning layers when available. Earlier-stage signals receive a timing bonus because they are more valuable for specification sales.</p></section>
  <div className="metrics"><article className="metric"><span className="micro">LIVE MATCHES</span><strong>{loading?'—':items.length}</strong><small>deduplicated ranked signals</small></article><article className="metric"><span className="micro">EARLY-STAGE SIGNALS</span><strong>{loading?'—':early}</strong><small>planning + permit stage</small></article><article className="metric"><span className="micro">HIGH RELEVANCE</span><strong>{loading?'—':high}</strong><small>score ≥ 70</small></article><article className="metric"><span className="micro">ACTIVE SOURCES</span><strong>{loading?'—':`${activeSources}/${sources.length||3}`}</strong><small>source health is shown below</small></article></div>
  <section className="sourceStatus panel"><div className="panelHead"><div><span className="micro">SOURCE HEALTH</span><h2>Live connectors</h2></div><span className="stage">Last refresh {stamp?new Date(stamp).toLocaleString():'—'}</span></div><div className="sourceCards">{(sources.length?sources:[{source:'TenderNed',ok:false,count:0,error:null},{source:'NL Official Publications / Permits',ok:false,count:0,error:null},{source:'Vlaanderen RADAr / Geopunt',ok:false,count:0,error:null}]).map(s=><article key={s.source} className={s.ok?'sourceOk':'sourceWarn'}>{s.ok?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>}<div><b>{s.source}</b><span>{s.ok?`${s.count} matched records`:(loading?'Checking…':s.error||'Unavailable')}</span></div></article>)}</div></section>
  {error&&<div className="liveError"><AlertTriangle size={18}/><div><b>Live sources unavailable</b><span>{error}</span></div></div>}
  <section className="panel livePanel"><div className="panelHead"><div><span className="micro">UNIFIED OPPORTUNITY FEED</span><h2>Signals ranked for building-system sales</h2></div><span className="high">LIVE + DEDUPED</span></div>
   {loading?<div className="liveLoading"><Radar size={22}/> Reading public sources, normalising records and ranking signals…</div>:
   items.length===0?<p>No relevant signals were returned by the currently available sources. Check source health above and refresh later.</p>:
   <div className="tableWrap"><table><thead><tr><th>Signal</th><th>Opportunity</th><th>Stage</th><th>Authority / buyer</th><th>Published</th><th>Source</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><span className="score">{x.relevance}</span></td><td><b>{x.title}</b><span>{x.hvacHits>0?`${x.hvacHits} HVAC · `:''}{x.buildingHits} building{x.earlyHits?` · ${x.earlyHits} early-stage`:''}</span></td><td><span className={`stage stage-${x.stage}`}>{x.stage}</span></td><td>{x.buyer}</td><td>{x.published?(()=>{const d=new Date(x.published);return Number.isNaN(d.getTime())?x.published:d.toLocaleDateString()})():'—'}</td><td><a href={x.href} target="_blank" rel="noreferrer" className="sourceLink">{x.source} <ExternalLink size={13}/></a></td></tr>)}</tbody></table></div>}
  </section>
  <section className="liveNote"><b>What changed</b><p>The feed is no longer tender-only. ProjectSignal now uses stage as part of commercial relevance: planning and permit records can outrank a later procurement notice because a manufacturer still has time to influence specification. Duplicate records from multiple public sources are collapsed into one ranked signal.</p></section>
 </main>
}
