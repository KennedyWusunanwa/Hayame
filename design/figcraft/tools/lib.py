"""Builder helpers for the Hayame FigCraft design. Sequential node creation over a pipelined socket."""
import socket, json, time, os
import tokens, icons

PORT = 7979
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")

class Client:
    def __init__(self):
        self.s = None; self.id = 0; self.pending = []  # list of (id, label) awaiting replies
    def conn(self):
        if self.s is None:
            self.s = socket.create_connection(("127.0.0.1", PORT), timeout=120)
            self.buf = b""
        return self.s
    def _readline(self):
        s = self.conn()
        while b"\n" not in self.buf:
            c = s.recv(1 << 20)
            if not c: raise ConnectionError("closed")
            self.buf += c
        line, self.buf = self.buf.split(b"\n", 1)
        return json.loads(line.decode(errors="replace"))
    def _send(self, method, params):
        self.id += 1
        self.conn().sendall((json.dumps({"id": self.id, "method": method, "params": params or {}}) + "\n").encode())
        return self.id
    def drain(self):
        while self.pending:
            rid, label = self.pending.pop(0)
            r = self._readline()
            if not r.get("ok"):
                raise RuntimeError(f"{label} -> {r.get('error')}")
    def fire(self, method, params, label="fire"):
        """Send without waiting for the reply (reply checked at the next drain)."""
        if len(self.pending) >= 6: self.drain()
        self.pending.append((self._send(method, params), label))
    def request(self, method, params=None):
        self.drain()
        label = f"{method} {json.dumps(params)[:200]}"
        self._send(method, params)
        r = self._readline()
        if not r.get("ok"):
            raise RuntimeError(f"{label} -> {r.get('error')}")
        return r.get("result")
    def execute(self, command, params=None):
        return self.request("engine.execute", {"command": command, "params": params or {}})
    def fire_cmd(self, command, params=None):
        self.fire("engine.execute", {"command": command, "params": params or {}}, f"{command} {json.dumps(params)[:160]}")

C = Client()
execute = C.execute
request = C.request

# ---------- tokens ----------
VARS = {}      # token name -> VariableID
STYLES = {}    # text style name -> style id

def light(token): return tokens.COLORS[token][0]

def setup_tokens():
    """Create (or reuse) the Hayame variable collection, colour variables and text styles."""
    global VARS, STYLES
    existing = execute("variable.list")
    cols = existing.get("collections", []) if isinstance(existing, dict) else []
    col = next((c for c in cols if c.get("name") == "Hayame"), None)
    if col is None:
        col = execute("variable.createCollection", {"name": "Hayame", "modes": ["Light", "Dark"]})
    cid = col["id"]
    have = {}
    for v in (existing.get("variables", []) if isinstance(existing, dict) else []):
        if v.get("collection") == cid or v.get("collectionId") == cid or True:
            have[v.get("name")] = v.get("id")
    for name, (lt, dk) in tokens.COLORS.items():
        if name in have and have[name]:
            VARS[name] = have[name]
        else:
            VARS[name] = execute("variable.create", {"collection": cid, "name": name, "type": "color", "values": {"Light": lt, "Dark": dk}})["id"]
    doc = request("document.inspect", {"depth": 0})
    have_styles = {s.get("name"): s.get("id") for s in doc.get("styles", []) if isinstance(s, dict)}
    for name, (style, size, lh, ls) in tokens.TEXT.items():
        if name in have_styles:
            STYLES[name] = have_styles[name]
        else:
            STYLES[name] = execute("style.create", {"type": "text", "name": name, "value": {"fontFamily": tokens.FONT, "fontStyle": style, "fontSize": size, "lineHeight": lh, "letterSpacing": ls}})["id"]
    return cid

def bind(nid, field, token):
    C.fire_cmd("variable.bind", {"ids": [nid], "field": field, "variable": VARS[token]})

# ---------- nodes ----------
def create(type_, parent=None, name=None, w=None, h=None, x=None, y=None, text=None, path=None, props=None):
    p = {"type": type_, "select": False}
    if parent is not None: p["parent"] = parent
    if name: p["name"] = name
    if w is not None: p["width"] = w
    if h is not None: p["height"] = h
    if x is not None: p["x"] = x
    if y is not None: p["y"] = y
    if text is not None: p["text"] = text
    if path is not None: p["path"] = path
    if props: p["props"] = props
    return execute("node.create", p)["id"]

def set_props(nid, **props):
    C.fire_cmd("node.set", {"ids": [nid], "props": props})

def frame(parent, name, w=None, h=None, x=None, y=None, fill=None, stroke=None, radius=None, layout=None, gap=None, padding=None,
          main="min", cross="min", sizingH=None, sizingV=None, clip=False, effects=None, opacity=None, **extra):
    props = {"clip": clip}
    if fill is None: props["fill"] = "none"
    elif fill.startswith("#"): props["fill"] = fill
    else: props["fill"] = light(fill)
    if stroke:
        props["stroke"] = light(stroke) if not stroke.startswith("#") else stroke
        props["strokeWeight"] = extra.pop("strokeWeight", 1); props["strokeAlign"] = extra.pop("strokeAlign", "inside")
    if radius is not None: props["cornerRadius"] = radius; props["cornerSmoothing"] = 0.6
    if layout:
        props["layout"] = layout; props["mainAlign"] = main; props["crossAlign"] = cross
        props["gap"] = gap or 0
        if padding is not None: props["padding"] = padding
        props["sizingH"] = sizingH or ("fixed" if w is not None else "hug")
        props["sizingV"] = sizingV or ("fixed" if h is not None else "hug")
    else:
        if sizingH: props["sizingH"] = sizingH
        if sizingV: props["sizingV"] = sizingV
    if effects: props["effects"] = effects
    if opacity is not None: props["opacity"] = opacity
    props.update(extra)
    nid = create("frame", parent, name, w, h, x, y, props=props)
    if fill and not fill.startswith("#"): bind(nid, "fill", fill)
    if stroke and not stroke.startswith("#"): bind(nid, "stroke", stroke)
    return nid

def col(parent, name, gap=0, padding=0, w=None, h=None, fill=None, radius=None, main="min", cross="min", sizingH=None, sizingV=None, **kw):
    return frame(parent, name, w, h, fill=fill, radius=radius, layout="vertical", gap=gap, padding=padding, main=main, cross=cross, sizingH=sizingH, sizingV=sizingV, **kw)

def row(parent, name, gap=0, padding=0, w=None, h=None, fill=None, radius=None, main="min", cross="center", sizingH=None, sizingV=None, **kw):
    return frame(parent, name, w, h, fill=fill, radius=radius, layout="horizontal", gap=gap, padding=padding, main=main, cross=cross, sizingH=sizingH, sizingV=sizingV, **kw)

def text(parent, chars, style="Body/15", color="text/primary", name=None, w=None, align=None, sizingH=None, maxLines=None, **extra):
    props = {"textStyle": STYLES[style], "fill": light(color) if not color.startswith("#") else color}
    if align: props["textAlign"] = align
    if w is not None: props["textAutoResize"] = "height"
    if sizingH: props["sizingH"] = sizingH; props["textAutoResize"] = "height"
    if maxLines: props["maxLines"] = maxLines; props["textAutoResize"] = "truncate"
    props.update(extra)
    nid = create("text", parent, name or chars[:24], w, None, text=chars, props=props)
    if not color.startswith("#"): bind(nid, "fill", color)
    return nid

def rect(parent, w, h, fill=None, radius=0, name="Rect", stroke=None, sizingH=None, sizingV=None, **extra):
    props = {"fill": (light(fill) if fill and not fill.startswith("#") else (fill or "none")), "cornerRadius": radius}
    if stroke: props["stroke"] = light(stroke) if not stroke.startswith("#") else stroke; props["strokeWeight"] = 1
    if sizingH: props["sizingH"] = sizingH
    if sizingV: props["sizingV"] = sizingV
    props.update(extra)
    nid = create("rectangle", parent, name, w, h, props=props)
    if fill and not fill.startswith("#"): bind(nid, "fill", fill)
    if stroke and not stroke.startswith("#"): bind(nid, "stroke", stroke)
    return nid

def ellipse(parent, d, fill, name="Ellipse", stroke=None, w=None, h=None, **extra):
    props = {"fill": light(fill) if not fill.startswith("#") else fill}
    if stroke: props["stroke"] = light(stroke) if not stroke.startswith("#") else stroke; props["strokeWeight"] = extra.pop("strokeWeight", 1)
    props.update(extra)
    nid = create("ellipse", parent, name, w or d, h or d, props=props)
    if not fill.startswith("#"): bind(nid, "fill", fill)
    if stroke and not stroke.startswith("#"): bind(nid, "stroke", stroke)
    return nid

def icon(parent, name, size=24, color="brand/blue", weight=2, filled=None):
    path = icons.STROKE[name]
    filled = (name in icons.FILLED) if filled is None else filled
    c = light(color) if not color.startswith("#") else color
    if filled:
        props = {"fill": c, "stroke": "none"}
    else:
        props = {"fill": "none", "stroke": c, "strokeWeight": weight, "strokeCap": "round", "strokeJoin": "round"}
    nid = create("vector", parent, f"icon/{name}", size, size, path=path, props=props)
    if not color.startswith("#"): bind(nid, "fill" if filled else "stroke", color)
    return nid

def image(parent, file, w, h, radius=0, name=None, mode="fill", sizingH=None):
    r = execute("image.place", {"path": os.path.join(ASSETS, file), "parent": parent, "width": w, "height": h, "mode": mode})
    nid = r["id"]
    props = {"name": name or f"img/{file}"}
    if radius: props["cornerRadius"] = radius
    if sizingH: props["sizingH"] = sizingH
    set_props(nid, **props)
    return nid

def spacer(parent, w=None, h=None, fill_h=False, fill_v=False):
    props = {"fill": "none"}
    if fill_h: props["sizingH"] = "fill"
    if fill_v: props["sizingV"] = "fill"
    return create("frame", parent, "Spacer", w or 1, h or 1, props=props)

def gradient(stops, angle="horizontal"):
    if angle == "horizontal": f, t = [0, 0.5], [1, 0.5]
    elif angle == "vertical": f, t = [0.5, 0], [0.5, 1]
    else: f, t = [0, 0], [1, 1]
    return [{"type": "linearGradient", "stops": stops, "from": f, "to": t}]

def shadow(color="#0000000D", y=4, blur=16, spread=0):
    return {"type": "dropShadow", "color": color, "offset": [0, y], "radius": blur, "spread": spread}

def done():
    C.drain()

def render(path, ids, scale=2):
    done()
    return request("ui.render", {"path": path, "ids": ids, "scale": scale})

def node(nid, depth=1):
    done()
    return request("node.get", {"id": nid, "depth": depth})

def find(tree, name):
    if tree.get("name") == name: return tree
    for ch in tree.get("children", []) or []:
        f = find(ch, name)
        if f: return f
    return None

def page(name):
    pages = execute("page.list")
    p = next((p for p in pages if p["name"] == name), None)
    if p is None: p = {"id": execute("page.add", {"name": name})["id"]}
    execute("page.select", {"id": p["id"]})
    return p["id"]

def delete_named_top(name):
    """Delete top-level layers of the current page with this name (for idempotent rebuilds)."""
    done()
    doc = request("document.inspect", {"depth": 2})
    cur = doc.get("currentPage")
    for pg in doc.get("pages", []):
        if pg.get("id") == cur:
            ids = [n["id"] for n in pg.get("children", []) if n.get("name") == name]
            if ids: execute("edit.delete", {"ids": ids})
