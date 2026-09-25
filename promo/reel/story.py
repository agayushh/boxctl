"""The level, its scripted solve, the theme montage, and the beat-synced impact cues."""


import math

from .core import e_io_cubic, lerp2, prog


def theme(name, bg, floor, wall, mortar, crate, done, goal, player, accent):
    return dict(name=name, bg=bg, floor=floor, wall=wall, mortar=mortar, crate=crate,
                done=done, goal=goal, player=player, accent=accent)



THEMES = [
    theme("WAREHOUSE", (12, 10, 8), (30, 26, 22), (200, 150, 90), (110, 78, 44), (255, 176, 0), (255, 122, 20), (255, 200, 60), (255, 238, 215), (255, 176, 0)),
    theme("DUNGEON", (7, 6, 8), (28, 26, 30), (112, 86, 68), (52, 40, 34), (190, 110, 30), (255, 210, 60), (230, 170, 40), (235, 225, 205), (255, 140, 40)),
    theme("NEON", (9, 3, 22), (22, 10, 44), (255, 40, 200), (80, 0, 110), (0, 240, 255), (190, 255, 40), (255, 250, 60), (255, 255, 255), (255, 40, 200)),
    theme("FOREST", (5, 14, 9), (16, 34, 22), (62, 132, 66), (22, 62, 30), (205, 145, 72), (160, 230, 100), (240, 225, 120), (236, 246, 226), (130, 225, 110)),
    theme("ICE", (5, 12, 26), (16, 36, 62), (160, 220, 255), (70, 130, 195), (235, 250, 255), (120, 235, 255), (40, 200, 255), (255, 255, 255), (100, 205, 255)),
    theme("RETRO", (0, 9, 2), (0, 24, 6), (0, 190, 70), (0, 90, 32), (180, 255, 130), (255, 255, 130), (120, 255, 40), (205, 255, 205), (0, 255, 110)),
    theme("MIDNIGHT", (7, 7, 22), (18, 18, 46), (92, 92, 188), (42, 42, 105), (185, 165, 255), (255, 205, 120), (255, 222, 100), (232, 232, 255), (150, 130, 255)),
    theme("SAKURA", (24, 8, 15), (46, 20, 32), (255, 165, 195), (170, 82, 115), (255, 224, 234), (255, 120, 172), (255, 92, 152), (255, 246, 250), (255, 135, 185)),
]

SWAPS = [7.25 + 0.25 * k for k in range(8)]

SEQ = [0, 1, 2, 3, 4, 5, 6, 7, 0]

WIPE = 0.16



def theme_state(t):
    if not 7.0 <= t < 9.5:
        return THEMES[0], None
    k = sum(1 for s in SWAPS if t >= s)
    if k > 0 and t < SWAPS[k - 1] + WIPE:
        return THEMES[SEQ[k]], (THEMES[SEQ[k - 1]], THEMES[SEQ[k]], prog(t, SWAPS[k - 1], SWAPS[k - 1] + WIPE))
    return THEMES[SEQ[k]], None



GW, GH, TS = 11, 7, 90

INTERIOR = {(2, 2), (2, 3), (8, 1), (8, 5), (9, 5)}

WALLS = {(x, y) for x in range(GW) for y in range(GH) if x in (0, GW - 1) or y in (0, GH - 1)} | INTERIOR

GOALS = [(7, 3), (6, 5), (5, 4)]

CRATES0 = [(5, 3), (6, 4), (5, 2)]

PLAYER0 = (4, 3)

MOVES = [("R", 4.12, 0.24), ("R", 4.50, 0.25), ("D", 4.95, 0.30), ("U", 5.42, 0.11), ("U", 5.53, 0.11),
         ("U", 5.64, 0.11), ("L", 5.76, 0.13), ("D", 5.94, 0.15), ("D", 6.10, 0.15)]

DIRS = {"R": (1, 0), "L": (-1, 0), "U": (0, -1), "D": (0, 1)}



def simulate():
    p, crates = PLAYER0, list(CRATES0)
    snaps = [(p, list(crates), None)]
    for d, _, _ in MOVES:
        dx, dy = DIRS[d]
        nxt = (p[0] + dx, p[1] + dy)
        assert nxt not in WALLS
        moved = None
        if nxt in crates:
            i = crates.index(nxt)
            dest = (nxt[0] + dx, nxt[1] + dy)
            assert dest not in WALLS and dest not in crates
            crates[i] = dest
            moved = i
        p = nxt
        snaps.append((p, list(crates), moved))
    assert all(c in GOALS for c in snaps[-1][1])
    return snaps



SNAPS = simulate()

LAND = {}



for _k, (_d, _t0, _du) in enumerate(MOVES):
    _mv = SNAPS[_k + 1][2]
    if _mv is not None and SNAPS[_k + 1][1][_mv] == SNAPS[-1][1][_mv]:
        LAND[_mv] = _t0 + _du



LAND_T = sorted(LAND.values())

FINAL_PLAYER, FINAL_CRATES, _ = SNAPS[-1]



def push_env(t):
    best = 0.0
    for k, (_, t0, du) in enumerate(MOVES):
        if SNAPS[k + 1][2] is None:
            continue
        if t0 - 0.06 <= t < t0:
            best = max(best, (t - t0 + 0.06) / 0.06)
        elif t0 <= t < t0 + du:
            best = 1.0
        elif t0 + du <= t < t0 + du + 0.14:
            best = max(best, 1 - (t - t0 - du) / 0.14)
    return best



def play_state(t):
    facing = 1
    for k, (d, t0, du) in enumerate(MOVES):
        if t < t0:
            p, c, _ = SNAPS[k]
            return dict(player=p, crates=list(c), facing=facing, phase=0.0, push=push_env(t), moving=None)
        if d in "LR":
            facing = 1 if d == "R" else -1
        if t < t0 + du:
            p = (t - t0) / du
            e = e_io_cubic(p)
            (p0, c0, _), (p1, c1, mv) = SNAPS[k], SNAPS[k + 1]
            crates = [lerp2(a, b, e) for a, b in zip(c0, c1)]
            moving = (mv, p, d, k) if mv is not None else None
            return dict(player=lerp2(p0, p1, e), crates=crates, facing=facing, phase=p * math.pi,
                        push=push_env(t), moving=moving)
    return dict(player=FINAL_PLAYER, crates=list(FINAL_CRATES), facing=facing, phase=0.0, push=push_env(t), moving=None)



IMPACTS = [(1.38, 0.5), (1.52, 0.9), (3.70, 0.35), (4.75, 0.75), (5.25, 0.75), (6.25, 0.8), (6.50, 1.1)] \
    + [(s, 0.28) for s in SWAPS] + [(9.5, 0.35), (12.25, 0.9), (13.5, 1.45)]

FLASHES = [(1.36, 0.9, 14.0), (6.5, 0.28, 10.0), (12.25, 0.45, 10.0), (13.5, 0.85, 6.5)]

BLUR_WINDOWS = [(1.10, 1.40), (3.70, 4.16), (6.93, 7.12)] + [(s - 0.01, s + WIPE + 0.01) for s in SWAPS] \
    + [(9.12, 10.2), (11.93, 12.3), (13.02, 13.56)]



def impact(t):
    return sum(a * math.exp(-(t - t0) * 9.0) for t0, a in IMPACTS if t >= t0)



def flash(t):
    return sum(a * math.exp(-(t - t0) * k) for t0, a, k in FLASHES if t >= t0)



def shake(t):
    a = impact(t) * 11.0
    return (a * (math.sin(t * 97.1) * 0.7 + math.sin(t * 151.3 + 1.3) * 0.3),
            a * (math.cos(t * 89.7) * 0.7 + math.sin(t * 131.9 + 0.4) * 0.3))
