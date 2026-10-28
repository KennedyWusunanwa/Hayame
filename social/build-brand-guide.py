#!/usr/bin/env python3
"""Hayame brand guide PDF. Usage: python3 social/build-brand-guide.py (needs social/posts/01 and 11; run build-social-posts.py first)."""
import base64, os, subprocess, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "scripts/assets/geist")
POSTS = os.path.join(ROOT, "social/posts")
LOGO = os.path.join(ROOT, "HayameIOS/HayameIOS/Assets.xcassets/Logo.imageset/logo.png")
OUT = os.path.join(ROOT, "social/Hayame-Brand-Guide.pdf")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
build = tempfile.mkdtemp(prefix="hayame-guide-")

def tint(rgb, name):
    im = Image.open(LOGO).convert("RGBA"); o = Image.new("RGBA", im.size)
    o.putdata([rgb + (p[3],) for p in im.getdata()]); path = os.path.join(build, name); o.save(path); return "file://" + path
LB, LW, LN = tint((20,132,217),"b.png"), tint((255,255,255),"w.png"), tint((10,43,84),"n.png")

fonts = ""
for n, w in [("Regular",400),("Medium",500),("SemiBold",600),("Bold",700),("Black",900)]:
    u = "data:font/woff2;base64," + base64.b64encode(open(f"{FONTS}/Geist-{n}.woff2","rb").read()).decode()
    fonts += f"@font-face{{font-family:Geist;font-weight:{w};src:url({u}) format('woff2')}}"


ICONROW = "".join(open(os.path.join(ROOT, f"social/assets/icons/{n}.svg")).read().replace("<svg ", "<svg style='width:48px;height:48px;fill:#0A2B54' ", 1) for n in ["instagram","facebook","tiktok","snapchat","x"])
def img(n): return "file://" + os.path.join(POSTS, n + ".png")
def sw(name, hexv, use, dark=False, extra=""):
    c = "#fff" if dark else "#0A2B54"
    return f"<div class='sw' style='background:{hexv};color:{c}'><b>{name}</b><span>{hexv}{extra}</span><em>{use}</em></div>"
def pg(n, title, inner, cls=""): return f"<section class='pg {cls}'><div class='eyebrow'>{n}</div><h2>{title}</h2>{inner}<span class='pn'>Hayame Brand Guide · v2.0</span></section>"

pages = []
pages.append(f"""<section class='pg navy cover'><img src='{LW}' style='height:120px;width:auto;align-self:flex-start'>
<div><h1>Brand<br>Guide</h1><p>Identity · colour · type · layout · voice · v2.0 · October 2026</p></div><span class='ft'>www.hayamegh.com</span></section>""")

pages.append(pg("01 · Who we are", "Neighbourly, clear, premium.", """
<p class='lead'>Hayame is Ghana's peer-to-peer car-sharing marketplace. Renting a car should feel as easy and local as borrowing from someone down the road, with the polish of a product you trust with your money.</p>
<div class='cols3'><div><h3>Friendly</h3><p>Warm, a little playful, always local. We joke with people, never at them.</p></div>
<div><h3>Confident</h3><p>We state things plainly. No hedging, no hype, no jargon.</p></div>
<div><h3>Clear</h3><p>One idea at a time. If it needs a paragraph to explain, it is not ready.</p></div></div>
<div class='cols2' style='margin-top:34px'><div><h3>The feeling</h3><p>Open sky, clean white paint, a road ahead. Calm blue, sharp type, generous space. Premium comes from restraint, not decoration.</p></div>
<div><h3>Promise</h3><p>Verified hosts, clear prices, secure payments, booked in minutes. Two audiences, one product: <b>renters</b> who want a car, <b>hosts</b> who have one.</p></div></div>"""))

pages.append(pg("02 · The name", "Say it two ways.", f"""
<div class='cols2'><div style='background:#EDF7FF;border-radius:20px;padding:30px'><h3>English</h3><div style='font-size:64px;font-weight:900;letter-spacing:-.04em'>Hire me.</div><p>/ hire · mee /</p></div>
<div style='background:#1484D9;color:#fff;border-radius:20px;padding:30px'><h3 style='color:#CFE8FF'>Twi</h3><div style='font-size:64px;font-weight:900;letter-spacing:-.04em'>Haya mɛ.</div><p style='color:#fff'>/ ha · ya · meh /</p></div></div>
<ul class='lead2' style='margin-top:28px'><li>In running text always write <b>Hayame</b>: capital H, one word, no hyphen, never all caps.</li><li>“Hire me / Haya mɛ” is a play on the name for headlines and captions only. It is the car speaking.</li><li>Dictionary form, for the profile bio: <b>hay·a·me</b> (noun).</li><li><b>Confirm before posting:</b> have a Twi speaker check “Haya mɛ”, its meaning and the pronunciation guide.</li></ul>"""))

pages.append(pg("03 · Logo", "One mark, three colourways.", f"""
<div class='logos'><div style='background:#fff;border:1px solid #dbe5f0'><img src='{LB}'><small>Primary · white and light surfaces</small></div>
<div style='background:#1484D9'><img src='{LW}'><small style='color:#fff'>Reversed · brand blue</small></div>
<div style='background:#0A2B54'><img src='{LW}'><small style='color:#fff'>Reversed · navy and photos</small></div></div>
<div class='cols2'><div><h3>Rules</h3><ul><li>Clear space on every side equals the height of the “H”.</li><li>Minimum height 40 px on screen. 56 px on a 1080 px post.</li><li>Top-left on social posts, 96 px from the left and top edges.</li><li>On photos, always sit it on a dark gradient, never on a bright or busy area.</li></ul></div>
<div><h3>Never</h3><ul><li>Stretch, rotate, outline, shadow or animate the letterforms.</li><li>Recolour outside blue, white or navy.</li><li>Put it in a box, badge or sticker.</li><li>Type the name in another font as a substitute for the logo.</li></ul></div></div>"""))

pages.append(pg("04 · Colour", "Blue does the talking.", f"""
<div class='sws'>
{sw('Hayame Blue','#1484D9','Primary. Buttons, links, accent on light',True,' · dark UI #4DB3FF')}
{sw('Navy','#0A2B54','Headlines on light, dark surfaces',True,' · dark UI text #EAF4FF')}
{sw('Sky','#7CCBFF','Accent word on dark and photo backgrounds')}
{sw('Mist','#EDF7FF','Light backgrounds, tinted cards',False,' · dark UI #123452')}
{sw('Page','#F7FAFF','App page background',False,' · dark UI #071A2F')}
{sw('Muted text','#737D91','Secondary text on light',True,' · dark UI #A8B4C8')}</div>
<div class='chips'><div style='background:#1CA160'>Success #1CA160</div><div style='background:#ED8F30'>Warning #ED8F30</div><div style='background:#E04040'>Danger #E04040</div><div style='background:#E5332A'>Signal Red #E5332A · social only</div></div>
<p class='note' style='font-size:15px;margin-top:16px'><b>Proportion:</b> 60% blue, navy and white · 25% photography · 10% Sky and Mist · 5% or less everything else. <b>Gradients</b> run navy to blue (#06182E → #0A2B54 → #0E4C8C) or deep to bright blue (#0E66B8 → #1484D9 → #2E9BEA), always diagonal at about 155–160°. The primary button runs Blue to Navy left to right. <b>Contrast:</b> body text on light is Navy, never Blue. Sky is for large display type on dark only. Status colours carry meaning (paid, pending, error), so never use them for decoration. Signal Red is a one-off poster accent; do not use it in product. <b>Known mismatch:</b> the website still uses #0E86D4 for links and #FAFAFA for its page. Align it to #1484D9 and #F7FAFF when next touched.</p>"""))

pages.append(pg("05 · Typography", "Geist, tight and heavy.", f"""
<div class='type'><div style='font-weight:900;font-size:80px;letter-spacing:-.045em;line-height:1'>Aa Geist Black</div><p>Display. Tracking −4%, leading 100%. Sentence case, ends with a full stop. Highlight one phrase per headline: Sky on dark, Blue on light.</p></div>
<div class='type'><div style='font-weight:500;font-size:44px'>Geist Medium for the supporting line</div></div>
<table><tr><th>Role</th><th>Weight</th><th>Social (1080 × 1440)</th><th>Product</th></tr>
<tr><td>Headline</td><td>Black 900</td><td>88–156 px, max 128 on most posts · 8 words max</td><td>Bold, 22 px titles</td></tr>
<tr><td>Subline</td><td>Medium 500</td><td>34–40 px, 90% opacity</td><td>Medium, 13–15 px</td></tr>
<tr><td>URL / CTA</td><td>Bold 700</td><td>34 px</td><td>Semibold, 16 px buttons</td></tr>
<tr><td>Caption, label</td><td>Semibold 600</td><td>Stamps: Black, +8% tracking, caps</td><td>Semibold, 10–12 px</td></tr></table>
<p class='note' style='font-size:15px;margin-top:14px'>Geist is free from vercel.com/font; files live in scripts/assets/geist. The website loads Geist. The native apps currently use the system rounded face (SF Rounded on iOS). Keep that for in-app UI until Geist is bundled; do not mix the two on one surface. Never use more than two weights in one headline block. Caps are for stamps and tiny labels only.</p>"""))

pages.append(pg("06 · Shape & surface", "Soft corners, quiet shadows.", """
<div class='cols3'><div><h3>Corners</h3><ul><li>Cards and sheets: <b>16 px</b> radius, continuous (squircle) corners.</li><li>Buttons, fields, tiles: 12–14 px.</li><li>Chips, pills, avatars: fully round.</li><li>On posts, cards are 32 px (the 1080 px scale) and the phone frame 72 px.</li></ul></div>
<div><h3>Elevation</h3><ul><li>Light mode: white card, 1 px hairline (black 6%), shadow black 5%, blur 10, y 4.</li><li>Dark mode: card #0E263F, hairline white 10%, shadow black 28%.</li><li>Primary button: blue shadow at 28%, blur 8, y 4.</li><li>One level of lift is enough. Never stack shadows.</li></ul></div>
<div><h3>Space</h3><ul><li>Product uses a 4 px base; common steps 8, 12, 14, 16, 24.</li><li>Posts use 96 px margins, with headline at y 232 and footer row 72 px tall.</li><li>When unsure, add space, not elements.</li><li>Icons: rounded, 2 px line, one weight across a screen.</li></ul></div></div>
<h3 style='margin-top:36px'>Dark mode</h3><p>The app has a full dark theme: page #071A2F, cards #0E263F, raised #132D49, Blue lifts to #4DB3FF and Navy text flips to #EAF4FF. Auth header drops from bright Blue to a muted #0E3A66 so it reads premium, not glaring. Social posts stay on the light and navy set above.</p>"""))

pages.append(pg("07 · Social layout", "A grid you can trust.", f"""
<div class='fmt'><div class='frame'><div class='m'></div><b>1080 × 1440</b><small>3:4 · Instagram and Facebook</small></div>
<ul><li><b>Margins:</b> 96 px on all four sides. No text crosses them; the build script measures every box and fails if one does.</li><li><b>Logo:</b> 56 px tall, top-left at (96, 96). <b>Headline</b> starts at y = 232.</li><li><b>Footer row:</b> 72 px tall, bottom edge 96 px from the bottom. URL left; five social icons right (38 px, 26 px apart: Instagram, Facebook, TikTok, Snapchat, X). White on dark, navy on light.</li><li><b>Store badges</b> (download posts only): identical 216 × 72 px, 20 px apart, in the footer row, URL moves above them. Swap the Google Play stand-in for Google's official badge before publishing.</li><li><b>Photo posts:</b> navy gradient from the top (92% → 62% at 36% → 0 at 64%) so type always sits on dark.</li><li><b>Export</b> PNG, sRGB. Always add alt text.</li></ul></div>
<p class='note'>Social icon set sits here for reference:</p><div style='display:flex;gap:30px;margin-top:8px'>{ICONROW}</div>"""))

pages.append(pg("08 · Photography", "Real cars, real Accra.", """
<p class='lead'>Natural light, a clean car, a street that looks like home. The photo carries the post; the type sits in the sky above it.</p>
<div class='cols2'><div><h3>Do</h3><ul><li>Car in the lower third, sky or buildings above for the headline.</li><li>Crop 3:4. Keep the car's full silhouette.</li><li>Use real listings and real Ghanaian streets.</li><li>Blur number plates, every time.</li><li>Show people sparingly: natural, smiling, hosts and renters.</li><li>Vary the cars across the feed.</li></ul></div>
<div><h3>Don't</h3><ul><li>Stock cars or streets that do not look like Ghana.</li><li>Heavy filters, HDR, or cooling the paint colour.</li><li>Text over bright or busy areas without the gradient.</li><li>Dealership-style hero shots with showroom reflections.</li><li>Any photo showing a price, plate or a person who has not agreed.</li></ul></div></div>"""))

pages.append(pg("09 · Graphic devices", "A small toolkit, used with discipline.", """
<div class='cols3'><div><h3>Highlighted phrase</h3><p>One phrase per headline in Sky (dark) or Blue (light). The second half of the idea, ending in a full stop.</p></div>
<div><h3>Stamp</h3><p>Rotated −7°, 6 px Sky border, 20 px radius, Black caps, +8% tracking, on a 35% navy fill. One per post, only on playful host posts.</p></div>
<div><h3>Phone mock-up</h3><p>Dark bezel, 72 px radius, soft shadow. Only screens without prices: Car Detail (top) and Dashboard.</p></div>
<div><h3>UI cards</h3><p>White 32 px cards that mimic notifications, chats or settings. Make them screenshot-worthy, not busy.</p></div>
<div><h3>Speech bubble</h3><p>For the car talking: “Hire me.” White bubble, Navy Black-weight text, tail pointing to the car.</p></div>
<div><h3>Badges and icons</h3><p>Official store badges, same size. Social icons in the footer row. Nothing else decorates a post.</p></div></div>
<p class='note'>Rule of thumb: a post gets <b>one</b> device at most. If you want two, split it into two posts. Motion (Stories, Reels): ease-out 250–350 ms, fade and rise 12 px, nothing bounces.</p>"""))

pages.append(pg("10 · Example · renter / brand", "Your ride is here.", f"""
<div class='ex'><img src='{img("01-your-ride")}'><div><h3>Why it works</h3><ul>
<li><b>Photo-led.</b> A white car in a calm Accra street. Car in the lower third, buildings above give the headline room.</li>
<li><b>Navy top gradient</b> keeps white type crisp without flattening the photo.</li>
<li><b>Four words, one highlight.</b> “Your ride” in white, “is here.” in Sky.</li>
<li><b>One subline.</b> “Quality cars across Ghana.” Medium, 90% opacity.</li>
<li><b>Fixed frame.</b> Logo top-left, URL bottom-left, icons bottom-right, all on the 96 px margin.</li></ul>
<h3 style='margin-top:18px'>Caption</h3><p>Your ride is here. 🚗 Quality cars, ready across Ghana. Book in minutes at www.hayamegh.com</p><em>#Hayame #CarRentalGhana #RentACarGhana #Accra</em></div></div>"""))

pages.append(pg("11 · Example · host recruitment", "Your car is unemployed.", f"""
<div class='ex'><img src='{img("11-unemployed")}'><div><h3>Why it works</h3><ul>
<li><b>A joke that sells.</b> A parked car as a jobless friend. Relatable, shareable, friendly, never shaming.</li>
<li><b>The stamp</b> “SEEKING WORK” is the single graphic device. It lands on the windscreen where the eye goes.</li>
<li><b>The sub answers the joke.</b> “Give it a job.” is the call to action without sounding like one.</li>
<li><b>Same frame as every post.</b> The system does the branding, so the joke can be loud.</li>
<li><b>Compliance:</b> plate blurred, no income figure, no promise of earnings.</li></ul>
<h3 style='margin-top:18px'>Caption</h3><p>Your car is unemployed 😭 Give it a job. List it on Hayame: www.hayamegh.com</p><em>#Hayame #SideIncome #CarOwnersGhana</em></div></div>"""))

pages.append(pg("12 · Voice & copy", "Short. Plain. Benefit first.", """
<div class='cols2'><div><h3>Write like this</h3><ul><li>Under 8 words in a headline. Full stop at the end.</li><li>Lead with what the person gets, not what we built.</li><li>Renters: speed, clarity, trust. Hosts: control, income, ease.</li><li>Ask for one action per caption: tag, comment, save, tap.</li><li>Emoji sparingly, in captions only (🚗 👀 😭 🌙), never in headlines.</li><li>Web and app: “Book”, “List your car”, “Become a host”.</li></ul></div>
<div><h3>Not like this</h3><ul><li>“Revolutionary”, “seamless”, “world-class”, “ecosystem”.</li><li>Exclamation marks in headlines. Questions only when we want a reply.</li><li>Slang we would not say to a stranger. Cheeky yes, rude no.</li><li>ALL CAPS sentences. Hashtag walls over five tags.</li><li>Putting handles inside the image; they go in the caption.</li></ul></div></div>
<h3 style='margin-top:26px'>Sample headlines</h3><p class='big'>Your ride is here. · Rent from someone down the road. · See it all before you pay. · Own a car? You own a business.</p>"""))

pages.append(pg("13 · Claims & compliance", "Only say what is true today.", """
<div class='cols2'><div><h3>Safe to say</h3><ul><li>Hosts apply with ID and are reviewed before they list.</li><li>New listings are reviewed before going public.</li><li>Checkout runs in the app (Paystack); every booking is recorded.</li><li>Host contact details stay hidden until a booking exists.</li><li>No ad tracking. Analytics are optional.</li></ul></div>
<div><h3>Never say</h3><ul><li>Insurance, “fully covered”, “100% safe”, “bank-grade”. We do not advertise bundled insurance.</li><li>Any price, fee, income or earnings figure, in text or screenshots.</li><li>“Guaranteed” anything.</li><li>Real people, plates or locations without consent.</li></ul></div></div>
<h3 style='margin-top:30px'>Before you post</h3><ul class='lead2'><li>Logo top-left, URL bottom-left, five icons bottom-right.</li><li>One highlighted phrase, one device at most, one idea.</li><li>Nothing crosses the 96 px margin. Plates blurred. No prices.</li><li>Alt text added. Caption has one call to action.</li><li>Run <b>python3 social/build-social-posts.py</b> then <b>build-brand-guide.py</b> to regenerate assets.</li></ul>"""))

css = fonts + """
@page{size:1280px 800px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Geist,sans-serif;color:#0A2B54;-webkit-print-color-adjust:exact}
.pg{width:1280px;height:800px;padding:72px 84px;position:relative;page-break-after:always;overflow:hidden;background:#fff}
.navy{background:linear-gradient(160deg,#06182E,#0A2B54 55%,#0E4C8C);color:#fff}
.cover{display:flex;flex-direction:column;justify-content:space-between}
.cover h1{font-size:104px;font-weight:900;letter-spacing:-.045em;line-height:.95}
.cover p{margin-top:24px;font-size:26px;opacity:.85}.ft{font-weight:700;font-size:22px}
h2{font-size:42px;font-weight:900;letter-spacing:-.04em;margin-bottom:26px}h2 span{color:#1484D9;font-size:26px}
h3{font-size:22px;font-weight:700;color:#1484D9;margin-bottom:10px}
p,li{font-size:20px;line-height:1.45}
.lead{font-size:30px;line-height:1.3;font-weight:500;max-width:1000px;margin-bottom:34px}
.big{font-size:30px;font-weight:700;line-height:1.4}
.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}.cols2{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:30px}
ul{padding-left:22px}li{margin-bottom:10px}.lead2 li{font-size:22px}.lead2[style] li{font-size:18px;margin-bottom:6px}
.logos{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.logos div{height:190px;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}.logos img{height:80px}.logos small{font-size:14px;font-weight:600;color:#0A2B54}
.sws{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.sw{height:150px;border-radius:20px;padding:22px;display:flex;flex-direction:column;border:1px solid #dbe5f0}.sw b{font-size:24px}.sw span{font-size:16px;margin-top:4px;font-weight:500}.sw em{font-style:normal;font-size:14px;margin-top:auto;opacity:.85}
.note{margin-top:26px;font-size:17px;opacity:.8;max-width:1100px}
.type{margin-bottom:22px}.type p{font-size:17px;opacity:.8}
table{border-collapse:collapse;width:100%;margin-top:14px}th,td{text-align:left;padding:13px 14px;border-bottom:1px solid #dbe5f0;font-size:18px}th{color:#1484D9}
.fmt{display:flex;gap:56px}.frame{flex:none;width:330px;height:440px;border-radius:14px;background:#EDF7FF;border:2px solid #1484D9;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center}.frame .m{position:absolute;inset:24px;border:2px dashed #7CCBFF;border-radius:8px}.frame b{font-size:30px;font-weight:900;z-index:1}.frame small{z-index:1;font-size:15px}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:30px 40px}.card{display:flex;gap:22px}.card img{width:204px;height:272px;border-radius:14px;flex:none;box-shadow:0 8px 24px rgba(10,43,84,.18)}.card b{font-size:21px;display:block}.card small{display:block;color:#1484D9;font-weight:600;font-size:15px;margin:6px 0 12px}.card p{font-size:15px;line-height:1.4}.card em{display:block;margin-top:10px;font-size:13px;font-style:normal;color:#1484D9}
"""
css += """
.eyebrow{font-size:16px;font-weight:700;color:#1484D9;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
.pn{position:absolute;left:84px;bottom:28px;font-size:12px;opacity:.5}
.chips{display:flex;gap:14px;margin-top:16px}.chips div{color:#fff;font-size:15px;font-weight:700;border-radius:999px;padding:9px 18px}
.ex{display:flex;gap:44px}.ex>img{width:390px;height:520px;border-radius:16px;box-shadow:0 12px 32px rgba(10,43,84,.22);flex:none}.ex li{font-size:17px;margin-bottom:8px}.ex p{font-size:17px}.ex em{display:block;margin-top:8px;font-size:14px;font-style:normal;color:#1484D9}
"""
html = f"<!doctype html><html><head><meta charset='utf-8'><style>{css}</style></head><body>{''.join(pages)}</body></html>"
hp = os.path.join(build, "g.html"); open(hp, "w").write(html)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--allow-file-access-from-files",
    f"--user-data-dir={build}/prof", "--no-pdf-header-footer", f"--print-to-pdf={OUT}", f"file://{hp}"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
print("wrote", OUT)
