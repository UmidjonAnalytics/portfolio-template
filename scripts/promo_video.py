"""
One 1080x1920 MP4 per voice: each scene shows while its line is spoken, with short crossfades.

    pip install imageio-ffmpeg
    python scripts/voiceover.py        # docs/offer/video/voiceover-<voice>.wav
    python scripts/promo_video.py      # docs/offer/video/promo-<voice>.mp4

Scenes are docs/offer/video/scene-1.png … scene-5.png, one per line in voiceover.py LINES.
"""
import array, glob, importlib.util, os, subprocess, wave

import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location("vo", os.path.join(ROOT, "scripts", "voiceover.py"))
VO = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(VO)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
DIR = os.path.join(ROOT, "docs", "offer", "video")
SCENES = [os.path.join(DIR, f"scene-{i}.png") for i in range(1, 6)]
FADE = 0.35
TAIL = 0.8  # last scene stays a moment after the voice ends


def line_starts(path: str) -> tuple[list[float], float]:
    """When each spoken line starts, and the clip length, in seconds."""
    w = wave.open(path)
    rate = w.getframerate()
    a = array.array("h", w.readframes(w.getnframes()))
    step = int(rate * 0.02)
    loud = [max(abs(x) for x in a[i : i + step]) > 700 for i in range(0, len(a), step)]
    first = next(i for i, l in enumerate(loud) if l)
    last = len(loud) - next(i for i, l in enumerate(reversed(loud)) if l)
    pauses, run_start = [], None
    for i in range(first, last):
        if not loud[i] and run_start is None:
            run_start = i
        elif loud[i] and run_start is not None:
            pauses.append((i - run_start, (run_start + i) / 2 * 0.02))
            run_start = None
    # Pauses inside a line (after a dash or colon) can be as long as those between lines, so first
    # estimate where each line should start from its share of the text, then take the nearest pause.
    lengths = [len(x) for x in VO.LINES]
    t0, t1 = first * 0.02, last * 0.02
    cuts, acc = [], 0
    for n in lengths[:-1]:
        acc += n
        expected = t0 + (t1 - t0) * acc / sum(lengths)
        best = min((p for p in pauses if p[0] >= 6), key=lambda p: abs(p[1] - expected) - p[0] * 0.004)
        cuts.append(best[1])
    return [0.0] + sorted(cuts), len(a) / rate


def main():
    for wav in sorted(glob.glob(os.path.join(DIR, "voiceover-*.wav"))):
        voice = os.path.basename(wav)[len("voiceover-") : -4]
        starts, total = line_starts(wav)
        end = total + TAIL
        # Scene i covers [start_i, start_i+1); each clip is padded by FADE so the crossfades overlap.
        bounds = starts[1:] + [end]
        durs = [bounds[i] - starts[i] + (FADE if i < len(SCENES) - 1 else 0) for i in range(len(SCENES))]
        inputs = []
        for img, d in zip(SCENES, durs):
            inputs += ["-loop", "1", "-framerate", "30", "-t", f"{d:.3f}", "-i", img]
        inputs += ["-i", wav]
        chain, prev = [], "[0:v]"
        for i in range(1, len(SCENES)):
            label = f"[v{i}]"
            chain.append(f"{prev}[{i}:v]xfade=transition=fade:duration={FADE}:offset={starts[i] - FADE / 2:.3f}{label}")
            prev = label
        chain.append(f"{prev}format=yuv420p[vout]")
        out = os.path.join(DIR, f"promo-{voice}.mp4")
        cmd = [FFMPEG, "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(chain), "-map", "[vout]", "-map", f"{len(SCENES)}:a",
               "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-t", f"{end:.3f}", "-movflags", "+faststart", out]
        subprocess.run(cmd, check=True)
        print(f"{voice}: {end:.1f}s, scenes at {[round(s, 1) for s in starts]} -> {os.path.basename(out)}")


if __name__ == "__main__":
    main()
