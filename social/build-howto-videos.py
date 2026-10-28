#!/usr/bin/env python3
"""Hayame how-to videos: "How to book a car" on the app (1080x1920) and on the website (1920x1080).

Usage:
  python3 social/build-howto-videos.py app|web all          # audio + frames + mp4
  python3 social/build-howto-videos.py app|web preview 3 9  # PNG stills at those seconds
  python3 social/build-howto-videos.py app|web frames|audio|mux

Needs Google Chrome plus numpy + imageio-ffmpeg. Screens come from social/howto/app (iOS
screenshots) and social/howto/web (captures of the live site). Prices are pixelated unless
SHOW_PRICES=1 is set. Output: social/video/howto-app.mp4, social/video/howto-web.mp4 (+ poster PNGs).
"""
import base64, json, os, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(ROOT, "scripts/assets/geist")
LOGO = os.path.join(ROOT, "public/logo-white.png")
APPLE = os.path.join(ROOT, "public/badges/download-on-the-app-store.svg")
ICONS = [os.path.join(HERE, f"assets/icons/{n}.svg") for n in ["instagram", "facebook", "tiktok", "snapchat", "x"]]
ENGINE = os.path.join(HERE, "howto/tutorial.html")
OUT_DIR = os.path.join(HERE, "video")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FPS = 30
SHOW_PRICES = os.environ.get("SHOW_PRICES") == "1"


def W(*words):
    """'Pick your *dates*' -> word list; *word* is the accent colour."""
    out = []
    for text in words:
        for w in text.split(" "):
            if w.startswith("*") and w.endswith("*") and len(w) > 2:
                out.append({"t": w[1:-1], "c": "accent"})
            elif w.startswith("*"):
                out.append({"t": w[1:], "c": "accent"})
            elif w.endswith("*"):
                out.append({"t": w[:-1], "c": "accent"})
            else:
                out.append({"t": w})
    return out


def R(x, y, w, h):
    return {"x": x, "y": y, "w": w, "h": h}


def HL(t0, t1, x, y, w, h):
    return {"t0": t0, "t1": t1, "x": x, "y": y, "w": w, "h": h}


def TAP(t, x, y):
    return {"t": t, "x": x, "y": y}


# ----------------------------------------------------------------------------------------------
# APP: 1080x1920. Coordinates are fractions of the screenshot.
# ----------------------------------------------------------------------------------------------
def app_spec():
    S = []
    S.append({"kind": "intro", "dur": 4.2, "title": [W("How to book"), W("a car on the"), W("*Hayame app*")],
              "sub": "From search to keys, in a couple of minutes.", "time": "ABOUT 1 MIN"})
    S.append({"kind": "step", "dur": 6.6, "shot": "a-home", "chip": "Step 1 of 9",
              "title": W("Open", "*Explore*"), "sub": "Tap Explore in the bottom bar, or search by car, city or host right from Home.",
              "highlights": [HL(0.9, 2.7, 0.04, 0.158, 0.71, 0.062), HL(2.9, 4.9, 0.24, 0.893, 0.17, 0.088)],
              "taps": [TAP(4.1, 0.32, 0.921)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 2.7, "z": 1, "fx": .5, "fy": .5}, {"t": 3.5, "z": 1.35, "fx": .34, "fy": .905}, {"t": 5.3, "z": 1.35, "fx": .34, "fy": .905}, {"t": 6.1, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.07, 0.571, 0.24, 0.024), R(0.75, 0.571, 0.21, 0.024), R(0.445, 0.773, 0.235, 0.02)]})
    S.append({"kind": "step", "dur": 6.6, "shot": "a-explore", "chip": "Step 2 of 9",
              "title": W("Pick a car", "*you like*"), "sub": "Filter by brand, scroll the list, and tap any car to see its photos and details.",
              "highlights": [HL(0.9, 2.5, 0.04, 0.24, 0.92, 0.09), HL(2.7, 5.0, 0.04, 0.348, 0.92, 0.15)],
              "taps": [TAP(4.3, 0.5, 0.42)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 2.7, "z": 1, "fx": .5, "fy": .5}, {"t": 3.4, "z": 1.25, "fx": .5, "fy": .43}, {"t": 5.3, "z": 1.25, "fx": .5, "fy": .43}, {"t": 6.1, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.445, 0.465, 0.235, 0.022), R(0.445, 0.632, 0.235, 0.022), R(0.445, 0.80, 0.235, 0.022), R(0.445, 0.978, 0.235, 0.02)]})
    S.append({"kind": "step", "dur": 6.8, "shot": "a-car", "chip": "Step 3 of 9",
              "title": W("Check the details,", "then tap", "*Book now*"), "sub": "Photos, specs, reviews and the host's verification, all before you commit.",
              "highlights": [HL(0.9, 2.7, 0.04, 0.45, 0.92, 0.31), HL(3.0, 5.3, 0.59, 0.878, 0.33, 0.06)],
              "taps": [TAP(4.5, 0.753, 0.91)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 2.8, "z": 1, "fx": .5, "fy": .5}, {"t": 3.6, "z": 1.3, "fx": .6, "fy": .9}, {"t": 5.6, "z": 1.3, "fx": .6, "fy": .9}, {"t": 6.4, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.07, 0.893, 0.37, 0.047)]})
    S.append({"kind": "step", "dur": 6.0, "shot": "a-trip", "chip": "Step 4 of 9",
              "title": W("Set your", "*trip dates*"), "sub": "This is step 1 of 4 inside the app. Tap Start date to open the calendar.",
              "highlights": [HL(0.9, 3.6, 0.085, 0.563, 0.83, 0.058)], "taps": [TAP(3.1, 0.5, 0.592)],
              "callouts": [{"t0": 1.5, "t1": 3.4, "x": 0.5, "y": 0.82, "text": "Quick select: 2, 5 or 7 days", "align": "center"}],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 1.0, "z": 1, "fx": .5, "fy": .5}, {"t": 1.8, "z": 1.2, "fx": .5, "fy": .62}, {"t": 4.6, "z": 1.2, "fx": .5, "fy": .62}, {"t": 5.4, "z": 1, "fx": .5, "fy": .5}]})
    S.append({"kind": "step", "dur": 6.6, "shot": "a-calendar", "chip": "Step 5 of 9",
              "title": W("Choose your", "*start and end*"), "sub": "Crossed-out days are already taken. Pick your days, then tap Done.",
              "highlights": [HL(0.8, 3.4, 0.3, 0.462, 0.66, 0.075), HL(3.7, 5.4, 0.78, 0.07, 0.19, 0.052)],
              "taps": [TAP(1.9, 0.622, 0.498), TAP(2.7, 0.868, 0.498), TAP(4.7, 0.88, 0.096)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 0.8, "z": 1, "fx": .5, "fy": .5}, {"t": 1.5, "z": 1.3, "fx": .62, "fy": .5}, {"t": 3.3, "z": 1.3, "fx": .62, "fy": .5}, {"t": 4.1, "z": 1, "fx": .5, "fy": .5}]})
    S.append({"kind": "step", "dur": 6.6, "shot": "a-location", "chip": "Step 6 of 9",
              "title": W("Pickup or", "*delivery?*"), "sub": "Choose how you'll get the car and confirm the area you'll use it in. Some hosts deliver to you.",
              "highlights": [HL(0.9, 2.9, 0.04, 0.345, 0.92, 0.15), HL(3.1, 4.8, 0.085, 0.598, 0.83, 0.062)],
              "taps": [TAP(5.2, 0.5, 0.895)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 0.8, "z": 1, "fx": .5, "fy": .5}, {"t": 1.5, "z": 1.15, "fx": .5, "fy": .5}, {"t": 4.6, "z": 1.15, "fx": .5, "fy": .5}, {"t": 5.4, "z": 1, "fx": .5, "fy": .5}]})
    S.append({"kind": "step", "dur": 6.6, "shot": "a-review", "chip": "Step 7 of 9",
              "title": W("Review", "*every charge*"), "sub": "Your trip summary and the full price breakdown, before you pay. No surprises.",
              "highlights": [HL(0.9, 2.8, 0.04, 0.505, 0.92, 0.25), HL(3.0, 4.9, 0.04, 0.775, 0.92, 0.085)],
              "taps": [TAP(5.3, 0.5, 0.894)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 2.6, "z": 1, "fx": .5, "fy": .5}, {"t": 3.3, "z": 1.25, "fx": .5, "fy": .8}, {"t": 4.9, "z": 1.25, "fx": .5, "fy": .8}, {"t": 5.7, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.74, 0.828, 0.19, 0.03)]})
    S.append({"kind": "step", "dur": 5.8, "shot": "a-checkout", "chip": "Step 8 of 9",
              "title": W("Pay", "*securely*"), "sub": "Mobile Money, card or bank transfer through Paystack. Tap Make payment.",
              "highlights": [HL(0.9, 3.3, 0.04, 0.5, 0.92, 0.3)], "taps": [TAP(4.0, 0.5, 0.894)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 3.0, "z": 1, "fx": .5, "fy": .5}, {"t": 3.6, "z": 1.25, "fx": .5, "fy": .85}, {"t": 5.2, "z": 1.25, "fx": .5, "fy": .85}, {"t": 5.7, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.085, 0.375, 0.37, 0.055)]})
    S.append({"kind": "beat", "dur": 3.4, "shot": "a-processing", "chip": "",
              "title": W("We confirm", "*your payment*"), "sub": "This takes a few seconds.",
              "blur": [R(0.085, 0.375, 0.37, 0.055)]})
    S.append({"kind": "step", "dur": 7.0, "shot": "a-trips", "chip": "Step 9 of 9",
              "title": W("You're", "*booked!*"), "sub": "Your trip is under Trips. Message the host, and check in on the day.",
              "overlay": "confirm", "overlayT": 1.0, "lines": ["Booking confirmed", "Honda Civic 2016 · 3 nights", "Pickup in Adenta", "SEE IT UNDER TRIPS"],
              "blur": [R(0.77, 0.558, 0.17, 0.026)]})
    S.append({"kind": "outro", "dur": 7.0, "title": [W("Rent a car."), W("*Earn from yours.*")],
              "sub": "Download Hayame on the App Store and Google Play.", "badges": True})
    return {"w": 1080, "h": 1920, "steps": S}


# ----------------------------------------------------------------------------------------------
# WEB: 1920x1080. Coordinates are fractions of each capture (2880x1800 viewport shots).
# ----------------------------------------------------------------------------------------------
def web_spec():
    S = []
    S.append({"kind": "intro", "dur": 4.2, "title": [W("How to book a car"), W("on", "*hayamegh.com*")],
              "sub": "Seven steps, from the homepage to a confirmed trip.", "time": "ABOUT 1 MIN"})
    S.append({"kind": "step", "dur": 7.0, "shot": "w-home", "url": "hayamegh.com", "chip": "Step 1 of 7",
              "title": W("Start at", "*hayamegh.com*"), "sub": "Pick a region, city and dates in the search bar, or open Explore to browse every car.",
              "highlights": [HL(1.0, 3.4, 0.145, 0.365, 0.71, 0.15)],
              "cursorPath": [{"t": 1.3, "x": 0.22, "y": 0.408}, {"t": 2.3, "x": 0.30, "y": 0.474}],
              "taps": [TAP(3.6, 0.73, 0.474)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 0.9, "z": 1, "fx": .5, "fy": .5}, {"t": 1.8, "z": 1.22, "fx": .5, "fy": .45}, {"t": 4.6, "z": 1.22, "fx": .5, "fy": .45}, {"t": 5.6, "z": 1, "fx": .5, "fy": .5}]})
    S.append({"kind": "step", "dur": 7.0, "shot": "w-explore", "url": "hayamegh.com/explore", "chip": "Step 2 of 7",
              "title": W("Browse and", "*pick a car*"), "sub": "Narrow it down with the filters on the left: region, car type, brand, fuel and budget. Click a car to open it.",
              "highlights": [HL(0.9, 2.9, 0.12, 0.3, 0.2, 0.68), HL(3.1, 5.6, 0.36, 0.39, 0.165, 0.31)],
              "cursorPath": [{"t": 1.4, "x": 0.22, "y": 0.39}, {"t": 2.5, "x": 0.22, "y": 0.6}, {"t": 3.2, "x": 0.36, "y": 0.5}],
              "taps": [TAP(4.5, 0.44, 0.5)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 2.9, "z": 1, "fx": .5, "fy": .5}, {"t": 3.7, "z": 1.2, "fx": .45, "fy": .52}, {"t": 5.6, "z": 1.2, "fx": .45, "fy": .52}, {"t": 6.4, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.45, 0.68, 0.078, 0.022), R(0.628, 0.68, 0.075, 0.022), R(0.805, 0.68, 0.075, 0.022)]})
    S.append({"kind": "step", "dur": 7.0, "shot": "w-car-full", "url": "hayamegh.com/cars/toyota-corolla", "chip": "Step 3 of 7",
              "title": W("Check the", "*car page*"), "sub": "Photos, specs, host verification and the cancellation policy on one page. The booking box sits on the right.",
              "scroll": [{"t": 0.6, "y": 0}, {"t": 3.4, "y": 0.22}, {"t": 7, "y": 0.22}],
              "highlights": [HL(3.2, 6.0, 0.633, 0.218, 0.252, 0.2)],
              "cursorPath": [{"t": 1.2, "x": 0.3, "y": 0.2}, {"t": 3.6, "x": 0.6, "y": 0.3}],
              "taps": [TAP(9.0, 0.76, 0.33)],
              "blur": [R(0.78, 0.0565, 0.105, 0.025), R(0.647, 0.2235, 0.11, 0.011)]})
    S.append({"kind": "step", "dur": 7.0, "shot": "w-car-dates", "url": "hayamegh.com/cars/toyota-corolla", "chip": "Step 4 of 7",
              "title": W("Pick your", "*dates*"), "sub": "Choose a start and end date, or use Quick select. The number of nights updates instantly.",
              "highlights": [HL(1.0, 3.2, 0.645, 0.468, 0.225, 0.07), HL(3.4, 5.4, 0.70, 0.543, 0.165, 0.052)],
              "cursorPath": [{"t": 1.2, "x": 0.62, "y": 0.6}], "taps": [TAP(2.6, 0.70, 0.51)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 0.8, "z": 1, "fx": .5, "fy": .5}, {"t": 1.6, "z": 1.3, "fx": .76, "fy": .55}, {"t": 5.6, "z": 1.3, "fx": .76, "fy": .55}, {"t": 6.5, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.647, 0.16, 0.07, 0.034)]})
    S.append({"kind": "step", "dur": 7.6, "shot": "w-car-pay", "url": "hayamegh.com/cars/toyota-corolla", "chip": "Step 5 of 7",
              "title": W("Confirm the area", "*and the price*"), "sub": "Pick the region and city you'll drive in. Every charge is listed before you click Instant Book.",
              "highlights": [HL(0.9, 3.0, 0.648, 0.325, 0.222, 0.27), HL(3.2, 5.6, 0.648, 0.615, 0.222, 0.22)],
              "cursorPath": [{"t": 1.2, "x": 0.72, "y": 0.44}, {"t": 3.4, "x": 0.72, "y": 0.72}], "taps": [TAP(6.0, 0.758, 0.91)],
              "cam": [{"t": 0, "z": 1, "fx": .5, "fy": .5}, {"t": 0.8, "z": 1, "fx": .5, "fy": .5}, {"t": 1.6, "z": 1.22, "fx": .76, "fy": .62}, {"t": 6.6, "z": 1.22, "fx": .76, "fy": .62}, {"t": 7.3, "z": 1, "fx": .5, "fy": .5}],
              "blur": [R(0.80, 0.622, 0.066, 0.2)]})
    S.append({"kind": "step", "dur": 6.6, "shot": "w-car-pay", "url": "checkout.paystack.com", "chip": "Step 6 of 7",
              "title": W("Pay", "*securely*"), "sub": "A secure Paystack window opens. Pay with Mobile Money, card or bank transfer.",
              "overlay": "checkout", "overlayT": 0.5, "taps": [{"t": 3.6, "at": "overlay-btn"}],
              "blur": [R(0.80, 0.622, 0.066, 0.2)]})
    S.append({"kind": "step", "dur": 7.2, "shot": "w-car-pay", "url": "hayamegh.com/dashboard/bookings", "chip": "Step 7 of 7",
              "title": W("You're", "*booked!*"), "sub": "Instant Book confirms right away. Otherwise the host approves before pickup. Find your trip under My trips.",
              "overlay": "confirm", "overlayT": 0.7, "lines": ["Booking confirmed", "Toyota Corolla · 3 nights · Adenta", "Your receipt is in your inbox.", "SEE IT UNDER MY TRIPS"],
              "blur": [R(0.80, 0.622, 0.066, 0.2)]})
    S.append({"kind": "outro", "dur": 7.0, "title": [W("Rent a car."), W("*Earn from yours.*")],
              "sub": "Book your next ride at www.hayamegh.com", "badges": False})
    return {"w": 1920, "h": 1080, "steps": S}


ASSET_FILES = {
    "a-home": "howto/app/04-home.jpg", "a-explore": "howto/app/05-explore.jpg", "a-car": "howto/app/07-car-detail.jpg",
    "a-trip": "howto/app/08-booking-trip.jpg", "a-calendar": "howto/app/09-booking-calendar.jpg", "a-location": "howto/app/10-booking-location.jpg",
    "a-review": "howto/app/11-booking-review.jpg", "a-checkout": "howto/app/12-booking-payment.jpg", "a-processing": "howto/app/13-payment-processing.jpg",
    "a-trips": "howto/app/14-trips.jpg",
    "w-home": "howto/web/01-home.jpg", "w-explore": "howto/web/02-explore.jpg", "w-car-full": "howto/web/03-car-full.jpg",
    "w-car-dates": "howto/web/04-car-dates.jpg", "w-car-pay": "howto/web/04b-car-pay.jpg",
}


def finalize(spec):
    """Absolute start/end for each step; collect sound events; strip blur when SHOW_PRICES."""
    t = 0.0
    events = {"transitions": [], "taps": [], "highlights": [], "success": [], "intro": [0.15], "outro_at": None}
    for s in spec["steps"]:
        s["start"], s["end"] = round(t, 3), round(t + s["dur"], 3)
        if s["kind"] in ("step", "beat"):
            events["transitions"].append(s["start"])
            for tap in s.get("taps", []):
                if tap["t"] < s["dur"]:
                    events["taps"].append(round(s["start"] + tap["t"], 3))
            for h in s.get("highlights", []):
                events["highlights"].append(round(s["start"] + h["t0"], 3))
            if s.get("overlay") == "confirm":
                events["success"].append(round(s["start"] + s["overlayT"], 3))
            if SHOW_PRICES:
                s.pop("blur", None)
        if s["kind"] == "outro":
            events["outro_at"] = s["start"]
        t += s["dur"]
    spec["duration"] = round(t, 3)
    spec["fps"] = FPS
    return spec, events


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def build_html(spec, work):
    html = open(ENGINE).read()
    fonts = "{" + ",".join(f'"{w}":"{b64(f"{FONTS}/Geist-{n}.woff2", "font/woff2")}"' for n, w in [("Regular", 400), ("Medium", 500), ("SemiBold", 600), ("Bold", 700), ("Black", 900)]) + "}"
    icons = []
    for p in ICONS:
        svg = open(p).read().replace("<svg ", '<svg fill="#fff" ', 1)
        icons.append('"data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode() + '"')
    used = {s["shot"] for s in spec["steps"] if s.get("shot")}
    assets = {k: "file://" + os.path.join(HERE, v) for k, v in ASSET_FILES.items() if k in used}
    assets["apple"] = "file://" + APPLE
    html = (html.replace("{{SPEC}}", json.dumps(spec)).replace("{{FONTS}}", fonts).replace("{{ASSETS}}", json.dumps(assets))
            .replace("{{LOGO}}", b64(LOGO, "image/png")).replace("{{ICONS}}", "[" + ",".join(icons) + "]"))
    os.makedirs(work, exist_ok=True)
    path = os.path.join(work, "scene.html")
    open(path, "w").write(html)
    return path


def shot(html, t, out, w, h, work):
    # Resumable: a finished frame is kept. A hung Chrome (it happens once in a few thousand launches) is retried.
    if os.path.exists(out) and os.path.getsize(out) > 5000:
        return
    for attempt in range(4):
        prof = tempfile.mkdtemp(prefix="chr-", dir=work)
        try:
            subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1",
                            "--allow-file-access-from-files", f"--window-size={w},{h}", f"--user-data-dir={prof}", "--virtual-time-budget=5000",
                            f"--screenshot={out}", f"file://{html}#t={t:.4f}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
        except subprocess.TimeoutExpired:
            pass
        finally:
            shutil.rmtree(prof, ignore_errors=True)
        if os.path.exists(out) and os.path.getsize(out) > 5000:
            return
    raise RuntimeError(f"frame at t={t} failed after 4 tries")


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "app"
    cmd = sys.argv[2] if len(sys.argv) > 2 else "all"
    spec, events = finalize(app_spec() if which == "app" else web_spec())
    work = os.path.join(tempfile.gettempdir(), f"hayame-howto-{which}")
    os.makedirs(work, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    name = f"howto-{which}"
    wav = os.path.join(OUT_DIR, name + ".wav")
    fdir = os.path.join(work, "frames")
    print(f"{which}: {spec['duration']}s, {len([s for s in spec['steps'] if s['kind']=='step'])} steps, taps at {events['taps']}")

    if cmd == "preview":
        html = build_html(spec, work)
        pdir = os.path.join(work, "prev"); os.makedirs(pdir, exist_ok=True)
        for s in sys.argv[3:]:
            out = os.path.join(pdir, f"t{float(s):06.2f}.png"); shot(html, float(s), out, spec["w"], spec["h"], work); print(out)
        return
    if cmd in ("audio", "all"):
        import importlib.util
        sp = importlib.util.spec_from_file_location("synth_howto", os.path.join(HERE, "howto/synth_howto.py")); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
        m.render(wav, spec["duration"], events); print("audio", wav)
    if cmd in ("frames", "all"):
        html = build_html(spec, work)
        os.makedirs(fdir, exist_ok=True)  # existing frames are reused; delete the folder to start over
        n = int(spec["duration"] * FPS); jobs = [(i, os.path.join(fdir, f"f{i:04d}.png")) for i in range(n)]
        done = 0
        with ThreadPoolExecutor(max_workers=6) as ex:
            for _ in ex.map(lambda j: shot(html, j[0] / FPS, j[1], spec["w"], spec["h"], work), jobs):
                done += 1
                if done % 150 == 0: print(f"  frames {done}/{n}", flush=True)
    if cmd in ("mux", "all"):
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe(); out = os.path.join(OUT_DIR, name + ".mp4")
        subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f%04d.png"), "-i", wav,
                        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
                        "-c:a", "aac", "-b:a", "224k", "-shortest", out], check=True)
        poster_t = next(s["start"] + 2.5 for s in spec["steps"] if s["kind"] == "step")
        shutil.copy(os.path.join(fdir, f"f{int(poster_t * FPS):04d}.png"), os.path.join(OUT_DIR, name + "-poster.png"))
        print("wrote", out)


if __name__ == "__main__":
    main()
