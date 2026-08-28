# La Bellota Campers 🚐

Web del negocio de alquiler de campers y autocaravanas de Nahum (Gran Canaria).

Sitio estático en un único `index.html` autocontenido: CSS y JS inline, ilustraciones SVG
incrustadas (sin dependencias, sin build). Se puede servir desde cualquier hosting estático
(GitHub Pages, Vercel, Netlify…).

## Desarrollo

Abrir `index.html` en el navegador. No hay proceso de build.

## Datos provisionales pendientes de reemplazar

Todo el contenido es un borrador inventado para el arranque:

- **Teléfono/WhatsApp**: `+34 600 00 00 00` — buscar `34600000000` (aparece en varios enlaces
  y en la constante `WHATSAPP_NUM` del script) y sustituir por el número real.
- **Email**: `hola@labellotacampers.com`
- **Instagram**: `@labellotacampers`
- **Base**: Las Palmas de Gran Canaria (asumido)
- **Flota**: El Drago / La Sabina / La Encina — nombres, plazas, medidas y precios inventados.
- **Precios**: 89 / 109 / 129 €/día, señal 25 %, fianza 600 €, mascota 30 €, aeropuerto 40 € —
  todos provisionales.
- **Reseñas**: de ejemplo (marcadas con nota en la propia web).
- **Ilustraciones SVG**: placeholders con estilo propio hasta tener fotos reales de las campers.
- **Aviso legal / Privacidad / Cookies**: enlaces vacíos, pendientes de redactar.

## Formulario

El formulario no tiene backend: compone el mensaje y abre WhatsApp con el texto listo
para que el cliente lo envíe. Si más adelante se quiere email/backend, sustituir el handler
`submit` en el script final de `index.html`.
