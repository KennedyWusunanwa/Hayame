#!/usr/bin/env python3
"""Hayame social posts: 46 minimal posts at 1080x1440 (Instagram/Facebook 3:4).

Posts 01-10 = renter/brand, 11-20 = host recruitment, 21-40 = how-to, features, prospects, security, 41-46 = brand name + what Hayame is. No prices on any post.
Grid (px): margin 96 on all sides - logo 56 tall at (96,96) - content starts y=232 -
footer row 72 tall, bottom edge at 1344 - store badges are identical 216x72 boxes.
After rendering, every text box is measured and the build fails if any text crosses
the margins.

Usage: python3 social/build-social-posts.py
Requires Pillow, Google Chrome and macOS `sips`. Output: social/posts/*.png
"""
import base64, json, os, re, shutil, signal, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "scripts/assets/geist")
PHOTOS = os.path.join(ROOT, "App Screenshots")
SHOTS = os.path.join(ROOT, "screenshots/ios-mobile/light")
LOGO = os.path.join(ROOT, "HayameIOS/HayameIOS/Assets.xcassets/Logo.imageset/logo.png")
APPLE = os.path.join(ROOT, "public/badges/download-on-the-app-store.svg")
OUT = os.path.join(ROOT, "social/posts")
ICONS = os.path.join(ROOT, "social/assets/icons")
FIAT = os.path.join(ROOT, "social/assets/photos/fiat-fullback.jpg")
GLE = os.path.join(ROOT, "public/Mercedes-Benz GLE 2026.png")
AERIAL = os.path.join(ROOT, "public/hero.png")
APPICON = os.path.join(ROOT, "public/apple-touch-icon.png")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W, H, M = 1080, 1440, 96
URL = "www.hayamegh.com"

CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:{W}px;height:{H}px;font-family:'Geist',sans-serif;-webkit-font-smoothing:antialiased}}
.p{{position:relative;width:{W}px;height:{H}px;overflow:hidden;color:#fff;background:#0A2B54}}
.blue{{background:linear-gradient(155deg,#0E66B8 0%,#1484D9 55%,#2E9BEA 100%)}}
.navy{{background:linear-gradient(160deg,#06182E 0%,#0A2B54 55%,#0E4C8C 100%)}}
.light{{background:#EDF7FF;color:#0A2B54}}
.white{{background:#fff;color:#0A2B54}}
.abs{{position:absolute}}
.logo{{position:absolute;left:{M}px;top:{M}px;height:56px;width:auto}}
.body{{position:absolute;left:{M}px;right:{M}px;top:232px}}
.h{{font-weight:900;letter-spacing:-.04em;line-height:1.0}}
.t{{white-space:nowrap}}
.ac{{color:#7CCBFF}}.acb{{color:#1484D9}}.nv{{color:#0A2B54}}
.sub{{font-weight:500;font-size:38px;line-height:1.3;letter-spacing:-.01em;opacity:.9}}
.foot{{position:absolute;left:{M}px;right:{M}px;bottom:{M}px;height:72px;display:flex;align-items:center;justify-content:space-between}}
.soc{{display:flex;gap:26px;align-items:center;opacity:.92}}.soc svg{{width:38px;height:38px;fill:currentColor;display:block}}
.urlab{{position:absolute;left:{M}px;bottom:{M+72+30}px}}
.wrap{{position:absolute;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000 72%,transparent 100%)}}
.card{{background:#fff;color:#0A2B54;border-radius:32px;box-shadow:0 18px 50px rgba(6,24,46,.18)}}
.url{{font-weight:700;font-size:34px;letter-spacing:-.01em;line-height:1}}
.badges{{display:flex;gap:20px}}
.badge{{width:216px;height:72px;flex:none;display:block}}
.gp{{background:#000;border:1.5px solid #A6A6A6;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:12px;color:#fff;white-space:nowrap}}
.gp small{{display:block;font-size:11px;font-weight:500;letter-spacing:.07em;line-height:1;text-transform:uppercase}}
.gp b{{display:block;font-size:24px;font-weight:600;letter-spacing:-.02em;line-height:1;margin-top:4px}}
.photo{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.phone{{position:absolute;background:#0a0c10;padding:11px;border-radius:72px;box-shadow:0 36px 80px rgba(0,0,0,.38)}}
.phone img{{display:block;width:100%;border-radius:61px}}
.dot{{position:absolute;border-radius:50%}}
"""


def font_face():
    out = ""
    for name, w in [("Regular", 400), ("Medium", 500), ("SemiBold", 600), ("Bold", 700), ("Black", 900)]:
        uri = "data:font/woff2;base64," + base64.b64encode(open(f"{FONTS}/Geist-{name}.woff2", "rb").read()).decode()
        out += f"@font-face{{font-family:'Geist';font-weight:{w};src:url({uri}) format('woff2');}}\n"
    return out


GP_ICON = ("<svg width='30' height='34' viewBox='0 0 24 27' xmlns='http://www.w3.org/2000/svg'>"
           "<path d='M0 1.4v24.2c0 .6.3 1 .8 1.3L14.4 13.5.8.1C.3.4 0 .8 0 1.4z' fill='#00C3FF'/>"
           "<path d='M19 18.1l-4.6-4.6L19 8.9l5.3 3c1.5.8 1.5 2.2 0 3z' fill='#FFCE00' transform='scale(.9) translate(.2 .3)'/>"
           "<path d='M19 18.1l-4.6-4.6L.8 27c.5.2 1.1.2 1.8-.2z' fill='#FF3A44' transform='translate(0 -.4)'/>"
           "<path d='M19 8.9L2.6.3C1.9 0 1.3 0 .8.1l13.6 13.4z' fill='#00F076'/></svg>")


def badges(a):
    return (f"<div class='badges'><img class='badge' src='{a['apple']}'>"
            f"<div class='badge gp'>{GP_ICON}<div><small>Get it on</small><b>Google Play</b></div></div></div>")


def socials(a):
    return "<div class='soc'>" + "".join(a["icon_" + n] for n in ["instagram", "facebook", "tiktok", "snapchat", "x"]) + "</div>"


def foot(a, with_badges=False, dark=True):
    col = "color:#fff" if dark else "color:#0A2B54"
    if with_badges:
        return (f"<div class='urlab url' style='{col}'>{URL}</div>"
                f"<div class='foot' style='{col}'>{badges(a)}{socials(a)}</div>")
    return f"<div class='foot' style='{col}'><div class='url'>{URL}</div>{socials(a)}</div>"


def posts(a):
    LB, LW = a["logo"], a["logow"]
    top = "linear-gradient(180deg,rgba(6,24,46,.9) 0%,rgba(6,24,46,.6) 34%,rgba(6,24,46,0) 62%)"
    bot = "linear-gradient(0deg,rgba(6,24,46,.9) 0%,rgba(6,24,46,0) 100%)"
    BOT = f"<div class='abs' style='left:0;right:0;bottom:0;height:340px;background:{bot}'></div>"
    P = []

    def phone(img, t, h, w=520):
        return (f"<div class='wrap' style='right:{M}px;top:{t}px;width:{w}px;height:{h}px'>"
                f"<div class='phone' style='width:{w}px;left:0;top:0'><img src='{img}'></div></div>")

    # ---- 01-10: renter / brand ----
    P.append(f"""<div class='p'><img class='photo' src='{a['3018']}' style='object-position:50% 100%'>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Your ride<br><span class='ac'>is here.</span></div>
<div class='sub' style='margin-top:36px'>Quality cars across Ghana.</div></div>{foot(a)}</div>""")

    P.append(f"""<div class='p blue'>
<div class='dot' style='width:880px;height:880px;right:-360px;bottom:-280px;background:rgba(255,255,255,.07)'></div>
<div class='dot' style='width:500px;height:500px;right:-100px;bottom:-40px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Rent from<br>someone<br><span class='nv'>down the<br>road.</span></div>
<div class='sub' style='margin-top:44px'>Ghana's car-sharing marketplace.</div></div>{foot(a)}</div>""")

    rows = "".join(
        f"<div style='display:flex;justify-content:space-between;align-items:center;border-top:3px solid rgba(10,43,84,.14);height:188px'>"
        f"<span class='h t' style='font-size:108px;{'color:#1484D9' if i == 0 else ''}'>{c}</span>"
        f"<span style='font-size:72px;font-weight:300;color:#1484D9;line-height:1'>→</span></div>"
        for i, c in enumerate(["Accra", "Kumasi", "Takoradi", "Tamale"]))
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:76px;margin-bottom:56px'>Where to<br>this weekend?</div>{rows}</div>
{foot(a, dark=False)}</div>""")

    P.append(f"""<div class='p navy'>
<div class='dot' style='width:1000px;height:1000px;left:200px;top:560px;background:radial-gradient(circle,rgba(20,132,217,.5),rgba(20,132,217,0) 68%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Book in<br><span class='ac'>minutes.</span></div>
<div class='sub' style='margin-top:36px'>Browse, pick dates, pay.</div></div>
{phone(a['s_book'], 640, 580)}{foot(a, True)}</div>""")

    P.append(f"""<div class='p'><img class='photo' src='{a['2078']}' style='object-position:50% 100%'>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:112px'>Your car.<br><span class='ac'>Your income.</span></div>
<div class='sub' style='margin-top:36px'>List it on Hayame. Start earning.</div></div>{foot(a)}</div>""")

    # 06 (no price): see everything first
    def li(t):
        return (f"<div style='display:flex;gap:28px;align-items:center;height:170px;border-top:3px solid rgba(10,43,84,.12)'>"
                f"<div style='flex:none;width:64px;height:64px;border-radius:50%;background:#1484D9;display:flex;align-items:center;justify-content:center'>"
                f"<svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg></div>"
                f"<div class='h t' style='font-size:54px;letter-spacing:-.025em'>{t}</div></div>")
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:112px'>See it all<br><span class='acb'>before you pay.</span></div>
<div style='margin-top:84px'>{li('Photos and specs')}{li('Dates and pickup')}{li('Every charge, upfront')}</div></div>
{foot(a, dark=False)}</div>""")

    def strip(k, label, t):
        return (f"<div class='abs' style='left:{M}px;right:{M}px;top:{t}px;height:228px;border-radius:28px;overflow:hidden'>"
                f"<img class='photo' src='{a[k]}' style='object-position:50% {a.get('pos_'+k, 86)}%'>"
                f"<div class='abs' style='inset:0;background:linear-gradient(90deg,rgba(6,24,46,.72),rgba(6,24,46,0) 62%)'></div>"
                f"<div class='abs h t' style='left:36px;bottom:30px;font-size:52px;color:#fff'>{label}</div></div>")
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:88px'>A car for<br><span class='acb'>every plan.</span></div></div>
{strip('0715','Daily runs',456)}{strip('2078','Weekends',702)}{strip('3136','Adventures',948)}
{foot(a, dark=False)}</div>""")

    def row(t, s_):
        return (f"<div style='display:flex;gap:32px;align-items:center;height:176px'>"
                f"<div style='flex:none;width:84px;height:84px;border-radius:50%;background:#1484D9;display:flex;align-items:center;justify-content:center'>"
                f"<svg width='44' height='44' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg></div>"
                f"<div><div class='h t' style='font-size:56px;letter-spacing:-.03em'>{t}</div>"
                f"<div style='font-size:32px;opacity:.75;margin-top:8px;font-weight:500'>{s_}</div></div></div>")
    P.append(f"""<div class='p navy'><img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:112px'>Drive with<br><span class='ac'>confidence.</span></div>
<div style='margin-top:64px'>{row('Verified hosts','Real people, checked.')}{row('Secure payments','Pay safely in the app.')}{row('Chat in-app','Ask before you book.')}</div></div>
{foot(a, True)}</div>""")

    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'>
<div class='h t' style='font-size:156px;color:#E5332A;letter-spacing:-.05em'>Road</div>
<div class='h t' style='font-size:156px;color:#1484D9;letter-spacing:-.05em'>Trip</div>
<div class='h t' style='font-size:156px;color:#0A2B54;letter-spacing:-.05em'>Saturday</div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:792px;height:420px;border-radius:32px;overflow:hidden'>
<img class='photo' src='{a['2902']}' style='object-position:50% 88%'></div>
{foot(a, dark=False)}</div>""")

    P.append(f"""<div class='p blue'>
<div class='dot' style='width:1000px;height:1000px;right:-460px;top:-260px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Get the<br><span class='nv'>app.</span></div>
<div class='sub' style='margin-top:36px'>One tap to your next ride.</div></div>
{phone(a['s_dash'], 640, 580)}{foot(a, True)}</div>""")

    # ---- 11-20: host recruitment ----
    # 11 unemployed
    P.append(f"""<div class='p'><img class='photo' src='{a['fiat']}' style='object-position:50% 70%'>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:124px'>Your car is<br><span class='ac'>unemployed.</span></div>
<div class='sub' style='margin-top:36px'>Give it a job.</div></div>
<div class='abs' style='right:{M}px;top:640px;transform:rotate(-7deg);border:6px solid #7CCBFF;color:#7CCBFF;border-radius:20px;padding:16px 28px;font-weight:900;font-size:40px;letter-spacing:.08em;background:rgba(6,24,46,.35)'>SEEKING WORK</div>
{foot(a)}</div>""")

    # 12 finger down
    fingers = "".join(
        f"<div style='width:74px;height:{200 if d else 400}px;border-radius:37px;background:{'rgba(255,255,255,.28)' if d else '#fff'};margin-top:{200 if d else 0}px'></div>"
        for d in [0, 0, 1, 0, 1, 0, 0, 1, 0, 1])
    P.append(f"""<div class='p blue'>
<div class='dot' style='width:900px;height:900px;left:-300px;bottom:-420px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:112px'>Put a finger<br>down if…</div>
<div class='h t nv' style='font-size:76px;margin-top:40px;letter-spacing:-.035em'>your car is parked<br>right now.</div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:800px;height:420px;display:flex;justify-content:space-between;align-items:flex-start'>{fingers}</div>
{foot(a)}</div>""")
    # fingers are 450 tall box; sub line
    # 13 week
    days = [("Mon", 0), ("Tue", 0), ("Wed", 0), ("Thu", 0), ("Fri", 0), ("Sat", 1), ("Sun", 1)]
    wk = "".join(
        f"<div style='display:flex;align-items:center;gap:24px;height:88px;margin-bottom:12px'>"
        f"<div style='width:96px;font-weight:700;font-size:34px;opacity:.7'>{d}</div>"
        f"<div style='flex:1;height:88px;border-radius:44px;display:flex;align-items:center;padding:0 36px;font-weight:700;font-size:34px;"
        f"{'background:#1484D9;color:#fff;justify-content:space-between' if on else 'background:#DCE8F5;color:rgba(10,43,84,.55)'}'>"
        f"{'<span>Booked on Hayame</span><svg width=\"34\" height=\"34\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"3.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12.5l4.5 4.5L19 7.5\"/></svg>' if on else 'Parked'}</div></div>"
        for d, on in days)
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:96px'>Your car's week.<br><span class='acb'>Give it a job.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:500px'>{wk}</div>{foot(a, dark=False)}</div>""")

    # 14 notification
    def notif(t, b, op=1, w=888):
        return (f"<div class='card' style='display:flex;gap:28px;padding:30px;align-items:center;margin-bottom:24px;opacity:{op}'>"
                f"<img src='{a['appicon']}' style='width:96px;height:96px;border-radius:24px;flex:none'>"
                f"<div><div style='display:flex;justify-content:space-between;font-size:26px;font-weight:600;opacity:.55'><span>HAYAME</span><span>now</span></div>"
                f"<div style='font-weight:800;font-size:38px;letter-spacing:-.02em;margin-top:6px;line-height:1.15'>{t}</div>"
                f"<div style='font-size:30px;font-weight:500;opacity:.7;margin-top:4px;line-height:1.25'>{b}</div></div></div>")
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:1100px;height:1100px;left:-100px;top:420px;background:radial-gradient(circle,rgba(20,132,217,.45),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Wake up<br><span class='ac'>to this.</span></div>
<div style='margin-top:84px'>{notif('Booking confirmed','Your car is booked for the weekend.')}
{notif('New message','Kwesi: Is it free this Friday?',.92)}
{notif('Trip completed','Thanks for hosting. Your earnings are on the way.',.8)}</div></div>{foot(a)}</div>""")

    # 15 POV asleep
    P.append(f"""<div class='p'><img class='photo' src='{a['2520']}' style='object-position:50% 100%'>
<div class='abs' style='inset:0;background:rgba(6,18,40,.55)'></div>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='body'><div class='sub' style='font-weight:700;letter-spacing:.12em;font-size:30px;text-transform:uppercase;opacity:.8'>POV</div>
<div class='h t' style='font-size:116px;margin-top:18px'>You're asleep.<br><span class='ac'>Your car is<br>at work.</span></div></div>
<div class='abs' style='right:{M}px;top:84px;font-size:84px;line-height:1'>🌙</div>{foot(a)}</div>""")

    # 16 own a car = business
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:136px'>Own a car?</div>
<div class='h t acb' style='font-size:88px;margin-top:10px'>You own a business.</div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:640px;height:570px;border-radius:36px;overflow:hidden'>
<img class='photo' src='{a['2851']}' style='object-position:50% 88%'>
<div class='abs' style='left:28px;top:28px;background:#fff;color:#0A2B54;border-radius:40px;padding:16px 30px 16px 26px;display:flex;align-items:center;gap:14px;font-weight:700;font-size:30px'>
<span style='width:18px;height:18px;border-radius:50%;background:#1CA160;display:block'></span>Open for bookings</div></div>
{foot(a, dark=False)}</div>""")

    # 17 tag a friend
    def cm(initials, who, text, shade):
        return (f"<div class='card' style='display:flex;gap:26px;padding:30px;margin-bottom:22px;align-items:flex-start'>"
                f"<div style='flex:none;width:84px;height:84px;border-radius:50%;background:{shade};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:32px'>{initials}</div>"
                f"<div><div style='font-weight:700;font-size:28px;opacity:.6'>{who}</div>"
                f"<div style='font-size:38px;font-weight:600;line-height:1.22;margin-top:6px;letter-spacing:-.01em'>{text}</div></div></div>")
    P.append(f"""<div class='p blue'>
<div class='dot' style='width:880px;height:880px;right:-360px;top:-300px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Tag that<br><span class='nv'>friend.</span></div>
<div class='sub' style='margin-top:30px'>You know the one.</div>
<div style='margin-top:56px'>{cm('KA','kwesi_a','That car hasn\'t moved since March 😭','#0A2B54')}
{cm('AM','abena.m','Hosts get booked, you know 👀','#0E66B8')}
{cm('YO','yaw_o','Tagging myself. Ok, listing it today.','#0A2B54')}</div></div>{foot(a)}</div>""")

    # 18 three steps
    def step(n, t, sub):
        return (f"<div style='display:flex;gap:36px;align-items:center;height:210px;border-top:3px solid rgba(255,255,255,.14)'>"
                f"<div class='h' style='font-size:96px;color:#7CCBFF;width:130px;flex:none'>{n}</div>"
                f"<div><div class='h t' style='font-size:58px;letter-spacing:-.03em'>{t}</div><div style='font-size:32px;opacity:.7;font-weight:500;margin-top:6px'>{sub}</div></div></div>")
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:900px;height:900px;right:-420px;bottom:-200px;background:radial-gradient(circle,rgba(20,132,217,.4),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:116px'>List it in<br><span class='ac'>3 steps.</span></div>
<div style='margin-top:64px'>{step('01','Snap photos','Show your car at its best.')}{step('02','Pick your dates','Open only when it suits you.')}{step('03','Get booked','Then hand over the keys.')}</div></div>
{foot(a, True)}</div>""")

    # 19 side hustle compare
    def li2(t, ok):
        ic = ("<svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg>" if ok else
              "<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='#0A2B54' stroke-width='3.4' stroke-linecap='round'><path d='M6 6l12 12M18 6L6 18'/></svg>")
        return (f"<div style='display:flex;gap:18px;align-items:center;height:104px'>"
                f"<div style='flex:none;width:52px;height:52px;border-radius:50%;background:{'rgba(255,255,255,.25)' if ok else 'rgba(10,43,84,.1)'};display:flex;align-items:center;justify-content:center'>{ic}</div>"
                f"<div class='t' style='font-size:34px;font-weight:700;letter-spacing:-.01em;{'' if ok else 'opacity:.6'}'>{t}</div></div>")
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:104px'>Side hustle,<br><span class='acb'>minus the hustle.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:560px;display:flex;gap:20px;height:600px'>
<div style='flex:1;border-radius:36px;background:#EDF3FA;padding:36px 28px 28px;color:#0A2B54'>
<div style='font-weight:800;font-size:28px;letter-spacing:.06em;opacity:.5;margin-bottom:20px'>OTHER HUSTLES</div>
{li2('Early mornings',0)}{li2('A boss',0)}{li2('Fixed hours',0)}{li2('Doing it all',0)}</div>
<div style='flex:1;border-radius:36px;background:linear-gradient(160deg,#1484D9,#0E66B8);padding:36px 28px 28px;color:#fff'>
<div style='font-weight:800;font-size:28px;letter-spacing:.06em;opacity:.8;margin-bottom:20px'>HAYAME</div>
{li2('Your car',1)}{li2('Your dates',1)}{li2('Your rules',1)}{li2('Just park it',1)}</div></div>
{foot(a, dark=False)}</div>""")

    # 20 control toggles
    def tg(label, on):
        return (f"<div style='display:flex;justify-content:space-between;align-items:center;height:132px;border-top:3px solid rgba(10,43,84,.08)'>"
                f"<div class='t' style='font-size:44px;font-weight:700;letter-spacing:-.02em'>{label}</div>"
                f"<div style='flex:none;width:120px;height:68px;border-radius:34px;background:{'#1484D9' if on else '#D3DEEA'};position:relative'>"
                f"<div style='position:absolute;top:6px;{'right' if on else 'left'}:6px;width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 3px 8px rgba(0,0,0,.2)'></div></div></div>")
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:116px'>You're in<br><span class='acb'>control.</span></div>
<div class='sub nv' style='margin-top:30px;opacity:.75'>Your car. Your rules.</div></div>
<div class='card abs' style='left:{M}px;right:{M}px;top:620px;padding:6px 44px'>
{tg('Open this weekend', 1).replace('border-top:3px solid rgba(10,43,84,.08)','')}{tg('Instant Book', 1)}{tg('Block my dates', 0)}{tg('Pause my listing', 0)}</div>
{foot(a, dark=False)}</div>""")
    return P


def posts2(a):
    """21-40: how-to, hidden features, prospects, cutting the middleman, security."""
    LB, LW = a["logo"], a["logow"]
    top = "linear-gradient(180deg,rgba(6,24,46,.92) 0%,rgba(6,24,46,.62) 36%,rgba(6,24,46,0) 64%)"
    bot = "linear-gradient(0deg,rgba(6,24,46,.9) 0%,rgba(6,24,46,0) 100%)"
    BOT = f"<div class='abs' style='left:0;right:0;bottom:0;height:340px;background:{bot}'></div>"
    CHECK = lambda c="#fff", z=44: (f"<svg width='{z}' height='{z}' viewBox='0 0 24 24' fill='none' stroke='{c}' stroke-width='3.2' "
                                    "stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg>")
    P = []

    def numrow(n, t, sub, h, dark, ts=54):
        col = "#7CCBFF" if dark else "#1484D9"
        line = "rgba(255,255,255,.16)" if dark else "rgba(10,43,84,.12)"
        subh = f"<div style='font-size:30px;opacity:.7;font-weight:500;margin-top:6px'>{sub}</div>" if sub else ""
        return (f"<div style='display:flex;gap:30px;align-items:center;height:{h}px;border-top:3px solid {line}'>"
                f"<div class='h' style='font-size:84px;color:{col};width:112px;flex:none'>{n}</div>"
                f"<div><div class='h t' style='font-size:{ts}px;letter-spacing:-.03em'>{t}</div>{subh}</div></div>")

    # 21 sign up in 5 steps
    rows = "".join(numrow(f"0{i+1}", t, "", 138, False, 46) for i, t in enumerate([
        "Download Hayame", "Tap Sign up", "Add your name, email and city", "Create a password", "Verify your email, then log in"]))
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:108px'>Sign up in<br><span class='acb'>5 steps.</span></div>
<div style='margin-top:48px'>{rows}</div></div>{foot(a, dark=False)}</div>""")

    # 22 become a host in 4 steps
    rows = "".join(numrow(n, t, s_, 176, True, 54) for n, t, s_ in [
        ("01", "Tap Become a Host", "In the app, under More."), ("02", "Add your details", "Name, phone and city."),
        ("03", "Upload your ID", "Front and back photos."), ("04", "Get approved", "We review every application.")])
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:900px;height:900px;right:-420px;bottom:-200px;background:radial-gradient(circle,rgba(20,132,217,.4),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:108px'>Become a host<br><span class='ac'>in 4 steps.</span></div>
<div style='margin-top:48px'>{rows}</div></div>{foot(a)}</div>""")

    # 23 download in 3 taps
    def dl(title, steps):
        li = "".join(f"<div style='display:flex;gap:18px;align-items:center;height:112px;border-top:2px solid rgba(10,43,84,.1)'>"
                     f"<div class='h' style='font-size:44px;color:#1484D9;width:34px;flex:none'>{i+1}</div>"
                     f"<div style='font-size:30px;font-weight:700;letter-spacing:-.01em;line-height:1.15'>{t}</div></div>" for i, t in enumerate(steps))
        return (f"<div class='card' style='flex:1;padding:34px 30px 18px'><div class='h t' style='font-size:44px;margin-bottom:22px'>{title}</div>{li}</div>")
    P.append(f"""<div class='p blue'>
<div class='dot' style='width:900px;height:900px;left:-300px;bottom:-440px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:116px'>Download<br><span class='nv'>in 3 taps.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:560px;display:flex;gap:20px'>
{dl('iPhone', ['Open the App Store', 'Search “Hayame”', 'Tap Get'])}{dl('Android', ['Open Google Play', 'Search “Hayame”', 'Tap Install'])}</div>
{foot(a, True)}</div>""")

    # 24 first booking, timeline
    items = [("Browse cars", "Filter by brand, city or type."), ("Pick your dates", "Check availability first."),
             ("Pay in the app", "Checkout is handled in-app."), ("Chat and pick up", "Agree the details with your host.")]
    tl = "".join(
        f"<div style='display:flex;gap:34px;height:176px'><div style='display:flex;flex-direction:column;align-items:center;flex:none'>"
        f"<div style='width:76px;height:76px;border-radius:50%;background:#1484D9;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:36px'>{i+1}</div>"
        f"{'<div style=\"flex:1;width:4px;background:#BFD8EE;margin-top:8px\"></div>' if i < 3 else ''}</div>"
        f"<div style='padding-top:6px'><div class='h t' style='font-size:54px;letter-spacing:-.03em'>{t}</div>"
        f"<div style='font-size:32px;opacity:.65;font-weight:500;margin-top:8px'>{s_}</div></div></div>" for i, (t, s_) in enumerate(items))
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:100px'>Your first booking<br><span class='acb'>in 4 steps.</span></div>
<div style='margin-top:64px'>{tl}</div></div>{foot(a, dark=False)}</div>""")

    # 25 list your car in 5 steps (tiles)
    def tile(n, t, wide=False):
        return (f"<div style='{'width:100%' if wide else 'width:434px'};height:206px;border-radius:30px;background:{'#1484D9' if wide else '#EDF7FF'};color:{'#fff' if wide else '#0A2B54'};padding:26px 30px;display:flex;flex-direction:column;justify-content:space-between'>"
                f"<div class='h' style='font-size:56px;color:{'#fff' if wide else '#1484D9'};opacity:{1 if wide else 1}'>{n}</div>"
                f"<div class='h t' style='font-size:38px;letter-spacing:-.025em;line-height:1.05'>{t}</div></div>")
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:104px'>List your car<br><span class='acb'>in 5 steps.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:520px;display:flex;flex-wrap:wrap;gap:20px'>
{tile('01','Add 5 to 7 photos')}{tile('02','Fill in the details')}{tile('03','Set your dates')}{tile('04','Pick Instant Book')}{tile('05','Submit for review', True)}</div>
{foot(a, dark=False)}</div>""")

    # 26 hidden features (renters)
    def feat(emoji, t, dark):
        line = "rgba(255,255,255,.16)" if dark else "rgba(10,43,84,.12)"
        return (f"<div style='display:flex;gap:30px;align-items:center;height:124px;border-top:3px solid {line}'>"
                f"<div style='font-size:56px;width:84px;flex:none;text-align:center;line-height:1'>{emoji}</div>"
                f"<div class='h t' style='font-size:44px;letter-spacing:-.025em'>{t}</div></div>")
    P.append(f"""<div class='p navy'><img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:116px'>Did you<br><span class='ac'>know?</span></div>
<div class='sub' style='margin-top:30px'>5 things in the app for renters.</div>
<div style='margin-top:40px'>{feat('❤️','Save cars to Favorites',1)}{feat('💬','Chat with hosts before you book',1)}{feat('⚡','Look for the Instant badge',1)}{feat('🏷️','Filter by brand',1)}{feat('🌙','Switch to dark mode',1)}</div></div>
{foot(a)}</div>""")

    # 27 hidden features (hosts)
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:116px'>Host<br><span class='acb'>secrets.</span></div>
<div class='sub nv' style='margin-top:30px;opacity:.7'>5 tools most hosts miss.</div>
<div style='margin-top:40px'>{feat('📅','Close days of the week',0)}{feat('⚡','Turn on Instant Book',0)}{feat('🚚','Offer delivery',0)}{feat('🗓️','Block single dates',0)}{feat('⭐','Collect reviews',0)}</div></div>
{foot(a, dark=False)}</div>""")

    # 28 weekly pills
    pills = "".join(
        f"<div style='width:114px;height:114px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:32px;"
        f"{'background:#fff;color:#0A2B54' if o else 'background:rgba(255,255,255,.16);color:rgba(255,255,255,.55);text-decoration:line-through'}'>{d}</div>"
        for d, o in [("Mon", 0), ("Tue", 0), ("Wed", 0), ("Thu", 0), ("Fri", 0), ("Sat", 1), ("Sun", 1)])
    hz = "".join(f"<div style='padding:18px 34px;border-radius:40px;font-weight:700;font-size:32px;{'background:#0A2B54;color:#fff' if v == 90 else 'background:rgba(255,255,255,.18)'}'>{v} days</div>" for v in [30, 60, 90, 180])
    P.append(f"""<div class='p blue'>
<div class='dot' style='width:900px;height:900px;right:-380px;top:-300px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Only<br>weekends?<br><span class='nv'>Done.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:780px'>
<div style='display:flex;justify-content:space-between'>{pills}</div>
<div style='font-weight:700;font-size:30px;opacity:.85;margin:48px 0 18px'>Repeat for the next</div>
<div style='display:flex;gap:14px'>{hz}</div></div>{foot(a)}</div>""")

    # 29 one car -> fleet
    def col(k, h, label, pos=86):
        return (f"<div style='flex:1;height:{h}px;border-radius:28px;overflow:hidden;position:relative'>"
                f"<img class='photo' src='{a[k]}' style='object-position:{pos}% 80%'>"
                f"<div class='abs' style='inset:0;background:linear-gradient(0deg,rgba(6,24,46,.6),rgba(6,24,46,0) 55%)'></div>"
                f"<div class='abs h t' style='left:22px;bottom:20px;font-size:36px;color:#fff'>{label}</div></div>")
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:104px'>One car today.<br><span class='acb'>A fleet tomorrow.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;bottom:{M + 72 + 36}px;display:flex;gap:20px;align-items:flex-end'>
{col('2851', 300, 'Today')}{col('2078', 460, 'Next')}{col('gle', 620, 'Soon', 60)}</div>{foot(a, dark=False)}</div>""")

    # 30 financial freedom, GLE
    P.append(f"""<div class='p'><img class='photo' src='{a['gle']}' style='object-position:50% 88%'>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:104px'>Financial<br>freedom starts<br><span class='ac'>in your driveway.</span></div></div>{foot(a)}</div>""")

    # 31 liability -> asset
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div style='position:relative;display:inline-block'><div class='h t' style='font-size:140px;opacity:.4'>Liability</div>
<div class='abs' style='left:-12px;right:-12px;top:62px;height:12px;background:#E5332A;border-radius:6px;transform:rotate(-3deg)'></div></div>
<div class='h t acb' style='font-size:176px;margin-top:6px'>Asset.</div>
<div class='sub nv' style='margin-top:34px;opacity:.75'>Same car. Different job.</div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:760px;height:450px;border-radius:36px;overflow:hidden'>
<img class='photo' src='{a['0715']}' style='object-position:50% 88%'></div>{foot(a, dark=False)}</div>""")

    # 32 Accra is moving (aerial)
    P.append(f"""<div class='p'><img class='photo' src='{a['aerial']}' style='object-position:30% 50%'>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:120px'>Accra is<br>moving.<br><span class='ac'>Is your car?</span></div></div>{foot(a)}</div>""")

    # 33 cut the middleman
    def pill(t, kind):
        st = {"x": "background:rgba(255,255,255,.1);color:rgba(255,255,255,.4);text-decoration:line-through;text-decoration-color:#FF6B6B",
              "n": "background:rgba(255,255,255,.14);color:#fff", "b": "background:#1484D9;color:#fff"}[kind]
        return f"<div class='t' style='padding:18px 28px;border-radius:50px;font-weight:800;font-size:{36 if kind == 'b' else 32}px;{st}'>{t}</div>"
    arr = "<div style='color:rgba(255,255,255,.4);font-size:34px;font-weight:300'>→</div>"
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:1000px;height:1000px;left:-200px;top:540px;background:radial-gradient(circle,rgba(20,132,217,.4),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Cut the<br><span class='ac'>middleman.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:700px'>
<div style='font-weight:700;font-size:28px;letter-spacing:.08em;opacity:.55;margin-bottom:20px'>BEFORE</div>
<div style='display:flex;align-items:center;justify-content:space-between'>{pill('Owner','n')}{arr}{pill('Agent','x')}{arr}{pill('Broker','x')}{arr}{pill('Renter','n')}</div>
<div style='font-weight:700;font-size:28px;letter-spacing:.08em;color:#7CCBFF;margin:96px 0 24px'>WITH HAYAME</div>
<div style='display:flex;align-items:center;gap:20px'>{pill('Owner','b')}<div style='flex:1;height:10px;border-radius:5px;background:linear-gradient(90deg,#1484D9,#7CCBFF)'></div>{pill('Renter','b')}</div></div>
{foot(a)}</div>""")

    # 34 rent from owner (photo)
    P.append(f"""<div class='p'><img class='photo' src='{a['2902']}' style='object-position:50% 100%'>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:116px'>Skip the agent.<br><span class='ac'>Meet the owner.</span></div>
<div class='sub' style='margin-top:36px'>Real cars. Real people. Direct.</div></div>{foot(a)}</div>""")

    # 35 you set the terms
    def term(label):
        return (f"<div style='display:flex;justify-content:space-between;align-items:center;height:140px;border-top:3px solid rgba(10,43,84,.1)'>"
                f"<div class='h t' style='font-size:46px;letter-spacing:-.025em'>{label}</div>"
                f"<div class='t' style='background:#1484D9;color:#fff;font-weight:800;font-size:30px;padding:14px 28px;border-radius:40px'>You decide</div></div>")
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:116px'>You set<br><span class='acb'>the terms.</span></div>
<div style='margin-top:56px'>{term('Price per day')}{term('Available dates')}{term('Delivery')}{term('Instant Book')}{term('Who rents')}</div></div>
{foot(a, dark=False)}</div>""".replace("Who rents", "Deposit"))

    # 36 how we keep you safe
    def shield(txt):
        return (f"<div style='display:flex;gap:28px;align-items:center;height:140px;border-top:3px solid rgba(255,255,255,.14)'>"
                f"<svg width='64' height='72' viewBox='0 0 24 27' fill='none' style='flex:none'><path d='M12 1l9 3.4v7.2c0 5.6-3.8 10.4-9 12.4-5.2-2-9-6.800-9-12.400V4.400z' fill='#1484D9'/><path d='M7.800 12.800l3 3 5.600-6' stroke='#fff' stroke-width='2.400' stroke-linecap='round' stroke-linejoin='round'/></svg>"
                f"<div class='h t' style='font-size:42px;letter-spacing:-.025em'>{txt}</div></div>")
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:900px;height:900px;right:-380px;bottom:-240px;background:radial-gradient(circle,rgba(20,132,217,.4),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:108px'>How we keep<br><span class='ac'>you safe.</span></div>
<div style='margin-top:48px'>{shield('Hosts apply with ID')}{shield('Listings reviewed before live')}{shield('Pay inside the app')}{shield('Contacts private until you book')}{shield('Every trip has a record')}</div></div>
{foot(a)}</div>""")

    # 37 your details stay yours
    def priv(t, s_, tog=None):
        t_html = ""
        if tog is not None:
            t_html = (f"<div style='flex:none;width:96px;height:56px;border-radius:28px;background:{'#1484D9' if tog else '#D3DEEA'};position:relative'>"
                      f"<div style='position:absolute;top:5px;{'right' if tog else 'left'}:5px;width:46px;height:46px;border-radius:50%;background:#fff'></div></div>")
        return (f"<div style='display:flex;justify-content:space-between;align-items:center;gap:20px;height:170px;border-top:3px solid rgba(10,43,84,.1)'>"
                f"<div><div class='h t' style='font-size:46px;letter-spacing:-.025em'>{t}</div><div style='font-size:30px;opacity:.65;font-weight:500;margin-top:6px'>{s_}</div></div>{t_html}</div>")
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:108px'>Your details<br><span class='acb'>stay yours.</span></div>
<div style='margin-top:48px'>{priv('No ad tracking','We don’t follow you across apps.')}{priv('Analytics are your call','Switch it off in Profile → Privacy.', 0)}{priv('Contacts stay hidden','Hosts are shown after a booking.')}{priv('Your account is locked to you','Only you can open your profile.')}</div></div>
{foot(a, dark=False)}</div>""")

    # 38 hosts are checked (ID card)
    P.append(f"""<div class='p blue'>
<div class='dot' style='width:900px;height:900px;left:-300px;bottom:-380px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:124px'>Every host<br><span class='nv'>is checked.</span></div>
<div class='sub' style='margin-top:30px'>They apply with ID. We review before they list.</div></div>
<div class='card abs' style='left:{M}px;width:600px;top:790px;height:380px;transform:rotate(-4deg);padding:40px;display:flex;gap:34px'>
<div style='flex:none;width:170px;height:210px;border-radius:20px;background:#DCE8F5;position:relative;overflow:hidden'>
<div style='position:absolute;left:55px;top:44px;width:60px;height:60px;border-radius:50%;background:#9CB8D4'></div>
<div style='position:absolute;left:25px;top:118px;width:120px;height:120px;border-radius:50%;background:#9CB8D4'></div></div>
<div style='flex:1;padding-top:6px'><div style='width:200px;height:20px;border-radius:10px;background:#0A2B54;opacity:.85'></div>
<div style='width:150px;height:16px;border-radius:8px;background:#0A2B54;opacity:.25;margin-top:18px'></div>
<div style='width:210px;height:16px;border-radius:8px;background:#0A2B54;opacity:.25;margin-top:14px'></div>
<div style='width:120px;height:16px;border-radius:8px;background:#0A2B54;opacity:.25;margin-top:14px'></div></div></div>
<div class='abs' style='left:560px;top:1010px;width:210px;height:210px;border-radius:50%;background:#1CA160;border:10px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 20px 50px rgba(0,0,0,.25)'>{CHECK('#fff', 110)}</div>
{foot(a)}</div>""")

    # 39 pay inside the app
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:1100px;height:1100px;left:-10px;top:560px;background:radial-gradient(circle,rgba(20,132,217,.5),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:124px'>Pay inside<br><span class='ac'>the app.</span></div>
<div class='sub' style='margin-top:30px'>Checkout by Paystack. Every booking recorded.</div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:780px;height:420px;display:flex;justify-content:center;align-items:center'>
<div class='dot' style='width:420px;height:420px;background:rgba(20,132,217,.22)'></div>
<div class='dot' style='width:300px;height:300px;background:rgba(20,132,217,.35)'></div>
<div class='dot' style='width:190px;height:190px;background:#1484D9;display:flex;align-items:center;justify-content:center'>
<svg width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='4.500' y='10.500' width='15' height='10.500' rx='2.500' fill='#fff' stroke='none'/><path d='M8 10.500V7.500a4 4 0 0 1 8 0v3'/></svg></div></div>
{foot(a)}</div>""")

    # 40 something wrong
    def stp(t, s_, last=False):
        n = {"Report": 1, "Review": 2, "Resolve": 3}[t]
        return (f"<div style='flex:1;text-align:center'><div style='width:150px;height:150px;border-radius:50%;background:#1484D9;color:#fff;margin:0 auto 22px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:60px'>{n}</div>"
                f"<div class='h t' style='font-size:38px;letter-spacing:-.02em'>{t}</div><div style='font-size:26px;opacity:.65;font-weight:500;margin-top:6px'>{s_}</div></div>")
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:112px'>Something<br>wrong?<br><span class='acb'>We’re here.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:820px;display:flex;gap:8px;align-items:flex-start'>
{stp('Report','Open a dispute')}<div style='font-size:50px;color:#1484D9;margin-top:42px'>→</div>{stp('Review','We check trip records')}<div style='font-size:50px;color:#1484D9;margin-top:42px'>→</div>{stp('Resolve','Next steps agreed')}</div>
<div class='abs sub nv' style='left:{M}px;right:{M}px;top:1150px;font-size:30px;opacity:.7'>Emergency? Call local services first, then message us.</div>
{foot(a, dark=False)}</div>""")
    return P


def posts3(a):
    """41-46: what Hayame is, and the name (Hire me / Haya mɛ)."""
    LB, LW = a["logo"], a["logow"]
    top = "linear-gradient(180deg,rgba(6,24,46,.92) 0%,rgba(6,24,46,.62) 36%,rgba(6,24,46,0) 64%)"
    bot = "linear-gradient(0deg,rgba(6,24,46,.9) 0%,rgba(6,24,46,0) 100%)"
    BOT = f"<div class='abs' style='left:0;right:0;bottom:0;height:340px;background:{bot}'></div>"
    SPK = ("<svg width='56' height='56' viewBox='0 0 24 24' fill='none' stroke='#1484D9' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>"
           "<path d='M4 9.500v5h3.500L12 19V5L7.500 9.500z' fill='#1484D9'/><path d='M15.500 8.500a5 5 0 0 1 0 7M18 6a8.500 8.500 0 0 1 0 12'/></svg>")
    P = []

    # 41 dictionary entry
    P.append(f"""<div class='p white'><img class='logo' src='{LB}'>
<div class='abs' style='left:{M}px;top:232px;width:12px;height:700px;border-radius:6px;background:#1484D9'></div>
<div class='body' style='left:{M + 52}px'>
<div class='h t' style='font-size:136px;letter-spacing:-.045em'>hay·a·me</div>
<div style='display:flex;gap:22px;align-items:center;margin-top:18px'>
<div style='font-size:38px;font-weight:500;opacity:.6'>/ha-ya-me/</div>
<div class='t' style='background:#EDF7FF;color:#1484D9;font-weight:800;font-size:28px;padding:8px 22px;border-radius:30px;font-style:italic'>noun</div></div>
<div style='margin-top:56px;font-size:46px;font-weight:700;line-height:1.22;letter-spacing:-.02em'>
<div style='display:flex;gap:22px;margin-bottom:34px'><span style='color:#1484D9'>1.</span><span>Ghana’s car-sharing marketplace.</span></div>
<div style='display:flex;gap:22px;margin-bottom:34px'><span style='color:#1484D9'>2.</span><span>Where car owners earn and renters drive.</span></div>
<div style='display:flex;gap:22px'><span style='color:#1484D9'>3.</span><span>A neighbour with a car you can borrow.</span></div></div></div>
<div class='abs' style='left:{M + 52}px;top:1130px;font-size:34px;font-weight:600;opacity:.75'>See also: <span style='color:#1484D9;border-bottom:3px solid #1484D9;opacity:1'>hire me</span></div>
{foot(a, dark=False)}</div>""")

    # 42 pronunciation cards
    def pcard(lang, big, phon, light):
        bg = "#fff" if light else "#1484D9"
        fg = "#0A2B54" if light else "#fff"
        sub = "#1484D9" if light else "#CFE8FF"
        spk = SPK if light else SPK.replace("#1484D9", "#fff")
        return (f"<div style='height:290px;border-radius:36px;background:{bg};color:{fg};padding:34px 44px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 18px 50px rgba(0,0,0,.2)'>"
                f"<div><div style='font-weight:800;font-size:26px;letter-spacing:.14em;color:{sub}'>{lang}</div>"
                f"<div class='h t' style='font-size:118px;margin-top:8px;letter-spacing:-.045em'>{big}</div>"
                f"<div style='font-size:34px;font-weight:600;opacity:.65;margin-top:6px'>{phon}</div></div>{spk}</div>")
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:1000px;height:1000px;right:-440px;top:360px;background:radial-gradient(circle,rgba(20,132,217,.45),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:128px'>Say it<br><span class='ac'>your way.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:560px;display:flex;flex-direction:column;gap:28px'>
{pcard('ENGLISH', 'Hire me.', '/ hire · mee /', True)}{pcard('TWI', 'Haya mɛ.', '/ ha · ya · meh /', False)}</div>
<div class='abs sub' style='left:{M}px;top:1230px;font-size:34px'>Two ways. One name.</div>
{foot(a)}</div>""".replace("top:1230px;font-size:34px'>Two ways. One name.</div>\n","top:1196px;font-size:34px'>Two ways. One name.</div>\n"))

    # 43 the CV
    sk = "".join(f"<div style='display:flex;gap:16px;align-items:center;font-size:36px;font-weight:600;margin-top:20px'><span style='width:14px;height:14px;border-radius:50%;background:#1484D9;flex:none'></span>{t}</div>"
                 for t in ["Gets you there", "Looks good doing it", "Always on time", "Free this weekend"])
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:108px'>Your car’s<br><span class='acb'>CV.</span></div></div>
<div class='card abs' style='left:{M}px;right:{M}px;top:560px;height:640px;transform:rotate(-1.5deg);padding:40px 44px'>
<div style='display:flex;gap:34px;align-items:center'>
<div style='flex:none;width:230px;height:230px;border-radius:28px;overflow:hidden;position:relative'><img class='photo' src='{a['0715']}' style='object-position:50% 88%;transform:scale(1.4);transform-origin:40% 90%'></div>
<div><div style='font-size:24px;font-weight:800;letter-spacing:.14em;color:#1484D9'>CURRICULUM VITAE</div>
<div class='h t' style='font-size:62px;margin-top:8px'>Honda Civic</div>
<div style='font-size:32px;font-weight:600;opacity:.6;margin-top:6px'>Seeking: weekend work</div></div></div>
<div style='border-top:3px solid rgba(10,43,84,.1);margin-top:30px;padding-top:6px'>{sk}</div>
<div class='abs t' style='right:36px;bottom:34px;border:8px solid #1484D9;color:#1484D9;border-radius:22px;padding:12px 34px;font-weight:900;font-size:64px;letter-spacing:.04em;transform:rotate(-9deg);background:rgba(255,255,255,.85)'>HIRE ME</div></div>
{foot(a, dark=False)}</div>""")

    # 44 speech bubble
    P.append(f"""<div class='p'><img class='photo' src='{a['3136']}' style='object-position:50% 100%'>
<div class='abs' style='inset:0;background:{top}'></div>{BOT}<img class='logo' src='{LW}'>
<div class='abs' style='left:{M}px;top:228px;background:#fff;border-radius:56px;padding:34px 64px 40px;box-shadow:0 24px 60px rgba(0,0,0,.3)'>
<div class='h t nv' style='font-size:156px;letter-spacing:-.05em'>Hire me.</div>
<div class='abs' style='left:140px;bottom:-34px;width:70px;height:70px;background:#fff;transform:rotate(45deg);border-radius:0 0 14px 0'></div></div>
<div class='abs sub' style='left:{M}px;top:560px;font-size:36px'>Your car, if it could talk.<br><span class='ac' style='font-weight:700'>Or say it in Twi: Haya mɛ.</span></div>
{foot(a)}</div>""")

    # 45 what is hayame (3 steps)
    def flow(n, emoji, t, sub, last=False):
        return (f"<div style='display:flex;gap:34px;height:196px'><div style='display:flex;flex-direction:column;align-items:center;flex:none'>"
                f"<div style='width:104px;height:104px;border-radius:50%;background:#1484D9;display:flex;align-items:center;justify-content:center;font-size:52px'>{emoji}</div>"
                f"{'' if last else '<div style=\"flex:1;width:4px;background:rgba(124,203,255,.4);margin:8px 0\"></div>'}</div>"
                f"<div style='padding-top:10px'><div class='h t' style='font-size:52px;letter-spacing:-.03em'>{t}</div>"
                f"<div style='font-size:32px;opacity:.72;font-weight:500;margin-top:8px'>{sub}</div></div></div>")
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:900px;height:900px;right:-400px;bottom:-200px;background:radial-gradient(circle,rgba(20,132,217,.4),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:124px'>What is<br><span class='ac'>Hayame?</span></div>
<div style='margin-top:60px'>{flow('1','🚗','Owners list their cars','Photos, dates, done.')}{flow('2','🔍','Renters find and book','Browse, pick, pay in the app.')}{flow('3','🤝','Everyone wins','Owners earn. Renters drive.', True)}</div></div>
{foot(a)}</div>""")

    # 46 chat explainer
    def bub(t, me):
        al = "flex-end" if me else "flex-start"
        bg = "#1484D9" if me else "#fff"
        fg = "#fff" if me else "#0A2B54"
        rad = "36px 36px 8px 36px" if me else "36px 36px 36px 8px"
        return (f"<div style='display:flex;justify-content:{al};margin-bottom:18px'><div style='max-width:700px;background:{bg};color:{fg};padding:26px 36px;border-radius:{rad};"
                f"font-size:36px;font-weight:600;line-height:1.22;letter-spacing:-.01em;box-shadow:0 10px 30px rgba(10,43,84,.1)'>{t}</div></div>")
    P.append(f"""<div class='p light'><img class='logo' src='{LB}'>
<div class='body'><div class='h t' style='font-size:100px'>Hayame,<br><span class='acb'>explained.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:480px'>
{bub('So… what’s Hayame?', 0)}{bub('Ghana’s car-sharing marketplace.', 1)}{bub('Who’s it for?', 0)}
{bub('Car owners who want extra income. And anyone who needs a ride.', 1)}{bub('And how do I say it?', 0)}{bub('Hire me. Or Haya mɛ. Both work.', 1)}</div>
{foot(a, dark=False)}</div>""")
    return P


def posts4(a):
    """00: launch poster (celebration: sunburst, confetti, crossing ribbons)."""
    import random
    LW = a["logow"]
    rnd = random.Random(7)
    cols = ["#FFFFFF", "#7CCBFF", "#0A2B54", "#E5332A", "#FFFFFF", "#7CCBFF"]
    conf = ""
    for _ in range(46):
        x, y = rnd.randint(20, 1040), rnd.randint(130, 900)
        if 96 < x < 984 and 230 < y < 700 and rnd.random() < .7:
            continue
        w, h = rnd.choice([(16, 34), (14, 14), (12, 44), (22, 22)])
        rad = "50%" if w == h else "4px"
        conf += (f"<div class='abs' style='left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{rad};"
                 f"background:{rnd.choice(cols)};transform:rotate({rnd.randint(0, 180)}deg);opacity:{rnd.choice([1, 1, .85])}'></div>")
    ribbon_txt = "".join("NOW LIVE <span style='color:#E5332A'>★</span> HAYAME <span style='color:#E5332A'>★</span> GHANA <span style='color:#E5332A'>★</span> " for _ in range(4))
    ribbon2_txt = "".join("RENT A CAR <span style='color:#7CCBFF'>★</span> EARN FROM YOURS <span style='color:#7CCBFF'>★</span> " for _ in range(4))
    return [f"""<div class='p'>
<img class='photo' src='{a['2078']}' style='object-position:50% 100%'>
<div class='abs' style='inset:0;background:linear-gradient(180deg,#0B5CAA 0%,rgba(20,132,217,.92) 34%,rgba(20,132,217,.35) 58%,rgba(20,132,217,0) 72%)'></div>
<div class='abs' style='inset:0;background:repeating-conic-gradient(from 0deg at 50% 36%,rgba(255,255,255,.16) 0 5deg,rgba(255,255,255,0) 5deg 10deg);-webkit-mask-image:radial-gradient(circle at 50% 36%,#000 0,transparent 62%)'></div>
<div class='abs' style='left:0;right:0;bottom:0;height:380px;background:linear-gradient(0deg,rgba(6,24,46,.92) 0%,rgba(6,24,46,0) 100%)'></div>
{conf}
<img class='logo' src='{LW}'>
<div class='abs' style='right:{M}px;top:{M}px;height:56px;display:flex;align-items:center;gap:14px;background:#fff;color:#0A2B54;border-radius:40px;padding:0 28px 0 22px;font-weight:900;font-size:30px;letter-spacing:.1em'>
<span style='width:20px;height:20px;border-radius:50%;background:#E5332A;box-shadow:0 0 0 8px rgba(229,51,42,.25)'></span>LIVE NOW</div>
<div class='abs' style='left:{M}px;top:218px'>
<div class='h t' style='font-size:190px;color:#fff;letter-spacing:-.05em;text-shadow:0 8px 0 #0A2B54'>We’re</div>
<div class='h t' style='font-size:318px;color:#fff;letter-spacing:-.06em;margin:-30px 0 0 24px;line-height:.9;text-shadow:0 12px 0 #0A2B54;transform:rotate(-3deg);transform-origin:left bottom'>LIVE!</div></div>
<div class='abs' data-bleed style='left:-60px;right:-60px;top:770px;height:96px;background:#fff;transform:rotate(-6deg);box-shadow:0 14px 40px rgba(6,24,46,.35);display:flex;align-items:center;overflow:hidden;white-space:nowrap'>
<div class='h' style='font-size:44px;color:#0A2B54;letter-spacing:-.01em;padding-left:30px'>{ribbon_txt}</div></div>
<div class='abs' data-bleed style='left:-60px;right:-60px;top:790px;height:84px;background:#0A2B54;transform:rotate(4deg);box-shadow:0 14px 40px rgba(6,24,46,.35);display:flex;align-items:center;overflow:hidden;white-space:nowrap'>
<div class='h' style='font-size:38px;color:#fff;letter-spacing:-.01em;padding-left:30px'>{ribbon2_txt}</div></div>
{foot(a, True)}</div>"""]


def posts5(a):
    """47-48: teasers before the big unveiling."""
    LW = a["logow"]
    pill = (f"<div class='abs' style='right:{M}px;top:{M}px;height:56px;display:flex;align-items:center;gap:14px;border:3px solid #7CCBFF;color:#7CCBFF;"
            "border-radius:40px;padding:0 28px;font-weight:900;font-size:28px;letter-spacing:.12em'>COMING SOON</div>")
    fold = "repeating-linear-gradient(90deg,#0A2B54 0,#0A2B54 44px,#0E3A70 44px,#0E3A70 88px)"
    P = []
    # 47 curtain reveal
    P.append(f"""<div class='p navy'>
<div class='dot' style='width:1100px;height:1100px;left:-10px;top:300px;background:radial-gradient(circle,rgba(20,132,217,.4),rgba(20,132,217,0) 66%)'></div>
<img class='logo' src='{LW}'>{pill}
<div class='body'><div class='h t' style='font-size:140px'>Watch<br><span class='ac'>this space.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:600px;height:600px;border-radius:36px;overflow:hidden;background:#000;box-shadow:0 30px 80px rgba(0,0,0,.45)'>
<img class='photo' src='{a['gle']}' style='object-position:50% 80%'>
<div class='abs' style='left:0;top:0;bottom:0;width:calc(50% - 46px);background:{fold};box-shadow:20px 0 60px rgba(0,0,0,.6)'></div>
<div class='abs' style='right:0;top:0;bottom:0;width:calc(50% - 46px);background:{fold};box-shadow:-20px 0 60px rgba(0,0,0,.6)'></div>
<div class='abs' style='inset:0;background:linear-gradient(180deg,rgba(6,24,46,.55),rgba(6,24,46,0) 40%,rgba(6,24,46,.35))'></div>
<div class='abs' style='left:0;right:0;top:0;height:46px;background:#06182E;box-shadow:0 10px 30px rgba(0,0,0,.5)'></div></div>
<div class='abs sub' style='left:{M}px;top:1226px;font-size:34px;opacity:.85'>Something big is on the way.</div>
{foot(a)}</div>""".replace("top:1226px;font-size:34px;opacity:.85'>Something big is on the way.</div>","top:1216px;font-size:34px;opacity:.85'>Something big is on the way.</div>"))

    # 48 loading
    corner = lambda pos: f"<div class='abs' style='{pos};width:70px;height:70px;border:6px solid #7CCBFF'></div>"
    P.append(f"""<div class='p blue'>
<div class='dot' style='width:1000px;height:1000px;right:-440px;top:-300px;background:rgba(255,255,255,.07)'></div>
<img class='logo' src='{LW}'>
<div class='body'><div class='h t' style='font-size:150px'>Watch<br><span class='nv'>this space.</span></div></div>
<div class='abs' style='left:{M}px;right:{M}px;top:640px;height:520px;border:4px dashed rgba(255,255,255,.55);border-radius:28px'>
<div class='abs' style='left:-4px;top:-4px;width:70px;height:70px;border-left:8px solid #fff;border-top:8px solid #fff;border-radius:28px 0 0 0'></div>
<div class='abs' style='right:-4px;top:-4px;width:70px;height:70px;border-right:8px solid #fff;border-top:8px solid #fff;border-radius:0 28px 0 0'></div>
<div class='abs' style='left:-4px;bottom:-4px;width:70px;height:70px;border-left:8px solid #fff;border-bottom:8px solid #fff;border-radius:0 0 0 28px'></div>
<div class='abs' style='right:-4px;bottom:-4px;width:70px;height:70px;border-right:8px solid #fff;border-bottom:8px solid #fff;border-radius:0 0 28px 0'></div>
<div class='abs' style='left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px'>
<div class='h' style='font-size:160px;letter-spacing:-.04em;opacity:.95'>?</div>
<div style='width:560px;height:26px;border-radius:13px;background:rgba(10,43,84,.35);overflow:hidden'><div style='width:87%;height:100%;border-radius:13px;background:#fff'></div></div>
<div style='font-weight:700;font-size:32px;letter-spacing:.06em'>LOADING SOMETHING BIG…</div></div></div>
{foot(a)}</div>""")
    return P


def posts6(a):
    """00-first-post: the very first post. Different formula: centred, logo as hero, road to a distant light."""
    LW = a["logow"]
    VX, VY = 540, 800
    road = f"""<svg class='abs' style='left:0;top:0' width='{W}' height='{H}' viewBox='0 0 {W} {H}'>
<defs><linearGradient id='fade' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7CCBFF' stop-opacity='.9'/><stop offset='1' stop-color='#7CCBFF' stop-opacity='.08'/></linearGradient>
<radialGradient id='orb'><stop offset='0' stop-color='#fff'/><stop offset='.25' stop-color='#BFE6FF' stop-opacity='.9'/><stop offset='1' stop-color='#1484D9' stop-opacity='0'/></radialGradient></defs>
<path d='M{VX - 6} {VY} L-420 {H} L-120 {H} Z' fill='rgba(20,132,217,.10)'/><path d='M{VX + 6} {VY} L{W + 420} {H} L{W + 120} {H} Z' fill='rgba(20,132,217,.10)'/>
<line x1='{VX - 6}' y1='{VY}' x2='-300' y2='{H}' stroke='url(#fade)' stroke-width='5'/>
<line x1='{VX + 6}' y1='{VY}' x2='{W + 300}' y2='{H}' stroke='url(#fade)' stroke-width='5'/>
{''.join(f"<line x1='{VX}' y1='{VY + 20 + i * i * 9}' x2='{VX}' y2='{VY + 20 + i * i * 9 + 6 + i * 9}' stroke='#fff' stroke-opacity='{.25 + i * .08:.2f}' stroke-width='{3 + i * 2}'/>" for i in range(1, 6))}
<circle cx='{VX}' cy='{VY}' r='150' fill='url(#orb)'/><circle cx='{VX}' cy='{VY}' r='9' fill='#fff'/></svg>"""
    rings = "".join(f"<div class='dot' style='width:{d}px;height:{d}px;left:{540 - d // 2}px;top:{360 - d // 2}px;border:2px solid rgba(124,203,255,{al})'></div>"
                    for d, al in [(560, .28), (780, .18), (1000, .10)])
    return [f"""<div class='p' style='background:radial-gradient(ellipse at 50% 24%,#0E4C8C 0%,#0A2B54 38%,#040E1E 100%)'>
{rings}{road}
<div class='abs' style='left:0;right:0;top:268px;display:flex;justify-content:center'><img src='{LW}' style='width:500px;height:auto;filter:drop-shadow(0 0 40px rgba(124,203,255,.6))'></div>
<div class='abs' style='left:{M}px;right:{M}px;top:560px;text-align:center'>
<div class='h t' style='font-size:104px'>Watch <span class='ac'>this space.</span></div></div>
<div class='abs' style='left:0;right:0;bottom:{M}px;display:flex;flex-direction:column;align-items:center;gap:34px;color:#fff'>
<div class='sub' style='font-size:34px;font-weight:600'>Follow for the reveal.</div>
<div class='soc' style='gap:34px'>{socials(a).replace("<div class='soc'>", "").rsplit("</div>", 1)[0]}</div>
<div class='url' style='font-size:32px'>{URL}</div></div></div>"""]


MEASURE = """<script>
window.addEventListener('load',()=>{
 const bad=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){ if(!n.textContent.trim())continue; if(n.parentElement.closest('[data-bleed]'))continue; const r=document.createRange();r.selectNodeContents(n);
  for(const b of r.getClientRects()){ if(b.width<1)continue; bad.push([n.textContent.trim().slice(0,24),Math.round(b.left),Math.round(b.right),Math.round(b.top),Math.round(b.bottom)]);}}
 document.body.setAttribute('data-m',JSON.stringify(bad));});
</script>"""


def run_chrome(args, build):
    profile = tempfile.mkdtemp(prefix="chrome-", dir=build)
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
           "--allow-file-access-from-files", "--force-device-scale-factor=1", f"--window-size={W},{H}",
           f"--user-data-dir={profile}", "--no-first-run", "--virtual-time-budget=5000"] + args
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        out = p.communicate(timeout=40)[0]
    except subprocess.TimeoutExpired:
        os.killpg(os.getpgid(p.pid), signal.SIGKILL); out = b""
    return out.decode("utf8", "ignore")


def tint(logo, rgb, path):
    o = Image.new("RGBA", logo.size); o.putdata([rgb + (p[3],) for p in logo.getdata()]); o.save(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".png") and not f.startswith("."):
            os.remove(os.path.join(OUT, f))
    build = tempfile.mkdtemp(prefix="hayame-social-")
    a = {"apple": "file://" + APPLE}
    for stem in ["0715", "2078", "2520", "2851", "2902", "3018", "3136"]:
        src = next(os.path.join(PHOTOS, f) for f in os.listdir(PHOTOS) if f.startswith(f"IMG_{stem}") and not f.startswith("."))
        dst = os.path.join(build, stem + ".jpg")
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "90", "-Z", "1800", src, "--out", dst],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        a[stem] = "file://" + dst
    logo = Image.open(LOGO).convert("RGBA")
    tint(logo, (255, 255, 255), os.path.join(build, "w.png")); tint(logo, (20, 132, 217), os.path.join(build, "b.png"))
    a["logo"], a["logow"] = "file://" + os.path.join(build, "b.png"), "file://" + os.path.join(build, "w.png")
    a["s_book"] = "file://" + os.path.join(SHOTS, "07-car-detail.png")
    a["s_dash"] = "file://" + os.path.join(SHOTS, "18-renter-dashboard.png")
    a["fiat"] = "file://" + FIAT
    a["pos_fiat"] = 66
    for key, srcp in (("gle", GLE), ("aerial", AERIAL)):
        dst = os.path.join(build, key + ".jpg")
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "90", "-Z", "2000", srcp, "--out", dst],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        a[key] = "file://" + dst
    a["appicon"] = "file://" + APPICON
    for n in ["instagram", "facebook", "tiktok", "snapchat", "x"]:
        svg = re.sub(r"<title>.*?</title>", "", open(f"{ICONS}/{n}.svg").read())
        a["icon_" + n] = svg.replace("<svg ", "<svg aria-label='" + n + "' ", 1)
    names = ["01-your-ride", "02-down-the-road", "03-where-to", "04-book-in-minutes", "05-your-income",
             "06-see-it-all", "07-every-plan", "08-confidence", "09-road-trip-saturday", "10-get-the-app",
             "11-unemployed", "12-finger-down", "13-your-cars-week", "14-wake-up-to-this", "15-pov-asleep",
             "16-own-a-business", "17-tag-that-friend", "18-list-in-3-steps", "19-side-hustle", "20-in-control",
             "21-sign-up-5-steps", "22-become-a-host", "23-download-3-taps", "24-first-booking", "25-list-your-car",
             "26-did-you-know", "27-host-secrets", "28-only-weekends", "29-fleet-tomorrow", "30-financial-freedom",
             "31-asset", "32-accra-moving", "33-cut-the-middleman", "34-meet-the-owner", "35-you-set-the-terms",
             "36-how-we-keep-you-safe", "37-details-stay-yours", "38-hosts-checked", "39-pay-in-app", "40-we-are-here",
             "41-what-is-hayame", "42-say-it-your-way", "43-your-cars-cv", "44-hire-me", "45-what-is-hayame-steps", "46-hayame-explained",
             "00-we-are-live",
             "47-watch-this-space", "48-loading", "00-first-post"]
    failed = False
    for name, body in zip(names, posts(a) + posts2(a) + posts3(a) + posts4(a) + posts5(a) + posts6(a)):
        base = f"<!doctype html><html><head><meta charset='utf-8'><style>{font_face()}{CSS}</style></head><body>{body}"
        hp = os.path.join(build, name + ".html"); open(hp, "w").write(base + "</body></html>")
        out = os.path.join(OUT, name + ".png")
        run_chrome([f"--screenshot={out}", f"file://{hp}"], build)
        # measure text boxes
        mp = os.path.join(build, name + "-m.html"); open(mp, "w").write(base + MEASURE + "</body></html>")
        dom = run_chrome(["--dump-dom", f"file://{mp}"], build)
        m = re.search(r"data-m=\"([^\"]*)\"", dom)
        if m:
            import html as _h
            for txt, l, r, t, b in json.loads(_h.unescape(m.group(1))):
                if l < M - 2 or r > W - M + 2 or b > H - M + 2:
                    print(f"  !! {name}: '{txt}' box {l}-{r}, y {t}-{b} breaks the {M}px margin"); failed = True
        im = Image.open(out).convert("RGB")
        if im.size != (W, H):
            im = im.resize((W, H), Image.LANCZOS)
        im.save(out); print("ok", name)
    shutil.rmtree(build, ignore_errors=True)
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
