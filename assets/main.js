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
      solar:   '<circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'
    }[name] || '<circle cx="12" cy="12" r="9"/>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  };

  /* ---------- Images ---------- */
  const setImg = (id, url, alt) => { const el = $(id); if (el && url) { el.src = url; if (alt) el.alt = alt; } };
  setImg("heroImg", get("hero.foto"), "La Bellota junto al mar a la hora dorada");
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
      '<div class="precio">' + esc(t.precio) + " €<small>por noche</small></div>" +
    "</div>"
  ).join("");
  $("condiciones").innerHTML = (get("tarifas.condiciones") || []).map((c) =>
    "<li><span>" + esc(c.label) + "</span><b>" + esc(c.valor) + "</b></li>"
  ).join("");

  /* ---------- Pasos ---------- */
  $("pasos").innerHTML = (C.pasos || []).map((p) =>
    '<div class="step reveal"><div><h3>' + esc(p.titulo) + "</h3><p>" + esc(p.texto) + "</p></div></div>"
  ).join("");

  /* ---------- Rutas ---------- */
  $("rutasLista").innerHTML = (get("rutas.lista") || []).map((r) =>
    '<article class="ruta reveal">' +
      '<div class="ruta__img"><img src="' + esc(r.foto) + '" alt="' + esc(r.titulo) + '" loading="lazy"></div>' +
      '<div class="ruta__body"><div class="ruta__meta"><span>' + esc(r.dias) + "</span><span>·</span><span>" + esc(r.zona) + "</span></div>" +
      "<h3>" + esc(r.titulo) + "</h3><p>" + esc(r.texto) + "</p></div></article>"
  ).join("");

  /* ---------- Reseñas ---------- */
  const star = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 .5-5.4 4.8L18.5 22 12 17.7 5.5 22l1.9-7.7L2 9.5 9 9z"/></svg>';
  $("reviews").innerHTML = (get("resenas.lista") || []).map((r) =>
    '<article class="review reveal"><div class="stars" aria-label="5 de 5 estrellas">' + star.repeat(5) + "</div>" +
    "<p>“" + esc(r.texto) + "”</p><footer>" + esc(r.nombre) + "<span>" + esc(r.viaje) + "</span></footer></article>"
  ).join("");

  /* ---------- FAQ ---------- */
  $("faqLista").innerHTML = (C.faq || []).map((f) =>
    "<details><summary>" + esc(f.p) + "</summary><p>" + esc(f.r) + "</p></details>"
  ).join("");

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
