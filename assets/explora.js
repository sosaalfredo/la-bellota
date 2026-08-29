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
  const hc = $("xheroCredit");
  if (hc && H.credito) hc.innerHTML = 'Foto: <a href="' + esc(H.credito.url) + '" target="_blank" rel="noopener">' + esc(H.credito.autor) + " · " + esc(H.credito.lic) + "</a>";

  /* ---------- Categorías ---------- */
  $("xcats").innerHTML = (D.categorias || []).map((c) => {
    if (c.activa) return '<span class="on">' + esc(c.nombre) + "</span>";
    if (c.url) return '<a class="off" href="' + esc(c.url) + '">' + esc(c.nombre) + "</a>";
    return '<span class="off">' + esc(c.nombre) + " <small>pronto</small></span>";
  }).join("");

  /* ---------- Fichas ---------- */
  const LAYOUTS = ["", "lugar--invertido", "lugar--panorama", "lugar--editorial"];
  const media = (l) => {
    if (!l.foto) {
      return '<div class="lugar__media"><div class="lugar__media--ph">' +
        '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 17 Q10 8 24 8 Q38 8 38 17 L38 20 L10 20 Z" fill="#E8A03C"/><path d="M12 20 L36 20 Q36 34 24 42 Q12 34 12 20 Z" fill="#F2EDE0"/></svg>' +
        "<span>" + esc(l.temporada || "Foto en camino") + "</span>" +
        (l.fotoNota ? "<small>" + esc(l.fotoNota) + "</small>" : "") +
      "</div></div>";
    }
    const cred = l.credito
      ? '<span class="lugar__credit"><a href="' + esc(l.credito.url) + '" target="_blank" rel="noopener">Foto: ' + esc(l.credito.autor) + " · " + esc(l.credito.lic) + "</a></span>"
      : "";
    return '<figure class="lugar__media"><img src="' + IMGBASE + esc(l.foto) + '" alt="' + esc(l.fotoAlt || l.nombre) + '" loading="lazy" decoding="async">' + cred + "</figure>";
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
    const layout = LAYOUTS[i % LAYOUTS.length];
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

  /* ---------- Mapa ---------- */
  const proj = (lat, lng) => ({ x: Math.round(20 + (lng + 15.87) * 1000), y: Math.round(20 + (28.20 - lat) * 1000) });
  const svg = $("mapaSvg");
  const NS = "http://www.w3.org/2000/svg";
  let selected = null;
  const card = {
    img: $("mapaImg"), nom: $("mapaNombre"), muni: $("mapaMuni"),
    desc: $("mapaDesc"), link: $("mapaLink"), wrap: $("mapaCard")
  };
  const pintaCard = (l) => {
    if (l.foto) { card.img.src = IMGBASE + l.foto; card.img.alt = l.fotoAlt || l.nombre; card.img.hidden = false; }
    else card.img.hidden = true;
    card.nom.textContent = l.nombre;
    card.muni.textContent = l.municipio;
    card.desc.textContent = (l.descripcion || "").split(". ").slice(0, 1).join(". ") + ".";
    card.link.href = "#" + l.slug;
  };
  LUGARES.forEach((l, i) => {
    const p = proj(l.lat, l.lng);
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "marker");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", l.nombre + " (" + l.municipio + ")");
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", "10");
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", p.x); t.setAttribute("y", p.y + 4);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("style", "font:700 10.5px var(--font-body);fill:var(--on-miel);stroke:none;paint-order:normal");
    t.textContent = i + 1;
    g.appendChild(c); g.appendChild(t);
    const pick = () => {
      if (selected) selected.classList.remove("on");
      selected = g; g.classList.add("on");
      pintaCard(l);
    };
    g.addEventListener("click", pick);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    svg.appendChild(g);
  });
  /* Base de La Bellota (Ojos de Garza) */
  (function base() {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "marker base");
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", 487); c.setAttribute("cy", 292); c.setAttribute("r", "11");
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", 487); t.setAttribute("y", 297);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("style", "font:700 11px var(--font-body);stroke:none");
    t.textContent = "🚐";
    const lbl = document.createElementNS(NS, "text");
    lbl.setAttribute("x", 474); lbl.setAttribute("y", 296);
    lbl.setAttribute("text-anchor", "end");
    lbl.textContent = "Base La Bellota";
    g.appendChild(c); g.appendChild(t); g.appendChild(lbl);
    g.addEventListener("click", () => { location.href = "../index.html#contacto"; });
    svg.appendChild(g);
  })();
  if (LUGARES.length) pintaCard(LUGARES[0]);

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
