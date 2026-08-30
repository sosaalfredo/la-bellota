# La Bellota Campers 🚐

Web del negocio de alquiler de furgoneta camper de Nahum en Gran Canaria, con panel de
administración propio para editar textos, precios, fotos y contenido sin tocar código.

**Producción**: https://www.labellotacampers.com (dominio en Hostalia → Vercel, auto-deploy en cada push)
· alias: https://la-bellota.vercel.app/
· espejo en https://sosaalfredo.github.io/la-bellota/ (GitHub Pages)
· panel: https://www.labellotacampers.com/admin
· ficha Yescapa (fuente de los datos reales): https://www.yescapa.es/campers/121413

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

## Datos reales (sincronizados de Yescapa el 29/08/2026)

Ficha técnica (Weinsberg 2026, 6 m, 4 plazas), fotos de la furgo, precios (desde 110 €/noche,
descuentos −10 %), fianza 800 €, 200 km/día, aeropuerto 20 € i/v, sin mascotas ni fumar.

## Pendiente

- **Teléfono/WhatsApp** (609 56 83 15) y **lugar de entrega** (Estetic Park, Ojos de Garza):
  datos reales de Nahum, pero avisó de que sacará un número nuevo y busca base más
  cercana a la capital — cambiar en `content.js`/legales cuando lo haga.
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
