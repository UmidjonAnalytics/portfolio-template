"""Composes the recorded scrolls into a 1080x1920 promo: laptop, tablet and phone, one style per part."""
import json, math, os, subprocess, sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "frames")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "promo-devices.mp4")
W, H, FPS = 1080, 1920, 30
FONT_B = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_R = r"C:\Windows\Fonts\segoeui.ttf"
WIPE = 0.6

# name, seconds on screen (before the wipe overlap), clip start (s after the page was ready),
# background gradient, pattern, text colour, title, subtitle
SCENES = [
    ("classic", 6.8, 0.15, ("#0a3436", "#0f8b8d"), None, "#ffffff", "Shaxsiy portfolio sayt", "Kompyuter, planshet va telefonda"),
    ("excel", 4.0, 0.25, ("#0c3520", "#217346"), "grid", "#ffffff", "Excel uslubi", "6 xil dizayndan birini tanlaysiz"),
    ("sql", 3.9, 0.25, ("#04070c", "#13233d"), "dots", "#ffffff", "SQL uslubi", "Qorong‘i yoki yorug‘ rejim"),
    ("powerbi", 3.6, 0.2, ("#f7d94c", "#f2c811"), None, "#252423", "Power BI uslubi", "Loyihalar, ko‘nikmalar, tajriba"),
    ("mono", 3.6, 0.2, ("#000000", "#202020"), None, "#ffffff", "Oq-qora uslub", "Jiddiy va nafis"),
    ("notebook", 3.2, 0.2, ("#fff6ea", "#ffd9b3"), "lines", "#2a1d10", "Notebook uslubi", "3 tilda · 24/7 onlayn"),
]
END = 3.0  # closing card, over the last scene's final frame

# Device screens (content size) and where the device sits on the canvas.
DEV = {
    "laptop": {"screen": (880, 550), "pos": (100, 470)},
    "tablet": {"screen": (360, 518), "pos": (78, 1135)},
    "phone": {"screen": (232, 502), "pos": (750, 1200)},
}


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_out_back(x, s=1.4):
    x -= 1
    return 1 + (s + 1) * x**3 + s * x**2


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


# ---------------------------------------------------------------- recordings
CLIPS = {}
for s in SCENES:
    for d in DEV:
        j = json.load(open(os.path.join(FR, s[0], d, "frames.json")))
        CLIPS[(s[0], d)] = (j["ready"], j["frames"])


@lru_cache(maxsize=64)
def load(scene, device, file):
    im = Image.open(os.path.join(FR, scene, device, file)).convert("RGB")
    return im.resize(DEV[device]["screen"], Image.BILINEAR if device == "laptop" else Image.LANCZOS)


def screen(scene, device, t):
    """Frame of the recording t seconds after its start offset (frozen at the end)."""
    ready, frames = CLIPS[(scene, device)]
    target = ready + t
    lo, hi = 0, len(frames) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if frames[mid]["t"] <= target:
            lo = mid
        else:
            hi = mid - 1
    return load(scene, device, frames[lo]["file"])


# ---------------------------------------------------------------- static art
def background(colors, pattern):
    a, b = hexrgb(colors[0]), hexrgb(colors[1])
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([60, 520, 1020, 1500], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    img.paste(Image.new("RGB", (W, H), (255, 255, 255)), (0, 0), glow)
    if pattern:
        over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        o = ImageDraw.Draw(over)
        light = sum(a) > 380
        c = (0, 0, 0, 22) if light else (255, 255, 255, 22)
        if pattern == "grid":
            for x in range(0, W, 90):
                o.line([(x, 0), (x, H)], fill=c)
            for y in range(0, H, 30):
                o.line([(0, y), (W, y)], fill=c)
        elif pattern == "dots":
            for y in range(0, H, 28):
                for x in range(0, W, 28):
                    o.ellipse([x, y, x + 3, y + 3], fill=(255, 255, 255, 45))
        elif pattern == "lines":
            for y in range(0, H, 40):
                o.line([(0, y), (W, y)], fill=(160, 90, 30, 40))
        img = Image.alpha_composite(img.convert("RGBA"), over).convert("RGB")
    return img


def device_frame(kind):
    """Device body with a transparent screen, plus the screen's offset inside it."""
    sw, sh = DEV[kind]["screen"]
    if kind == "laptop":
        bz = 18
        fw, fh = sw + 2 * bz, sh + 2 * bz + 6
        base_h = 36
        img = Image.new("RGBA", (fw + 120, fh + base_h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([60, 0, 60 + fw - 1, fh - 1], radius=26, fill=(18, 20, 24, 255))
        d.ellipse([60 + fw // 2 - 4, 6, 60 + fw // 2 + 4, 14], fill=(60, 64, 70, 255))
        d.polygon([(0, fh), (fw + 120, fh), (fw + 80, fh + base_h - 6), (40, fh + base_h - 6)], fill=(200, 203, 208, 255))
        d.rounded_rectangle([0, fh - 4, fw + 119, fh + 10], radius=6, fill=(225, 228, 232, 255))
        d.rounded_rectangle([60 + fw // 2 - 90, fh - 4, 60 + fw // 2 + 90, fh + 4], radius=4, fill=(170, 174, 180, 255))
        hole = (60 + bz, bz + 6)
        radius = 6
    else:
        bz = 16 if kind == "tablet" else 11
        r = 40 if kind == "tablet" else 40
        fw, fh = sw + 2 * bz, sh + 2 * bz
        img = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([0, 0, fw - 1, fh - 1], radius=r, fill=(18, 20, 24, 255))
        hole = (bz, bz)
        radius = r - bz
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=radius, fill=255)
    # Cut the screen out of the body.
    alpha = img.getchannel("A")
    cut = Image.new("L", img.size, 0)
    cut.paste(mask, hole)
    alpha = Image.composite(Image.new("L", img.size, 0), alpha, cut)
    img.putalpha(alpha)
    if kind == "phone":
        ImageDraw.Draw(img).rounded_rectangle([fw // 2 - 34, bz + 6, fw // 2 + 34, bz + 22], radius=8, fill=(18, 20, 24, 255))
    shadow = Image.new("RGBA", (img.width + 120, img.height + 120), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([60, 80, 60 + img.width, 60 + img.height], radius=40, fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    return img, hole, mask, shadow


BGS = {s[0]: background(s[3], s[4]) for s in SCENES}
FRAMES = {k: device_frame(k) for k in DEV}


@lru_cache(maxsize=256)
def font(path, size):
    return ImageFont.truetype(path, size)


def draw_caption(img, title, sub, color, p_in, p_out):
    """Title and subtitle slide up and fade in, then fade out upwards."""
    if p_in <= 0 or p_out >= 1:
        return
    a = ease_out(clamp(p_in)) * (1 - clamp(p_out))
    dy = (1 - ease_out(clamp(p_in))) * 50 - clamp(p_out) * 30
    layer = Image.new("RGBA", (W, 420), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    size = 96
    f = font(FONT_B, size)
    while d.textlength(title, font=f) > 960:
        size -= 4
        f = font(FONT_B, size)
    rgb = hexrgb(color)
    tw = d.textlength(title, font=f)
    d.text(((W - tw) / 2, 150 + (96 - size) / 2), title, font=f, fill=rgb + (255,))
    fs = font(FONT_R, 50)
    sw_ = d.textlength(sub, font=fs)
    d.text(((W - sw_) / 2, 280), sub, font=fs, fill=rgb + (215,))
    layer.putalpha(Image.eval(layer.getchannel("A"), lambda v: int(v * a)))
    img.alpha_composite(layer, (0, int(dy)))


def place_devices(img, scene, t_local, t_global):
    for i, kind in enumerate(["laptop", "tablet", "phone"]):
        body, hole, mask, shadow = FRAMES[kind]
        x, y = DEV[kind]["pos"]
        if kind == "laptop":
            x -= 60
        # Intro: devices arrive one after another.
        p = clamp((t_global - 0.15 - i * 0.18) / 0.8)
        e = ease_out_back(p) if p < 1 else 1
        if kind == "laptop":
            y += int((1 - e) * -700)
        elif kind == "tablet":
            x += int((1 - e) * -700)
        else:
            x += int((1 - e) * 700)
        if p <= 0:
            continue
        img.alpha_composite(shadow, (x - 60, y - 60))
        content = screen(scene, kind, t_local)
        canvas = Image.new("RGBA", body.size, (0, 0, 0, 0))
        canvas.paste(content, hole, mask)
        canvas.alpha_composite(body)
        img.alpha_composite(canvas, (x, y))


def scene_frame(idx, t_local, t_global):
    name, dur, start, _, _, color, title, sub = SCENES[idx]
    img = BGS[name].convert("RGBA")
    place_devices(img, name, start + t_local, t_global)
    # The incoming caption waits for the wipe to finish; the outgoing one is gone before it starts.
    cap_delay = 0.55 if idx == 0 else WIPE + 0.05
    last = idx == len(SCENES) - 1
    fade_out_at = dur - 0.2 if last else dur - WIPE - 0.35
    draw_caption(img, title, sub, color, (t_local - cap_delay) / 0.45, (t_local - fade_out_at) / 0.35)
    return img


def wipe(a, b, p):
    """Diagonal wipe from bottom-left to top-right with a soft edge."""
    p = ease_out(clamp(p))
    edge = 160
    total = W + H + edge
    pos = -edge + p * total
    m = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(m)
    md.polygon([(-10, H + 10), (-10, H - pos), (pos, H + 10)], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(edge / 3))
    return Image.composite(b, a, m)


def end_card(base, t):
    img = base.copy()
    p = clamp(t / 0.6)
    dim = Image.new("RGBA", (W, H), (6, 30, 32, int(170 * ease_out(p))))
    img.alpha_composite(dim)
    panel_h = 640
    y = int(H - ease_out(p) * (panel_h + 260))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([60, y, W - 60, y + panel_h], radius=56, fill=(255, 255, 255, 250))
    def c(text, yy, f, fill):
        tw = d.textlength(text, font=f)
        d.text(((W - tw) / 2, yy), text, font=f, fill=fill)
    c("Shaxsiy portfolio sayt", y + 70, font(FONT_B, 64), (22, 24, 28))
    c("450 000 so‘m", y + 170, font(FONT_B, 130), (15, 139, 141))
    c("Domen · 3 til · 6 dizayn · admin panel", y + 345, font(FONT_R, 44), (70, 76, 86))
    q = clamp((t - 0.5) / 0.4)
    bw, bh = 760, 120
    bx, by = (W - bw) // 2, y + 450
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=60, fill=(15, 139, 141, int(255 * q)))
    f = font(FONT_B, 46)
    txt = "portfolio-anketa.web.app"
    tw = d.textlength(txt, font=f)
    d.text(((W - tw) / 2, by + 30), txt, font=f, fill=(255, 255, 255, int(255 * q)))
    img.alpha_composite(layer)
    return img


# ---------------------------------------------------------------- timeline
starts, t = [], 0.0
for i, s in enumerate(SCENES):
    starts.append(t)
    t += s[1] - (WIPE if i < len(SCENES) - 1 else 0)
end_start = t
total = end_start + END
print(f"length {total:.1f}s")

ff = imageio_ffmpeg.get_ffmpeg_exe()
proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                         "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
n = int(total * FPS)
for k in range(n):
    tg = k / FPS
    if tg >= end_start:
        frame = end_card(scene_frame(len(SCENES) - 1, tg - starts[-1], tg), tg - end_start)
    else:
        i = max(j for j in range(len(SCENES)) if starts[j] <= tg)
        frame = scene_frame(i, tg - starts[i], tg)
        # Overlap: the next scene starts WIPE seconds before this one ends.
        if i > 0 and tg - starts[i] < WIPE:
            prev = scene_frame(i - 1, tg - starts[i - 1], tg)
            frame = wipe(prev, frame, (tg - starts[i]) / WIPE)
    proc.stdin.write(frame.convert("RGB").tobytes())
    if k % 60 == 0:
        print(f"{k}/{n}", flush=True)
proc.stdin.close()
proc.wait()
print("done", OUT, round(os.path.getsize(OUT) / 1e6, 1), "MB")
