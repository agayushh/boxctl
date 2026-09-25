#!/usr/bin/env python3
"""Synthesize the 120 BPM soundtrack for the boxctl promo (15 s, 48 kHz stereo)."""
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 15.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(20260925)

BUS = {name: np.zeros((2, N)) for name in ("drums", "music", "sfx", "rev")}


def tt(d):
    return np.arange(int(SR * d)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def noise(d):
    return rng.standard_normal(int(SR * d))


def place(sig, start, gain=1.0, pan=0.0, bus="sfx", rev=0.0):
    i = int(round(start * SR))
    if i >= N:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), N - i)
    gl = gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    gr = gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    BUS[bus][0, i:i + n] += sig[:n] * gl
    BUS[bus][1, i:i + n] += sig[:n] * gr
    if rev:
        BUS["rev"][0, i:i + n] += sig[:n] * gl * rev
        BUS["rev"][1, i:i + n] += sig[:n] * gr * rev


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- instruments

def kick(punch=1.0, dur=0.5):
    t = tt(dur)
    f = 44 + 150 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(noise(dur), 2500) * np.exp(-t * 220) * 0.35
    return np.tanh((body + click) * 1.6 * punch) * 0.9


def clap():
    t = tt(0.45)
    env = np.zeros_like(t)
    for d in (0.0, 0.011, 0.023):
        env += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 90)
    env += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) * 15) * 0.8
    return bp(noise(0.45), 900, 2600) * env * 0.7


def hat(open_=False):
    d = 0.28 if open_ else 0.06
    t = tt(d)
    return hp(noise(d), 7000) * np.exp(-t * (13 if open_ else 70)) * 0.55


def bass(f, dur=0.24, decay=7.0):
    t = tt(dur)
    saw = 2 * ((t * f) % 1) - 1
    sub = np.sin(2 * np.pi * f * t)
    env = np.minimum(1, t / 0.004) * np.exp(-t * decay)
    return lp(saw * 0.55 + sub * 0.95, 420) * env


def pad(freqs, dur, cutoff=1600, attack=0.1, release=0.4):
    t = tt(dur + release)
    sig = np.zeros_like(t)
    for f in freqs:
        for det in (-0.006, 0.0, 0.007):
            sig += 2 * (((t * f * (1 + det)) + rng.random()) % 1) - 1
    sig /= len(freqs) * 3
    env = np.minimum(1, t / attack) * np.where(t > dur, np.exp(-(t - dur) / release * 3), 1.0)
    return lp(sig, cutoff) * env


def pluck(f, dur=0.22):
    t = tt(dur)
    s = 2 * ((t * f) % 1) - 1 + 0.45 * np.sign(np.sin(2 * np.pi * f * 2 * t))
    return lp(s, 3400) * np.exp(-t * 20) * np.minimum(1, t / 0.002)


def bell(f, dur=1.4):
    t = tt(dur)
    out = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1.0, 3.0), (2.76, 0.5, 5.0), (5.4, 0.25, 8.0), (8.93, 0.12, 12.0)):
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return out * np.minimum(1, t / 0.002) * 0.5


def blip(f, dur=0.14):
    t = tt(dur)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 28) * np.minimum(1, t / 0.002)


def tick(f=2600, dur=0.035):
    t = tt(dur)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 140) + hp(noise(dur), 3000) * np.exp(-t * 400) * 0.3


def click(pitch=1.0):
    t = tt(0.035)
    n = hp(noise(0.035), 1800) * np.exp(-t * 380)
    tone = np.sin(2 * np.pi * 1900 * pitch * t) * np.exp(-t * 260) * 0.4
    return n * 0.6 + tone


def thump(f=70, dur=0.35, decay=10):
    t = tt(dur)
    ph = 2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-t * 40))) / SR
    return np.sin(ph) * np.exp(-t * decay) + lp(noise(dur), 500) * np.exp(-t * 30) * 0.5


def crash(dur=2.0, decay=2.2):
    t = tt(dur)
    return hp(noise(dur), 3500) * np.exp(-t * decay) * np.minimum(1, t / 0.003)


def boom(dur=2.5):
    t = tt(dur)
    f = 36 + 40 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)


def stab(freqs, dur=1.2, cutoff=2600):
    t = tt(dur)
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.008, 0.0, 0.009):
            s += 2 * ((t * f * (1 + det)) % 1) - 1
    s /= len(freqs) * 3
    return lp(s, cutoff) * np.exp(-t * 3.2) * np.minimum(1, t / 0.003)


def sweep(dur, f0, f1, width=0.7, shape="rise"):
    n = int(SR * dur)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    zi = None
    chunk = 256
    for s in range(0, n, chunk):
        fc = f0 * (f1 / f0) ** (s / n)
        lo = max(40.0, fc * (1 - width / 2))
        hi = min(SR / 2 - 200, fc * (1 + width / 2))
        sos = butter(2, [lo, hi], "band", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[s:s + chunk], zi = sosfilt(sos, x[s:s + chunk], zi=zi)
    u = np.arange(n) / n
    env = u ** 2 if shape == "rise" else np.sin(np.pi * u) ** 1.5
    return out * env


def tone_sweep(dur, f0, f1):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 2


# ---------------------------------------------------------------- score

CHORDS = [("Am", 1.5), ("F", 3.5), ("C", 5.5), ("G", 7.5), ("Am", 9.5), ("F", 11.5)]
NOTES = {"Am": [57, 60, 64, 69], "F": [53, 57, 60, 65], "C": [55, 60, 64, 67], "G": [55, 59, 62, 67]}
ROOT = {"Am": 33, "F": 29, "C": 36, "G": 31}


def chord_at(t):
    name = "Am"
    for c, s in CHORDS:
        if t >= s:
            name = c
    return name


def score():
    # intro swell and pads
    place(pad([mtof(m) for m in NOTES["Am"]], 1.5, cutoff=900, attack=1.1, release=0.3), 0.0, 0.5, bus="music", rev=0.5)
    for name, start in CHORDS:
        place(pad([mtof(m) for m in NOTES[name]], 2.0, cutoff=1700, attack=0.06, release=0.35), start, 0.32, bus="music", rev=0.35)

    kicks = list(np.arange(1.5, 12.51, 0.5))
    for k in kicks:
        place(kick(), k, 0.95, bus="drums")
    for c in np.arange(2.0, 12.01, 1.0):
        place(clap(), c, 0.5, bus="drums", rev=0.3)
    for i, h in enumerate(np.arange(1.75, 12.26, 0.5)):
        place(hat(True), h, 0.22, pan=0.2, bus="drums")
    for i, h in enumerate(np.arange(4.0, 12.45, 0.125)):
        if abs((h * 4) % 2) > 1e-6:
            place(hat(False), h, 0.11, pan=-0.3 if i % 2 else 0.3, bus="drums")
    for b in np.arange(1.75, 12.26, 0.5):
        place(bass(mtof(ROOT[chord_at(b)])), b, 0.6, bus="music")

    # arp during the theme montage
    pattern = [0, 1, 2, 3, 2, 1, 3, 2]
    for i, a in enumerate(np.arange(7.0, 9.5, 0.125)):
        notes = NOTES[chord_at(a)]
        place(pluck(mtof(notes[pattern[i % len(pattern)]] + 12)), a, 0.2, pan=0.35 if i % 2 else -0.35, bus="music", rev=0.35)

    # build: snare roll + riser
    t, gap = 12.75, 0.125
    while t < 13.45:
        g = 0.12 + 0.35 * (t - 12.75) / 0.7
        place(clap(), t, g, bus="drums", rev=0.2)
        t += gap
        gap = max(0.03, gap * 0.8)
    place(sweep(1.0, 300, 9000, 0.9, "rise"), 12.5, 0.55, bus="sfx", rev=0.2)
    place(tone_sweep(1.0, 160, 900), 12.5, 0.12, bus="sfx")

    # final hit and tail
    place(kick(1.4, 0.7), 13.5, 1.1, bus="drums")
    place(boom(), 13.5, 0.9, bus="sfx")
    place(crash(1.5, 2.0), 13.5, 0.35, bus="sfx", rev=0.4)
    place(stab([mtof(m) for m in [45, 57, 60, 64, 69]], 1.5), 13.5, 0.55, bus="sfx", rev=0.5)
    place(pad([mtof(m) for m in NOTES["Am"] + [76]], 1.1, cutoff=2000, attack=0.02, release=0.9), 13.5, 0.3, bus="sfx", rev=0.5)
    place(bass(mtof(33), 1.3, 2.4), 13.5, 0.6, bus="sfx")


def sfx():
    # typing
    times = [0.30 + i * 0.075 for i in range(10)]
    for i, c in enumerate(times):
        if i == 3:
            continue
        place(click(0.9 + 0.2 * rng.random()), c, 0.4, pan=rng.uniform(-0.15, 0.15))
    place(click(0.6), 1.08, 0.7)
    place(thump(90, 0.2, 18), 1.08, 0.25)
    place(sweep(0.45, 500, 7000, 0.8, "rise"), 1.02, 0.45, rev=0.2)
    place(blip(1760, 0.2), 1.34, 0.12, rev=0.3)
    # drop
    place(boom(1.6), 1.5, 0.7)
    place(crash(1.6, 2.6), 1.5, 0.25, rev=0.3)

    # tiles landing
    for i in range(60):
        at = 1.72 + rng.random() * 1.05
        place(lp(noise(0.05), 900) * np.exp(-tt(0.05) * 60), at, 0.09, pan=rng.uniform(-0.8, 0.8))
    for i in range(3):
        place(blip([1318.5, 1568.0, 1975.5][i]), 2.55 + 0.1 * i, 0.12, pan=-0.3 + 0.3 * i, rev=0.4)
        place(thump(80, 0.3, 12), 3.08 + 0.12 * i, 0.3)
    place(thump(110, 0.3, 14), 3.70, 0.3)
    place(tone_sweep(0.12, 300, 700), 3.70, 0.08)
    place(sweep(0.5, 300, 3000, 0.9, "pass"), 3.62, 0.35)

    # pushes and landings
    moves = [(4.12, 0.24, True), (4.50, 0.25, True), (4.95, 0.30, True), (5.42, 0.11, False), (5.53, 0.11, False),
             (5.64, 0.11, False), (5.76, 0.13, False), (5.94, 0.15, True), (6.10, 0.15, True)]
    for start, dur, push in moves:
        place(tick(900, 0.03), start, 0.08)
        if push:
            s = bp(noise(dur), 250, 1200) * np.sin(np.pi * np.linspace(0, 1, int(SR * dur)))
            place(s, start, 0.22)
    for i, at in enumerate((4.75, 5.25, 6.25)):
        place(thump(62, 0.45, 8), at, 0.55)
        notes = NOTES[chord_at(at)]
        for j, m in enumerate(notes[:3]):
            place(bell(mtof(m + 24), 1.0), at + 0.01 * j, 0.1, pan=-0.3 + 0.3 * j, rev=0.4)
    # SOLVED
    place(boom(1.8), 6.5, 0.7)
    place(crash(1.6, 2.4), 6.5, 0.3, rev=0.4)
    place(stab([mtof(m) for m in [48, 60, 64, 67, 72]], 0.9), 6.5, 0.4, rev=0.5)
    place(sweep(0.55, 400, 5000, 0.9, "pass"), 6.9, 0.35)

    # theme swaps
    swap_notes = [72, 74, 76, 79, 81, 84, 86, 88]
    for k in range(8):
        at = 7.25 + 0.25 * k
        place(blip(mtof(swap_notes[k])), at, 0.14, pan=-0.5 + k / 7, rev=0.3)
        place(sweep(0.16, 2000, 9000, 0.6, "pass"), at, 0.18, pan=-0.6 + 1.2 * k / 7)
    place(sweep(0.4, 600, 4000, 0.8, "pass"), 9.12, 0.3)

    # morph + flips
    place(sweep(0.7, 300, 6000, 0.9, "pass"), 9.45, 0.4, rev=0.3)
    for k in range(50):
        land = 9.5 + (k / 49) * 0.32 + 0.62
        place(tick(3200, 0.02), land, 0.05, pan=-0.7 + 1.4 * (k % 10) / 9)
    for k in range(50):
        col, row = k % 10, k // 10
        at = 10.42 + (col + row) * 0.052 + 0.12
        place(tick(1200 + 1800 * (col + row) / 13, 0.03), at, 0.07, pan=-0.7 + 1.4 * col / 9)
    for j, m in enumerate(NOTES["Am"]):
        place(bell(mtof(m + 12), 1.3), 11.39 + 0.03 * j, 0.1, pan=-0.4 + 0.25 * j, rev=0.5)
    place(sweep(0.5, 3000, 12000, 0.5, "pass"), 11.4, 0.12)

    # implode + stars
    place(sweep(0.32, 400, 7000, 0.9, "rise"), 11.95, 0.45)
    place(boom(1.2), 12.25, 0.55)
    place(crash(1.2, 3.0), 12.25, 0.22, rev=0.3)
    for i, m in enumerate((81, 84, 89)):
        place(bell(mtof(m), 1.3), 12.30 + 0.08 * i, 0.22, pan=-0.4 + 0.4 * i, rev=0.5)

    # logo details
    for i in range(6):
        place(tick(1800 + 200 * i, 0.03), 13.58 + i * 0.045, 0.06, pan=-0.3 + 0.12 * i)
    for i in range(17):
        place(click(1.1 + 0.1 * rng.random()), 14.12 + i * 0.022, 0.12, pan=rng.uniform(-0.1, 0.1))
    place(sweep(0.45, 4000, 12000, 0.5, "pass"), 14.3, 0.1, rev=0.4)


def mixdown():
    score()
    sfx()

    # sidechain the music bus against the kick
    duck = np.ones(N)
    seg_t = tt(0.4)
    seg = 1 - 0.6 * np.exp(-seg_t / 0.11)
    for k in np.arange(1.5, 12.51, 0.5):
        i = int(k * SR)
        n = min(len(seg), N - i)
        duck[i:i + n] = np.minimum(duck[i:i + n], seg[:n])
    music = BUS["music"] * duck

    def ir(seed):
        r = np.random.default_rng(seed)
        t = tt(1.8)
        x = r.standard_normal(len(t)) * 10 ** (-3 * t / 1.6)
        x = lp(x, 6500)
        return x / np.sqrt(np.sum(x ** 2))

    rev = np.stack([
        fftconvolve(BUS["rev"][0] + 0.25 * music[0], ir(1))[:N],
        fftconvolve(BUS["rev"][1] + 0.25 * music[1], ir(2))[:N],
    ])
    master = BUS["drums"] + music + BUS["sfx"] + rev * 0.45
    master = hp(master, 25)
    master /= np.max(np.abs(master)) * 1.02
    master = np.tanh(1.6 * master) / np.tanh(1.6)
    fade_in = np.minimum(1, np.arange(N) / (0.005 * SR))
    fade_out = np.clip((DUR - np.arange(N) / SR) / 0.35, 0, 1)
    master *= fade_in * fade_out
    master *= 0.93 / np.max(np.abs(master))
    out = os.path.join(HERE, "promo.wav")
    wavfile.write(out, SR, (master.T * 32767).astype(np.int16))
    print("wrote", out)


if __name__ == "__main__":
    mixdown()
