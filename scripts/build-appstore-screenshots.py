#!/usr/bin/env python3
"""Generate the App Store 6.5" (1242x2688) marketing screenshots for Hayame.

Slides:
  * a brand cover/title card,
  * ten feature slides pairing a real in-app screenshot with brand styling,
  * a dark-mode showcase.

Each feature slide pairs a real screenshot (from screenshots/ios-mobile/{light,dark},
produced by scripts/capture-ios-screenshots.sh) with the Hayame brand: a
navy->blue gradient, the white HAYAME logo, a bold headline with a cyan accent
word, a supporting line, and a premium floating device frame. Rendered crisply
via headless Google Chrome.

Usage:
    python3 scripts/build-appstore-screenshots.py            # all slides
    python3 scripts/build-appstore-screenshots.py 00 11      # only those slugs

Requirements: Pillow, Google Chrome, macOS SF Rounded font.
"""
import base64, os, shutil, signal, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS_LIGHT = os.path.join(ROOT, "screenshots/ios-mobile/light")
SHOTS_DARK = os.path.join(ROOT, "screenshots/ios-mobile/dark")
OUT = os.path.join(ROOT, "screenshots/app-store-6.5")
LOGO_SRC = os.path.join(ROOT, "HayameIOS/HayameIOS/Assets.xcassets/Logo.imageset/logo.png")
APPICON_SRC = os.path.join(ROOT, "HayameIOS/HayameIOS/Assets.xcassets/AppIcon.appiconset/1024.png")
FONT_SRC = "/System/Library/Fonts/SFNSRounded.ttf"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

W, H = 1242, 2688

# Each slide: dict with slug, kind, and kind-specific fields.
#   kind "cover": brand title card (app icon + logo + headline + feature pills)
#   kind "ui":    light screenshot framed in a device
#   kind "dark":  dark screenshot framed in a device, on a deep-navy background
SLIDES = [
    dict(slug="00-cover", kind="cover",
         headline="Ghana's car-sharing\n{a}", accent="marketplace",
         sub="Rent a car, or earn from yours.",
         pills=["Verified hosts", "Secure payments", "Cars near you"]),
    dict(slug="01-rent-across-ghana", kind="ui", shot="04-home.png",
         headline="Rent cars across {a}", accent="Ghana",
         sub="Thousands of local cars, ready to book"),
    dict(slug="02-find-your-ride", kind="ui", shot="05-explore.png",
         headline="Find your perfect {a}", accent="ride",
         sub="Browse by brand, price and location"),
    dict(slug="03-every-detail", kind="ui", shot="07-car-detail.png",
         headline="Every {a},\nbefore you book", accent="detail",
         sub="Photos, specs, reviews and real prices"),
    dict(slug="04-book-in-minutes", kind="ui", shot="09-booking-calendar.png",
         headline="Book in {a}", accent="minutes",
         sub="Pick your dates and you're set to go"),
    dict(slug="05-transparent-pricing", kind="ui", shot="11-booking-review.png",
         headline="Transparent {a}, always", accent="pricing",
         sub="See every charge before you pay"),
    dict(slug="06-pay-securely", kind="ui", shot="12-booking-payment.png",
         headline="Pay {a}, your way", accent="securely",
         sub="Mobile Money, card or bank transfer"),
    dict(slug="07-all-your-trips", kind="ui", shot="14-trips.png",
         headline="All your trips,\n{a} place", accent="one",
         sub="Track upcoming and past bookings"),
    dict(slug="08-save-cars-you-love", kind="ui", shot="15-favorites.png",
         headline="Save the cars you {a}", accent="love",
         sub="Build your wishlist for later"),
    dict(slug="09-chat-with-hosts", kind="ui", shot="16-messages.png",
         headline="Chat with {a}\ninstantly", accent="hosts",
         sub="Coordinate pickup and delivery with ease"),
    dict(slug="10-everything-in-one-hub", kind="ui", shot="18-renter-dashboard.png",
         headline="Your rides, {a}", accent="organised",
         sub="Bookings, chats and favourites in one hub"),
    dict(slug="11-dark-mode", kind="dark", shot="04-home.png",
         headline="Beautiful in the {a}", accent="dark",
         sub="A gorgeous dark theme, built right in"),
]


def b64_png(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


def make_white_logo(build):
    img = Image.open(LOGO_SRC).convert("RGBA")
    img.putdata([(255, 255, 255, a) for (_, _, _, a) in img.getdata()])
    dst = os.path.join(build, "logo-white.png")
    img.save(dst)
    return dst


def rounded_icon(build):
    """Rounded-corner version of the 1024 app icon for the cover card."""
    from PIL import ImageDraw
    icon = Image.open(APPICON_SRC).convert("RGBA")
    mask = Image.new("L", icon.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, icon.size[0], icon.size[1]],
                                           radius=int(icon.size[0] * 0.225), fill=255)
    icon.putalpha(mask)
    dst = os.path.join(build, "appicon-rounded.png")
    icon.save(dst)
    return dst


COMMON_CSS = f"""
* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:{W}px; height:{H}px; overflow:hidden; }}
@font-face {{ font-family:'SFRounded'; src:url('sfrounded.ttf'); }}
.stage {{ position:relative; width:{W}px; height:{H}px;
  font-family:'SFRounded','Arial Black',sans-serif; overflow:hidden; }}
.bokeh {{ position:absolute; border-radius:50%; filter:blur(2px); }}
.accent {{ color:#7CCBFF; }}
.headline {{ color:#fff; font-variation-settings:'wght' 820; font-weight:800;
  line-height:1.02; letter-spacing:-1.5px; text-shadow:0 8px 30px rgba(0,0,0,.28); }}
.sub {{ color:rgba(255,255,255,.82); font-variation-settings:'wght' 560; font-weight:600;
  letter-spacing:.2px; }}
.tagline {{ position:absolute; bottom:64px; left:0; right:0; text-align:center;
  color:rgba(255,255,255,.55); font-variation-settings:'wght' 620; font-weight:700;
  font-size:27px; letter-spacing:7px; }}
"""

BG_LIGHT = """linear-gradient(158deg, #0A2B54 0%, #0E3A66 40%, #1378CB 78%, #1484D9 100%)"""
BG_DARK = """linear-gradient(160deg, #030B16 0%, #06182B 46%, #0A2B54 100%)"""


def device_slide_html(slide, idx, logo_uri):
    dark = slide["kind"] == "dark"
    shots_dir = SHOTS_DARK if dark else SHOTS_LIGHT
    shot_uri = b64_png(os.path.join(shots_dir, slide["shot"]))
    headline_html = (slide["headline"]
                     .replace("{a}", f'<span class="accent">{slide["accent"]}</span>')
                     .replace("\n", "<br>"))
    swoosh_rot = -18 + (idx % 3) * 6
    bokeh_x = 18 + (idx * 11) % 64
    bg = BG_DARK if dark else BG_LIGHT
    top_glow = ("radial-gradient(120% 70% at 50% -8%, rgba(77,179,255,.22), rgba(0,0,0,0) 55%),"
                if dark else
                f"radial-gradient(120% 80% at {bokeh_x}% 6%, rgba(255,255,255,.16), rgba(255,255,255,0) 42%),"
                "radial-gradient(90% 60% at 92% 30%, rgba(120,200,255,.18), rgba(255,255,255,0) 50%),")
    bokeh_alpha = ".05" if dark else ".07"
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{COMMON_CSS}
.stage {{ background: {top_glow} {bg}; }}
.b1 {{ width:520px; height:520px; left:-140px; top:560px; background:rgba(255,255,255,{bokeh_alpha}); }}
.b2 {{ width:360px; height:360px; right:-120px; top:980px; background:rgba(124,203,255,.10); }}
.b3 {{ width:240px; height:240px; left:120px; top:2180px; background:rgba(255,255,255,{bokeh_alpha}); }}
.swoosh {{ position:absolute; left:-160px; top:1180px; width:1700px; height:220px; transform:rotate({swoosh_rot}deg);
  background:linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.10), rgba(255,255,255,0));
  border-radius:200px; filter:blur(8px); }}
.swoosh2 {{ position:absolute; left:-120px; top:1320px; width:1500px; height:120px; transform:rotate({swoosh_rot}deg);
  background:linear-gradient(90deg, rgba(124,203,255,0), rgba(124,203,255,.16), rgba(124,203,255,0));
  border-radius:200px; filter:blur(6px); }}
.logo {{ position:absolute; top:104px; left:0; right:0; text-align:center; }}
.logo img {{ height:78px; filter:drop-shadow(0 6px 18px rgba(0,0,0,.25)); }}
.copy {{ position:absolute; top:236px; left:0; right:0; padding:0 96px; text-align:center; }}
.copy .headline {{ font-size:104px; }}
.copy .sub {{ font-size:40px; line-height:1.25; margin-top:30px; }}
.phone {{ position:absolute; left:50%; bottom:152px; transform:translateX(-50%);
  width:828px; padding:15px; background:#0a0c10; border-radius:104px;
  box-shadow:0 60px 130px rgba(0,0,0,.55), 0 24px 60px rgba(0,0,0,.4), inset 0 0 0 2px rgba(255,255,255,.06); }}
.phone::before {{ content:''; position:absolute; inset:0; border-radius:104px;
  background:linear-gradient(150deg, rgba(255,255,255,.18), rgba(255,255,255,0) 30%); pointer-events:none; }}
.phone img {{ display:block; width:100%; border-radius:90px; }}
</style></head><body><div class="stage">
  <div class="bokeh b1"></div><div class="bokeh b2"></div><div class="bokeh b3"></div>
  <div class="swoosh"></div><div class="swoosh2"></div>
  <div class="logo"><img src="{logo_uri}"></div>
  <div class="copy"><div class="headline">{headline_html}</div><div class="sub">{slide["sub"]}</div></div>
  <div class="phone"><img src="{shot_uri}"></div>
  <div class="tagline">GHANA CAR SHARING</div>
</div></body></html>"""


def cover_html(slide, logo_uri, icon_uri):
    headline_html = (slide["headline"]
                     .replace("{a}", f'<span class="accent">{slide["accent"]}</span>')
                     .replace("\n", "<br>"))
    pills = "".join(f'<span class="pill">{p}</span>' for p in slide["pills"])
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{COMMON_CSS}
.stage {{ background:
  radial-gradient(120% 70% at 50% 4%, rgba(255,255,255,.16), rgba(255,255,255,0) 46%),
  radial-gradient(90% 60% at 88% 36%, rgba(120,200,255,.18), rgba(255,255,255,0) 52%),
  {BG_LIGHT};
  display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 110px; }}
.b1 {{ width:560px; height:560px; left:-150px; top:300px; background:rgba(255,255,255,.06); }}
.b2 {{ width:420px; height:420px; right:-150px; bottom:360px; background:rgba(124,203,255,.10); }}
.appicon {{ width:268px; height:268px; border-radius:60px; margin-bottom:64px;
  box-shadow:0 40px 90px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.10); }}
.coverlogo {{ height:120px; margin-bottom:60px; filter:drop-shadow(0 8px 22px rgba(0,0,0,.3)); }}
.cover .headline {{ font-size:112px; text-align:center; }}
.cover .sub {{ font-size:44px; margin-top:36px; text-align:center; }}
.pills {{ display:flex; gap:22px; flex-wrap:wrap; justify-content:center; margin-top:74px; }}
.pill {{ color:#fff; font-variation-settings:'wght' 640; font-weight:700; font-size:34px;
  padding:22px 40px; border-radius:100px; background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.22); backdrop-filter:blur(4px);
  box-shadow:0 10px 30px rgba(0,0,0,.18); }}
</style></head><body><div class="stage cover">
  <div class="bokeh b1"></div><div class="bokeh b2"></div>
  <img class="appicon" src="{icon_uri}">
  <img class="coverlogo" src="{logo_uri}">
  <div class="headline">{headline_html}</div>
  <div class="sub">{slide["sub"]}</div>
  <div class="pills">{pills}</div>
  <div class="tagline">GHANA CAR SHARING</div>
</div></body></html>"""


def render(html_path, out_path, build):
    # Chrome's new headless writes the screenshot within seconds but may hang on
    # shutdown, so run with a timeout, kill it, and accept the PNG it produced.
    if os.path.exists(out_path):
        os.remove(out_path)
    profile = tempfile.mkdtemp(prefix="chrome-", dir=build)
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
           "--hide-scrollbars", "--force-device-scale-factor=1",
           f"--window-size={W},{H}", f"--user-data-dir={profile}",
           "--no-first-run", "--no-default-browser-check",
           "--virtual-time-budget=4000", "--timeout=8000",
           "--default-background-color=00000000",
           f"--screenshot={out_path}", f"file://{html_path}"]
    p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         start_new_session=True)
    try:
        p.wait(timeout=25)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(os.getpgid(p.pid), signal.SIGKILL)
        except Exception:
            p.kill()
    shutil.rmtree(profile, ignore_errors=True)
    if not os.path.exists(out_path):
        raise RuntimeError(f"Chrome produced no screenshot for {out_path}")
    im = Image.open(out_path).convert("RGB")
    if im.size != (W, H):
        im.resize((W, H), Image.LANCZOS).save(out_path)


def main():
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    build = tempfile.mkdtemp(prefix="hayame-appstore-")
    try:
        shutil.copy(FONT_SRC, os.path.join(build, "sfrounded.ttf"))
        logo_uri = b64_png(make_white_logo(build))
        icon_uri = b64_png(rounded_icon(build))
        for idx, slide in enumerate(SLIDES):
            slug = slide["slug"]
            if only and slug.split("-")[0] not in only:
                continue
            if slide["kind"] == "cover":
                html = cover_html(slide, logo_uri, icon_uri)
            else:
                html = device_slide_html(slide, idx, logo_uri)
            hp = os.path.join(build, f"slide-{slug}.html")
            with open(hp, "w") as f:
                f.write(html)
            op = os.path.join(OUT, f"{slug}.png")
            render(hp, op, build)
            print(f"  {slug}.png  {Image.open(op).size[0]}x{Image.open(op).size[1]}")
    finally:
        shutil.rmtree(build, ignore_errors=True)
    print("done ->", OUT)


if __name__ == "__main__":
    main()
