import { NextRequest, NextResponse } from 'next/server';
import { GET as getLiveProjectSignals } from '../live-projects/route';
import { buildProjects, type LiveSignal } from '../../../lib/project-entity';
import { persistProjects } from '../../../lib/project-persistence';

export const runtime='nodejs';

export async function GET(req:NextRequest){
  const company=(req.nextUrl.searchParams.get('company')||'').slice(0,80);
  const products=(req.nextUrl.searchParams.get('products')||'').slice(0,600);
  const countries=(req.nextUrl.searchParams.get('countries')||'NL|BE').slice(0,40);

  try{
    const liveResponse=await getLiveProjectSignals(req);
    const data=await liveResponse.json();
    if(!liveResponse.ok||!data?.ok){
      return NextResponse.json({ok:false,error:data?.error||'Live signal layer unavailable',sources:data?.sources||[]},{status:liveResponse.status||502});
    }
    const signals=(Array.isArray(data.items)?data.items:[]) as LiveSignal[];
    const projects=buildProjects(signals);
    const persistence=await persistProjects(projects);
    const mergedSignals=projects.filter(p=>p.signalCount>1).length;
    return NextResponse.json({
      ok:true,
      generatedAt:new Date().toISOString(),
      profile:data.profile||{company,products:products.split('|').filter(Boolean),countries:countries.split('|')},
      sources:data.sources||[],
      rawSignalCount:signals.length,
      projectCount:projects.length,
      multiSignalProjectCount:mergedSignals,
      persistence,
      projects
    });
  }catch(e){
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Project entity build failed'},{status:500});
  }
}
