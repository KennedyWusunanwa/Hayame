# Hayame iOS — FigCraft design

`Hayame iOS.figcraft` is the app UI rebuilt in FigCraft (Foundations, Components, Screens pages) with a
clickable prototype: intro motion, tab-bar glide, card-to-detail, the 4-step booking flow, a calendar
sheet overlay, payment-processing spinner states and Light/Dark colour modes.

## Open and connect
1. `tools/figcraft-connect.sh` launches FigCraft with its control channel on 127.0.0.1:7979.
2. Open `Hayame iOS.figcraft` in that window (File ▸ Open).
3. Claude Code attaches with `figcraft-cli mcp --attach 7979` (see the repo root `.mcp.json`, or
   `claude mcp add figcraft-app -- ~/.local/bin/figcraft-cli mcp --attach 7979`).

## Rebuild from source
The `tools/` scripts regenerate everything through the control channel (plain newline-delimited JSON on
the port; no CLI needed): `build_foundations.py` → `build_components.py` → `screens_a.py` → `screens_b.py`
→ `build_proto.py`. Colour and type tokens come from `HayameIOS/Theme/DesignSystem.swift` via `tools/tokens.py`.
