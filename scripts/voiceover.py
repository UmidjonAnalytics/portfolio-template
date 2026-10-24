"""
Generate the promo voice-over with the Gemini API (text to speech).

    python scripts/voiceover.py                 # all voices below, one WAV each
    python scripts/voiceover.py Kore            # one voice
    python scripts/voiceover.py --story Kore    # the story video's lines

The API key is read from .env.gemini (git-ignored): one line, GEMINI_API_KEY=...
It is sent only to generativelanguage.googleapis.com and never printed.
Output: docs/offer/video/voiceover-<voice>.wav
"""
import base64, json, os, re, sys, urllib.error, urllib.request, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "offer", "video")
API = "https://generativelanguage.googleapis.com/v1beta"

# Only the lines themselves are sent: gemini-3.8-flash-tts reads any style instruction aloud, and
# refuses a system instruction. The voice is chosen per run instead.
LINES = [
    "Shaxsiy portfolio sayt — atigi to‘rt yuz ellik ming so‘m.",
    "To‘lov qilasiz — shaxsiy havola olasiz.",
    "Telefondan oddiy anketani to‘ldirasiz.",
    "Saytingiz tayyor: uch tilda, olti xil dizaynda.",
    "Do‘st olib keling — ellik ming so‘m qaytaraman.",
]
VOICES = ["Kore", "Puck", "Charon", "Aoede"]

# The story video (scripts/promo/story.py): one line per part. `--story` selects it, and the files
# are named voiceover-story-<voice>.wav.
STORY = [
    "Ish beruvchiga oddiy rezyume emas — o‘z saytingizni yuboring.",
    "Sayt uch tilda ishlaydi: o‘zbek, rus va ingliz.",
    "Olti xil dizayn — kunduzgi va tungi rejimda.",
    "Loyihalaringiz grafik va natijalar bilan ko‘rsatiladi.",
    "Telefonda ham, kompyuterda ham chiroyli ochiladi.",
    "Sayt umrbod sizniki. Karyerangizdagi har bir yangilikni admin panel orqali o‘zingiz qo‘shasiz.",
    "Domen, joylash va oson savol-javob anketasi — hammasi to‘rt yuz ellik ming so‘m.",
    "Saytingizni hoziroq buyurtma qiling!",
]


def key() -> str:
    path = os.path.join(ROOT, ".env.gemini")
    if not os.path.exists(path):
        sys.exit("Create .env.gemini in the project folder with one line: GEMINI_API_KEY=...")
    # Keys come in more than one format (some contain dots), so take the whole value.
    m = re.search(r"GEMINI_API_KEY\s*=\s*['\"]?([^\s'\"]+)", open(path, encoding="utf-8-sig").read())
    if not m:
        sys.exit(".env.gemini has no GEMINI_API_KEY line")
    return m.group(1)


def call(url: str, k: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers={"x-goog-api-key": k, "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e:
        # The error body never contains the key, since it travels in a header.
        sys.exit(f"API error {e.code}: {e.read().decode(errors='replace')[:400]}")


def tts_model(k: str) -> str:
    # TTS_MODEL=... picks one by name, e.g. when the default model's free daily quota is used up.
    if os.environ.get("TTS_MODEL"):
        return os.environ["TTS_MODEL"]
    models = call(f"{API}/models?pageSize=200", k).get("models", [])
    names = [m["name"].split("/")[-1] for m in models if "tts" in m["name"]]
    if not names:
        sys.exit("No text-to-speech model is available for this key.")
    # Prefer Flash (cheaper, fast), newest version first.
    names.sort(key=lambda n: ("flash" not in n, [-int(x) for x in re.findall(r"\d+", n)]))
    return names[0]


def main():
    k = key()
    model = tts_model(k)
    args = sys.argv[1:]
    story = "--story" in args
    lines = STORY if story else LINES
    voices = [a for a in args if not a.startswith("--")] or VOICES
    print("model:", model)
    for voice in voices:
        body = {
            "contents": [{"parts": [{"text": "\n".join(lines)}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
            },
        }
        res = call(f"{API}/models/{model}:generateContent", k, body)
        part = res["candidates"][0]["content"]["parts"][0]["inlineData"]
        pcm = base64.b64decode(part["data"])
        rate = int(re.search(r"rate=(\d+)", part.get("mimeType", "")).group(1)) if "rate=" in part.get("mimeType", "") else 24000
        path = os.path.join(OUT, f"voiceover-{'story-' if story else ''}{voice}.wav")
        with wave.open(path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(pcm)
        print(f"{voice}: {len(pcm) / (rate * 2):.1f} s -> {os.path.relpath(path, ROOT)}")


if __name__ == "__main__":
    main()
