/* LA BELLOTA CAMPERS — ingesta de métricas propias (Vercel Edge Function)
   Recibe los beacons de assets/track.js y acumula contadores diarios en
   Redis (Upstash vía Vercel Marketplace, plan gratuito). No guarda IPs ni
   identificadores: los visitantes únicos se estiman con un HyperLogLog
   alimentado por un hash SHA-256 de (día + IP + user-agent) que rota a
   diario y no permite recuperar el origen.

   Estructura en Redis (una clave por día, caduca a los ~13 meses):
     d:AAAA-MM-DD  → hash { "pv|/": n, "dev|movil": n, "ref|google.com": n,
                            "geo|ES": n, "ev|whatsapp": n, "el|whatsapp|footer": n }
     u:AAAA-MM-DD  → HyperLogLog de visitantes únicos del día

   Si las variables de entorno de Redis no existen todavía, responde 204
   y no hace nada: la web nunca se ve afectada. */

export const config = { runtime: "edge" };

const HOST_OK = /(^|\.)labellotacampers\.com$|(^|\.)vercel\.app$/;
const TTL = "34560000"; // ~400 días, en segundos

const clean = (s, max) => String(s || "").replace(/[^\w/#.|-]/g, "_").slice(0, max);

async function hashVisitante(dia, req) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const ua = req.headers.get("user-agent") || "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dia + "|" + ip + "|" + ua));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  // Solo beacons de nuestras propias páginas
  try {
    const o = new URL(req.headers.get("origin") || "");
    if (!HOST_OK.test(o.hostname)) return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(null, { status: 204 });
  }

  const base = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!base || !token) return new Response(null, { status: 204 }); // aún sin almacén: no-op

  let b;
  try {
    b = await req.json();
    if (typeof b !== "object" || !b) throw 0;
  } catch (e) {
    return new Response(null, { status: 400 });
  }

  const dia = new Intl.DateTimeFormat("sv-SE", { timeZone: "Atlantic/Canary" }).format(new Date());
  const K = "d:" + dia, U = "u:" + dia;
  const cmds = [];

  if (b.k === "pv") {
    cmds.push(["HINCRBY", K, "pv|" + (clean(b.p, 80) || "/"), "1"]);
    cmds.push(["HINCRBY", K, "dev|" + (b.d === "m" ? "movil" : "escritorio"), "1"]);
    try {
      const rh = new URL(b.r).hostname;
      if (rh && !HOST_OK.test(rh)) cmds.push(["HINCRBY", K, "ref|" + clean(rh, 60), "1"]);
    } catch (e) { /* sin referrer */ }
    const cc = req.headers.get("x-vercel-ip-country") || "";
    if (/^[A-Z]{2}$/.test(cc)) cmds.push(["HINCRBY", K, "geo|" + cc, "1"]);
    cmds.push(["PFADD", U, await hashVisitante(dia, req)], ["EXPIRE", U, TTL, "NX"]);
  } else if (b.k === "ev") {
    const n = clean(b.n, 24);
    if (!n) return new Response(null, { status: 400 });
    cmds.push(["HINCRBY", K, "ev|" + n, "1"]);
    const l = clean(b.l, 40);
    if (l) cmds.push(["HINCRBY", K, "el|" + n + "|" + l, "1"]);
  } else {
    return new Response(null, { status: 400 });
  }
  cmds.push(["EXPIRE", K, TTL, "NX"]);

  try {
    await fetch(base + "/pipeline", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify(cmds),
    });
  } catch (e) { /* Redis caído: la web no debe enterarse */ }

  return new Response(null, { status: 204 });
}
