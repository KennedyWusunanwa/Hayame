#!/usr/bin/env python3
"""Hayame 'tag' post: logo inside an outlined arrow-tag over the Accra aerial. Usage: python3 social/build-tag-post.py
Renders one post to social/posts/49-accra-tag.png (does not touch the other posts)."""
import importlib.util, os, re, shutil, subprocess, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("sp", os.path.join(HERE, "build-social-posts.py"))
sp = importlib.util.module_from_spec(spec); spec.loader.exec_module(sp)
W, H, M = sp.W, sp.H, sp.M

build = tempfile.mkdtemp(prefix="hayame-tag-")
logo = Image.open(sp.LOGO).convert("RGBA")
sp.tint(logo, (255, 255, 255), os.path.join(build, "w.png"))
dst = os.path.join(build, "aerial.jpg")
subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "92", "-Z", "2000", sp.AERIAL, "--out", dst],
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
a = {}
for n in ["instagram", "facebook", "tiktok", "snapchat", "x"]:
    svg = re.sub(r"<title>.*?</title>", "", open(f"{sp.ICONS}/{n}.svg").read())
    a["icon_" + n] = svg.replace("<svg ", "<svg aria-label='" + n + "' ", 1)

# Tag outline: 888 wide (margin to margin), 330 tall, point on the right.
TW, TH, PT, SW = W - 2 * M, 330, 110, 9
TY = 560
pts = f"{SW/2},{SW/2} {TW-PT},{SW/2} {TW-SW/2},{TH/2} {TW-PT},{TH-SW/2} {SW/2},{TH-SW/2}"
body = f"""<div class='p'><img class='photo' src='file://{dst}' style='object-position:30% 50%'>
<div class='abs' style='inset:0;background:linear-gradient(180deg,rgba(6,24,46,.55) 0%,rgba(6,24,46,.18) 40%,rgba(6,24,46,.30) 70%,rgba(6,24,46,.88) 100%)'></div>
<svg class='abs' style='left:{M}px;top:{TY}px' width='{TW}' height='{TH}' viewBox='0 0 {TW} {TH}'>
<polygon points='{pts}' fill='rgba(6,24,46,.12)' stroke='#fff' stroke-width='{SW}' stroke-linejoin='miter'/></svg>
<div class='abs' style='left:{M}px;top:{TY}px;width:{TW-PT}px;height:{TH}px;display:flex;align-items:center;justify-content:center'>
<img src='file://{build}/w.png' style='width:480px;height:auto'></div>
{sp.foot(a)}</div>"""
html = f"<!doctype html><html><head><meta charset='utf-8'><style>{sp.font_face()}{sp.CSS}</style></head><body>{body}</body></html>"
hp = os.path.join(build, "t.html"); open(hp, "w").write(html)
out = os.path.join(sp.OUT, "49-accra-tag.png")
sp.run_chrome([f"--screenshot={out}", f"file://{hp}"], build)
im = Image.open(out).convert("RGB")
if im.size != (W, H): im = im.resize((W, H), Image.LANCZOS)
im.save(out); shutil.rmtree(build, ignore_errors=True); print("wrote", out)
