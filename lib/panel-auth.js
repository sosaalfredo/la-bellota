/* LA BELLOTA CAMPERS — quién puede entrar en el panel /admin
   Lo comparten el middleware (que cierra la puerta) y /api/gh (que publica),
   para que no acaben existiendo dos definiciones distintas de "cuenta válida".

   Las cuentas viven en variables de entorno del proyecto en Vercel, nunca en
   este repositorio, que es público:

     ADMIN_USER / ADMIN_PASS   cuenta principal (Alfredo)
     ADMIN_USERS               cuentas adicionales, UNA POR LÍNEA, con el
                               formato usuario:contraseña (Nahum, y quien venga)

   Si no hay ninguna configurada, el panel queda cerrado. */

export function cuentas() {
  const lista = [];
  const u = process.env.ADMIN_USER, p = process.env.ADMIN_PASS;
  if (u && p) lista.push([u, p]);
  for (const linea of String(process.env.ADMIN_USERS || "").split("\n")) {
    const l = linea.trim();
    const sep = l.indexOf(":");
    if (sep > 0) lista.push([l.slice(0, sep), l.slice(sep + 1)]);
  }
  return lista;
}

// Comparación en tiempo constante para no filtrar información por timing.
function igual(a, b) {
  const x = String(a), y = String(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

/* Devuelve el nombre de quien se ha identificado, o "" si las credenciales no
   valen. Recorre SIEMPRE la lista entera: así el tiempo de respuesta no delata
   ni cuántas cuentas hay ni cuál ha acertado. */
export function usuarioAutenticado(request) {
  const [scheme, encoded] = (request.headers.get("authorization") || "").split(" ");
  if (scheme !== "Basic" || !encoded) return "";

  let texto;
  try {
    // atob devuelve bytes sueltos: hay que descodificarlos como UTF-8, que es
    // como los manda el navegador (charset="UTF-8" del WWW-Authenticate).
    const bin = atob(encoded);
    texto = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch (e) {
    return ""; // cabecera malformada
  }

  const sep = texto.indexOf(":");
  if (sep < 0) return "";
  const u = texto.slice(0, sep), p = texto.slice(sep + 1);

  let quien = "";
  for (const [cu, cp] of cuentas()) if (igual(u, cu) && igual(p, cp)) quien = cu;
  return quien;
}
