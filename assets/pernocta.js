/* LA BELLOTA CAMPERS — Dormir en camper en Gran Canaria · render
   La prosa de la página es estática (está en el HTML). Este script solo hace
   dos cosas: pintar las áreas de pernocta desde content.js, que es lo que
   Nahum edita en el panel, y generar los datos estructurados de la página.
   Mismo patrón que explora.js: sin build, el prerender lo ejecuta en jsdom. */
(function () {
  "use strict";

  const C = window.SITE_CONTENT || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const PAGE = "https://www.labellotacampers.com/dormir-en-camper-gran-canaria/";

  /* ---------- Iconos (los mismos de la home) ---------- */
  const I = (name) => {
    const p = {
      carpa: '<path d="M12 4L3 19h18z"/><path d="M12 4v15"/><path d="M8.6 19c.8-2.6 2-4.2 3.4-4.2s2.6 1.6 3.4 4.2"/>',
      arbol: '<path d="M12 3L6.5 11h3L5 17h14l-4.5-6h3z"/><path d="M12 17v4"/>',
      furgo: '<rect x="2.5" y="8" width="13" height="8" rx="2"/><path d="M15.5 10h3.2l2.3 3.2V16h-5.5"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    }[name] || '<circle cx="12" cy="12" r="9"/>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  };

  /* ---------- Áreas de pernocta (fuente: content.js) ---------- */
  const A = C.areas || {};
  const lista = A.lista || [];
  const ICONO_TIPO = { cabildo: "carpa", camping: "arbol", area: "furgo" };
  if (lista.length && $("areasLista")) {
    $("areasLista").innerHTML = lista.map((a) => {
      const tipo = (a.tipo || "area").trim().toLowerCase();
      const chips = String(a.servicios || "").split("·").map((s) => s.trim()).filter(Boolean)
        .map((s) => "<span>" + esc(s) + "</span>").join("");
      return '<article class="areacard ' + esc(tipo) + '">' +
        '<div class="areacard__head">' + I(ICONO_TIPO[tipo] || "furgo") +
        "<div><h3>" + esc(a.nombre) + "</h3><span>" + esc(a.zona) + "</span></div></div>" +
        (chips ? '<div class="areacard__chips">' + chips + "</div>" : "") +
        (a.nota ? "<p>" + esc(a.nota) + "</p>" : "") +
      "</article>";
    }).join("");
  }
  if (A.aviso && $("areasAvisoTexto")) $("areasAvisoTexto").textContent = A.aviso;
  else if ($("areasAviso")) $("areasAviso").hidden = true;
  if (A.permisoUrl && $("permisoBtn")) {
    $("permisoBtn").href = A.permisoUrl;
    if (A.permisoLabel) $("permisoBtn").textContent = A.permisoLabel;
  }

  /* ---------- WhatsApp y año ---------- */
  const neg = C.negocio || {};
  const wa = (neg.whatsapp || "").replace(/\D/g, "");
  if (wa) {
    const url = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hola, estoy leyendo la guía de dónde dormir con la camper y me interesa La Bellota");
    ["waFloat", "waFooter"].forEach((id) => { const el = $(id); if (el) el.href = url; });
  }
  const y = $("year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Datos estructurados ----------
     Las preguntas salen del propio HTML: una sola fuente, sin duplicar textos.
     El prerender deja esto ya escrito en el HTML; el guardia evita repetirlo
     cuando el navegador vuelve a ejecutar el script. */
  if (!document.getElementById("ld-pernocta")) {
    const faq = [...document.querySelectorAll("#faqPernocta details")].map((d) => ({
      "@type": "Question",
      "name": (d.querySelector("summary") || {}).textContent || "",
      "acceptedAnswer": { "@type": "Answer", "text": (d.querySelector("p") || {}).textContent || "" },
    })).filter((q) => q.name);

    const ld = [
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "La Bellota Campers", "item": "https://www.labellotacampers.com/" },
          { "@type": "ListItem", "position": 2, "name": "Dormir en camper en Gran Canaria", "item": PAGE },
        ],
      },
      {
        "@context": "https://schema.org", "@type": "Article",
        "headline": "¿Dónde puedo dormir con la camper en Gran Canaria?",
        "description": "Diferencia entre pernoctar y acampar, zonas de acampada del Cabildo con permiso gratuito, campings y áreas privadas, y los sitios donde no se puede parar.",
        "inLanguage": "es-ES",
        "mainEntityOfPage": PAGE,
        "image": "https://www.labellotacampers.com/content/img/camper-atardecer-cumbre.jpg",
        "author": { "@type": "Organization", "name": "La Bellota Campers", "url": "https://www.labellotacampers.com/" },
        "publisher": { "@id": "https://www.labellotacampers.com/#negocio" },
        "dateModified": (document.querySelector("time[datetime]") || {}).dateTime || undefined,
        "about": { "@type": "Thing", "name": "Pernocta y acampada en camper en Gran Canaria" },
      },
      lista.length && {
        "@context": "https://schema.org", "@type": "ItemList",
        "name": "Zonas para pernoctar con camper en Gran Canaria",
        "numberOfItems": lista.length,
        "itemListElement": lista.map((a, i) => ({
          "@type": "ListItem", "position": i + 1,
          "item": {
            "@type": a.tipo === "camping" ? "Campground" : "TouristAttraction",
            "name": a.nombre,
            "description": [a.servicios, a.nota].filter(Boolean).join(". "),
            "address": { "@type": "PostalAddress", "addressLocality": String(a.zona || "").split("·")[0].trim(), "addressRegion": "Gran Canaria", "addressCountry": "ES" },
          },
        })),
      },
      faq.length && { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq },
    ].filter(Boolean);

    const tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.id = "ld-pernocta";
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
  }

  /* ---------- Menú móvil (mismo comportamiento que el resto del sitio) ---------- */
  const tog = $("navtoggle"), nav = $("mainnav");
  if (tog && nav) {
    tog.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      tog.setAttribute("aria-expanded", String(open));
    });
  }
  addEventListener("scroll", () => {
    const tb = $("topbar");
    if (tb) tb.classList.toggle("scrolled", scrollY > 20);
  }, { passive: true });
})();
