"""Genera favicon.ico, PNGs y apple-touch-icon a partir del SVG de la bellota (mismo dibujo que el data: URI)."""
import io, os, sys
import fitz  # PyMuPDF rasteriza SVG sin depender de cairo
from PIL import Image

ROOT = sys.argv[1]
ICONS = os.path.join(ROOT, "assets", "icons")
os.makedirs(ICONS, exist_ok=True)

# Mismo SVG que el <link rel="icon"> actual (bellota verde/miel), fondo transparente
SVG = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'>
<path d='M10 17 Q10 8 24 8 Q38 8 38 17 L38 20 L10 20 Z' fill='#2E5940'/>
<path d='M12 20 L36 20 Q36 34 24 42 Q12 34 12 20 Z' fill='#E8A03C'/>
</svg>"""

# Version con fondo (para apple-touch-icon y maskable): fondo verde oscuro de la marca, bellota centrada
SVG_BG = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'>
<rect width='48' height='48' rx='10' fill='#182B20'/>
<g transform='translate(24 25) scale(0.78) translate(-24 -24)'>
<path d='M10 17 Q10 8 24 8 Q38 8 38 17 L38 20 L10 20 Z' fill='#4E8A64'/>
<path d='M12 20 L36 20 Q36 34 24 42 Q12 34 12 20 Z' fill='#E8A03C'/>
</g></svg>"""

def png(svg, size):
    doc = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
    page = doc[0]
    zoom = size / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=True)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
    return img.resize((size, size), Image.LANCZOS) if img.size != (size, size) else img

png(SVG, 32).save(os.path.join(ICONS, "favicon-32.png"), optimize=True)
png(SVG, 16).save(os.path.join(ICONS, "favicon-16.png"), optimize=True)
png(SVG_BG, 180).convert("RGB").save(os.path.join(ICONS, "apple-touch-icon.png"), optimize=True)
png(SVG_BG, 192).save(os.path.join(ICONS, "icon-192.png"), optimize=True)
png(SVG_BG, 512).save(os.path.join(ICONS, "icon-512.png"), optimize=True)

# favicon.ico multi-tamano en la raiz
ico_sizes = [16, 32, 48]
imgs = [png(SVG, s) for s in ico_sizes]
imgs[0].save(os.path.join(ROOT, "favicon.ico"), format="ICO", sizes=[(s, s) for s in ico_sizes], append_images=imgs[1:])

for f in sorted(os.listdir(ICONS)):
    print(f, os.path.getsize(os.path.join(ICONS, f)), "B")
print("favicon.ico", os.path.getsize(os.path.join(ROOT, "favicon.ico")), "B")
