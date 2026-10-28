"""Original soundtrack for the Hayame teaser. Pure numpy: no samples, no licences.
Timeline matches scene.html (impact 3.5 s, loading 6.7-9.4 s, 'Watch this space' 9.4 s, end card 10.35 s)."""
import wave
import numpy as np

SR = 44100
IMPACT, LOAD_START, LOAD_END, FINAL = 3.5, 6.7, 9.4, 10.35


def mix_into(buf, sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= buf.shape[1]: return
    n = min(len(sig), buf.shape[1] - i0)
    a = (pan + 1) * np.pi / 4
    buf[0, i0:i0 + n] += sig[:n] * gain * np.cos(a)
    buf[1, i0:i0 + n] += sig[:n] * gain * np.sin(a)


def tt(dur): return np.arange(int(dur * SR)) / SR


def noise(dur, seed=0): return np.random.default_rng(seed).standard_normal(int(dur * SR))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    # soften the edges
    k = max(1, int(len(f) * 0.002)); m = np.convolve(m, np.ones(k) / k, mode="same")
    return np.fft.irfft(X * m, len(x))


def sweep_sine(dur, f0, f1, exp=True):
    t = tt(dur); k = t / dur
    f = f0 * (f1 / f0) ** k if exp else f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def env_ad(dur, attack, decay_tau):
    t = tt(dur); a = np.minimum(1, t / max(attack, 1e-4)); return a * np.exp(-np.maximum(0, t - attack) / decay_tau)


def kick(gain=1.0, dur=0.35, f0=130, f1=42):
    s = sweep_sine(dur, f0, f1) * env_ad(dur, 0.002, 0.11)
    click = bandpass(noise(0.01, 3), 1500, 6000) * np.exp(-tt(0.01) / 0.002)
    out = s.copy(); out[:len(click)] += click * 0.25
    return out * gain


def boom(dur=2.2, f0=95, f1=30, gain=1.0):
    return sweep_sine(dur, f0, f1) * env_ad(dur, 0.003, 0.55) * gain


def whoosh(dur, lo, hi, seed=1, peak=0.5):
    t = tt(dur); sh = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** (1.4)
    # glide the band by blending three bands
    n = noise(dur, seed)
    lowb, midb, hib = bandpass(n, lo, lo * 2), bandpass(n, lo * 1.5, hi * 0.7), bandpass(n, hi * 0.5, hi)
    k = t / dur
    return (lowb * (1 - k) + midb * (1 - abs(2 * k - 1)) + hib * k) * sh * 3.0


def pluck(freq, dur=0.5, bright=1.0):
    t = tt(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t / 0.08) * bright + 0.2 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t / 0.05)
    return s * env_ad(dur, 0.003, 0.16)


def bell(freq, dur=2.5, gain=1.0):
    t = tt(dur); out = np.zeros_like(t)
    for ratio, amp, tau in [(1, 1, 0.9), (2.0, 0.45, 0.6), (2.76, 0.3, 0.35), (4.07, 0.18, 0.22), (5.4, 0.1, 0.15)]:
        out += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t / tau)
    return out * env_ad(dur, 0.002, 10) * gain


def pad(freqs, dur, attack=0.8, release=0.9):
    t = tt(dur); out = np.zeros_like(t)
    for i, f in enumerate(freqs):
        for det in (-0.004, 0.0, 0.004):
            out += np.sin(2 * np.pi * f * (1 + det) * t + i)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release)
    return out * e / (len(freqs) * 3)


def reverb(buf, seconds=1.9, mix=0.24):
    n = int(seconds * SR); t = np.arange(n) / SR
    out = np.zeros_like(buf)
    for ch, seed in enumerate((11, 12)):
        ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-t / (seconds / 4.2))
        ir = bandpass(ir, 150, 9000); ir /= np.sqrt((ir ** 2).sum())
        L = len(buf[ch]) + n
        out[ch] = np.fft.irfft(np.fft.rfft(buf[ch], 1 << int(np.ceil(np.log2(L)))) * np.fft.rfft(ir, 1 << int(np.ceil(np.log2(L)))))[:buf.shape[1]]
    return buf * (1 - mix * 0.5) + out * mix


def render(path, duration=12.0):
    N = int((duration + 1.0) * SR)
    drums = np.zeros((2, N)); music = np.zeros((2, N)); fx = np.zeros((2, N))

    # ---- build-up: heartbeat, drone, riser, word whooshes
    for t0 in (0.32, 0.72):
        mix_into(fx, boom(0.5, 70, 38, 1.0), t0, 0.7)
    drone_t = tt(IMPACT + 7.0)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.35 * drone_t)
    drone = (np.sin(2 * np.pi * 55 * drone_t) + 0.5 * np.sin(2 * np.pi * 110.4 * drone_t) + 0.25 * np.sin(2 * np.pi * 164.8 * drone_t + 1)) * lfo
    ramp = np.clip((drone_t - 0.3) / (IMPACT - 0.3), 0, 1) ** 2.0
    after = np.where(drone_t > IMPACT, 0.55 + 0.45 * np.exp(-(drone_t - IMPACT) / 1.2), 1.0)
    tail = np.clip(1 - (drone_t - (LOAD_END + 0.2)) / 0.8, 0, 1)
    mix_into(music, drone * ramp * after * tail * 0.33, 0.0, 1.0)
    riser = (sweep_sine(IMPACT - 1.15 + 0.02, 180, 2600) * 0.5 + sweep_sine(IMPACT - 1.15 + 0.02, 183, 2650) * 0.5) * np.linspace(0, 1, int((IMPACT - 1.15 + 0.02) * SR)) ** 2.2
    rn = bandpass(noise(IMPACT - 1.15 + 0.02, 5), 1500, 9000) * np.linspace(0, 1, len(riser)) ** 3
    mix_into(fx, riser * 0.22 + rn * 0.22, 1.15, 1.0)
    for t0, pan, seed in [(0.95, -0.4, 1), (1.65, 0.4, 2), (2.3, -0.2, 3)]:
        mix_into(fx, whoosh(0.5, 700, 6500, seed), t0, 0.16, pan)

    # ---- IMPACT
    mix_into(fx, boom(2.6, 100, 28, 1.0), IMPACT, 1.0)
    mix_into(fx, bandpass(noise(0.9, 8), 120, 3500) * env_ad(0.9, 0.001, 0.18), IMPACT, 0.65)
    mix_into(fx, bandpass(noise(1.4, 9), 3000, 12000) * env_ad(1.4, 0.001, 0.4), IMPACT, 0.22)
    for f, g in [(1760, 0.2), (2349, 0.12), (3520, 0.08)]:
        mix_into(music, bell(f, 3.0, g), IMPACT + 0.02)
    mix_into(fx, whoosh(0.55, 500, 9000, 4)[::-1].copy(), IMPACT - 0.5, 0.3)

    # ---- groove 4.6 -> 9.4 (120 bpm)
    beat = 0.5
    t = 4.6
    k = 0
    while t < LOAD_END - 0.01:
        mix_into(drums, kick(1.0), t, 0.85)
        mix_into(drums, bandpass(noise(0.06, 20 + k), 6500, 14000) * env_ad(0.06, 0.001, 0.018), t + beat / 2, 0.22, 0.3 if k % 2 else -0.3)
        if k % 2 == 1:
            mix_into(drums, bandpass(noise(0.2, 40 + k), 1200, 7000) * env_ad(0.2, 0.002, 0.06), t, 0.2)  # clap-ish on the 2 and 4
        k += 1; t += beat
    # bass + arpeggio (A minor feel)
    notes = [220, 261.63, 329.63, 261.63, 220, 293.66, 349.23, 293.66]
    t = 4.85; i = 0
    while t < LOAD_END - 0.05:
        f = notes[i % len(notes)]
        bright = 0.6 + 0.4 * min(1, (t - 4.85) / 4.0)
        mix_into(music, pluck(f * 2, 0.42, bright), t, 0.2 * (0.6 + 0.4 * bright), -0.25 + 0.5 * ((i % 4) / 3))
        i += 1; t += beat / 2
    t = 4.6
    for root in [55, 55, 65.41, 49] * 4:
        if t >= LOAD_END - 0.2: break
        d = 1.0; tb = tt(d)
        mix_into(music, (np.sin(2 * np.pi * root * tb) + 0.3 * np.sin(2 * np.pi * root * 2 * tb)) * env_ad(d, 0.01, 0.55), t, 0.28)
        t += 1.0

    # ---- copy hits
    for t0 in (4.95, 5.45):
        pop = sweep_sine(0.18, 900, 260) * env_ad(0.18, 0.001, 0.05)
        click = bandpass(noise(0.1, int(t0 * 10)), 2500, 9000) * env_ad(0.1, 0.001, 0.02) * 0.4
        pop[:len(click)] += click
        mix_into(fx, pop, t0, 0.3, -0.15 if t0 < 5 else 0.15)
        mix_into(fx, whoosh(0.35, 800, 7000, int(t0 * 3)), t0 - 0.12, 0.12)
    for t0, f in [(6.0, 880), (6.2, 1108.73), (6.4, 1318.51)]:
        mix_into(music, bell(f, 1.2, 0.18), t0, 1.0, (f - 1100) / 1200)

    # ---- loading ticks + riser
    t = LOAD_START + 0.3; n = 0
    while t < LOAD_END - 0.22:
        prog = (t - LOAD_START - 0.3) / (LOAD_END - 0.25 - LOAD_START - 0.3)
        prog = min(1.0, max(0.0, prog))
        f = 1100 * (1 + 1.4 * prog)
        tick = sweep_sine(0.05, f, f * 0.8) * env_ad(0.05, 0.001, 0.014)
        tick_click = bandpass(noise(0.02, n), 3000, 10000) * np.exp(-tt(0.02) / 0.004) * 0.5
        tick[:len(tick_click)] += tick_click
        mix_into(fx, tick * 0.35, t, 1.0, ((n % 2) - 0.5) * 0.3)
        t += max(0.045, 0.2 - 0.16 * prog ** 0.8); n += 1
    ur = LOAD_END - 8.4
    up = (sweep_sine(ur, 300, 3400) + 0.6 * sweep_sine(ur, 603, 6700)) * np.linspace(0, 1, int(ur * SR)) ** 2.0
    mix_into(fx, up * 0.16 + bandpass(noise(ur, 6), 2500, 11000) * np.linspace(0, 1, int(ur * SR)) ** 3 * 0.2, 8.4, 1.0)

    # ---- 100%: hit + chime chord + 'space.' slam
    mix_into(fx, boom(2.0, 90, 30, 1.0), LOAD_END, 0.95)
    mix_into(fx, bandpass(noise(0.8, 31), 150, 4500) * env_ad(0.8, 0.001, 0.2), LOAD_END, 0.5)
    for f, g in [(880, 0.3), (1108.73, 0.25), (1318.51, 0.24), (1760, 0.2), (2637, 0.12)]:
        mix_into(music, bell(f, 3.2, g), LOAD_END + 0.01, 1.0, (f - 1500) / 2500)
    mix_into(fx, boom(0.9, 130, 45, 1.0), LOAD_END + 0.3, 0.55)
    mix_into(fx, whoosh(0.5, 600, 8000, 7), LOAD_END - 0.05, 0.22)

    # ---- end card: pad + sparkle + icon ticks
    pd = pad([110, 164.81, 220, 277.18, 329.63, 554.37], 2.6, 0.7, 1.2)
    mix_into(music, pd, FINAL - 0.1, 0.5)
    for t0, f in [(10.45, 2637), (10.62, 3136), (10.85, 3520), (11.2, 2349)]:
        mix_into(music, bell(f, 1.6, 0.1), t0, 1.0, np.sin(t0 * 7))
    for i in range(5):
        mix_into(fx, bell(1568 + i * 140, 0.5, 0.1), FINAL + 1.15 + i * 0.07, 1.0, (i - 2) * 0.25)
    mix_into(fx, whoosh(0.5, 700, 9000, 12), FINAL - 0.05, 0.18)
    mix_into(fx, boom(1.4, 85, 36, 1.0), FINAL + 0.25, 0.5)

    # ---- sidechain duck music under kicks, then bus
    duck = np.ones(N)
    t = 4.6
    while t < LOAD_END - 0.01:
        i0 = int(t * SR); L = int(0.18 * SR)
        duck[i0:i0 + L] *= 1 - 0.45 * np.exp(-np.arange(min(L, N - i0)) / (0.07 * SR)); t += beat
    music *= duck
    bus = drums * 1.0 + music * 1.0 + fx * 1.0
    bus = reverb(bus, 1.9, 0.26)
    bus = bus[:, :int(duration * SR)]
    n = bus.shape[1]
    bus *= np.minimum(1, np.arange(n) / (0.12 * SR))
    bus *= np.minimum(1, (n - np.arange(n)) / (0.6 * SR))
    # gentle saturation, then normalise to -1.2 dBFS
    bus = np.tanh(bus * 1.15)
    bus /= np.abs(bus).max() / 0.87
    pcm = (bus.T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    return path


if __name__ == "__main__":
    import sys
    render(sys.argv[1] if len(sys.argv) > 1 else "hayame-anticipation.wav")
