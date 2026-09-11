import type { ProjectEntity } from './project-entity';

const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||'';

async function rest(path:string,method:string,body:unknown){
  if(!url||!serviceKey)throw new Error('Supabase persistence is not configured');
  const r=await fetch(`${url.replace(/\/$/,'')}/rest/v1/${path}`,{
    method,
    headers:{
      apikey:serviceKey,
      Authorization:`Bearer ${serviceKey}`,
      'content-type':'application/json',
      Prefer:'resolution=merge-duplicates,return=minimal'
    },
    body:JSON.stringify(body),
    cache:'no-store'
  });
  if(!r.ok)throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0,300)}`);
}

export async function persistProjects(projects:ProjectEntity[]){
  if(!url||!serviceKey)return {enabled:false,savedProjects:0,savedSignals:0,error:null as string|null};
  try{
    const now=new Date().toISOString();
    const projectRows=projects.map(p=>({
      id:p.id,
      canonical_key:p.canonicalKey,
      name:p.name,
      country:p.country,
      current_stage:p.currentStage,
      primary_account:p.primaryAccount,
      opportunity_score:p.opportunityScore,
      data_confidence:p.dataConfidence,
      matched_products:p.matchedProducts,
      signal_count:p.signalCount,
      source_count:p.sourceCount,
      sources:p.sources,
      first_seen:p.firstSeen,
      last_seen:p.lastSeen,
      updated_at:now
    }));
    if(projectRows.length)await rest('projects?on_conflict=id','POST',projectRows);

    const signalRows=projects.flatMap(p=>p.timeline.map(s=>({
      id:s.id,
      project_id:p.id,
      title:s.title,
      source:s.source,
      source_url:s.href,
      published_at:s.published,
      stage:s.stage,
      account:s.buyer,
      notice_type:s.noticeType,
      relevance:s.relevance,
      customer_score:s.customerScore,
      matched_products:s.matchedProducts,
      raw:s,
      updated_at:now
    })));
    if(signalRows.length)await rest('project_signals?on_conflict=id','POST',signalRows);
    return {enabled:true,savedProjects:projectRows.length,savedSignals:signalRows.length,error:null};
  }catch(e){
    return {enabled:true,savedProjects:0,savedSignals:0,error:e instanceof Error?e.message:String(e)};
  }
}
