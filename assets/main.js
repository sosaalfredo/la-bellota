/* LA BELLOTA CAMPERS — render + interactions
   All texts/images come from window.SITE_CONTENT (content/content.js).
   The admin panel can inject a draft via localStorage for live preview. */
(function () {
  "use strict";

  /* ---------- Content source (published vs. admin draft preview) ---------- */
  let C = window.SITE_CONTENT || {};
  const params = new URLSearchParams(location.search);
  if (params.get("preview") === "1") {
    try {
      const draft = localStorage.getItem("labellota_draft");
      if (draft) {
        C = JSON.parse(draft);
        document.getElementById("previewbar").classList.add("show");
      }
    } catch (e) { /* corrupted draft -> fall back to published content */ }
  }

  const $ = (id) => document.getElementById(id);
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ---------- Simple text bindings ---------- */
  document.querySelectorAll("[data-c]").forEach((el) => {
    const v = get(el.getAttribute("data-c"));
    if (v != null && v !== "") el.textContent = v;
  });

  /* ---------- Icon set (stroke, currentColor) ---------- */
  const I = (name) => {
    const p = {
      km:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
      seguro:  '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
      carnet:  '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7 15h.01M11 15h4"/><path d="M3 10h18"/>',
      mascota: '<circle cx="8" cy="7" r="1.6"/><circle cx="12.5" cy="5.5" r="1.6"/><circle cx="17" cy="7" r="1.6"/><circle cx="19.5" cy="11" r="1.6"/><path d="M8 15q4-5 8 0 2 3-1 4t-3-1q-1 2-4 1t0-4z"/>',
      limpio:  '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M18 15l.9 2.3L21 18l-2.1.7L18 21l-.9-2.3L15 18l2.1-.7z"/>',
      plazas:  '<circle cx="9" cy="8" r="3"/><path d="M4 20v-2a5 5 0 0 1 10 0v2"/><circle cx="17" cy="9" r="2.5"/><path d="M14.5 20v-1.5a4 4 0 0 1 6-3"/>',
      cama:    '<path d="M3 18v-8h13a5 5 0 0 1 5 5v3"/><path d="M3 14h18"/><circle cx="7" cy="12" r="1.6"/>',
      medidas: '<path d="M4 20L20 4M4 20h6M4 20v-6"/>',
      motor:   '<circle cx="12" cy="12" r="9"/><path d="M8 8v8M8 12h8M16 8v8"/>',
      agua:    '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
      solar:   '<circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
      carpa:   '<path d="M12 4L3 19h18z"/><path d="M12 4v15"/><path d="M8.6 19c.8-2.6 2-4.2 3.4-4.2s2.6 1.6 3.4 4.2"/>',
      arbol:   '<path d="M12 3L6.5 11h3L5 17h14l-4.5-6h3z"/><path d="M12 17v4"/>',
      furgo:   '<rect x="2.5" y="8" width="13" height="8" rx="2"/><path d="M15.5 10h3.2l2.3 3.2V16h-5.5"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
      avion:   '<path d="M10.5 13.5L3 11l1.5-1.5L10 10l4.5-4.5a1.8 1.8 0 0 1 2.5 2.5L12.5 12.5l.5 5.5L11.5 19.5l-2.5-6.5z"/><path d="M4 20h16"/>'
    }[name] || '<circle cx="12" cy="12" r="9"/>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  };

  /* ---------- Images ---------- */
  const setImg = (id, url, alt) => { const el = $(id); if (el && url) { el.src = url; if (alt) el.alt = alt; } };
  setImg("heroImg", get("hero.foto"), "La Bellota, camper Weinsberg 2026, lista para salir en Gran Canaria");
  setImg("introImg", get("intro.foto"));
  setImg("nocheImg", get("noche.foto"), "Cielo estrellado sobre la camper");

  /* ---------- Claves ---------- */
  $("claves").innerHTML = (C.claves || []).map((c) =>
    '<div class="clave">' + I(c.icono) + "<div><b>" + esc(c.titulo) + "</b><span>" + esc(c.texto) + "</span></div></div>"
  ).join("");

  /* ---------- Galería ---------- */
  const fotos = (get("camper.fotos") || []).filter((f) => f && f.url);
  let fotoIdx = 0;
  const mainImg = $("galeriaMain");
  const renderFoto = () => {
    if (!fotos.length) return;
    const f = fotos[fotoIdx];
    mainImg.src = f.url; mainImg.alt = f.alt || "";
    $("galeriaCount").textContent = (fotoIdx + 1) + " / " + fotos.length;
    document.querySelectorAll("#galeriaThumbs button").forEach((b, i) => b.classList.toggle("active", i === fotoIdx));
  };
  $("galeriaThumbs").innerHTML = fotos.map((f, i) =>
    '<button type="button" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(f.url) + '" alt="" loading="lazy"></button>'
  ).join("");
  document.querySelectorAll("#galeriaThumbs button").forEach((b, i) =>
    b.addEventListener("click", () => { fotoIdx = i; renderFoto(); }));
  renderFoto();
  mainImg.addEventListener("click", () => {
    if (!fotos.length) return;
    $("lightboxImg").src = fotos[fotoIdx].url;
    $("lightbox").classList.add("open");
  });
  mainImg.style.cursor = "zoom-in";
  $("lightboxClose").addEventListener("click", () => $("lightbox").classList.remove("open"));
  $("lightbox").addEventListener("click", (e) => { if (e.target === $("lightbox")) $("lightbox").classList.remove("open"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("lightbox").classList.remove("open"); });

  /* ---------- Specs / equipamiento ---------- */
  $("specs").innerHTML = (get("camper.specs") || []).map((s) =>
    '<div class="spec">' + I(s.icono) + "<div><b>" + esc(s.valor) + "</b><span>" + esc(s.detalle) + "</span></div></div>"
  ).join("");
  $("equipamiento").innerHTML = (get("camper.equipamiento") || []).map((e) => "<li>" + esc(e) + "</li>").join("");

  /* ---------- Tarifas ---------- */
  const mesActual = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][new Date().getMonth() + 1];
  const enTemporada = (t) => (t.meses || "").toLowerCase().includes(mesActual);
  $("temporadas").innerHTML = (get("tarifas.temporadas") || []).map((t) =>
    '<div class="temporada' + (enTemporada(t) ? " destacada" : "") + '">' +
      "<div><b>" + esc(t.nombre) + "</b><span>" + esc(t.meses) + "</span></div>" +
      '<div class="precio">' + (typeof t.precio === "number" ? esc(t.precio) + " €<small>por noche</small>" : esc(t.precio)) + "</div>" +
    "</div>"
  ).join("");
  $("condiciones").innerHTML = (get("tarifas.condiciones") || []).map((c) =>
    "<li><span>" + esc(c.label) + "</span><b>" + esc(c.valor) + "</b></li>"
  ).join("");

  /* ---------- Pasos ---------- */
  $("pasos").innerHTML = (C.pasos || []).map((p) =>
    '<div class="step reveal"><div><h3>' + esc(p.titulo) + "</h3><p>" + esc(p.texto) + "</p></div></div>"
  ).join("");

  /* ---------- Reseñas ---------- */
  const star = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 .5-5.4 4.8L18.5 22 12 17.7 5.5 22l1.9-7.7L2 9.5 9 9z"/></svg>';
  $("reviews").innerHTML = (get("resenas.lista") || []).map((r) => {
    const n = Math.min(5, Math.max(1, +r.estrellas || 5));
    return '<article class="review reveal"><div class="stars" aria-label="' + n + ' de 5 estrellas">' + star.repeat(n) + "</div>" +
      "<p>“" + esc(r.texto) + "”</p><footer>" + esc(r.nombre) + "<span>" + esc(r.viaje) + "</span></footer></article>";
  }).join("");

  /* ---------- Formulario "deja tu opinión" ---------- */
  (function opina() {
    const form = $("opinaform");
    if (!form) return;
    let rating = 5;
    const wrap = $("opinaStars");
    const pintaStars = () => {
      wrap.innerHTML = [1, 2, 3, 4, 5].map((i) =>
        '<button type="button" class="' + (i <= rating ? "on" : "") + '" data-v="' + i + '" aria-label="' + i + ' estrellas">' + star + "</button>"
      ).join("");
      wrap.querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => { rating = +b.getAttribute("data-v"); pintaStars(); }));
    };
    pintaStars();
    const opinionTexto = () => {
      const f = new FormData(form);
      return "⭐ OPINIÓN para la web de La Bellota\n" +
        "· Nombre: " + f.get("nombre") + "\n" +
        "· Viaje: " + (f.get("viaje") || "-") + "\n" +
        "· Estrellas: " + rating + "/5\n" +
        "· Opinión: " + f.get("texto");
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      openWa(opinionTexto());
    });
    const mailBtn = $("opinaMail");
    if (mailBtn) mailBtn.addEventListener("click", () => {
      if (!form.reportValidity()) return;
      location.href = "mailto:" + (get("negocio.email") || "") +
        "?subject=" + encodeURIComponent("Opinión para la web de La Bellota") +
        "&body=" + encodeURIComponent(opinionTexto());
    });
  })();

  /* ---------- FAQ ---------- */
  $("faqLista").innerHTML = (C.faq || []).map((f) =>
    "<details><summary>" + esc(f.p) + "</summary><p>" + esc(f.r) + "</p></details>"
  ).join("");

  /* ---------- Disponibilidad (calendario) ---------- */
  (function calendario() {
    const cont = $("calMeses");
    if (!cont) return;
    const D = C.disponibilidad;
    if (!D) { const s = document.getElementById("disponibilidad"); if (s) s.hidden = true; return; }
    const ocupado = new Set(D.ocupado || []);
    const DOW = ["L", "M", "X", "J", "V", "S", "D"];
    const MESES_MAX = 12;
    const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const hoyD = new Date(); hoyD.setHours(0, 0, 0, 0);
    const hoyIso = iso(hoyD);
    let offset = 0, selA = null, selB = null;

    const fmt = (s) => new Date(s + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    const addDias = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return iso(d); };
    const noches = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5);
    const rangoLibre = (a, b) => { for (let d = a; d <= b; d = addDias(d, 1)) { if (ocupado.has(d)) return false; } return true; };

    const mesHtml = (base) => {
      const y = base.getFullYear(), m = base.getMonth();
      const nombre = base.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      const primero = new Date(y, m, 1);
      const pad = (primero.getDay() + 6) % 7;
      const dias = new Date(y, m + 1, 0).getDate();
      let cells = DOW.map((d) => '<span class="cal__dow">' + d + "</span>").join("");
      for (let i = 0; i < pad; i++) cells += '<span class="cal__dia vacio"></span>';
      for (let d = 1; d <= dias; d++) {
        const f = iso(new Date(y, m, d));
        let cls = "cal__dia", attr = "";
        if (f < hoyIso) cls += " pasado";
        else if (ocupado.has(f)) cls += " ocupado";
        else { cls += " libre"; attr = ' data-f="' + f + '" role="button" tabindex="0" aria-label="Elegir ' + f + '"'; }
        if (f === hoyIso) cls += " hoy";
        if (selA && selB && f >= selA && f <= selB) cls += (f === selA || f === selB) ? " sel" : " enrango";
        else if (selA && !selB && f === selA) cls += " sel";
        cells += "<span class=\"" + cls + "\"" + attr + ">" + d + "</span>";
      }
      return '<div class="cal__mes"><h3>' + nombre + '</h3><div class="cal__grid">' + cells + "</div></div>";
    };

    const pintar = () => {
      const b1 = new Date(hoyD.getFullYear(), hoyD.getMonth() + offset, 1);
      const b2 = new Date(hoyD.getFullYear(), hoyD.getMonth() + offset + 1, 1);
      cont.innerHTML = mesHtml(b1) + mesHtml(b2);
      $("calPrev").disabled = offset <= 0;
      $("calNext").disabled = offset + 1 >= MESES_MAX;
      cont.querySelectorAll("[data-f]").forEach((el) => {
        const pick = () => elegir(el.getAttribute("data-f"));
        el.addEventListener("click", pick);
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      });
      const acc = $("calAccion"), res = $("calResumen");
      if (selA && selB) {
        const n = noches(selA, selB);
        res.innerHTML = "Del <b>" + fmt(selA) + "</b> al <b>" + fmt(selB) + "</b> · " + n + (n === 1 ? " noche" : " noches");
        $("calWa").href = waUrl("Hola 🚐 He visto en el calendario que La Bellota está libre del " + selA + " al " + selB + " (" + n + (n === 1 ? " noche" : " noches") + "). ¿Me confirmáis disponibilidad y precio?");
        acc.hidden = false;
      } else if (selA) {
        res.innerHTML = "Recogida el <b>" + fmt(selA) + "</b> — ahora elige el día de devolución.";
        acc.hidden = false; $("calWa").removeAttribute("href");
      } else acc.hidden = true;
    };

    const setForms = () => {
      document.querySelectorAll('#quickbook [name="desde"], #bookform [name="desde"]').forEach((i) => (i.value = selA || ""));
      document.querySelectorAll('#quickbook [name="hasta"], #bookform [name="hasta"]').forEach((i) => (i.value = selB || ""));
    };

    function elegir(f) {
      if (!selA || (selA && selB)) { selA = f; selB = null; }
      else if (f <= selA) { selA = f; selB = null; }
      else if (!rangoLibre(selA, f)) {
        $("calAccion").hidden = false;
        $("calResumen").innerHTML = '<span class="err">Ese rango incluye días ocupados — elige otras fechas.</span>';
        selA = null; selB = null;
        setTimeout(pintar, 1600);
        return;
      } else selB = f;
      setForms(); pintar();
    }

    $("calPrev").addEventListener("click", () => { offset = Math.max(0, offset - 1); pintar(); });
    $("calNext").addEventListener("click", () => { offset = Math.min(MESES_MAX - 1, offset + 1); pintar(); });
    $("calLimpiar").addEventListener("click", () => { selA = selB = null; setForms(); pintar(); });
    pintar();
  })();

  /* ---------- Áreas de pernocta ---------- */
  (function areas() {
    const sec = document.getElementById("areas");
    if (!sec) return;
    const A = C.areas;
    if (!A || !(A.lista || []).length) {
      sec.hidden = true;
      document.querySelectorAll('a[href="#areas"]').forEach((a) => (a.parentElement || a).remove());
      return;
    }
    const btn = $("permisoBtn");
    if (A.permisoUrl) { btn.href = A.permisoUrl; btn.textContent = A.permisoLabel || "Pedir permiso"; }
    else btn.hidden = true;
    const ICONO_TIPO = { cabildo: "carpa", camping: "arbol", area: "furgo" };
    $("areasLista").innerHTML = A.lista.map((a) => {
      const tipo = (a.tipo || "area").trim().toLowerCase();
      const chips = String(a.servicios || "").split("·").map((s) => s.trim()).filter(Boolean)
        .map((s) => "<span>" + esc(s) + "</span>").join("");
      return '<article class="areacard reveal ' + esc(tipo) + '">' +
        '<div class="areacard__head">' + I(ICONO_TIPO[tipo] || "furgo") +
        "<div><h3>" + esc(a.nombre) + "</h3><span>" + esc(a.zona) + "</span></div></div>" +
        (chips ? '<div class="areacard__chips">' + chips + "</div>" : "") +
        (a.nota ? "<p>" + esc(a.nota) + "</p>" : "") +
      "</article>";
    }).join("");
    if (!A.aviso) $("areasAviso").hidden = true;
  })();

  /* ---------- Explora Gran Canaria (teaser) ---------- */
  (function explora() {
    const sec = document.getElementById("explora");
    if (!sec) return;
    const E = C.explora;
    if (!E || !(E.lista || []).length) {
      sec.hidden = true;
      document.querySelectorAll('a[href^="explora-gran-canaria"]').forEach((a) => { if (a.closest("nav")) (a.parentElement || a).remove(); });
      return;
    }
    document.getElementById("exploraCards").innerHTML = E.lista.map((l) =>
      '<a class="explorecard reveal" href="explora-gran-canaria/#' + esc(l.slug) + '">' +
        '<img src="' + esc(l.foto) + '" alt="' + esc(l.nombre) + '" loading="lazy" decoding="async">' +
        '<div class="in"><b>' + esc(l.nombre) + "</b><span>" + esc(l.municipio) + "</span><p>" + esc(l.texto) + "</p></div>" +
      "</a>"
    ).join("");
  })();

  /* ---------- La Bellota Extremeña ---------- */
  (function hermano() {
    const sec = document.getElementById("extremena");
    if (!sec) return;
    if (!C.hermano || !C.hermano.titulo) { sec.hidden = true; document.querySelectorAll('a[href="#extremena"]').forEach((a) => (a.parentElement || a).remove()); return; }
    $("hermanoLinks").innerHTML = (C.hermano.enlaces || []).map((l) =>
      '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>"
    ).join("");
    const t = $("hermanoTel");
    if (t) t.href = "tel:+34" + (C.hermano.telefono || "").replace(/\D/g, "");
  })();

  /* ---------- Contact links ---------- */
  const wa = (get("negocio.whatsapp") || "").replace(/\D/g, "");
  const waUrl = (text) => "https://wa.me/" + wa + (text ? "?text=" + encodeURIComponent(text) : "");
  const saludo = "Hola, me interesa alquilar La Bellota 🚐";
  ["waFloat", "waSticky", "waFooter"].forEach((id) => { const el = $(id); if (el) el.href = waUrl(saludo); });
  const tel = $("telLink"); if (tel) tel.href = "tel:" + (get("negocio.telefono") || "").replace(/\s/g, "");
  const mail = $("mailLink"); if (mail) mail.href = "mailto:" + (get("negocio.email") || "");
  const ig = get("negocio.instagram") || "";
  [["igLink", "@" + ig], ["igFooter", "Instagram"]].forEach(([id, label]) => {
    const el = $(id); if (el) { el.href = "https://instagram.com/" + ig; el.textContent = label; }
  });

  /* ---------- Forms -> WhatsApp ---------- */
  const openWa = (msg) => window.open(waUrl(msg), "_blank");
  $("quickbook").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    openWa("Hola, ¿está libre La Bellota del " + f.get("desde") + " al " + f.get("hasta") + "? 🚐");
  });
  $("bookform").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    openWa(
      "Hola, soy " + f.get("nombre") + " y quiero reservar La Bellota 🚐\n" +
      "· Fechas: del " + f.get("desde") + " al " + f.get("hasta") + "\n" +
      "· Viajamos: " + f.get("personas") + "\n" +
      "· Contacto: " + f.get("contacto") +
      (f.get("mensaje") ? "\n· Mensaje: " + f.get("mensaje") : "")
    );
  });

  /* ---------- Nav ---------- */
  const toggle = $("navtoggle"), nav = $("mainnav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  /* ---------- Scroll behaviors ---------- */
  const topbar = $("topbar"), sticky = $("stickycta");
  addEventListener("scroll", () => {
    topbar.classList.toggle("solid", scrollY > 40);
    sticky.classList.toggle("show", scrollY > innerHeight * 0.9);
  }, { passive: true });

  /* ---------- Reveal on scroll ---------- */
  const targets = document.querySelectorAll(".reveal");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.1 });
    targets.forEach((el) => io.observe(el));
  }

  $("year").textContent = new Date().getFullYear();

  /* ---------- Date sanity: min = today ---------- */
  const hoy = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach((i) => (i.min = hoy));
})();
