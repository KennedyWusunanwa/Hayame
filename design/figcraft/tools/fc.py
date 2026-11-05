"""Tiny client for the FigCraft control channel (newline-delimited JSON on 127.0.0.1:7979)."""
import socket, json, sys, time

PORT = 7979
_sock = None
_id = 0

def _conn():
    global _sock
    if _sock is None:
        _sock = socket.create_connection(("127.0.0.1", PORT), timeout=120)
    return _sock

def request(method, params=None):
    global _id, _sock
    _id += 1
    req = {"id": _id, "method": method, "params": params or {}}
    for attempt in range(2):
        try:
            s = _conn()
            s.sendall((json.dumps(req) + "\n").encode())
            buf = b""
            while not buf.endswith(b"\n"):
                c = s.recv(1 << 22)
                if not c:
                    raise ConnectionError("closed")
                buf += c
            r = json.loads(buf.decode(errors="replace"))
            if not r.get("ok"):
                raise RuntimeError(f"{method} {json.dumps(params)[:300]} -> {r.get('error')}")
            return r.get("result")
        except (ConnectionError, OSError, socket.timeout):
            _sock = None
            if attempt == 1:
                raise
            time.sleep(0.3)

def execute(command, params=None):
    return request("engine.execute", {"command": command, "params": params or {}})

def batch(commands, label="Batch"):
    """commands: list of {"command","params","as"?}. Returns list of step results."""
    return execute("command.batch", {"label": label, "commands": commands})

def step(command, params=None, as_=None):
    d = {"command": command, "params": params or {}}
    if as_:
        d["as"] = as_
    return d

def ref(name, field=None):
    d = {"$ref": name}
    if field:
        d["field"] = field
    return d

def screenshot(path):
    return request("ui.screenshot", {"path": path})

def render(path, ids=None, scale=1):
    p = {"path": path, "scale": scale}
    if ids:
        p["ids"] = ids
    return request("ui.render", p)

def inspect(depth=1):
    return request("document.inspect", {"depth": depth})

def node(id, depth=1):
    return request("node.get", {"id": id, "depth": depth})

if __name__ == "__main__":
    print(json.dumps(execute(sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}))[:2000])
