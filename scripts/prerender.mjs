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
   - sitemap.xml (solo páginas indexables), robots.txt, llms.txt y el
     fichero de clave de IndexNow (scripts/indexnow.key → /<clave>.txt)

   Si el render sale vacío, el build FALLA (Vercel mantiene el deploy
   anterior): mejor sin actualizar que publicar una web sin contenido.
   ========================================================= */

import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const BASE = "https://www.labellotacampers.com/";
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const HOY = new Date().toISOString().slice(0, 10);

/* ---------- 1. Copia del sitio estático ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
// Copia recursiva "a mano": fs.cpSync({recursive:true}) hace caer a Node
// (0xC0000409) cuando el repo vive en una unidad de Google Drive en Windows.
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (e.isFile()) fs.copyFileSync(s, d);
  }
}
for (const dir of ["assets", "content", "legal", "admin", "explora-gran-canaria", "dormir-en-camper-gran-canaria"]) {
  copyDir(path.join(ROOT, dir), path.join(DIST, dir));
}
for (const f of ["index.html", "sources.md", "404.html", "favicon.ico", "site.webmanifest"]) {
  fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
}

/* ---------- 2. Render de una página en jsdom ---------- */
function render(htmlPath, url, scripts, antes) {
  // runScripts "outside-only": window.eval ejecuta DENTRO del contexto de la
  // página (window/document reales), pero los <script src> del HTML no se
  // cargan solos — los inyectamos nosotros en orden controlado.
  const dom = new JSDOM(read(htmlPath), { url, runScripts: "outside-only", pretendToBeVisual: true });
  const win = dom.window;
  // Idioma del navegador simulado: main.js lo usa para decidir si enseña la
  // barra de "esta página también está en…", que NO debe colarse en el HTML
  // estático. Coincidiendo con el de la página, nunca aparece.
  Object.defineProperty(win.navigator, "language", { value: "es-ES", configurable: true });
  if (antes) antes(win, win.document);
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
const home = render("index.html", BASE, ["assets/i18n.js", "content/content.js", "assets/main.js"]);
const C = home.win.SITE_CONTENT || {};
const neg = C.negocio || {};

// JSON-LD estático (derivado de content.js: se actualiza solo)
const precios = (C.tarifas?.temporadas || [])
  .map((t) => +(String(t.precio).match(/\d+/) || [0])[0])
  .filter((n) => n >= 30); // ignora "−10 %" y similares
// Perfiles del negocio en otras plataformas: le dicen a Google y a los
// asistentes de IA que la web, la ficha de Yescapa y las redes son el MISMO
// negocio. Cuantas más fuentes coincidan, más fácil es que lo recomienden.
// Pendiente de añadir: la URL de la ficha de Google Business (maps.google.com/?cid=…).
const perfiles = [
  neg.instagram && "https://instagram.com/" + neg.instagram,
  "https://www.yescapa.es/campers/121413",
  "https://www.facebook.com/p/La-Bellota-Extreme%C3%B1a-100067590225478/",
].filter(Boolean);

// Los textos del JSON-LD que no salen de content.js, por idioma.
const LD_TEXTOS = {
  es: {
    pagina: "Alquiler de camper en Gran Canaria · La Bellota Campers",
    lang: "es-ES",
    resumen: "Alquiler de furgoneta camper en Gran Canaria.",
    pago: "Transferencia bancaria, tarjeta",
    precioRango: (min, max) => min + "–" + max + " € por noche",
    producto: "Alquiler de furgoneta camper Weinsberg 2026 (4 plazas) en Gran Canaria",
    productoDesc: "Camper Weinsberg 2026 sobre Fiat Ducato para 4 personas: 2 camas dobles, cocina, ducha y WC, nevera, placas solares. Entrega junto al aeropuerto de Gran Canaria.",
    combustible: "Diésel",
    cambio: "Manual",
    configuracion: "Camper de gran volumen sobre Fiat Ducato, 6,0 m",
    oferta: "Precio por noche · mínimo 3 noches · 200 km/día incluidos",
  },
  en: {
    pagina: "Campervan hire in Gran Canaria · La Bellota Campers",
    lang: "en-GB",
    resumen: "Campervan hire in Gran Canaria.",
    pago: "Bank transfer, card",
    precioRango: (min, max) => "€" + min + "–" + max + " per night",
    producto: "Weinsberg 2026 campervan hire (4 berths) in Gran Canaria",
    productoDesc: "Weinsberg 2026 campervan on a Fiat Ducato for four people: two double beds, kitchen, shower and toilet, fridge, solar panels. Handover next to Gran Canaria airport.",
    combustible: "Diesel",
    cambio: "Manual",
    configuracion: "High-volume campervan on a Fiat Ducato, 6.0 m",
    oferta: "Price per night · minimum 3 nights · 200 km a day included",
  },
};

// El mismo bloque de datos estructurados para cada idioma. Las rutas de imagen
// van siempre contra la raíz del dominio, aunque el contenido inglés las lleve
// en relativo para el navegador.
function bloquesLD(C, base, lang) {
  const neg = C.negocio || {};
  const t = LD_TEXTOS[lang];
  const raiz = (p) => BASE + String(p || "").replace(/^\.\.\//, "");
  const precios = (C.tarifas?.temporadas || [])
    .map((x) => +(String(x.precio).match(/\d+/) || [0])[0])
    .filter((n) => n >= 30);
  return [
  {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "@id": BASE + "#negocio",
    "name": neg.nombre || "La Bellota Campers",
    "legalName": "La Bellota Extremeña S.L.U.",
    "description": C.intro?.resumen || t.resumen,
    "url": BASE,
    "telephone": neg.telefono,
    "email": neg.email,
    "image": [
      raiz(C.hero?.foto || "content/img/camper-cumbre-mar-de-nubes.jpg"),
      BASE + "content/img/camper-exterior-lateral.jpg",
      BASE + "content/img/camper-interior-salon-cama.jpg",
    ],
    "logo": BASE + "assets/icons/icon-512.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "C/ Luis Morote 45, bajo",
      "addressLocality": "Las Palmas de Gran Canaria",
      "postalCode": "35007",
      "addressRegion": "Canarias",
      "addressCountry": "ES",
    },
    "areaServed": { "@type": "Place", "name": "Gran Canaria" },
    "knowsLanguage": ["es", "en"],
    "currenciesAccepted": "EUR",
    "paymentAccepted": t.pago,
    "openingHoursSpecification": [{
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "20:00",
    }],
    "priceRange": precios.length ? t.precioRango(Math.min(...precios), Math.max(...precios)) : undefined,
    "sameAs": perfiles,
  },
  {
    // Frescura: la fecha real de la última edición del contenido.
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": base + "#pagina",
    "url": base,
    "name": t.pagina,
    "inLanguage": t.lang,
    "isPartOf": { "@id": BASE + "#negocio" },
    "dateModified": C.meta?.actualizado || HOY,
    "primaryImageOfPage": raiz(C.hero?.foto || "content/img/camper-cumbre-mar-de-nubes.jpg"),
  },
  precios.length && {
    "@context": "https://schema.org",
    // Product + Vehicle: los campos de vehículo (plazas, año, combustible) son
    // los que extraen los asistentes de IA cuando les preguntan por la camper.
    "@type": ["Product", "Vehicle"],
    "name": t.producto,
    "description": t.productoDesc,
    "brand": { "@type": "Brand", "name": "Weinsberg" },
    "vehicleModelDate": "2026",
    "vehicleSeatingCapacity": 4,
    "fuelType": t.combustible,
    "vehicleTransmission": t.cambio,
    "vehicleConfiguration": t.configuracion,
    "provider": { "@id": BASE + "#negocio" },
    "image": BASE + "content/img/camper-exterior-lateral.jpg",
    // Sin "review" ni "aggregateRating" A PROPÓSITO: las reseñas de la web son de
    // ejemplo y Google penaliza las valoraciones no reales. Search Console los
    // lista como campos recomendados que faltan (no críticos). Añadirlos solo
    // cuando content.js tenga opiniones reales de clientes recogidas por la web.
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": Math.min(...precios),
      "highPrice": Math.max(...precios),
      "offerCount": precios.length, // temporadas con precio (la alta va "Consultar")
      "priceCurrency": "EUR",
      "url": base + "#tarifas",
      "availability": "https://schema.org/InStock",
      "description": t.oferta,
      // El precio, dicho en lenguaje de máquina: 110 € por noche, mínimo 3.
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": Math.min(...precios),
        "priceCurrency": "EUR",
        "unitCode": "DAY",
        "referenceQuantity": { "@type": "QuantitativeValue", "value": 1, "unitCode": "DAY" },
        "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 3, "unitCode": "DAY" },
      },
      "seller": { "@id": BASE + "#negocio" },
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
}

const ldTag = home.dom.window.document.createElement("script");
ldTag.type = "application/ld+json";
ldTag.textContent = JSON.stringify(bloquesLD(C, BASE, "es"));
home.dom.window.document.head.appendChild(ldTag);

// La home se escribe más abajo, después de generar la versión inglesa: si esa
// falla, hay que quitarle a la española los hreflang y el selector antes de
// serializarla, para no anunciar una página que no existe.

/* ---------- 3b. Versión en inglés (/en/) ----------
   El español manda: content.js no cambia y el panel de Nahum tampoco. Las
   traducciones viven aparte, con la huella del texto español del que salieron:
   si Nahum reescribe un texto, la huella deja de coincidir, esa frase vuelve al
   español y el build lo avisa. Así una edición del panel nunca publica una
   traducción que ya no corresponde. */
const I18N = {
  contenido: leerJson("content/i18n/en.json"),
  interfaz: leerJson("content/i18n/en-ui.json"),
};
function leerJson(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}
const huella = (s) => crypto.createHash("sha1").update(String(s), "utf8").digest("hex").slice(0, 12);

// Mismas exclusiones que el extractor: identidad, contacto, rutas y fechas.
const NO_TRADUCIBLE = (p) =>
  /^meta\./.test(p) ||
  // Claves internas, no texto visible: el icono que se pinta y el tipo de área,
  // que además se usa como clase CSS. Traducirlas rompería el diseño.
  /\.icono$/.test(p) ||
  /^areas\.lista\.\d+\.tipo$/.test(p) ||
  /^negocio\.(nombre|telefono|whatsapp|email|instagram)$/.test(p) ||
  /^hermano\.(telefono|direccion)$/.test(p) ||
  /^areas\.permisoUrl$/.test(p) ||
  /^resenas\.lista\./.test(p) ||
  /^disponibilidad\.ocupado/.test(p) ||
  /\.foto$|\.url$/.test(p);

function traducirContenido(obj, mapa, prefijo, informe) {
  if (Array.isArray(obj)) return obj.map((v, i) => traducirContenido(v, mapa, prefijo + "." + i, informe));
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const p = prefijo ? prefijo + "." + k : k;
      out[k] = traducirContenido(v, mapa, p, informe);
    }
    return out;
  }
  if (typeof obj !== "string" || !obj.trim()) return obj;
  const p = prefijo;
  // Las rutas de imagen suben un nivel: la página inglesa cuelga de /en/.
  if (/^content\/img\//.test(obj)) return "../" + obj;
  if (NO_TRADUCIBLE(p)) return obj;
  const t = mapa[p];
  if (!t) { informe.faltan.push(p); return obj; }
  if (t.src !== huella(obj)) { informe.caducados.push(p); return obj; }
  return t.text;
}

let enOk = false;
if (!I18N.contenido || !I18N.interfaz) {
  console.warn("i18n: sin content/i18n/en.json o en-ui.json — se publica solo el español");
} else {
  const informe = { faltan: [], caducados: [] };
  const EN = traducirContenido(C, I18N.contenido, "", informe);
  fs.mkdirSync(path.join(DIST, "en", "content"), { recursive: true });
  fs.writeFileSync(
    path.join(DIST, "en", "content", "content.js"),
    "/* Generado por scripts/prerender.mjs desde content/content.js + content/i18n/en.json. No editar a mano. */\nwindow.SITE_CONTENT = " +
      JSON.stringify(EN, null, 2) + ";\n"
  );
  fs.writeFileSync(path.join(DIST, "i18n-report.json"), JSON.stringify(informe, null, 1));

  const en = render("index.html", BASE + "en/", ["assets/i18n.js", "dist/en/content/content.js", "assets/main.js"], (win, doc) => {
    doc.documentElement.lang = "en";
    Object.defineProperty(win.navigator, "language", { value: "en-GB", configurable: true });
  });
  const doc = en.dom.window.document;

  // Rutas relativas: la página vive un nivel más abajo.
  for (const el of doc.querySelectorAll("[src],[href],[srcset]")) {
    for (const attr of ["src", "href", "srcset"]) {
      const v = el.getAttribute(attr);
      if (!v) continue;
      if (attr === "srcset") {
        el.setAttribute(attr, v.split(",").map((c) => {
          const [u, d] = c.trim().split(/\s+/);
          return (/^(https?:|\/|#|data:|\.\.\/)/.test(u) ? u : "../" + u) + (d ? " " + d : "");
        }).join(", "));
      } else if (!/^(https?:|\/\/|\/|#|mailto:|tel:|data:|\.\.\/)/.test(v)) {
        el.setAttribute(attr, "../" + v);
      }
    }
  }

  // El contenido lo sirve la copia inglesa que cuelga de /en/, no la española.
  const sc = doc.querySelector('script[src$="content/content.js"]');
  if (sc) sc.setAttribute("src", "content/content.js");

  // Las guías siguen en español en esta fase: se marca el idioma del destino
  // para que el navegador y los buscadores lo sepan.
  doc.querySelectorAll('a[href*="explora-gran-canaria"],a[href*="dormir-en-camper"],a[href*="/legal/"]')
    .forEach((a) => a.setAttribute("hreflang", "es"));

  // Textos fijos del HTML (los que no vienen de content.js).
  // Para avisar solo de lo que de verdad falta, se compara contra el HTML
  // crudo: lo que pinta main.js desde content.js ya viene traducido y sus
  // topónimos (Presa de Las Niñas, Mogán…) no son textos pendientes.
  const crudo = new JSDOM(read("index.html")).window.document;
  const estaticos = new Set();
  (function rec(n) {
    for (const h of n.childNodes) {
      if (h.nodeType === 3) { const v = h.textContent.replace(/\s+/g, " ").trim(); if (v) estaticos.add(v); }
      else if (h.nodeType === 1) rec(h);
    }
  })(crudo.body);
  for (const el of crudo.querySelectorAll("[aria-label],[placeholder],[alt],[title]")) {
    for (const a of ["aria-label", "placeholder", "alt", "title"]) {
      if (el.hasAttribute(a)) estaticos.add(el.getAttribute(a).replace(/\s+/g, " ").trim());
    }
  }
  const sinTraducir = [];
  const cambiaTexto = (s) => {
    const k = s.trim();
    if (!k || !/[a-záéíóúñü]/i.test(k)) return null;
    if (I18N.interfaz[k] != null) return s.replace(k, I18N.interfaz[k]);
    // Lo que estaba en la plantilla, sigue en español y nadie tradujo.
    if (estaticos.has(k) && /[áéíóúñ¿¡]/i.test(k)) sinTraducir.push(k);
    return null;
  };
  const recorre = (nodo) => {
    for (const n of nodo.childNodes) {
      if (n.nodeType === 3) {
        if (n.parentElement && !n.parentElement.hasAttribute("data-c")) {
          const nuevo = cambiaTexto(n.textContent);
          if (nuevo != null) n.textContent = nuevo;
        }
      } else if (n.nodeType === 1 && !["SCRIPT", "STYLE", "SVG"].includes(n.tagName)) recorre(n);
    }
  };
  recorre(doc.body);
  for (const el of doc.querySelectorAll("[aria-label],[placeholder],[alt],[title]")) {
    for (const a of ["aria-label", "placeholder", "alt", "title"]) {
      if (!el.hasAttribute(a)) continue;
      const nuevo = cambiaTexto(el.getAttribute(a));
      if (nuevo != null) el.setAttribute(a, nuevo);
    }
  }

  // Cabecera de la página inglesa.
  const set = (sel, attr, valor) => { const el = doc.querySelector(sel); if (el && valor) el.setAttribute(attr, valor); };
  const ui = I18N.interfaz;
  doc.title = ui["meta.title"] || doc.title;
  set('meta[name="description"]', "content", ui["meta.description"]);
  set('meta[property="og:title"]', "content", ui["og.title"]);
  set('meta[property="og:description"]', "content", ui["og.description"]);
  set('meta[property="og:url"]', "content", BASE + "en/");
  set('meta[property="og:locale"]', "content", "en_GB");
  set('link[rel="canonical"]', "href", BASE + "en/");

  // Selector de idioma: enlaces y etiqueta de la versión inglesa.
  set("#langes", "href", "../");
  set("#langen", "href", "./");
  const cur = doc.getElementById("langcur"); if (cur) cur.textContent = "EN";
  const les = doc.getElementById("langes"); if (les) les.removeAttribute("aria-current");
  const len = doc.getElementById("langen"); if (len) len.setAttribute("aria-current", "true");

  // La barra de "esta página también está en…" es cosa del navegador.
  doc.querySelectorAll(".langbar").forEach((el) => el.remove());

  const ldEn = doc.createElement("script");
  ldEn.type = "application/ld+json";
  ldEn.textContent = JSON.stringify(bloquesLD(EN, BASE + "en/", "en"));
  doc.head.appendChild(ldEn);

  const enHtml = en.dom.serialize();
  if (!enHtml.includes("€800") && !enHtml.includes("800 €")) {
    throw new Error("Prerender inglés incompleto (faltan las condiciones) — abortando build");
  }
  if (/Vista previa del borrador|Consultar fechas<|Preguntas frecuentes</.test(enHtml)) {
    throw new Error("Prerender inglés con textos en español sin traducir — abortando build");
  }
  fs.writeFileSync(path.join(DIST, "en", "index.html"), enHtml);
  enOk = true;
  console.log(
    `✓ Inglés OK — ${Object.keys(I18N.contenido).length} textos de contenido` +
    (informe.faltan.length ? `, ${informe.faltan.length} SIN TRADUCIR (${informe.faltan.slice(0, 4).join(", ")}…)` : "") +
    (informe.caducados.length ? `, ${informe.caducados.length} CADUCADOS por edición en español (${informe.caducados.slice(0, 4).join(", ")}…)` : "") +
    (sinTraducir.length ? `, ${sinTraducir.length} textos fijos sin traducir (${sinTraducir.slice(0, 3).join(" | ")})` : "")
  );
}

// Sin versión inglesa no puede haber hreflang apuntando a una página que no existe.
if (!enOk) {
  const h = home.dom.window.document;
  h.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  const sel = h.getElementById("langsel"); if (sel) sel.remove();
}

/* ---------- 3c. Escritura de la home española ---------- */
const homeHtml = home.dom.serialize();
if (!homeHtml.includes("800 €") || (homeHtml.match(/<details>/g) || []).length < 3) {
  throw new Error("Prerender de la home incompleto (faltan condiciones o FAQ) — abortando build");
}
// La barra de "vista previa del borrador" solo debe existir en el navegador
// (la crea main.js con ?preview=1). Si se cuela en el HTML estático, los bots
// de IA leen "estos cambios aún no están publicados" como primer texto.
if (homeHtml.includes("Vista previa del borrador")) {
  throw new Error("El HTML prerenderizado contiene la barra de vista previa — abortando build");
}
// La barra de idioma también es solo del navegador.
if (homeHtml.includes("langbar")) {
  throw new Error("El HTML prerenderizado contiene la barra de idioma — abortando build");
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

/* ---------- 4b. Dormir en camper (guía de pernocta) ---------- */
// La prosa es estática; pernocta.js solo pinta las áreas desde content.js y
// escribe el JSON-LD. Se prerenderiza igual para que los bots lo lean sin JS.
const dormir = render("dormir-en-camper-gran-canaria/index.html", BASE + "dormir-en-camper-gran-canaria/", [
  "content/content.js",
  "assets/pernocta.js",
]);
const dormirHtml = dormir.dom.serialize();
if (!dormirHtml.includes("ld-pernocta") || !dormirHtml.includes("areacard")) {
  throw new Error("Prerender de la guía de pernocta incompleto (faltan áreas o JSON-LD) — abortando build");
}
fs.writeFileSync(path.join(DIST, "dormir-en-camper-gran-canaria", "index.html"), dormirHtml);

/* ---------- 5. sitemap.xml ---------- */
const lastmod = C.meta?.actualizado || HOY;
// Solo páginas indexables: las legales llevan <meta name="robots" content="noindex">
// y listarlas aquí solo genera avisos en Search Console.
// Cada URL con SU fecha real: la home sigue la del contenido editable y la guía
// la del fichero de lugares. Un lastmod compartido le dice a Google que todo
// cambió cada vez que Nahum toca un precio, y deja de creérselo.
const mtime = (p) => fs.statSync(path.join(ROOT, p)).mtime.toISOString().slice(0, 10);
// La portada y su versión inglesa se declaran como alternativas la una de la
// otra: es la forma de que Google entienda que son la misma página en dos
// idiomas y no dos páginas compitiendo.
const alternas = enOk
  ? [
      { hreflang: "es", href: BASE },
      { hreflang: "en", href: BASE + "en/" },
      { hreflang: "x-default", href: BASE },
    ]
  : null;
const urls = [
  { loc: BASE, lastmod, priority: "1.0", alt: alternas },
  ...(enOk ? [{ loc: BASE + "en/", lastmod, priority: "0.9", alt: alternas }] : []),
  { loc: BASE + "dormir-en-camper-gran-canaria/", lastmod: mtime("dormir-en-camper-gran-canaria/index.html"), priority: "0.9" },
  { loc: BASE + "explora-gran-canaria/", lastmod: mtime("content/explora-lugares.js"), priority: "0.8" },
];
fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.map((u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n` +
      (u.alt || []).map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>\n`).join("") +
      `    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`
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

# Resumen del negocio en texto plano para asistentes de IA:
# ${BASE}llms.txt
`);

/* ---------- 6b. Clave de IndexNow (Bing, DuckDuckGo, Yandex…) ---------- */
// scripts/indexnow.mjs avisa a api.indexnow.org tras cada build de producción;
// el buscador valida la petición leyendo https://host/<clave>.txt.
const indexnowKey = read("scripts/indexnow.key").trim();
if (!/^[a-f0-9]{32}$/.test(indexnowKey)) throw new Error("scripts/indexnow.key inválida");
fs.writeFileSync(path.join(DIST, indexnowKey + ".txt"), indexnowKey + "\n");

/* ---------- 7. llms.txt ---------- */
const cond = (C.tarifas?.condiciones || []).map((c) => `- ${c.label}: ${c.valor}`).join("\n");
const specs = (C.camper?.specs || []).map((s) => `- ${s.valor} (${s.detalle})`).join("\n");
const temporadas = (C.tarifas?.temporadas || []).map((t) => `- ${t.nombre}${t.meses ? ` (${t.meses})` : ""}: ${t.precio}`).join("\n");
const faqTxt = (C.faq || []).map((f) => `### ${f.p}\n${f.r}`).join("\n\n");
const lugares = (exp.win.EXPLORA_LUGARES?.lugares || []).map((l) => `- ${l.nombre} (${l.municipio})`).join("\n");
fs.writeFileSync(path.join(DIST, "llms.txt"), `# La Bellota Campers

> Alquiler de una furgoneta camper Weinsberg 2026 (4 plazas, 2 camas dobles) en Gran Canaria, España. Entrega junto al aeropuerto de Gran Canaria (Ojos de Garza, Telde). Desde ${precios.length ? Math.min(...precios) : 110} € por noche con 200 km/día incluidos. Reserva por WhatsApp al ${neg.telefono || ""}. Titular: La Bellota Extremeña S.L.U. Atención en español e inglés, todo el año.

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

## Dónde dormir con la camper en Gran Canaria
Se puede pernoctar (dormir dentro del vehículo correctamente estacionado, sin sacar nada al exterior) allí donde esté permitido aparcar. Acampar (desplegar toldo, mesa o sillas) solo se permite en zonas habilitadas: las zonas de acampada del Cabildo de Gran Canaria, que son gratuitas y requieren permiso previo online, los campings y las áreas privadas. En las playas no se puede estacionar ni acampar, y los espacios naturales protegidos tienen normas propias. Guía completa: ${BASE}dormir-en-camper-gran-canaria/

${(C.areas?.lista || []).map((a) => `- ${a.nombre} (${a.zona}): ${a.servicios || ""}`).join("\n")}

## Páginas
- [Inicio — la camper, tarifas, disponibilidad y reserva](${BASE})${enOk ? `
- [Home in English — campervan hire in Gran Canaria](${BASE}en/)` : ""}
- [Dormir en camper en Gran Canaria — normativa y zonas de pernocta](${BASE}dormir-en-camper-gran-canaria/)
- [Explora Gran Canaria — guía de lugares en camper](${BASE}explora-gran-canaria/)
- [Aviso legal y privacidad](${BASE}legal/aviso-legal)
- [Condiciones de alquiler](${BASE}legal/condiciones)

## Contacto
- WhatsApp / teléfono: ${neg.telefono || ""}
- Email: ${neg.email || ""}
- Instagram: https://instagram.com/${neg.instagram || ""}
`);

console.log(`✓ Prerender OK — home ${(homeHtml.length / 1024).toFixed(0)} KB, explora ${(expHtml.length / 1024).toFixed(0)} KB (${nLugares} lugares), sitemap + robots.txt + llms.txt generados en dist/`);
