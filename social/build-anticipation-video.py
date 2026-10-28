#!/usr/bin/env python3
"""Hayame 'Watch this space' anticipation teaser: 12 s, 1080x1920 (Reels / Stories / TikTok), with original synthesized sound.

Usage:  python3 social/build-anticipation-video.py [preview|frames|audio|mux|all] [seconds...]
Needs: Google Chrome, and numpy + imageio-ffmpeg (pip install numpy imageio-ffmpeg).
Output: social/video/hayame-anticipation.mp4 (+ .wav, poster.png).
Animation lives in social/anticipation/scene.html (open it in a browser to watch it live).
"""
import base64, os, subprocess, sys, tempfile, shutil
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(ROOT, "scripts/assets/geist")
LOGO = os.path.join(ROOT, "public/logo-white.png")
ICONS = [os.path.join(HERE, f"assets/icons/{n}.svg") for n in ["instagram", "facebook", "tiktok", "snapchat", "x"]]
SCENE = os.path.join(HERE, "anticipation/scene.html")
OUT_DIR = os.path.join(HERE, "video")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FPS, DURATION = 30, 12.0
WORK = os.path.join(tempfile.gettempdir(), "hayame-anticipation")


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def build_html():
    html = open(SCENE).read()
    fonts = "{" + ",".join(f'"{w}":"{b64(f"{FONTS}/Geist-{n}.woff2", "font/woff2")}"' for n, w in [("Regular", 400), ("Medium", 500), ("SemiBold", 600), ("Bold", 700), ("Black", 900)]) + "}"
    icons = []
    for p in ICONS:
        svg = open(p).read().replace("<svg ", '<svg fill="#fff" ', 1)
        icons.append('"data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode() + '"')
    html = html.replace("{{FONTS}}", fonts).replace("{{LOGO}}", b64(LOGO, "image/png")).replace("{{ICONS}}", "[" + ",".join(icons) + "]")
    os.makedirs(WORK, exist_ok=True)
    path = os.path.join(WORK, "scene.html")
    open(path, "w").write(html)
    return path


def shot(html, t, out):
    prof = tempfile.mkdtemp(prefix="chr-", dir=WORK)
    try:
        for attempt in range(3):
            subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1",
                            "--window-size=1080,1920", f"--user-data-dir={prof}", "--virtual-time-budget=4000", f"--screenshot={out}", f"file://{html}#t={t:.4f}"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
            if os.path.exists(out) and os.path.getsize(out) > 5000:
                return
    finally:
        shutil.rmtree(prof, ignore_errors=True)
    raise RuntimeError(f"frame at t={t} failed")


def frames():
    html = build_html()
    fdir = os.path.join(WORK, "frames")
    shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
    n = int(DURATION * FPS)
    jobs = [(i, os.path.join(fdir, f"f{i:04d}.png")) for i in range(n)]
    done = 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        for _ in ex.map(lambda j: shot(html, j[0] / FPS, j[1]), jobs):
            done += 1
            if done % 60 == 0: print(f"  frames {done}/{n}", flush=True)
    return fdir


def audio():
    sys.path.insert(0, HERE)
    import importlib.util
    spec = importlib.util.spec_from_file_location("synth", os.path.join(HERE, "anticipation/synth.py")); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    os.makedirs(OUT_DIR, exist_ok=True)
    wav = os.path.join(OUT_DIR, "hayame-anticipation.wav")
    m.render(wav, DURATION)
    return wav


def mux(fdir, wav):
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, "hayame-anticipation.mp4")
    subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f%04d.png"), "-i", wav,
                    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
                    "-c:a", "aac", "-b:a", "256k", "-shortest", out], check=True)
    shutil.copy(os.path.join(fdir, f"f{int(10.9 * FPS):04d}.png"), os.path.join(OUT_DIR, "poster.png"))
    print("wrote", out)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    if cmd == "preview":
        html = build_html(); os.makedirs(os.path.join(WORK, "prev"), exist_ok=True)
        for s in sys.argv[2:]:
            out = os.path.join(WORK, "prev", f"t{float(s):05.2f}.png"); shot(html, float(s), out); print(out)
    elif cmd == "frames": frames()
    elif cmd == "audio": audio()
    elif cmd == "mux": mux(os.path.join(WORK, "frames"), os.path.join(OUT_DIR, "hayame-anticipation.wav"))
    else:
        w = audio(); f = frames(); mux(f, w)
