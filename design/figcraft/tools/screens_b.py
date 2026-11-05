from screens_lib import *

NAMES = ("Trip Details", "Calendar Sheet", "Location", "Review", "Checkout", "Checkout – Processing 1", "Checkout – Processing 2", "Checkout – Processing 3", "Trips", "Saved", "More", "Home (Dark)")
for n in NAMES: lib.delete_named_top(n)
lib.page("Screens")
Y2, Y3 = 1000, 2000

def booking_screen(name, x, step, nav_left, nav_title, title, subtitle, hint, button="Next"):
    f, c = screen(name, x, Y2, tab=None)
    set_props(c, paddingTop=0, paddingBottom=170, gap=12)
    modal_nav(c, nav_left, nav_title)
    text(c, f"Step {step} of 4", "Label/14 Bold", "brand/blue")
    text(c, title, "Title/28", name="Title")
    text(c, subtitle, "Body/15", "text/muted", name="Subtitle", sizingH="fill")
    inst(c, "Steps", variant=f"Step={step}", name="Steps")
    bar, btn = sticky_bottom(f, button, hint)
    return f, c, btn

# ---------- Step 1: Trip details ----------
f, c, _ = booking_screen("Trip Details", 0, 1, "Cancel", "Trip details", "Trip details", "Set your dates first. Nothing else competes for attention here.", "Choose your dates first.")
k = card(c, "Your Trip", gap=6)
text(k, "Your trip", "Body/16 Bold"); text(k, "1 day", "Title/28", "brand/blue", name="Days")
text(k, "Choose dates below. Unavailable and booked days are blocked automatically.", "Caption/13", "text/muted", sizingH="fill")
k = card(c, "Dates", gap=14)
inst(k, "Input", {"label": "Start date", "value": "25/06/2026"}, name="Start Date", w=326)
inst(k, "Input", {"label": "End date", "value": "26/06/2026"}, name="End Date", w=326)
text(k, "Unavailable dates are crossed out. The first bookable day is selected for you automatically.", "Caption/13", "text/muted", sizingH="fill")
text(k, "Quick select", "Label/14 Bold")
for q in ("2 days", "3 days", "1 week"):
    p = frame(k, f"Quick/{q}", h=44, fill="bg/selected", radius=14, layout="horizontal", main="center", cross="center", sizingH="fill"); text(p, q, "Label/14 Bold", "brand/navy")

# ---------- Calendar sheet (overlay) ----------
sh = frame(None, "Calendar Sheet", w=W, h=700, x=470, y=Y2 + 144, fill="bg/page", radius=[28, 28, 0, 0], clip=True, effects=[shadow("#0A2B5440", -8, 40)])
SCREENS["Calendar Sheet"] = sh
grab = rect(sh, 40, 5, fill="stroke/control", radius=3, name="Grabber"); set_props(grab, x=175, y=8)
c = col(sh, "Content", gap=14, padding=[20, 16, 24, 16], w=W, sizingV="hug"); set_props(c, x=0, y=16)
nav = row(c, "Nav", main="spaceBetween", cross="center", sizingH="fill")
spacer(nav, 70, 44); text(nav, "Choose start date", "Subtitle/18", name="Nav Title"); inst(nav, "ButtonPillLight", {"label": "Done"}, name="Done")
text(c, "Unavailable days are crossed out. Only bookable dates can be selected.", "Caption/13", "text/muted", sizingH="fill")
def month(parent, title, rows, unavailable, selected=None, rng=()):
    k = card(parent, title, gap=8, padding=16)
    text(k, title, "Subtitle/18")
    hd = row(k, "Weekdays", main="spaceBetween", sizingH="fill")
    for d in ("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"):
        w = frame(hd, d, w=44, h=20, fill=None, layout="horizontal", main="center", cross="center"); text(w, d, "Caption/12", "text/muted")
    for ri, r in enumerate(rows):
        rr = row(k, f"Week {ri}", main="spaceBetween", sizingH="fill")
        for d in r:
            if d is None: spacer(rr, 44, 44); continue
            un = d in unavailable; sel = d == selected; inr = d in rng
            cell = frame(rr, f"Day {d}", w=44, h=44, fill=("brand/blue" if sel else "bg/selected" if inr else "bg/field" if un else None), radius=22, layout="horizontal", main="center", cross="center")
            t = text(cell, str(d), "Label/14 Bold", "text/on-brand" if sel else "brand/blue" if inr else "text/muted" if un else "text/primary")
            if un: set_props(t, textDecoration="strikethrough", textDecorationColor=lib.light("status/warning"), textDecorationThickness=1.5, opacity=0.7)
    return k
month(c, "June 2026", [[None, 1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12, 13], [14, 15, 16, 17, 18, 19, 20], [21, 22, 23, 24, 25, 26, 27], [28, 29, 30, None, None, None, None]], set(range(1, 23)) | {28}, 25, (26, 27))
month(c, "July 2026", [[None, None, None, 1, 2, 3, 4], [5, 6, 7, 8, 9, 10, 11]], {2, 9})

# ---------- Step 2: Location ----------
f, c, _ = booking_screen("Location", 940, 2, "Back", "Location", "Location", "Choose pickup or delivery, then confirm where the trip will happen.", "Pickup or delivery comes first. Then confirm the trip area.")
k = card(c, "Trip Mode", gap=12)
h = row(k, "Head", gap=8, cross="center"); text(h, "Trip mode", "Body/16 Bold"); icon(h, "info", 16, "brand/blue", 2)
opt = row(k, "Option/Pickup", gap=12, padding=[16, 16, 16, 16], fill="bg/selected", radius=14, cross="center", sizingH="fill")
ck = frame(opt, "Check", w=24, h=24, fill="status/success", radius=12, layout="horizontal", main="center", cross="center"); icon(ck, "check", 13, "text/on-brand", 2.8)
oc = col(opt, "Text", gap=3); text(oc, "Pickup", "Body/16 Bold"); text(oc, "This listing is pickup only.", "Caption/13", "text/muted")
k = card(c, "Delivery Details", gap=12)
h = row(k, "Head", gap=8, cross="center"); text(h, "Delivery details", "Body/16 Bold"); icon(h, "info", 16, "brand/blue", 2)
inst(k, "Input", {"label": "Delivery address", "value": "22 Airport Bypass, Accra"}, name="Address", w=326)
text(k, "Preferred delivery time", "Label/14 Bold")
pk = col(k, "Time Picker", gap=0, padding=[8, 12, 8, 12], fill="bg/field", radius=16, sizingH="fill", cross="center")
for vals, on in ((("4", "59", "AM"), False), (("5", "00", "PM"), True), (("6", "01", ""), False)):
    r = row(pk, "Picker Row", main="spaceEvenly", cross="center", h=48, fill=("fill/subtle" if on else None), radius=10, sizingH="fill")
    for v in vals:
        t = text(r, v or " ", "Heading/22", "text/primary" if on else "text/muted"); set_props(t, fontStyle="Regular", opacity=(1 if on else 0.6))

# ---------- Step 3: Review ----------
f, c, _ = booking_screen("Review", 1410, 3, "Back", "Review & price", "Review & price", "See the trip mode, handoff details, and every charge before you pay.", "Review every charge before continuing.")
k = card(c, "Car Summary", padding=14)
r = row(k, "Row", gap=14, cross="center", sizingH="fill")
photo(r, "civic-card.jpg", 118, 96, radius=12)
cc = col(r, "Text", gap=4, sizingH="fill"); text(cc, "Honda Civic 2016", "Subtitle/18"); text(cc, "25/06/2026 - 26/06/2026", "Label/14 Bold", "brand/blue"); text(cc, "1 day • Delivery", "Body/15", "text/muted"); text(cc, "Airport Residential", "Body/15", "text/muted")
k = card(c, "Trip Summary", gap=12); text(k, "Trip summary", "Subtitle/18")
info_rows(k, [("Trip mode", "Delivery"), ("Trip use area", "Airport Residential"), ("Delivery address", "22 Airport Bypass, Accra"), ("Delivery time", "5:00 PM"), ("Contact phone", "+233 24 555 0001"), ("Delivery notes", "Meet at the main gate.")], w=326)
k = card(c, "Price Breakdown", gap=12); text(k, "Price breakdown", "Subtitle/18")
info_rows(k, [("Daily rate × 1", "GHS 300"), ("Service fee", "GHS 30"), ("Delivery", "GHS 0")], w=326)
rect(k, 326, 1, fill="stroke/separator", sizingH="fill", name="Sep")
tr = row(k, "Total", main="spaceBetween", cross="center", sizingH="fill"); text(tr, "Total", "Body/16 Bold"); text(tr, "GHS 330", "Heading/22", "brand/blue")

# ---------- Step 4: Checkout ----------
f, c, btn = booking_screen("Checkout", 1880, 4, "Back", "Checkout", "Checkout", "Confirm the total, then complete payment securely.", "Secure payment. No hidden fees.", button="Make payment")
k = card(c, "Total", gap=8, sizingH="fixed", w=250)
text(k, "Total amount", "Body/16", "text/muted"); text(k, "GHS 896", "Display/34", name="Amount"); text(k, "Secure payment with no hidden fees.", "Caption/13", "text/muted", sizingH="fill")
k = card(c, "Payment Methods", gap=12); text(k, "Payment methods", "Subtitle/18")
for t_, s_, ic in (("Mobile Money", "Fast checkout from your phone", "smartphone"), ("Card", "Visa and Mastercard supported", "credit-card"), ("Bank transfer", "Available in secure checkout", "bank")):
    pr = row(k, f"Method/{t_}", gap=14, padding=[12, 14, 12, 12], fill="bg/field", radius=16, cross="center", sizingH="fill")
    ib = frame(pr, "IconWrap", w=44, h=44, fill="bg/card", radius=22, layout="horizontal", main="center", cross="center"); icon(ib, ic, 20, "brand/blue", 2)
    body = col(pr, "Body", gap=3, sizingH="fill"); text(body, t_, "Body/16 Bold", name="Title"); text(body, s_, "Caption/13", "text/muted", name="Subtitle")
k = card(c, "What Happens Next", gap=10); text(k, "What happens next", "Subtitle/18")
for s_ in ("You're taken to Paystack's secure checkout.", "Your booking is confirmed once payment clears.", "A receipt lands in your inbox."):
    r = row(k, "Point", gap=10, cross="center", sizingH="fill"); ck = frame(r, "Check", w=20, h=20, fill="status/success-bg", radius=10, layout="horizontal", main="center", cross="center"); icon(ck, "check", 11, "status/success", 2.6); text(r, s_, "Body/15", "text/muted", sizingH="fill")
lib.done()
checkout = SCREENS["Checkout"]

# ---------- Processing states (duplicates of Checkout with a spinner dialog) ----------
for i, rot in enumerate((0, 120, 240), 1):
    lib.done()
    d = execute("edit.duplicate", {"ids": [checkout], "dx": 470 * i, "dy": 0})["ids"][0]
    name = f"Checkout – Processing {i}"; set_props(d, name=name); SCREENS[name] = d
    n = lib.node(d, 6); pb = lib.find(n, "Primary Button")
    if pb: execute("instance.setProperties", {"ids": [pb["id"]], "properties": {"label": "Processing..."}}); set_props(pb["id"], opacity=0.55)
    scrim = rect(d, W, H, fill="overlay/scrim", radius=0, name="Scrim"); set_props(scrim, x=0, y=0)
    dlg = col(d, "Dialog", gap=16, padding=[28, 24, 28, 24], w=300, fill="bg/card", radius=24, cross="center", effects=[shadow("#00000033", 16, 40)]); set_props(dlg, x=45, y=300)
    sp = frame(dlg, "Spinner", w=96, h=96, fill=None); set_props(sp, rotation=rot)
    ring = ellipse(sp, 96, "#00000000", name="Track", stroke="brand/light", strokeWeight=8); set_props(ring, x=0, y=0)
    arc = ellipse(sp, 96, "brand/blue", name="Arc"); set_props(arc, x=0, y=0, arcStart=-90, arcSweep=260, arcInner=0.83)
    face = frame(sp, "Face", w=26, h=26, fill="#FFFFFF", radius=13, stroke="brand/navy", strokeWeight=2); set_props(face, x=35, y=35)
    for ex in (8, 15): e = ellipse(face, 3, "brand/navy", name="Eye"); set_props(e, x=ex, y=9)
    sm = lib.create("vector", face, "Smile", 10, 5, path="M2 1c2 3 6 3 8 0", props={"fill": "none", "stroke": lib.light("brand/navy"), "strokeWeight": 1.6, "strokeCap": "round"}); set_props(sm, x=8, y=15)
    text(dlg, "Processing payment", "Subtitle/18", align="center")
    text(dlg, "Please wait while we confirm\nyour payment.", "Body/15", "text/muted", align="center")

# ---------- Trips ----------
f, c = screen("Trips", 0, Y3, tab="Trips")
page_title(c, "Trips")
bn = row(c, "Banner", gap=12, padding=16, fill="bg/card", radius=18, cross="center", sizingH="fill", stroke="stroke/card", effects=[shadow("#0A2B540D", 6, 16)])
ck = frame(bn, "Check", w=28, h=28, fill="status/success", radius=14, layout="horizontal", main="center", cross="center"); icon(ck, "check", 14, "text/on-brand", 2.8)
text(bn, "Payment started. Your booking will appear here after checkout.", "Label/14 Bold", "status/success", sizingH="fill"); text(bn, "Dismiss", "Label/14 Bold", "brand/blue")
text(c, "Upcoming bookings", "Heading/22")
def booking_card(title, asset, badges, rows, ref=None, buttons=(), brand=None):
    k = card(c, "Booking", gap=12, padding=16)
    top = row(k, "Top", gap=14, cross="min", sizingH="fill")
    photo(top, asset, 118, 84, radius=12)
    tc = col(top, "Text", gap=6, sizingH="fill"); text(tc, title, "Subtitle/18", sizingH="fill"); text(tc, "Host • Adenta, Greater Accra Region", "Caption/13", "text/muted", sizingH="fill")
    br = row(tc, "Badges", gap=8)
    for b in badges: inst(br, "Badge", variant=f"Kind={b}", name=f"Badge/{b}")
    if brand: logo_img(top, brand, 44, 30, name="Brand")
    info_rows(k, rows, w=326)
    if ref: text(k, f"Payment ref: {ref}", "Caption/13", "text/muted")
    if buttons:
        br = row(k, "Actions", gap=10)
        for b in buttons: inst(br, "ButtonSecondary", {"label": b}, name=f"Button/{b}")
    return k
booking_card("Honda Civic 2016", "civic-card.jpg", ["Confirmed"], [("Dates", "25/06/2026 - 28/06/2026"), ("Duration", "3 night(s)"), ("Trip mode", "Pickup"), ("Use", "Airport Residential, Adenta"), ("Total", "GHS1556")], "HYM-LIVE-1", ("Message host", "Open dispute"), "brand-honda.png")
r = row(c, "Past Header", main="spaceBetween", cross="center", sizingH="fill"); text(r, "Past trips", "Heading/22"); text(r, "Vehicles", "Label/14", "brand/blue")
booking_card("Mercedes-Benz E-Class (E200/E300/E...", "merc-card.jpg", ["Completed", "Paid"], [("Dates", "02/05/2026 - 04/05/2026"), ("Trip mode", "Pickup"), ("Use", "Adenta, Greater Accra Region"), ("Total", "GHS 900")], None, (), "brand-mercedes_benz.png")

# ---------- Saved ----------
f, c = screen("Saved", 470, Y3, tab="Saved")
page_title(c, "Saved")
st = card(c, "Stat", gap=4, sizingH="fixed", w=180); t = text(st, "TOTAL FAVORITES", "Overline/10", "text/muted"); set_props(t, letterSpacing="8%"); text(st, "1", "Title/28")
r = inst(c, "CarRow", {"title": "Honda Civic 2016", "location": "Adenta, Greater Accra Reg...", "price": "GHS300/day"}, name="Row/Civic")
n = lib.node(r, 4); set_props(lib.find(n, "Photo")["id"], fills=[IMG["civic-card.jpg"]]); hi = lib.find(lib.find(n, "Heart"), "icon/heart"); set_props(hi["id"], fill=lib.light("status/heart"), stroke="none")
em = card(c, "Empty Hint", gap=10, padding=24, cross="center")
hw = frame(em, "IconWrap", w=56, h=56, fill="bg/selected", radius=28, layout="horizontal", main="center", cross="center"); icon(hw, "heart", 26, "brand/blue", 2)
text(em, "Save cars you love", "Subtitle/18", align="center"); text(em, "Tap the heart on any listing to keep it here for later.", "Body/15", "text/muted", align="center", sizingH="fill")

# ---------- More (Dashboard) ----------
f, c = screen("More", 940, Y3, tab="More")
page_title(c, "Dashboard")
text(c, "Welcome back", "Subtitle/18"); text(c, "Manage your bookings, favorites, and profile.", "Body/15", "text/muted", sizingH="fill")
g = row(c, "Stats", gap=12, wrap=True, crossGap=12, sizingH="fill")
for t_, v in (("Upcoming trips", "1"), ("Past trips", "2"), ("Saved cars", "1"), ("Unread chats", "2")):
    k = card(g, f"Stat/{t_}", gap=4, sizingH="fixed", w=173); tt = text(k, t_.upper(), "Overline/10", "text/muted"); set_props(tt, letterSpacing="8%"); text(k, v, "Title/28")
text(c, "Quick nav", "Heading/22")
k = card(c, "Quick Nav", gap=0, padding=[4, 16, 4, 16])
NAV = (("grid", "Overview", "Dashboard summary and activity"), ("calendar", "Bookings", "Review upcoming and past trips."), ("message", "Chats", "Open conversations with hosts."), ("heart", "Favorites", "See the cars you have saved."), ("user", "Profile", "Update your details and contact info."), ("star", "Reviews", "View and submit trip reviews."))
for i, (ic, t_, s_) in enumerate(NAV):
    r = row(k, f"Nav/{t_}", gap=14, cross="center", h=64, sizingH="fill")
    iw = frame(r, "IconWrap", w=40, h=40, fill="bg/selected", radius=12, layout="horizontal", main="center", cross="center"); icon(iw, ic, 18, "brand/blue", 2, filled=False)
    tc = col(r, "Text", gap=2, sizingH="fill"); text(tc, t_, "Body/16 Bold"); text(tc, s_, "Caption/13", "text/muted")
    icon(r, "chevron-right", 18, "text/muted", 2)
    if i < len(NAV) - 1: rect(k, 300, 1, fill="stroke/separator", sizingH="fill", name="Sep")
k = card(c, "Host Mode", gap=12)
r = row(k, "Row", gap=12, cross="center", sizingH="fill")
tc = col(r, "Text", gap=3, sizingH="fill"); text(tc, "Host mode", "Body/16 Bold"); text(tc, "Switch to manage your listings and bookings.", "Caption/13", "text/muted", sizingH="fill")
tg = frame(r, "Toggle", w=51, h=31, fill="bg/field", radius=16, stroke="stroke/control"); kn = ellipse(tg, 27, "#FFFFFF", name="Knob"); set_props(kn, x=2, y=2, effects=[shadow("#00000029", 2, 6)])
inst(k, "ButtonSecondary", {"label": "Become a Host"}, name="Become a Host", w=326)
r = row(c, "Log out", gap=10, cross="center", padding=[8, 4, 8, 4]); icon(r, "log-out", 18, "status/danger", 2); text(r, "Log out", "Body/16 Bold", "status/danger")

# ---------- Home (Dark) ----------
lib.done()
home = SCREENS.get("Home")
if home:
    d = execute("edit.duplicate", {"ids": [home], "dx": 0, "dy": Y3})["ids"][0]
    set_props(d, name="Home (Dark)"); SCREENS["Home (Dark)"] = d
    lib.done(); execute("variable.setMode", {"ids": [d], "collection": CID, "mode": "Dark"})

lib.done(); save_screens()
out = "/private/tmp/claude-501/-Users-wusunanwa-Desktop-Hayame-2-0-/7f919758-0c9f-48ce-8a63-0b9ad18821fd/scratchpad/hayame-design/render-screens-b.png"
print(lib.render(out, [SCREENS[n] for n in NAMES if n in SCREENS], scale=0.5))
print({k: v for k, v in SCREENS.items()})
