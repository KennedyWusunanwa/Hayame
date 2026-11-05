import sys, json; sys.path.insert(0, ".")
import lib, tokens
from lib import execute, request, frame, col, row, text, rect, ellipse, icon, image, spacer, gradient, shadow, bind, set_props

ids = json.load(open("tokens-ids.json")); lib.VARS = ids["vars"]; lib.STYLES = ids["styles"]; CID = ids["collection"]
REG = {}   # component registry: name -> {"id":..., "variants": {...}}
IMG = {}   # image hashes by asset name

def make_component(nid, name):
    r = execute("component.create", {"ids": [nid]})
    cid = r.get("id", nid)
    set_props(cid, name=name)
    return cid

def add_text_prop(comp, prop, layer):
    execute("component.addProperty", {"id": comp, "name": prop, "type": "text", "layer": layer})

def variants(name, builders):
    """builders: list of (variantName 'Prop=Value', fn(parent_x, parent_y)->frame id). Combine into a set."""
    vids = []
    for vname, fn in builders:
        fid = fn(); set_props(fid, name=vname); vids.append(fid)
    lib.done()
    for v in vids: execute("component.create", {"ids": [v]})
    s = execute("component.combineVariants", {"ids": vids})
    set_props(s["id"], name=name)
    return s["id"], dict(zip([b[0] for b in builders], vids))

pg = lib.page("Components")
for n in ("Components Board",): lib.delete_named_top(n)
# everything lives inside a big board frame with sections so the page stays tidy
B = col(None, "Components Board", gap=56, padding=56, w=1500, fill="bg/page", radius=32, x=0, y=0, sizingV="hug")
text(B, "Components", "Display/34")

def section(title):
    s = col(B, title, gap=20, sizingH="fill")
    text(s, title, "Heading/22")
    r = row(s, "Row", gap=40, cross="min", wrap=True, crossGap=32, sizingH="fill")
    return r

# ---------- image fills (hashes) ----------
sec = section("Image assets")
for f in ("civic-card.jpg", "civic-wide.jpg", "crv.jpg", "rdx.jpg", "merc-card.jpg", "gle.jpg", "placeholder.jpg", "logo.png", "logo-white.png", "launch-logo.png", "app-icon.png", "civic-thumb2.jpg", "civic-thumb3.jpg", "civic-thumb4.jpg", "brand-toyota.png", "brand-honda.png", "brand-kia.png", "brand-mercedes_benz.png", "brand-acura.png", "brand-chevrolet.png"):
    w = 120 if not f.startswith(("logo", "launch", "brand")) else (150 if not f.startswith("brand") else 72)
    h = 90 if not f.startswith(("logo", "launch", "brand")) else (78 if not f.startswith("brand") else 72)
    nid = image(sec, f, w, h, radius=12, name=f, mode="fit" if f.startswith(("logo", "launch", "app", "brand")) else "fill")
    lib.done()
    n = request("node.get", {"id": nid, "depth": 0})
    IMG[f] = n["fills"][0]
    if f.startswith(("logo", "launch")): set_props(nid, fill=lib.light("brand/navy")) if f == "logo-white.png" else None
print("image paint sample:", json.dumps(IMG["civic-card.jpg"])[:200])

# ---------- Status bar ----------
sec = section("Status bar & home indicator")
def status_bar(dark_text=False):
    color = "text/on-brand" if dark_text else "text/primary"
    f = frame(sec, "Status Bar", w=390, h=54, fill=None)
    t = text(f, "9:41", "Body/16 Bold", color, name="Time"); set_props(t, x=32, y=18, fontSize=17)
    island = rect(f, 125, 37, fill="#000000", radius=19, name="Dynamic Island"); set_props(island, x=132.5, y=11)
    # signal bars
    sig = row(f, "Signal", gap=2, cross="max"); set_props(sig, x=293, y=21)
    for i, hh in enumerate((4, 6, 8, 11)): rect(sig, 3, hh, fill=color, radius=1, name=f"bar{i}")
    wf = icon(f, "wifi", 17, color, 2.2); set_props(wf, x=315, y=19)
    bat = frame(f, "Battery", w=27, h=13, fill=None, stroke=color, radius=4.5, strokeWeight=1); set_props(bat, x=338, y=19, opacity=0.5)
    fillb = rect(f, 21, 9, fill=color, radius=2.5, name="Battery Fill"); set_props(fillb, x=341, y=21)
    tip = rect(f, 1.5, 4, fill=color, radius=1, name="Battery Tip"); set_props(tip, x=366.5, y=23.5, opacity=0.5)
    return f
sb = status_bar(); sbw = status_bar(True); set_props(sbw, fill="#0A2B54")
lib.done()
REG["StatusBar"] = {"id": make_component(sb, "Status Bar/Dark text")}
REG["StatusBarLight"] = {"id": make_component(sbw, "Status Bar/Light text")}
hi = frame(sec, "Home Indicator", w=390, h=34, fill=None)
pill = rect(hi, 134, 5, fill="text/primary", radius=3, name="Pill"); set_props(pill, x=128, y=21, opacity=0.32)
lib.done(); REG["HomeIndicator"] = {"id": make_component(hi, "Home Indicator")}

# ---------- Tab bar ----------
sec = section("Tab bar")
TABS = [("Home", "home"), ("Explore", "search"), ("Trips", "calendar"), ("Saved", "heart"), ("More", "more")]
def tab_bar(active):
    bar = row(sec, f"Active={active}", gap=0, padding=[6, 8, 6, 8], w=358, h=64, fill="bg/card", radius=28, main="spaceBetween", cross="center", stroke="stroke/card",
              effects=[shadow("#0A2B541A", 8, 24)])
    for label, ic in TABS:
        on = (label == active)
        item = col(bar, f"Tab/{label}", gap=3, padding=[7, 0, 6, 0], w=66, h=52, fill=("bg/selected" if on else None), radius=20, main="center", cross="center")
        if on: set_props(item, name="ActivePill")
        wrap = frame(item, "IconWrap", w=24, h=24, fill=None)
        ico = icon(wrap, ic, 22, "brand/blue" if on else "text/muted", 2); set_props(ico, x=1, y=1)
        if label == "More":
            bd = frame(wrap, "Badge", w=16, h=16, fill="status/heart", radius=8, layout="horizontal", main="center", cross="center"); set_props(bd, x=14, y=-8, absolute=True)
            t = text(bd, "2", "Caption/12", "text/on-brand"); set_props(t, fontSize=10)
        text(item, label, "Caption/12", "brand/blue" if on else "text/muted", name="Label")
    return bar
set_id, vmap = variants("Tab Bar", [(f"Active={l}", (lambda l=l: tab_bar(l))) for l, _ in TABS])
REG["TabBar"] = {"id": set_id, "variants": vmap}

# ---------- Buttons ----------
sec = section("Buttons")
def primary(label="Next", pressed=False, w=358):
    f = frame(sec, "Button", w=w, h=52, fill="#1484D9", radius=26, layout="horizontal", main="center", cross="center",
              effects=[shadow("#1484D952" if not pressed else "#1484D91F", 10 if not pressed else 4, 16 if not pressed else 8)])
    set_props(f, fills=gradient(["#1484D9", "#0A2B54"] if not pressed else ["#0F6DB5", "#081F3D"], "horizontal"))
    bind(f, "fills/0/stops/0/color", "brand/blue"); bind(f, "fills/0/stops/1/color", "brand/button-end")
    t = text(f, label, "Body/16 Bold", "text/on-brand", name="Label")
    return f, t
pD, tD = primary(); pP, tP = primary(pressed=True)
set_id, vmap = variants("Button/Primary", [("State=Default", lambda: pD), ("State=Pressed", lambda: pP)])
REG["ButtonPrimary"] = {"id": set_id, "variants": vmap, "label_prop": "label"}
execute("component.addProperty", {"id": set_id, "name": "label", "type": "text", "layer": tD})
try: execute("component.bindProperty", {"id": tP, "property": "label"})
except Exception as e: print("bindProperty:", e)

def secondary(label="Message host"):
    f = frame(sec, "Button/Secondary", w=None, h=48, fill="bg/selected", radius=24, layout="horizontal", main="center", cross="center", padding=[0, 24, 0, 24])
    t = text(f, label, "Body/16 Bold", "brand/navy", name="Label"); return f, t
sf, st = secondary(); lib.done()
REG["ButtonSecondary"] = {"id": make_component(sf, "Button/Secondary")}; add_text_prop(REG["ButtonSecondary"]["id"], "label", st)

def light_pill(label="Back"):
    f = frame(sec, "Button/Pill Light", h=44, fill="bg/card", radius=22, layout="horizontal", main="center", cross="center", padding=[0, 20, 0, 20], effects=[shadow("#0A2B5414", 4, 12)])
    t = text(f, label, "Body/16", "text/primary", name="Label"); return f, t
lf, lt = light_pill(); lib.done()
REG["ButtonPillLight"] = {"id": make_component(lf, "Button/Pill Light")}; add_text_prop(REG["ButtonPillLight"]["id"], "label", lt)

def icon_button(ic, size=40, filled=False, color="brand/navy"):
    f = frame(sec, "Icon Button", w=size, h=size, fill="bg/card", radius=size/2, layout="horizontal", main="center", cross="center", stroke="stroke/control")
    icon(f, ic, 18, color, 2.2, filled=filled); return f
hOff = icon_button("heart"); hOn = icon_button("heart", filled=True, color="status/heart")
set_id, vmap = variants("Heart Button", [("Saved=Off", lambda: hOff), ("Saved=On", lambda: hOn)])
REG["HeartButton"] = {"id": set_id, "variants": vmap}

# ---------- Chips & badges ----------
sec = section("Chips & badges")
def chip(label, on):
    f = frame(sec, "Chip", h=36, fill=("brand/blue" if on else "bg/chip"), radius=18, layout="horizontal", main="center", cross="center", padding=[0, 16, 0, 16], stroke=(None if on else "stroke/control"))
    t = text(f, label, "Label/14", "text/on-brand" if on else "text/primary", name="Label"); return f, t
cD, ctD = chip("Compact", False); cS, ctS = chip("All", True)
set_id, vmap = variants("Chip", [("State=Default", lambda: cD), ("State=Selected", lambda: cS)])
REG["Chip"] = {"id": set_id, "variants": vmap}
execute("component.addProperty", {"id": set_id, "name": "label", "type": "text", "layer": ctD})
try: execute("component.bindProperty", {"id": ctS, "property": "label"})
except Exception as e: print("bindProperty chip:", e)

BADGES = {"Instant": ("status/success-bg", "status/success"), "Confirmed": ("brand/light", "brand/blue"), "Completed": ("fill/subtle", "text/muted"),
          "Paid": ("status/success-bg", "status/success"), "Pending": ("#ED8F3029", "status/warning"), "Cancelled": ("#E0404029", "status/danger")}
def badge(kind):
    bg, fg = BADGES[kind]
    f = frame(sec, "Badge", h=24, fill=bg, radius=12, layout="horizontal", main="center", cross="center", padding=[0, 10, 0, 10], gap=4)
    if kind == "Instant": icon(f, "zap", 11, fg, filled=True)
    t = text(f, kind, "Caption/12", fg, name="Label"); set_props(t, fontStyle="Bold", fontSize=11); return f
set_id, vmap = variants("Badge", [(f"Kind={k}", (lambda k=k: badge(k))) for k in BADGES])
REG["Badge"] = {"id": set_id, "variants": vmap}

# ---------- Search bar & section header ----------
sec = section("Search & headers")
def search_bar():
    f = row(sec, "Search Bar", gap=10, w=358, h=50, cross="center")
    field = row(f, "Field", gap=10, padding=[0, 6, 0, 16], h=50, fill="bg/field", radius=18, cross="center", sizingH="fill")
    icon(field, "search", 20, "text/muted", 2.2)
    text(field, "Car, city, or host...", "Body/15", "text/muted", name="Placeholder", sizingH="fill")
    fb = frame(field, "Filter", w=38, h=38, fill="brand/blue", radius=12, layout="horizontal", main="center", cross="center")
    icon(fb, "sliders", 18, "text/on-brand", 2.2)
    btn = frame(f, "Search Button", w=76, h=50, fill="brand/blue", radius=18, layout="horizontal", main="center", cross="center")
    text(btn, "Search", "Label/14 Bold", "text/on-brand")
    return f
s = search_bar(); lib.done(); REG["SearchBar"] = {"id": make_component(s, "Search Bar")}
def section_header(title="Near you"):
    f = row(sec, "Section Header", w=358, main="spaceBetween", cross="center")
    t = text(f, title, "Heading/22", name="Title"); a = text(f, "See all", "Label/14", "brand/blue", name="Action"); return f, t
sh, sht = section_header(); lib.done(); REG["SectionHeader"] = {"id": make_component(sh, "Section Header")}; add_text_prop(REG["SectionHeader"]["id"], "title", sht)

# ---------- Cards ----------
sec = section("Cards")
def car_card():
    c = col(sec, "Car Card", gap=10, padding=12, w=252, fill="bg/card", radius=18, stroke="stroke/card", effects=[shadow("#0A2B540D", 6, 16)])
    imgw = frame(c, "Hero Image", w=228, h=164, fill="bg/field", radius=16, clip=True, sizingH="fill")
    im = rect(imgw, 228, 164, fill="#DDE6F0", radius=16, name="Photo"); set_props(im, fills=[IMG["civic-card.jpg"]], constraints={"horizontal": "scale", "vertical": "scale"})
    bd = frame(imgw, "Instant Badge", h=24, fill="bg/floating", radius=12, layout="horizontal", main="center", cross="center", padding=[0, 10, 0, 8], gap=4); set_props(bd, x=8, y=8)
    icon(bd, "zap", 11, "status/success", filled=True); t = text(bd, "Instant", "Caption/12", "status/success"); set_props(t, fontStyle="Bold", fontSize=11)
    hb = frame(imgw, "Heart", w=32, h=32, fill="bg/floating", radius=16, layout="horizontal", main="center", cross="center"); set_props(hb, x=188, y=8)
    icon(hb, "heart", 15, "status/heart", filled=True)
    body = col(c, "Body", gap=5, sizingH="fill")
    title = text(body, "Honda Civic 2016", "Body/16 Bold", name="Title", sizingH="fill", maxLines=1)
    loc = row(body, "Location", gap=4, cross="center"); icon(loc, "map-pin", 12, "status/heart", 2.4); locT = text(loc, "Adenta", "Caption/13", "text/muted", name="LocationText")
    price = text(body, "GHS 300/day", "Price/20", "brand/blue", name="Price")
    return c, title, locT, price
cc, ct, cl, cp = car_card(); lib.done(); cid = make_component(cc, "Car Card"); REG["CarCard"] = {"id": cid}
for p, l in (("title", ct), ("location", cl), ("price", cp)): add_text_prop(cid, p, l)

def car_row():
    c = row(sec, "Car Row", gap=14, padding=12, w=358, fill="bg/card", radius=18, stroke="stroke/card", cross="min", effects=[shadow("#0A2B540D", 6, 16)])
    im = rect(c, 132, 110, fill="#DDE6F0", radius=14, name="Photo"); set_props(im, fills=[IMG["crv.jpg"]])
    body = col(c, "Body", gap=6, sizingH="fill")
    top = row(body, "Top", gap=8, cross="min", sizingH="fill")
    title = text(top, "Honda CR-V 2022", "Body/16 Bold", name="Title", sizingH="fill")
    hb = frame(top, "Heart", w=36, h=36, fill="bg/card", radius=18, layout="horizontal", main="center", cross="center", stroke="stroke/control"); icon(hb, "heart", 16, "brand/navy", 2.2)
    locT = text(body, "Adenta, Greater Accra", "Caption/13", "text/muted", name="LocationText", sizingH="fill", maxLines=1)
    meta = row(body, "Meta", gap=8, cross="center"); icon(meta, "star", 13, "status/star", filled=True); text(meta, "0.0", "Caption/12", "status/star", name="Rating")
    bd = frame(meta, "Instant", h=22, fill="status/success-bg", radius=11, layout="horizontal", main="center", cross="center", padding=[0, 9, 0, 9]); t = text(bd, "Instant", "Caption/12", "status/success"); set_props(t, fontStyle="Bold", fontSize=11)
    price = text(body, "GHS 300/day", "Price/20", "brand/blue", name="Price")
    return c, title, locT, price
cr, rt, rl, rp = car_row(); lib.done(); rid = make_component(cr, "Car Row"); REG["CarRow"] = {"id": rid}
for p, l in (("title", rt), ("location", rl), ("price", rp)): add_text_prop(rid, p, l)

# ---------- Forms ----------
sec = section("Forms & steps")
def input_field(label="Start date", value="25/06/2026", ic="calendar"):
    c = col(sec, "Input", gap=8, w=318)
    lt = text(c, label, "Label/14 Bold", name="Label")
    f = row(c, "Field", gap=10, padding=[0, 14, 0, 16], h=52, fill="bg/field", radius=14, cross="center", sizingH="fill", stroke="stroke/control")
    vt = text(f, value, "Body/16", name="Value", sizingH="fill"); icon(f, ic, 18, "brand/blue", 2)
    return c, lt, vt
inp, il, iv = input_field(); lib.done(); iid = make_component(inp, "Input Field"); REG["Input"] = {"id": iid}
add_text_prop(iid, "label", il); add_text_prop(iid, "value", iv)

STEPS = ["Trip", "Location", "Review", "Pay"]
def step_indicator(current):
    f = row(sec, "Steps", w=358, main="spaceBetween", cross="min", padding=[0, 16, 0, 16])
    for i, s in enumerate(STEPS, 1):
        done_ = i < current; on = i == current
        c = col(f, f"Step {i}", gap=8, cross="center", w=66)
        circ = frame(c, "Circle", w=28, h=28, fill=("brand/blue" if (on or done_) else "bg/field"), radius=14, layout="horizontal", main="center", cross="center", stroke=(None if (on or done_) else "stroke/control"))
        if done_: icon(circ, "check", 14, "text/on-brand", 2.6)
        else:
            t = text(circ, str(i), "Caption/12", "text/on-brand" if on else "text/muted"); set_props(t, fontStyle="Bold", fontSize=13)
        text(c, s, "Caption/12", "text/primary" if on else "text/muted")
    return f
set_id, vmap = variants("Step Indicator", [(f"Step={i}", (lambda i=i: step_indicator(i))) for i in range(1, 5)])
REG["Steps"] = {"id": set_id, "variants": vmap}

def payment_row(title="Mobile Money", sub="Fast checkout from your phone", ic="smartphone"):
    f = row(sec, "Payment Method", gap=14, padding=[12, 14, 12, 12], w=318, fill="bg/field", radius=16, cross="center")
    ib = frame(f, "IconWrap", w=44, h=44, fill="bg/card", radius=22, layout="horizontal", main="center", cross="center"); icon(ib, ic, 20, "brand/blue", 2)
    body = col(f, "Body", gap=3, sizingH="fill"); t = text(body, title, "Body/16 Bold", name="Title"); s = text(body, sub, "Caption/13", "text/muted", name="Subtitle")
    return f, t, s
pr, pt, ps = payment_row(); lib.done(); pid = make_component(pr, "Payment Method"); REG["PaymentRow"] = {"id": pid}
add_text_prop(pid, "title", pt); add_text_prop(pid, "subtitle", ps)

def avatar(initials="AO"):
    f = frame(sec, "Avatar", w=44, h=44, fill="bg/selected", radius=22, layout="horizontal", main="center", cross="center")
    t = text(f, initials, "Label/14 Bold", "brand/navy", name="Initials"); return f, t
av, avt = avatar(); lib.done(); aid = make_component(av, "Avatar"); REG["Avatar"] = {"id": aid}; add_text_prop(aid, "initials", avt)

def info_row(label="Dates", value="25/06/2026 - 28/06/2026"):
    f = row(sec, "Info Row", w=318, main="spaceBetween", cross="min", gap=12)
    l = text(f, label, "Body/15", "text/muted", name="Label"); v = text(f, value, "Label/14 Bold", name="Value", align="right"); return f, l, v
ir, irl, irv = info_row(); lib.done(); iid2 = make_component(ir, "Info Row"); REG["InfoRow"] = {"id": iid2}
add_text_prop(iid2, "label", irl); add_text_prop(iid2, "value", irv)

lib.done()
json.dump({"components": REG, "images": IMG}, open("components.json", "w"), indent=1)
out = "/private/tmp/claude-501/-Users-wusunanwa-Desktop-Hayame-2-0-/7f919758-0c9f-48ce-8a63-0b9ad18821fd/scratchpad/hayame-design/render-components.png"
print(lib.render(out, [B], scale=0.75))
print("components:", list(REG.keys()))
