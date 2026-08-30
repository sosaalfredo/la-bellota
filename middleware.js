/* LA BELLOTA CAMPERS — protección del panel /admin (Vercel Edge Middleware)
   Exige usuario y contraseña (HTTP Basic Auth sobre HTTPS) para todo /admin.
   Las credenciales viven en variables de entorno del proyecto en Vercel
   (ADMIN_USER y ADMIN_PASS) — nunca en este repositorio, que es público.
   Si las variables no están configuradas, el panel queda CERRADO (503). */

export const config = { matcher: ["/admin", "/admin/:path*"] };

// Comparación en tiempo constante para no filtrar información por timing.
function safeEqual(a, b) {
  const x = String(a), y = String(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export default function middleware(request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;

  if (!user || !pass) {
    return new Response("Panel no disponible: falta configurar las credenciales en Vercel.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const auth = request.headers.get("authorization") || "";
  const [scheme, encoded] = auth.split(" ");
  if (scheme === "Basic" && encoded) {
    try {
      const decoded = atob(encoded);
      const sep = decoded.indexOf(":");
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (safeEqual(u, user) && safeEqual(p, pass)) {
        return; // credenciales correctas -> continúa hacia el panel
      }
    } catch (e) { /* cabecera malformada -> 401 */ }
  }

  // Fricción anti fuerza-bruta: cada intento fallido espera ~1 s antes de
  // responder. Sin estado y gratis en Edge; encarece el diccionario.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Response("Autenticación requerida", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Panel La Bellota", charset="UTF-8"',
          "content-type": "text/plain; charset=utf-8",
        },
      }));
    }, 1000);
  });
}
