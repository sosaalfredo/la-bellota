"""Descarga los woff2 (latin + latin-ext) de Google Fonts y genera assets/fonts/fonts.css para autoalojarlos."""
import os, re, sys, urllib.request

ROOT = sys.argv[1]
OUT = os.path.join(ROOT, "assets", "fonts")
os.makedirs(OUT, exist_ok=True)
CSS_URL = ("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800"
           "&family=Figtree:wght@400;500;600;700&family=Caveat:wght@600&display=swap")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

css = get(CSS_URL).decode("utf-8")
blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)
faces = {}  # (family, subset) -> dict
for subset, body in blocks:
    if subset not in ("latin", "latin-ext"):
        continue
    fam = re.search(r"font-family:\s*'([^']+)'", body).group(1)
    weight = int(re.search(r"font-weight:\s*(\d+)", body).group(1))
    url = re.search(r"url\(([^)]+)\)", body).group(1)
    urange = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()
    key = (fam, subset)
    f = faces.setdefault(key, {"weights": set(), "urls": set(), "range": urange})
    f["weights"].add(weight); f["urls"].add(url)

lines = ["/* Fuentes autoalojadas (origen: Google Fonts, licencia OFL). Generado el 2026-09-06. */"]
slug = {"Bricolage Grotesque": "bricolage", "Figtree": "figtree", "Caveat": "caveat"}
for (fam, subset), f in sorted(faces.items()):
    if len(f["urls"]) != 1:
        print("AVISO: varias URLs para", fam, subset, "-> fuente no variable; se usa la primera")
    url = sorted(f["urls"])[0]
    fname = f"{slug[fam]}-{subset}.woff2"
    data = get(url)
    with open(os.path.join(OUT, fname), "wb") as fh:
        fh.write(data)
    wmin, wmax = min(f["weights"]), max(f["weights"])
    weight = f"{wmin} {wmax}" if wmin != wmax else str(wmin)
    lines.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{weight};font-display:swap;"
                 f"src:url({fname}) format('woff2');unicode-range:{f['range']}}}")
    print(f"{fname:28s} {len(data)//1024:4d} KB  weight {weight}")
with open(os.path.join(OUT, "fonts.css"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(lines) + "\n")
print("fonts.css escrito con", len(faces), "caras")
