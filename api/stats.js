/* LA BELLOTA CAMPERS — consulta de métricas para el panel (/admin → 📊)
   Protegido por el mismo Basic Auth del panel: el middleware cubre tanto
   /api/stats como /admin/api/stats (rewrite en vercel.json para que el
   navegador reutilice las credenciales del espacio /admin).
   Devuelve los contadores diarios crudos; el panel los agrega. */

export const config = { runtime: "edge" };

export default async function handler(req) {
  const base = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const json = (obj, status) =>
    new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });

  if (!base || !token) return json({ configurado: false, dias: [] });

  let n = parseInt(new URL(req.url).searchParams.get("dias") || "30", 10);
  if (!(n >= 1)) n = 30;
  n = Math.min(n, 90);

  // Lista de días (calendario canario), de hoy hacia atrás
  const hoy = new Intl.DateTimeFormat("sv-SE", { timeZone: "Atlantic/Canary" }).format(new Date());
  const [y, m, d] = hoy.split("-").map(Number);
  const t0 = Date.UTC(y, m - 1, d);
  const dias = [];
  for (let i = 0; i < n; i++) dias.push(new Date(t0 - i * 864e5).toISOString().slice(0, 10));

  const cmds = [];
  dias.forEach((dia) => {
    cmds.push(["HGETALL", "d:" + dia], ["PFCOUNT", "u:" + dia]);
  });

  let res;
  try {
    const r = await fetch(base + "/pipeline", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify(cmds),
    });
    if (!r.ok) throw new Error("Redis HTTP " + r.status);
    res = await r.json();
  } catch (e) {
    return json({ configurado: true, error: String(e && e.message || e), dias: [] }, 502);
  }

  const salida = dias.map((dia, i) => {
    const plano = res[i * 2] && res[i * 2].result || []; // [campo, valor, ...]
    const f = {};
    for (let j = 0; j < plano.length; j += 2) f[plano[j]] = Number(plano[j + 1]) || 0;
    return { fecha: dia, f, unicos: Number(res[i * 2 + 1] && res[i * 2 + 1].result) || 0 };
  });

  return json({ configurado: true, dias: salida });
}
