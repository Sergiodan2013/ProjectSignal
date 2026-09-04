"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, Radar, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Item={id:string;title:string;published:string|null;buyer:string;noticeType:string;source:string;country:string;relevance:number;hvacHits:number;buildingHits:number;href:string;live:boolean};

export default function LivePage(){
 const [items,setItems]=useState<Item[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [stamp,setStamp]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const r=await fetch('/api/live-projects',{cache:'no-store'});const d=await r.json();if(!d.ok)throw new Error(d.error||'Feed unavailable');setItems(d.items||[]);setStamp(d.fetchedAt||'');}catch(e:any){setError(e?.message||String(e));}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const high=useMemo(()=>items.filter(x=>x.relevance>=70).length,[items]);
 return <main className="livePage">
  <div className="liveTop"><Link href="/" className="backLink"><ArrowLeft size={16}/> Back to ProjectSignal</Link><button onClick={load} className="secondary" disabled={loading}><RefreshCw size={15}/>{loading?'Refreshing…':'Refresh live feed'}</button></div>
  <section className="liveHero"><span className="kicker"><span className="dot orange"/> LIVE DATA / NETHERLANDS</span><h1>Real procurement signals from TenderNed.</h1><p>This page reads the current public TenderNed TNS feed and scores notices for building/HVAC relevance. It is the first live-data layer in ProjectSignal; permit and planning sources will be added separately because they represent an earlier sales stage.</p></section>
  <div className="metrics"><article className="metric"><span className="micro">LIVE MATCHES</span><strong>{loading?'—':items.length}</strong><small>current filtered feed</small></article><article className="metric"><span className="micro">HIGH RELEVANCE</span><strong>{loading?'—':high}</strong><small>score ≥ 70</small></article><article className="metric"><span className="micro">SOURCE</span><strong style={{fontSize:18}}>TenderNed</strong><small>public TNS webservice</small></article><article className="metric"><span className="micro">LAST REFRESH</span><strong style={{fontSize:16}}>{stamp?new Date(stamp).toLocaleString():'—'}</strong><small>15-minute server cache</small></article></div>
  {error&&<div className="liveError"><AlertTriangle size={18}/><div><b>Live source temporarily unavailable</b><span>{error}</span></div></div>}
  <section className="panel livePanel"><div className="panelHead"><div><span className="micro">LIVE OPPORTUNITY FEED</span><h2>Construction / building-system related notices</h2></div><span className="high">LIVE SOURCE</span></div>
   {loading?<div className="liveLoading"><Radar size={22}/> Reading TenderNed and scoring current notices…</div>:
   items.length===0?<p>No building/HVAC signals were found in the current page of the live feed. Refresh later; the source changes continuously.</p>:
   <div className="tableWrap"><table><thead><tr><th>Signal</th><th>Notice</th><th>Buyer</th><th>Type</th><th>Published</th><th>Source</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><span className="score">{x.relevance}</span></td><td><b>{x.title}</b><span>{x.hvacHits>0?`${x.hvacHits} HVAC term${x.hvacHits===1?'':'s'} · `:''}{x.buildingHits} building signal{x.buildingHits===1?'':'s'}</span></td><td>{x.buyer}</td><td><span className="stage">{x.noticeType}</span></td><td>{x.published?new Date(x.published).toLocaleDateString():'—'}</td><td><a href={x.href} target="_blank" rel="noreferrer" className="sourceLink">TenderNed <ExternalLink size={13}/></a></td></tr>)}</tbody></table></div>}
  </section>
  <section className="liveNote"><b>What this proves</b><p>ProjectSignal can ingest a live public source, normalize records and transform them into ranked commercial signals. Tender notices are intentionally only one layer: the highest-value manufacturer use case is usually earlier than tender, so the next source layer is permits/planning + project/news enrichment.</p></section>
 </main>
}
