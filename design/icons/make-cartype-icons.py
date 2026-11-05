#!/usr/bin/env python3
"""Generate the single-colour car-type icons used by the Home category pills.

Writes SVG imagesets into HayameIOS/HayameIOS/Assets.xcassets/CarTypes and
vector drawables into android-native/app/src/main/res/drawable (ic_cartype_*).
Side views share one body builder: a clockwise outline over the roof, then a
bottom edge with two wheel arches, tyres as separate circles, and windows cut
out with the even-odd fill rule. Run from the repo root.
"""
import json
import math
import os


def rounded_path(points, r=0.9, arcs=()):
    n = len(points)
    arc_vertices = set()
    for i in arcs:
        arc_vertices.add(i)
        arc_vertices.add((i + 1) % n)

    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    def dist(a, b):
        return math.hypot(b[0] - a[0], b[1] - a[1])

    d = []
    for i in range(n):
        p_prev, p, p_next = points[i - 1], points[i], points[(i + 1) % n]
        if i in arc_vertices or r <= 0:
            d.append(("L", p, p, p))
        else:
            rr = min(r, dist(p_prev, p) / 2.2, dist(p, p_next) / 2.2)
            a = lerp(p, p_prev, rr / dist(p_prev, p))
            b = lerp(p, p_next, rr / dist(p, p_next))
            d.append(("Q", a, p, b))
    out = [f"M{d[0][3][0]:.2f} {d[0][3][1]:.2f}"]
    for i in range(1, n + 1):
        kind, a, p, b = d[i % n]
        prev_idx = (i - 1) % n
        if prev_idx in arcs:
            radius = abs(points[(prev_idx + 1) % n][0] - points[prev_idx][0]) / 2
            out.append(f"A{radius:.2f} {radius:.2f} 0 0 0 {a[0]:.2f} {a[1]:.2f}")
        else:
            out.append(f"L{a[0]:.2f} {a[1]:.2f}")
        if kind == "Q":
            out.append(f"Q{p[0]:.2f} {p[1]:.2f} {b[0]:.2f} {b[1]:.2f}")
    out.append("Z")
    return "".join(out)


def polygon(points, r=0.35):
    return rounded_path(points, r)


def circle(cx, cy, r):
    return f"M{cx-r:.2f} {cy:.2f}A{r:.2f} {r:.2f} 0 1 0 {cx+r:.2f} {cy:.2f}A{r:.2f} {r:.2f} 0 1 0 {cx-r:.2f} {cy:.2f}Z"


WELL = 2.7
TYRE = 1.9


def side_body(top_points, wheel_x=(7, 17), bottom_y=17.0, r=0.9):
    rx, lx = max(wheel_x), min(wheel_x)
    pts = list(top_points)
    pts += [(rx + WELL, bottom_y), (rx - WELL, bottom_y), (lx + WELL, bottom_y), (lx - WELL, bottom_y)]
    n = len(pts)
    body = rounded_path(pts, r, {n - 4, n - 2})
    return body + circle(rx, bottom_y, TYRE) + circle(lx, bottom_y, TYRE)


SEDAN_TOP = [(2, 13.2), (3.2, 12), (7, 11.5), (9.6, 8.5), (15, 8.5), (18.6, 11.5), (21.4, 12.6), (22, 13.6), (22, 16), (20.6, 17)]

icons = {
    "sedan": side_body(SEDAN_TOP) + polygon([(10.2, 9.4), (14.6, 9.4), (16.9, 11.6), (8, 11.6)]),
    "hatchback": side_body([(3, 13.2), (4, 12), (8, 11.5), (10.2, 8.5), (16.5, 8.5), (18.2, 9.2), (19.6, 12), (21, 12.6), (21, 16), (19.6, 17)])
    + polygon([(10.8, 9.4), (16, 9.4), (17.8, 11.6), (8.8, 11.6)]),
    "suv": side_body([(2, 11.5), (3, 10.5), (6, 10), (8, 6.6), (18, 6.6), (20, 10), (22, 11), (22, 16), (20.6, 17)])
    + polygon([(8.8, 7.5), (12.6, 7.5), (12.6, 10), (6.8, 10)]) + polygon([(13.6, 7.5), (17.4, 7.5), (19.2, 10), (13.6, 10)]),
    "crossover": side_body([(2, 12.4), (3, 11.4), (6.5, 11), (9, 7.6), (16.5, 7.6), (19.6, 11), (22, 11.8), (22, 16), (20.6, 17)])
    + polygon([(9.8, 8.5), (16, 8.5), (18.3, 11), (7.8, 11)]),
    "convertible": side_body([(2, 13.2), (3.2, 12.2), (8.6, 12.2), (8.6, 11.8), (9.6, 8.4), (11.3, 8.4), (10.6, 11.8), (21, 12.2), (22, 13.2), (22, 16), (20.6, 17)])
    + polygon([(13.6, 10.6), (15.6, 10.6), (15.6, 12.2), (13.6, 12.2)]),
    "coupe": side_body([(2, 13.2), (3, 12.2), (6.4, 11.6), (9.4, 8.4), (13.6, 8.4), (20.4, 11.8), (22, 12.8), (22, 16), (20.6, 17)])
    + polygon([(10.2, 9.3), (13.4, 9.3), (18, 11.6), (8.2, 11.6)]),
    "pickup": side_body([(2, 12), (3, 11), (5, 10.8), (7, 7), (11.6, 7), (12.6, 10.8), (22, 10.8), (22, 16), (20.6, 17)])
    + polygon([(7.7, 7.9), (11, 7.9), (11.7, 10.8), (6.2, 10.8)]) + polygon([(13.4, 11.7), (21.2, 11.7), (21.2, 12.5), (13.4, 12.5)], r=0.2),
    "truck": side_body([(2, 11), (3, 10), (4.6, 9.8), (6, 6.6), (9.6, 6.6), (9.6, 5), (22, 5), (22, 16), (20.6, 17)])
    + polygon([(6.6, 7.5), (9, 7.5), (9, 9.8), (5.4, 9.8)]) + polygon([(10.4, 5.9), (21.1, 5.9), (21.1, 6.6), (10.4, 6.6)], r=0.2),
    "van": side_body([(2, 9), (3, 7), (5.6, 6), (20, 6), (22, 7.6), (22, 16), (20.6, 17)])
    + polygon([(3.6, 7.4), (8, 7.4), (8, 10.8), (3.1, 10.8)]) + polygon([(9.6, 7.4), (14.2, 7.4), (14.2, 10.8), (9.6, 10.8)]),
    "minivan": side_body([(2, 11), (3, 9.4), (6, 7), (18, 7), (21, 9), (22, 11), (22, 16), (20.6, 17)])
    + polygon([(6.8, 7.9), (12, 7.9), (12, 11), (4.2, 11)]) + polygon([(13, 7.9), (17.6, 7.9), (19.8, 11), (13, 11)]),
    "electric": side_body(SEDAN_TOP) + polygon([(13.0, 8.9), (10.1, 12.7), (11.9, 12.7), (11.0, 15.6), (13.9, 11.7), (12.2, 11.7)], r=0.1),
    "luxury": side_body([(1, 13.2), (2.2, 12), (6.4, 11.6), (9, 8.8), (16, 8.8), (19.6, 11.6), (22, 12.4), (23, 13.4), (23, 16), (21.6, 17)])
    + polygon([(9.7, 9.6), (12.2, 9.6), (12.2, 11.6), (8, 11.6)]) + polygon([(13.1, 9.6), (15.6, 9.6), (17.9, 11.6), (13.1, 11.6)])
    + polygon([(3, 13.5), (21, 13.5), (21, 14.1), (3, 14.1)], r=0.2),
    # "All": a car seen from the front.
    "all": polygon([(3, 15), (3, 10), (5, 6), (19, 6), (21, 10), (21, 15), (19.6, 16), (4.4, 16)], r=0.9)
    + polygon([(6.2, 7.3), (17.8, 7.3), (19.2, 10), (4.8, 10)]) + circle(6.6, 12.8, 1.4) + circle(17.4, 12.8, 1.4)
    + polygon([(3, 16), (7, 16), (7, 18), (3, 18)], r=0.4) + polygon([(17, 16), (21, 16), (21, 18), (17, 18)], r=0.4),
}


def main():
    ios_root = "HayameIOS/HayameIOS/Assets.xcassets/CarTypes"
    android_root = "android-native/app/src/main/res/drawable"
    os.makedirs(ios_root, exist_ok=True)
    with open(os.path.join(ios_root, "Contents.json"), "w") as f:
        json.dump({"info": {"author": "xcode", "version": 1}, "properties": {"provides-namespace": False}}, f, indent=2)
    for slug, d in icons.items():
        imageset = os.path.join(ios_root, f"cartype-{slug}.imageset")
        os.makedirs(imageset, exist_ok=True)
        with open(os.path.join(imageset, f"cartype-{slug}.svg"), "w") as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="{d}"/></svg>\n')
        with open(os.path.join(imageset, "Contents.json"), "w") as f:
            json.dump({
                "images": [{"filename": f"cartype-{slug}.svg", "idiom": "universal"}],
                "info": {"author": "xcode", "version": 1},
                "properties": {"preserves-vector-representation": True, "template-rendering-intent": "template"},
            }, f, indent=2)
        with open(os.path.join(android_root, f"ic_cartype_{slug}.xml"), "w") as f:
            f.write(
                '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
                '    android:width="24dp"\n    android:height="24dp"\n'
                '    android:viewportWidth="24"\n    android:viewportHeight="24">\n'
                f'    <path\n        android:fillColor="#FF000000"\n        android:fillType="evenOdd"\n        android:pathData="{d}" />\n</vector>\n'
            )
    print("wrote", len(icons), "icons")


if __name__ == "__main__":
    main()
