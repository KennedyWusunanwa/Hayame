#!/bin/zsh
# Launch FigCraft with its loopback control channel so Claude Code (figcraft-cli mcp --attach 7979,
# or the raw JSON client in fc.py) can drive it. -n opens a fresh instance even if one is already running.
PORT="${1:-7979}"
open -n -a FigCraft --args --control "$PORT" "${@:2}"
for i in {1..40}; do lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 && { echo "FigCraft control channel listening on 127.0.0.1:$PORT"; exit 0; }; sleep 0.5; done
echo "FigCraft did not open port $PORT" >&2; exit 1
