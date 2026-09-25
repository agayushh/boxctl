"""Shot 5: board tiles morph into 50 level cards that flip to verified."""


import math

import cairo

from .core import (
    AMBER, CREAM, INK, MUTED, W, clamp, e_in_back, e_in_cubic, e_in_expo, e_io_cubic, e_io_expo, e_out_cubic,
    hsh, lerp, prog, rgba, rrect, setc, shade, smooth,
)
from .glyphs import BOLD, MONO, text
from .story import FINAL_CRATES, FINAL_PLAYER, GH, GOALS, GW, THEMES, TS, WALLS
from .sprites import burst, draw_crate, draw_floor, draw_goal, draw_pusher, draw_wall


CARD, GAP, CCOLS, CROWS = 112, 18, 10, 5

GX0 = (W - (CCOLS * CARD + (CCOLS - 1) * GAP)) / 2

GY0 = 262

_CELLS = [(x, y) for y in range(GH) for x in range(GW)]

CHOSEN = sorted(sorted(_CELLS, key=lambda c: hsh(c[0], c[1], 9))[:50], key=lambda c: (c[1], c[0]))

OTHERS = [c for c in _CELLS if c not in CHOSEN]

MORPH0 = [9.5 + (k / 49) * 0.32 + hsh(k, 5) * 0.06 for k in range(50)]

FLIP0 = [10.42 + ((k % CCOLS) + (k // CCOLS)) * 0.052 for k in range(50)]



def card_center(k):
    col, row = k % CCOLS, k // CCOLS
    return GX0 + col * (CARD + GAP) + CARD / 2, GY0 + row * (CARD + GAP) + CARD / 2



def make_mini(k):
    cols, rows = 8, 6
    walls = {(x, y) for x in range(cols) for y in range(rows)
             if x in (0, cols - 1) or y in (0, rows - 1) or hsh(k, x, y, 1) < 0.17}
    floors = sorted(((x, y) for x in range(1, cols - 1) for y in range(1, rows - 1) if (x, y) not in walls),
                    key=lambda c: hsh(k, c[0], c[1], 2))
    n = 2 + int(hsh(k, 3) * 2)
    return walls, floors[:n], floors[n:2 * n], floors[2 * n] if len(floors) > 2 * n else None



MINIS = [make_mini(k) for k in range(50)]



def draw_card_front(ctx, k, alpha, num_a):
    th = THEMES[0]
    setc(ctx, (26, 23, 20), alpha)
    rrect(ctx, -CARD / 2, -CARD / 2, CARD, CARD, 14)
    ctx.fill_preserve()
    setc(ctx, (78, 66, 54), alpha)
    ctx.set_line_width(2)
    ctx.stroke()
    walls, crates, goals, player = MINIS[k]
    m, ox, oy = 11, -44, -24
    for x in range(8):
        for y in range(6):
            wall = (x, y) in walls
            setc(ctx, shade(th["wall"], 0.82) if wall else (42, 37, 32), alpha)
            ctx.rectangle(ox + x * m + 0.5, oy + y * m + 0.5, m - 1, m - 1)
            ctx.fill()
    for gx, gy in goals:
        setc(ctx, th["goal"], alpha)
        ctx.new_sub_path()
        ctx.arc(ox + gx * m + m / 2, oy + gy * m + m / 2, 2.3, 0, 2 * math.pi)
        ctx.fill()
    for gx, gy in crates:
        setc(ctx, AMBER, alpha)
        ctx.rectangle(ox + gx * m + 2, oy + gy * m + 2, m - 4, m - 4)
        ctx.fill()
    if player:
        setc(ctx, CREAM, alpha)
        ctx.new_sub_path()
        ctx.arc(ox + player[0] * m + m / 2, oy + player[1] * m + m / 2, 3, 0, 2 * math.pi)
        ctx.fill()
    text(ctx, f"{k + 1:02d}", -44, -39, 17, MUTED, alpha * num_a, ax=0, family=MONO, weight=BOLD, spacing=1)



def draw_card_back(ctx, k, alpha, q):
    g = cairo.LinearGradient(0, -CARD / 2, 0, CARD / 2)
    g.add_color_stop_rgba(0, *rgba((255, 196, 50), alpha))
    g.add_color_stop_rgba(1, *rgba((255, 150, 0), alpha))
    ctx.set_source(g)
    rrect(ctx, -CARD / 2, -CARD / 2, CARD, CARD, 14)
    ctx.fill()
    pts = [(-25, 4), (-8, 21), (26, -18)]
    segs = [math.dist(pts[0], pts[1]), math.dist(pts[1], pts[2])]
    left = q * sum(segs)
    if left > 0:
        setc(ctx, INK, alpha)
        ctx.set_line_width(10)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.move_to(*pts[0])
        for (a, b), L in zip(zip(pts, pts[1:]), segs):
            u = clamp(left / L)
            ctx.line_to(lerp(a[0], b[0], u), lerp(a[1], b[1], u))
            left -= L
            if left <= 0:
                break
        ctx.stroke()
    text(ctx, f"{k + 1:02d}", -44, -39, 17, INK, alpha * 0.7, ax=0, family=MONO, weight=BOLD, spacing=1)



def draw_card(ctx, k, cx, cy, sc, rot, alpha, flip_p=0.0, check_q=0.0, num_a=1.0):
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    lift = 1 + 0.12 * math.sin(math.pi * flip_p)
    sxf = abs(math.cos(math.pi * flip_p))
    ctx.scale(sc * lift * max(sxf, 0.02), sc * lift)
    if flip_p < 0.5:
        draw_card_front(ctx, k, alpha, num_a)
    else:
        draw_card_back(ctx, k, alpha, check_q)
    if 0 < flip_p < 1:
        setc(ctx, (0, 0, 0), 0.45 * (1 - sxf) * alpha)
        rrect(ctx, -CARD / 2, -CARD / 2, CARD, CARD, 14)
        ctx.fill()
    ctx.restore()



def draw_cell_at(ctx, c, th, x, y, sc, rot, alpha=1.0):
    gx, gy = c
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(sc, sc)
    ctx.translate(-(gx * TS + TS / 2), -(gy * TS + TS / 2))
    if c in WALLS:
        draw_wall(ctx, gx, gy, th, alpha)
    else:
        draw_floor(ctx, gx, gy, th, alpha)
        if c in GOALS:
            draw_goal(ctx, gx * TS + TS / 2, gy * TS + TS / 2, th, 9.5, alpha=alpha)
        if c in FINAL_CRATES:
            draw_crate(ctx, gx * TS + TS / 2, gy * TS + TS / 2, TS, th, 1.0, alpha=alpha)
    ctx.restore()



def draw_cards(ctx, t, th):
    bx0, by0 = 960 - GW * TS / 2, 540 - GH * TS / 2
    for c in OTHERS:
        st = 9.5 + hsh(c[0], c[1], 4) * 0.12
        p = prog(t, st, st + 0.5)
        if p >= 1:
            continue
        e = e_in_cubic(p)
        sx_, sy_ = bx0 + c[0] * TS + TS / 2, by0 + c[1] * TS + TS / 2
        dx, dy = sx_ - 960, sy_ - 540
        n = math.hypot(dx, dy) or 1.0
        draw_cell_at(ctx, c, th, sx_ + dx / n * e * 1100, sy_ + dy / n * e * 1100, 1 - 0.4 * e,
                     e * 2.5 * (hsh(c[0], c[1], 8) - 0.5), 1 - e)

    pp = prog(t, 9.5, 9.66)
    if pp < 1:
        pcx, pcy = bx0 + FINAL_PLAYER[0] * TS + TS / 2, by0 + FINAL_PLAYER[1] * TS + TS / 2
        k = max(0.0, 1 - e_in_back(pp, 2.5))
        draw_pusher(ctx, pcx, pcy, th, facing=-1, sx=k, sy=k)
        burst(ctx, pcx, pcy, t, 9.62, 14, 91, [CREAM, AMBER], speed=(200, 600), size=(5, 11), grav=200)

    flipped = 0
    for k, c in enumerate(CHOSEN):
        dst = card_center(k)
        pm = prog(t, MORPH0[k], MORPH0[k] + 0.62)
        if pm <= 0:
            draw_cell_at(ctx, c, th, bx0 + c[0] * TS + TS / 2, by0 + c[1] * TS + TS / 2, 1.0, 0.0)
            continue
        if pm < 1:
            e = e_io_expo(pm)
            src = (bx0 + c[0] * TS + TS / 2, by0 + c[1] * TS + TS / 2)
            x = lerp(src[0], dst[0], e)
            y = lerp(src[1], dst[1], e) - math.sin(math.pi * e) * 70 * (0.3 + hsh(k, 2))
            rot = math.sin(math.pi * e) * (hsh(k, 7) - 0.5) * 1.3
            size = lerp(TS, CARD, e)
            fade = smooth(0.35, 0.62, e)
            if fade < 1:
                draw_cell_at(ctx, c, th, x, y, size / TS, rot)
            if fade > 0:
                draw_card(ctx, k, x, y, size / CARD, rot, fade, num_a=0.0)
            continue
        fp = prog(t, FLIP0[k], FLIP0[k] + 0.24)
        if t >= FLIP0[k] + 0.12:
            flipped += 1
        cq = e_out_cubic(prog(t, FLIP0[k] + 0.12, FLIP0[k] + 0.34))
        num_a = e_out_cubic(prog(t, MORPH0[k] + 0.62, MORPH0[k] + 0.85))
        col, row = k % CCOLS, k // CCOLS
        d = math.hypot(col - 4.5, row - 2) / math.hypot(4.5, 2)
        st = 11.95 + d * 0.09
        pi_ = prog(t, st, st + 0.2)
        if pi_ > 0:
            for gk in (2, 1):
                ge = e_in_expo(clamp(pi_ - 0.12 * gk))
                if ge > 0:
                    draw_card(ctx, k, lerp(dst[0], 960, ge), lerp(dst[1], 480, ge), lerp(1, 0.06, ge),
                              ge * (hsh(k, 11) - 0.5) * 7, 0.22 / gk, 1.0, 1.0)
            e = e_in_expo(pi_)
            if pi_ < 1:
                draw_card(ctx, k, lerp(dst[0], 960, e), lerp(dst[1], 480, e), lerp(1, 0.06, e),
                          e * (hsh(k, 11) - 0.5) * 7, 1 - smooth(0.8, 1.0, pi_), 1.0, 1.0)
            continue
        draw_card(ctx, k, dst[0], dst[1], 1.0, 0.0, 1.0, fp, cq, num_a)

    sp = prog(t, 11.38, 11.9)
    if 0 < sp < 1:
        ctx.save()
        for k in range(50):
            x, y = card_center(k)
            rrect(ctx, x - CARD / 2, y - CARD / 2, CARD, CARD, 14)
        ctx.clip()
        bx = lerp(-300, W + 300, e_io_cubic(sp))
        g = cairo.LinearGradient(bx + 216 - 170, 0, bx + 216 + 170, 0)
        g.set_matrix(cairo.Matrix(1, 0, 0.4, 1, 0, 0))
        g.add_color_stop_rgba(0, 1, 1, 1, 0)
        g.add_color_stop_rgba(0.5, 1, 1, 1, 0.42)
        g.add_color_stop_rgba(1, 1, 1, 1, 0)
        ctx.set_source(g)
        ctx.paint()
        ctx.restore()
    return flipped



def flipped_count(t):
    return sum(1 for k in range(50) if t >= FLIP0[k] + 0.12)
