"use client";

import { ArrowRight, CircleDollarSign, Crosshair, Gauge, LoaderCircle, Menu, Radar, Search, SlidersHorizontal, Sparkles, Target, X } from "lucide-react";
import { useMemo, useState } from "react";

type View = "overview" | "opportunities" | "profile" | "project" | "market" | "pricing";
type Analysis = { company:string; hostname:string; source:"website"|"curated-fallback"; categories:{name:string;applications:string;confidence:number}[]; idealProjects:string[]; analyzedAt:string };

type Opportunity = {name:string;place:string;type:string;stage:string;base:number;value:string;timing:string;needs:string[]};

const nav = [["overview","Overview",Radar],["opportunities","Opportunities",Crosshair],["profile","Market profile",SlidersHorizontal],["market","Market intelligence",Gauge],["pricing","ROI & pricing",CircleDollarSign]] as const;

const projects: Opportunity[] = [
 {name:"Erasmus MC — New Campus",place:"Rotterdam, NL",type:"Hospital & research",stage:"Design",base:91,value:"€1.8–3.3M",timing:"Engage now",needs:["Air handling units","Commercial ventilation","Heat recovery","Chillers","Heat pumps","Controls / BMS","Fire & smoke ventilation"]},
 {name:"ETZ Elisabeth — Phase 2",place:"Tilburg, NL",type:"Hospital",stage:"Design",base:89,value:"€1.1–2.0M",timing:"Engage now",needs:["Air handling units","Commercial ventilation","Heat recovery","Chillers","Heat pumps","Fire & smoke ventilation"]},
 {name:"Airport Business District",place:"Brussels, BE",type:"Hotel + office + transport",stage:"Design",base:84,value:"€450–900k",timing:"Engage now",needs:["Air handling units","Commercial ventilation","Heat recovery","Heat pumps","VRF / VRV","Controls / BMS"]},
 {name:"Lumière",place:"Rotterdam, NL",type:"Mixed-use",stage:"Development",base:78,value:"€300–650k",timing:"1–3 months",needs:["Commercial ventilation","Heat recovery","Heat pumps","VRF / VRV","Air distribution"]},
 {name:"Bravis Hospital",place:"West-Brabant, NL",type:"All-electric hospital",stage:"Contractor selected",base:77,value:"€700k–1.4M",timing:"Target integrator",needs:["Air handling units","Commercial ventilation","Heat recovery","Heat pumps","Controls / BMS"]},
];

const defaultAnalysis: Analysis = {
 company:"Systemair",hostname:"systemair.com",source:"curated-fallback",
 categories:[
  {name:"Air handling units",applications:"Hospitals · hotels · offices · schools",confidence:98},
  {name:"Commercial ventilation",applications:"Broad commercial buildings",confidence:98},
  {name:"Fire & smoke ventilation",applications:"Hospitals · public buildings · logistics",confidence:94},
  {name:"Heat recovery",applications:"Energy-efficient new build · renovation",confidence:92},
 ],
 idealProjects:["Hospitals","Hotels","Offices","Schools","Public buildings","Logistics","Renovation"], analyzedAt:""
};

function Metric({label,value,note}:{label:string;value:string;note:string}){return <article className="metric"><span className="micro">{label}</span><strong>{value}</strong><small>{note}</small></article>}

export default function Home(){
 const [view,setView]=useState<View>("overview");
 const [open,setOpen]=useState(false);
 const [website,setWebsite]=useState("https://www.systemair.com");
 const [analysis,setAnalysis]=useState<Analysis>(defaultAnalysis);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const go=(v:View)=>{setView(v);setOpen(false);window.scrollTo({top:0,behavior:"instant"})};

 const ranked = useMemo(()=>{
  const cats = new Set(analysis.categories.map(c=>c.name));
  return projects.map(p=>{
   const matches=p.needs.filter(n=>cats.has(n));
   const score=Math.min(99,p.base+matches.length*2);
   return {...p,score,matches};
  }).sort((a,b)=>b.score-a.score);
 },[analysis]);

 const top=ranked[0];
 const relevant=ranked.filter(x=>x.score>=80).length;
 const actionNow=ranked.filter(x=>x.score>=85&&x.timing==="Engage now").length;
 const company=analysis.company||analysis.hostname;

 async function analyze(){
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({website})});
   const data=await r.json();
   if(!r.ok) throw new Error(data.error||"Analysis failed");
   setAnalysis(data);go("opportunities");
  }catch(e){setError(e instanceof Error?e.message:"Analysis failed")}finally{setLoading(false)}
 }

 return <div className="shell">
  <aside className={`sidebar ${open?"open":""}`}>
   <div className="brandRow"><button className="brand" onClick={()=>go("overview")}><span className="brandMark"><Radar size={20}/></span>PROJECTSIGNAL</button><button className="icon mobile" onClick={()=>setOpen(false)}><X size={18}/></button></div>
   <div className="workspace"><span className="micro inverse">WORKSPACE</span><b>Benelux / Building systems</b><span>{company} profile</span></div>
   <nav>{nav.map(([id,label,Icon])=><button key={id} className={view===id?"active":""} onClick={()=>go(id)}><Icon size={17}/>{label}</button>)}</nav>
   <div className="sideFoot"><span className="dot"/><div><b>Live validation demo</b><span>Website-derived profile + modelled opportunities</span></div></div>
  </aside>
  <main>
   <header className="topbar"><button className="icon mobile" onClick={()=>setOpen(true)}><Menu size={19}/></button><span className="micro">PROJECTSIGNAL / {view.toUpperCase()}</span><button className="textBtn" onClick={()=>go("profile")}>Edit profile <ArrowRight size={15}/></button></header>

   {view==="overview"&&<section className="page">
    <div className="hero"><div><span className="kicker"><span className="dot orange"/> PRODUCT OPPORTUNITY INTELLIGENCE</span><h1>Know which projects need your products <em>before procurement starts.</em></h1><p>ProjectSignal turns fragmented construction activity into a ranked sales pipeline: product fit, modelled value, influence window and the stakeholder your team should approach next.</p><div className="actions"><button className="primary" onClick={()=>go("profile")}>Analyse my company <ArrowRight size={16}/></button><button className="secondary" onClick={()=>go("opportunities")}>See current pipeline</button></div></div>
    <div className="railCard"><div className="railHead"><span className="micro inverse">TOP SIGNAL FOR {company.toUpperCase()}</span><span>{top.score} / 100</span></div><div className="railProject"><b>{top.name}</b><small>{top.place} · {top.type}</small></div><div className="rail">{["Concept","Design","Specification","Tender","Installation"].map((s,i)=><div className={`${i===1?"current":""} ${i<1?"done":""}`} key={s}><span/><b>{s}</b>{i===1&&<small>Influence window open</small>}</div>)}</div><div className="railAction"><span className="micro inverse">NEXT COMMERCIAL MOVE</span><b>{top.timing==="Engage now"?"Engage engineering/specification team now":top.timing}</b><small>Matched products: {top.matches.slice(0,3).join(" · ")||"Commercial building systems"}</small></div></div></div>
    <div className="thesis"><article><span className="micro">TRADITIONAL DATABASE</span><b>Shows what is being built.</b><p>Projects, filters and contacts. Sales still researches relevance.</p></article><article className="accent"><span className="micro">PROJECTSIGNAL</span><b>Shows what {company} should pursue.</b><p>Company × Product × Project × Timing → one ranked signal.</p></article><article><span className="micro">ACTION LAYER</span><b>Who to influence, and when.</b><p>Stage-aware route to architect, engineer, MEP, contractor or integrator.</p></article></div>
   </section>}

   {view==="profile"&&<section className="page"><div className="intro"><div><span className="micro">LIVE COMPANY ANALYSIS</span><h1>Start with the company website, not a maze of filters.</h1><p>For this MVP, ProjectSignal fetches public website content, detects building-system product categories and uses them to re-rank the demo opportunity dataset.</p></div></div><div className="profileGrid"><div className="form"><label>COMPANY WEBSITE<input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://www.company.com"/></label><div><span className="micro">TRY THESE LIVE DEMOS</span><div className="actions"><button className="secondary" onClick={()=>setWebsite("https://www.systemair.com")}>Systemair</button><button className="secondary" onClick={()=>setWebsite("https://www.renson.net")}>Renson</button><button className="secondary" onClick={()=>setWebsite("https://www.zehnder.nl")}>Zehnder</button><button className="secondary" onClick={()=>setWebsite("https://www.daikin.be")}>Daikin</button></div></div>{error&&<p className="urgent">{error}</p>}<button className="primary" onClick={analyze} disabled={loading}>{loading?<><LoaderCircle size={16} className="spin"/> Analysing website…</>:<>Analyse portfolio & find signals <ArrowRight size={16}/></>}</button><p><small>Some enterprise sites block server-side fetches. For selected validation companies, ProjectSignal falls back to a curated product profile and labels that source transparently.</small></p></div>
    <aside className="derived"><span className="micro">CURRENT PROFILE · {analysis.source==="website"?"WEBSITE-DETECTED":"CURATED FALLBACK"}</span><h2>{company}</h2>{analysis.categories.map(x=><div key={x.name}><b>{x.name}</b><span>{x.applications} · confidence {x.confidence}%</span></div>)}<section><b>Ideal project signals</b><p>{analysis.idealProjects.join(" · ")}</p></section></aside></div></section>}

   {view==="opportunities"&&<section className="page"><div className="intro"><div><span className="micro">PIPELINE FOR {company.toUpperCase()}</span><h1>Projects worth a sales conversation.</h1><p>Scores are recalculated against the detected product portfolio. Project values remain clearly labelled as modelled demo estimates.</p></div><button className="primary" onClick={()=>go("profile")}>Analyse another company</button></div><div className="metrics"><Metric label="HIGH-FIT DEMO PROJECTS" value={String(relevant)} note="score ≥ 80"/><Metric label="PRODUCT CATEGORIES" value={String(analysis.categories.length)} note="website/profile derived"/><Metric label="TOP OPPORTUNITY" value={String(top.score)} note="company-specific score"/><Metric label="ACTION NOW" value={String(actionNow)} note="open influence window"/></div><div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Search projects, cities, companies…"/></div><button className="secondary"><SlidersHorizontal size={15}/> Filters</button></div><div className="tableWrap"><table><thead><tr><th>Score</th><th>Project</th><th>Matched products</th><th>Stage</th><th>Modelled potential</th><th>Timing</th></tr></thead><tbody>{ranked.map((r,i)=><tr key={r.name} className={i===0?"clickable":""} onClick={()=>i===0&&go("project")}><td><span className="score">{r.score}</span></td><td><b>{r.name}</b><span>{r.place} · {r.type}</span></td><td>{r.matches.length?r.matches.slice(0,2).join(" · "):"General building systems"}</td><td><span className="stage">{r.stage}</span></td><td className="money">{r.value}</td><td className={r.timing==="Engage now"?"urgent":""}>{r.timing}</td></tr>)}</tbody></table></div><div className="ask"><div><Sparkles size={17}/><span className="micro inverse">ASK PROJECTSIGNAL</span></div><input defaultValue={`Show the strongest projects for ${company} where specification may still be open`}/><button>Ask</button></div></section>}

   {view==="project"&&<section className="page"><button className="back" onClick={()=>go("opportunities")}>← Back to opportunities</button><div className="projectHead"><div><span className="micro">QUALIFIED OPPORTUNITY / {company.toUpperCase()}</span><h1>{top.name}</h1><p>{top.place} · {top.type} · {top.stage}</p></div><div className="bigScore"><span>OPPORTUNITY SCORE</span><strong>{top.score}</strong><small>/100</small></div></div><div className="projectGrid"><div><section className="panel"><div className="panelHead"><h2>Why this project matches {company}</h2><span className="high">HIGH SIGNAL</span></div>{top.matches.length?top.matches.map(x=><div className="reason" key={x}><span>✓</span>{x} detected in portfolio and relevant to this project type</div>):<div className="reason"><span>✓</span>Commercial building systems overlap detected</div>}</section><section className="panel"><div className="panelHead"><h2>What the sales team could pursue</h2><span className="micro">MODELLED — NOT PROCUREMENT DATA</span></div><table><thead><tr><th>Matched product family</th><th>Portfolio confidence</th><th>Commercial interpretation</th></tr></thead><tbody>{analysis.categories.filter(c=>top.needs.includes(c.name)).map(c=><tr key={c.name}><td>{c.name}</td><td>{c.confidence}%</td><td>Relevant for specification review</td></tr>)}</tbody></table></section></div><aside><section className="value"><span className="micro inverse">MODELLED PROJECT OPPORTUNITY</span><strong>{top.value}</strong><p>Illustrative addressable range for validation. Not a published procurement value.</p></section><section className="panel"><h2>Signal rail</h2><div className="compactRail">{["Concept","Design","Specification","Tender","Install"].map((s,i)=><div className={`${i===1?"current":""} ${i<1?"done":""}`} key={s}><span/><b>{s}</b>{i===1&&<small>YOU ARE HERE</small>}</div>)}</div><div className="actionBox"><span className="micro">RECOMMENDED ACTION</span><b>{top.timing}</b><p>Prioritise specification stakeholders while requirements remain influenceable.</p></div></section><section className="panel"><h2>Who to approach</h2><div className="stake"><span>Owner</span><b>Erasmus MC</b></div><div className="stake"><span>Engineering adviser</span><b>Arcadis</b></div><div className="stake"><span>Technical consultants</span><b>Deerns · Haskoning · Peutz</b></div></section></aside></div></section>}

   {view==="market"&&<section className="page"><div className="intro"><div><span className="micro">MARKET INTELLIGENCE</span><h1>See the market your CRM does not.</h1><p>Current MVP demonstrates portfolio-aware coverage and timing for {company}.</p></div></div><div className="metrics"><Metric label="DETECTED CATEGORIES" value={String(analysis.categories.length)} note="company portfolio"/><Metric label="HIGH-FIT PROJECTS" value={String(relevant)} note="demo dataset"/><Metric label="BEST SCORE" value={String(top.score)} note="current company"/><Metric label="SOURCE" value={analysis.source==="website"?"LIVE":"FALLBACK"} note="profile provenance"/></div><section className="darkCallout"><Target size={24}/><span className="micro inverse">THE COMMERCIAL QUESTION</span><h2>Which opportunities deserve {company}'s sales capacity this quarter?</h2><p>The next data phase expands this from a curated validation set to continuously collected BE/NL permits, project news, tenders and stakeholder changes.</p></section></section>}

   {view==="pricing"&&<section className="page"><div className="intro"><div><span className="micro">ROI & PRICING</span><h1>Priced against intelligence budgets, justified by one incremental win.</h1><p>The product is aimed at specification/project sales where a single commercial opportunity can be worth six figures.</p></div></div><div className="prices"><article><span className="micro">PILOT</span><strong>€500</strong><small>30 days</small><p>One market · one portfolio · weekly qualified opportunities.</p></article><article><span className="micro">PROFESSIONAL</span><strong>€499</strong><small>/ month</small><p>One country · one product line · 3 users.</p></article><article className="featured"><span className="micro inverse">GROWTH</span><strong>€899</strong><small>/ month</small><p>Benelux · multiple product lines · CRM sync · market analytics.</p></article><article><span className="micro">ENTERPRISE</span><strong>€1.5k+</strong><small>/ month</small><p>Multiple countries · API · custom scoring and enrichment.</p></article></div><section className="roi"><div><span className="micro">SIMPLE ROI EXAMPLE</span><h2>One €150k equipment win at 25% gross margin = €37.5k margin.</h2><p>A €10,788 annual Growth subscription can be justified by substantially less than one additional average win.</p></div><div><strong>~3.5×</strong><span>gross-margin return from one incremental €150k deal</span></div></section></section>}
  </main>
 </div>
}
