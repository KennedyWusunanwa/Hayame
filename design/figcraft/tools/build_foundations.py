import sys, json; sys.path.insert(0, ".")
import lib, tokens
from lib import execute, request, frame, col, row, text, rect, bind

# --- cleanup probe leftovers (idempotent) ---
pages = execute("page.list")
for p in pages:
    if p["name"] == "Probe":
        execute("page.select", {"id": p["id"]}); execute("page.delete", {"id": p["id"]})
vl = execute("variable.list")
print("variable.list shape:", json.dumps(vl)[:400])
cols = vl.get("collections", []) if isinstance(vl, dict) else vl
for c in cols:
    if c.get("name") == "Probe":
        execute("variable.deleteCollection", {"collection": c["id"]})
doc = request("document.inspect", {"depth": 0})
for s in doc.get("styles", []):
    if s.get("name", "").startswith("Probe/"):
        try: execute("style.delete", {"style": s["id"]})
        except Exception as e: print("style.delete:", e)

cid = lib.setup_tokens()
print("collection", cid, "| vars", len(lib.VARS), "| styles", len(lib.STYLES))

pg = lib.page("Foundations")
lib.delete_named_top("Foundations Board")
lib.delete_named_top("Foundations Board (Dark)")

def board(name, x):
    b = col(None, name, gap=40, padding=48, w=1180, fill="bg/page", radius=32, x=x, y=0, sizingV="hug")
    head = col(b, "Header", gap=8)
    text(head, "Hayame iOS", "Display/34")
    text(head, "Design foundations lifted from HayameIOS/Theme/DesignSystem.swift. Colour variables carry Light and Dark modes.", "Body/15", "text/muted")
    # colours
    sec = col(b, "Colours", gap=16, sizingH="fill")
    text(sec, "Colour variables", "Heading/22")
    grid = frame(sec, "Swatches", w=1084, fill=None, layout="horizontal", gap=16, wrap=True, crossGap=16, sizingH="fill", sizingV="hug")
    for tname, (lt, dk) in tokens.COLORS.items():
        card = col(grid, tname, gap=8, w=166)
        sw = rect(card, 166, 72, fill=tname, radius=14, name="swatch", stroke="stroke/card")
        text(card, tname, "Caption/12")
        text(card, f"{lt}  ·  {dk}", "Caption/12", "text/muted")
    # type
    sec = col(b, "Type", gap=16, sizingH="fill")
    text(sec, "Text styles  ·  Inter", "Heading/22")
    for sname, (st, size, lh, ls) in tokens.TEXT.items():
        r = row(sec, sname, gap=24, cross="baseline", sizingH="fill")
        text(r, f"{sname}  —  {st} {size} / {lh}", "Caption/12", "text/muted", w=260)
        text(r, "Quality cars, ready right across Ghana." if size < 30 else "Your ride is here.", sname)
    # radius + spacing
    sec = col(b, "Shape", gap=16, sizingH="fill")
    text(sec, "Corner radius", "Heading/22")
    r = row(sec, "Radii", gap=16)
    for label, rad in (("Card 18", 18), ("Image 16", 16), ("Field 14", 14), ("Small 12", 12), ("Sheet 24", 24), ("Pill", 999)):
        c = col(r, label, gap=8, cross="center")
        rect(c, 96, 64, fill="bg/card", radius=rad, stroke="stroke/card", name="shape")
        text(c, label, "Caption/12", "text/muted")
    return b

b1 = board("Foundations Board", 0)
b2 = board("Foundations Board (Dark)", 1260)
lib.done()
execute("variable.setMode", {"ids": [b2], "collection": cid, "mode": "Dark"})
out = "/private/tmp/claude-501/-Users-wusunanwa-Desktop-Hayame-2-0-/7f919758-0c9f-48ce-8a63-0b9ad18821fd/scratchpad/hayame-design/render-foundations.png"
print(lib.render(out, [b1, b2], scale=0.6))
json.dump({"collection": cid, "vars": lib.VARS, "styles": lib.STYLES}, open("tokens-ids.json", "w"))
print("saved tokens-ids.json")
