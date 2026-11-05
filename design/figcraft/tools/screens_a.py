from screens_lib import *

X = {"splash_in": 0, "splash": 470, "login": 940, "home_loading": 1410, "home": 1880, "explore": 2350, "detail": 2820}
for n in ("Splash – In", "Splash", "Login", "Home – Loading", "Home", "Explore", "Car Detail"): lib.delete_named_top(n)
lib.page("Screens")

# ---------- Splash (two states for the intro animation) ----------
def splash(name, x, intro):
    f = frame(None, name, w=W, h=H, x=x, y=0, fill="#0A2B54", clip=True)
    set_props(f, fills=[{"type": "radialGradient", "stops": ["#1484D9", "#0A2B54", "#061A33"], "from": [0.5, 0.42], "to": [1.0, 1.0]}])
    # bokeh dots (from SplashScreen.swift)
    for i, (bx, by, bs, op) in enumerate([(0.16,0.18,0.32,0.07),(0.84,0.12,0.24,0.08),(0.90,0.46,0.42,0.05),(0.10,0.62,0.36,0.06),(0.74,0.82,0.28,0.07),(0.30,0.88,0.22,0.06),(0.50,0.30,0.18,0.06)]):
        d = bs * W * (0.6 if intro else 1.0)
        e = ellipse(f, d, "#FFFFFF", name=f"Bokeh {i}"); set_props(e, x=bx*W - d/2, y=by*H - d/2, opacity=(0 if intro else op))
    # rings
    for i, (d, op) in enumerate([(260, 0.26), (340, 0.16), (420, 0.08)]):
        dd = d * (0.5 if intro else 1.0)
        r = frame(f, f"Ring {i}", w=dd, h=dd, fill=None, stroke="#4DB3FF", radius=dd/2, strokeWeight=1.2); set_props(r, x=W/2-dd/2, y=H*0.46-dd/2, opacity=(0 if intro else op))
    glow = ellipse(f, 300, "#4DB3FF", name="Glow"); set_props(glow, x=W/2-150, y=H*0.46-150, opacity=(0.0 if intro else 0.22), effects=[{"type": "layerBlur", "radius": 60}])
    lw, lh = 230, 117
    s = 0.6 if intro else 1.0
    lg = logo_img(f, "launch-logo.png", lw*s, lh*s, name="Launch Logo"); set_props(lg, x=W/2-lw*s/2, y=H*0.46-lh*s/2, opacity=(0 if intro else 1))
    tag = text(f, "GHANA CAR SHARING", "Overline/10", "text/on-brand", name="Tagline", align="center", w=200); set_props(tag, x=95, y=H*0.46+80, opacity=(0 if intro else 0.82), letterSpacing="18%")
    inst(f, "StatusBarLight", x=0, y=0, name="Status Bar")
    SCREENS[name] = f
    return f
splash("Splash – In", X["splash_in"], True)
splash("Splash", X["splash"], False)

# ---------- Login ----------
f, c = screen("Login", X["login"], 0, status="StatusBarLight", tab=None)
set_props(c, y=0, padding=[0, 0, 40, 0], gap=0)
head = col(c, "Auth Header", gap=10, padding=[36, 24, 32, 24], w=W, fill="brand/auth-header", radius=[0, 0, 32, 32], sizingH="fill")
set_props(head, y=-54, paddingTop=90)
logo_img(head, "logo-white.png", 150, 76, name="Logo")
text(head, "Welcome back.", "Title/28", "text/on-brand")
text(head, "Log in to continue", "Body/15", "text/on-brand", name="Sub")
form = col(c, "Form", gap=18, padding=[28, 24, 0, 24], sizingH="fill")
inst(form, "Input", {"label": "Email", "value": "ama.owusu@gmail.com"}, name="Email", w=342)
inst(form, "Input", {"label": "Password", "value": "••••••••••"}, name="Password", w=342)
r = row(form, "Forgot", main="max", sizingH="fill"); text(r, "Forgot password?", "Label/14", "brand/blue")
inst(form, "ButtonPrimary", {"label": "Log in"}, variant="State=Default", name="Log in", w=342)
bio = row(form, "Biometric", gap=10, main="center", cross="center", h=48, fill="bg/selected", radius=24, sizingH="fill"); icon(bio, "shield", 18, "brand/navy", 2); text(bio, "Log in with Face ID", "Body/16 Bold", "brand/navy")
sep = row(form, "Divider", gap=12, cross="center", sizingH="fill"); rect(sep, 100, 1, fill="stroke/separator", sizingH="fill"); text(sep, "or", "Caption/12", "text/muted"); rect(sep, 100, 1, fill="stroke/separator", sizingH="fill")
r = row(form, "Signup", gap=6, main="center", sizingH="fill"); text(r, "No account?", "Body/15", "text/muted"); text(r, "Sign up", "Body/16 Bold", "brand/blue")
r = row(form, "Guest", gap=6, main="center", sizingH="fill"); text(r, "Continue as guest", "Label/14", "text/muted")

# ---------- Home header (shared) ----------
def home_header(c):
    hr = row(c, "Header", main="spaceBetween", cross="center", sizingH="fill")
    left = row(hr, "User", gap=12, cross="center")
    inst(left, "Avatar", {"initials": "AO"}, name="Avatar")
    names = col(left, "Names", gap=2)
    text(names, "Ama Owusu", "Body/16 Bold", name="Name")
    loc = row(names, "Location", gap=4, cross="center"); icon(loc, "map-pin", 13, "text/muted", 2.2); text(loc, "Accra", "Caption/13", "text/muted"); icon(loc, "chevron-down", 13, "brand/blue", 2.4)
    msg = frame(hr, "Messages", w=44, h=44, fill="bg/card", radius=22, layout="horizontal", main="center", cross="center", stroke="stroke/control"); icon(msg, "message", 20, "brand/navy", 2)
    dot = ellipse(msg, 9, "brand/blue", name="Unread Dot"); set_props(dot, absolute=True, x=31, y=4, stroke="#FFFFFF", strokeWeight=1.5)
    return hr

CHIPS = ["All", "Compact", "Convertible", "Crossover", "Electric", "SUV"]
def chips(c, selected="All"):
    cr = row(c, "Chips", gap=8, w=W, sizingH="fixed"); set_props(cr, clip=False, width=W + 120)
    for ch in CHIPS:
        inst(cr, "Chip", {"label": ch}, variant=("State=Selected" if ch == selected else "State=Default"), name=f"Chip/{ch}")
    return cr

# ---------- Home – Loading (skeleton) ----------
f, c = screen("Home – Loading", X["home_loading"], 0, tab="Home")
home_header(c)
inst(c, "SearchBar", name="Search Bar")
cr = row(c, "Chips", gap=8)
for i, w in enumerate((58, 92, 112, 100)): rect(cr, w, 36, fill="bg/skeleton", radius=18, name=f"Chip Skeleton {i}")
sh = row(c, "Section Skeleton", main="spaceBetween", sizingH="fill"); rect(sh, 110, 22, fill="bg/skeleton", radius=6); rect(sh, 50, 16, fill="bg/skeleton", radius=6)
cards = row(c, "Cards", gap=14)
for i in range(2):
    k = col(cards, f"Card Skeleton {i}", gap=10, padding=12, w=252, fill="bg/card", radius=18, stroke="stroke/card")
    rect(k, 228, 164, fill="bg/skeleton", radius=16, name="Image"); rect(k, 150, 16, fill="bg/skeleton", radius=6); rect(k, 90, 12, fill="bg/skeleton", radius=6); rect(k, 110, 18, fill="bg/skeleton", radius=6)
sh = row(c, "Section Skeleton 2", main="spaceBetween", sizingH="fill"); rect(sh, 140, 22, fill="bg/skeleton", radius=6); rect(sh, 50, 16, fill="bg/skeleton", radius=6)
for i in range(2):
    k = row(c, f"Row Skeleton {i}", gap=14, padding=12, fill="bg/card", radius=18, stroke="stroke/card", sizingH="fill")
    rect(k, 132, 110, fill="bg/skeleton", radius=14); b = col(k, "Lines", gap=10, sizingH="fill"); rect(b, 140, 16, fill="bg/skeleton", radius=6); rect(b, 170, 12, fill="bg/skeleton", radius=6); rect(b, 60, 20, fill="bg/skeleton", radius=10); rect(b, 100, 18, fill="bg/skeleton", radius=6)
shimmer = rect(f, 160, 1100, fill="#FFFFFF", radius=0, name="Shimmer"); set_props(shimmer, x=-200, y=-100, rotation=18, opacity=0.55, fills=gradient(["#FFFFFF00", "#FFFFFF", "#FFFFFF00"], "horizontal"))

# ---------- Home ----------
f, c = screen("Home", X["home"], 0, tab="Home")
home_header(c)
inst(c, "SearchBar", name="Search Bar")
chips(c)
inst(c, "SectionHeader", {"title": "Near you"}, name="Near you")
cards = row(c, "Near You Cards", gap=14, w=W + 100, sizingH="fixed")
inst(cards, "CarCard", {"title": "Honda Civic 2016", "location": "Adenta", "price": "GHS 300/day"}, name="Card/Civic")
m = inst(cards, "CarCard", {"title": "Mercedes-Benz E-Class", "location": "Adenta", "price": "GHS 300/day"}, name="Card/Mercedes")
n = lib.node(m, 4); ph = lib.find(n, "Photo"); set_props(ph["id"], fills=[IMG["merc-card.jpg"]])
inst(c, "SectionHeader", {"title": "Popular picks"}, name="Popular picks")
r1 = inst(c, "CarRow", {"title": "Honda Civic 2016", "location": "Adenta, Greater Accra Reg...", "price": "GHS300/day"}, name="Row/Civic")
n = lib.node(r1, 4); ph = lib.find(n, "Photo"); set_props(ph["id"], fills=[IMG["civic-card.jpg"]])
hb = lib.find(n, "Heart"); hi = lib.find(hb, "icon/heart"); set_props(hi["id"], fill=lib.light("status/heart"), stroke="none")
r2 = inst(c, "CarRow", {"title": "Mercedes-Benz E-Class (E200/E300/E...", "location": "Adenta, Greater Accra Reg...", "price": "GHS300/day"}, name="Row/Mercedes")
n = lib.node(r2, 4); ph = lib.find(n, "Photo"); set_props(ph["id"], fills=[IMG["merc-card.jpg"]])
r3 = inst(c, "CarRow", {"title": "Acura RDX 2026", "location": "Adenta, Greater Accra Reg...", "price": "GHS300/day"}, name="Row/Acura")
n = lib.node(r3, 4); ph = lib.find(n, "Photo"); set_props(ph["id"], fills=[IMG["rdx.jpg"]])

# ---------- Explore ----------
f, c = screen("Explore", X["explore"], 0, tab="Explore")
page_title(c, "Explore")
sb = row(c, "Search Field", gap=8, padding=[0, 8, 0, 16], h=56, fill="bg/card", radius=18, cross="center", sizingH="fill", stroke="stroke/card")
icon(sb, "search", 20, "text/muted", 2.2); text(sb, "Search cars, cities,...", "Body/15", "text/muted", sizingH="fill")
sp = frame(sb, "Sort", h=30, fill="bg/selected", radius=15, layout="horizontal", main="center", cross="center", padding=[0, 10, 0, 10]); text(sp, "Sort", "Caption/12", "brand/blue")
tg = row(sb, "View Toggle", gap=2, padding=3, fill="bg/field", radius=12)
for ic, on in (("list", True), ("grid", False)):
    b = frame(tg, f"Toggle/{ic}", w=34, h=30, fill=("bg/selected" if on else None), radius=10, layout="horizontal", main="center", cross="center"); icon(b, ic, 16, "brand/blue", 2)
icon(sb, "sliders", 20, "brand/blue", 2.2)
brands = row(c, "Brands", main="spaceBetween", sizingH="fill", padding=[0, 12, 0, 12])
for label, asset in (("All", None), ("Toyota", "brand-toyota.png"), ("Honda", "brand-honda.png"), ("Kia", "brand-kia.png")):
    b = col(brands, f"Brand/{label}", gap=8, cross="center", w=70)
    if asset: logo_img(b, asset, 52, 40, name="Logo")
    else:
        w = frame(b, "IconWrap", w=52, h=40, fill=None, layout="horizontal", main="center", cross="center"); icon(w, "car", 30, "brand/blue", 2)
    text(b, label, "Caption/13", "brand/blue" if label == "All" else "text/primary")
    if label == "All": rect(b, 36, 3, fill="brand/blue", radius=2, name="Underline")
for title, asset, saved in (("Honda\nCivic 2016", "civic-card.jpg", True), ("Honda CR-\nV 2022", "crv.jpg", False), ("Acura\nRDX 2026", "rdx.jpg", False), ("Chevrolet\nEquinox 2024", "placeholder.jpg", False)):
    r = inst(c, "CarRow", {"title": title, "location": "Adenta, Greater Ac...", "price": "GHS300/day"}, name=f"Row/{title.splitlines()[0]}")
    n = lib.node(r, 4); set_props(lib.find(n, "Photo")["id"], fills=[IMG[asset]])
    if saved: hi = lib.find(lib.find(n, "Heart"), "icon/heart"); set_props(hi["id"], fill=lib.light("status/heart"), stroke="none")

# ---------- Car Detail ----------
f, c = screen("Car Detail", X["detail"], 0, tab=None)
set_props(c, paddingBottom=150)
nav = row(c, "Nav", gap=12, cross="center", sizingH="fill")
bk = frame(nav, "Back", w=40, h=40, fill="bg/card", radius=20, layout="horizontal", main="center", cross="center", stroke="stroke/control", effects=[shadow("#0A2B5414", 4, 12)]); icon(bk, "arrow-left", 18, "brand/navy", 2.2)
text(c, "Car Detail", "Title/28")
k = card(c, "Summary")
tags = row(k, "Tags", gap=8, cross="center", wrap=True, crossGap=8)
text(tags, "Car in Adenta", "Label/14 Bold", "brand/blue")
for tg_, bg in (("Sedan", "bg/selected"), ("Added Feb 18, 2026", "fill/subtle")):
    b = frame(tags, f"Tag/{tg_}", h=26, fill=bg, radius=13, layout="horizontal", main="center", cross="center", padding=[0, 10, 0, 10]); t = text(b, tg_, "Caption/12", "brand/navy" if tg_ == "Sedan" else "text/muted"); set_props(t, fontStyle="Bold")
tr = row(k, "Title Row", gap=12, cross="min", sizingH="fill")
text(tr, "Honda\nCivic 2016", "Title/28", name="Title", sizingH="fill")
fav = col(tr, "Save", gap=6, padding=[12, 14, 12, 14], fill="bg/card", radius=14, cross="center", stroke="stroke/control"); icon(fav, "heart", 20, "status/heart", filled=True); text(fav, "Save to favorites", "Caption/12", "text/muted")
text(k, "Adenta, Greater Accra Region", "Body/15", "text/muted")
rt = row(k, "Rating", gap=6, cross="center"); icon(rt, "star", 16, "status/star", filled=True); text(rt, "0.0", "Label/14 Bold", "status/star"); text(rt, "0 reviews", "Body/15", "text/muted")
text(c, "Car photo", "Heading/22")
pk = card(c, "Photos", padding=12, gap=10)
hero = frame(pk, "Hero Image", w=334, h=230, fill="bg/field", radius=16, clip=True, sizingH="fill")
ph = photo(hero, "civic-wide.jpg", 334, 230, radius=16, name="Photo")
dots = row(hero, "Dots", gap=8, cross="center"); set_props(dots, x=117, y=206)
for i in range(6): d = ellipse(dots, 8, "#FFFFFF", name=f"Dot {i}"); set_props(d, opacity=(1 if i == 0 else 0.55))
th = row(pk, "Thumbnails", gap=10, sizingH="fill")
for i, a in enumerate(("civic-card.jpg", "civic-thumb2.jpg", "civic-thumb3.jpg", "civic-thumb4.jpg")):
    t = frame(th, f"Thumb {i}", w=76, h=58, fill="bg/field", radius=10, clip=True, stroke=("brand/blue" if i == 0 else None), strokeWeight=2); photo(t, a, 76, 58, radius=10)
text(c, "Details", "Heading/22")
dk = card(c, "Details Card", gap=0, padding=[4, 16, 4, 16])
for i, (kk, vv) in enumerate((("BRAND", "Honda"), ("MODEL", "Civic"), ("YEAR", "2016"), ("TRANSMISSION", "Automatic"), ("FUEL", "Petrol"), ("SEATS", "5"))):
    r = row(dk, f"Detail/{kk}", main="spaceBetween", cross="center", h=44, sizingH="fill")
    t = text(r, kk, "Overline/10", "text/muted"); set_props(t, letterSpacing="8%"); text(r, vv, "Label/14 Bold")
    if i < 5: rect(dk, 300, 1, fill="stroke/separator", sizingH="fill", name="Sep")
bb = row(f, "Bottom Bar", gap=12, padding=[12, 16, 28, 20], w=W, fill="bg/elevated", cross="center", main="spaceBetween", radius=[24, 24, 0, 0]); set_props(bb, x=0, y=734, effects=[shadow("#0A2B5420", -8, 24)])
pc = col(bb, "Price", gap=2); text(pc, "Price per day", "Caption/12", "text/muted"); pr = row(pc, "Amount", gap=4, cross="baseline"); text(pr, "GHS 300", "Title/28"); text(pr, "/ day", "Label/14", "text/muted")
inst(bb, "ButtonPrimary", {"label": "Book now"}, variant="State=Default", name="Book now", w=170)
lib.done(); save_screens()
out = "/private/tmp/claude-501/-Users-wusunanwa-Desktop-Hayame-2-0-/7f919758-0c9f-48ce-8a63-0b9ad18821fd/scratchpad/hayame-design/render-screens-a.png"
print(lib.render(out, [SCREENS[n] for n in ("Splash – In", "Splash", "Login", "Home – Loading", "Home", "Explore", "Car Detail")], scale=0.5))
print({k: v for k, v in SCREENS.items()})
