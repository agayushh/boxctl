"""Shot 1: `$ npx boxctl` types in, then collapses into a CRT line."""


import cairo

from .core import (
    AMBER, CREAM, NIGHT, W, WHITE, clamp, e_in_expo, e_out_back, e_out_cubic, lerp, mix, prog, rgba, setc,
    smooth,
)
from .glyphs import BOLD, MONO, blit, char_x, glyphs
from .sprites import glow


INTRO = "$ npx boxctl"

CHAR_T = [0.06, 0.06] + [0.30 + i * 0.075 for i in range(len(INTRO) - 2)]



def draw_intro(ctx, t):
    setc(ctx, NIGHT)
    ctx.paint()
    glow(ctx, 960, 540, 760, AMBER, 0.07 * e_out_cubic(prog(t, 0.0, 0.8)))
    size = 78
    full_g = glyphs(INTRO, size, MONO, BOLD)
    xs = char_x(INTRO, size, MONO, BOLD)
    _, tp, _, bt = full_g.ink
    x0 = 960 - full_g.adv / 2
    base_y = 540 - (tp + bt) / 2
    c = e_in_expo(prog(t, 1.12, 1.34))
    white = smooth(1.06, 1.12, t)
    ctx.save()
    ctx.translate(960, 540)
    ctx.scale(lerp(1.0, 2600 / full_g.adv, c), lerp(1.0, 0.03, c))
    ctx.translate(-960, -540)
    typed = 0
    for i, ch in enumerate(INTRO):
        if t < CHAR_T[i]:
            break
        typed = i + 1
        if ch == " ":
            continue
        p = prog(t, CHAR_T[i], CHAR_T[i] + 0.16)
        sc = lerp(1.6, 1.0, e_out_back(p, 2.0))
        tint = AMBER if ch == "$" else mix(AMBER, CREAM, e_out_cubic(p))
        px, cw = x0 + xs[i], xs[i + 1] - xs[i]
        ctx.save()
        ctx.translate(px + cw / 2, 540)
        ctx.scale(sc, sc)
        ctx.translate(-(px + cw / 2), -540)
        blit(ctx, glyphs(ch, size, MONO, BOLD), px, base_y, mix(tint, WHITE, white), clamp(p * 5))
        ctx.restore()
    cursor_x = x0 + xs[typed]
    typing = 0.30 <= t <= CHAR_T[-1] + 0.1
    if typing or (t * 2.4) % 1 < 0.55:
        setc(ctx, mix(AMBER, WHITE, white), 0.95)
        ctx.rectangle(cursor_x + 6, 540 - size * 0.40, size * 0.52, size * 0.80)
        ctx.fill()
    ctx.restore()
    if t >= 1.26:
        lp = prog(t, 1.26, 1.36)
        g = cairo.LinearGradient(0, 460, 0, 620)
        g.add_color_stop_rgba(0, *rgba(AMBER, 0))
        g.add_color_stop_rgba(0.5, *rgba(AMBER, 0.55 * lp))
        g.add_color_stop_rgba(1, *rgba(AMBER, 0))
        ctx.set_source(g)
        ctx.rectangle(0, 460, W, 160)
        ctx.fill()
        h = lerp(2, 6, lp)
        setc(ctx, WHITE, lp)
        ctx.rectangle(0, 540 - h / 2, W, h)
        ctx.fill()
