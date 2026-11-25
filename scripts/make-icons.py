"""Draw the app icons: a gold ring with a small stone on carnelian (design section 9)."""
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "app" / "icons"


def oklch(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_, m_, s_ = L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
           -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
           -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    enc = lambda x: round(255 * (12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055))
    return tuple(enc(max(0.0, min(1.0, c))) for c in rgb)


CAR = oklch(0.47, 0.15, 30)
LIGHT, DARK = (250, 222, 140), (176, 124, 38)


def gradient(size):
    g = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(g)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)], fill=tuple(round(LIGHT[i] + (DARK[i] - LIGHT[i]) * t) for i in range(3)))
    return g


def icon(px, mark=0.62):
    S = px * 4
    img = Image.new("RGB", (S, S), CAR)
    R = S * 0.5 * mark * 0.62          # ring outer radius
    w = R * 0.26                       # ring thickness
    cx, cy = S / 2, S / 2 + R * 0.16
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
    md.ellipse([cx - R + w, cy - R + w, cx + R - w, cy + R - w], fill=0)
    img.paste(gradient(S), (0, 0), mask)
    d = ImageDraw.Draw(img)
    st = R * 0.42                      # stone size
    top = cy - R - st * 0.55
    d.polygon([(cx, top - st), (cx + st * 0.8, top), (cx, top + st * 0.75), (cx - st * 0.8, top)], fill=LIGHT, outline=DARK)
    return img.resize((px, px), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
icon(192).save(OUT / "icon-192.png")
icon(512).save(OUT / "icon-512.png")
icon(512, mark=0.5).save(OUT / "icon-maskable-512.png")
icon(180).save(OUT / "apple-touch-icon.png")
print("carnelian", CAR, "icons written")
