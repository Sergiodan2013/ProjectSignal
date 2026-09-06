import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Category = { name: string; applications: string; confidence: number };
type Profile = { company:string; hostname:string; source:"website"|"curated-fallback"; categories:Category[]; idealProjects:string[]; analyzedAt:string };

const taxonomy = [
  { name: "Air handling units", keys: ["air handling", "ahu", "luchtbehandel", "luchtbehandeling"], applications: "Hospitals · hotels · offices · schools" },
  { name: "Commercial ventilation", keys: ["ventilation", "ventilatie", "ventilation systems", "mechanical ventilation"], applications: "Broad commercial buildings" },
  { name: "Heat recovery", keys: ["heat recovery", "warmteterugwinning", "wtw", "energy recovery"], applications: "Energy-efficient new build · renovation" },
  { name: "Fire & smoke ventilation", keys: ["smoke control", "smoke ventilation", "fire safety", "rookbeheers", "brandventil"], applications: "Hospitals · public buildings · logistics" },
  { name: "Heat pumps", keys: ["heat pump", "heat pumps", "warmtepomp", "warmtepompen"], applications: "Hotels · offices · hospitals · mixed-use" },
  { name: "Chillers", keys: ["chiller", "chillers", "koelmachine", "water cooled"], applications: "Hospitals · industrial · large offices" },
  { name: "VRF / VRV", keys: ["vrf", "vrv", "variable refrigerant"], applications: "Hotels · offices · retail" },
  { name: "Controls / BMS", keys: ["building management", "bms", "controls", "control system", "gebouwbeheer"], applications: "Complex commercial buildings" },
  { name: "Air distribution", keys: ["air distribution", "diffuser", "grille", "luchtverdeling"], applications: "Commercial interiors · public buildings" },
];

const presets: Record<string, Category[]> = {
  "systemair.com": [
    { name: "Air handling units", applications: "Hospitals · hotels · offices · schools", confidence: 98 },
    { name: "Commercial ventilation", applications: "Broad commercial buildings", confidence: 98 },
    { name: "Fire & smoke ventilation", applications: "Hospitals · public buildings · logistics", confidence: 94 },
    { name: "Heat recovery", applications: "Energy-efficient new build · renovation", confidence: 92 },
  ],
  "renson.net": [
    { name: "Commercial ventilation", applications: "Offices · schools · hospitality · residential projects", confidence: 97 },
    { name: "Heat recovery", applications: "Energy-efficient new build · renovation", confidence: 91 },
    { name: "Air distribution", applications: "Commercial interiors · public buildings", confidence: 86 },
  ],
  "zehnder.nl": [
    { name: "Commercial ventilation", applications: "Offices · schools · residential developments", confidence: 96 },
    { name: "Heat recovery", applications: "Energy-efficient new build · renovation", confidence: 95 },
    { name: "Air distribution", applications: "Commercial interiors · public buildings", confidence: 84 },
  ],
  "daikin.be": [
    { name: "Heat pumps", applications: "Hotels · offices · hospitals · mixed-use", confidence: 99 },
    { name: "Chillers", applications: "Hospitals · industrial · large offices", confidence: 96 },
    { name: "VRF / VRV", applications: "Hotels · offices · retail", confidence: 98 },
    { name: "Air handling units", applications: "Hospitals · hotels · offices · schools", confidence: 90 },
  ],
};

const brandNames: Record<string,string> = {
  "systemair.com":"Systemair",
  "renson.net":"Renson",
  "zehnder.nl":"Zehnder",
  "daikin.be":"Daikin",
};

function normalizeUrl(raw: string) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP(S) websites are supported");
  const h = url.hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local") || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) throw new Error("Private network addresses are not supported");
  return url;
}
function hostKey(hostname: string) { const host = hostname.replace(/^www\./, "").toLowerCase(); return Object.keys(presets).find(k => host === k || host.endsWith(`.${k}`)); }
function companyFrom(hostname: string, title?: string, presetKey?: string) {
  if (presetKey && brandNames[presetKey]) return brandNames[presetKey];
  const generic=/^(b2b|b2c|home|homepage|welcome|products|solutions|professional|business|consumer)$/i;
  if (title) {
    const clean = title.split(/[|–—-]/)[0].trim();
    if (clean.length > 2 && clean.length < 50 && !generic.test(clean)) return clean;
  }
  const base = hostname.replace(/^www\./, "").split(".")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}
function detect(text: string): Category[] { const lower = text.toLowerCase(); return taxonomy.map(t => { const hits = t.keys.reduce((n, key) => n + (lower.includes(key) ? 1 : 0), 0); return hits ? { name: t.name, applications: t.applications, confidence: Math.min(99, 70 + hits * 9) } : null; }).filter(Boolean) as Category[]; }
function saveProfile(response:NextResponse, profile:Profile){ response.cookies.set("projectsignal_profile",encodeURIComponent(JSON.stringify(profile)),{httpOnly:true,sameSite:"lax",secure:true,maxAge:60*60*24*30,path:"/"}); return response; }

export async function GET(req:NextRequest){
  try{const raw=req.cookies.get("projectsignal_profile")?.value;if(!raw)return NextResponse.json({profile:null});return NextResponse.json({profile:JSON.parse(decodeURIComponent(raw))});}
  catch{return NextResponse.json({profile:null});}
}

export async function POST(req: NextRequest) {
  try {
    const { website } = await req.json();
    if (!website || typeof website !== "string") return NextResponse.json({ error: "Website is required" }, { status: 400 });
    const url = normalizeUrl(website.trim());
    const presetKey = hostKey(url.hostname);
    let title = ""; let categories: Category[] = []; let source: "website" | "curated-fallback" = "website";

    try {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url.toString(), { signal: controller.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 ProjectSignal validation bot" }, cache: "no-store" });
      clearTimeout(timer); if (!res.ok) throw new Error(`Website returned ${res.status}`);
      const html = (await res.text()).slice(0, 300_000);
      title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/&amp;/g, "&").trim() || "";
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      categories = detect(text);
    } catch {}

    if (categories.length < 2 && presetKey) { categories = presets[presetKey]; source = "curated-fallback"; }
    if (!categories.length) { categories = [{ name: "Commercial building systems", applications: "Commercial and public projects", confidence: 68 }]; source = "curated-fallback"; }
    const applications = Array.from(new Set(categories.flatMap(c => c.applications.split(" · "))));
    const profile:Profile={company:companyFrom(url.hostname,title,presetKey),hostname:url.hostname.replace(/^www\./,""),source,categories:categories.slice(0,6),idealProjects:applications.slice(0,8),analyzedAt:new Date().toISOString()};
    return saveProfile(NextResponse.json(profile),profile);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Analysis failed" }, { status: 400 }); }
}
