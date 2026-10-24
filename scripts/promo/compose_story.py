"""
The story promo: one selling point per part, each on its own device, style and day/night background,
with the Uzbek voice-over and subtitles.

    python scripts/voiceover.py --story Kore         # narration
    node scripts/promo/record.mjs                    # scroll recordings (classic, excel, powerbi, notebook…)
    node scripts/promo/record_story.mjs              # languages, designs, projects
    python scripts/promo/compose_story.py [voice]    # docs/offer/video/promo-story-<voice>.mp4
"""
import importlib.util, json, os, subprocess, sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
FR = os.path.join(HERE, "frames")
VOICE = sys.argv[1] if len(sys.argv) > 1 else "Kore"
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0  # voice tempo, pitch unchanged
SRC_WAV = os.path.join(ROOT, "docs", "offer", "video", f"voiceover-story-{VOICE}.wav")
OUT = os.path.join(ROOT, "docs", "offer", "video", f"promo-story-{VOICE}.mp4")
W, H, FPS = 1080, 1920, 30
FONT_B = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_R = r"C:\Windows\Fonts\segoeui.ttf"
PUSH = 0.5  # slide between parts
TAIL = 1.2

_spec = importlib.util.spec_from_file_location("vo", os.path.join(ROOT, "scripts", "voiceover.py"))
VO = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(VO)
_spec2 = importlib.util.spec_from_file_location("pv", os.path.join(ROOT, "scripts", "promo_video.py"))
PV = importlib.util.module_from_spec(_spec2)
_spec2.loader.exec_module(PV)

# Day and night looks for the video background, per site style: gradient, pattern, text colour.
LOOKS = {
    "classic": (("#effaf8", "#bfe6e2"), None, "#0b2f30"),
    "mono": (("#000000", "#1c1c1c"), None, "#ffffff"),
    "excel": (("#f3fbf6", "#c3e6cf"), "grid", "#0d3b22"),
    "sql": (("#04070c", "#13233d"), "dots", "#ffffff"),
    "powerbi": (("#fff8d6", "#f5d742"), None, "#252423"),
    "notebook": (("#fff6ea", "#ffd9b3"), "lines", "#2a1d10"),
    "night": (("#03161a", "#0b3b3c"), None, "#ffffff"),
}
# The live style cycle recorded in record_story.mjs ("designs"): order and timing must match.
CYCLE = ["classic", "excel", "sql", "powerbi", "mono", "notebook"]
CYCLE_STEP, CYCLE_START = 0.55, 0.3

# part: headline, layout, [(recording, device)], clip offset, look (or "cycle")
PARTS = [
    ("Shaxsiy portfolio sayt", "laptop", [("classic", "laptop")], 0.15, "classic"),
    ("3 tilda", "tablet", [("languages", "tablet")], 0.1, "mono"),
    ("6 xil dizayn", "laptop", [("designs", "laptop")], 0.3, "cycle"),
    ("Loyihalar va grafiklar", "tablet", [("projects", "tablet")], 0.8, "sql"),
    ("Telefon va kompyuter", "duo", [("powerbi", "laptop"), ("powerbi", "phone")], 0.3, "powerbi"),
    ("Umrbod sizniki", "laptop", [("admin", "laptop")], 0.0, "night"),
    ("450 000 so‘m", "phone", [("excel", "phone")], 0.2, "excel"),
    ("Hoziroq buyurtma qiling", "trio", [("notebook", "laptop"), ("notebook", "tablet"), ("notebook", "phone")], 0.2, "notebook"),
]

# Device placements per layout: (device, screen size, top-left of the device body).
LAYOUTS = {
    "laptop": [("laptop", (960, 600), (60, 640))],
    "tablet": [("tablet", (600, 864), (224, 470))],
    "phone": [("phone", (392, 848), (333, 470))],
    "duo": [("laptop", (840, 525), (60, 520)), ("phone", (260, 563), (760, 960))],
    "trio": [("laptop", (840, 525), (60, 470)), ("tablet", (330, 475), (70, 1080)), ("phone", (226, 489), (760, 1130))],
}


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    return 4 * x**3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


@lru_cache(maxsize=64)
def font(path, size):
    return ImageFont.truetype(path, size)


# ---------------------------------------------------------------- recordings
CLIPS = {}
for part in PARTS:
    for rec, dev in part[2]:
        if (rec, dev) not in CLIPS:
            j = json.load(open(os.path.join(FR, rec, dev, "frames.json")))
            CLIPS[(rec, dev)] = (j["ready"], j["frames"])


@lru_cache(maxsize=48)
def load(rec, dev, file, size):
    return Image.open(os.path.join(FR, rec, dev, file)).convert("RGB").resize(size, Image.LANCZOS)


def screen(rec, dev, t, size):
    ready, frames = CLIPS[(rec, dev)]
    target = ready + t
    lo, hi = 0, len(frames) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if frames[mid]["t"] <= target:
            lo = mid
        else:
            hi = mid - 1
    return load(rec, dev, frames[lo]["file"], size)


# ---------------------------------------------------------------- art
@lru_cache(maxsize=16)
def background(look):
    colors, pattern, _ = LOOKS[look]
    a, b = hexrgb(colors[0]), hexrgb(colors[1])
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    light = sum(a) > 380
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([80, 500, 1000, 1450], fill=60 if light else 45)
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    img.paste(Image.new("RGB", (W, H), (255, 255, 255)), (0, 0), glow)
    if pattern:
        over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        o = ImageDraw.Draw(over)
        if pattern == "grid":
            for x in range(0, W, 90):
                o.line([(x, 0), (x, H)], fill=(13, 59, 34, 28))
            for y in range(0, H, 30):
                o.line([(0, y), (W, y)], fill=(13, 59, 34, 28))
        elif pattern == "dots":
            for y in range(0, H, 28):
                for x in range(0, W, 28):
                    o.ellipse([x, y, x + 3, y + 3], fill=(255, 255, 255, 40))
        elif pattern == "lines":
            for y in range(0, H, 40):
                o.line([(0, y), (W, y)], fill=(160, 90, 30, 40))
        img = Image.alpha_composite(img.convert("RGBA"), over).convert("RGB")
    return img


@lru_cache(maxsize=16)
def device_body(kind, size):
    """Device body with a transparent screen; returns (image, screen offset, screen mask, shadow)."""
    sw, sh = size
    if kind == "laptop":
        bz = 18
        fw, fh = sw + 2 * bz, sh + 2 * bz + 6
        base_h = 38
        img = Image.new("RGBA", (fw + 120, fh + base_h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([60, 0, 60 + fw - 1, fh - 1], radius=26, fill=(18, 20, 24, 255))
        d.ellipse([60 + fw // 2 - 4, 6, 60 + fw // 2 + 4, 14], fill=(60, 64, 70, 255))
        d.polygon([(0, fh), (fw + 120, fh), (fw + 80, fh + base_h - 6), (40, fh + base_h - 6)], fill=(200, 203, 208, 255))
        d.rounded_rectangle([0, fh - 4, fw + 119, fh + 10], radius=6, fill=(225, 228, 232, 255))
        d.rounded_rectangle([60 + fw // 2 - 90, fh - 4, 60 + fw // 2 + 90, fh + 4], radius=4, fill=(170, 174, 180, 255))
        hole, radius = (60 + bz, bz + 6), 6
    else:
        bz = 20 if kind == "tablet" else 13
        r = 46 if kind == "tablet" else 54
        fw, fh = sw + 2 * bz, sh + 2 * bz
        img = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        ImageDraw.Draw(img).rounded_rectangle([0, 0, fw - 1, fh - 1], radius=r, fill=(18, 20, 24, 255))
        hole, radius = (bz, bz), r - bz
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=radius, fill=255)
    cut = Image.new("L", img.size, 0)
    cut.paste(mask, hole)
    img.putalpha(Image.composite(Image.new("L", img.size, 0), img.getchannel("A"), cut))
    if kind == "phone":
        ImageDraw.Draw(img).rounded_rectangle([fw // 2 - 44, bz + 8, fw // 2 + 44, bz + 28], radius=10, fill=(18, 20, 24, 255))
    shadow = Image.new("RGBA", (img.width + 140, img.height + 140), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([70, 100, 70 + img.width, 70 + img.height], radius=50, fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(32))
    return img, hole, mask, shadow


def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if d.textlength(test, font=f) <= width:
            cur = test
        else:
            lines.append(cur)
            cur = w_
    lines.append(cur)
    return lines


def headline(img, text, color, p, big=False):
    if p <= 0:
        return
    a = ease_out(clamp(p))
    layer = Image.new("RGBA", (W, 360), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    size = 150 if big else 104
    f = font(FONT_B, size)
    while d.textlength(text, font=f) > 980:
        size -= 4
        f = font(FONT_B, size)
    tw = d.textlength(text, font=f)
    d.text(((W - tw) / 2, 150 + (104 - size) / 3), text, font=f, fill=hexrgb(color) + (255,))
    layer.putalpha(Image.eval(layer.getchannel("A"), lambda v: int(v * a)))
    img.alpha_composite(layer, (0, int((1 - a) * 60)))


def subtitle(img, text, p):
    if p <= 0:
        return
    a = clamp(p)
    f = font(FONT_B, 46)
    probe = ImageDraw.Draw(img)
    lines = wrap(probe, text, f, 900)
    lh = 62
    box_h = lh * len(lines) + 56
    y0 = H - 150 - box_h
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([60, y0, W - 60, y0 + box_h], radius=34, fill=(0, 0, 0, int(165 * a)))
    for i, line in enumerate(lines):
        tw = d.textlength(line, font=f)
        d.text(((W - tw) / 2, y0 + 26 + i * lh), line, font=f, fill=(255, 255, 255, int(255 * a)))
    img.alpha_composite(layer)


def price_card(img, p):
    if p <= 0:
        return
    a = ease_out(clamp(p))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    items = ["Shaxsiy domen (.uz)", "Joylash — 24/7, oylik to‘lovsiz", "Ma’lumotlaringizni o‘zim to‘ldiraman", "3 til · 6 dizayn · admin panel"]
    f = font(FONT_B, 40)
    x0, y0, w_, h_ = 90, 1010, 900, 72 * len(items) + 60
    off = int((1 - a) * 80)
    d.rounded_rectangle([x0, y0 + off, x0 + w_, y0 + h_ + off], radius=40, fill=(255, 255, 255, int(240 * a)))
    for i, it in enumerate(items):
        q = clamp((p - 0.3 - i * 0.18) / 0.3)
        # Drawn tick: the UI font has no check mark glyph.
        cx, cy = x0 + 68, y0 + 62 + i * 72 + off
        d.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=(33, 115, 70, int(255 * q)))
        d.line([(cx - 9, cy + 1), (cx - 2, cy + 8), (cx + 10, cy - 7)], fill=(255, 255, 255, int(255 * q)), width=5)
        d.text((x0 + 110, y0 + 34 + i * 72 + off), it, font=f, fill=(25, 30, 28, int(255 * q)))
    img.alpha_composite(layer)


def cta(img, p):
    if p <= 0:
        return
    a = ease_out(clamp(p))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    bw, bh = 820, 130
    bx, by = (W - bw) // 2, 1700 - int((1 - a) * 60)
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=65, fill=(228, 110, 27, int(255 * a)))
    f = font(FONT_B, 50)
    txt = "portfolio-anketa.web.app"
    tw = d.textlength(txt, font=f)
    d.text(((W - tw) / 2, by + 32), txt, font=f, fill=(255, 255, 255, int(255 * a)))
    img.alpha_composite(layer)


# ---------------------------------------------------------------- timeline
WAV = SRC_WAV
if SPEED != 1.0:
    WAV = os.path.join(HERE, "frames", f"voice-{VOICE}-{SPEED}.wav")
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", SRC_WAV, "-filter:a", f"atempo={SPEED}", WAV], check=True)
PV.VO.LINES = VO.STORY
starts, voice_len = PV.line_starts(WAV)
ends = starts[1:] + [voice_len + TAIL]
total = voice_len + TAIL
print("parts at", [round(s, 2) for s in starts], "length", round(total, 1))


def look_at(part_idx, t_local):
    look = PARTS[part_idx][4]
    if look != "cycle":
        return look
    i = int((t_local + PARTS[part_idx][3] - CYCLE_START) // CYCLE_STEP)
    return CYCLE[max(0, min(len(CYCLE) - 1, i))]


def part_frame(i, t_local):
    title, layout, recs, offset, _ = PARTS[i]
    look = look_at(i, t_local)
    img = background(look).convert("RGBA")
    color = LOOKS[look][2]
    # Devices settle in: a little rise and scale at the start of the part.
    p = ease_out(clamp(t_local / 0.55))
    for (kind, size, (x, y)), (rec, dev) in zip(LAYOUTS[layout], recs):
        body, hole, mask, shadow = device_body(kind, size)
        content = screen(rec, dev, offset + t_local, size)
        canvas = Image.new("RGBA", body.size, (0, 0, 0, 0))
        canvas.paste(content, hole, mask)
        canvas.alpha_composite(body)
        if kind == "laptop":
            x -= 60
        dy = int((1 - p) * 70)
        img.alpha_composite(shadow, (x - 70, y - 70 + dy))
        img.alpha_composite(canvas, (x, y + dy))
    price, last = len(PARTS) - 2, len(PARTS) - 1
    headline(img, title, color, (t_local - 0.15) / 0.45, big=i == price)
    if i == price:
        price_card(img, (t_local - 0.6) / 0.9)
    if i == last:
        cta(img, (t_local - 0.6) / 0.5)
    else:
        subtitle(img, VO.STORY[i], (t_local - 0.1) / 0.3)
    return img


ff = imageio_ffmpeg.get_ffmpeg_exe()
proc = subprocess.Popen(
    [ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", WAV,
     "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-b:a", "160k", "-t", f"{total:.3f}", "-movflags", "+faststart", OUT],
    stdin=subprocess.PIPE,
)
n = int(total * FPS)
for k in range(n):
    tg = k / FPS
    i = max(j for j in range(len(PARTS)) if starts[j] <= tg)
    frame = part_frame(i, tg - starts[i])
    # Push: the previous part slides out left while this one comes in from the right.
    if i > 0 and tg - starts[i] < PUSH:
        q = ease_in_out((tg - starts[i]) / PUSH)
        prev = part_frame(i - 1, tg - starts[i - 1])
        cut = int(q * W)
        both = Image.new("RGBA", (W, H))
        if cut < W:
            both.paste(prev.crop((cut, 0, W, H)), (0, 0))
        if cut > 0:
            both.paste(frame.crop((0, 0, cut, H)), (W - cut, 0))
        frame = both
    proc.stdin.write(frame.convert("RGB").tobytes())
    if k % 90 == 0:
        print(f"{k}/{n}", flush=True)
proc.stdin.close()
proc.wait()
print("done", os.path.relpath(OUT, ROOT), round(os.path.getsize(OUT) / 1e6, 1), "MB")
