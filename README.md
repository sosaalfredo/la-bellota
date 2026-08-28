# La Bellota Campers 🚐

Web del negocio de alquiler de furgoneta camper de Nahum en Gran Canaria, con panel de
administración propio para editar textos, precios, fotos y contenido sin tocar código.

## Arquitectura

Sitio 100 % estático (sin build, sin backend). Se sirve desde cualquier hosting estático
(GitHub Pages, Vercel, Netlify…).

```
index.html            La web pública
assets/styles.css     Estilos
assets/main.js        Render (pinta el contenido) e interacciones
content/content.js    ⭐ TODO el contenido editable (window.SITE_CONTENT)
content/img/          Imágenes subidas desde el panel
admin/index.html      Panel de administración
```

`index.html` no contiene textos de negocio: todo (textos, precios, fotos, FAQ, rutas,
reseñas…) vive en `content/content.js` y la página se rellena al cargar.

## Panel de administración (`/admin`)

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

## Datos provisionales pendientes

- ✅ Teléfono/WhatsApp y email: los de Alfredo (temporal para pruebas).
- **Fotos**: de Unsplash (licencia libre) como placeholder — sustituir por fotos reales
  de la furgoneta desde el panel.
- **Ficha técnica, precios y condiciones**: inventados de forma realista — revisar con Nahum.
- **Reseñas**: de ejemplo (la web lo avisa) — vaciar el aviso cuando haya reales.
- **Instagram** `@labellotacampers`: por confirmar.
- **Aviso legal / Privacidad / Cookies**: pendientes de redactar.

## Formulario

Sin backend: los formularios componen el mensaje y abren WhatsApp con el texto listo
para que el cliente lo envíe.
