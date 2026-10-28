#!/usr/bin/env python3
"""Hayame first post: centred logo + social icons over the Accra skyline. Usage: python3 social/build-first-post.py
Writes social/posts/00-first-post-skyline.png (2160x2880, 2x) and ...@1x.png (1080x1440). Touches no other post."""
import importlib.util, os, re, shutil, tempfile
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("sp", os.path.join(HERE, "build-social-posts.py"))
sp = importlib.util.module_from_spec(spec); spec.loader.exec_module(sp)
W, H, M = sp.W, sp.H, sp.M
SRC = os.path.join(HERE, "assets/photos/accra-skyline-hd.png")

build = tempfile.mkdtemp(prefix="hayame-first-")
# Prepare: crop to 3:4, upscale to the 2x canvas, light sharpen and fine grain.
im = Image.open(SRC).convert("RGB")
# Source is 2:3; crop to 3:4, keeping the sky and the towers (trim from the bottom foliage).
sw, sh = im.size; ch = round(sw * 4 / 3); top = round((sh - ch) * 0.3)
im = im.crop((0, top, sw, top + ch)).resize((W * 2, H * 2), Image.LANCZOS)
im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
arr = np.asarray(im).astype(np.float32)
arr += np.random.default_rng(7).normal(0, 1.6, arr.shape[:2])[..., None]
photo = os.path.join(build, "sky.jpg"); Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(photo, quality=96)
sp.tint(Image.open(sp.LOGO).convert("RGBA"), (255, 255, 255), os.path.join(build, "w.png"))
a = {}
for n in ["instagram", "facebook", "tiktok", "snapchat", "x"]:
    svg = re.sub(r"<title>.*?</title>", "", open(f"{sp.ICONS}/{n}.svg").read())
    a["icon_" + n] = svg.replace("<svg ", "<svg aria-label='" + n + "' ", 1)
icons = sp.socials(a).replace("<div class='soc'>", "").rsplit("</div>", 1)[0]

body = f"""<div class='p'><img class='photo' src='file://{photo}'>
<div class='abs' style='inset:0;background:linear-gradient(180deg,rgba(6,24,46,.42) 0%,rgba(6,24,46,.30) 30%,rgba(6,24,46,.38) 60%,rgba(6,24,46,.90) 100%)'></div>
<div class='abs' style='inset:0;background:radial-gradient(ellipse 70% 30% at 50% 44%,rgba(6,24,46,.50),rgba(6,24,46,0) 100%)'></div>
<div class='abs' style='left:0;right:0;top:0;bottom:200px;display:flex;align-items:center;justify-content:center'>
<img src='file://{build}/w.png' style='width:640px;height:auto;filter:drop-shadow(0 6px 28px rgba(6,24,46,.55))'></div>
<div class='abs' style='left:0;right:0;bottom:{M}px;display:flex;flex-direction:column;align-items:center;gap:34px;color:#fff'>
<div class='soc' style='gap:38px;opacity:1'>{icons}</div>
<div class='url' style='font-size:32px'>{sp.URL}</div></div></div>"""
html = f"<!doctype html><html><head><meta charset='utf-8'><style>{sp.font_face()}{sp.CSS}.soc svg{{width:46px;height:46px}}</style></head><body>{body}</body></html>"
hp = os.path.join(build, "f.html"); open(hp, "w").write(html)
out2 = os.path.join(sp.OUT, "00-first-post-skyline.png")
sp.run_chrome(["--force-device-scale-factor=2", f"--screenshot={out2}", f"file://{hp}"], build)
big = Image.open(out2).convert("RGB")
if big.size != (W * 2, H * 2): big = big.resize((W * 2, H * 2), Image.LANCZOS)
big.save(out2)
big.resize((W, H), Image.LANCZOS).save(os.path.join(sp.OUT, "00-first-post-skyline@1x.png"))
shutil.rmtree(build, ignore_errors=True); print("wrote", out2, big.size)
