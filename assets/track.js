/* =========================================================
   LA BELLOTA CAMPERS — MEDICIÓN DE AUDIENCIA (sin cookies)
   Dos capas, ambas servidas desde nuestro propio dominio:
   1) Vercel Web Analytics (visitas, orígenes, países, dispositivos).
   2) Registro propio de eventos → /api/e (clics en WhatsApp/teléfono,
      formularios, calendario, galería, scroll…). Se consulta desde
      el panel /admin → 📊 Estadísticas.
   Privacidad: sin cookies ni identificadores persistentes; los únicos
   diarios se estiman en el servidor con un hash irrecuperable que rota
   cada día. Las visitas desde el navegador del administrador (tiene
   configurado el panel) no se cuentan.
   ========================================================= */
(function () {
  "use strict";

  // Solo en producción (dominio propio o alias de Vercel); nunca en
  // local ni en el espejo de GitHub Pages, y nunca en modo vista previa.
  var HOST_OK = /(^|\.)labellotacampers\.com$|(^|\.)vercel\.app$/.test(location.hostname);
  if (!HOST_OK) return;
  if (/[?&]preview=1/.test(location.search)) return;

  // El propio equipo no cuenta como visita: si este navegador tiene el
  // panel configurado (o pidió no ser contado), no se envía nada.
  try {
    if (localStorage.getItem("labellota_gh") || localStorage.getItem("labellota_notrack")) return;
  } catch (e) { /* almacenamiento bloqueado: seguimos midiendo */ }

  /* ---- Capa 1: Vercel Web Analytics (script same-origin) ---- */
  var s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);

  /* ---- Capa 2: registro propio ---- */
  var enviados = 0;
  function send(data) {
    if (enviados++ > 50) return; // tope de cortesía por página vista
    var body = JSON.stringify(data);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/e", new Blob([body], { type: "application/json" }))) return;
    } catch (e) { /* cae al fetch */ }
    try {
      fetch("/api/e", { method: "POST", body: body, keepalive: true, headers: { "content-type": "application/json" } });
    } catch (e) { /* sin red: no pasa nada */ }
  }
  function ev(nombre, etiqueta) {
    send({ k: "ev", n: nombre, l: etiqueta || "", p: path() });
  }
  function path() {
    var p = location.pathname.replace(/\/index\.html$/, "/");
    return p === "" ? "/" : p;
  }

  // Página vista
  send({
    k: "pv",
    p: path(),
    r: document.referrer || "",
    d: matchMedia("(max-width: 820px)").matches ? "m" : "d"
  });
  // Llegada desde campaña (enlaces con utm_source)
  var utm = new URLSearchParams(location.search).get("utm_source");
  if (utm) ev("campana", utm);

  // Contexto de un elemento: id propio o de la sección/zona que lo contiene
  function contexto(el) {
    if (el.id) return el.id;
    var z = el.closest("section[id],main[id],footer,header,nav");
    if (!z) return "";
    return z.id || z.tagName.toLowerCase();
  }

  // Clics (delegación global, en captura para adelantarse a preventDefault)
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;

    var a = t.closest("a[href]");
    if (a) {
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      var ctx = contexto(a);
      if (url.protocol === "tel:") return ev("telefono", ctx);
      if (url.protocol === "mailto:") return ev("email", ctx);
      if (/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(url.hostname)) return ev("whatsapp", ctx);
      if (/(^|\.)instagram\.com$/.test(url.hostname)) return ev("instagram", ctx);
      if (url.hostname !== location.hostname) return ev("externo", url.hostname);
      if (/\/legal\//.test(url.pathname)) return ev("legal", url.pathname.split("/").pop().replace(".html", ""));
      if (/explora-gran-canaria/.test(url.pathname)) return ev("explora", ctx);
      if (url.hash) return ev("nav", url.hash.slice(0, 30));
      return; // resto de enlaces internos: ya salen como página vista
    }

    if (t.closest("#galeriaThumbs, #galeriaMain, .galeria__main")) return ev("galeria");
    var dia = t.closest(".cal__dia");
    if (dia && !dia.classList.contains("vacio")) return ev("calendario", "dia");
    if (t.closest("#opinaStars")) return ev("opinion_estrellas");
  }, true);

  // Envío de formularios (los manejadores de la web hacen preventDefault
  // y abren WhatsApp; este listener en captura cuenta el intento igualmente)
  var FORMS = { quickbook: "form_fechas", bookform: "form_reserva", opinaform: "form_opinion" };
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f && f.id && FORMS[f.id]) ev(FORMS[f.id]);
  }, true);

  // Profundidad de lectura (una sola vez por umbral)
  var hitos = { 50: false, 90: false };
  addEventListener("scroll", function () {
    var h = document.documentElement;
    var total = h.scrollHeight - innerHeight;
    if (total <= 0) return;
    var pct = (scrollY / total) * 100;
    [50, 90].forEach(function (u) {
      if (!hitos[u] && pct >= u) { hitos[u] = true; ev("scroll", String(u)); }
    });
  }, { passive: true });
})();
