"""Genera variantes responsive de las fotos de content/img y content/img/explora.

JPEG  -w480, -w960   → compatibilidad y respaldo (src del <img>).
WebP  -w320, -w480, -w960 y copia del original → lo que sirve el srcset.

El srcset de main.js/explora.js pide WebP y deja el JPEG original como src:
si un navegador no entiende WebP (o falta la variante porque la foto se subió
desde el panel), el listener de error quita el srcset y carga el JPEG.

Progresivo, sin EXIF, sin tocar los originales. Idempotente: salta lo hecho.
"""
import os, sys, glob
from PIL import Image, ImageOps

ROOT = sys.argv[1]
JPEG_WIDTHS = [480, 960]
WEBP_WIDTHS = [320, 480, 960]
dirs = [os.path.join(ROOT, "content", "img"), os.path.join(ROOT, "content", "img", "explora")]
made, skipped, total = 0, 0, 0

for d in dirs:
    for f in sorted(glob.glob(os.path.join(d, "*.jpg"))):
        name = os.path.basename(f)
        if "-w320" in name or "-w480" in name or "-w960" in name:
            continue
        base = name[:-4]
        im = None

        def original():
            global im
            if im is None:
                im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
            return im

        for w in JPEG_WIDTHS:
            out = os.path.join(d, f"{base}-w{w}.jpg")
            if os.path.exists(out):
                skipped += 1; continue
            src = original()
            if src.width <= w:
                continue  # el original ya es menor: no crear variante mayor
            h = round(src.height * w / src.width)
            src.resize((w, h), Image.LANCZOS).save(out, "JPEG", quality=80, optimize=True, progressive=True)
            made += 1; total += os.path.getsize(out)

        for w in WEBP_WIDTHS:
            out = os.path.join(d, f"{base}-w{w}.webp")
            if os.path.exists(out):
                skipped += 1; continue
            src = original()
            if src.width <= w:
                continue
            h = round(src.height * w / src.width)
            src.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=76, method=6)
            made += 1; total += os.path.getsize(out)

        out = os.path.join(d, f"{base}.webp")
        if os.path.exists(out):
            skipped += 1
        else:
            original().save(out, "WEBP", quality=78, method=6)
            made += 1; total += os.path.getsize(out)

print(f"creadas {made} variantes ({total//1024} KB), {skipped} ya existian")
