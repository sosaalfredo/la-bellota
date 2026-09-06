"""Genera variantes responsive (-w480, -w960) de las fotos JPEG de content/img y content/img/explora.
Progresivo, q80, sin EXIF, sin tocar los originales. Idempotente: salta las que ya existen."""
import os, sys, glob
from PIL import Image, ImageOps

ROOT = sys.argv[1]
WIDTHS = [480, 960]
dirs = [os.path.join(ROOT, "content", "img"), os.path.join(ROOT, "content", "img", "explora")]
made, skipped, total = 0, 0, 0
for d in dirs:
    for f in sorted(glob.glob(os.path.join(d, "*.jpg"))):
        name = os.path.basename(f)
        if "-w480" in name or "-w960" in name:
            continue
        base = name[:-4]
        im = None
        for w in WIDTHS:
            out = os.path.join(d, f"{base}-w{w}.jpg")
            if os.path.exists(out):
                skipped += 1; continue
            if im is None:
                im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
            if im.width <= w:
                continue  # el original ya es menor: no crear variante mayor que el original
            h = round(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(out, "JPEG", quality=80, optimize=True, progressive=True)
            made += 1; total += os.path.getsize(out)
print(f"creadas {made} variantes ({total//1024} KB), {skipped} ya existian")
