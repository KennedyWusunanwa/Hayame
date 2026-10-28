"""Original soundtrack for the how-to videos: calm pad, soft plucked melody, light beat,
plus UI sounds at the exact moments things happen on screen (taps, transitions, success).
Pure numpy; reuses the instrument helpers from social/anticipation/synth.py."""
import importlib.util
import os
import wave

import numpy as np

_spec = importlib.util.spec_from_file_location(
    "base_synth", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "anticipation", "synth.py")
)
B = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(B)
SR = B.SR


def click(bright=1.0):
    """Short UI tap: a tiny sine pop plus a sliver of noise."""
    pop = B.sweep_sine(0.09, 1400 * bright, 500) * B.env_ad(0.09, 0.001, 0.025)
    n = B.bandpass(B.noise(0.03, 17), 2500, 9000) * np.exp(-B.tt(0.03) / 0.006) * 0.5
    pop[: len(n)] += n
    return pop


def swish(dur=0.45, seed=4):
    return B.whoosh(dur, 500, 5500, seed) * 0.5


def render(path, duration, events, bpm=96):
    """events: dict with lists of seconds: transitions, taps, highlights, success, intro, outro_at."""
    N = int((duration + 1.5) * SR)
    music = np.zeros((2, N))
    fx = np.zeros((2, N))
    beat = 60 / bpm

    # ---- chord bed (A minor-ish but warm): Am - F - C - G, two bars each
    chords = [
        [110.0, 164.81, 220.0, 261.63, 329.63],
        [87.31, 130.81, 174.61, 220.0, 261.63],
        [130.81, 164.81, 196.0, 261.63, 329.63],
        [98.0, 146.83, 196.0, 246.94, 293.66],
    ]
    bar = beat * 4
    t = 0.3
    i = 0
    while t < duration - 0.5:
        d = bar * 2 + 0.6
        pad = B.pad(chords[i % 4], d, attack=0.9, release=1.0)
        # gentle slow filter via amplitude breathing
        tb = B.tt(d)
        pad *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.2 * tb + i)
        B.mix_into(music, pad, t, 0.42)
        i += 1
        t += bar * 2

    # ---- plucked melody: pentatonic motif, every other bar, quiet
    motif = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440]
    t = 0.3 + bar
    k = 0
    while t < duration - 2.5:
        if (k // 8) % 2 == 0:  # play one bar, rest one bar
            f = motif[k % len(motif)]
            B.mix_into(music, B.pluck(f, 0.6, 0.6), t, 0.16, -0.2 + 0.4 * ((k % 4) / 3))
        k += 1
        t += beat / 2

    # ---- light beat: soft kick on 1 and 3, shaker on offbeats
    t = 0.3 + bar * 2
    n = 0
    while t < duration - 3.0:
        if n % 2 == 0:
            B.mix_into(music, B.kick(0.5, 0.3, 110, 45), t, 0.45)
        sh = B.bandpass(B.noise(0.07, 100 + n), 5000, 12000) * B.env_ad(0.07, 0.002, 0.02)
        B.mix_into(music, sh, t + beat / 2, 0.08, 0.25 if n % 2 else -0.25)
        n += 1
        t += beat

    # ---- SFX tied to the picture
    for i, t0 in enumerate(events.get("transitions", [])):
        B.mix_into(fx, swish(0.5, 20 + i), max(0, t0 - 0.25), 0.55, -0.3 if i % 2 else 0.3)
    for i, t0 in enumerate(events.get("taps", [])):
        B.mix_into(fx, click(1.0 + 0.1 * (i % 3)), t0, 0.9)
    for t0 in events.get("highlights", []):
        B.mix_into(fx, B.bell(1760, 0.6, 0.12), t0, 0.7)
    for t0 in events.get("success", []):
        for f, g, dly in [(880, 0.3, 0), (1108.73, 0.28, 0.08), (1318.51, 0.26, 0.16), (1760, 0.22, 0.24)]:
            B.mix_into(music, B.bell(f, 2.6, g), t0 + dly, 1.0, (f - 1300) / 2000)
        B.mix_into(fx, B.whoosh(0.6, 700, 9000, 33), t0 - 0.1, 0.3)
    for t0 in events.get("intro", []):
        B.mix_into(fx, B.whoosh(0.8, 300, 6000, 41), t0, 0.35)
        B.mix_into(music, B.bell(1318.51, 2.0, 0.18), t0 + 0.5)
    outro = events.get("outro_at")
    if outro is not None:
        B.mix_into(fx, B.boom(1.2, 90, 40, 1.0), outro, 0.35)
        pad_out = B.pad([110.0, 164.81, 220.0, 277.18, 329.63], duration - outro + 0.5, 0.6, 1.4)
        B.mix_into(music, pad_out, outro, 0.5)

    # ---- duck music slightly under taps so they read clearly
    duck = np.ones(N)
    for t0 in events.get("taps", []):
        i0 = int(t0 * SR)
        L = int(0.25 * SR)
        duck[i0 : i0 + L] *= 1 - 0.3 * np.exp(-np.arange(min(L, N - i0)) / (0.08 * SR))
    music *= duck

    bus = music + fx
    bus = B.reverb(bus, 1.6, 0.22)
    bus = bus[:, : int(duration * SR)]
    n = bus.shape[1]
    bus *= np.minimum(1, np.arange(n) / (0.4 * SR))
    bus *= np.minimum(1, (n - np.arange(n)) / (1.2 * SR))
    bus = np.tanh(bus * 1.05)
    bus /= np.abs(bus).max() / 0.8
    pcm = (bus.T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path
