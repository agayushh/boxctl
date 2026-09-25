"""Shots 6-7: three stars pop, fuse, and hit the boxctl lockup."""


import math

import cairo

from .core import (
    AMBER, CREAM, MUTED, W, WHITE, e_in_expo, e_io_cubic, e_out_back, e_out_cubic, e_out_expo, lerp, prog,
    rrect, setc, smooth,
)
from .glyphs import BOLD, MEDIUM, MONO, blit, char_x, glyphs, text
from .story import THEMES
from .sprites import burst, draw_crate, draw_star, glow, ring


STARS = [((960 - 240, 505), 92, 12.28), ((960, 458), 118, 12.36), ((960 + 240, 505), 92, 12.44)]

ICON, LOGO_SIZE = 196, 236



def logo_geom():
    g = glyphs("boxctl", LOGO_SIZE)
    _, tp, _, bt = g.ink
    gap = 46
    left = 960 - (ICON + gap + g.adv) / 2
    icon_c = (left + ICON / 2, 470.0)
    word_x = left + ICON + gap
    base = 470 - (tp + bt) / 2
    return g, icon_c, word_x, base, char_x("boxctl", LOGO_SIZE)



def draw_stars(ctx, t, icon_c):
    vis = e_out_cubic(prog(t, 12.25, 12.5))
    conv = e_in_expo(prog(t, 13.05, 13.48))
    if vis > 0:
        ctx.save()
        ctx.translate(960, 480)
        ctx.rotate(t * 0.35 + conv * 2.5)
        setc(ctx, AMBER, 0.07 * vis * (1 - conv))
        for i in range(18):
            a0 = i * 2 * math.pi / 18
            ctx.move_to(0, 0)
            ctx.arc(0, 0, 1500, a0, a0 + math.pi / 18)
            ctx.close_path()
        ctx.fill()
        ctx.restore()
        glow(ctx, 960, 480, 520, AMBER, 0.16 * vis * (1 - conv))
    burst(ctx, 960, 480, t, 12.25, 40, 77, [AMBER, CREAM, (255, 210, 80)], speed=(400, 1300), size=(8, 18), grav=500)
    ring(ctx, 960, 480, t, 12.25, 20, 760, 0.6, 14, AMBER)
    for i, ((fx, fy), r, tp) in enumerate(STARS):
        p = prog(t, tp, tp + 0.5)
        if p <= 0:
            continue
        sc = e_out_back(p, 2.2) * lerp(1, 0.18, conv)
        rot = lerp(-1.6, 0, e_out_cubic(p)) + 0.05 * math.sin(t * 3 + i) + conv * 5
        x = lerp(fx, icon_c[0], conv)
        y = lerp(fy, icon_c[1], conv) + math.sin(t * 2.2 + i) * 6 * (1 - conv)
        draw_star(ctx, x, y, r * sc, rot, 1 - smooth(0.9, 1.0, conv))
        burst(ctx, fx, fy, t, tp, 16, 100 + i, [AMBER, CREAM], speed=(200, 700), size=(5, 11), grav=300)
        ring(ctx, fx, fy, t, tp, r * 0.5, r * 2.4, 0.45, 8, CREAM, 0.7)



def draw_logo(ctx, t):
    zoom = lerp(1.0, 1.035, e_out_cubic(prog(t, 13.5, 15.0)))
    ctx.save()
    ctx.translate(960, 540)
    ctx.scale(zoom, zoom)
    ctx.translate(-960, -540)
    word, icon_c, word_x, base, xs = logo_geom()
    _, tp, _, bt = word.ink
    ix, iy = icon_c

    ring(ctx, ix, iy, t, 13.5, 40, 900, 0.8, 18, AMBER, 0.9)
    ring(ctx, ix, iy, t, 13.57, 30, 600, 0.7, 8, WHITE, 0.8)
    burst(ctx, ix, iy, t, 13.5, 54, 131, [AMBER, CREAM, WHITE, (255, 130, 20)], speed=(500, 1600), size=(8, 20), grav=600, life=(0.6, 1.1))

    p = prog(t, 13.5, 13.95)
    glow(ctx, ix, iy, 300, AMBER, 0.28 * e_out_cubic(p))
    sc = max(0.0, e_out_back(p, 2.6))
    draw_crate(ctx, ix, iy, ICON / 0.84, THEMES[0], 0.0, sx=sc, sy=sc, rot=lerp(-0.7, 0, e_out_expo(p)))

    ctx.save()
    ctx.rectangle(0, 0, W, base + bt + 6)
    ctx.clip()
    for i, ch in enumerate("boxctl"):
        lt = 13.58 + i * 0.045
        lp = prog(t, lt, lt + 0.5)
        if lp <= 0:
            continue
        dy = (1 - e_out_back(lp, 1.3)) * (bt - tp) * 1.25
        blit(ctx, glyphs(ch, LOGO_SIZE), word_x + xs[i], base + dy, CREAM if i < 3 else AMBER)
    ctx.restore()

    sp = prog(t, 14.3, 14.75)
    if 0 < sp < 1:
        bx = lerp(word_x - 300, word_x + word.adv + 300, e_io_cubic(sp))
        g = cairo.LinearGradient(bx + 188 - 110, 0, bx + 188 + 110, 0)
        g.set_matrix(cairo.Matrix(1, 0, 0.4, 1, 0, 0))
        g.add_color_stop_rgba(0, 1, 1, 1, 0)
        g.add_color_stop_rgba(0.5, 1, 1, 1, 0.7)
        g.add_color_stop_rgba(1, 1, 1, 1, 0)
        for i, ch in enumerate("boxctl"):
            blit(ctx, glyphs(ch, LOGO_SIZE), word_x + xs[i], base, source=g)

    a = e_out_cubic(prog(t, 13.9, 14.25))
    text(ctx, "crate-pushing puzzles for your terminal", 960, 614 + (1 - a) * 18, 40, (214, 198, 176), a, weight=MEDIUM)

    pa = e_out_expo(prog(t, 14.0, 14.3))
    if pa > 0:
        cmd = "$ npm i -g boxctl"
        full_g = glyphs(cmd, 40, MONO, BOLD)
        cxs = char_x(cmd, 40, MONO, BOLD)
        _, ctp, _, cbt = full_g.ink
        ph = 84
        pw = lerp(ph, full_g.adv + 104, pa)
        pcx, pcy = 960, 726
        setc(ctx, (20, 17, 14), 0.94 * pa)
        rrect(ctx, pcx - pw / 2, pcy - ph / 2, pw, ph, ph / 2)
        ctx.fill_preserve()
        setc(ctx, AMBER, 0.9 * pa)
        ctx.set_line_width(2.5)
        ctx.stroke()
        ctx.save()
        rrect(ctx, pcx - pw / 2, pcy - ph / 2, pw, ph, ph / 2)
        ctx.clip()
        x0 = pcx - full_g.adv / 2
        cbase = pcy - (ctp + cbt) / 2
        typed = 0
        for i, ch in enumerate(cmd):
            if t < 14.12 + i * 0.022:
                break
            typed = i + 1
            if ch != " ":
                blit(ctx, glyphs(ch, 40, MONO, BOLD), x0 + cxs[i], cbase, AMBER if ch == "$" else CREAM)
        cxp = x0 + cxs[typed]
        if t < 14.55 or (t * 2.4) % 1 < 0.55:
            setc(ctx, AMBER, 0.95)
            ctx.rectangle(cxp + 6, pcy - 20, 20, 40)
            ctx.fill()
        ctx.restore()

    ga = e_out_cubic(prog(t, 14.5, 14.8))
    text(ctx, "github.com/agayushh/boxctl", 960, 830, 27, MUTED, ga, family=MONO, weight=BOLD, spacing=1)
    ctx.restore()
