/* =========================================================
   LA BELLOTA CAMPERS — PRERENDER (build de Vercel)
   Los bots de IA (GPTBot, ClaudeBot, PerplexityBot…) no ejecutan
   JavaScript, así que este script ejecuta EN BUILD el mismo render
   que hace el navegador (content.js + main.js / explora.js) y escribe
   en dist/ el HTML ya relleno. El cliente sigue ejecutando los mismos
   scripts al cargar (repintan idéntico contenido), y el panel /admin
   no cambia: publica content.js → push → Vercel reconstruye.

   Además genera, siempre en sincronía con content.js:
   - JSON-LD estático en la home (AutoRental + Product/Offer + FAQPage)
   - sitemap.xml, robots.txt y llms.txt

   Si el render sale vacío, el build FALLA (Vercel mantiene el deploy
   anterior): mejor sin actualizar que publicar una web sin contenido.
   ========================================================= */

import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const BASE = "https://www.labellotacampers.com/";
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const HOY = new Date().toISOString().slice(0, 10);

/* ---------- 1. Copia del sitio estático ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
for (const dir of ["assets", "content", "legal", "admin", "explora-gran-canaria"]) {
  fs.cpSync(path.join(ROOT, dir), path.join(DIST, dir), { recursive: true });
}
for (const f of ["index.html", "sources.md"]) {
  fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
}

/* ---------- 2. Render de una página en jsdom ---------- */
function render(htmlPath, url, scripts) {
  // runScripts "outside-only": window.eval ejecuta DENTRO del contexto de la
  // página (window/document reales), pero los <script src> del HTML no se
  // cargan solos — los inyectamos nosotros en orden controlado.
  const dom = new JSDOM(read(htmlPath), { url, runScripts: "outside-only", pretendToBeVisual: true });
  const win = dom.window;
  // Stubs mínimos de APIs de navegador que jsdom no trae.
  // Sin IntersectionObserver, los renderers marcan todo .reveal como
  // visible: exactamente lo que queremos en el HTML estático.
  win.matchMedia = () => ({
    matches: false, media: "", addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
  });
  for (const s of scripts) win.eval(read(s));
  return { dom, win };
}

/* ---------- 3. Home ---------- */
const home = render("index.html", BASE, ["content/content.js", "assets/main.js"]);
const C = home.win.SITE_CONTENT || {};
const neg = C.negocio || {};

// JSON-LD estático (derivado de content.js: se actualiza solo)
const precios = (C.tarifas?.temporadas || [])
  .map((t) => +(String(t.precio).match(/\d+/) || [0])[0])
  .filter((n) => n >= 30); // ignora "−10 %" y similares
const ld = [
  {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "@id": BASE + "#negocio",
    "name": neg.nombre || "La Bellota Campers",
    "legalName": "La Bellota Extremeña S.L.U.",
    "url": BASE,
    "telephone": neg.telefono,
    "email": neg.email,
    "image": BASE + (C.hero?.foto || "content/img/camper-real-00-frontal.jpg"),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "C/ Luis Morote 45, bajo",
      "addressLocality": "Las Palmas de Gran Canaria",
      "postalCode": "35007",
      "addressRegion": "Canarias",
      "addressCountry": "ES",
    },
    "areaServed": { "@type": "Place", "name": "Gran Canaria" },
    "sameAs": neg.instagram ? ["https://instagram.com/" + neg.instagram] : [],
  },
  precios.length && {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Alquiler de furgoneta camper Weinsberg 2026 (4 plazas) en Gran Canaria",
    "description": "Camper Weinsberg 2026 sobre Fiat Ducato para 4 personas: 2 camas dobles, cocina, ducha y WC, nevera, placas solares. Entrega junto al aeropuerto de Gran Canaria.",
    "brand": { "@type": "Brand", "name": "Weinsberg" },
    "image": BASE + "content/img/camper-real-00-frontal.jpg",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": Math.min(...precios),
      "highPrice": Math.max(...precios),
      "priceCurrency": "EUR",
      "url": BASE + "#tarifas",
      "availability": "https://schema.org/InStock",
      "description": "Precio por noche · mínimo 3 noches · 200 km/día incluidos",
    },
  },
  (C.faq || []).length && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": C.faq.map((f) => ({
      "@type": "Question",
      "name": f.p,
      "acceptedAnswer": { "@type": "Answer", "text": f.r },
    })),
  },
].filter(Boolean);
const ldTag = home.dom.window.document.createElement("script");
ldTag.type = "application/ld+json";
ldTag.textContent = JSON.stringify(ld);
home.dom.window.document.head.appendChild(ldTag);

const homeHtml = home.dom.serialize();
if (!homeHtml.includes("800 €") || (homeHtml.match(/<details>/g) || []).length < 3) {
  throw new Error("Prerender de la home incompleto (faltan condiciones o FAQ) — abortando build");
}
fs.writeFileSync(path.join(DIST, "index.html"), homeHtml);

/* ---------- 4. Explora Gran Canaria ---------- */
const exp = render("explora-gran-canaria/index.html", BASE + "explora-gran-canaria/", [
  "content/content.js",
  "content/explora-lugares.js",
  "assets/explora.js",
]);
const expHtml = exp.dom.serialize();
const nLugares = (exp.win.EXPLORA_LUGARES?.lugares || []).length;
if ((expHtml.match(/<article/g) || []).length < nLugares) {
  throw new Error("Prerender de Explora incompleto — abortando build");
}
fs.writeFileSync(path.join(DIST, "explora-gran-canaria", "index.html"), expHtml);

/* ---------- 5. sitemap.xml ---------- */
const lastmod = C.meta?.actualizado || HOY;
const urls = [
  { loc: BASE, lastmod, priority: "1.0" },
  { loc: BASE + "explora-gran-canaria/", lastmod, priority: "0.8" },
  { loc: BASE + "legal/aviso-legal", lastmod, priority: "0.2" },
  { loc: BASE + "legal/condiciones", lastmod, priority: "0.3" },
];
fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`
    ).join("\n") + "\n</urlset>\n"
);

/* ---------- 6. robots.txt ---------- */
fs.writeFileSync(path.join(DIST, "robots.txt"), `# La Bellota Campers — alquiler de camper en Gran Canaria
# Bots de buscadores y de asistentes de IA: bienvenidos.

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# Crawlers de IA (declarados explícitamente por claridad)
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-User
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
User-agent: meta-externalagent
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${BASE}sitemap.xml
`);

/* ---------- 7. llms.txt ---------- */
const cond = (C.tarifas?.condiciones || []).map((c) => `- ${c.label}: ${c.valor}`).join("\n");
const specs = (C.camper?.specs || []).map((s) => `- ${s.valor} (${s.detalle})`).join("\n");
const temporadas = (C.tarifas?.temporadas || []).map((t) => `- ${t.nombre}${t.meses ? ` (${t.meses})` : ""}: ${t.precio}`).join("\n");
const faqTxt = (C.faq || []).map((f) => `### ${f.p}\n${f.r}`).join("\n\n");
const lugares = (exp.win.EXPLORA_LUGARES?.lugares || []).map((l) => `- ${l.nombre} (${l.municipio})`).join("\n");
fs.writeFileSync(path.join(DIST, "llms.txt"), `# La Bellota Campers

> Alquiler de una furgoneta camper Weinsberg 2026 (4 plazas, 2 camas dobles) en Gran Canaria, España. Entrega junto al aeropuerto de Gran Canaria (Ojos de Garza, Telde). Desde ${precios.length ? Math.min(...precios) : 110} € por noche con 200 km/día incluidos. Reserva por WhatsApp al ${neg.telefono || ""}. Titular: La Bellota Extremeña S.L.U.

Última actualización del contenido: ${lastmod}

## El vehículo
${specs}

## Tarifas
${temporadas}

## Condiciones de alquiler
${cond}

## Preguntas frecuentes
${faqTxt}

## Guía: Gran Canaria en camper
Guía editorial propia con ${nLugares} lugares imprescindibles de la isla, con consejos de acceso, aparcamiento y pernocta en camper: ${BASE}explora-gran-canaria/

${lugares}

## Páginas
- [Inicio — la camper, tarifas, disponibilidad y reserva](${BASE})
- [Explora Gran Canaria — guía de lugares en camper](${BASE}explora-gran-canaria/)
- [Aviso legal y privacidad](${BASE}legal/aviso-legal)
- [Condiciones de alquiler](${BASE}legal/condiciones)

## Contacto
- WhatsApp / teléfono: ${neg.telefono || ""}
- Email: ${neg.email || ""}
- Instagram: https://instagram.com/${neg.instagram || ""}
`);

console.log(`✓ Prerender OK — home ${(homeHtml.length / 1024).toFixed(0)} KB, explora ${(expHtml.length / 1024).toFixed(0)} KB (${nLugares} lugares), sitemap + robots.txt + llms.txt generados en dist/`);
