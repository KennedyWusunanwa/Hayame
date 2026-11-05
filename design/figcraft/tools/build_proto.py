from screens_lib import *
S = json.load(open("screens.json"))
LOG = []
def add(nid, dest=None, trigger=("onClick", None), transition="smartAnimate", direction=None, ms=300, easing="easeOut", action="navigate", extra=None):
    trig = {"type": trigger[0]}
    if trigger[0] == "afterDelay": trig["ms"] = trigger[1]
    act = {"type": action}
    if dest is not None: act["dest"] = dest
    if extra: act.update(extra)
    p = {"id": nid, "trigger": trig, "action": act, "durationMs": ms, "easing": easing}
    if transition:
        tr = {"type": transition}
        if direction: tr["direction"] = direction
        p["transition"] = tr
    try:
        r = execute("proto.interaction.add", p); LOG.append(("ok", nid, action, dest)); return r
    except Exception as e:
        LOG.append(("ERR", nid, action, dest, str(e)[-200:])); print("ERR", str(e)[-300:]); return None

def child(screen_name, *names, depth=6):
    n = lib.node(S[screen_name], depth)
    for nm in names:
        f = lib.find(n, nm)
        if f: return f["id"]
    print("missing child", screen_name, names); return None

lib.page("Screens")
# clear old interactions on screens (idempotent)
for n, sid in S.items():
    try: execute("proto.interaction.clear", {"ids": [sid]})
    except Exception: pass

# ---------- settings & flow ----------
try: execute("proto.settings", {"device": "iPhone 16", "background": "#E6ECF4"})
except Exception as e: print("settings:", e)
try:
    for fl in (execute("proto.flow.list") if False else []): pass
except Exception: pass
try: print("flow:", execute("proto.flow.add", {"start": S["Splash – In"], "name": "Renter journey"}))
except Exception as e: print("flow:", e)
try: print("flow2:", execute("proto.flow.add", {"start": S["Home (Dark)"], "name": "Dark mode"}))
except Exception as e: print("flow2:", e)

# ---------- intro motion ----------
add(S["Splash – In"], S["Splash"], ("afterDelay", 80), "smartAnimate", None, 900, {"customSpring": {"mass": 1, "stiffness": 120, "damping": 14}})
add(S["Splash"], S["Login"], ("afterDelay", 1800), "dissolve", None, 450, "easeInOut")
# login -> loading -> home (skeleton shimmer loop then dissolve)
add(child("Login", "Log in"), S["Home – Loading"], ("onClick", None), "push", "left", 380, {"customBezier": {"x1": 0.2, "y1": 0.8, "x2": 0.2, "y2": 1}})
if "Home – Loading 2" not in S:
    d = execute("edit.duplicate", {"ids": [S["Home – Loading"]], "dx": 0, "dy": -1000})["ids"][0]
    set_props(d, name="Home – Loading 2"); S["Home – Loading 2"] = d; SCREENS.update(S); save_screens()
    sh = lib.find(lib.node(d, 2), "Shimmer"); set_props(sh["id"], x=420)
    lib.done()
add(S["Home – Loading"], S["Home – Loading 2"], ("afterDelay", 60), "smartAnimate", None, 1100, "linear")
add(S["Home – Loading 2"], S["Home"], ("afterDelay", 60), "dissolve", None, 350, "easeOut")

# ---------- tab bar (on the component variants, inherited by every instance) ----------
TAB_DEST = {"Home": "Home", "Explore": "Explore", "Trips": "Trips", "Saved": "Saved", "More": "More"}
for vname, vid in REG["TabBar"]["variants"].items():
    n = lib.node(vid, 4)
    for label, dest in TAB_DEST.items():
        item = lib.find(n, f"Tab/{label}")
        if item: add(item["id"], S[dest], ("onClick", None), "smartAnimate", None, 260, "easeOut")

# ---------- component micro-interactions ----------
pv = REG["ButtonPrimary"]["variants"]
add(pv["State=Default"], pv["State=Pressed"], ("onPress", None), "smartAnimate", None, 120, "easeOut", action="changeTo")
hv = REG["HeartButton"]["variants"]
add(hv["Saved=Off"], hv["Saved=On"], ("onClick", None), "smartAnimate", None, 260, "bouncy", action="changeTo")
add(hv["Saved=On"], hv["Saved=Off"], ("onClick", None), "smartAnimate", None, 200, "easeOut", action="changeTo")
cv = REG["Chip"]["variants"]
add(cv["State=Default"], cv["State=Selected"], ("onClick", None), "smartAnimate", None, 200, "easeOut", action="changeTo")
add(cv["State=Selected"], cv["State=Default"], ("onClick", None), "smartAnimate", None, 200, "easeOut", action="changeTo")

# ---------- browse -> detail ----------
for scr, names in (("Home", ("Card/Civic", "Row/Civic")), ("Home (Dark)", ("Card/Civic", "Row/Civic")), ("Explore", ("Row/Honda",)), ("Saved", ("Row/Civic",))):
    for nm in names:
        cid_ = child(scr, nm)
        if cid_: add(cid_, S["Car Detail"], ("onClick", None), "smartAnimate", None, 420, "easeOut")
add(child("Car Detail", "Back"), None, ("onClick", None), "push", "right", 300, "easeOut", action="back")
add(child("Car Detail", "Book now"), S["Trip Details"], ("onClick", None), "moveIn", "bottom", 380, "easeOut")

# ---------- booking flow ----------
add(child("Trip Details", "Nav Button"), None, ("onClick", None), "moveOut", "bottom", 300, "easeIn", action="back")
ok = add(child("Trip Details", "Start Date"), S["Calendar Sheet"], ("onClick", None), "moveIn", "bottom", 320, "easeOut", action="openOverlay", extra={"position": "bottomCenter", "background": "#0A2B5466"})
if ok is None: add(child("Trip Details", "Start Date"), S["Calendar Sheet"], ("onClick", None), "moveIn", "bottom", 320, "easeOut", action="openOverlay", extra={"position": "manual", "offset": [0, 144], "background": "#0A2B5466"})
add(child("Calendar Sheet", "Done"), None, ("onClick", None), "moveOut", "bottom", 260, "easeIn", action="closeOverlay")
add(child("Trip Details", "Primary Button"), S["Location"], ("onClick", None), "push", "left", 320, "easeOut")
add(child("Location", "Nav Button"), None, ("onClick", None), "push", "right", 300, "easeOut", action="back")
add(child("Location", "Primary Button"), S["Review"], ("onClick", None), "push", "left", 320, "easeOut")
add(child("Review", "Nav Button"), None, ("onClick", None), "push", "right", 300, "easeOut", action="back")
add(child("Review", "Primary Button"), S["Checkout"], ("onClick", None), "push", "left", 320, "easeOut")
add(child("Checkout", "Nav Button"), None, ("onClick", None), "push", "right", 300, "easeOut", action="back")
add(child("Checkout", "Primary Button"), S["Checkout – Processing 1"], ("onClick", None), "dissolve", None, 250, "easeOut")
add(S["Checkout – Processing 1"], S["Checkout – Processing 2"], ("afterDelay", 20), "smartAnimate", None, 520, "linear")
add(S["Checkout – Processing 2"], S["Checkout – Processing 3"], ("afterDelay", 20), "smartAnimate", None, 520, "linear")
add(S["Checkout – Processing 3"], S["Trips"], ("afterDelay", 700), "dissolve", None, 450, "easeInOut")
# more: log out -> login
add(child("More", "Log out"), S["Login"], ("onClick", None), "dissolve", None, 350, "easeInOut")

# ---------- fixed bars while scrolling ----------
fixed_ok = None
for scr in ("Home", "Explore", "Trips", "Saved", "More", "Home (Dark)", "Car Detail", "Trip Details", "Location", "Review", "Checkout"):
    n = lib.node(S[scr], 2)
    for nm in ("Tab Bar", "Bottom Fade", "Home Indicator", "Status Bar", "Bottom Bar"):
        f = lib.find(n, nm)
        if not f: continue
        for key in ("fixed", "scrollBehavior"):
            try:
                execute("node.set", {"ids": [f["id"]], "props": {key: True if key == "fixed" else "fixed"}}); fixed_ok = key; break
            except Exception as e:
                if fixed_ok is None: print("fixed attempt", key, str(e)[-120:])
                continue
print("fixed via:", fixed_ok)
lib.done()
errs = [l for l in LOG if l[0] == "ERR"]
print(f"interactions: {len(LOG)} added, {len(errs)} errors")
for e in errs[:10]: print(e)
