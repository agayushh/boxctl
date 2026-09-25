"""Shots 2-4: the board assembles, the pusher solves it, the themes wipe across."""


import math

from .core import (
    WHITE, clamp, e_in_cubic, e_io_cubic, e_io_expo, e_out_back, e_out_cubic, e_out_expo, hsh, lerp, lerp2,
    prog, rrect, setc, shade,
)
from .story import CRATES0, FINAL_CRATES, GH, GOALS, GW, LAND, MOVES, PLAYER0, SNAPS, TS, WALLS, play_state
from .sprites import burst, draw_crate, draw_floor, draw_goal, draw_pusher, draw_wall, ring


def board_cam(t):
    if t < 3.72:
        p = e_out_cubic(prog(t, 1.36, 3.7))
        cx, cy, s, rot = 960, 560, lerp(1.24, 1.0, p), lerp(0.06, 0.0, e_out_cubic(prog(t, 1.36, 3.3)))
    elif t < 9.15:
        p = e_io_expo(prog(t, 3.72, 4.12))
        cx, cy, s, rot = lerp(960, 1190, p), lerp(560, 545, p), lerp(1.0, 0.9, p), 0.0
        s *= lerp(1.0, 0.96, e_io_cubic(prog(t, 7.0, 9.1)))
    else:
        p = e_io_expo(prog(t, 9.15, 9.5))
        cx, cy, s, rot = lerp(1190, 960, p), lerp(545, 540, p), lerp(0.864, 1.0, p), 0.0
    return cx, cy, s * (1 + 0.004 * math.sin(t * 1.7)), rot



def tile_t0(gx, gy):
    d = math.hypot(gx - (GW - 1) / 2, gy - (GH - 1) / 2) / math.hypot((GW - 1) / 2, (GH - 1) / 2)
    return 1.45 + d * 0.62 + hsh(gx, gy) * 0.16



def wall_pose(gx, gy, t):
    p = prog(t, tile_t0(gx, gy), tile_t0(gx, gy) + 0.62)
    e, ec = e_out_back(p, 1.25), e_out_cubic(p)
    return p, (1 - e) * -560, (1 - ec) * (hsh(gx, gy, 3) - 0.5) * 1.8, lerp(1.4, 1.0, ec), clamp(p * 3.5)



def draw_posed(ctx, gx, gy, dy, rot, sc, fn):
    cx, cy = gx * TS + TS / 2, gy * TS + TS / 2
    ctx.save()
    ctx.translate(cx, cy + dy)
    ctx.rotate(rot)
    ctx.scale(sc, sc)
    ctx.translate(-cx, -cy)
    fn()
    ctx.restore()



def cell_center(c):
    return c[0] * TS + TS / 2, c[1] * TS + TS / 2



def draw_board_scene(ctx, t, th):
    cx, cy, s, rot = board_cam(t)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.scale(s, s)
    ctx.translate(-GW * TS / 2, -GH * TS / 2)
    asm = t < 3.95

    pa = e_out_expo(prog(t, 1.5, 2.3))
    if pa > 0:
        setc(ctx, (0, 0, 0), 0.5 * pa)
        rrect(ctx, -24, -14, GW * TS + 48, GH * TS + 48, 22)
        ctx.fill()

    for gy in range(GH):
        for gx in range(GW):
            if (gx, gy) in WALLS:
                continue
            if not asm:
                draw_floor(ctx, gx, gy, th)
                continue
            t0 = tile_t0(gx, gy)
            p = prog(t, t0 - 0.12, t0 + 0.38)
            if p <= 0:
                continue
            e = e_out_expo(p)
            draw_posed(ctx, gx, gy, 0, 0, lerp(0.15, 1.0, e), lambda gx=gx, gy=gy, e=e: draw_floor(ctx, gx, gy, th, e))

    for gy in range(GH):
        for gx in range(GW):
            if (gx, gy) not in WALLS:
                continue
            if not asm:
                draw_wall(ctx, gx, gy, th)
                continue
            p, dy, r, sc, a = wall_pose(gx, gy, t)
            if p <= 0:
                continue
            if p < 0.55:
                _, gdy, gr, gsc, ga = wall_pose(gx, gy, t - 0.04)
                draw_posed(ctx, gx, gy, gdy, gr, gsc, lambda gx=gx, gy=gy, ga=ga: draw_wall(ctx, gx, gy, th, ga * 0.28))
            draw_posed(ctx, gx, gy, dy, r, sc, lambda gx=gx, gy=gy, a=a: draw_wall(ctx, gx, gy, th, a))

    for i, g in enumerate(GOALS):
        gcx, gcy = cell_center(g)
        g0 = 2.55 + 0.1 * i
        p = prog(t, g0, g0 + 0.45)
        if p <= 0:
            continue
        draw_goal(ctx, gcx, gcy, th, t, scale=max(0.0, e_out_back(p, 2.4)))
        ring(ctx, gcx, gcy, t, g0, 10, 70, 0.45, 5, th["goal"], 0.8)

    st = play_state(t) if t >= 4.0 else None
    for i in range(len(CRATES0)):
        if st is None:
            c0 = 2.78 + i * 0.12
            fall = prog(t, c0, c0 + 0.3)
            if fall <= 0:
                continue
            ccx, ccy = cell_center(CRATES0[i])
            sign = 1 if i % 2 else -1
            for gk in (3, 2, 1):
                gf = prog(t - 0.025 * gk, c0, c0 + 0.3)
                if 0 < gf < 1:
                    draw_crate(ctx, ccx, ccy + lerp(-460, 0, e_in_cubic(gf)), TS, th, rot=(1 - gf) * 2.4 * sign, alpha=0.16)
            q = prog(t, c0 + 0.3, c0 + 0.65)
            amt = math.sin(q * math.pi * 2.5) * (1 - q) * 0.22 if q > 0 else 0.0
            draw_crate(ctx, ccx, ccy + lerp(-460, 0, e_in_cubic(fall)), TS, th, rot=(1 - fall) * 2.4 * sign,
                       sx=1 + amt, sy=1 - amt)
            burst(ctx, ccx, ccy + TS * 0.4, t, c0 + 0.3, 10, 30 + i, [shade(th["wall"], 0.9), th["floor"]],
                  speed=(120, 320), life=(0.25, 0.45), size=(4, 9), grav=300)
            continue
        ccx, ccy = cell_center(st["crates"][i])
        done = e_out_cubic(prog(t, LAND[i], LAND[i] + 0.15)) if t >= 4.0 else 0.0
        sx = sy = 1.0
        mv = st["moving"]
        if mv and mv[0] == i:
            _, mp, d, mk = mv
            stretch = 0.12 * math.sin(math.pi * mp)
            if d in "LR":
                sx, sy = 1 + stretch, 1 - stretch * 0.7
            else:
                sx, sy = 1 - stretch * 0.7, 1 + stretch
            m0 = MOVES[mk][1]
            for gk in (3, 2, 1):
                ge = e_io_cubic(clamp((t - 0.022 * gk - m0) / MOVES[mk][2]))
                gp = lerp2(SNAPS[mk][1][i], SNAPS[mk + 1][1][i], ge)
                gcx, gcy = cell_center(gp)
                draw_crate(ctx, gcx, gcy, TS, th, done, alpha=0.13 * (4 - gk) / 3)
        lt = LAND[i]
        q = prog(t, lt, lt + 0.4)
        if 0 < q < 1:
            amt = math.sin(q * math.pi * 2.2) * (1 - q) * 0.16
            sx, sy = sx * (1 + amt), sy * (1 - amt)
        draw_crate(ctx, ccx, ccy, TS, th, done, sx=sx, sy=sy)
        if t >= lt:
            gcx, gcy = cell_center(FINAL_CRATES[i])
            ring(ctx, gcx, gcy, t, lt, 30, 190, 0.55, 12, th["goal"], 0.9)
            ring(ctx, gcx, gcy, t, lt + 0.07, 20, 130, 0.5, 6, WHITE, 0.7)
            burst(ctx, gcx, gcy, t, lt, 22, 50 + i, [th["goal"], th["crate"], WHITE], speed=(300, 900), size=(6, 15))

    # the pusher
    if st is None:
        fall = prog(t, 3.42, 3.70)
        if fall > 0:
            pcx, pcy = cell_center(PLAYER0)
            q = prog(t, 3.70, 4.05)
            amt = math.sin(q * math.pi * 2.2) * (1 - q) * 0.3 if q > 0 else 0.0
            draw_pusher(ctx, pcx, pcy + lerp(-520, 0, e_in_cubic(fall)), th, sx=1 + amt * 0.7, sy=1 - amt)
            burst(ctx, pcx, pcy + TS * 0.36, t, 3.70, 12, 71, [shade(th["floor"], 2.2), th["wall"]],
                  speed=(120, 360), life=(0.25, 0.5), size=(4, 9), grav=200)
    else:
        pcx, pcy = cell_center(st["player"])
        bob = -abs(math.sin(st["phase"])) * TS * 0.06
        hop = -math.sin(math.pi * prog(t, 6.5, 6.82)) * TS * 0.42
        q = prog(t, 6.82, 7.1)
        amt = math.sin(q * math.pi * 2) * (1 - q) * 0.22 if q > 0 else 0.0
        breath = 0.015 * math.sin(t * 4.0)
        if t < 9.5:
            draw_pusher(ctx, pcx, pcy + bob + hop, th, facing=st["facing"], phase=st["phase"], push=st["push"],
                        sx=1 + amt * 0.7, sy=1 - amt + breath)
    ctx.restore()
