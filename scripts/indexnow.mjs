/* =========================================================
   LA BELLOTA CAMPERS — AVISO INDEXNOW (se ejecuta tras el prerender)
   Avisa a los buscadores que soportan IndexNow (Bing —y con él Copilot,
   ChatGPT search y DuckDuckGo—, Yandex, Seznam, Naver…) de que las URLs
   del sitemap han cambiado. Google NO usa IndexNow: para Google bastan
   el sitemap y Search Console.

   - Solo actúa en el build de PRODUCCIÓN de Vercel (VERCEL_ENV=production)
     o si se lanza a mano con --force (npm run indexnow).
   - Nunca rompe el build: cualquier fallo se registra y termina con 0.
   - La clave vive en scripts/indexnow.key y el prerender la publica en
     https://www.labellotacampers.com/<clave>.txt (así la valida Bing).
   ========================================================= */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const force = process.argv.includes("--force");

if (process.env.VERCEL_ENV !== "production" && !force) {
  console.log("IndexNow: omitido (solo avisa desde el build de producción; --force para forzar)");
  process.exit(0);
}

try {
  const key = fs.readFileSync(path.join(ROOT, "scripts", "indexnow.key"), "utf8").trim();
  const sitemap = fs.readFileSync(path.join(ROOT, "dist", "sitemap.xml"), "utf8");
  const urlList = [...sitemap.matchAll(new RegExp("<loc>([^<]+)</loc>", "g"))].map((m) => m[1]);
  if (!urlList.length) throw new Error("sitemap.xml sin URLs");
  const host = new URL(urlList[0]).host;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: "https://" + host + "/" + key + ".txt", urlList }),
    signal: AbortSignal.timeout(10000),
  });
  // 200 OK · 202 Accepted (clave pendiente de validar) · 4xx = revisar clave/URLs
  console.log("IndexNow: HTTP " + res.status + " · " + urlList.length + " URLs enviadas (" + urlList.join(", ") + ")");
} catch (e) {
  console.warn("IndexNow: aviso no enviado (no bloquea el build) — " + e.message);
}
