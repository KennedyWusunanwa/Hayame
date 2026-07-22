#!/usr/bin/env python3
"""Bolt-style 8-panel App Store 6.5" set for Hayame (1242x2688 each).

Faithful to Bolt's layout language, Hayame-branded: a continuous diagonal
brand-color band sweeps across all 8 panels (one master 9936-wide canvas,
sliced), with a continuous cyan accent line tying the set together. Full-bleed
car photos (App Screenshots/) sit below the diagonal so the empty sky above each
car is hidden by the band; app screenshots (screenshots/ios-mobile/light) stand
on brand color. Geist (the website font), Hayame navy/blue + white, logo on
panel 1 only, and the website on the closing panel.

Usage:  python3 scripts/build-appstore-story.py
Requirements: Pillow, Google Chrome, macOS `sips` (HEIC/JPG conversion).
Geist fonts are vendored in scripts/assets/geist/.
"""
import base64, os, shutil, signal, subprocess, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "scripts/assets/geist")
PHOTOS_SRC = os.path.join(ROOT, "App Screenshots")
SHOTS = os.path.join(ROOT, "screenshots/ios-mobile/light")
LOGO_SRC = os.path.join(ROOT, "HayameIOS/HayameIOS/Assets.xcassets/Logo.imageset/logo.png")
OUT = os.path.join(ROOT, "screenshots/app-store-6.5-story")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

PW, PH, N = 1242, 2688, 8
WW = PW * N
# continuous diagonal band: bottom-edge y at each panel boundary (x=0..9936)
VERTS = [952, 720, 988, 706, 904, 724, 968, 712, 904]

SLIDES = [
    dict(kind="photo", asset="IMG_3018.JPG", pos="center 60%", out="01-hero",
         h="Your ride\nis here.", a="", sub="Quality cars, ready right across Ghana.", logo=True),
    dict(kind="app", asset="05-explore.png", out="02-find-fast",
         h="Find it {a}.", a="fast", sub="Browse by brand, price and location."),
    dict(kind="photo", asset="IMG_2078.HEIC", pos="center 54%", out="03-book-what-fits",
         h="Book what\nfits you.", a="", sub="Economy, premium or luxury — your pick."),
    dict(kind="app", asset="07-car-detail.png", out="04-know-first",
         h="Know before\nyou book.", a="", sub="Photos, specs, reviews and real prices."),
    dict(kind="app", asset="09-booking-calendar.png", out="05-book-ahead",
         h="Book {a}.", a="ahead", sub="Reserve your dates in advance."),
    dict(kind="app", asset="12-booking-payment.png", out="06-clear-price",
         h="Clear price.\nNo {a}.", a="surprises", sub="See every charge before you pay."),
    dict(kind="photo", asset="IMG_3136.JPG", pos="center 56%", out="07-every-plan",
         h="A car for\nevery plan.", a="", sub="Sedans, SUVs and luxury."),
    dict(kind="photo", asset="IMG_2520.HEIC", pos="center 58%", out="08-drive-hayame",
         h="Drive with\n{a}.", a="Hayame", sub="Verified hosts. Secure payments.",
         dark=True, web=True),
]


def b64(path, mime):
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


def convert_photo(asset, build):
    src = os.path.join(PHOTOS_SRC, asset)
    dst = os.path.join(build, os.path.splitext(asset)[0] + ".jpg")
    subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "88",
                    "-Z", "1700", src, "--out", dst],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return b64(dst, "image/jpeg")


def white_logo(build):
    img = Image.open(LOGO_SRC).convert("RGBA")
    img.putdata([(255, 255, 255, al) for (_, _, _, al) in img.getdata()])
    dst = os.path.join(build, "logo-white.png")
    img.save(dst)
    return b64(dst, "image/png")


def font_face():
    out = ""
    for w, name in [(400, "Regular"), (500, "Medium"), (600, "SemiBold"), (700, "Bold"), (900, "Black")]:
        uri = b64(os.path.join(FONTS, f"Geist-{name}.woff2"), "font/woff2")
        out += f"@font-face{{font-family:'Geist';font-weight:{w};font-style:normal;src:url({uri}) format('woff2');}}\n"
    return out


def panel_html(i, s, logo_uri, build):
    left = i * PW
    vL, vR = VERTS[i], VERTS[i + 1]
    head = s["h"].replace("{a}", f'<span class="ac">{s.get("a","")}</span>').replace("\n", "<br>")
    head_top = 286 if s.get("logo") else 180
    b = []
    if s["kind"] == "photo":
        uri = convert_photo(s["asset"], build)
        clip = f"polygon(0 {vL}px, {PW}px {vR}px, {PW}px {PH}px, 0 {PH}px)"
        cls = "photo dark" if s.get("dark") else "photo"
        b.append(f'<div class="{cls}" style="left:{left}px;clip-path:{clip}">'
                 f'<img src="{uri}" style="object-position:{s.get("pos","center 58%")}"></div>')
    else:
        uri = b64(os.path.join(SHOTS, s["asset"]), "image/png")
        b.append(f'<div class="device" style="left:{left + (PW-744)//2}px"><img src="{uri}"></div>')
    if s.get("logo"):
        b.append(f'<img class="logo" src="{logo_uri}" style="left:{left+96}px;top:118px">')
    b.append(f'<div class="copy" style="left:{left+96}px;top:{head_top}px">'
             f'<div class="h">{head}</div><div class="sub">{s["sub"]}</div></div>')
    if s.get("web"):
        b.append(f'<div class="web" style="left:{left}px">'
                 f'<span class="wlabel">Get started today</span>'
                 f'<span class="wurl">www.hayamegh.com</span></div>')
    return "".join(b)


def world(logo_uri, build):
    panels = "".join(panel_html(i, s, logo_uri, build) for i, s in enumerate(SLIDES))
    pts = " ".join(f"{x*PW},{VERTS[x]}" for x in range(N + 1))
    line = (f'<svg class="line" width="{WW}" height="{PH}">'
            f'<polyline points="{pts}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="22"/>'
            f'<polyline points="{pts}" fill="none" stroke="rgba(124,203,255,0.85)" stroke-width="6"/>'
            f'</svg>')
    bk = "".join(f'<div class="bk" style="left:{x}px;top:{y}px;width:{d}px;height:{d}px;background:{c}"></div>'
                 for (x, y, d, c) in [(-200, 200, 720, "rgba(255,255,255,.06)"),
                                      (3000, 120, 620, "rgba(124,203,255,.10)"),
                                      (6100, 160, 680, "rgba(255,255,255,.05)"),
                                      (8400, 120, 600, "rgba(124,203,255,.08)")])
    return f'<div class="world"><div class="bg"></div>{bk}{line}{panels}</div>'


CSS = """
*{margin:0;padding:0;box-sizing:border-box}
.stage{position:relative;width:__PW__px;height:__PH__px;overflow:hidden;font-family:'Geist',sans-serif;background:#08254A}
.world{position:absolute;top:0;left:0;width:__WW__px;height:__PH__px;transform:translateX(__OFF__px)}
.bg{position:absolute;inset:0;background:linear-gradient(120deg,#06182E 0%,#0A2B54 24%,#0E4C8C 62%,#1484D9 100%)}
.bk{position:absolute;border-radius:50%;filter:blur(3px)}
.line{position:absolute;left:0;top:0;z-index:2}
.photo{position:absolute;top:0;width:__PW__px;height:__PH__px;z-index:1;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.photo.dark::after{content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(6,20,40,.34) 0%,rgba(6,20,40,.62) 70%,rgba(6,20,40,.82) 100%)}
.logo{position:absolute;height:72px;z-index:4;filter:drop-shadow(0 6px 16px rgba(0,0,0,.35))}
.copy{position:absolute;width:1050px;z-index:4}
.h{color:#fff;font-weight:900;font-size:120px;line-height:.97;letter-spacing:-3px;text-shadow:0 10px 34px rgba(0,0,0,.34)}
.ac{color:#7CCBFF}
.sub{color:rgba(255,255,255,.88);font-weight:500;font-size:42px;line-height:1.2;margin-top:30px;max-width:960px;letter-spacing:-.3px}
.device{position:absolute;top:1018px;width:744px;padding:13px;background:#0a0c10;border-radius:94px;z-index:3;
  box-shadow:0 54px 120px rgba(0,0,0,.6),inset 0 0 0 2px rgba(255,255,255,.06)}
.device img{display:block;width:100%;border-radius:82px}
.web{position:absolute;bottom:120px;width:__PW__px;text-align:center;z-index:4}
.wlabel{display:block;color:rgba(255,255,255,.78);font-weight:500;font-size:36px;margin-bottom:14px}
.wurl{display:inline-block;color:#fff;font-weight:700;font-size:50px;letter-spacing:-.5px;
  padding:20px 46px;border-radius:100px;background:rgba(124,203,255,.18);border:2px solid rgba(124,203,255,.55)}
"""


def render(world_html, off, out_path, build):
    html = ("<!doctype html><html><head><meta charset='utf-8'><style>" + font_face()
            + CSS.replace("__PW__", str(PW)).replace("__PH__", str(PH))
                 .replace("__WW__", str(WW)).replace("__OFF__", str(off))
            + "</style></head><body><div class='stage'>" + world_html + "</div></body></html>")
    hp = os.path.join(build, f"p_{off}.html")
    with open(hp, "w") as f:
        f.write(html)
    if os.path.exists(out_path):
        os.remove(out_path)
    profile = tempfile.mkdtemp(prefix="chrome-", dir=build)
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
           "--force-device-scale-factor=1", f"--window-size={PW},{PH}",
           f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
           "--virtual-time-budget=5000", "--timeout=9000",
           f"--screenshot={out_path}", f"file://{hp}"]
    p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        p.wait(timeout=30)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(os.getpgid(p.pid), signal.SIGKILL)
        except Exception:
            p.kill()
    shutil.rmtree(profile, ignore_errors=True)
    im = Image.open(out_path).convert("RGB")
    if im.size != (PW, PH):
        im.resize((PW, PH), Image.LANCZOS).save(out_path)


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".png"):
            os.remove(os.path.join(OUT, f))
    build = tempfile.mkdtemp(prefix="hayame-story-")
    try:
        logo_uri = white_logo(build)
        w = world(logo_uri, build)
        for i, s in enumerate(SLIDES):
            op = os.path.join(OUT, f'{s["out"]}.png')
            render(w, -i * PW, op, build)
            print(f'  {s["out"]}.png  {Image.open(op).size[0]}x{Image.open(op).size[1]}')
    finally:
        shutil.rmtree(build, ignore_errors=True)
    print("done ->", OUT)


if __name__ == "__main__":
    main()
