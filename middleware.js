/* LA BELLOTA CAMPERS — protección del panel /admin (Vercel Edge Middleware)
   Exige usuario y contraseña (HTTP Basic Auth sobre HTTPS) para todo /admin,
   para la API de estadísticas (/api/stats) y para la de publicación (/api/gh).
   Estas dos últimas se sirven además como /admin/api/… mediante rewrite, para
   reutilizar las credenciales que el navegador ya tiene del panel.

   Las cuentas viven en variables de entorno del proyecto en Vercel (detalle en
   lib/panel-auth.js) — nunca en este repositorio, que es público. Si no hay
   ninguna configurada, el panel queda CERRADO (503). */

import { cuentas, usuarioAutenticado } from "./lib/panel-auth.js";

export const config = { matcher: ["/admin", "/admin/:path*", "/api/stats", "/api/gh"] };

export default function middleware(request) {
  if (!cuentas().length) {
    return new Response("Panel no disponible: falta configurar las credenciales en Vercel.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (usuarioAutenticado(request)) return; // credenciales correctas -> continúa hacia el panel

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
