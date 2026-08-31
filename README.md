# La Bellota Campers 🚐

Web del negocio de alquiler de furgoneta camper de Nahum en Gran Canaria, con panel de
administración propio para editar textos, precios, fotos y contenido sin tocar código.

**Producción**: https://www.labellotacampers.com (dominio en Hostalia → Vercel, auto-deploy en cada push)
· alias: https://la-bellota.vercel.app/
· espejo en https://sosaalfredo.github.io/la-bellota/ (GitHub Pages)
· panel: https://www.labellotacampers.com/admin
· ficha Yescapa (fuente de los datos reales): https://www.yescapa.es/campers/121413

## Arquitectura

Sitio estático con un único paso de build en Vercel: **prerender para SEO/GEO**.
`scripts/prerender.mjs` ejecuta en build el mismo render que hace el navegador
(jsdom + `content.js`) y escribe en `dist/` el HTML ya relleno — los bots de IA
(GPTBot, ClaudeBot, PerplexityBot…) no ejecutan JavaScript y sin esto verían la web
vacía. También genera `sitemap.xml`, `robots.txt`, `llms.txt` y el JSON-LD de la home,
siempre en sincronía con `content.js`. El cliente sigue ejecutando los mismos scripts
(repinta idéntico contenido), y si el render sale incompleto **el build falla** y
Vercel conserva el deploy anterior. El espejo de GitHub Pages sirve la versión sin
prerender (el canonical apunta al dominio).

```
index.html            La web pública
assets/styles.css     Estilos
assets/main.js        Render (pinta el contenido) e interacciones
assets/track.js       Medición de audiencia sin cookies (visitas + clics)
api/e.js              Ingesta de métricas (Edge Function → Redis/Upstash)
api/stats.js          Consulta de métricas para el panel (tras Basic Auth)
content/content.js    ⭐ TODO el contenido editable (window.SITE_CONTENT)
content/img/          Imágenes subidas desde el panel
admin/index.html      Panel de administración
```

`index.html` no contiene textos de negocio: todo (textos, precios, fotos, FAQ, rutas,
reseñas…) vive en `content/content.js` y la página se rellena al cargar.

## Panel de administración (`/admin`)

- **Login**: el panel está protegido con usuario y contraseña (HTTP Basic Auth) mediante
  Vercel Edge Middleware ([middleware.js](middleware.js)). Las credenciales se definen en
  las variables de entorno `ADMIN_USER` y `ADMIN_PASS` del proyecto en Vercel (nunca en el
  repo); sin ellas el panel responde 503 (cerrado). En el espejo de GitHub Pages el panel
  redirige al dominio, donde sí hay login.

- **Editar**: cada sección de la web tiene su formulario. Los cambios se guardan como
  **borrador** en el navegador (localStorage), no tocan la web publicada.
- **Vista previa**: abre `index.html?preview=1`, que pinta el borrador con una barra
  naranja de aviso.
- **Publicar**: sube `content/content.js` al repositorio vía API de GitHub. GitHub Pages
  redespliega la web en 1–2 minutos.
- **Imágenes**: se pueden pegar URLs o subir archivos al repo (van a `content/img/`).
- **Copias**: exportar/importar `content.js` a mano, por si se prefiere sin GitHub.

### Token de GitHub (una sola vez, lo crea el dueño del repo)

GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate:
Repository access = *Only select repositories* → este repo; Permissions →
Repository → **Contents: Read and write**. Se pega en el panel (⚙️ Publicación) y queda
guardado solo en ese navegador. **Nunca compartir el token por chat/email.**

## Desarrollo local

Servir la carpeta con cualquier estático, p. ej.:

```bash
python -m http.server 8642
```

(`file://` también funciona para ver la web, pero el panel publica mejor vía http.)

## Datos reales (sincronizados de Yescapa el 29/08/2026)

Ficha técnica (Weinsberg 2026, 6 m, 4 plazas), fotos de la furgo, precios (desde 110 €/noche,
descuentos −10 %), fianza 800 €, 200 km/día, aeropuerto 20 € i/v, sin mascotas ni fumar.

## Pendiente

- **Lugar de entrega** (Estetic Park, Ojos de Garza): Nahum busca base más cercana a la
  capital — cambiar en `content.js`/legales cuando la tenga. (El teléfono nuevo
  624 22 07 78 ya está puesto — verificar que su WhatsApp está activo.)
- **Precio de temporada alta**: Nahum no lo pasó (solo "mínimo 4 noches") — está como
  "Consultar". Preguntar también si junio es baja o alta (lo puso en ambas).
- **Email**: labellotaextremena@gmail.com — sustituir por `reservas@labellotacampers.com`
  cuando se cree el buzón en Hostalia (1 buzón de 2 GB incluido, sin usar).
- **Legales**: quedan huecos amarillos (señal, franquicia del seguro, exclusiones de póliza,
  cargos por retraso/gestión de multas, tramos de cancelación, edad mínima del conductor)
  — completar con Nahum y revisión profesional.
- **Reseñas**: la camper es nueva; la web enlaza a la ficha de Yescapa mientras llegan.
- **DNS**: crear en Hostalia `A @ → 216.198.79.1` y `CNAME www → 18d97c7a40c02a4e.vercel-dns-017.com`.

## Formulario

Sin backend: los formularios componen el mensaje y abren WhatsApp con el texto listo
para que el cliente lo envíe.

## Estadísticas de uso (sin cookies)

Dos capas, ambas anónimas y servidas desde el propio dominio (la CSP no cambia):

1. **Vercel Web Analytics** — visitas, páginas, orígenes, países y dispositivos.
   Se activa una vez en vercel.com → proyecto → Analytics → Enable (plan gratuito:
   50 000 eventos/mes, retención 1 mes). `track.js` inyecta su script solo en producción.
2. **Registro propio** — `assets/track.js` envía beacons a `api/e.js` (Edge Function),
   que acumula contadores diarios en Redis (Upstash gratuito vía Vercel Marketplace):
   páginas vistas, únicos/día (HyperLogLog con hash diario irreversible, sin guardar IP),
   clics en WhatsApp/teléfono/email, formularios, calendario, galería, Explora, scroll…
   Se consulta en el panel **/admin → 📊 Estadísticas** (`api/stats.js`, tras el login).
   Sin la base de datos configurada todo queda en no-op y la web no se ve afectada.
   Los navegadores con el panel configurado (localStorage `labellota_gh`) no se cuentan;
   `localStorage.setItem("labellota_notrack","1")` excluye cualquier otro navegador propio.
