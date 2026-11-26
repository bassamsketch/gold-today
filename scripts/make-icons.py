"""Draw the app icons: a polished gold solitaire on oxblood velvet inside a fine gold frame (design section 9).

python scripts/make-icons.py              writes app/icons/gold-*.png in the burgundy colourway
python scripts/make-icons.py --sheet F    writes a side-by-side comparison of the colourways to F

The band is shaded as polished metal: each pixel reflects a small photo studio (a ceiling softbox,
a white card behind the camera, a key light at the upper left, a strip light at the right and a dark
horizon line), so it reads as real gold rather than a flat yellow ring.
"""
import argparse
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "icons"
SS = 2048  # every icon is drawn at this size, then scaled down


def oklch(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_, m_, s_ = L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
           -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
           -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    enc = lambda x: round(255 * (12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055))
    return tuple(enc(max(0.0, min(1.0, c))) for c in rgb)


# velvet: the lit centre, the middle, the edge
VELVET = {
    "burgundy": (oklch(0.43, 0.13, 27), oklch(0.31, 0.1, 24), oklch(0.19, 0.06, 22)),
    "black": (oklch(0.31, 0.012, 60), oklch(0.21, 0.01, 60), oklch(0.12, 0.008, 60)),
}
# polished gold, from the shadow to the white highlight
GOLD = [(0.0, (52, 32, 6)), (0.22, (110, 74, 18)), (0.45, (178, 128, 40)), (0.66, (226, 182, 86)),
        (0.82, (246, 222, 150)), (0.94, (255, 244, 210)), (1.0, (255, 252, 240))]


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def ramp(t, stops):
    xs = [s[0] for s in stops]
    return np.stack([np.interp(t, xs, [s[1][c] for s in stops]) for c in range(3)], axis=-1)


def velvet(stops):
    y, x = np.mgrid[0:SS, 0:SS].astype(np.float32) / SS
    t = smoothstep(0.0, 0.9, np.hypot((x - 0.5) / 0.95, y - 0.36))
    inner, mid, outer = (np.array(c, np.float32) for c in stops)
    lo = inner + (mid - inner) * np.clip(t / 0.5, 0, 1)[..., None]
    hi = mid + (outer - mid) * np.clip((t - 0.5) / 0.5, 0, 1)[..., None]
    return np.where((t < 0.5)[..., None], lo, hi)


def studio(rx, ry, rz):
    """How bright the studio is in the reflected direction (rx right, ry down, rz towards the viewer)."""
    up = -ry
    v = 0.16 + 0.70 * smoothstep(0.1, 0.75, up)                                       # ceiling softbox
    v = v + 0.55 * smoothstep(0.15, 0.95, rz)                                           # white card behind the camera
    v = v + 0.22 * smoothstep(-0.15, -0.7, up)                                          # floor bounce
    v = v + 0.60 * np.exp(-(((rx + 0.55) / 0.3) ** 2 + ((up - 0.5) / 0.28) ** 2))       # key light, upper left
    v = v + 0.30 * np.exp(-(((rx - 0.9) / 0.22) ** 2 + (up / 0.3) ** 2))                # strip light, right
    v = v - 0.40 * np.exp(-((up / 0.07) ** 2)) * (1 - smoothstep(0.1, 0.7, rz))        # dark horizon line
    return np.clip(v, 0.0, 1.0)


def band(cx, cy, rm, w):
    """A polished gold band seen face on, as a round tube: colour and coverage."""
    y, x = np.mgrid[0:SS, 0:SS].astype(np.float32)
    dx, dy = x - cx, y - cy
    r = np.hypot(dx, dy) + 1e-6
    u = np.clip((r - rm) / w, -1.0, 1.0)
    nz = np.sqrt(1.0 - u * u)
    rx, ry, rz = 2 * nz * u * dx / r, 2 * nz * u * dy / r, 2 * nz * nz - 1
    return ramp(studio(rx, ry, rz), GOLD), (np.abs(r - rm) <= w).astype(np.float32)


def wire(a, b, w):
    """A polished round gold wire from a to b with round ends (a == b gives a bead): colour and coverage."""
    y, x = np.mgrid[0:SS, 0:SS].astype(np.float32)
    vx, vy = b[0] - a[0], b[1] - a[1]
    t = np.clip(((x - a[0]) * vx + (y - a[1]) * vy) / max(vx * vx + vy * vy, 1e-6), 0.0, 1.0)
    qx, qy = x - (a[0] + t * vx), y - (a[1] + t * vy)
    d = np.hypot(qx, qy) + 1e-6
    u = np.clip(d / w, 0.0, 1.0)
    nz = np.sqrt(1.0 - u * u)
    rx, ry, rz = 2 * nz * u * qx / d, 2 * nz * u * qy / d, 2 * nz * nz - 1
    return ramp(studio(rx, ry, rz), GOLD), (d <= w).astype(np.float32)


def over(img, col, a):
    return img * (1 - a[..., None]) + col * a[..., None]


def drawn(paint):
    """Facets drawn with PIL on a clear layer: colour and coverage."""
    im = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    paint(ImageDraw.Draw(im))
    arr = np.asarray(im, np.float32)
    return arr[..., :3], arr[..., 3] / 255


def gold_fill(size, top=(251, 231, 166), bottom=(150, 104, 30)):
    """A vertical gold gradient for the claws and the frame."""
    t = np.linspace(0, 1, size, dtype=np.float32)[:, None, None]
    col = np.array(top, np.float32) + (np.array(bottom, np.float32) - np.array(top, np.float32)) * t
    return Image.fromarray(np.broadcast_to(col, (size, size, 3)).astype(np.uint8))


def draw_icon(colour, frame=True, scale=1.0):
    """One icon at SS x SS, full bleed. Coordinates are designed on a 1024 grid."""
    k = SS / 1024 * scale
    o = SS / 2 - 512 * k
    P = lambda x, y: (o + x * k, o + y * k)
    cx, cy, rm, w = 512, 572, 198, 24          # the band: centre, middle radius, half thickness

    W, T = 230, 126                             # the stone's girdle and table width
    yc = cy - rm - w + 8                        # the culet rests on the band
    yg, yt = yc - 0.44 * W, yc - 0.61 * W       # girdle and table heights of a round brilliant
    g = [cx - W / 2 + W * i / 8 for i in range(9)]

    def pavilion(d):
        pav = ["#e4ecf4", "#a2b5c8", "#f1f6fa", "#8fa5bb", "#f6eedb", "#a9bbcd", "#e6edf4", "#8098af"]
        for i in range(8):
            d.polygon([P(g[i], yg), P(g[i + 1], yg), P(cx, yc)], fill=pav[i])

    def crown(d):
        gx, tx = (g[0], g[2], g[4], g[6], g[8]), (cx - T / 2, cx - T / 6, cx + T / 6, cx + T / 2)
        tri = [(gx[0], yg, tx[0], yt, gx[1], yg), (tx[0], yt, tx[1], yt, gx[1], yg), (gx[1], yg, tx[1], yt, gx[2], yg),
               (tx[1], yt, tx[2], yt, gx[2], yg), (gx[2], yg, tx[2], yt, gx[3], yg), (tx[2], yt, tx[3], yt, gx[3], yg),
               (gx[3], yg, tx[3], yt, gx[4], yg)]
        for t, f in zip(tri, ["#f2f7fb", "#ffffff", "#d6e1ec", "#fbfdff", "#c3d1df", "#eef4f9", "#a9bbcd"]):
            d.polygon([P(t[0], t[1]), P(t[2], t[3]), P(t[4], t[5])], fill=f)
        d.line([P(tx[0], yt), P(tx[3], yt)], fill="#ffffff", width=round(3 * k))
        d.line([P(gx[0], yg), P(gx[4], yg)], fill="#c9d5e1", width=round(4 * k))
        d.line([P(gx[0], yg), P(tx[0], yt), P(tx[3], yt), P(gx[4], yg), P(cx, yc), P(gx[0], yg)], fill=(70, 86, 104, 150), width=round(2 * k), joint="curve")

    # gold parts: the band, two claws down the sides of the stone, a collet on the band, beads that grip the girdle
    gold = [band(*P(cx, cy), rm * k, w * k)]
    shanks = [wire(P(cx + s * (W / 2 - 6), yg + 2), P(cx + s * 16, yc - 2), 5.5 * k) for s in (-1, 1)]
    collet = wire(P(cx - 20, cy - rm - w + 2), P(cx + 20, cy - rm - w + 2), 8 * k)
    beads = [wire(P(cx + s * (W / 2 - 4), yg - 3), P(cx + s * (W / 2 - 4), yg - 3), 8.5 * k) for s in (-1, 1)]
    pav, crw = drawn(pavilion), drawn(crown)

    # soft shadow of the whole ring on the velvet
    alpha = np.maximum.reduce([c for _, c in gold + shanks + beads + [collet]] + [pav[1], crw[1]])
    sh = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(22 * k))
    sh = np.roll(np.asarray(sh, np.float32) / 255, round(16 * k), axis=0)
    img = velvet(VELVET[colour]) * (1 - 0.5 * sh)[..., None]
    for col, a in gold + [pav] + shanks + [collet, crw] + beads:
        img = over(img, col, a)
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")

    if frame:  # a fine gold frame, inset like the lining of a jewellery box
        m = Image.new("L", (SS, SS), 0)
        inset = 60 * SS / 1024
        ImageDraw.Draw(m).rounded_rectangle([inset, inset, SS - inset, SS - inset], radius=(229 - 60) * SS / 1024, outline=255, width=round(7 * SS / 1024))
        out.paste(gold_fill(SS, (243, 220, 154), (156, 108, 30)), (0, 0), m)

    # one glint on the stone
    glow = Image.new("L", (SS, SS), 0)
    gx0, gy0 = P(cx + 0.33 * W, yt - 4)
    r = 20 * k
    ImageDraw.Draw(glow).ellipse([gx0 - r, gy0 - r, gx0 + r, gy0 + r], fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(12 * k))
    out.paste(Image.new("RGB", (SS, SS), (255, 255, 255)), (0, 0), glow)
    star = [(0, -46), (5, -5), (34, 0), (5, 5), (0, 46), (-5, 5), (-34, 0), (-5, -5)]
    ImageDraw.Draw(out).polygon([(gx0 + x * k, gy0 + y * k) for x, y in star], fill=(255, 255, 255, 255))
    return out.convert("RGB")


def squircle(img, radius=0.2237):
    """Round the corners the way a phone does, for icons shown without the phone's own mask."""
    s = img.size[0]
    m = Image.new("L", (s * 4, s * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, s * 4 - 1, s * 4 - 1], radius=radius * s * 4, fill=255)
    out = img.convert("RGBA")
    out.putalpha(m.resize((s, s), Image.LANCZOS))
    return out


def write_icons(colour):
    full = draw_icon(colour)
    full.resize((180, 180), Image.LANCZOS).save(OUT / "gold-180.png")                 # iPhone home screen
    squircle(full.resize((192, 192), Image.LANCZOS)).save(OUT / "gold-192.png")        # Android, browser tab
    squircle(full.resize((512, 512), Image.LANCZOS)).save(OUT / "gold-512.png")
    draw_icon(colour, frame=False, scale=0.84).resize((512, 512), Image.LANCZOS).save(OUT / "gold-maskable-512.png")
    print(colour, "icons written to", OUT)


def sheet(path, old=None):
    """Compare the colourways on a dark home screen: large, then at home-screen size."""
    font = lambda n, bold=False: ImageFont.truetype("C:/Windows/Fonts/" + ("segoeuib.ttf" if bold else "segoeui.ttf"), n)
    cols = ([("Now", Image.open(old).convert("RGB"))] if old else []) + [("A  Burgundy", draw_icon("burgundy")), ("B  Black", draw_icon("black"))]
    W, H = 520 * len(cols), 980
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    bg = np.stack([8 + 10 * x / W, 24 + 26 * y / H, 26 + 40 * y / H], axis=-1)
    page = Image.fromarray(bg.astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(page)
    for i, (name, im) in enumerate(cols):
        x0 = i * 520 + 100
        page.alpha_composite(squircle(im.resize((320, 320), Image.LANCZOS)), (x0, 90))
        d.text((x0 + 160, 450), name, font=font(34, True), fill="white", anchor="mm")
        page.alpha_composite(squircle(im.resize((120, 120), Image.LANCZOS)), (x0 + 100, 600))
        d.text((x0 + 160, 750), "Gold", font=font(26, True), fill="white", anchor="mm")
    d.text((W / 2, 900), "Top: large view.  Bottom: the size it shows on the home screen.", font=font(26), fill=(200, 215, 220), anchor="mm")
    page.convert("RGB").save(path)
    print("sheet written to", path)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--colour", default="burgundy", choices=sorted(VELVET))
    ap.add_argument("--sheet")
    ap.add_argument("--old")
    a = ap.parse_args()
    if a.sheet:
        sheet(a.sheet, a.old)
    else:
        OUT.mkdir(parents=True, exist_ok=True)
        write_icons(a.colour)
