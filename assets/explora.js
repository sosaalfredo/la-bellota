/* LA BELLOTA CAMPERS — Explora Gran Canaria · render
   Pinta la landing desde window.EXPLORA_LUGARES (content/explora-lugares.js).
   Mismo patrón que main.js: contenido en datos, página estática sin build. */
(function () {
  "use strict";

  const D = window.EXPLORA_LUGARES || {};
  const LUGARES = D.lugares || [];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const IMGBASE = "../content/img/explora/";

  /* ---------- Hero ---------- */
  const H = D.hero || {};
  if (H.foto) { const hi = $("xheroImg"); hi.src = IMGBASE + H.foto; }

  /* ---------- Categorías ---------- */
  $("xcats").innerHTML = (D.categorias || []).map((c) => {
    if (c.activa) return '<span class="on">' + esc(c.nombre) + "</span>";
    if (c.url) return '<a class="off" href="' + esc(c.url) + '">' + esc(c.nombre) + "</a>";
    return '<span class="off">' + esc(c.nombre) + " <small>pronto</small></span>";
  }).join("");

  /* ---------- Fichas ---------- */
  const LAYOUTS = ["", "lugar--invertido", "lugar--panorama", "lugar--editorial"];
  const media = (l) => {
    if (!l.foto) return "";
    return '<figure class="lugar__media"><img src="' + IMGBASE + esc(l.foto) + '" alt="' + esc(l.fotoAlt || l.nombre) + '" loading="lazy" decoding="async"></figure>';
  };
  const facts = (l) => {
    const f = [];
    f.push("<div><b>📍 Zona</b>" + esc(l.municipio) + "</div>");
    if (l.ideal)   f.push("<div><b>📸 Ideal para</b>" + esc(l.ideal) + "</div>");
    if (l.tiempo)  f.push("<div><b>⏱️ Tiempo recomendado</b>" + esc(l.tiempo) + "</div>");
    if (l.momento) f.push("<div><b>🌅 Mejor momento</b>" + esc(l.momento) + "</div>");
    if (l.camper)  f.push('<div class="full"><b>🚐 En camper</b>' + esc(l.camper) + "</div>");
    if (l.nopierdas) f.push('<div class="full"><b>⭐ No te pierdas</b>' + esc(l.nopierdas) + "</div>");
    return '<div class="facts">' + f.join("") + "</div>";
  };
  const ctaBlock = (variant, titulo, texto, botones) =>
    '<aside class="xcta ' + variant + ' reveal"><div><h3>' + titulo + "</h3><p>" + texto + "</p></div>" +
    '<div class="acts">' + botones + "</div></aside>";

  let html = "";
  LUGARES.forEach((l, i) => {
    const layout = l.foto ? LAYOUTS[i % LAYOUTS.length] : "lugar--nota";
    const num = String(i + 1).padStart(2, "0");
    html +=
      '<article class="lugar ' + layout + ' reveal" id="' + esc(l.slug) + '">' +
        media(l) +
        '<div class="lugar__body">' +
          '<span class="lugar__num">' + num + " / " + LUGARES.length + "</span>" +
          "<h3>" + esc(l.nombre) + "</h3>" +
          '<span class="lugar__muni">' + esc(l.municipio) + "</span>" +
          (l.tag ? '<span class="lugar__tag">' + esc(l.tag) + "</span>" : "") +
          (l.temporada ? '<br><span class="lugar__temporada">🎄 ' + esc(l.temporada) + "</span>" : "") +
          '<p class="desc">' + esc(l.descripcion) + "</p>" +
          facts(l) +
        "</div>" +
      "</article>";
    if (i === 3) {
      html += ctaBlock("", "¿Te imaginas recorriendo estos lugares con La Bellota?",
        "Comprueba las fechas disponibles y empieza a preparar tu ruta por Gran Canaria.",
        '<a class="btn" href="../index.html#disponibilidad">Consultar disponibilidad</a>');
    }
    if (i === 9) {
      html += ctaBlock("xcta--miel", "Tu casa para esta ruta ya existe",
        "Weinsberg 2026 para 4 personas, con cocina, ducha y energía solar. Así se viaja por la isla.",
        '<a class="btn" href="../index.html#camper">Conoce La Bellota</a>');
    }
    if (i === 14) {
      html += ctaBlock("", "¿Y dónde duermo con la camper?",
        "Zonas de acampada del Cabildo con permiso gratuito, campings y áreas privadas: tenemos la selección hecha.",
        '<a class="btn" href="../index.html#areas">Ver áreas de pernocta</a>');
    }
  });
  $("lugaresLista").innerHTML = html;

  /* ---------- Contacto (desde el contenido central de la web) ---------- */
  const NEG = (window.SITE_CONTENT || {}).negocio || {};
  const wa = (NEG.whatsapp || "").replace(/\D/g, "");
  if (wa) {
    const waUrl = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hola, estoy mirando la guía de lugares de Gran Canaria y me interesa La Bellota 🚐");
    ["waFloat", "waFooter"].forEach((id) => { const el = $(id); if (el) el.href = waUrl; });
  }

  /* ---------- Créditos fotográficos (atribución CC, plegado) ---------- */
  (function creditos() {
    const ul = $("xcreditosLista");
    if (!ul) return;
    const items = [];
    if (H.credito) items.push({ nombre: "Portada (Caldera de Tejeda)", c: H.credito });
    LUGARES.forEach((l) => { if (l.foto && l.credito) items.push({ nombre: l.nombre, c: l.credito }); });
    ul.innerHTML = items.map((it) =>
      "<li>" + esc(it.nombre) + ': <a href="' + esc(it.c.url) + '" target="_blank" rel="noopener">' +
      esc(it.c.autor) + "</a> · " + esc(it.c.lic) + "</li>"
    ).join("");
  })();

  /* ---------- FAQ ---------- */
  $("xfaq").innerHTML = (D.faq || []).map((f) =>
    "<details><summary>" + esc(f.p) + "</summary><p>" + esc(f.r) + "</p></details>"
  ).join("");

  /* ---------- Datos estructurados (JSON-LD) ---------- */
  try {
    const abs = (p) => new URL(p, document.baseURI).href;
    const pageUrl = "https://www.labellotacampers.com/explora-gran-canaria/";
    const ld = [
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "La Bellota Campers", "item": "https://www.labellotacampers.com/" },
          { "@type": "ListItem", "position": 2, "name": "Explora Gran Canaria", "item": pageUrl }
        ]
      },
      {
        "@context": "https://schema.org", "@type": "ItemList",
        "name": "Gran Canaria en camper: lugares que no te puedes perder",
        "numberOfItems": LUGARES.length,
        "itemListElement": LUGARES.map((l, i) => ({
          "@type": "ListItem", "position": i + 1,
          "item": Object.assign({
            "@type": "TouristAttraction",
            "name": l.nombre,
            "description": l.descripcion,
            "url": pageUrl + "#" + l.slug,
            "address": { "@type": "PostalAddress", "addressLocality": l.municipio, "addressRegion": "Gran Canaria", "addressCountry": "ES" },
            "geo": { "@type": "GeoCoordinates", "latitude": l.lat, "longitude": l.lng }
          }, l.foto ? { "image": abs(IMGBASE + l.foto) } : {})
        }))
      },
      {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": (D.faq || []).map((f) => ({
          "@type": "Question", "name": f.p,
          "acceptedAnswer": { "@type": "Answer", "text": f.r }
        }))
      }
    ];
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  } catch (e) { /* schema es opcional */ }

  /* ---------- Nav / topbar / reveal (como en la home) ---------- */
  const toggle = $("navtoggle"), nav = $("mainnav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
  const topbar = $("topbar");
  addEventListener("scroll", () => topbar.classList.toggle("solid", scrollY > 40), { passive: true });

  const targets = document.querySelectorAll(".reveal");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
  }

  const y = $("year"); if (y) y.textContent = new Date().getFullYear();
})();
