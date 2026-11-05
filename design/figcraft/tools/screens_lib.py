"""Screen-level helpers shared by the screen build scripts."""
import sys, json; sys.path.insert(0, ".")
import lib
from lib import execute, request, frame, col, row, text, rect, ellipse, icon, image, spacer, gradient, shadow, bind, set_props

ids = json.load(open("tokens-ids.json")); lib.VARS = ids["vars"]; lib.STYLES = ids["styles"]; CID = ids["collection"]
comp = json.load(open("components.json")); REG = comp["components"]; IMG = comp["images"]
W, H = 390, 844
SCREENS = {}
try: SCREENS.update(json.load(open("screens.json")))
except Exception: pass

def save_screens():
    json.dump(SCREENS, open("screens.json", "w"), indent=1)

def inst(parent, key, props=None, variant=None, x=None, y=None, name=None, w=None):
    cid = REG[key]["id"]
    if variant:
        cid = REG[key]["variants"][variant]
    p = {"component": cid, "parent": parent}
    if x is not None: p["x"] = x
    if y is not None: p["y"] = y
    r = execute("instance.create", p); nid = r["id"]
    if props: execute("instance.setProperties", {"ids": [nid], "properties": props})
    if name or w is not None:
        pr = {}
        if name: pr["name"] = name
        if w is not None: pr["width"] = w
        set_props(nid, **pr)
    return nid

def screen(name, x, y, bg="bg/page", status="StatusBar", tab=None, scroll=True):
    """A 390x844 screen frame. Returns (frame, content column)."""
    f = frame(None, name, w=W, h=H, x=x, y=y, fill=bg, clip=True, radius=0)
    if scroll: set_props(f, overflow="vertical")
    content = col(f, "Content", gap=16, padding=[8, 16, 140 if tab else 48, 16], w=W, sizingV="hug"); set_props(content, x=0, y=54)
    if status: inst(f, status, x=0, y=0, name="Status Bar")
    if tab:
        inst(f, "TabBar", variant=f"Active={tab}", x=16, y=744, name="Tab Bar")
        # a soft fade under the floating bar so content scrolls behind it
        fade = rect(f, W, 120, fill="#F7FAFF", radius=0, name="Bottom Fade"); set_props(fade, x=0, y=724, fills=gradient(["#F7FAFF00", "#F7FAFF"], "vertical"), opacity=0.9)
        bind(fade, "fills/0/stops/0/color", "bg/page"); bind(fade, "fills/0/stops/1/color", "bg/page")
        execute("node.reorder", {"id": fade, "index": 1})
    inst(f, "HomeIndicator", x=0, y=810, name="Home Indicator")
    SCREENS[name] = f
    return f, content

def page_title(parent, title, trailing=None):
    r = row(parent, "Title Row", main="spaceBetween", cross="center", sizingH="fill")
    text(r, title, "Title/28", name="Title")
    return r

def card(parent, name="Card", gap=12, padding=16, fill="bg/card", radius=18, sizingH="fill", **kw):
    return col(parent, name, gap=gap, padding=padding, fill=fill, radius=radius, stroke="stroke/card", sizingH=sizingH, effects=[shadow("#0A2B540D", 6, 16)], **kw)

def modal_nav(parent, left="Back", title="Trip details"):
    nav = frame(parent, "Nav", w=358, h=56, fill=None); 
    b = inst(nav, "ButtonPillLight", {"label": left}, x=0, y=6, name="Nav Button")
    t = text(nav, title, "Subtitle/18", name="Nav Title", align="center", w=200); set_props(t, x=79, y=17)
    return nav, b

def sticky_bottom(f, label="Next", hint=None):
    """Bottom bar with a primary button, drawn over the content."""
    bar = col(f, "Bottom Bar", gap=10, padding=[14, 16, 0, 16], w=W, fill="bg/page", cross="center"); set_props(bar, x=0, y=720, effects=[shadow("#0A2B5412", -6, 20)])
    b = inst(bar, "ButtonPrimary", {"label": label}, variant="State=Default", name="Primary Button", w=358)
    if hint: text(bar, hint, "Caption/13", "text/muted", name="Hint")
    return bar, b

def info_rows(parent, pairs, w=None):
    for k, v in pairs:
        inst(parent, "InfoRow", {"label": k, "value": v}, name=f"Row/{k}", w=w)

def photo(parent, asset, w, h, radius=14, name="Photo"):
    r = rect(parent, w, h, fill="#DDE6F0", radius=radius, name=name); set_props(r, fills=[IMG[asset]]); return r

def logo_img(parent, asset, w, h, name="Logo"):
    r = rect(parent, w, h, fill="#00000000", radius=0, name=name); set_props(r, fills=[IMG[asset]]); return r
