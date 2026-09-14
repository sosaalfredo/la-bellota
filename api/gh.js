/* LA BELLOTA CAMPERS — publicar desde el panel sin tocar GitHub
   (Vercel Edge Function)

   El panel escribe content/content.js y sube fotos al repositorio. Antes cada
   persona tenía que pegar su propio token de GitHub en el navegador; con esto
   basta el enlace del panel y la contraseña: el token vive en una variable de
   entorno del servidor (GITHUB_TOKEN) y no sale de aquí.

   Va detrás del mismo Basic Auth que /admin (matcher del middleware) y además
   lo comprueba por su cuenta: es un endpoint de ESCRITURA sobre un repositorio
   público, así que no conviene que dependa de una sola cerradura.

   Se llama desde el panel como /admin/api/gh (rewrite en vercel.json) para que
   el navegador mande las credenciales que ya tiene:

     GET  …/api/gh                          -> { ok, owner, repo, branch }
                                               (sonda: ¿publica el servidor?)
     GET  …/api/gh?path=content/content.js  -> el fichero (respuesta de GitHub)
     PUT  …/api/gh  { path, content, message } -> lo crea o lo actualiza
*/

import { usuarioAutenticado } from "../lib/panel-auth.js";

export const config = { runtime: "edge" };

// Solo el contenido editable del panel: nunca código, workflows ni configuración.
const RUTA_OK = /^content\/(content\.js|img\/[a-z0-9][a-z0-9._-]{0,80}\.(jpg|jpeg|png|webp))$/;
const MAX = 4 * 1024 * 1024; // el panel ya limita las fotos a 3 MB

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export default async function handler(req) {
  const quien = usuarioAutenticado(req);
  if (!quien) return json({ error: "No autorizado" }, 401);

  const token = process.env.GITHUB_TOKEN;
  if (!token) return json({ error: "Falta GITHUB_TOKEN en el proyecto de Vercel." }, 503);

  const owner = process.env.GH_OWNER || "sosaalfredo";
  const repo = process.env.GH_REPO || "la-bellota";
  const branch = process.env.GH_BRANCH || "main";

  const cab = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "la-bellota-panel",
  };
  const contents = (ruta) => `https://api.github.com/repos/${owner}/${repo}/contents/${ruta}`;

  if (req.method === "GET") {
    const ruta = new URL(req.url).searchParams.get("path");
    if (!ruta) return json({ ok: true, owner, repo, branch }); // sonda del panel
    if (!RUTA_OK.test(ruta)) return json({ error: "Ruta no permitida" }, 400);
    const r = await fetch(contents(ruta) + "?ref=" + branch, { headers: cab, cache: "no-store" });
    return json(await r.json().catch(() => ({})), r.status);
  }

  if (req.method === "PUT") {
    let b;
    try {
      b = await req.json();
    } catch (e) {
      return json({ error: "Cuerpo inválido" }, 400);
    }
    const ruta = String(b.path || "");
    if (!RUTA_OK.test(ruta)) return json({ error: "Ruta no permitida" }, 400);
    const contenido = String(b.content || "");
    if (!contenido || contenido.length > MAX) {
      return json({ error: "Contenido vacío o demasiado grande" }, 400);
    }

    // GitHub exige el sha del fichero actual para sustituirlo; si no existe, se crea.
    let sha;
    const head = await fetch(contents(ruta) + "?ref=" + branch, { headers: cab, cache: "no-store" });
    if (head.ok) sha = (await head.json()).sha;

    // El mensaje lleva quién ha publicado: en el historial se ve de un vistazo.
    const mensaje = String(b.message || "content: actualización desde el panel").slice(0, 120) + " · " + quien;
    const r = await fetch(contents(ruta), {
      method: "PUT",
      headers: { ...cab, "content-type": "application/json" },
      body: JSON.stringify({ message: mensaje, branch, content: contenido, ...(sha ? { sha } : {}) }),
    });
    return json(await r.json().catch(() => ({})), r.status);
  }

  return json({ error: "Método no permitido" }, 405);
}
