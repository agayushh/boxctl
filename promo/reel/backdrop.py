"""Background glow, dot grid, marquee type, and the viewfinder HUD."""


import math

from .core import CREAM, H, W, WHITE, e_in_cubic, e_out_cubic, prog, setc
from .glyphs import BOLD, MONO, blit, glyphs, text
from .sprites import glow


def draw_bg(ctx, th, t):
    setc(ctx, th["bg"])
    ctx.paint()
    acc = th["accent"]
    for bx, by, r, a, ph in ((0.22, 0.30, 820, 0.10, 0.0), (0.80, 0.72, 900, 0.08, 2.1), (0.55, 0.08, 620, 0.05, 4.2)):
        x = W * bx + math.sin(t * 0.35 + ph) * 160
        y = H * by + math.cos(t * 0.28 + ph) * 110
        glow(ctx, x, y, r, acc, a)
    sp = 54
    ox, oy = (t * 18) % sp, (t * 9) % sp
    setc(ctx, WHITE, 0.045)
    y = -sp + oy
    while y < H + sp:
        x = -sp + ox
        while x < W + sp:
            ctx.rectangle(x, y, 2, 2)
            x += sp
        y += sp
    ctx.fill()



def draw_marquee(ctx, t, th):
    vis = e_out_cubic(prog(t, 1.5, 2.2)) * (1 - e_in_cubic(prog(t, 3.7, 4.1)))
    if vis <= 0:
        return
    g = glyphs("BOXCTL  ", 360, condensed=True, outline=2)
    period = g.adv
    _, tp, _, bt = g.ink
    for yy, speed, dirn in ((300, 220, -1), (800, 180, 1)):
        off = (t * speed) % period
        x = -off if dirn < 0 else off - period
        base = yy - (tp + bt) / 2
        while x < W + period:
            blit(ctx, g, x, base, th["accent"], 0.09 * vis)
            x += period



def draw_hud(ctx, t):
    a = 0.55 * e_out_cubic(prog(t, 1.9, 2.4)) * (1 - prog(t, 11.9, 12.2))
    if a <= 0:
        return
    m, L = 44, 26
    setc(ctx, CREAM, a * 0.7)
    ctx.set_line_width(2)
    for cx, cy, sx, sy in ((m, m, 1, 1), (W - m, m, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)):
        ctx.move_to(cx, cy + sy * L)
        ctx.line_to(cx, cy)
        ctx.line_to(cx + sx * L, cy)
    ctx.stroke()
    kw = dict(family=MONO, weight=BOLD, spacing=4)
    text(ctx, "BOXCTL", m + 40, m + 12, 18, CREAM, a, ax=0, **kw)
    text(ctx, "V1.0.1", W - m - 40, m + 12, 18, CREAM, a, ax=1, **kw)
    text(ctx, "NPX BOXCTL", m + 40, H - m - 12, 18, CREAM, a, ax=0, **kw)
    text(ctx, "50 LEVELS  /  8 THEMES", W - m - 40, H - m - 12, 18, CREAM, a, ax=1, **kw)
